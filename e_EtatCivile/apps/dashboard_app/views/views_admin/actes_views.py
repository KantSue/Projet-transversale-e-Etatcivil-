from apps.dashboard_app.models import Acte, ActePersonne, TypeActe

from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts_app.services import verify_jwt


# Rôles principaux par type d'acte
ROLES_PRINCIPAUX = {
    1: ['enfant'],           # acte naissance
    2: ['defunt'],           # acte décès
    3: ['epoux1', 'epoux2'], # acte mariage
}


class ActesListView(APIView):
    def get(self, request):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        # Filtre optionnel par type
        id_type = request.GET.get('type', None)

        actes = Acte.objects.select_related('type_acte').all()
        if id_type:
            actes = actes.filter(type_acte=id_type)

        # Types disponibles pour le filtre
        types     = TypeActe.objects.all()
        types_data = [{"id": t.id_type_acte, "libelle": t.libelle} for t in types]

        data = []
        for acte in actes:
            type_id = acte.type_acte.id_type_acte if acte.type_acte else None

            # Récupérer toutes les personnes de cet acte
            toutes_personnes = ActePersonne.objects.filter(
                id_acte=acte
            ).select_related('id_personne')

            # Filtrer les personnes principales selon le type
            roles = ROLES_PRINCIPAUX.get(type_id, [])
            if roles:
                personnes_principales = [
                    p for p in toutes_personnes if p.role in roles
                ]
            else:
                # Si type inconnu, prendre la première personne
                personnes_principales = list(toutes_personnes)[:1]

            data.append({
                "id_acte"  : acte.id_acte,
                "num_acte" : acte.num_acte,
                "date_acte": str(acte.date_acte),
                "type_acte": acte.type_acte.libelle if acte.type_acte else "N/A",
                "id_type"  : type_id,
                "personnes": [
                    {
                        "role"           : p.role,
                        "nom_personne"   : p.id_personne.nom_personne,
                        "prenom_personne": p.id_personne.prenom_personne,
                    }
                    for p in personnes_principales
                ]
            })

        return Response({
            "total": len(data),
            "types": types_data,
            "actes": data,
        }, status=200)