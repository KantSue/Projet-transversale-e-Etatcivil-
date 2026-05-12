from django.http import FileResponse
from apps.dashboard_app.services.pdf_service import generer_pdf_acte
from apps.dashboard_app.models import Archive, Demande,Paiement
from django.utils import timezone
from apps.accounts_app.services import verify_jwt

from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import io

class GeneratePDFView(APIView):
    def get(self, request, id_demande):
        try:
            demande = Demande.objects.select_related(
                'id_acte', 'id_type_acte', 'id_commune', 'id_arrondissement'
            ).get(id_demande=id_demande)
        except Demande.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=404)

        if demande.statut_demande != 'VALIDER':
            return Response({"error": "Demande non validée"}, status=403)

        if not demande.num_acte:
            return Response({"error": "Numero d'acte manquant"}, status=400)

        paiement = Paiement.objects.filter(
            id_demande=demande,
            statut_paiement='confirme'
        ).first()

        if not paiement:
            return Response({"error": "Paiement non confirme"}, status=403)

        # Générer le PDF
        pdf_buffer = generer_pdf_acte(demande.num_acte, id_demande=id_demande)

        # Sauvegarder le PDF sur le serveur
        pdf_bytes = pdf_buffer.read()
        nom_fichier = f"actes/{demande.num_acte}_{id_demande}.pdf"
        chemin = default_storage.save(nom_fichier, ContentFile(pdf_bytes))

        # Archiver — statut TERMINER + url_pdf
        demande.statut_demande = 'TERMINER'
        demande.date_maj       = timezone.now().date()
        demande.url_pdf        = chemin
        demande.save()

        if demande.id_acte:
            Archive.objects.get_or_create(
                id_acte  = demande.id_acte,
                defaults = {'date_archive': timezone.now().date()}
            )

        # Retourner le PDF
        return FileResponse(
            io.BytesIO(pdf_bytes),
            as_attachment = True,
            filename      = f"acte_{demande.num_acte}.pdf",
            content_type  = 'application/pdf'
        )
        
class PdfCitoyenView(APIView):
    def get(self, request, id_demande):
        token   = request.COOKIES.get('token') or \
                  request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_jwt(token) if token else None
        if not payload:
            return Response({"error": "Non authentifié"}, status=401)

        try:
            demande = Demande.objects.get(
                id_demande=id_demande,
                id_citoyen=payload['user_id']
            )
        except Demande.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=404)

        if demande.statut_demande != 'TERMINER':
            return Response({"error": "Acte non encore généré"}, status=403)

        if not demande.url_pdf:
            return Response({"error": "PDF non disponible"}, status=404)

        url_pdf = f"http://10.210.105.55:8000/media/{demande.url_pdf}"
        return Response({
            "url_pdf"    : url_pdf,
            "num_acte"   : demande.num_acte,
            "num_demande": demande.num_demande
        }, status=200)