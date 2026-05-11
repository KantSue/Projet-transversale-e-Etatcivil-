from datetime import datetime
from apps.dashboard_app.models import Acte
import qrcode
import io

prefixes={
    'acte naissance':'NAISS',
    'acte mariage':'MARI',
    'acte deces':'DECE',
}



def generer_qr_code(num_acte):
    """
    Génère un QR code contenant l'URL de vérification de l'acte.
    Retourne un objet BytesIO (image en mémoire — pas sauvegardée sur disque).
    """
    url = f"http://localhost:8000/dashboard/verifier/?ref={num_acte}"

    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer