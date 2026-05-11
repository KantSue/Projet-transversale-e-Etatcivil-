from django.http import FileResponse
from apps.dashboard_app.services.pdf_service import generer_pdf_acte
from apps.dashboard_app.models import Archive, Demande,Paiement
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response

class GeneratePDFView(APIView):
    def get(self, request, id_demande):
        try:
            demande = Demande.objects.select_related(
                'id_acte', 'id_type_acte', 'id_commune', 'id_arrondissement'
            ).get(id_demande=id_demande)
        except Demande.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=404)

        # Vérifier que la demande est validée
        if demande.statut_demande != 'VALIDER':
            return Response({"error": "Demande non validée"}, status=403)

        if not demande.num_acte:
            return Response({"error": "Numero d'acte manquant"}, status=400)
        
        # Vérifier paiement avant génération PDF
        paiement = Paiement.objects.filter(
            id_demande=demande,
            statut_paiement='confirme'
        ).first()

        if not paiement:
            return Response({"error": "Paiement non confirme"}, status=403)
        
        # Générer le PDF
        pdf_buffer = generer_pdf_acte(demande.num_acte, id_demande=id_demande)

        # Archiver — statut TERMINER + entrée Archive
        demande.statut_demande = 'TERMINER'
        demande.date_maj       = timezone.now().date()
        demande.save()

        if demande.id_acte:
            Archive.objects.get_or_create(
                id_acte  = demande.id_acte,
                defaults = {'date_archive': timezone.now().date()}
            )

        return FileResponse(
            pdf_buffer,
            as_attachment = True,
            filename      = f"acte_{demande.num_acte}.pdf",
            content_type  = 'application/pdf'
        )