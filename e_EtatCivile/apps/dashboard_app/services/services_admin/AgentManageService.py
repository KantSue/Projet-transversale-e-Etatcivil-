from apps.dashboard_app.models import Utilisateur,Citoyen,Commune,Arondissement,Agent
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
import bcrypt,string,random

class AgentManageServices():
        
    def generatePassword(self):
        caracters=string.ascii_letters + string.digits+'!@#$%^&()*'
        password=''.join(random.choice(caracters) for i in range(8))
        return password

    def createAgent(self,data):
        mdp_hash=bcrypt.hashpw(data['mdp_user'].encode('utf-8'),bcrypt.gensalt())
        role='agent'
        
        if Utilisateur.objects.filter(email=data['email']).exists():
            raise ValidationError("Un agent avec cet email existe déjà.")
        
        user=Utilisateur.objects.create(nom_user=data['nom_user'],
                                    prenom_user=data['prenom_user'],
                                    email=data['email'],
                                    mdp_user=mdp_hash.decode('utf-8'),
                                    id_arondissement=data['id_arondissement'],
                                    
                                    role=role)
        Agent.objects.create(id_user=user,matricule=data['matricule'])
        self.envoyer_email(user.email,user.mdp_user)
        return user


    def envoyer_email(self,email,mdp_user):
        sujet='Création de compte'
        message=f"""Bonjour,
        Votre compte a été créé avec succès.
        Email:{email},
        Mot de passe:{mdp_user},
        Veuillez changer votre mot de passe après connexion."""
        send_mail(sujet,message,'hitoerantsoagrace@gmail.com',[email],fail_silently=False)
        
    def updateAgent(self, agent, data):

        user = agent.id_user

        if 'nom_user' in data:
            user.nom_user = data['nom_user']

        if 'prenom_user' in data:
            user.prenom_user = data['prenom_user']

        if 'email' in data:
            user.email = data['email']

        if 'id_arondissement' in data:
            user.id_arondissement = data['id_arondissement']

        user.save()

        if 'matricule' in data:
            agent.matricule = data['matricule']

        agent.save()

        return agent