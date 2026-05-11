from rest_framework import serializers
from django.utils import timezone
from .models import Utilisateur, Citoyen, Agent, Administrateur, Arondissement, Commune
from .services import generate_jwt
import bcrypt


# ─────────────────────────────────────────────
# Serializers de lecture
# ─────────────────────────────────────────────

class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Commune
        fields = ['id_commune', 'nom_commune', 'nom_maire']


class ArondissementSerializer(serializers.ModelSerializer):
    id_commune = CommuneSerializer(read_only=True)

    class Meta:
        model  = Arondissement
        fields = ['id_arondissement', 'num_arondissement',
                  'nom_arondissement', 'statut', 'id_commune']


class UtilisateurSerializer(serializers.ModelSerializer):
    id_arondissement = ArondissementSerializer(read_only=True)
    id_commune       = CommuneSerializer(read_only=True)

    class Meta:
        model  = Utilisateur
        fields = ['id_user', 'nom_user', 'prenom_user', 'email',
                  'role', 'date_inscription', 'id_arondissement', 'id_commune']


# ─────────────────────────────────────────────
# Inscription citoyen,agent
# ─────────────────────────────────────────────

class CitoyenRegisterSerializer(serializers.Serializer):
    nom_user         = serializers.CharField(max_length=100)
    prenom_user      = serializers.CharField(max_length=100)
    email            = serializers.EmailField()
    mdp_user         = serializers.CharField(write_only=True, min_length=6)
    id_commune       = serializers.IntegerField()
    id_arondissement = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate(self, data):
        id_commune = data.get('id_commune')
        id_aro     = data.get('id_arondissement')

        # Antananarivo (commune 1) → arrondissement obligatoire
        if id_commune == 1 and not id_aro:
            raise serializers.ValidationError(
                "L'arrondissement est obligatoire pour la commune d'Antananarivo."
            )
        return data

    def create(self, validated_data):
        id_aro     = validated_data.pop('id_arondissement', None)
        id_commune = validated_data.pop('id_commune')
        mdp_user   = validated_data.pop('mdp_user')

        aro     = Arondissement.objects.get(id_arondissement=id_aro) if id_aro else None
        commune = Commune.objects.get(id_commune=id_commune)

        mdp_hash = bcrypt.hashpw(mdp_user.encode('utf-8'), bcrypt.gensalt())

        user = Utilisateur.objects.create(
            nom_user         = validated_data['nom_user'],
            prenom_user      = validated_data['prenom_user'],
            email            = validated_data['email'],
            mdp_user         = mdp_hash.decode('utf-8'),
            role             = 'citoyen',
            id_arondissement = aro,
            id_commune       = commune,
            date_inscription = timezone.now().date()
        )
        Citoyen.objects.create(id_user=user)
        return user

import random
import string
from django.core.mail import send_mail
from django.conf import settings

class AgentCreateSerializer(serializers.Serializer):
    nom_user         = serializers.CharField(max_length=100)
    prenom_user      = serializers.CharField(max_length=100)
    email            = serializers.EmailField()
    matricule        = serializers.IntegerField()
    id_commune       = serializers.IntegerField()
    id_arondissement = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email déjà utilisé.")
        return value

    def validate_matricule(self, value):
        if Agent.objects.filter(matricule=value).exists():
            raise serializers.ValidationError("Matricule déjà utilisé.")
        return value

    def validate(self, data):
        if data.get('id_commune') == 1 and not data.get('id_arondissement'):
            raise serializers.ValidationError(
                "L'arrondissement est obligatoire pour Antananarivo."
            )
        return data

    def create(self, validated_data):
        id_aro     = validated_data.pop('id_arondissement', None)
        id_commune = validated_data.pop('id_commune')
        matricule  = validated_data.pop('matricule')

        aro     = Arondissement.objects.get(id_arondissement=id_aro) if id_aro else None
        commune = Commune.objects.get(id_commune=id_commune)

        # Générer mot de passe aléatoire
        mdp_clair = ''.join(random.choices(
            string.ascii_letters + string.digits, k=10
        ))
        mdp_hash = bcrypt.hashpw(mdp_clair.encode('utf-8'), bcrypt.gensalt())

        user = Utilisateur.objects.create(
            nom_user         = validated_data['nom_user'],
            prenom_user      = validated_data['prenom_user'],
            email            = validated_data['email'],
            mdp_user         = mdp_hash.decode('utf-8'),
            role             = 'agent',
            id_arondissement = aro,
            id_commune       = commune,
            date_inscription = timezone.now().date()
        )
        Agent.objects.create(id_user=user, matricule=matricule)

        # Envoyer le mot de passe par email
        send_mail(
            subject = "Vos identifiants — Système État Civil",
            message = (
                f"Bonjour {user.prenom_user} {user.nom_user},\n\n"
                f"Votre compte agent a été créé.\n\n"
                f"Email      : {user.email}\n"
                f"Mot de passe : {mdp_clair}\n\n"
                f"Veuillez changer votre mot de passe après votre première connexion.\n\n"
                f"Cordialement,\nSystème État Civil"
            ),
            from_email    = settings.EMAIL_HOST_USER,
            recipient_list= [user.email],
            fail_silently = False,
        )

        return user
# ─────────────────────────────────────────────
# Connexion
# ─────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    mdp_user = serializers.CharField(write_only=True)

    def validate(self, data):
        email    = data.get('email')
        mdp_user = data.get('mdp_user')

        try:
            user = Utilisateur.objects.select_related(
                'id_arondissement', 'id_commune'
            ).get(email=email)
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        if not bcrypt.checkpw(mdp_user.encode('utf-8'), user.mdp_user.encode('utf-8')):
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        data['user'] = user
        return data
