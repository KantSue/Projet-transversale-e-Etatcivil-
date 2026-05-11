from django.utils import timezone
from datetime import timedelta
import jwt

SECRET_KEY = 'secret123'


def generate_jwt(user):
    """
    Génère un token JWT contenant les infos de l'utilisateur.
    Inclut id_commune et id_arondissement pour le filtrage des demandes.
    """
    payload = {
        'user_id'         : user.id_user,
        'email'           : user.email,
        'role'            : user.role,
        'nom'             : f"{user.nom_user} {user.prenom_user}",
        'id_arondissement': user.id_arondissement.id_arondissement
                            if user.id_arondissement else None,
        'id_commune'      : user.id_commune.id_commune
                            if user.id_commune else None,
        'exp'             : timezone.now() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token


def verify_jwt(token):
    """
    Vérifie et décode un token JWT.
    Retourne le payload ou None si invalide/expiré.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
