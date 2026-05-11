from rest_framework.views import APIView
from rest_framework.response import Response
from apps.dashboard_app.models import Arondissement
from apps.dashboard_app.services.Dijkstra import dijkstra


class VerifierArondissementView(APIView):
    def get(self, request, id_arondissement):

        try:
            aro = Arondissement.objects.select_related('id_commune').get(
                id_arondissement=id_arondissement
            )
        except Arondissement.DoesNotExist:
            return Response({"message": "Arrondissement introuvable"}, status=404)

        # Arrondissement disponible
        if aro.statut == 'disponible':
            return Response({
                "disponible"      : True,
                "arrondissement"  : aro.nom_arondissement,
                "commune"         : aro.id_commune.nom_commune,
                "message"         : f"L'arrondissement {aro.nom_arondissement} est disponible."
            }, status=200)

        # Arrondissement indisponible → Dijkstra
        aro_proche, distance = dijkstra(id_arondissement)

        if aro_proche is None:
            return Response({
                "disponible" : False,
                "message"    : "Aucun arrondissement disponible à proximité. Veuillez réessayer plus tard."
            }, status=200)

        return Response({
            "disponible"             : False,
            "arrondissement_ferme"   : aro.nom_arondissement,
            "message"                : f"L'arrondissement {aro.nom_arondissement} est temporairement indisponible.",
            "redirection"            : {
                "arrondissement" : aro_proche.nom_arondissement,
                "commune"        : aro_proche.id_commune.nom_commune,
                "distance_km"    : distance
            }
        }, status=200)