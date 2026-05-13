from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent,Demande
from apps.accounts_app.services import *
from django.db.models import Count,Max,Sum
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from apps.dashboard_app.services.services_admin.AgentManageService import *
from apps.dashboard_app.serializers import UtilisateurSerializer,CitoyenSerializer

class GestionClient(ModelViewSet):
    queryset=Citoyen.objects.all()
    serializer_class=CitoyenSerializer
class UtilisateurView(ModelViewSet):
    queryset=Utilisateur.objects.all()
    serializer_class=UtilisateurSerializer
    
class GestionClient(ModelViewSet):
    queryset = Citoyen.objects.select_related('id_user').all()
    serializer_class = CitoyenSerializer

    def list(self, request, *args, **kwargs):
        citoyens = Citoyen.objects.select_related(
            'id_user',
            'id_user__id_commune',
            'id_user__id_arondissement'
        ).all()

        data = []
        for c in citoyens:
            u = c.id_user

            # Filtrer par l'objet Citoyen directement
            demandes = Demande.objects.filter(id_citoyen=c)

            data.append({
                "id_user": {
                    "id_user"         : u.id_user,
                    "nom_user"        : u.nom_user,
                    "prenom_user"     : u.prenom_user,
                    "email"           : u.email,
                    "date_inscription": str(u.date_inscription) if u.date_inscription else None,
                    "commune"         : u.id_commune.nom_commune if u.id_commune else "N/A",
                    "arrondissement"  : u.id_arondissement.nom_arondissement if u.id_arondissement else None,
                },
                "demandes": {
                    "total"     : demandes.count(),
                    "en_attente": demandes.filter(statut_demande='EN ATTENTE').count(),
                    "valider"   : demandes.filter(statut_demande='VALIDER').count(),
                    "terminer"  : demandes.filter(statut_demande='TERMINER').count(),
                    "refuser"   : demandes.filter(statut_demande='REFUSER').count(),
                }
            })

        return Response(data, status=200)
            
