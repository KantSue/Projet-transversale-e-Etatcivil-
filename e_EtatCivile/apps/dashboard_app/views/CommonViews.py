from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent,Demande
from apps.accounts_app.services import *
from django.db.models import Count,Q
from apps.dashboard_app.services import *
def dashboard(request):
    token=request.COOKIES.get('token')
    if not token:
        return JsonResponse({'error':'Token manquant'})
    
    payload =verify_jwt(token)
    if not payload:
        return JsonResponse({'error':'Token invalide'})
    
    user= Utilisateur.objects.get(id_user=payload['user_id'])
    if user.role=="Administrateur":
        return render(request=request, template_name='dash_admin/admin_agents/dashboard_admin.html',context={'user':user})
    elif user.role=="Agent":
        return render(request=request, template_name='dash_agent/dashboard_agent.html',context={'user':user})
    elif user.role=="Citoyen":
        return render(request=request, template_name='dash_citoyen/dashboard_citoyen.html',context={'user':user})
    

    