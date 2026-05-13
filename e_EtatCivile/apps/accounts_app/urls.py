from django.urls import path
from . import views

urlpatterns = [
    # Inscription citoyen
    path('register/',  views.CitoyenRegisterView.as_view(), name='register'),

    # Connexion — tous rôles (citoyen, agent, administrateur)
    path('login/',     views.LoginView.as_view(),           name='login'),

    # Déconnexion
    path('logout/',    views.LogoutView.as_view(),          name='logout'),

    # Profil utilisateur connecté
    path('profil/',    views.ProfilView.as_view(),          name='profil'),

    # Communes + arrondissements (pour formulaire inscription)
    path('communes/',  views.CommunesView.as_view(),        name='communes'),
    
    path('mot-de-passe-oublie/', views.MotDePasseOublieView.as_view(), name='mot-de-passe-oublie'),
]
