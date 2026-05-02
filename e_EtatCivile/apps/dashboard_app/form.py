from django import forms
from .models import Acte,ActeDeces,ActeNaissance,ActeMariage,Personne,Utilisateur,Demande
class PersonneForm(forms.ModelForm):
    class Meta:
        model=Personne
        fields=['nom_personne','prenom_personne','date_naissance','lieu_naiss','sexe','profession','date_deces']
class AjoutDemandeForm(forms.ModelForm):
    class Meta:
        model=Demande
        fields=['id_type_acte','num_acte','id_citoyen']
class ActeNaissanceForm(forms.ModelForm):
    class Meta:
        model=ActeNaissance
        fields=['enfant','pere','mere']
class ActeMariageForm(forms.ModelForm):
    class Meta:
        model=ActeMariage
        fields=['epoux1','epoux2','date_mariage','lieu_mariage']
class ActeDecesForm(forms.ModelForm):
    class Meta:
        model=ActeDeces
        fields = ['defunt', 'date_deces', 'lieu_deces', 'cause_deces']
class AjoutAgentForm(forms.ModelForm):
    class Meta:
        model=Utilisateur
        fields=['nom_user','prenom_user','email','mdp_user','role','id_arondissement']
        readonly_fields=['mdp_user','role']

                   