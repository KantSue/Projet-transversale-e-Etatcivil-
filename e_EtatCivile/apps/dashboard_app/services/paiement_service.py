"""
F6 — Service de paiement simulé
=================================
Simulation MVola/Orange Money via UUID
En production : intégration API MVola (developer.mvola.mg)
"""

import uuid
import random
from datetime import datetime

MONTANTS = {
    1: 1000,  # acte naissance
    2: 1000,  # acte deces
    3: 1000,  # acte mariage
}

def simuler_paiement(id_type_acte, numero_tel):
    """
    Simule un paiement mobile money.
    Retourne reference + statut.
    90% de chance de succès.
    """
    montant   = MONTANTS.get(id_type_acte, 1000)
    reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    succes    = random.random() > 0.1

    return {
        "reference"  : reference,
        "montant"    : montant,
        "numero_tel" : numero_tel,
        "statut"     : "confirme" if succes else "echoue",
        "date"       : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "message"    : "Paiement confirme" if succes else "Solde insuffisant"
    }

def verifier_paiement(reference):
    """
    Vérifie si une référence de paiement existe et est confirmée.
    En production : appel API MVola/Orange Money.
    """
    from apps.dashboard_app.models import Paiement
    try:
        paiement = Paiement.objects.get(ref_transaction=reference)
        return {
            "existe" : True,
            "statut" : paiement.statut_paiement,
            "montant": paiement.montant
        }
    except Paiement.DoesNotExist:
        return {"existe": False}