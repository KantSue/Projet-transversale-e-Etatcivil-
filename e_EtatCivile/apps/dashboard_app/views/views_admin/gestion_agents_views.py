from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent,Demande
from django.db.models import Count,Q
from apps.dashboard_app.services.services_admin.AgentManageService import AgentManageServices
from apps.dashboard_app.form import AjoutAgentForm
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.dashboard_app.serializers import NbDemande_DemandeValider,AGentCreate,AgentReadSerializer
from apps.accounts_app.services import verify_jwt



class GestionAgentsAPIView(APIView):
    def get(self, request, id_agent=None):
        if id_agent:
            try:
                agent = Agent.objects.select_related('id_user').get(id_user=id_agent)
            except Agent.DoesNotExist:
                return Response({"message": "Agent non trouvé"}, status=404)
            serializer = AgentReadSerializer(agent)
            return Response(serializer.data)

        # Retourner juste la liste des agents avec infos de base
        agents = Agent.objects.select_related('id_user', 'id_user__id_arondissement').all()
        
        data = []
        for a in agents:
            u = a.id_user
            data.append({
                "id_agent"        : a.id_agent if hasattr(a, 'id_agent') else u.id_user,
                "nom_user"        : u.nom_user,
                "prenom_user"     : u.prenom_user,
                "email"           : u.email,
                "arrondissement"  : u.id_arondissement.nom_arondissement if u.id_arondissement else "N/A",
                "commune"         : u.id_commune.nom_commune if u.id_commune else "N/A",
            })
        
        return Response(data, status=200)
        
    def post(self,request):
        
        if request.method=='POST': 
            agent_form=AjoutAgentForm(request.POST or None)
            if agent_form.is_valid():
                data=agent_form.cleaned_data               
                user=AgentManageServices().createAgent(data)
                serializer=AGentCreate(data)
                if not serializer.is_valid():
                    return Response(serializer.errors,status=400)
                return Response({
                        "message": "Agent créé",
                        "email": user.email,
                        "mot_de_passe": user.generated_password
                    }, status=201)
            return Response(agent_form.errors, status=400)

    def delete(self,request,id_agent):
        try:
            Agent.objects.filter(id_user=id_agent).delete()
            Utilisateur.objects.filter(id_user=id_agent).delete()
            return Response({"message":"Agent supprimé"})
        except BaseException:
            return Response({"message":"Erreur lors de la suppression de l'agent"},status=500)
        
    def put(self, request, id_agent):  
        try:
            agent = Agent.objects.select_related('id_user').get(id_user=id_agent)
        except Agent.DoesNotExist:
            return Response({"message": "Agent non trouvé"}, status=404)

        serializer = AGentCreate(data=request.data)

        if serializer.is_valid():
            AgentManageServices().updateAgent(agent, serializer.validated_data)
            return Response({"message": "Agent mis à jour"}, status=200)

        return Response(serializer.errors, status=400)
  
            

class ArrondissementsPublicView(APIView):
    def get(self, request):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        # Récupérer la commune du citoyen depuis le JWT
        id_commune = payload.get('id_commune')

        arondissements = Arondissement.objects.select_related('id_commune').filter(
            id_commune=id_commune
        ) if id_commune else Arondissement.objects.select_related('id_commune').all()

        # Si aucun arrondissement pour cette commune — retourner tous les disponibles
        if not arondissements.exists():
            arondissements = Arondissement.objects.select_related('id_commune').filter(
                statut='disponible'
            )

        data = [{
            "id_arondissement" : a.id_arondissement,
            "nom_arondissement": a.nom_arondissement,
            "num_arondissement": a.num_arondissement,
            "statut"           : a.statut,
            "commune"          : a.id_commune.nom_commune if a.id_commune else "N/A",
        } for a in arondissements]

        return Response(data, status=200)


