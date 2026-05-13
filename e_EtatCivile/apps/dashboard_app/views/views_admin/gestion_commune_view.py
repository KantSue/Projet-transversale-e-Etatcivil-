from apps.dashboard_app.models import Arondissement

from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts_app.services import verify_jwt


class GestionArondissementView(APIView):
    def get(self, request):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload or payload.get('role', '').lower() != 'administrateur':
            return Response({"error": "Non autorisé"}, status=403)

        arondissements = Arondissement.objects.select_related('id_commune').all()
        data = [{
            "id_arondissement" : a.id_arondissement,
            "nom_arondissement": a.nom_arondissement,
            "num_arondissement": a.num_arondissement,
            "statut"           : a.statut,
            "commune"          : a.id_commune.nom_commune if a.id_commune else "N/A",
            "id_commune"       : a.id_commune.id_commune if a.id_commune else None,
        } for a in arondissements]

        return Response(data, status=200)

    def patch(self, request, id_arondissement):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload or payload.get('role', '').lower() != 'administrateur':
            return Response({"error": "Non autorisé"}, status=403)

        try:
            arondissement = Arondissement.objects.get(id_arondissement=id_arondissement)
        except Arondissement.DoesNotExist:
            return Response({"error": "Arrondissement introuvable"}, status=404)

        nouveau_statut = request.data.get('statut')
        if nouveau_statut not in ['disponible', 'indisponible']:
            return Response({"error": "Statut invalide"}, status=400)

        arondissement.statut = nouveau_statut
        arondissement.save()

        return Response({
            "message": f"Statut mis à jour : {nouveau_statut}",
            "id_arondissement": id_arondissement,
            "statut": nouveau_statut
        }, status=200)