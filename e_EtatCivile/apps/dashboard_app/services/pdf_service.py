"""
F5 — Génération du PDF officiel d'un acte d'état civil
=======================================================
Librairie : fpdf2 (plus simple que reportlab)
Coordonnées depuis le HAUT de la page (plus naturel)
"""

from fpdf import FPDF
import os
import io

from apps.dashboard_app.models import (
    Acte, ActePersonne, ActeNaissance, ActeMariage, ActeDeces, Demande
)
from apps.dashboard_app.services.Acte_service import generer_qr_code


# ─────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────

MOIS = [
    '', 'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
]

def fmt_date(dt):
    if dt is None:
        return "N/A"
    try:
        return f"{dt.day} {MOIS[dt.month]} {dt.year}"
    except Exception:
        return str(dt)

def fmt_heure(dt):
    if dt is None:
        return ""
    try:
        return dt.strftime("%H heures %M minutes")
    except Exception:
        return ""

def info_personne(p):
    if not p:
        return "inconnu(e)"
    return (
        f"{p.nom_personne} {p.prenom_personne}, "
        f"ne(e) le {fmt_date(p.date_naissance)} "
        f"a {p.lieu_naiss or 'N/A'}, "
        f"de profession {p.profession or 'N/A'}"
    )


# ─────────────────────────────────────────────
# Classe PDF
# ─────────────────────────────────────────────

class ActePDF(FPDF):

    def __init__(self, nom_commune, num_arro, nom_maire, num_acte, personne_principale):
        super().__init__()
        self.nom_commune         = nom_commune
        self.num_arro            = num_arro
        self.nom_maire           = nom_maire
        self.num_acte            = num_acte
        self.personne_principale = personne_principale

    def header(self):
        # Logo positionné pour ne pas dépasser la ligne
        logo_path = os.path.join(
            'apps', 'dashboard_app', 'static', 'images', 'logo.png'
        )
        if os.path.exists(logo_path):
            self.image(logo_path, x=10, y=5, w=10)  # ← plus petit, plus haut

        # Textes centrés — décalés à droite pour laisser place au logo
        self.set_font("Helvetica", "B", 12)
        self.set_y(6)
        self.set_x(35)   # ← décaler à droite du logo
        self.cell(155, 6, "REPOBLIKAN'I MADAGASIKARA",
                align="C", new_x="LMARGIN", new_y="NEXT")

        self.set_font("Helvetica", "", 9)
        self.set_x(35)
        self.cell(155, 5, "Fitiavana - Tanindrazana - Fandrosoana",
                align="C", new_x="LMARGIN", new_y="NEXT")

        self.set_font("Helvetica", "B", 10)
        self.set_x(35)
        self.cell(155, 5, f"COMMUNE URBAINE DE {self.nom_commune.upper()}",
                align="C", new_x="LMARGIN", new_y="NEXT")

        if self.num_arro:
            self.set_font("Helvetica", "", 9)
            self.set_x(35)
            self.cell(155, 5, self.num_arro,
                    align="C", new_x="LMARGIN", new_y="NEXT")

        # Ligne après le logo — y fixe à 30 pour que le logo reste au-dessus
        self.set_y(30)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-20)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5,
                  "AD AMBADIKA NY DIKAN'ITY SORATRA ITY AMIN'NY TENY FRANTSAY",
                  align="C")
        self.set_text_color(0, 0, 0)

    def titre_acte(self, titre, date_acte, num_acte):
        self.set_font("Helvetica", "BI", 15)
        self.cell(0, 10, titre, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 8)
        self.cell(0, 5,
                f"Commune Urbaine {self.nom_commune} - {self.num_arro}",
                align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_font("Helvetica", "", 9)
        self.cell(0, 5, f"N  {num_acte} - {fmt_date(date_acte)}",  # ← tiret simple
                new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def paragraphe(self, texte):
        self.set_font("Helvetica", "", 9)
        self.set_x(20)
        self.multi_cell(170, 5, texte, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def separateur(self):
        self.ln(2)
        self.set_line_width(0.2)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)

    def signature_et_qr(self, num_acte):
        # Désactiver auto page break pour forcer sur page 1
        self.set_auto_page_break(False)
        
        y_bas = 220   # ← réduit de 240 à 220
        
        self.set_xy(20, y_bas)
        self.set_font("Helvetica", "B", 9)
        self.cell(0, 5, "Ny Mpiandraikitra ny sora-piankohonana",
                new_x="LMARGIN", new_y="NEXT")
        self.set_x(20)
        self.set_font("Helvetica", "", 9)
        self.cell(0, 5, self.nom_maire, new_x="LMARGIN", new_y="NEXT")
        self.set_x(20)
        self.line(20, self.get_y() + 10, 80, self.get_y() + 10)

        # QR code
        import tempfile
        try:
            qr_buf  = generer_qr_code(num_acte)
            qr_path = os.path.join(tempfile.gettempdir(),
                                f"qr_{num_acte.replace('-','_')}.png")
            with open(qr_path, 'wb') as f:
                f.write(qr_buf.read())
            self.image(qr_path, x=155, y=y_bas - 5, w=30, h=30)
            self.set_xy(150, y_bas + 26)
            self.set_font("Helvetica", "", 7)
            self.cell(45, 4, "Scanner pour verifier", align="C")
            os.remove(qr_path)
        except Exception as e:
            print(f"QR error: {e}")


# ─────────────────────────────────────────────
# Générateur principal
# ─────────────────────────────────────────────

def generer_pdf_acte(num_acte, id_demande=None):
    # 1. Acte
    acte    = Acte.objects.select_related('type_acte').get(num_acte=num_acte)
    type_lb = acte.type_acte.libelle.lower()

    # 2. Personnes
    roles = {
        ap.role: ap.id_personne
        for ap in ActePersonne.objects.select_related('id_personne').filter(
            id_acte=acte.id_acte
        )
    }

    # 3. Commune / maire
    nom_commune = "Antananarivo"
    nom_maire   = "L'Officier de l'Etat Civil"
    num_arro    = ""

    if id_demande:
        try:
            demande = Demande.objects.select_related(
                'id_commune', 'id_arrondissement'
            ).get(id_demande=id_demande)
            if demande.id_commune:
                nom_commune = demande.id_commune.nom_commune
                nom_maire   = demande.id_commune.nom_maire or nom_maire
            if demande.id_arrondissement:
                num_arro = f"Boriborintany faha {demande.id_arrondissement.num_arondissement}"
        except Demande.DoesNotExist:
            pass

    # 4. Infos événement
    date_evenement = None
    lieu_evenement = nom_commune
    cause_deces    = ""

    if type_lb == 'acte naissance':
        enfant = roles.get('enfant')
        if enfant and enfant.date_naissance:
            date_evenement = enfant.date_naissance
            lieu_evenement = enfant.lieu_naiss or nom_commune

    elif type_lb == 'acte mariage':
        try:
            am             = ActeMariage.objects.get(id_acte=acte)
            date_evenement = am.date_mariage
            lieu_evenement = am.lieu_mariage or nom_commune
        except ActeMariage.DoesNotExist:
            pass

    elif type_lb == 'acte deces' or 'deces' in type_lb:
        try:
            ad             = ActeDeces.objects.get(id_acte=acte)
            date_evenement = ad.date_deces
            lieu_evenement = ad.lieu_deces or nom_commune
            cause_deces    = ad.cause_deces or ""
        except ActeDeces.DoesNotExist:
            pass

    # 5. Personne principale
    pp = roles.get('enfant') or roles.get('epoux1') or roles.get('defunt')
    personne_principale = f"{pp.nom_personne} {pp.prenom_personne}" if pp else ""

    # 6. Titre
    titres = {
        'acte naissance': "Kopian'ny Sora-piankohonana",
        'acte mariage'  : "Kopian'ny Sora-panambadiana",
        'acte deces'    : "Kopian'ny Sora-pahafatesana",
        'acte décès'    : "Kopian'ny Sora-pahafatesana",
    }
    titre = titres.get(type_lb, acte.type_acte.libelle)

    # 7. Créer le PDF
    pdf = ActePDF(nom_commune, num_arro, nom_maire, num_acte, personne_principale)
    pdf.add_page()
    pdf.set_left_margin(20)
    pdf.set_right_margin(10)
    pdf.set_auto_page_break(auto=True, margin=50)  # ← 30 → 50
    # Titre
    pdf.titre_acte(titre, acte.date_acte, num_acte)

    # ── Paragraphe 1 ──────────────────────────

    if type_lb == 'acte naissance':
        enfant = roles.get('enfant')
        pere   = roles.get('pere')
        mere   = roles.get('mere')
        sexe   = "masculin" if (enfant and enfant.sexe == 'M') else "feminin"
        prenom = enfant.prenom_personne if enfant else "N/A"
        nom    = enfant.nom_personne    if enfant else "N/A"

        pdf.paragraphe(
            f"Le {fmt_date(date_evenement)} a {fmt_heure(date_evenement)}, "
            f"a {lieu_evenement}, Commune Urbaine de {nom_commune}, "
            f"est ne(e) un enfant de sexe {sexe} prenomme(e) {prenom} {nom}."
        )
        if pere:
            pdf.paragraphe(f"Pere : {info_personne(pere)}.")
        if mere:
            pdf.paragraphe(f"Mere : {info_personne(mere)}.")

    elif type_lb == 'acte mariage':
        epoux1      = roles.get('epoux1')
        epoux2      = roles.get('epoux2')
        pere_epoux1 = roles.get('pere_epoux1')
        mere_epoux1 = roles.get('mere_epoux1')
        pere_epoux2 = roles.get('pere_epoux2')
        mere_epoux2 = roles.get('mere_epoux2')

        pdf.paragraphe(
            f"Le {fmt_date(date_evenement)} a {fmt_heure(date_evenement)}, "
            f"a {lieu_evenement}, Commune Urbaine de {nom_commune}, "
            f"ont ete unis par les liens du mariage :"
        )
        if epoux1:   pdf.paragraphe(f"Epoux : {info_personne(epoux1)}.")
        if pere_epoux1: pdf.paragraphe(f"Pere de l'epoux : {info_personne(pere_epoux1)}.")
        if mere_epoux1: pdf.paragraphe(f"Mere de l'epoux : {info_personne(mere_epoux1)}.")
        pdf.ln(2)
        if epoux2:   pdf.paragraphe(f"Epouse : {info_personne(epoux2)}.")
        if pere_epoux2: pdf.paragraphe(f"Pere de l'epouse : {info_personne(pere_epoux2)}.")
        if mere_epoux2: pdf.paragraphe(f"Mere de l'epouse : {info_personne(mere_epoux2)}.")

    else:  # décès
        defunt      = roles.get('defunt')
        pere_defunt = roles.get('pere_defunt')
        mere_defunt = roles.get('mere_defunt')

        pdf.paragraphe(
            f"Le {fmt_date(date_evenement)} a {fmt_heure(date_evenement)}, "
            f"a {lieu_evenement}, est decede(e) : {info_personne(defunt)}."
        )
        if cause_deces:
            pdf.paragraphe(f"Cause du deces : {cause_deces}.")
        if pere_defunt:
            pdf.paragraphe(f"Pere : {info_personne(pere_defunt)}.")
        if mere_defunt:
            pdf.paragraphe(f"Mere : {info_personne(mere_defunt)}.")

    # ── Paragraphe 2 ──────────────────────────
    pdf.separateur()

    temoin  = roles.get('temoin')
    temoin2 = roles.get('temoin2')

    pdf.paragraphe(
        f"Declare le {fmt_date(acte.date_acte)} par {info_personne(temoin)}."
    )
    if temoin2:
        pdf.paragraphe(f"Second temoin : {info_personne(temoin2)}.")

    pdf.ln(3)
    pdf.paragraphe(
        f"Constate avec nous {nom_maire}, Officier de l'Etat Civil "
        f"de la Commune Urbaine de {nom_commune}, en signant ci-dessous."
    )

    # ── Signature + QR ────────────────────────
    pdf.signature_et_qr(num_acte)

    buffer = io.BytesIO(pdf.output())
    buffer.seek(0)
    return buffer