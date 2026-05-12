from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
import json

from apps.dashboard_app.models import Paiement, Demande, DemandePersonne, Personne, Acte, PieceJoint
from apps.dashboard_app.serializers import DemandeCreateSerializer
from apps.dashboard_app.services.paiement_service import simuler_paiement
from apps.dashboard_app.services.demande_service import generer_num_demande
from apps.accounts_app.services import verify_jwt


class PaiementEtDemandeView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # 1. Vérifier JWT
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None

        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        # 2. Vérifications de base
        numero_tel   = request.data.get('numero_tel')
        id_type_acte = request.data.get('id_type_acte')
        num_acte     = request.data.get('num_acte')
        photo        = request.FILES.get('photo_ci')

        if not numero_tel:
            return Response({"error": "Numéro de téléphone requis"}, status=400)
        if not num_acte:
            return Response({"error": "Numéro d'acte requis"}, status=400)
        if not Acte.objects.filter(num_acte=num_acte).exists():
            return Response({"error": "Numéro d'acte introuvable dans les archives."}, status=400)
        if not photo:
            return Response({"error": "Photo CIN obligatoire"}, status=400)

        # 3. Simuler le paiement
        result_paiement = simuler_paiement(id_type_acte, numero_tel)
        if result_paiement['statut'] == 'echoue':
            return Response({
                "error"    : result_paiement['message'],
                "reference": result_paiement['reference'],
                "statut"   : "echoue"
            }, status=402)

        # 4. Construire un dict normal depuis QueryDict
        data = {}
        for key in request.data.keys():
            data[key] = request.data.get(key)

        # 5. Parser les personnes JSON string → dict
        for champ in ['enfant', 'pere', 'mere', 'defunt', 'epoux1', 'epoux2']:
            valeur = data.get(champ)
            if valeur and isinstance(valeur, str):
                try:
                    data[champ] = json.loads(valeur)
                except json.JSONDecodeError:
                    pass

        # 6. Ajouter citoyen
        data['id_citoyen'] = payload['user_id']

        # 7. Valider et créer la demande
        serializer = DemandeCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        demande = serializer.save()

        # 8. Enregistrer le paiement
        Paiement.objects.create(
            montant         = result_paiement['montant'],
            statut_paiement = 'confirme',
            ref_transaction = result_paiement['reference'],
            date_paiement   = timezone.now().date(),
            id_demande      = demande
        )

        # 9. Sauvegarder photo CIN dans piece_joint
        chemin = default_storage.save(
            f"cin/{demande.id_demande}_{photo.name}",
            photo
        )
        PieceJoint.objects.create(
            type_fichier = photo.content_type,
            url_fichier  = chemin,
            id_demande   = demande
        )

        return Response({
            "message"   : "Paiement confirme et demande soumise.",
            "reference" : result_paiement['reference'],
            "montant"   : result_paiement['montant'],
            "demande_id": demande.id_demande,
            "statut"    : "confirme"
        }, status=201)