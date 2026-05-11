# accounts_app — Documentation

## Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /auth/register/ | Inscription citoyen |
| POST | /auth/login/ | Connexion tous rôles |
| POST | /auth/logout/ | Déconnexion |
| GET  | /auth/profil/ | Profil utilisateur connecté |
| GET  | /auth/communes/ | Liste communes + arrondissements |

## Authentification

Le token JWT est retourné dans la réponse JSON après login/register.
Le client doit le stocker et l'envoyer dans le header :

```
Authorization: Bearer <token>
```

## Exemples

### Inscription citoyen
```json
POST /auth/register/
{
    "nom_user"        : "Rakoto",
    "prenom_user"     : "Jean",
    "email"           : "jean@mail.mg",
    "mdp_user"        : "motdepasse",
    "id_commune"      : 1,
    "id_arondissement": 4
}
```

### Connexion
```json
POST /auth/login/
{
    "email"   : "jean@mail.mg",
    "mdp_user": "motdepasse"
}
```

### Réponse login/register
```json
{
    "message": "Connexion réussie.",
    "token"  : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "role"   : "citoyen",
    "user"   : {
        "id"   : 1,
        "nom"  : "Rakoto Jean",
        "email": "jean@mail.mg"
    }
}
```

## Payload JWT

```json
{
    "user_id"         : 1,
    "email"           : "jean@mail.mg",
    "role"            : "citoyen",
    "nom"             : "Rakoto Jean",
    "id_arondissement": 4,
    "id_commune"      : 1,
    "exp"             : 1234567890
}
```

## Règle arrondissement

- Si `id_commune == 1` (Antananarivo) → `id_arondissement` obligatoire
- Autres communes → `id_arondissement` optionnel (null)
