import bcrypt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Utilisateur, Commune, Arondissement
from .serializers import CitoyenRegisterSerializer, LoginSerializer, UtilisateurSerializer,AgentCreateSerializer
from .services import generate_jwt, verify_jwt


# ─────────────────────────────────────────────
# Inscription Citoyen et agents
# ─────────────────────────────────────────────
class AgentCreateView(APIView):
    """
    POST /auth/agents/
    Réservé aux administrateurs uniquement.
    Crée un agent et envoie son mot de passe par email.
    """
    def post(self, request):
        # Vérifier que c'est un admin
        token = _get_token(request)
        if not token:
            return Response({"error": "Non authentifié."}, status=401)

        payload = verify_jwt(token)
        if not payload:
            return Response({"error": "Token invalide ou expiré."}, status=401)

        if payload['role'] != 'administrateur':
            return Response({"error": "Accès réservé aux administrateurs."}, status=403)

        serializer = AgentCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": f"Agent créé. Mot de passe envoyé à {user.email}.",
                "agent"  : {
                    "id"   : user.id_user,
                    "nom"  : f"{user.nom_user} {user.prenom_user}",
                    "email": user.email,
                }
            }, status=201)

        return Response(serializer.errors, status=400)

class CitoyenRegisterView(APIView):
    """
    POST /auth/register/
    Inscription d'un nouveau citoyen.
    Body JSON :
    {
        "nom_user"        : "Rakoto",
        "prenom_user"     : "Jean",
        "email"           : "jean@mail.mg",
        "mdp_user"        : "motdepasse",
        "id_commune"      : 1,
        "id_arondissement": 4      ← obligatoire si id_commune == 1
    }
    """
    def post(self, request):
        serializer = CitoyenRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.save()
            token = generate_jwt(user)
            return Response({
                "message" : "Inscription réussie.",
                "token"   : token,
                "role"    : user.role,
                "user"    : {
                    "id"    : user.id_user,
                    "nom"   : f"{user.nom_user} {user.prenom_user}",
                    "email" : user.email,
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Connexion
# ─────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /auth/login/
    Connexion pour tous les rôles (citoyen, agent, administrateur).
    Body JSON :
    {
        "email"   : "jean@mail.mg",
        "mdp_user": "motdepasse"
    }
    Retourne un token JWT à stocker côté client.
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.validated_data['user']
            token = generate_jwt(user)
            return Response({
                "message" : "Connexion réussie.",
                "token"   : token,
                "role"    : user.role,
                "user"    : {
                    "id"    : user.id_user,
                    "nom"   : f"{user.nom_user} {user.prenom_user}",
                    "email" : user.email,
                }
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Profil utilisateur connecté
# ─────────────────────────────────────────────

class ProfilView(APIView):
    """
    GET  /auth/profil/ → voir son profil
    PATCH /auth/profil/ → modifier ses infos
    """
    def get(self, request):
        token = _get_token(request)
        if not token:
            return Response({"error": "Non authentifié."}, status=401)

        payload = verify_jwt(token)
        if not payload:
            return Response({"error": "Token invalide ou expiré."}, status=401)

        try:
            user = Utilisateur.objects.select_related(
                'id_arondissement__id_commune', 'id_commune'
            ).get(id_user=payload['user_id'])
        except Utilisateur.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

        serializer = UtilisateurSerializer(user)
        return Response(serializer.data, status=200)

    def patch(self, request):
        token = _get_token(request)
        if not token:
            return Response({"error": "Non authentifié."}, status=401)

        payload = verify_jwt(token)
        if not payload:
            return Response({"error": "Token invalide ou expiré."}, status=401)

        try:
            user = Utilisateur.objects.get(id_user=payload['user_id'])
        except Utilisateur.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

        # Champs autorisés selon le rôle
        CHAMPS_PAR_ROLE = {
            'citoyen'       : ['nom_user', 'prenom_user', 'mdp_user'],
            'agent'         : ['nom_user', 'prenom_user', 'mdp_user'],
            'administrateur': ['nom_user', 'prenom_user', 'mdp_user', 'email'],
        }
        champs_autorises = CHAMPS_PAR_ROLE.get(payload['role'], [])

        for champ in champs_autorises:
            if champ in request.data:
                if champ == 'mdp_user':
                    nouveau_mdp   = request.data['mdp_user']
                    mdp_hash      = bcrypt.hashpw(nouveau_mdp.encode('utf-8'), bcrypt.gensalt())
                    user.mdp_user = mdp_hash.decode('utf-8')
                elif champ == 'email':
                    # Vérifier unicité pour admin
                    nouvel_email = request.data['email']
                    if Utilisateur.objects.filter(email=nouvel_email).exclude(id_user=user.id_user).exists():
                        return Response({"error": "Email déjà utilisé."}, status=400)
                    user.email = nouvel_email
                else:
                    setattr(user, champ, request.data[champ])

        user.save()
        nouveau_token = generate_jwt(user)

        return Response({
            "message" : "Profil mis à jour.",
            "token"   : nouveau_token,
            "user"    : {
                "id"   : user.id_user,
                "nom"  : f"{user.nom_user} {user.prenom_user}",
                "email": user.email,
            }
        }, status=200)
# ─────────────────────────────────────────────
# Liste des communes et arrondissements
# (utile pour le formulaire d'inscription)
# ─────────────────────────────────────────────

class CommunesView(APIView):
    """
    GET /auth/communes/
    Retourne toutes les communes avec leurs arrondissements.
    """
    def get(self, request):
        communes = Commune.objects.all()
        data = []
        for c in communes:
            aros = Arondissement.objects.filter(id_commune=c)
            data.append({
                "id_commune"      : c.id_commune,
                "nom_commune"     : c.nom_commune,
                "arrondissements" : [
                    {
                        "id_arondissement" : a.id_arondissement,
                        "num_arondissement": a.num_arondissement,
                        "nom_arondissement": a.nom_arondissement,
                    }
                    for a in aros
                ]
            })
        return Response(data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# Déconnexion
# ─────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /auth/logout/
    Invalide le token côté client (le client doit supprimer le token).
    """
    def post(self, request):
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# Utilitaire interne
# ─────────────────────────────────────────────

def _get_token(request):
    """
    Récupère le token depuis :
    1. Header Authorization: Bearer <token>
    2. Cookie 'token'
    """
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return request.COOKIES.get('token')
