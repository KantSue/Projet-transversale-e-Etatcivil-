import csv
import json

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts_app.services import verify_jwt
from apps.dashboard_app.services.statistiques_service import (
    construire_statistiques,
    donnees_graphiques,
    periode_depuis_requete,
)


def _get_token(request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return request.COOKIES.get("token")


def _admin_payload(request):
    token = _get_token(request)
    payload = verify_jwt(token) if token else None
    role = str(payload.get("role", "")).lower() if payload else ""
    if payload and role == "administrateur":
        return payload
    return None


def _forbidden_response(request):
    if request.headers.get("accept", "").find("application/json") >= 0:
        return JsonResponse({"error": "Acces reserve aux administrateurs."}, status=403)
    return HttpResponse("Acces reserve aux administrateurs.", status=403)


def stat(request):
    if not _admin_payload(request):
        return _forbidden_response(request)

    date_debut, date_fin, debut_dt, fin_dt = periode_depuis_requete(request)
    stats = construire_statistiques(debut_dt, fin_dt)
    graphiques = donnees_graphiques(stats)

    context = {
        "date_debut": date_debut.isoformat(),
        "date_fin": date_fin.isoformat(),
        "kpis": stats["kpis"],
        "demandes_par_type": stats["demandes_par_type"],
        "demandes_par_statut": stats["demandes_par_statut"],
        "communes": stats["communes"],
        "journaux": stats["journaux"],
        "chart_data": json.dumps(graphiques),
    }
    return render(request, "dash_admin/statistiques.html", context)


class StatistiquesAPIView(APIView):
    def get(self, request):
        if not _admin_payload(request):
            return Response({"error": "Acces reserve aux administrateurs."}, status=status.HTTP_403_FORBIDDEN)

        date_debut, date_fin, debut_dt, fin_dt = periode_depuis_requete(request)
        stats = construire_statistiques(debut_dt, fin_dt)
        data = {
            "periode": {
                "date_debut": date_debut.isoformat(),
                "date_fin": date_fin.isoformat(),
            },
            "kpis": stats["kpis"],
            "graphiques": donnees_graphiques(stats),
            "demandes_par_type": stats["demandes_par_type"],
            "demandes_par_statut": stats["demandes_par_statut"],
            "communes": stats["communes"],
            "journaux": [
                {
                    "id_journal": journal.id_journal,
                    "action": journal.action,
                    "motif": journal.motif,
                    "horodatage": journal.horodatage.isoformat() if journal.horodatage else None,
                    "demande": journal.demande_id,
                    "agent": journal.agent_id,
                }
                for journal in stats["journaux"]
            ],
        }
        return Response(data, status=status.HTTP_200_OK)


def export_statistiques_csv(request):
    if not _admin_payload(request):
        return _forbidden_response(request)

    date_debut, date_fin, debut_dt, fin_dt = periode_depuis_requete(request)
    stats = construire_statistiques(debut_dt, fin_dt)

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="statistiques_{date_debut.isoformat()}_{date_fin.isoformat()}.csv"'
    )
    writer = csv.writer(response)
    writer.writerow(["Rapport administratif anonymise"])
    writer.writerow(["Periode", date_debut.isoformat(), date_fin.isoformat()])
    writer.writerow([])

    writer.writerow(["Indicateur", "Valeur"])
    for cle, valeur in stats["kpis"].items():
        writer.writerow([cle, "" if valeur is None else valeur])
    writer.writerow([])

    writer.writerow(["Demandes par type", "Total"])
    for item in stats["demandes_par_type"]:
        writer.writerow([item["id_type_acte__libelle"] or "Non renseigne", item["total"]])
    writer.writerow([])

    writer.writerow(["Communes les plus actives", "Total"])
    for item in stats["communes"]:
        writer.writerow([item["id_commune__nom_commune"] or "Non renseignee", item["total"]])

    return response
