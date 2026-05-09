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
from apps.dashboard_app.models import ActeDeces,ActeNaissance,ActeMariage,Demande,DemandePersonne,Personne,JournalAudit,Acte,TypeActe

def construire_trie():
    trie = Trie()

    for an in ActeNaissance.objects.select_related('enfant', 'pere', 'mere', 'id_acte'):
        acte_id = an.id_acte.id_acte
        for personne in [an.enfant, an.pere, an.mere]:
            if personne:
                trie.insert(personne.nom_personne,    acte_id)
                trie.insert(personne.prenom_personne, acte_id)

    for am in ActeMariage.objects.select_related('epoux1', 'epoux2', 'id_acte'):
        acte_id = am.id_acte.id_acte
        for personne in [am.epoux1, am.epoux2]:
            if personne:
                trie.insert(personne.nom_personne,    acte_id)
                trie.insert(personne.prenom_personne, acte_id)

    for ad in ActeDeces.objects.select_related('defunt', 'id_acte'):
        if ad.defunt:
            trie.insert(ad.defunt.nom_personne,    ad.id_acte.id_acte)
            trie.insert(ad.defunt.prenom_personne, ad.id_acte.id_acte)

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
        serializer = ActeSerializer(actes, many=True)
        return Response(serializer.data, status=200)