# serializers.py
from rest_framework import serializers

from datetime import datetime
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
    type_acte = TypeActeSerializer(read_only=True)
    id_type_acte = serializers.PrimaryKeyRelatedField(
        queryset=TypeActe.objects.all(),
        source='type_acte',
        write_only=True
    )

    class Meta:
        model = Acte
        fields = '__all__'


class ActeNaissanceSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
    enfant = PersonneSerializer(read_only=True)
    pere = PersonneSerializer(read_only=True)
    mere = PersonneSerializer(read_only=True)

    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
    enfant_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='enfant', write_only=True
    )
    pere_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='pere', write_only=True, allow_null=True, required=False
    )
    mere_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='mere', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = ActeNaissance
        fields = '__all__'


class ActeMariageSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
    epoux1 = PersonneSerializer(read_only=True)
    epoux2 = PersonneSerializer(read_only=True)

    id_acte_id = serializers.PrimaryKeyRelatedField(
        queryset=Acte.objects.all(), source='id_acte', write_only=True
    )
    epoux1_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='epoux1', write_only=True
    )
    epoux2_id = serializers.PrimaryKeyRelatedField(
        queryset=Personne.objects.all(), source='epoux2', write_only=True
    )

    class Meta:
        model = ActeMariage
        fields = '__all__'


class ActeDecesSerializer(serializers.ModelSerializer):
    id_acte = ActeSerializer(read_only=True)
    defunt = PersonneSerializer(read_only=True)

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
    pere = PersonneSerializer()
    mere = PersonneSerializer()
    enfant = PersonneSerializer()
   
    class Meta:
        model = Demande
        fields = '__all__'
        read_only_fields=['id_agent','id_acte', 'num_demande']
    def create(self, validated_data):
        enfant_dn = validated_data['enfant']['date_naissance']
        
        if validated_data['pere']['date_naissance'] >= enfant_dn:
            raise serializers.ValidationError("La date de naissance du père doit être antérieure à celle de l'enfant.")
        
        if validated_data['mere']['date_naissance'] >= enfant_dn:
            raise serializers.ValidationError("La date de naissance de la mère doit être antérieure à celle de l'enfant.")

        pere_data=validated_data.pop('pere')
        mere_data=validated_data.pop('mere')
        enfant_data=validated_data.pop('enfant')
        validated_data['num_demande']=generer_num_demande()
        validated_data.setdefault('statut_demande', 'en attente')

        pere=Personne.objects.create(**pere_data)
        mere=Personne.objects.create(**mere_data)
        enfant=Personne.objects.create(**enfant_data)
        
        demande=Demande.objects.create(**validated_data)
        
        DemandePersonne.objects.create(demande=demande, personne=pere, role='pere')
        DemandePersonne.objects.create(demande=demande, personne=mere, role='mere')
        DemandePersonne.objects.create(demande=demande, personne=enfant, role='enfant')
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

        elif action == 'REFUSER':
            demande.statut_demande = 'REFUSER'
            demande.motif_refus    = motif

        else:
            raise serializers.ValidationError(f"Action '{action}' non reconnue.")

        demande.save()

        # Création du journal
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


