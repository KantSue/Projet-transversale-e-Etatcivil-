from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.dashboard_app.serializers import (
    JournalSerializer, DemandeReadSerializer, DemandeCreateSerializer
)
from apps.dashboard_app.models import Demande,PieceJoint,Acte, ActePersonne,TypeActe
from apps.dashboard_app.services.demande_service import construire_file_priorite, traiter_demande
from apps.accounts_app.services import verify_jwt
from apps.dashboard_app.models import Demande,Paiement


class DemandeActeViews(APIView):

    def post(self, request):
        """Créer une demande — naissance, mariage ou décès."""
        serializer = DemandeCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Demande créée"}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request, id_demande=None):
#getOne
        if id_demande is not None:
            try:
                demande = Demande.objects.prefetch_related(
                    'demandepersonne__personne'
                ).get(id_demande=id_demande)
                print("PERSONNES:", list(demande.demandepersonne.all()))

            except Demande.DoesNotExist:
                return Response({"message": "Demande introuvable"}, status=404)
            serializer = DemandeReadSerializer(demande)
            
            pieces = PieceJoint.objects.filter(id_demande=demande)
            photo_cin = None
            if pieces.exists():
                photo_cin = pieces.first().url_fichier

            serializer = DemandeReadSerializer(demande)
            data = dict(serializer.data)  
            data['photo_cin'] = f"http://10.210.105.55:8000/media/{photo_cin}" if photo_cin else None

            return Response(data, status=200)

        token = (
            request.COOKIES.get('token') or
            request.headers.get('Authorization', '').replace('Bearer ', '')
        )
        payload = verify_jwt(token) if token else None

        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        id_commune = payload.get('id_commune')
        id_aro     = payload.get('id_arondissement')

        # GET ALL 
        if id_commune == 1 and id_aro:
            demandes = list(
                Demande.objects.prefetch_related('demandepersonne__personne')
                .filter(statut_demande='en attente', id_arrondissement=id_aro)
            )
        elif id_commune:
            demandes = list(
                Demande.objects.prefetch_related('demandepersonne__personne')
                .filter(statut_demande='en attente', id_commune=id_commune)
            )
        else:
            demandes = []

        heap   = construire_file_priorite(demandes)
        result = []
        while heap:
            result.append(traiter_demande(heap))

        serializer = DemandeReadSerializer(result, many=True)
        return Response(serializer.data, status=200)

    def patch(self, request, id_agent, id_demande):
        """Valider ou refuser une demande."""
        action = request.data.get('action')
        motif  = request.data.get('motif')

        try:
            demande = Demande.objects.get(id_demande=id_demande)
        except Demande.DoesNotExist:
            return Response({"error": "Demande introuvable."}, status=404)

        # Impossible de modifier une demande déjà validée
        if demande.statut_demande == 'VALIDER':
            return Response({"error": "Demande déjà validée."}, status=403)

        serializer = JournalSerializer(data={
            'demande': demande.id_demande,
            'agent'  : id_agent,
            'action' : action,
            'motif'  : motif or ''
        })

        if serializer.is_valid():
            journal = serializer.save()
            return Response({
                "message": f"Demande {action.lower()} avec succès.",
                "journal": journal.id_journal,
            }, status=200)

        return Response(serializer.errors, status=400)
    
class ActeDetailView(APIView):
    def get(self, request, id_acte):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        acte = Acte.objects.select_related('type_acte').get(id_acte=id_acte)
        libelle_type = acte.type_acte.libelle if acte.type_acte else "N/A"


        # Personnes liées à cet acte
        acte_personnes = ActePersonne.objects.filter(
            id_acte=acte
        ).select_related('id_personne')

        personnes = [{
            "role"            : ap.role,
            "nom_personne"    : ap.id_personne.nom_personne,
            "prenom_personne" : ap.id_personne.prenom_personne,
            "date_naissance"  : str(ap.id_personne.date_naissance) if ap.id_personne.date_naissance else None,
            "lieu_naiss"      : ap.id_personne.lieu_naiss,
            "sexe"            : ap.id_personne.sexe,
            "profession"      : ap.id_personne.profession,
        } for ap in acte_personnes]
        
        
        # Après avoir récupéré l'acte — chercher la demande liée
        # Chercher d'abord une demande avec paiement confirmé
        acte = Acte.objects.select_related('type_acte').get(id_acte=id_acte)

        # Chercher la demande — utiliser id_demande si fourni
        id_demande_param = request.GET.get('id_demande', None)

        if id_demande_param:
            demande_liee = Demande.objects.filter(
                id_demande=id_demande_param
            ).select_related('id_citoyen__id_user').first()
        else:
            demande_liee = Demande.objects.filter(
                num_acte=acte.num_acte,
            ).select_related('id_citoyen__id_user').first()

        # Si pas de demande VALIDER, prendre EN ATTENTE avec paiement confirmé
        if not demande_liee:
            # Chercher parmi toutes les demandes celle avec paiement confirmé
            toutes_demandes = Demande.objects.filter(
                num_acte=acte.num_acte
            ).select_related('id_citoyen__id_user')
            
            for d in toutes_demandes:
                p = Paiement.objects.filter(
                    id_demande=d,
                    statut_paiement='confirme'
                ).first()
                if p:
                    demande_liee = d
                    break

        paiement_ok   = False
        id_demande    = None
        statut        = None
        email_citoyen = None

        if demande_liee:
            id_demande = demande_liee.id_demande
            statut     = demande_liee.statut_demande
            try:
                email_citoyen = demande_liee.id_citoyen.id_user.email
            except:
                email_citoyen = None

            paiement = Paiement.objects.filter(
                id_demande=demande_liee,
                statut_paiement='confirme'
            ).first()
            print("DEMANDE ID:", demande_liee.id_demande)
            print("PAIEMENT:", paiement)
            paiement_ok = paiement is not None
        return Response({
            "id_acte"       : acte.id_acte,
            "num_acte"      : acte.num_acte,
            "date_acte"     : str(acte.date_acte),
            "type_acte"     : libelle_type,
            "personnes"     : personnes,
            "id_demande"    : id_demande,
            "statut_demande": statut,
            "email_citoyen" : email_citoyen,
            "paiement_ok"   : paiement_ok,
        }, status=200)