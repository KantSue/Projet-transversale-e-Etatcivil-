from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from apps.dashboard_app.models import Paiement, Demande, DemandePersonne, Personne
from apps.dashboard_app.serializers import DemandeCreateSerializer
from apps.dashboard_app.services.paiement_service import simuler_paiement
from apps.dashboard_app.services.demande_service import generer_num_demande
from apps.accounts_app.services import verify_jwt


class PaiementEtDemandeView(APIView):
    """
    POST /paiements/
    Le citoyen paie puis soumet sa demande en une seule requête.
    Body JSON :
    {
        "numero_tel"  : "0341234567",
        "id_type_acte": 1,
        "num_acte"    : "NAISS-2024-001",
        "id_commune"  : 1,
        "id_arrondissement": 4,
        "enfant"      : {...},
        "pere"        : {...},
        "mere"        : {...}
    }
    """
    def post(self, request):
        # 1. Récupérer citoyen depuis JWT
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None

        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        # 2. Simuler le paiement
        numero_tel   = request.data.get('numero_tel')
        id_type_acte = request.data.get('id_type_acte')

        if not numero_tel:
            return Response({"error": "Numéro de téléphone requis"}, status=400)

        result_paiement = simuler_paiement(id_type_acte, numero_tel)

        # 3. Paiement échoué → bloquer
        if result_paiement['statut'] == 'echoue':
            return Response({
                "error"    : result_paiement['message'],
                "reference": result_paiement['reference'],
                "statut"   : "echoue"
            }, status=402)

        # 4. Paiement confirmé → créer la demande
        data = request.data.copy()
        data['id_citoyen'] = payload['user_id']

        serializer = DemandeCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        demande = serializer.save()

        # 5. Enregistrer le paiement
        Paiement.objects.create(
            montant         = result_paiement['montant'],
            statut_paiement = 'confirme',
            ref_transaction = result_paiement['reference'],
            date_paiement   = timezone.now().date(),
            id_demande      = demande
        )

        return Response({
            "message"   : "Paiement confirme et demande soumise.",
            "reference" : result_paiement['reference'],
            "montant"   : result_paiement['montant'],
            "demande_id": demande.id_demande,
            "statut"    : "confirme"
        }, status=201)