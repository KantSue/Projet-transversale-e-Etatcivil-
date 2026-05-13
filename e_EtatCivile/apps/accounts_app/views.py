import bcrypt
from rest_framework.views import APIView, settings
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
            'citoyen'       : ['nom_user', 'prenom_user', 'mdp_user', 'id_commune', 'id_arondissement'],
            'agent'         : ['nom_user', 'prenom_user', 'mdp_user'],
            'administrateur': ['nom_user', 'prenom_user', 'mdp_user', 'email'],
        }

        champs_autorises = CHAMPS_PAR_ROLE.get(user.role, [])

        for champ in champs_autorises:
            if champ in request.data:
                if champ == 'mdp_user':
                    nouveau_mdp   = request.data['mdp_user']
                    mdp_hash      = bcrypt.hashpw(nouveau_mdp.encode('utf-8'), bcrypt.gensalt())
                    user.mdp_user = mdp_hash.decode('utf-8')
                elif champ == 'id_commune':
                    try:
                        commune     = Commune.objects.get(id_commune=request.data['id_commune'])
                        user.id_commune = commune
                    except Commune.DoesNotExist:
                        return Response({"error": "Commune introuvable"}, status=400)
                elif champ == 'id_arondissement':
                    id_aro = request.data.get('id_arondissement')
                    if id_aro:
                        try:
                            aro = Arondissement.objects.get(id_arondissement=id_aro)
                            user.id_arondissement = aro
                        except Arondissement.DoesNotExist:
                            return Response({"error": "Arrondissement introuvable"}, status=400)
                    else:
                        user.id_arondissement = None
                elif champ == 'mdp_user':
                        ancien_mdp = request.data.get('ancien_mdp')
                        if not ancien_mdp:
                            return Response({"error": "Ancien mot de passe requis"}, status=400)
                        if not bcrypt.checkpw(ancien_mdp.encode('utf-8'), user.mdp_user.encode('utf-8')):
                            return Response({"error": "Ancien mot de passe incorrect"}, status=400)
                        nouveau_mdp   = request.data['mdp_user']
                        mdp_hash      = bcrypt.hashpw(nouveau_mdp.encode('utf-8'), bcrypt.gensalt())
                        user.mdp_user = mdp_hash.decode('utf-8')
                    
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
        
class MotDePasseOublieView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email requis"}, status=400)

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({"error": "Aucun compte associé à cet email"}, status=404)

        # Générer nouveau mot de passe
        import random, string
        nouveau_mdp = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        mdp_hash    = bcrypt.hashpw(nouveau_mdp.encode('utf-8'), bcrypt.gensalt())
        user.mdp_user = mdp_hash.decode('utf-8')
        user.save()

        # Envoyer par email
        from django.core.mail import send_mail
        send_mail(
            subject    = "Réinitialisation mot de passe — État Civil",
            message    = (
                f"Bonjour {user.prenom_user} {user.nom_user},\n\n"
                f"Votre nouveau mot de passe : {nouveau_mdp}\n\n"
                f"Veuillez le changer après connexion.\n\n"
                f"Cordialement,\nService État Civil"
            ),
            from_email    = settings.EMAIL_HOST_USER,
            recipient_list= [email],
            fail_silently = False,
        )

        return Response({"message": f"Nouveau mot de passe envoyé à {email}"}, status=200)
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
