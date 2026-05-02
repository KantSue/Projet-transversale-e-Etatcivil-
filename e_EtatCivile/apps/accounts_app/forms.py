from django import forms
from datetime import datetime
from .models import Utilisateur,Agent
class UserLoginForm(forms.ModelForm):
    class Meta:
        model=Utilisateur
        date_inscripton=datetime.now()
       
        
        fields=['nom_user','prenom_user','email','mdp_user','role']
class AgentLoginForm(forms.ModelForm):
    class Meta:
        model=Agent
        
        fields=['id_user']