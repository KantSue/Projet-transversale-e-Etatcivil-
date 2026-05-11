from django.db import models


class Commune(models.Model):
    id_commune  = models.AutoField(primary_key=True)
    nom_commune = models.CharField(max_length=100)
    nom_maire   = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'commune'

    def __str__(self):
        return self.nom_commune


class Arondissement(models.Model):
    id_arondissement  = models.AutoField(primary_key=True)
    num_arondissement = models.IntegerField()
    nom_arondissement = models.CharField(max_length=100, blank=True, null=True)
    statut            = models.CharField(max_length=20, default='disponible')
    id_commune        = models.ForeignKey(Commune, models.DO_NOTHING,
                                          db_column='id_commune',
                                          blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'arondissement'

    def __str__(self):
        return f"Arrondissement {self.num_arondissement}"


class Utilisateur(models.Model):
    ROLES = [
        ('citoyen',       'Citoyen'),
        ('agent',         'Agent'),
        ('administrateur','Administrateur'),
    ]

    id_user          = models.AutoField(primary_key=True)
    nom_user         = models.CharField(max_length=100)
    prenom_user      = models.CharField(max_length=100)
    email            = models.CharField(unique=True, max_length=150)
    mdp_user         = models.CharField(max_length=255)
    role             = models.CharField(max_length=14, choices=ROLES)
    date_inscription = models.DateField(auto_now_add=True)
    id_arondissement = models.ForeignKey(Arondissement, models.DO_NOTHING,
                                         db_column='id_arondissement',
                                         blank=True, null=True)
    id_commune       = models.ForeignKey(Commune, models.DO_NOTHING,
                                         db_column='id_commune',
                                         blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'utilisateur'

    def __str__(self):
        return f"{self.nom_user} {self.prenom_user} ({self.role})"


class Citoyen(models.Model):
    id_user = models.OneToOneField(Utilisateur, models.DO_NOTHING,
                                   db_column='id_user', primary_key=True)

    class Meta:
        managed  = False
        db_table = 'citoyen'


class Agent(models.Model):
    id_user   = models.OneToOneField(Utilisateur, models.DO_NOTHING,
                                     db_column='id_user', primary_key=True)
    matricule = models.IntegerField(unique=True)

    class Meta:
        managed  = False
        db_table = 'agent'


class Administrateur(models.Model):
    id_user   = models.OneToOneField(Utilisateur, models.DO_NOTHING,
                                     db_column='id_user', primary_key=True)
    matricule = models.IntegerField(unique=True)

    class Meta:
        managed  = False
        db_table = 'administrateur'
