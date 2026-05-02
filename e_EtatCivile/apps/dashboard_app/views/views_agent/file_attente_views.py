from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count, Q
from apps.dashboard_app.models import Utilisateur, Demande
from apps.accounts_app.services import verify_jwt

def file_attente(request):
    token = request.COOKIES.get('token')
    if not token:
        return JsonResponse({'error': 'Token manquant'})
    
    payload = verify_jwt(token)
    if not payload:
        return JsonResponse({'error': 'Token invalide'})
    
    user = Utilisateur.objects.get(id_user=payload['user_id'])

    type_demande = request.POST.get('type_demande') if request.method == 'POST' else None

    demandes = Demande.objects.filter(id_agent=user.id_user)

    if type_demande:
        demandes = demandes.filter(type_acte=type_demande)

    stats = demandes.aggregate(
        en_attente=Count('id_demande', filter=Q(statut_demande='en attente')),
        valider=Count('id_demande', filter=Q(statut_demande='validée')),
        refuser=Count('id_demande', filter=Q(statut_demande='refusée'))
    )

    A_traiter = demandes.select_related('id_citoyen__id_user').filter(
        statut_demande='en attente'
    )

    context = {
        'stats': stats,
        'A_traiter': A_traiter,
        'type_demande': type_demande
    }

    return render(request, template_name='dash_agent/file_attente.html', context=context)

    