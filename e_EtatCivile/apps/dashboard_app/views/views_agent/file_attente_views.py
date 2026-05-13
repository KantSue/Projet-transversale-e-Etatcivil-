from rest_framework.views import APIView
from rest_framework.response import Response
from apps.dashboard_app.models import Demande
from apps.accounts_app.services import verify_jwt

class FileAttenteView(APIView):
    def get(self, request):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None

        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        id_commune       = payload.get('id_commune')
        id_arondissement = payload.get('id_arondissement')

        # Filtrage selon commune/arrondissement
        if id_commune == 1:
            demandes = Demande.objects.filter(
                statut_demande='EN ATTENTE',
                id_arrondissement=id_arondissement
            ).select_related('id_type_acte', 'id_commune', 'id_arrondissement', 'id_citoyen')
        else:
            demandes = Demande.objects.filter(
                statut_demande='EN ATTENTE',
                id_commune=id_commune
            ).select_related('id_type_acte', 'id_commune', 'id_arrondissement', 'id_citoyen')

        # Trier par date de dépôt — plus ancienne en premier
        demandes = demandes.order_by('date_depot')
        print("PAYLOAD AGENT:", payload)
        print("DEMANDES TROUVEES:", demandes.count())
        data = [{
            "id_demande"    : d.id_demande,
            "num_demande"   : d.num_demande,
            "statut_demande": d.statut_demande,
            "type_acte"     : d.id_type_acte.libelle if d.id_type_acte else "N/A",
            "commune"       : d.id_commune.nom_commune if d.id_commune else "N/A",
            "arrondissement": d.id_arrondissement.nom_arondissement if d.id_arrondissement else None,
            "date_depot"    : str(d.date_depot),
            "citoyen"       : f"{d.id_citoyen.nom_user} {d.id_citoyen.prenom_user}" if d.id_citoyen else "N/A",
        } for d in demandes]

        return Response(data, status=200)