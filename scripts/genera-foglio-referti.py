#!/usr/bin/env python3
"""
Bio-Clinic — Genera foglio informativo per il paziente
Ritiro referti online per Pap Test HPV e Test Genetici
Output: PDF A4 pronto per la stampa
"""

import os
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, Line
from reportlab.graphics import renderPDF

# ── Colors ──
GREEN_DARK = HexColor('#1B7A43')
GREEN_MID = HexColor('#2E9B5E')
GREEN_LIGHT = HexColor('#E8F5E9')
GREEN_ACCENT = HexColor('#4CAF50')
GREEN_PALE = HexColor('#F1F8F2')
BLUE_HEADER = HexColor('#1A3C5E')
GRAY_TEXT = HexColor('#333333')
GRAY_SUB = HexColor('#666666')
GRAY_LIGHT = HexColor('#F5F5F5')
BORDER_GREEN = HexColor('#C8E6C9')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_PATH = os.path.join(ROOT_DIR, 'foglio-referti-online.pdf')
LOGO_PATH = os.path.join(ROOT_DIR, 'site', 'images', 'logo-bioclinic.png')

WIDTH, HEIGHT = A4  # 210 x 297 mm


def generate_qr(url, size=35*mm):
    """Generate QR code as ReportLab Image."""
    qr = qrcode.QRCode(version=1, box_size=10, border=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B7A43", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return Image(buf, width=size, height=size)


def build_pdf():
    styles = getSampleStyleSheet()

    # ── Custom Styles ──
    s_title = ParagraphStyle('Title2', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=20, leading=24,
        textColor=BLUE_HEADER, alignment=TA_CENTER, spaceAfter=2*mm)

    s_subtitle = ParagraphStyle('Subtitle2', parent=styles['Normal'],
        fontName='Helvetica', fontSize=11, leading=14,
        textColor=GREEN_DARK, alignment=TA_CENTER, spaceAfter=6*mm)

    s_section = ParagraphStyle('Section', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=13, leading=16,
        textColor=GREEN_DARK, spaceBefore=5*mm, spaceAfter=3*mm,
        borderPadding=(2*mm, 0, 1*mm, 0))

    s_body = ParagraphStyle('Body2', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14,
        textColor=GRAY_TEXT, alignment=TA_JUSTIFY, spaceAfter=2*mm)

    s_body_bold = ParagraphStyle('BodyBold', parent=s_body,
        fontName='Helvetica-Bold')

    s_bullet = ParagraphStyle('Bullet', parent=s_body,
        leftIndent=8*mm, bulletIndent=3*mm,
        bulletFontName='Helvetica', bulletFontSize=10,
        spaceBefore=1*mm, spaceAfter=1*mm)

    s_step_num = ParagraphStyle('StepNum', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=18, leading=22,
        textColor=white, alignment=TA_CENTER)

    s_step_title = ParagraphStyle('StepTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=BLUE_HEADER, spaceAfter=1*mm)

    s_step_body = ParagraphStyle('StepBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5, leading=13,
        textColor=GRAY_SUB)

    s_url = ParagraphStyle('URL', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=GREEN_DARK, alignment=TA_CENTER, spaceAfter=2*mm)

    s_footer = ParagraphStyle('Footer', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=10,
        textColor=GRAY_SUB, alignment=TA_CENTER)

    s_box_text = ParagraphStyle('BoxText', parent=s_body,
        fontSize=9.5, leading=13, textColor=GRAY_TEXT, spaceAfter=0)

    s_important = ParagraphStyle('Important', parent=s_body,
        fontName='Helvetica-Bold', fontSize=10, leading=14,
        textColor=HexColor('#C62828'), alignment=TA_CENTER)

    # ── Build elements ──
    elements = []
    page_width = WIDTH - 30*mm  # margins 15mm each side

    # ━━━ HEADER with logo ━━━
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=55*mm, height=18.5*mm)
    else:
        logo = Paragraph('<b>Bio-Clinic</b>', s_title)

    header_data = [[logo, Paragraph(
        '<font color="#1A3C5E" size="9">Via Renzo Mossa 23, 07100 Sassari</font><br/>'
        '<font color="#1A3C5E" size="9">Tel. 079 956 1332 · gestione@bio-clinic.it</font>',
        ParagraphStyle('HeaderRight', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9, leading=12,
            textColor=BLUE_HEADER, alignment=TA_LEFT))
    ]]
    header_table = Table(header_data, colWidths=[page_width*0.5, page_width*0.5])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
    ]))
    elements.append(header_table)

    # Green separator line
    sep_drawing = Drawing(page_width, 2*mm)
    sep_drawing.add(Rect(0, 0, page_width, 1.5*mm, fillColor=GREEN_DARK, strokeColor=None))
    elements.append(sep_drawing)
    elements.append(Spacer(1, 4*mm))

    # ━━━ TITLE ━━━
    elements.append(Paragraph('Come Scaricare i Tuoi Referti Online', s_title))
    elements.append(Paragraph(
        'Pap Test HPV · Test Genetici',
        s_subtitle))

    # ━━━ INTRO BOX ━━━
    intro_text = Paragraph(
        'Gentile Paziente,<br/><br/>'
        'Bio-Clinic mette a disposizione un <b>portale online sicuro</b> dove potrà consultare '
        'e scaricare i referti dei suoi esami. Il servizio è gratuito, disponibile '
        '<b>24 ore su 24</b> da qualsiasi dispositivo (computer, tablet o smartphone) '
        'e protetto con <b>crittografia AES-256</b>.', s_box_text)

    intro_table = Table([[intro_text]], colWidths=[page_width - 4*mm])
    intro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_PALE),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_GREEN),
        ('TOPPADDING', (0,0), (-1,-1), 4*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 4*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 4*mm),
        ('ROUNDEDCORNERS', [3*mm, 3*mm, 3*mm, 3*mm]),
    ]))
    elements.append(intro_table)
    elements.append(Spacer(1, 5*mm))

    # ━━━ SECTION: CREDENZIALI + TEMPISTICHE (2 colonne) ━━━
    elements.append(Paragraph('Come Riceverà le Credenziali di Accesso', s_section))

    # Left column: Credentials box (wider)
    cred_text = Paragraph(
        'Entro <b>24-48 ore dalla refertazione</b> dei suoi esami, riceverà una <b>email</b> '
        'all\'indirizzo che ha fornito in fase di accettazione contenente:<br/><br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;• il suo <b>nome utente</b> (username)<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;• una <b>password provvisoria</b><br/><br/>'
        '<b>Controlli anche la cartella Spam/Posta indesiderata</b> se non trova la mail nella posta in arrivo. '
        'Il mittente sarà <font color="#1B7A43"><b>noreply@bio-clinic.it</b></font>', s_box_text)

    cred_inner = Table([[cred_text]], colWidths=[page_width*0.52])
    cred_inner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GRAY_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, HexColor('#E0E0E0')),
        ('TOPPADDING', (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 3*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 3*mm),
    ]))

    # Right column: Timing box
    s_tempi_title = ParagraphStyle('TempiTitle', parent=s_box_text,
        fontName='Helvetica-Bold', fontSize=10.5, leading=14,
        textColor=GREEN_DARK, spaceAfter=2*mm)
    s_tempi_body = ParagraphStyle('TempiBody', parent=s_box_text,
        fontSize=9.5, leading=13)

    tempi_content = [
        Paragraph('<b>⏱ Tempistiche</b>', s_tempi_title),
        Paragraph(
            '• <b>Pap Test / HPV</b>:<br/>'
            '&nbsp;&nbsp;da <b>7 a 15</b> gg lavorativi<br/><br/>'
            '• <b>Test Genetici</b>:<br/>'
            '&nbsp;&nbsp;da <b>20 a 30</b> gg lavorativi<br/><br/>'
            '<i>Tempi orientativi. Riceverà una notifica email quando il referto sarà pronto.</i>',
            s_tempi_body),
    ]

    tempi_inner = Table([[tempi_content]], colWidths=[page_width*0.42])
    tempi_inner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#E3F2FD')),
        ('BOX', (0,0), (-1,-1), 0.5, HexColor('#90CAF9')),
        ('TOPPADDING', (0,0), (-1,-1), 4*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 4*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 4*mm),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

    # Two-column layout
    two_col = Table([[cred_inner, tempi_inner]], colWidths=[page_width*0.54, page_width*0.46])
    two_col.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (0,0), 0),
        ('RIGHTPADDING', (1,0), (1,0), 0),
        ('LEFTPADDING', (1,0), (1,0), 3*mm),
    ]))
    elements.append(two_col)
    elements.append(Spacer(1, 5*mm))

    # ━━━ SECTION: 4 STEPS ━━━
    elements.append(Paragraph('Come Accedere ai Referti — 4 Semplici Passaggi', s_section))

    steps = [
        ('1', 'Visiti il portale referti',
         'Dal browser del suo dispositivo, vada all\'indirizzo:<br/>'
         '<font color="#1B7A43"><b>referti.bio-clinic.it</b></font><br/>'
         'Oppure inquadri il QR Code in fondo a questo foglio.'),
        ('2', 'Inserisca le credenziali',
         'Nella schermata di accesso, inserisca l\'<b>email</b> e la '
         '<b>password provvisoria</b> ricevute via email, '
         'poi clicchi su <font color="#1B7A43"><b>"Accedi ai Referti"</b></font>.'),
        ('3', 'Cambi la password al primo accesso',
         'Il sistema le chiederà di scegliere una <b>nuova password personale</b>. '
         'Scelga una password sicura di almeno 8 caratteri con lettere e numeri.'),
        ('4', 'Scarichi i suoi referti',
         'Nella sua area riservata troverà i referti in formato <b>PDF originale</b>, '
         'firmati digitalmente. Può consultarli, scaricarli o stamparli.'),
    ]

    for num, title, body in steps:
        # Number circle + content
        num_para = Paragraph(f'<b>{num}</b>', s_step_num)

        # Create a small table for the circle background
        circle_table = Table([[num_para]], colWidths=[10*mm], rowHeights=[10*mm])
        circle_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), GREEN_DARK),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('ROUNDEDCORNERS', [5*mm, 5*mm, 5*mm, 5*mm]),
        ]))

        step_content = [
            Paragraph(title, s_step_title),
            Paragraph(body, s_step_body)
        ]

        from reportlab.platypus import KeepTogether
        content_cell = []
        content_cell.extend(step_content)

        row_data = [[circle_table, content_cell]]
        row_table = Table(row_data, colWidths=[14*mm, page_width - 18*mm])
        row_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (0,0), 'TOP'),
            ('VALIGN', (1,0), (1,0), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 1.5*mm),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1.5*mm),
            ('LEFTPADDING', (1,0), (1,0), 3*mm),
        ]))
        elements.append(row_table)

    elements.append(Spacer(1, 4*mm))

    # ━━━ IMPORTANT BOX: Change password ━━━
    warn_text = Paragraph(
        '⚠️&nbsp; <b>IMPORTANTE</b>: È obbligatorio cambiare la password dopo il primo accesso. '
        'La password provvisoria ha validità limitata per motivi di sicurezza.',
        ParagraphStyle('Warn', parent=s_box_text,
            fontName='Helvetica-Bold', fontSize=9.5,
            textColor=HexColor('#E65100'), alignment=TA_CENTER))

    warn_table = Table([[warn_text]], colWidths=[page_width - 4*mm])
    warn_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#FFF3E0')),
        ('BOX', (0,0), (-1,-1), 0.8, HexColor('#FFB74D')),
        ('TOPPADDING', (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 4*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 4*mm),
    ]))
    elements.append(warn_table)
    elements.append(Spacer(1, 5*mm))

    # ━━━ SECTION: Conservazione referti ━━━
    elements.append(Paragraph('Conservazione e Sicurezza dei Referti', s_section))
    elements.append(Paragraph(
        'I suoi referti sono conservati nell\'area riservata in conformità alle direttive '
        'della <b>normativa vigente in materia di conservazione dei documenti sanitari digitali</b> '
        '(D.Lgs. 82/2005 — Codice dell\'Amministrazione Digitale, Regolamento UE 2016/679 — GDPR, '
        'Linee Guida AgID sulla conservazione digitale). '
        'I dati sono protetti con crittografia end-to-end e accessibili esclusivamente dal titolare '
        'tramite le proprie credenziali personali.', s_body))

    elements.append(Spacer(1, 4*mm))

    # ━━━ QR CODE + URL SECTION ━━━
    qr_img = generate_qr('https://referti.bio-clinic.it', size=32*mm)

    url_block = [
        Paragraph('Acceda subito al portale:', ParagraphStyle('QrLabel',
            parent=s_body, fontSize=10, textColor=GRAY_SUB, alignment=TA_CENTER,
            spaceAfter=2*mm)),
        Paragraph('<b>referti.bio-clinic.it</b>', s_url),
        Paragraph('Inquadri il QR Code con la fotocamera<br/>del suo smartphone',
            ParagraphStyle('QrSub', parent=s_footer, alignment=TA_CENTER, fontSize=8.5)),
    ]

    qr_data = [[url_block, qr_img]]
    qr_table = Table(qr_data, colWidths=[page_width*0.6, page_width*0.4])
    qr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_PALE),
        ('BOX', (0,0), (-1,-1), 0.8, GREEN_DARK),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 5*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 5*mm),
    ]))
    elements.append(qr_table)
    elements.append(Spacer(1, 5*mm))

    # ━━━ HELP / CONTACT ━━━
    help_text = Paragraph(
        'Per assistenza tecnica o problemi di accesso, contatti la nostra accettazione:<br/>'
        '<b>Tel. 079 956 1332</b> (Lun-Ven 07:00–21:00, Sab 08:00–14:00) · '
        '<b>gestione@bio-clinic.it</b>', 
        ParagraphStyle('Help', parent=s_body, fontSize=9, alignment=TA_CENTER,
            textColor=GRAY_SUB))
    elements.append(help_text)
    elements.append(Spacer(1, 3*mm))

    # ━━━ FOOTER ━━━
    footer_sep = Drawing(page_width, 1*mm)
    footer_sep.add(Rect(0, 0, page_width, 0.5*mm, fillColor=BORDER_GREEN, strokeColor=None))
    elements.append(footer_sep)
    elements.append(Spacer(1, 2*mm))
    elements.append(Paragraph(
        'Bio Pharma S.r.l. · P.IVA 02869450904 · Via Renzo Mossa 23, 07100 Sassari (SS)<br/>'
        'Documento informativo per il paziente — Ritiro referti online',
        s_footer))

    # ── Generate PDF ──
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=15*mm,
        rightMargin=15*mm,
        topMargin=12*mm,
        bottomMargin=10*mm,
        title='Bio-Clinic — Referti Online',
        author='Bio-Clinic Sassari',
    )
    doc.build(elements)
    print(f'✅ PDF generato: {OUTPUT_PATH}')
    print(f'   Dimensione: {os.path.getsize(OUTPUT_PATH) / 1024:.0f} KB')


if __name__ == '__main__':
    build_pdf()
