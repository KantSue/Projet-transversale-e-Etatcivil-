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



class GestionAgentsAPIView(APIView):
    def get(self,request,id_agent=None):
        if id_agent:
            try:
                agent=Agent.objects.select_related('id_user').get(id_user=id_agent)
            except Agent.DoesNotExist:
                return Response({"message":"Agent non trouvé"},status=404)
            serializer = AgentReadSerializer(agent)
            return Response(serializer.data)

        agents=Agent.objects.annotate(nb_demande=Count('demande'),
                                        demande_valider=Count('demande',filter=Q (demande__statut_demande='validée')))
        serializer= NbDemande_DemandeValider(agents,many=True)
        serializer_agent=AgentReadSerializer(agents,many=True)
        return Response({"demandes": serializer.data, "agents": serializer_agent.data})
        
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
  
            

        


