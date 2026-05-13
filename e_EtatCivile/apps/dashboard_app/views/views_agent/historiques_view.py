
from apps.accounts_app.services import verify_jwt

from rest_framework.views import APIView
from rest_framework.response import Response
from apps.dashboard_app.models import JournalAudit


class HistoriqueAgentView(APIView):
    def get(self, request):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        agent_id = payload.get('user_id')

        # Récupérer le journal d'audit de l'agent
        journaux = JournalAudit.objects.filter(
            agent__id_user=agent_id
        ).select_related('demande').order_by('-horodatage')

        data = [{
            "id_journal"  : j.id_journal if hasattr(j, 'id_journal') else None,
            "action"      : j.action,
            "motif"       : j.motif,
            "horodatage"  : str(j.horodatage),
            "num_demande" : j.demande.num_demande if j.demande else "N/A",
            "type_acte"   : j.demande.id_type_acte.libelle if j.demande and j.demande.id_type_acte else "N/A",
            "citoyen"     : f"{j.demande.id_citoyen.id_user.prenom_user} {j.demande.id_citoyen.id_user.nom_user}" if j.demande and j.demande.id_citoyen else "N/A",
        } for j in journaux]

        return Response({
            "total"    : len(data),
            "historique": data,
        }, status=200)