from apps.dashboard_app.views.views_admin import actes_views,gestion_agents_views,gestion_demande_views,gestion_citoyens_views,statistiques_views,gestion_commune_view
from apps.dashboard_app.views.views_agent import historiques_view,file_attente_views,Recherche_acte_view,generate_pdf_view
from apps.dashboard_app.views.views_citoyen import servicesCitoyens_views,paiement_view
from apps.dashboard_app.views.views_agent import Dijkstra_view


from apps.dashboard_app.views import CommonViews
from django.urls import include, path
from rest_framework.routers import DefaultRouter

routeur=DefaultRouter()
routeur.register(r'citoyens',gestion_citoyens_views.GestionClient,basename='citoyens')
routeur.register(r'utilisateurs',gestion_citoyens_views.UtilisateurView,basename='utilisateurs')
urlpatterns = [
    path('agents/',gestion_agents_views.GestionAgentsAPIView.as_view()),
    path('agents/<int:id_agent>/',gestion_agents_views.GestionAgentsAPIView.as_view()),
    path('demandes/historique/', historiques_view.HistoriqueAgentView.as_view(), name='historique-agent'),
# Les URLs deviennent
    path("demandes/",gestion_demande_views.DemandeActeViews.as_view()),
    path("demandes/<int:id_demande>/",gestion_demande_views.DemandeActeViews.as_view()),
    path("demandes/<int:id_agent>/<int:id_demande>/", gestion_demande_views.DemandeActeViews.as_view()),
    path('demandes/citoyen/', servicesCitoyens_views.MesDemandesView.as_view(), name='mes-demandes'),
    path('demandes/', file_attente_views.FileAttenteView.as_view(), name='file-attente'),
    
    path("recherche/", Recherche_acte_view.SearchActeView.as_view(), name="demandes"),
    path("recherche/suggestions/", Recherche_acte_view.SuggestionsView.as_view(), name="suggestions"),

    path('arrondissements/<int:id_arondissement>/verifier/',Dijkstra_view.VerifierArondissementView.as_view(), name='verifier-arrondissement'),
    path('demandes/<int:id_demande>/acte/pdf/',generate_pdf_view.GeneratePDFView.as_view(),name='generer-pdf'),
    
    path('paiements/', paiement_view.PaiementEtDemandeView.as_view(), name='paiement'),

    path('stats/',              statistiques_views.StatistiquesView.as_view(),   name='stats'),
    path('stats/demandes-jour/', statistiques_views.DemandesJourView.as_view(), name='stats-jour'),
    
    # Dans urls.py
    path('actes/', actes_views.ActesListView.as_view(), name='actes-list'),
    path('actes/<int:id_acte>/', gestion_demande_views.ActeDetailView.as_view(), name='acte-detail'),
    path('demandes/<int:id_demande>/envoyer-pdf/', generate_pdf_view.EnvoyerPDFView.as_view(), name='envoyer-pdf'),
    path('demandes/<int:id_demande>/pdf/',generate_pdf_view.PdfCitoyenView.as_view(), name='pdf-citoyen'),
    
    path('arrondissements/public/', gestion_agents_views.ArrondissementsPublicView.as_view()),
    path('arrondissements/', gestion_commune_view.GestionArondissementView.as_view()),
    path('arrondissements/<int:id_arondissement>/', gestion_commune_view.GestionArondissementView.as_view()),
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
