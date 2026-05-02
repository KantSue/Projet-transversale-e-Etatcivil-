from datetime import date

from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count, Q

from apps.dashboard_app.models import Utilisateur, Demande
from apps.accounts_app.services import verify_jwt
from apps.dashboard_app.services.service_citoyen import generateNumActe
from apps.dashboard_app.models import Acte, ActeNaissance, Personne
from apps.dashboard_app.form import PersonneForm, ActeNaissanceForm


def services(request):
    return render(request, 'dash_citoyen/services.html')


def servicesActeNaissance(request):

    token = request.COOKIES.get('token')
    if not token:
        return JsonResponse({'error': 'Token manquant'})

    payload = verify_jwt(token)
    if not payload:
        return JsonResponse({'error': 'Token invalide'})

    try:
        user = Utilisateur.objects.get(id_user=payload['user_id'])
    except Utilisateur.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur introuvable'})

    # ✅ ne pas écraser "date"
    today = date.today()

    # ✅ initialiser les formulaires (important)
    enfant_form = PersonneForm(prefix='enfant')
    pere_form = PersonneForm(prefix='pere')
    mere_form = PersonneForm(prefix='mere')
    acte_naissance_form = ActeNaissanceForm(prefix='acte_naissance')

    if request.method == "POST":
        enfant_form = PersonneForm(request.POST, prefix='enfant')
        pere_form = PersonneForm(request.POST, prefix='pere')
        mere_form = PersonneForm(request.POST, prefix='mere')
        acte_naissance_form = ActeNaissanceForm(request.POST, prefix='acte_naissance')

        if (enfant_form.is_valid() and
            pere_form.is_valid() and
            mere_form.is_valid() and
            acte_naissance_form.is_valid()):

            enfant = enfant_form.save()
            pere = pere_form.save()
            mere = mere_form.save()

            # ⚠️ vérifie le nom du champ (num_acte ou nume_acte)
            acte = Acte.objects.create(
                num_acte=generateNumActe(),
                type="acte naissance",
                date=today
            )

            acteN = ActeNaissance.objects.create(
                id_acte=acte,
                enfant=enfant,
                pere=pere,
                mere=mere
            )

            Demande.objects.create(
                type_acte=acteN,
                date_depot=today,
                statut_demande="en attente",
                id_citoyen=user  # mieux que user.id_user si ForeignKey
            )

            return JsonResponse({
                'message': "Demande d'acte de naissance soumise avec succès"
            })

    return render(request, 'dash_citoyen/acte_naissance.html', {
        "enfant_form": enfant_form,
        "pere_form": pere_form,
        "mere_form": mere_form,
        "acte_naissance_form": acte_naissance_form
    })