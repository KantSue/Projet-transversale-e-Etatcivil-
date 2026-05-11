# serializers.py
from rest_framework import serializers

from datetime import date, datetime
from django.utils import timezone
from rest_framework import serializers
from apps.dashboard_app.services.demande_service import generer_num_demande
from .models import (
    Acte, ActeDeces, ActeMariage, ActeNaissance, ActePersonne,
    Administrateur, Agent, Archive, Arondissement, Citoyen, Commune,
    Declaration, DeclarationPiece, Demande, Paiement, Personne,
    PieceJoint, DemandePersonne, TypeActe, Utilisateur,JournalAudit
)

class NbDemande_DemandeValider(serializers.ModelSerializer):
    nb_demande=serializers.IntegerField()
    demande_valider=serializers.IntegerField()
    class Meta:
        model=Agent
        fields=['nb_demande','demande_valider']

class AGentCreate(serializers.Serializer):
    nom_user=serializers.CharField(max_length=100)
    prenom_user=serializers.CharField(max_length=100)
    email=serializers.EmailField()    
    matricule= serializers.IntegerField()
    id_arondissement = serializers.PrimaryKeyRelatedField(
        queryset=Arondissement.objects.all(),
        required=False,
        allow_null=True
    )

class AgentReadSerializer(serializers.ModelSerializer):
    nom_user    = serializers.CharField(source='id_user.nom_user')
    prenom_user = serializers.CharField(source='id_user.prenom_user')
    email       = serializers.CharField(source='id_user.email')
    role        = serializers.CharField(source='id_user.role')

    class Meta:
        model = Agent
        fields = ['matricule', 'nom_user', 'prenom_user', 'email', 'role']
class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = '__all__'
        extra_kwargs = {
            'mdp_user': {'write_only': True}  # Sécurité : mot de passe jamais retourné
        }      
        

        
class CitoyenDetails(serializers.ModelSerializer):
    nb_demande=serializers.IntegerField()
    total_paiement=serializers.FloatField()
    dernier_demande=serializers.DateField()
    class Meta:
        model=Demande
        fields=['nb_demande','total_paiement','dernier_demande']

class ArondissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arondissement
        fields = '__all__'


class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commune
        fields = '__all__'

class PersonneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personne
        fields = '__all__'
        read_only_fields = ['id_personne']

    def create(self, validated_data):
        date_nais  = validated_data.get('date_naissance')
        date_deces = validated_data.get('date_deces')

        # Validation date de naissance
        if date_nais >= datetime.now().date():
            raise serializers.ValidationError(
                "La date de naissance doit être antérieure à aujourd'hui."
            )

        # Validation date de décès (optionnelle)
        if date_deces and date_deces >= datetime.now().date():
            raise serializers.ValidationError(
                "La date de décès doit être antérieure à aujourd'hui."
            )

        # Validation cohérence naissance / décès
        if date_deces and date_deces <= date_nais:
            raise serializers.ValidationError(
                "La date de décès doit être postérieure à la date de naissance."
            )

        return Personne.objects.create(**validated_data)

class AgentSerializer(serializers.ModelSerializer):
    id_user = UtilisateurSerializer(read_only=True)
    id_user_id = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(), source='id_user', write_only=True
    )

    class Meta:
        model = Agent
        fields = '__all__'


class AdministrateurSerializer(serializers.ModelSerializer):
    id_user = UtilisateurSerializer(read_only=True)
    id_user_id = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(), source='id_user', write_only=True
    )

    class Meta:
        model = Administrateur
        fields = '__all__'


class CitoyenSerializer(serializers.ModelSerializer):
    id_user = UtilisateurSerializer()
   

    class Meta:
        model = Citoyen
        fields = '__all__'

class TypeActeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeActe
        fields = ['id_type_acte', 'libelle'] 

class ActeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Acte
        fields = '__all__'
        read_only_fields=['id_acte']

class ActeNaissanceSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
   
    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
    

    class Meta:
        model = ActeNaissance
        fields = '__all__'


class ActeMariageSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
   

    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
   
    class Meta:
        model = ActeMariage
        fields = '__all__'


class ActeDecesSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)

    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
    defunt_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='defunt', write_only=True
    )

    class Meta:
        model = ActeDeces
        fields = '__all__'


class ActePersonneSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
    id_personne = PersonneSerializer(read_only=True)

    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
    id_personne_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='id_personne', write_only=True
    )

    class Meta:
        model = ActePersonne
        fields = '__all__'


class ArchiveSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )

    class Meta:
        model = Archive
        fields = '__all__'

class DemandePersonneSerializer(serializers.ModelSerializer):
    personne=PersonneSerializer()
    class Meta:
        model=DemandePersonne
        fields='__all__'
class DemandeSerializer(serializers.ModelSerializer):
     class Meta:
        model=Demande
        fields='__all__'
        
class DemandeCreateSerializer(serializers.ModelSerializer):
    # Personnes optionnelles selon le type
    # Naissance
    pere   = PersonneSerializer(required=False, allow_null=True)
    mere   = PersonneSerializer(required=False, allow_null=True)
    enfant = PersonneSerializer(required=False, allow_null=True)
    # Mariage
    epoux1      = PersonneSerializer(required=False, allow_null=True)
    epoux2      = PersonneSerializer(required=False, allow_null=True)
    pere_epoux1 = PersonneSerializer(required=False, allow_null=True)
    mere_epoux1 = PersonneSerializer(required=False, allow_null=True)
    pere_epoux2 = PersonneSerializer(required=False, allow_null=True)
    mere_epoux2 = PersonneSerializer(required=False, allow_null=True)
    # Deces
    defunt      = PersonneSerializer(required=False, allow_null=True)
    pere_defunt = PersonneSerializer(required=False, allow_null=True)
    mere_defunt = PersonneSerializer(required=False, allow_null=True)

    id_arrondissement = serializers.PrimaryKeyRelatedField(
        queryset=Arondissement.objects.all(),
        required=False, allow_null=True
    )

    class Meta:
        model  = Demande
        fields = '__all__'
        read_only_fields = ['id_agent', 'id_acte', 'num_demande']

    def validate(self, data):
        type_acte  = data.get('id_type_acte')
        id_commune = data.get('id_commune')
        id_aro     = data.get('id_arrondissement')

        # Arrondissement obligatoire pour Antananarivo
        if id_commune and id_commune.id_commune == 1 and not id_aro:
            raise serializers.ValidationError(
                "L'arrondissement est obligatoire pour Antananarivo."
            )

        if not type_acte:
            return data

        libelle = type_acte.libelle.lower()

        # Validation naissance
        if libelle == 'acte naissance':
            if not data.get('enfant'):
                raise serializers.ValidationError("L'enfant est obligatoire.")
            enfant_dn = data['enfant'].get('date_naissance')
            if data.get('pere') and data['pere'].get('date_naissance') >= enfant_dn:
                raise serializers.ValidationError(
                    "La date de naissance du père doit être antérieure à celle de l'enfant."
                )
            if data.get('mere') and data['mere'].get('date_naissance') >= enfant_dn:
                raise serializers.ValidationError(
                    "La date de naissance de la mère doit être antérieure à celle de l'enfant."
                )

        # Validation mariage
        elif libelle == 'acte mariage':
            if not data.get('epoux1') or not data.get('epoux2'):
                raise serializers.ValidationError(
                    "Les deux époux sont obligatoires."
                )

        # Validation décès
        elif 'deces' in libelle or 'décès' in libelle:
            if not data.get('defunt'):
                raise serializers.ValidationError("Le défunt est obligatoire.")

        return data

    def create(self, validated_data):
        # Extraire toutes les personnes
        personnes_roles = {
            'pere'       : validated_data.pop('pere',        None),
            'mere'       : validated_data.pop('mere',        None),
            'enfant'     : validated_data.pop('enfant',      None),
            'epoux1'     : validated_data.pop('epoux1',      None),
            'epoux2'     : validated_data.pop('epoux2',      None),
            'pere_epoux1': validated_data.pop('pere_epoux1', None),
            'mere_epoux1': validated_data.pop('mere_epoux1', None),
            'pere_epoux2': validated_data.pop('pere_epoux2', None),
            'mere_epoux2': validated_data.pop('mere_epoux2', None),
            'defunt'     : validated_data.pop('defunt',      None),
            'pere_defunt': validated_data.pop('pere_defunt', None),
            'mere_defunt': validated_data.pop('mere_defunt', None),
        }

        validated_data['num_demande'] = generer_num_demande()
        validated_data.setdefault('statut_demande', 'en attente')

        demande = Demande.objects.create(**validated_data)

        # Créer personne + demande_personne pour chaque rôle
        for role, data in personnes_roles.items():
            if data:
                personne = Personne.objects.create(**data)
                DemandePersonne.objects.create(
                    demande  = demande,
                    personne = personne,
                    role     = role
                )

        return demande

