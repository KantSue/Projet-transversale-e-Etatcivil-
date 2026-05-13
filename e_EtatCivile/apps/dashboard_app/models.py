from django.db import models

# Create your models here.


class Acte(models.Model):
    id_acte = models.AutoField(primary_key=True)
    num_acte = models.CharField(unique=True, max_length=50)
    date_acte = models.DateField()
    type_acte = models.ForeignKey('TypeActe', models.DO_NOTHING, db_column='id_type_acte')

    class Meta:
        managed = False
        db_table = 'acte'


class ActeDeces(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)
    date_deces  = models.DateTimeField() 
    lieu_deces = models.CharField(max_length=150, blank=True, null=True)
    cause_deces = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_deces'


class ActeMariage(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)
    date_mariage = models.DateTimeField() 
    lieu_mariage = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_mariage'


class ActeNaissance(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)

    class Meta:
        managed = False
        db_table = 'acte_naissance'


class ActePersonne(models.Model):
    pk = models.CompositePrimaryKey('id_acte', 'id_personne')
    id_acte = models.ForeignKey(Acte, models.DO_NOTHING, db_column='id_acte')
    id_personne = models.ForeignKey('Personne', models.DO_NOTHING, db_column='id_personne')
    role = models.CharField(max_length=11, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_personne'



class Administrateur(models.Model):
    id_user = models.OneToOneField('Utilisateur', models.DO_NOTHING, db_column='id_user', primary_key=True)
    matricule = models.IntegerField(unique=True)

    class Meta:
        managed = False
        db_table = 'administrateur'


class Agent(models.Model):
    id_user = models.OneToOneField('Utilisateur', models.DO_NOTHING, db_column='id_user', primary_key=True)
    matricule = models.IntegerField(unique=True)

    class Meta:
        managed = False
        db_table = 'agent'


class Archive(models.Model):
    id_archive = models.AutoField(primary_key=True)
    date_archive = models.DateField()
    id_acte = models.ForeignKey(Acte, models.DO_NOTHING, db_column='id_acte')

    class Meta:
        managed = False
        db_table = 'archive'

class Arondissement(models.Model):
    id_arondissement  = models.AutoField(primary_key=True)
    num_arondissement = models.IntegerField()
    nom_arondissement = models.CharField(max_length=100, blank=True, null=True)
    statut            = models.CharField(max_length=20, default='disponible')
    id_commune        = models.ForeignKey('Commune', models.DO_NOTHING,
                                          db_column='id_commune',
                                          blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'arondissement'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group_id = models.IntegerField()
    permission_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group_id', 'permission_id'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type_id = models.IntegerField()
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type_id', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.IntegerField()
    group_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user_id', 'group_id'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.IntegerField()
    permission_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user_id', 'permission_id'),)


class Citoyen(models.Model):
    id_user = models.OneToOneField('Utilisateur', models.DO_NOTHING, db_column='id_user', primary_key=True)

    class Meta:
        managed = False
        db_table = 'citoyen'


class Commune(models.Model):
    id_commune  = models.AutoField(primary_key=True)
    nom_commune = models.CharField(max_length=100)
    nom_maire   = models.CharField(max_length=150, blank=True, null=True)  # ← ajouter

    class Meta:
        managed  = False
        db_table = 'commune'


class Declaration(models.Model):
    id_declaration = models.AutoField(primary_key=True)
    type_declaration = models.CharField(max_length=100)
    date_declaration = models.DateField()
    statut_declaration = models.CharField(max_length=8)
    id_paiement = models.ForeignKey('Paiement', models.DO_NOTHING, db_column='id_paiement', blank=True, null=True)
    id_acte = models.ForeignKey(Acte, models.DO_NOTHING, db_column='id_acte', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'declaration'


class DeclarationPiece(models.Model):
    pk = models.CompositePrimaryKey('id_declaration', 'id_piece')
    id_declaration = models.ForeignKey(Declaration, models.DO_NOTHING, db_column='id_declaration')
    id_piece = models.ForeignKey('PieceJoint', models.DO_NOTHING, db_column='id_piece')

    class Meta:
        managed = False
        db_table = 'declaration_piece'

class TypeActe(models.Model):
    id_type_acte = models.AutoField(primary_key=True)
    libelle = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'type_acte'


class Demande(models.Model):
    id_demande        = models.AutoField(primary_key=True)
    date_depot        = models.DateTimeField(auto_now_add=True)
    statut_demande    = models.CharField(default='en attente', max_length=10)
    motif_refus       = models.TextField(blank=True, null=True)
    date_maj          = models.DateField(blank=True, null=True)
    id_citoyen        = models.ForeignKey(Citoyen, models.DO_NOTHING,related_name='demandes',db_column='id_citoyen')
    id_agent          = models.ForeignKey(Agent, models.DO_NOTHING,db_column='id_agent',related_name='demandes',blank=True, null=True)
    id_acte           = models.ForeignKey(Acte, models.DO_NOTHING,db_column='id_acte',related_name='demandes',blank=True, null=True)
    id_type_acte      = models.ForeignKey(TypeActe, models.DO_NOTHING,db_column='id_type_acte',related_name='demandes')
    num_acte          = models.CharField(max_length=50, blank=True, null=True)
    id_arrondissement = models.ForeignKey(Arondissement, models.DO_NOTHING,db_column='id_arrondissement',null=True, blank=True )
    id_commune = models.ForeignKey(Commune, models.DO_NOTHING,db_column='id_commune',null=True, blank=True)
    num_demande       = models.CharField(max_length=100)
    url_pdf = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        managed = False
        db_table = 'demande'
        
class LiaisonArondissement(models.Model):
    id_liaison     = models.AutoField(primary_key=True)
    arondissement1 = models.ForeignKey(Arondissement, models.DO_NOTHING,
                                       db_column='arondissement1',
                                       related_name='liaisons_depart')
    arondissement2 = models.ForeignKey(Arondissement, models.DO_NOTHING,
                                       db_column='arondissement2',
                                       related_name='liaisons_arrivee')
    distance_km    = models.FloatField()

    class Meta:
        managed = False
        db_table = 'liaison_arondissement'

class Personne(models.Model):
    id_personne = models.AutoField(primary_key=True)
    nom_personne = models.CharField(max_length=100)
    prenom_personne = models.CharField(max_length=100)
    date_naissance = models.DateTimeField()
    lieu_naiss = models.CharField(max_length=150, blank=True, null=True)
    sexe = models.CharField(max_length=1)
    profession = models.CharField(max_length=100, blank=True, null=True)
    date_deces=models.DateTimeField(blank=True,null=True)
    class Meta:
        managed = False
        db_table = 'personne'


class DemandePersonne(models.Model):
    id_demande_personne = models.AutoField(primary_key=True)
    role = models.CharField(max_length=8)
    personne = models.ForeignKey(Personne,models.DO_NOTHING,db_column='id_personne',related_name='personne')
    demande = models.ForeignKey(Demande,models.DO_NOTHING,db_column='id_demande',related_name='demandepersonne')

    class Meta:
        managed = False
        db_table = 'demande_personne'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type_id = models.IntegerField(blank=True, null=True)
    user_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Paiement(models.Model):
    id_paiement = models.AutoField(primary_key=True)
    montant = models.FloatField()
    statut_paiement = models.CharField(max_length=10)
    ref_transaction = models.CharField(max_length=100, blank=True, null=True)
    date_paiement = models.DateField(blank=True, null=True)
    id_demande = models.ForeignKey(Demande, models.DO_NOTHING, db_column='id_demande')

    class Meta:
        managed = False
        db_table = 'paiement'



class PieceJoint(models.Model):
    id_piece    = models.AutoField(primary_key=True)
    date_depot  = models.DateField(auto_now_add=True)
    type_fichier= models.CharField(max_length=50)
    url_fichier = models.CharField(max_length=255)
    id_demande  = models.ForeignKey(Demande, models.DO_NOTHING,
                                    db_column='id_demande')
    class Meta:
        managed  = False
        db_table = 'piece_joint'



class Utilisateur(models.Model):
    id_user = models.AutoField(primary_key=True)
    nom_user = models.CharField(max_length=100)
    prenom_user = models.CharField(max_length=100)
    email = models.CharField(unique=True, max_length=150)
    mdp_user = models.CharField(max_length=255)
    role = models.CharField(max_length=14)
    date_inscription = models.DateField(auto_now_add=True)
    id_arondissement = models.ForeignKey(Arondissement, models.DO_NOTHING, db_column='id_arondissement', blank=True, null=True)
    id_commune        = models.ForeignKey(Commune, models.DO_NOTHING, 
                                          db_column='id_commune',
                                          blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'utilisateur'

class JournalAudit(models.Model):

    ACTION_CHOICES = [
        ('CONSULTER', 'Consulter'),
        ('VALIDER', 'Valider'),
        ('REFUSER', 'Refuser'),
    ]

    id_journal = models.BigAutoField(primary_key=True)
    demande =  models.ForeignKey(Demande, models.DO_NOTHING, db_column='id_demande', blank=True, null=True)
    agent =  models.ForeignKey(Agent, models.DO_NOTHING, db_column='id_agent', blank=True, null=True)

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )

    motif = models.TextField(blank=True, null=True)
    horodatage = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'journal_audit'