from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent,Demande,Paiement
from apps.accounts_app.services import *
from django.db.models import Count,Q,Sum
from apps.dashboard_app.services.services_admin.AgentManageService import *

from django.db.models import Sum
from django.shortcuts import render
from apps.dashboard_app.models import Citoyen, Paiement, Demande

def stat(request):
    context = {}

    if request.method == 'POST':
        mois = request.POST.get('mois')
        annee = request.POST.get('annee')

        
        mois = int(mois) if mois else None
        annee = int(annee) if annee else None

        paiements = Paiement.objects.filter(
            montant__isnull=False,
            statut_paiement='Payé'
        )

        demandes = Demande.objects.all()

        if mois and annee:
            paiements = paiements.filter(
                date_paiement__month=mois,
                date_paiement__year=annee
            )

            demandes = demandes.filter(
                date_depot__month=mois,
                date_depot__year=annee
            )

        context['citoyens'] = Citoyen.objects.count()
        context['demande_globale'] = demandes.count()
        context['demande_valider'] = demandes.filter(statut_demande='validée').count()

        total_collecte = paiements.aggregate(total=Sum('montant'))
        context['collectes'] = total_collecte['total'] or 0

        context['demande_mois'] = context['demande_globale']
        context['demande_valider_mois'] = context['demande_valider']

    return render(request, 'dash_admin/statistiques.html', context)

  