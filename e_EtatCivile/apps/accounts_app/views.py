from datetime import datetime
from multiprocessing import context
from django.contrib.auth.hashers import make_password
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from django.views.decorators.csrf import csrf_exempt

from .models import Utilisateur,Citoyen,Commune,Arondissement,Administrateur,Agent
from .services import *
from .forms import UserLoginForm,AgentLoginForm
import bcrypt

# def Agent_register (request):
#     if request.method=='POST':
#         nom_user=request.POST.get('nom_user')
#         prenom_user=request.POST.get('prenom_user')
#         email=request.POST.get('email')
#         mdp_user=request.POST.get('mdp_user')
#         mdp_hash=bcrypt.hashpw(mdp_user.encode('utf-8'),bcrypt.gensalt())
#         role='administrateur'
#         matricule=request.POST.get('matricule')
#         id_arondissement=request.POST.get('id_arondissement')
#         print(mdp_user)
        
        
#         user=Utilisateur.objects.create(nom_user=nom_user,
#                                    prenom_user=prenom_user,
#                                    email=email,
#                                    mdp_user=mdp_hash.decode('utf-8'),
#                                    id_arondissement=id_arondissement,
#                                    matricule=matricule,
#                                    role=role)
#         Administrateur.objects.create(id_user=user,matricule=matricule)
#         token=generate_jwt(user)
#         response=redirect('dashboard')
#         response.set_cookie('token',token)
#         return response
#     context={}
#     context['commune']=Commune.objects.select_related('id_arondissement').all()
#     return render(request,template_name='auth.html',context={'context':context})

# #Admin
# def Admin_register (request):
#     if request.method=='POST':
#         nom_user=request.POST.get('nom_user')
#         prenom_user=request.POST.get('prenom_user')
#         email=request.POST.get('email')
#         mdp_user=request.POST.get('mdp_user')
#         mdp_hash=bcrypt.hashpw(mdp_user.encode('utf-8'),bcrypt.gensalt())
#         role='administrateur'
#         print(mdp_user)
        
        
#         Utilisateur.objects.create(nom_user=nom_user,
#                                    prenom_user=prenom_user,
#                                    email=email,
#                                    mdp_user=mdp_hash.decode('utf-8'),
#                                    role=role)
#     context={}
#     context['commune']=Commune.objects.select_related('id_arondissement').all()
#     return render(request,template_name='auth.html',context={'context':context})

# #citoyen
def Citoyen_register (request):
    if request.method=='POST':
        
        nom_user=request.POST.get('nom_user')
        print(nom_user)
        prenom_user=request.POST.get('prenom_user')
        email=request.POST.get('email')
        mdp_user=request.POST.get('mdp_user')
        mdp_hash=bcrypt.hashpw(mdp_user.encode('utf-8'),bcrypt.gensalt())
        role='citoyen'
        print(mdp_user)
        
        
        user=Utilisateur.objects.create(nom_user=nom_user,
                                   prenom_user=prenom_user,
                                   email=email,
                                   mdp_user=mdp_hash.decode('utf-8'),
                                   role=role)
        Citoyen.objects.create(id_user=user)
        token=generate_jwt(user)
        response=redirect('dashboard')
        response.set_cookie('token',token)
        return response
    arrondissements = Arondissement.objects.select_related('id_commune').order_by('id_commune__nom_commune')
    return render(request, template_name='C_signUp.html',context={'arrondissements': arrondissements})


# def Authentification(request):
#     form=UserLoginForm(request.POST or None)
#     form2=AgentLoginForm(request.POST or None)
#     if form.is_valid() and form2.is_valid():
#         # 🔹 1. créer utilisateur
#         user = form.save(commit=False)
#         user.role = 'agent'
#         user.mdp_user = make_password(user.mdp_user)
#         user.save()

#             # 🔹 2. créer agent lié à user
#         agent = form2.save(commit=False)
#         agent.id_user = user   # 💥 ICI LA SOLUTION
#         agent.save()
#         return redirect('details')
#     return render(request,template_name='formulaire.html',context={'form':form,'form2':form2})
def detals(request):
    context={}
    context['utilisateurs']=Utilisateur.objects.all()
    return render (request,template_name='info.html',context={'context':context})
    # return HttpResponse(request,template_name='info.html',context={'context':context})
  
def login(request):
    if request.method=='POST':
        # user_name=request.POST.get('nom_user')
        mdp_user=request.POST.get('mdp_user')
        email=request.POST.get('email')
        # matricule=request.POST.get('matricule')
        try:
            user=Utilisateur.objects.get(email=email)
            
            if bcrypt.checkpw(mdp_user.encode('utf-8'),user.mdp_user.encode('utf-8')):
                token=generate_jwt(user)
                
                response=redirect('dashboard')
                response.set_cookie('token',token)
                
                
                return response
                
            else:
                return JsonResponse({ 'error':'Mots de passe incorrect'})
        except Utilisateur.DoesNotExist:
            return JsonResponse({ 'error': 'Utilisateur introuvable' })
    return render(request=request, template_name='login.html')

def logout(request):
    response=redirect('home')
    response.delete_cookie('token')
    return response