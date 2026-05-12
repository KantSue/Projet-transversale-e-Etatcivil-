from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta

from apps.dashboard_app.models import (
    Demande, Paiement, JournalAudit, TypeActe, Commune
)
from apps.accounts_app.services import verify_jwt


def check_admin(request):
    token   = request.COOKIES.get('token') or \
              request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = verify_jwt(token) if token else None
    if not payload or payload.get('role', '').lower() != 'administrateur':
        return None
    return payload


class StatistiquesView(APIView):
    """
    GET /dashboard/stats/
    Tableau de bord global — admin uniquement.
    """
    def get(self, request):
        if not check_admin(request):
            return Response({"error": "Acces reserve aux administrateurs."}, status=403)

        # 1. Statuts des demandes
        statuts = Demande.objects.values('statut_demande').annotate(
            total=Count('id_demande')
        )
        statuts_dict = {s['statut_demande']: s['total'] for s in statuts}

        # 2. Demandes par type d'acte
        par_type = Demande.objects.values(
            libelle=F('id_type_acte__libelle')
        ).annotate(total=Count('id_demande')).order_by('-total')

        # 3. Demandes par commune
        par_commune = Demande.objects.filter(
            id_commune__isnull=False
        ).values(
            commune=F('id_commune__nom_commune')
        ).annotate(total=Count('id_demande')).order_by('-total')

        # 4. Délai moyen de traitement (date_maj - date_depot en jours)
        demandes_terminees = Demande.objects.filter(
            statut_demande='TERMINER',
            date_maj__isnull=False
        )
        delai_moyen = 0
        if demandes_terminees.exists():
            total_jours = sum(
                (d.date_maj - d.date_depot.date()).days
                for d in demandes_terminees
                if d.date_maj and d.date_depot
            )
            delai_moyen = round(total_jours / demandes_terminees.count(), 1)

        # 5. Paiements
        paiements = Paiement.objects.aggregate(
            total_confirme = Count('id_paiement', filter=__import__('django.db.models', fromlist=['Q']).Q(statut_paiement='confirme')),
            montant_total  = Sum('montant', filter=__import__('django.db.models', fromlist=['Q']).Q(statut_paiement='confirme')),
            total_echoue   = Count('id_paiement', filter=__import__('django.db.models', fromlist=['Q']).Q(statut_paiement='echoue'))
        )

        # 6. Journal récent (10 dernières actions)
        journal = JournalAudit.objects.select_related(
            'agent__id_user', 'demande'
        ).order_by('-horodatage')[:10]

        journal_data = [{
            "agent"   : f"{j.agent.id_user.nom_user} {j.agent.id_user.prenom_user}",
            "action"  : j.action,
            "demande" : j.demande.id_demande if j.demande else None,
            "motif"   : j.motif or "",
            "date"    : j.horodatage.strftime("%Y-%m-%d %H:%M") if j.horodatage else "N/A"
        } for j in journal if j.agent and j.agent.id_user]

        return Response({
            "demandes": {
                "total"     : Demande.objects.count(),
                "en_attente": statuts_dict.get('en attente', 0),
                "valider"   : statuts_dict.get('VALIDER', 0),
                "refuser"   : statuts_dict.get('REFUSER', 0),
                "terminer"  : statuts_dict.get('TERMINER', 0),
            },
            "par_type"         : list(par_type),
            "par_commune"      : list(par_commune),
            "delai_moyen_jours": delai_moyen,
            "paiements"        : paiements,
            "journal_recent"   : journal_data
        }, status=200)


class DemandesJourView(APIView):
    """
    GET /dashboard/stats/demandes-jour/
    Toutes les demandes traitées aujourd'hui avec l'agent qui les a prises.
    """
    def get(self, request):
        if not check_admin(request):
            return Response({"error": "Acces reserve aux administrateurs."}, status=403)

        aujourd_hui = timezone.now().date()

        # Demandes traitées aujourd'hui via journal_audit
        journaux = JournalAudit.objects.select_related(
            'demande__id_type_acte',
            'demande__id_commune',
            'agent__id_user'
        ).filter(
            horodatage__date=aujourd_hui
        ).order_by('-horodatage')

        data = []
        vus  = set()

        for j in journaux:
            if j.demande.id_demande in vus:
                continue
            vus.add(j.demande.id_demande)

            data.append({
                "id_demande" : j.demande.id_demande,
                "num_demande": j.demande.num_demande,
                "type_acte"  : j.demande.id_type_acte.libelle if j.demande.id_type_acte else "N/A",
                "commune"    : j.demande.id_commune.nom_commune if j.demande.id_commune else "N/A",
                "statut"     : j.demande.statut_demande,
                "agent"      : f"{j.agent.id_user.nom_user} {j.agent.id_user.prenom_user}",
                "action"     : j.action,
                "motif"      : j.motif or "",
                "heure"      : j.horodatage.strftime("%H:%M")
            })

        return Response({
            "date"   : str(aujourd_hui),
            "total"  : len(data),
            "demandes": data
        }, status=200)