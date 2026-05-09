from apps.dashboard_app.models import ActeDeces,ActeNaissance,ActeMariage,Acte
from apps.dashboard_app.services.Kmp import kmp_search
from apps.dashboard_app.services.Rabin_Karp import rabin_karp_search




def rechercher_actes(query):
    if not query or len(query.strip()) < 2:
        return []

    query  = query.strip().lower()
    mots   = query.split()          # ["rakoto", "jean"] ou ["rakoto"]
    resultats = {}                  # table de hachage : id_acte → score

    # Charger tous les actes avec leurs personnes
    naissances = ActeNaissance.objects.select_related('enfant', 'pere', 'mere', 'id_acte')
    mariages   = ActeMariage.objects.select_related('epoux1', 'epoux2', 'id_acte')
    deces      = ActeDeces.objects.select_related('defunt', 'id_acte')

    def scorer(acte_id, champs, poids):
        """Applique KMP (1 mot) ou Rabin-Karp (multi-mots) et accumule le score."""
        for texte in champs:
            if not texte:
                continue
            if len(mots) == 1:
                # KMP — recherche mono-mot O(n+m)
                occurrences = kmp_search(texte, mots[0])
            else:
                # Rabin-Karp — recherche multi-mots
                occurrences = []
                for mot in mots:
                    occurrences += rabin_karp_search(texte, mot)

            if occurrences:
                resultats[acte_id] = resultats.get(acte_id, 0) + len(occurrences) * poids

    # Naissances
    for an in naissances:
        acte_id = an.id_acte.id_acte
        scorer(acte_id,
               champs=[an.enfant.nom_personne   if an.enfant else '',
                       an.enfant.prenom_personne if an.enfant else '',
                       an.pere.nom_personne      if an.pere   else '',
                       an.pere.prenom_personne      if an.pere   else '',
                       an.mere.nom_personne      if an.mere   else '',
                       an.mere.prenom_personne      if an.mere   else ''],
               poids=3)

    # Mariages
    for am in mariages:
        acte_id = am.id_acte.id_acte
        scorer(acte_id,
               champs=[am.epoux1.nom_personne    if am.epoux1 else '',
                       am.epoux1.prenom_personne  if am.epoux1 else '',
                       am.epoux2.nom_personne     if am.epoux2 else '',
                       am.epoux2.prenom_personne  if am.epoux2 else ''],
               poids=3)

    # Décès
    for ad in deces:
        acte_id = ad.id_acte.id_acte
        scorer(acte_id,
               champs=[ad.defunt.nom_personne    if ad.defunt else '',
                       ad.defunt.prenom_personne  if ad.defunt else ''],
               poids=3)

    # Trier par score décroissant
    ids_tries = sorted(resultats, key=resultats.get, reverse=True)

    # Retourner les actes dans l'ordre
    actes = {a.id_acte: a for a in Acte.objects.filter(id_acte__in=ids_tries)}
    return [actes[i] for i in ids_tries if i in actes]