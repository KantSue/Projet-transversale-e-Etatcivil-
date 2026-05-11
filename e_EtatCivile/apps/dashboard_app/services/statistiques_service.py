from datetime import date, datetime, time

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.dashboard_app.models import Citoyen, Demande, JournalAudit, Paiement


STATUTS_TERMINAUX = [
    "VALIDER",
    "REFUSER",
    "valid\u00e9e",
    "valid\u00c3\u00a9e",
    "valid\u00c3\u0192\u00c2\u00a9e",
]

STATUTS_PAIEMENT_PAYE = [
    "Paye",
    "PAYE",
    "Pay\u00e9",
    "Pay\u00c3\u00a9",
]


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def periode_depuis_requete(request):
    today = timezone.localdate() if timezone.is_aware(timezone.now()) else date.today()
    date_debut = _parse_date(request.GET.get("date_debut")) or date(today.year, 1, 1)
    date_fin = _parse_date(request.GET.get("date_fin")) or today

    if date_debut > date_fin:
        date_debut, date_fin = date_fin, date_debut

    debut_dt = datetime.combine(date_debut, time.min)
    fin_dt = datetime.combine(date_fin, time.max)
    return date_debut, date_fin, debut_dt, fin_dt


def calculer_delai_moyen(demandes):
    delais = []
    journaux = JournalAudit.objects.filter(
        demande__in=demandes,
        action__in=["VALIDER", "REFUSER"],
        horodatage__isnull=False,
    ).select_related("demande")

    for journal in journaux:
        if journal.demande and journal.demande.date_depot:
            delais.append(journal.horodatage - journal.demande.date_depot)

    if not delais:
        for demande in demandes.filter(date_maj__isnull=False):
            date_fin = datetime.combine(demande.date_maj, time.max)
            delais.append(date_fin - demande.date_depot)

    if not delais:
        return None

    total_secondes = sum(delta.total_seconds() for delta in delais)
    return round((total_secondes / len(delais)) / 3600, 2)


def construire_statistiques(debut_dt, fin_dt):
    demandes = Demande.objects.filter(date_depot__range=(debut_dt, fin_dt))
    paiements = Paiement.objects.filter(
        date_paiement__range=(debut_dt.date(), fin_dt.date()),
        montant__isnull=False,
        statut_paiement__in=STATUTS_PAIEMENT_PAYE,
    )

    demandes_par_type = list(
        demandes.values("id_type_acte__libelle")
        .annotate(total=Count("id_demande"))
        .order_by("id_type_acte__libelle")
    )

    demandes_par_statut = list(
        demandes.values("statut_demande")
        .annotate(total=Count("id_demande"))
        .order_by("statut_demande")
    )

    demandes_par_mois = list(
        demandes.annotate(mois=TruncMonth("date_depot"))
        .values("mois")
        .annotate(total=Count("id_demande"))
        .order_by("mois")
    )

    communes = list(
        demandes.values("id_commune__nom_commune")
        .annotate(total=Count("id_demande"))
        .order_by("-total", "id_commune__nom_commune")[:10]
    )

    journaux = list(
        JournalAudit.objects.filter(horodatage__range=(debut_dt, fin_dt))
        .select_related("demande", "agent__id_user")
        .order_by("-horodatage")[:25]
    )

    total_demandes = demandes.count()
    demandes_terminees = demandes.filter(statut_demande__in=STATUTS_TERMINAUX).count()
    taux_traitement = round((demandes_terminees / total_demandes) * 100, 2) if total_demandes else 0

    return {
        "kpis": {
            "citoyens": Citoyen.objects.count(),
            "demandes_total": total_demandes,
            "demandes_terminees": demandes_terminees,
            "demandes_attente": demandes.filter(statut_demande__iexact="en attente").count(),
            "collectes": paiements.aggregate(total=Sum("montant"))["total"] or 0,
            "delai_moyen_heures": calculer_delai_moyen(demandes),
            "taux_traitement": taux_traitement,
        },
        "demandes_par_type": demandes_par_type,
        "demandes_par_statut": demandes_par_statut,
        "demandes_par_mois": demandes_par_mois,
        "communes": communes,
        "journaux": journaux,
    }


def donnees_graphiques(stats):
    return {
        "types": {
            "labels": [item["id_type_acte__libelle"] or "Non renseigne" for item in stats["demandes_par_type"]],
            "values": [item["total"] for item in stats["demandes_par_type"]],
        },
        "statuts": {
            "labels": [item["statut_demande"] or "Non renseigne" for item in stats["demandes_par_statut"]],
            "values": [item["total"] for item in stats["demandes_par_statut"]],
        },
        "mois": {
            "labels": [item["mois"].strftime("%Y-%m") if item["mois"] else "Non renseigne" for item in stats["demandes_par_mois"]],
            "values": [item["total"] for item in stats["demandes_par_mois"]],
        },
        "communes": {
            "labels": [item["id_commune__nom_commune"] or "Non renseignee" for item in stats["communes"]],
            "values": [item["total"] for item in stats["communes"]],
        },
    }
