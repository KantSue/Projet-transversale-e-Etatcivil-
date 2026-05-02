from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.dashboard_app.serializers import (
    DemandePersonneSerializer, PersonneSerializer, DemandeCreateSerializer,DemandeSerializer,DemandeHeapSerializer
)
from apps.dashboard_app.form import PersonneForm
from apps.dashboard_app.models import Demande,DemandePersonne
from apps.dashboard_app.services.demande_service import *
class DemandeActeNaissViews(APIView):
    def post(self, request):
        
        pere_form   = PersonneForm(request.data, prefix='pere')
        mere_form   = PersonneForm(request.data, prefix='mere')
        enfant_form = PersonneForm(request.data, prefix='enfant')

        type_acte  = request.data.get('type_acte')
        num_acte   = request.data.get('num_acte')
        id_citoyen = request.data.get('id_citoyen')
        id_commune = request.data.get('id_commune')

        # Validation préliminaire
        if not (pere_form.is_valid() and mere_form.is_valid() and enfant_form.is_valid()):
            return Response({
                "message": "Formulaires invalides",
                "errors": {
                    "pere":   pere_form.errors,
                    "mere":   mere_form.errors,
                    "enfant": enfant_form.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if not type_acte or not int(type_acte) > 0 or not num_acte:
            return Response({"message": "type_acte ou num_acte invalide"}, status=status.HTTP_400_BAD_REQUEST)

        # Validation des serializers personnes
        serializer_pere   = PersonneSerializer(data=pere_form.cleaned_data)
        serializer_mere   = PersonneSerializer(data=mere_form.cleaned_data)
        serializer_enfant = PersonneSerializer(data=enfant_form.cleaned_data)

        if not (serializer_pere.is_valid() and serializer_mere.is_valid() and serializer_enfant.is_valid()):
            return Response({
                "message": "Données personnes invalides",
                "errors": {
                    "pere":   serializer_pere.errors,
                    "mere":   serializer_mere.errors,
                    "enfant": serializer_enfant.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer_demande = DemandeCreateSerializer(data={
            'id_type_acte': type_acte,
            'num_acte':     num_acte,
            'id_commune':   id_commune,
            'id_citoyen':   id_citoyen,
        })

        if not serializer_demande.is_valid():
            return Response({
                "message": "Données demande invalides",
                "errors": serializer_demande.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sauvegarde atomique
        try:
            with transaction.atomic():
                pere_instance   = serializer_pere.save()
                mere_instance   = serializer_mere.save()
                enfant_instance = serializer_enfant.save()
                demande         = serializer_demande.save()

                for instance, role in [(pere_instance,   'pere'),(mere_instance,   'mere'),(enfant_instance, 'enfant'),]:
                    s = DemandePersonneSerializer(data={
                        'id_personne': instance.pk,
                        'id_demande':  demande.pk,
                        'role':        role,
                    })
                    if not s.is_valid():
                        raise ValueError(s.errors)
                    s.save()

        except Exception as e:
            return Response({"message": "Erreur lors de la sauvegarde", "detail": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Demande créée avec succès"}, status=status.HTTP_201_CREATED)
    
    
    def get(self, request):
        demandes = list(
                Demande.objects
                .filter(statut_demande='en attente')
                .prefetch_related('demande_personne__id_personne')
            )        
        demandes_triees = heap_sort_demandes(demandes)

        serializer = DemandeSerializer(demandes_triees, many=True)

        return Response({"demandes": serializer.data}, status=200)
###dECES
class DemandeActeDecesViews(APIView):
    def post(self, request):
        pere_form   = PersonneForm(request.data, prefix='pere')
        mere_form   = PersonneForm(request.data, prefix='mere')
        defunt_form = PersonneForm(request.data, prefix='defunt')

        type_acte  = request.data.get('type_acte')
        num_acte   = request.data.get('num_acte')
        id_citoyen = request.data.get('id_citoyen')
        id_commune = request.data.get('id_commune')

        # Validation préliminaire
        if not (pere_form.is_valid() and mere_form.is_valid() and defunt_form.is_valid()):
            return Response({
                "message": "Formulaires invalides",
                "errors": {
                    "pere":   pere_form.errors,
                    "mere":   mere_form.errors,
                    "defunt": defunt_form.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if not type_acte or not int(type_acte) > 0 or not num_acte:
            return Response({"message": "type_acte ou num_acte invalide"}, status=status.HTTP_400_BAD_REQUEST)

        # Validation des serializers personnes
        serializer_pere   = PersonneSerializer(data=pere_form.cleaned_data)
        serializer_mere   = PersonneSerializer(data=mere_form.cleaned_data)
        serializer_defunt= PersonneSerializer(data=defunt_form.cleaned_data)

        if not (serializer_pere.is_valid() and serializer_mere.is_valid() and serializer_defunt.is_valid()):
            return Response({
                "message": "Données personnes invalides",
                "errors": {
                    "pere":   serializer_pere.errors,
                    "mere":   serializer_mere.errors,
                    "defunt": serializer_defunt.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer_demande = DemandeCreateSerializer(data={
            'id_type_acte': type_acte,
            'num_acte':     num_acte,
            'id_commune':   id_commune,
            'id_citoyen':   id_citoyen,
        })

        if not serializer_demande.is_valid():
            return Response({
                "message": "Données demande invalides",
                "errors": serializer_demande.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sauvegarde atomique
        try:
            with transaction.atomic():
                pere_instance   = serializer_pere.save()
                mere_instance   = serializer_mere.save()
                defunt_instance = serializer_defunt.save()
                demande         = serializer_demande.save()

                for instance, role in [(pere_instance,   'pere'),(mere_instance,   'mere'),(defunt_instance, 'defunt'),]:
                    s = DemandePersonneSerializer(data={
                        'id_personne': instance.pk,
                        'id_demande':  demande.pk,
                        'role':        role,
                    })
                    if not s.is_valid():
                        raise ValueError(s.errors)
                    s.save()

        except Exception as e:
            return Response({"message": "Erreur lors de la sauvegarde", "detail": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Demande créée avec succès"}, status=status.HTTP_201_CREATED)

##MARIAGE
##dECES
class DemandeActeMariageViews(APIView):
    def post(self, request):
        pere_form   = PersonneForm(request.data, prefix='pere')
        mere_form   = PersonneForm(request.data, prefix='mere')
        pere_form1   = PersonneForm(request.data, prefix='pere1')
        mere_form1  = PersonneForm(request.data, prefix='mere1')
        epoux1_form = PersonneForm(request.data, prefix='epoux1')
        epoux2_form = PersonneForm(request.data, prefix='epoux2')

        type_acte  = request.data.get('type_acte')
        num_acte   = request.data.get('num_acte')
        id_citoyen = request.data.get('id_citoyen')
        id_commune = request.data.get('id_commune')

        # Validation préliminaire
        if not (pere_form.is_valid() and mere_form.is_valid() and pere_form1.is_valid() and mere_form1.is_valid() and epoux1_form.is_valid() and epoux2_form.is_valid()):
            return Response({
                "message": "Formulaires invalides",
                "errors": {
                    "pere":   pere_form.errors,
                    "mere":   mere_form.errors,
                    "pere1":   pere_form1.errors,
                    "mere1":   mere_form1.errors,
                    "epoux1": epoux1_form.errors,
                    "epoux2": epoux2_form.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if not type_acte or not int(type_acte) > 0 or not num_acte:
            return Response({"message": "type_acte ou num_acte invalide"}, status=status.HTTP_400_BAD_REQUEST)

        # Validation des serializers personnes
        serializer_pere   = PersonneSerializer(data=pere_form.cleaned_data)
        serializer_mere   = PersonneSerializer(data=mere_form.cleaned_data)
        serializer_pere1   = PersonneSerializer(data=pere_form1.cleaned_data)
        serializer_mere1   = PersonneSerializer(data=mere_form1.cleaned_data)
        serializer_epoux1= PersonneSerializer(data=epoux1_form.cleaned_data)
        serializer_epoux2= PersonneSerializer(data=epoux2_form.cleaned_data)

        if not (serializer_pere.is_valid() and serializer_mere.is_valid() and serializer_pere1.is_valid() and serializer_mere1.is_valid() and serializer_epoux1.is_valid() and serializer_epoux2.is_valid()):
            return Response({
                "message": "Données personnes invalides",
                "errors": {
                    "pere":   serializer_pere.errors,
                    "mere":   serializer_mere.errors,
                    "pere1":   serializer_pere1.errors,
                    "mere1":   serializer_mere1.errors,
                    "epoux1": serializer_epoux1.errors,
                    "epoux2": serializer_epoux2.errors,
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer_demande = DemandeCreateSerializer(data={
            'id_type_acte': type_acte,
            'num_acte':     num_acte,
            'id_commune':   id_commune,
            'id_citoyen':   id_citoyen,
        })

        if not serializer_demande.is_valid():
            return Response({
                "message": "Données demande invalides",
                "errors": serializer_demande.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sauvegarde atomique
        try:
            with transaction.atomic():
                pere_instance   = serializer_pere.save()
                mere_instance   = serializer_mere.save()
                pere1_instance   = serializer_pere1.save()
                mere1_instance   = serializer_mere1.save()
                epoux1_instance = serializer_epoux1.save()
                epoux2_instance = serializer_epoux2.save()
                demande         = serializer_demande.save()

                for instance, role in [(pere_instance,   'pere_epoux'),(mere_instance,   'mere_epoux'),(pere1_instance,   'pere_epouse'),(mere1_instance,   'mere_epouse'),(epoux1_instance, 'epoux1'),(epoux2_instance, 'epoux2')]:
                    s = DemandePersonneSerializer(data={
                        'id_personne': instance.pk,
                        'id_demande':  demande.pk,
                        'role':        role,
                    })
                    if not s.is_valid():
                        raise ValueError(s.errors)
                    s.save()

        except Exception as e:
            return Response({"message": "Erreur lors de la sauvegarde", "detail": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Demande créée avec succès"}, status=status.HTTP_201_CREATED)