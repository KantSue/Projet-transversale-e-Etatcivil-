from django.utils import timezone
from datetime import timedelta
import jwt

SECRET_KEY = 'secret123'

def generate_jwt(user):
    payload = {
        'user_id': user.id_user,
        'email': user.email,
        'role': user.role,
        'exp': timezone.now() + timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token


def verify_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
