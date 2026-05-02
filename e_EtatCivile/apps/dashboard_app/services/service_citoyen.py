from datetime import timezone

from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent
from django.core.mail import send_mail
from apps.dashboard_app.models import Acte

def generateNumActe():
    anner=timezone.now().year
    last=Acte.objects.filter(
        num_acte__startswith=f"AN_{anner}_"
    ).count()
    numero=last+1
    num_final=f"AN_{anner}_{numero:04d}"
    return num_final