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
    
    # def get(self,request,id_citoyen=None):
    #     if id_citoyen:
    #         try:
    #             detail=Citoyen.objects.select_related('id_user').annotate(
    #                             nb_demandes=Count('demande', distinct=True),

    #                             total_paiement=Sum(
    #                                 'demande__paiement__montant'
    #                             ),

    #                             derniere_demande=Max('demande__date_depot')
    #                         )                
    #         except Citoyen.DoesNotExist:
    #             return Response({"message :nb_demande,totalDemande,derniere_demande non trouvé"},status=400)
    #         serializer_detals=CitoyenDetails(detail)
    #         return Response({serializer_detals.data},many=True)
    #     citoyens=Citoyen.objects.select_related('id_user')
    #     serializer=CitoyenRead(citoyens)
    #     return Response({'citoyen':serializer.data},many=True)
    
    
    
    # def delete(self,request,id_citoyen):
    #     try:
    #         Citoyen.objects.filter(id_user=id_citoyen).delete()
    #         Utilisateur.objects.filter(id_user=id_citoyen).delete()
    #         return Response({"message":"Agent supprimé"})
    #     except BaseException:
    #         return Response({"message":"Erreur lors de la suppression de l'agent"},status=500)

    
    # def gestion_citoyens(request):
    #     context = {}

    #     context['citoyens'] = (
    #     Citoyen.objects
    #         .select_related('id_user')
    #         .annotate(
    #             nb_demandes=Count('demande', distinct=True),

    #             total_paiement=Sum(
    #                 'demande__paiement__montant'
    #             ),

    #             derniere_demande=Max('demande__date_depot')
    #         )
    #     )

    #     return render(request, 'dash_admin/admin_citoyen/citoyenGestion.html', {'context':context})
    # def supprimer_citoyen(id_citoyen):
    #     Citoyen.objects.filter(id_user=id_citoyen).delete()
    #     Utilisateur.objects.filter(id_user=id_citoyen).delete()
    #     return redirect('gestion_citoyens')

    # def modifier_citoyen(request,id_citoyen):
    #     if request.method=='POST':
    #         id_citoyen=request.POST.get('id_citoyen')
    #         nom_user=request.POST.get('nom_user')
    #         prenom_user=request.POST.get('prenom_user')
    #         email=request.POST.get('email')
    #         id_arondissement=request.POST.get('id_arondissement')

    #         Utilisateur.objects.filter(id_user=id_citoyen).update(nom_user=nom_user,prenom_user=prenom_user,email=email,id_arondissement=id_arondissement)
    #         Agent.objects.filter(id_user=id_citoyen).update
    #         return redirect('gestion_agents')
    #     citoyen=Citoyen.objects.select_related('id_user').get(id_user=id_citoyen)
        
    #     arrondissements = Arondissement.objects.select_related('id_commune').order_by('id_commune__nom_commune')

    #     return render(request, 'dash_admin/admin_agents/update_citoyen.html', {
    #         'citoyen': citoyen,
    #         'arrondissements': arrondissements
    #     })