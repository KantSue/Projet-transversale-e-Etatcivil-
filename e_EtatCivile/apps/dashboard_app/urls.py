from apps.dashboard_app.views.views_admin import gestion_agents_views,gestion_demande_views,gestion_citoyens_views
from apps.dashboard_app.views.views_agent import file_attente_views
from apps.dashboard_app.views.views_citoyen import servicesCitoyens_views

from apps.dashboard_app.views import CommonViews
from django.urls import include, path
from rest_framework.routers import DefaultRouter

routeur=DefaultRouter()
routeur.register(r'citoyens',gestion_citoyens_views.GestionClient,basename='citoyens')
routeur.register(r'utilisateurs',gestion_citoyens_views.UtilisateurView,basename='utilisateurs')
urlpatterns = [
    path('agents/',gestion_agents_views.GestionAgentsAPIView.as_view()),
    path('agents/<int:id_agent>/',gestion_agents_views.GestionAgentsAPIView.as_view()),
    path("demandes/", gestion_demande_views.DemandeActeNaissViews.as_view(), name="demandes-list"),
    path("demandes/<int:id_agent>/<int:id_demande>/", gestion_demande_views.DemandeActeNaissViews.as_view(), name="demandes-confirmation"),

    path("demandes/<int:id_demande>/", gestion_demande_views.DemandeActeNaissViews.as_view(), name="demandes"),
    # #Citoyen
    # path('citoyens/',gestion_citoyens_views.GestionClient.as_view()),
    # path('citoyens/<int:id_citoyen>/',gestion_citoyens_views.GestionClient.as_view()),
    path('',include(routeur.urls)),
    
    

    # path('dashboard/',CommonViews.dashboard,name='dashboard'),
    # path('gestion_agents/',gestion_agents_views.gestion_agents, name='gestion_agents'),
    # path('ajouter_agent/',gestion_agents_views.ajouter_agent,name='ajouter_agent'),
    # path('modifier_agent/<int:id_agent>/',gestion_agents_views.modifier_agent,name='modifier_agent'),
    # path('delete_agent/<int:id_agent>/',gestion_agents_views.supprimer_agent,name='supprimer_agent'),
    
    # path('gestion_citoyens/',gestion_citoyens_views.gestion_citoyens, name='gestion_citoyens'),

    # # path('modifier_citoyen/<int:id_citoyen>/',gestion_citoyens_views.modifier_citoyen,name='modifier_citoyen'),
    # path('delete_citoyen/<int:id_citoyen>/',gestion_citoyens_views.supprimer_citoyen,name='supprimer_citoyen'),
    # path('statistiques/',statistiques_views.stat, name='statistiques'),
    
    # path('file_attente/',file_attente_views.file_attente,name='file_attente'),
    
    # path('services/',servicesCitoyens_views.services,name='services'),
    # path('service/acte_naissance/',servicesCitoyens_views.servicesActeNaissance,name='service_an')
    # # path('statistiques/',views.stat,name='statistiques'),
    
    
   
]