class DemandeReadSerializer(serializers.ModelSerializer):
    personnes = DemandePersonneSerializer(
        source='demandepersonne',  
        many=True
    )

    class Meta:
        model = Demande
        fields = '__all__'
        
class DemandeRefuSerializer(serializers.ModelSerializer):
    class Meta:
        model=Demande
        fields=['id_demande','motif_refus','statut_demande']
class DemandeAccepteSerializer(serializers.ModelSerializer):
    class Meta:
        model=Demande
        fields=['id_demande','statut_demande']


class DemandeHeapSerializer(serializers.Serializer):
    id_demande = serializers.IntegerField()
    date_depot = serializers.DateTimeField()
    class Meta:
        model=Demande
        fields=['id_demande','date_depot']

class PaiementSerializer(serializers.ModelSerializer):
    id_demande = DemandeSerializer(read_only=True)
    id_demande_id = serializers.PrimaryKeyRelatedField(
        queryset=Demande.objects.all(), source='id_demande', write_only=True
    )

    class Meta:
        model = Paiement
        fields = '__all__'


class DeclarationSerializer(serializers.ModelSerializer):
    id_paiement = PaiementSerializer(read_only=True)
    id_acte = ActeSerializer(read_only=True)

    id_paiement_id = serializers.PrimaryKeyRelatedField(
        queryset=Paiement.objects.all(), source='id_paiement', write_only=True, allow_null=True, required=False
    )
    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = Declaration
        fields = '__all__'


class DeclarationPieceSerializer(serializers.ModelSerializer):
    id_declaration = DeclarationSerializer(read_only=True)
    id_piece = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DeclarationPiece
        fields = '__all__'


class PieceJointSerializer(serializers.ModelSerializer):
    id_demande = DemandeSerializer(read_only=True)
    id_demande_id = serializers.PrimaryKeyRelatedField(
        queryset=Demande.objects.all(), source='id_demande', write_only=True
    )

    class Meta:
        model = PieceJoint
        fields = '__all__'
class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalAudit
        fields = '__all__'
        read_only_fields = ['id_journal','id_demande','id_agent']

    # Dans le JournalSerializer
    def create(self, validated_data):
        action  = validated_data.get('action')
        motif   = validated_data.get('motif')
        demande = validated_data.get('demande')

        if action == 'REFUSER' and not motif:
            raise serializers.ValidationError("Le motif est requis pour refuser une demande.")

        dernier_journal = JournalAudit.objects.filter(demande=demande).last()

        if dernier_journal:
            dernier_action = dernier_journal.action

            if dernier_action in ['VALIDER', 'REFUSER']:
                raise serializers.ValidationError(
                    f"La demande a déjà été {dernier_action.lower()}e et ne peut plus être modifiée."
                )

            if dernier_action == 'CONSULTER' and action == 'CONSULTER':
                raise serializers.ValidationError(
                    "La demande est déjà en cours de consultation."
                )

        if action == 'CONSULTER':
            demande.statut_demande = 'EN COURS'

        elif action == 'VALIDER':
            demande.statut_demande = 'VALIDER'
            demande.date_maj = date.today()

        elif action == 'REFUSER':
            demande.statut_demande = 'REFUSER'
            demande.motif_refus    = motif
            demande.date_maj = date.today()

        else:
            raise serializers.ValidationError(f"Action '{action}' non reconnue.")

        demande.save()

        # Création du journal
        validated_data.setdefault('horodatage', timezone.now())
        journal = JournalAudit.objects.create(**validated_data)
        return journal

# class StatistiqueSerializer(serializers.ModelSerializer):
#     id_admin = AdministrateurSerializer(read_only=True)
#     id_admin_id = serializers.PrimaryKeyRelatedField(
#         queryset=Administrateur.objects.all(), source='id_admin', write_only=True, allow_null=True, required=False
#     )

#     class Meta:
#         model = Statistique
#         fields = '__all__'


