"""
F8 — Redirection vers l'arrondissement disponible le plus proche
Algorithme : Dijkstra avec file de priorité (tas binaire)
Complexité  : O((V + E) log V)
"""
import heapq
from apps.dashboard_app.models import Arondissement, LiaisonArondissement


def construire_graphe():
    """
    Construit le graphe depuis la base de données.
    Retourne :
        graphe  : dict {id_aro: [(voisin_id, distance), ...]}
        statuts : dict {id_aro: 'disponible'/'indisponible'}
    """
    graphe  = {}
    statuts = {}

    # Nœuds
    for aro in Arondissement.objects.all():
        graphe[aro.id_arondissement]  = []
        statuts[aro.id_arondissement] = aro.statut

    # Arêtes
    for liaison in LiaisonArondissement.objects.all():
        graphe[liaison.arondissement1_id].append(
            (liaison.arondissement2_id, liaison.distance_km)
        )

    return graphe, statuts


def dijkstra(id_arondissement_depart):
    """
    Trouve l'arrondissement disponible le plus proche
    depuis id_arondissement_depart.

    Retourne : (arondissement, distance) ou (None, inf)
    """
    graphe, statuts = construire_graphe()

    distances = {node: float('inf') for node in graphe}
    distances[id_arondissement_depart] = 0
    heap = [(0, id_arondissement_depart)]

    while heap:
        dist_actuelle, aro_actuel = heapq.heappop(heap)

        # Commune disponible trouvée — pas le départ
        if aro_actuel != id_arondissement_depart:
            if statuts.get(aro_actuel) == 'disponible':
                aro = Arondissement.objects.get(id_arondissement=aro_actuel)
                return aro, dist_actuelle

        if dist_actuelle > distances[aro_actuel]:
            continue

        for voisin, poids in graphe[aro_actuel]:
            nouvelle_dist = dist_actuelle + poids
            if nouvelle_dist < distances[voisin]:
                distances[voisin] = nouvelle_dist
                heapq.heappush(heap, (nouvelle_dist, voisin))

    return None, float('inf')