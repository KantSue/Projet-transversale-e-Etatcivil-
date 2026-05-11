from apps.dashboard_app.models import ActePersonne,ActeDeces,ActeNaissance,ActeMariage,Acte
from apps.dashboard_app.services.Kmp import kmp_search
from apps.dashboard_app.services.Rabin_Karp import rabin_karp_search



def rechercher_actes(query):
    if not query or len(query.strip()) < 2:
        return []

    query     = query.strip().lower()
    mots      = query.split()
    resultats = {}

    # Une seule boucle — toutes les personnes via acte_personne
    acte_personnes = ActePersonne.objects.select_related('id_personne', 'id_acte')

    def scorer(acte_id, champs):
        for texte in champs:
            if not texte:
                continue
            if len(mots) == 1:
                occ = kmp_search(texte, mots[0])
            else:
                occ = []
                for mot in mots:
                    occ += rabin_karp_search(texte, mot)
            if occ:
                resultats[acte_id] = resultats.get(acte_id, 0) + len(occ) * 3

    for ap in acte_personnes:
        scorer(ap.id_acte.id_acte, [
            ap.id_personne.nom_personne,
            ap.id_personne.prenom_personne
        ])

    # Recherche sur num_acte — poids élevé
    for acte in Acte.objects.all():
        scorer(acte.id_acte, [acte.num_acte or ''])

    ids_tries = sorted(resultats, key=resultats.get, reverse=True)
    actes     = {a.id_acte: a for a in Acte.objects.filter(id_acte__in=ids_tries)}
    return [actes[i] for i in ids_tries if i in actes]