def construire_texte_acte(acte):
    morceaux = []

    # Numéro acte
    if acte.num_acte:
        morceaux.append(acte.num_acte)

    # Type acte
    if acte.type_acte:
        morceaux.append(acte.type_acte.libelle)

    # Commune
    if hasattr(acte, 'demandes'):
        for d in acte.demandes.all():
            if d.id_commune:
                morceaux.append(d.id_commune.nom_commune)

    # Personnes liées via ActePersonne
    relations = acte.actepersonne_set.all()
    for rel in relations:
        p = rel.id_personne
        morceaux.append(p.nom_personne)
        morceaux.append(p.prenom_personne)

    return " ".join(morceaux).lower()