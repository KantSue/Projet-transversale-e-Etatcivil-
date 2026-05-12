# views.py
from apps.dashboard_app.services.search import construire_texte_acte

from apps.dashboard_app.services.Kmp import kmp_search
from apps.dashboard_app.services.Rabin_Karp import rabin_karp_search
from apps.dashboard_app.services.Recherche import rechercher_actes

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.test import APITestCase
from apps.dashboard_app.services.Trie import Trie

from apps.dashboard_app.serializers import (
    ActeSerializer,
    DemandeRefuSerializer,JournalSerializer,
    DemandeAccepteSerializer,DemandeReadSerializer,
    DemandePersonneSerializer, PersonneSerializer, DemandeCreateSerializer,DemandeSerializer,DemandeHeapSerializer
)
from apps.dashboard_app.models import ActePersonne,ActeDeces,ActeNaissance,ActeMariage,Demande,DemandePersonne,Personne,JournalAudit,Acte,TypeActe

def construire_trie():
    trie = Trie()

    
    # Une seule boucle — toutes les personnes via acte_personne
    for ap in ActePersonne.objects.select_related('id_personne', 'id_acte'):
        trie.insert(ap.id_personne.nom_personne,    ap.id_acte.id_acte)
        trie.insert(ap.id_personne.prenom_personne, ap.id_acte.id_acte)

    for acte in Acte.objects.all():
            if acte.num_acte:
                trie.insert(acte.num_acte, acte.id_acte)

       
    return trie



class SearchActeView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()
        if not query or len(query) < 2:
            return Response({"message": "Query trop courte"}, status=400)

        resultats  = rechercher_actes(query)
        serializer = ActeSerializer(resultats, many=True)
        return Response(serializer.data, status=200)
    
class AutocompleteAPITest(APITestCase):

    def setUp(self):
        type_acte = TypeActe.objects.create(libelle="Naissance")

        Acte.objects.create(
            num_acte="A001",
            date_acte="2024-01-01",
            type_acte=type_acte
        )

    def test_autocomplete(self):
        url = "/api/autocomplete/?q=a0"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

class SuggestionsView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()
        if len(query) < 2:
            return Response([], status=200)

        trie = construire_trie()          # reconstruit à chaque requête
        ids  = trie.search_prefix(query)
        actes = Acte.objects.filter(id_acte__in=ids)
        # Au lieu de retourner juste les actes, enrichissez avec les personnes
        resultats = []
        for acte in actes:
            # Chercher les personnes liées à cet acte
            personnes = ActePersonne.objects.filter(
                id_acte=acte.id_acte
            ).select_related('id_personne')
            
            noms = [
                f"{p.id_personne.prenom_personne} {p.id_personne.nom_personne}"
                for p in personnes
            ]
            
            resultats.append({
                "id_acte"  : acte.id_acte,
                "num_acte" : acte.num_acte,
                "date_acte": str(acte.date_acte),
                "personnes": noms
            })
        return Response(resultats, status=200)