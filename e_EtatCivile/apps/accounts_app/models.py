from django.db import models


class Acte(models.Model):
    id_acte = models.AutoField(primary_key=True)
    num_acte = models.CharField(unique=True, max_length=50)
    type = models.CharField(max_length=50)
    date_acte = models.DateField()
    temoin = models.ForeignKey('Personne', models.DO_NOTHING, db_column='temoin', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte'


class ActeDeces(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)
    defunt = models.ForeignKey('Personne', models.DO_NOTHING, db_column='defunt')
    date_deces = models.DateField()
    lieu_deces = models.CharField(max_length=150, blank=True, null=True)
    cause_deces = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_deces'


class ActeMariage(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)
    epoux1 = models.ForeignKey('Personne', models.DO_NOTHING, db_column='epoux1')
    epoux2 = models.ForeignKey('Personne', models.DO_NOTHING, db_column='epoux2', related_name='actemariage_epoux2_set')
    date_mariage = models.DateField()
    lieu_mariage = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_mariage'


class ActeNaissance(models.Model):
    id_acte = models.OneToOneField(Acte, models.DO_NOTHING, db_column='id_acte', primary_key=True)
    enfant = models.ForeignKey('Personne', models.DO_NOTHING, db_column='enfant')
    pere = models.ForeignKey('Personne', models.DO_NOTHING, db_column='pere', related_name='actenaissance_pere_set', blank=True, null=True)
    mere = models.ForeignKey('Personne', models.DO_NOTHING, db_column='mere', related_name='actenaissance_mere_set', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_naissance'


class ActePersonne(models.Model):
    pk = models.CompositePrimaryKey('id_acte', 'id_personne')
    id_acte = models.ForeignKey(Acte, models.DO_NOTHING, db_column='id_acte')
    id_personne = models.ForeignKey('Personne', models.DO_NOTHING, db_column='id_personne')
    role = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'acte_personne'


class Administrateur(models.Model):
    id_user = models.OneToOneField('Utilisateur', models.DO_NOTHING, db_column='id_user', primary_key=True)
    matricule = models.IntegerField(unique=True)
    id_agent_manager = models.ForeignKey('Agent', models.DO_NOTHING, db_column='id_agent_manager', blank=True, null=True)

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
    id_arondissement = models.AutoField(primary_key=True)
    num_arondissement = models.IntegerField()
    id_commune = models.ForeignKey('Commune', models.DO_NOTHING, db_column='id_commune', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'arondissement'


class Citoyen(models.Model):
    id_user = models.OneToOneField('Utilisateur', models.DO_NOTHING, db_column='id_user', primary_key=True)
    

    class Meta:
        managed = False
        db_table = 'citoyen'


class Commune(models.Model):
    id_commune = models.AutoField(primary_key=True)
    nom_commune = models.CharField(max_length=100)

    class Meta:
        managed = False
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


class Demande(models.Model):
    id_demande = models.AutoField(primary_key=True)
    type_acte = models.CharField(max_length=50)
    date_depot = models.DateField()
    statut_demande = models.CharField(max_length=10)
    motif_refus = models.TextField(blank=True, null=True)
    date_maj = models.DateField(blank=True, null=True)
    id_citoyen = models.ForeignKey(Citoyen, models.DO_NOTHING, db_column='id_citoyen')
    id_agent = models.ForeignKey(Agent, models.DO_NOTHING, db_column='id_agent', blank=True, null=True)
    id_acte = models.ForeignKey(Acte, models.DO_NOTHING, db_column='id_acte', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'demande'


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


class Personne(models.Model):
    id_personne = models.AutoField(primary_key=True)
    nom_personne = models.CharField(max_length=100)
    prenom_personne = models.CharField(max_length=100)
    date_naissance = models.DateTimeField()
    lieu_naiss = models.CharField(max_length=150, blank=True, null=True)
    sexe = models.CharField(max_length=1)
    profession = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'personne'


class PieceJoint(models.Model):
    id_piece = models.AutoField(primary_key=True)
    date_depot = models.DateField()
    type_fichier = models.CharField(max_length=50)
    url_fichier = models.CharField(max_length=255)
    id_demande = models.ForeignKey(Demande, models.DO_NOTHING, db_column='id_demande')

    class Meta:
        managed = False
        db_table = 'piece_joint'


class Statistique(models.Model):
    id_stat = models.AutoField(primary_key=True)
    type_stat = models.CharField(max_length=100)
    valeur = models.IntegerField()
    id_admin = models.ForeignKey(Administrateur, models.DO_NOTHING, db_column='id_admin', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'statistique'


class Utilisateur(models.Model):
    id_user = models.AutoField(primary_key=True)
    nom_user = models.CharField(max_length=100)
    prenom_user = models.CharField(max_length=100)
    email = models.CharField(unique=True, max_length=150)
    mdp_user = models.CharField(max_length=255)
    role = models.CharField(max_length=14)
    date_inscription = models.DateField(auto_now_add=True)
    id_arondissement = models.ForeignKey(Arondissement, models.DO_NOTHING, db_column='id_arondissement', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'utilisateur'
