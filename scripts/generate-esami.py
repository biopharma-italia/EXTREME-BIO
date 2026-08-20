#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generatore landing esami di laboratorio — Bio-Clinic Sassari
Fonti: site/data/listino-processed.json (prezzi allineati al fatturato GIPO)
       site/data/esami-volumi-gipo.json (volumi reali 12 mesi → priorità)
Output: site/esami/<id>/index.html + site/esami/index.html (hub) + site/sitemap-esami.xml

Uso:
  python3 scripts/generate-esami.py [--min-vol 30] [--dry-run]
"""
import json, re, os, sys, html, argparse
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTINO = os.path.join(ROOT, 'site/data/listino-processed.json')
VOLUMI = os.path.join(ROOT, 'site/data/esami-volumi-gipo.json')
OUTDIR = os.path.join(ROOT, 'site/esami')
SITEMAP = os.path.join(ROOT, 'site/sitemap-esami.xml')
TODAY = date.today().isoformat()

# Voci del listino che NON sono esami singoli (escluse dalle landing)
EXCLUDE_IDS = {'prelievo-venoso', 'pack-esami-percorso-obesit', 'pack-smart-base'}
EXCLUDE_PATTERNS = ('mounjaro', 'wegovy', 'slim-care', 'visita-', 'pack-', 'modulo-')

# Etichette leggibili per i sintomi del listino
SYMPTOM_LABELS = {
    'aumento_peso': 'Aumento di peso', 'stanchezza': 'Stanchezza persistente',
    'perdita_capelli': 'Perdita di capelli', 'dimagrimento': 'Dimagrimento improvviso',
    'menopausa': 'Menopausa', 'gravidanza': 'Gravidanza', 'palpitazioni': 'Palpitazioni',
    'insonnia': 'Insonnia', 'infertilita': 'Infertilità', 'ansia_stress': 'Ansia e stress',
    'allergie': 'Allergie', 'infezioni_frequenti': 'Infezioni frequenti',
    'dolori_articolari': 'Dolori articolari', 'febbre': 'Febbre',
    'disturbi_intestinali': 'Disturbi intestinali', 'anemia': 'Anemia / pallore',
    'acne': 'Acne', 'cistite': 'Cistite / bruciore urinario', 'gonfiore': 'Gonfiore',
    'mal_di_testa': 'Mal di testa', 'nausea': 'Nausea', 'prurito': 'Prurito',
    'sete_eccessiva': 'Sete eccessiva', 'crampi': 'Crampi muscolari',
    'irregolarita_ciclo': 'Ciclo irregolare', 'calo_libido': 'Calo del desiderio',
    'sudorazione': 'Sudorazione eccessiva', 'vertigini': 'Vertigini',
    'formicolii': 'Formicolii', 'osteoporosi': 'Osteoporosi / fragilità ossea',
}

# Preparazione nota per esami comuni (testo prudente, standard di laboratorio)
DIGIUNO_SI = {'glucosio', 'colesterolo-totale', 'colesterolo-hdl', 'colesterolo-ldl',
              'trigliceridi', 'glicemia', 'curva-glicemica', 'insulina', 'sideremia',
              'transferrina', 'acido-folico', 'vitamina-b12', 'omocisteina',
              'azotemia', 'creatinina', 'acido-urico', 'transaminasi-g-o-t-ast',
              'transaminasi-g-p-t-alt', 'gamma-glutamiltransferasi', 'bilirubina-totale',
              'bilirubina-diretta', 'fosfatasi-alcalina', 'proteine-totali', 'ferritina'}
DIGIUNO_NO = {'ormone-tireotropo-tsh', 'tsh-reflex', 'tiroxina-libera-ft4',
              'triiodotironina-libera-ft3', 'tiroxina-t4', 'emocromo', 'ves',
              'beta-hcg-plasmatico', 'vitamina-d-25-oh', 'pcr', 'gruppo-sanguigno',
              'anticorpi-anti-tireoglobulina', 'anticorpi-anti-recettori-tsh',
              'tireoglobulina', 'calcitonina', 'emoglobina-glicata-hba1c'}

def sample_type(e):
    n = (e['nome'] + ' ' + e['id']).lower()
    if 'urine' in n or 'urinocoltura' in n or 'urinari' in n: return 'urine'
    if 'feci' in n or 'fecale' in n or 'coprocolt' in n or 'parassiti' in n or 'sangue occulto' in n: return 'feci'
    if 'tampone' in n: return 'tampone'
    if 'liquido seminale' in n or 'spermiogramma' in n or 'capacitazione' in n: return 'liquido seminale'
    if 'saliva' in n: return 'saliva'
    return 'sangue venoso'

SAMPLE_TXT = {
    'sangue venoso': 'Prelievo di sangue venoso dal braccio, eseguito dalle nostre infermiere in pochi minuti.',
    'urine': 'Campione di urine raccolto in contenitore sterile (disponibile in accettazione o in farmacia).',
    'feci': 'Campione di feci raccolto in contenitore sterile (disponibile in accettazione o in farmacia).',
    'tampone': 'Tampone eseguito in sede dal personale sanitario in pochi minuti.',
    'liquido seminale': 'Campione raccolto secondo le istruzioni fornite dal laboratorio.',
    'saliva': 'Campione di saliva raccolto secondo le istruzioni del laboratorio.',
}

def prep_text(e):
    if e['id'] in DIGIUNO_SI:
        return ('Digiuno di 8 ore consigliato (è consentito bere acqua). '
                'Le istruzioni esatte arrivano nel messaggio WhatsApp di conferma della prenotazione.')
    if e['id'] in DIGIUNO_NO:
        return ('Non è richiesto il digiuno per questo esame. Se lo abbini ad altri prelievi, '
                'segui le indicazioni riportate nel messaggio WhatsApp di conferma.')
    st = sample_type(e)
    if st == 'urine':
        return 'Preferibile la prima urina del mattino, salvo diversa indicazione medica. Istruzioni dettagliate alla prenotazione.'
    if st == 'feci':
        return 'Nessuna preparazione particolare, salvo diversa indicazione medica. Istruzioni per la raccolta fornite in accettazione.'
    if st == 'tampone':
        return 'Segui le indicazioni fornite alla prenotazione (es. evitare lavande o terapie locali nei giorni precedenti).'
    return ('Per la maggior parte degli esami del sangue è consigliato un digiuno di 8 ore. '
            'Le istruzioni esatte per questo esame arrivano nel messaggio WhatsApp di conferma.')

def digiuno_short(e):
    if e['id'] in DIGIUNO_NO: return 'No digiuno'
    if e['id'] in DIGIUNO_SI: return 'Digiuno 8h'
    return 'Vedi preparazione'

def fmt_price(p):
    s = f"{p:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    return s[:-3] if s.endswith(',00') else s

SIGLE = {'TSH','FT3','FT4','T3','T4','HDL','LDL','VES','PCR','AST','ALT','GOT','GPT',
         'GGT','HCG','HBA1C','DNA','RNA','HIV','HCV','HBV','HPV','HLA','IGG','IGM',
         'IGA','IGE','CEA','PSA','CA','AFP','LH','FSH','SHBG','ACTH','GH','PT','PTT',
         'INR','LDH','CPK','CK','MB','BNP','TAS','ENA','ANA','AMA','ASMA','ANCA',
         'TPO','C3','C4','B12','D3','OH','FT','ETG','G','PDH','SCC','TA4','MIC',
         'CMV','EBV','VDRL','TPHA','RPR','OGTT'}

def fix_word(w):
    """Title-case una parola preservando sigle mediche, anche tra parentesi."""
    core = w.strip('()').strip()
    if not core:
        return w
    if core.upper() in SIGLE or re.fullmatch(r'[A-Z]{1,4}[0-9]{0,3}', core.upper()) and core.upper() in SIGLE:
        return w.upper() if w == core else w.replace(core, core.upper())
    if re.fullmatch(r'[A-Z0-9\-\.]{2,5}', core) and not core.isdigit() and any(c.isdigit() for c in core):
        return w  # sigle miste tipo 25-OH, G-6
    if core.isupper() or core.islower():
        fixed = core.capitalize()
        return w.replace(core, fixed)
    return w

def title_case(nome):
    """Nome esame leggibile: da MAIUSCOLO a Title Case preservando sigle."""
    words = re.sub(r'\s+', ' ', nome.strip()).split(' ')
    out = ' '.join(fix_word(w) for w in words)
    # minuscole per congiunzioni/articoli
    out = re.sub(r"\b(Di|Del|Dell|Della|Delle|Dei|E|Con|Per|Da|In|Su|Ed|Al|Alla)\b",
                 lambda m: m.group(1).lower(), out)
    out = out.replace("Dell'urina", "dell'urina").replace("Dell'", "dell'")
    return out[0].upper() + out[1:] if out else out

def esc(s):
    return html.escape(str(s), quote=True)

# ---------------------------------------------------------------- template
HEAD_TOP = """<!DOCTYPE html>
<html lang="it">
<head>
<!-- Google Consent Mode v2 (MUST fire before GTM) -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'granted',
  'personalization_storage': 'denied',
  'security_storage': 'granted',
  'wait_for_update': 500
});
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'region': ['IT', 'EU']
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
</script>
<!-- End Consent Mode v2 -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PWZWX5RS');</script>
<!-- End Google Tag Manager -->

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
"""

HEAD_ASSETS = """
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#00704A">

<!-- Preconnect & Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="/css/style.css?v=20260218-fix1">
<link rel="stylesheet" href="/css/header-spacing-fix.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style id="critical-css">
:root{--primary:#7CBA3D;--primary-dark:#008238;--green:#00A651;--green-dark:#00704A;--gray-700:#374151;--gray-800:#1f2937;--font-primary:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;--font-heading:'Poppins',var(--font-primary)}
*,::after,::before{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-primary);color:var(--gray-800);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;padding-top:100px!important}
.header{position:fixed!important;top:0;left:0;right:0;z-index:9999;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.1)}
.header .container{max-width:1280px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:70px}
.header .logo img{height:55px;width:auto}
h1{font-family:var(--font-heading);font-size:clamp(1.7rem,4vw,2.5rem);font-weight:700;line-height:1.2}
h2{font-family:var(--font-heading);font-size:clamp(1.3rem,3vw,1.7rem);font-weight:700}
.container{max-width:1080px;margin:0 auto;padding:0 1.5rem}
.breadcrumb{font-size:.85rem;color:#6b7280}
.breadcrumb a{color:var(--primary-dark);text-decoration:none}
.esame-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.8rem 1.5rem;border-radius:8px;font-weight:600;text-decoration:none;font-size:.95rem}
.esame-btn-green{background:var(--green);color:#fff}
.esame-btn-green:hover{background:var(--green-dark)}
.esame-btn-wa{background:#25D366;color:#fff}
.esame-btn-outline{border:2px solid var(--green);color:var(--green-dark);background:#fff}
.chip{display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:999px;padding:.3rem .85rem;font-size:.85rem;margin:.2rem}
.info-table{width:100%;border-collapse:collapse;font-size:.95rem}
.info-table th{text-align:left;padding:.7rem .9rem;background:#f0fdf4;color:#166534;width:38%;font-weight:600;vertical-align:top}
.info-table td{padding:.7rem .9rem;border-bottom:1px solid #f1f5f9}
.info-table tr{border-bottom:1px solid #f1f5f9}
details.faq{border:1px solid #e5e7eb;border-radius:10px;padding:1rem 1.25rem;margin-bottom:.75rem;background:#fff}
details.faq summary{font-weight:600;cursor:pointer;color:var(--gray-800)}
details.faq p{margin-top:.6rem;color:#475569}
.rel-card{border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem;text-decoration:none;color:inherit;display:block;background:#fff;transition:box-shadow .2s}
.rel-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
@media(max-width:768px){body{padding-top:70px!important}.header .container{height:60px}.header .logo img{height:40px}.esame-grid{grid-template-columns:1fr!important}.price-card{position:static!important}}
</style>
</head>
"""

HEADER_NAV = """<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<header class="header">
  <div class="container" style="max-width:1280px;">
    <a href="/" class="logo" title="Torna alla Homepage Bio-Clinic">
      <picture><source srcset="/images/logo-bioclinic.webp" type="image/webp"><img src="/images/logo-bioclinic.png" alt="Bio-Clinic Sassari - Poliambulatorio Medico" width="180" height="60" loading="eager"></picture>
    </a>
    <nav class="nav" aria-label="Navigazione principale">
      <ul class="nav-list">
        <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="/slim-care/" class="nav-link">Slim Care</a></li>
        <li class="nav-item"><a href="/ginecologia/" class="nav-link">Ginecologia</a></li>
        <li class="nav-item"><a href="/cardiologia/" class="nav-link">Cardiologia</a></li>
        <li class="nav-item"><a href="/endocrinologia/" class="nav-link">Endocrinologia</a></li>
        <li class="nav-item"><a href="/laboratorio/" class="nav-link">Laboratorio</a></li>
        <li class="nav-item"><a href="/contatti/" class="nav-link">Contatti</a></li>
        <li class="nav-item"><a href="tel:0799561332" class="nav-link nav-cta"><i class="fas fa-phone-alt"></i> Prenota</a></li>
      </ul>
    </nav>
    <button class="menu-toggle" aria-label="Apri menu" onclick="document.querySelector('.mobile-nav').classList.toggle('active');document.querySelector('.mobile-overlay').classList.toggle('active');">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<div class="mobile-overlay" onclick="this.classList.remove('active');document.querySelector('.mobile-nav').classList.remove('active');"></div>
<nav class="mobile-nav" aria-label="Menu mobile">
  <div class="mobile-nav-header">
    <span style="font-weight:700;color:#0D7377">Menu</span>
    <button class="mobile-nav-close" onclick="document.querySelector('.mobile-nav').classList.remove('active');document.querySelector('.mobile-overlay').classList.remove('active');" aria-label="Chiudi menu">&times;</button>
  </div>
  <div class="mobile-nav-list">
    <a href="/">Home</a>
    <a href="/esami/">Esami di Laboratorio</a>
    <a href="/laboratorio/">Laboratorio</a>
    <a href="/laboratorio/prenota/">Prenota Prelievo</a>
    <a href="/convenzioni/">Convenzioni</a>
    <a href="/contatti/">Contatti</a>
    <a href="tel:0799561332" style="color:#0D7377;font-weight:700;border-top:2px solid #0D7377;margin-top:1rem;padding-top:1rem;">
      <i class="fas fa-phone-alt"></i> Chiama 079 956 1332
    </a>
  </div>
</nav>
"""

FOOTER = """
<footer style="background:#1f2937;color:#d1d5db;padding:3rem 0 1.5rem;margin-top:3rem;">
  <div class="container" style="max-width:1280px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;margin-bottom:2rem;">
      <div>
        <h4 style="color:white;margin-bottom:1rem;">Bio-Clinic Sassari</h4>
        <p style="font-size:0.9rem;line-height:1.7;">
          Via Renzo Mossa, 23<br>07100 Sassari (SS)<br>
          Tel: <a href="tel:0799561332" style="color:#80CBC4;">079 956 1332</a><br>
          Email: gestione@bio-clinic.it
        </p>
      </div>
      <div>
        <h4 style="color:white;margin-bottom:1rem;">Orari</h4>
        <p style="font-size:0.9rem;line-height:1.7;">
          Lun - Ven: 07:00 - 21:00<br>
          Sabato: 08:00 - 14:00<br>
          Domenica: Chiuso
        </p>
      </div>
      <div>
        <h4 style="color:white;margin-bottom:1rem;">Laboratorio</h4>
        <p style="font-size:0.9rem;line-height:1.7;">
          <a href="/esami/" style="color:#d1d5db;">Tutti gli Esami</a><br>
          <a href="/laboratorio/prenota/" style="color:#d1d5db;">Prenota Prelievo</a><br>
          <a href="/convenzioni/" style="color:#d1d5db;">Convenzioni</a><br>
          <a href="/laboratorio/" style="color:#d1d5db;">Laboratorio Analisi</a>
        </p>
      </div>
      <div>
        <h4 style="color:white;margin-bottom:1rem;">Seguici</h4>
        <div style="display:flex;gap:1rem;font-size:1.5rem;">
          <a href="https://www.facebook.com/bioclinicss" style="color:#d1d5db;" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-square"></i></a>
          <a href="https://www.instagram.com/bioclinicss/" style="color:#d1d5db;" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid #374151;padding-top:1.5rem;text-align:center;font-size:0.8rem;color:#6b7280;">
      <p>&copy; 2026 Bio Pharma S.r.l. — P.IVA 02869450904 — Tutti i diritti riservati.</p>
      <p style="margin-top:0.5rem;">Le informazioni presenti in questa pagina hanno finalità informativa e non sostituiscono il consulto medico. Prezzi del listino privato aggiornati; per esami in convenzione il prezzo può variare.</p>
    </div>
  </div>
</footer>

</body>
</html>
"""

def build_page(e, related, vol):
    nome = title_case(e['nome'])
    prezzo = fmt_price(e['prezzo'])
    referto = e.get('referto', '48-72h')
    cat = e['cat']
    url = f"https://bio-clinic.it/esami/{e['id']}/"
    st = sample_type(e)
    prep = prep_text(e)
    dig = digiuno_short(e)

    title = f"{nome} a Sassari: Costo €{prezzo}, Referto in {referto} | Bio-Clinic"
    if len(title) > 65:
        title = f"{nome} Sassari: €{prezzo}, Referto {referto} | Bio-Clinic"
    if len(title) > 70:
        title = f"{nome} Sassari: €{prezzo} | Bio-Clinic"
    if len(title) > 75:
        title = f"{nome} Sassari | Bio-Clinic"
    if len(title) > 75:
        # nome troppo lungo: tronca al confine di parola più vicino
        base = nome
        while len(f"{base} Sassari | Bio-Clinic") > 75 and ' ' in base:
            base = base.rsplit(' ', 1)[0].rstrip(' -–,(')
        title = f"{base} Sassari | Bio-Clinic"
    descr = (f"{nome} a Sassari: costo €{prezzo}, referto in {referto}. Accesso libero Lun-Ven 7-21, Sab 8-14. "
             f"Prenota online con conferma WhatsApp. Bio-Clinic, Via Renzo Mossa 23.")

    sintomi = [SYMPTOM_LABELS.get(s, s.replace('_',' ').capitalize()) for s in e.get('sintomi', [])]

    articolo = "l'" if nome.lower().startswith(('a','e','i','o','u','h')) else 'il '
    faq = [
        (f"Quanto costa {articolo}{nome} da Bio-Clinic a Sassari?",
         f"Il costo è di €{prezzo} con tariffario trasparente, senza costi nascosti. Al prezzo dell'esame si aggiunge solo il prelievo (€3,50) se eseguito su sangue. Sono attive convenzioni con UniSalute, Previmedical e altri fondi sanitari."),
        ("Serve la prenotazione?",
         "No, l'accesso è libero dal lunedì al venerdì 07:00-21:00 e il sabato 08:00-14:00. Prenotando online in 30 secondi salti la fila e ricevi conferma immediata via WhatsApp."),
        ("Quando è pronto il referto?",
         f"Il referto è disponibile in {referto}, scaricabile online dal portale referti Bio-Clinic o ritirabile in sede."),
        ("Come devo prepararmi?", prep),
        ("Posso usare la mia assicurazione sanitaria?",
         "Sì, Bio-Clinic è convenzionata con UniSalute, Previmedical, Metasalute, FASI, Generali Welion e altri fondi. Vedi la pagina Convenzioni per l'elenco completo."),
    ]

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "MedicalTest",
                "@id": url + "#test",
                "name": nome,
                "url": url,
                "description": f"{nome} presso il laboratorio analisi Bio-Clinic di Sassari. Referto in {referto}.",
                "offers": {
                    "@type": "Offer",
                    "price": f"{e['prezzo']:.2f}",
                    "priceCurrency": "EUR",
                    "availability": "https://schema.org/InStock",
                    "url": url
                },
                "provider": {
                    "@type": "MedicalClinic",
                    "name": "Bio-Clinic Sassari",
                    "telephone": "+390799561332",
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "Via Renzo Mossa 23",
                        "addressLocality": "Sassari",
                        "postalCode": "07100",
                        "addressRegion": "SS",
                        "addressCountry": "IT"
                    }
                }
            },
            {
                "@type": "FAQPage",
                "@id": url + "#faq",
                "mainEntity": [
                    {"@type": "Question", "name": q,
                     "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in faq
                ]
            },
            {
                "@type": "BreadcrumbList",
                "@id": url + "#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
                    {"@type": "ListItem", "position": 2, "name": "Esami di Laboratorio", "item": "https://bio-clinic.it/esami/"},
                    {"@type": "ListItem", "position": 3, "name": nome, "item": url}
                ]
            }
        ]
    }

    chips_html = ''
    if sintomi:
        chips_html = f"""
<section style="padding:2rem 0 0.5rem;">
  <div class="container">
    <h2 style="margin-bottom:0.75rem;">Quando fare questo esame</h2>
    <p style="color:#475569;margin-bottom:0.75rem;">L'esame viene spesso richiesto dal medico in presenza di:</p>
    <div>{''.join(f'<span class="chip">{esc(s)}</span>' for s in sintomi)}</div>
  </div>
</section>"""

    rel_html = ''
    if related:
        cards = ''.join(
            f'''<a class="rel-card" href="/esami/{r['id']}/">
        <div style="font-weight:600;margin-bottom:0.3rem;">{esc(title_case(r['nome']))}</div>
        <div style="color:var(--green-dark);font-weight:700;">€{fmt_price(r['prezzo'])}</div>
        <div style="font-size:0.82rem;color:#94a3b8;">Referto in {esc(r.get('referto','48-72h'))}</div>
      </a>''' for r in related)
        rel_html = f"""
<section style="padding:2rem 0;">
  <div class="container">
    <h2 style="margin-bottom:1rem;">Altri esami — {esc(cat)}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem;">
      {cards}
    </div>
  </div>
</section>"""

    faq_html = ''.join(
        f'''<details class="faq"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>''' for q, a in faq)

    page = HEAD_TOP + f"""
<!-- SEO Meta -->
<title>{esc(title)}</title>
<meta name="description" content="{esc(descr)}">
<meta name="author" content="Bio-Clinic Sassari">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="{url}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(descr)}">
<meta property="og:image" content="https://bio-clinic.it/images/bio-clinic-hero.jpg">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="Bio-Clinic Sassari">
<meta property="og:locale" content="it_IT">
<meta property="article:modified_time" content="{TODAY}T10:00:00+01:00">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(descr)}">

<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
""" + HEAD_ASSETS + HEADER_NAV + f"""
<main id="main-content">

<!-- Breadcrumb -->
<div style="background:#f9fafb;padding:0.75rem 0;border-bottom:1px solid #e5e7eb;">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> &rsaquo; <a href="/esami/">Esami di Laboratorio</a> &rsaquo; <strong>{esc(nome)}</strong>
    </nav>
  </div>
</div>

<!-- HERO + PRICE CARD -->
<section style="padding:2.5rem 0 2rem;background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);">
  <div class="container">
    <div class="esame-grid" style="display:grid;grid-template-columns:1fr 340px;gap:2.5rem;align-items:start;">
      <div>
        <span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:0.25rem 0.9rem;font-size:0.8rem;font-weight:600;margin-bottom:0.75rem;">{esc(cat)}</span>
        <h1>{esc(nome)} a Sassari</h1>
        <p style="color:#475569;margin:1rem 0 1.25rem;font-size:1.05rem;">
          Esame eseguito presso il laboratorio analisi Bio-Clinic di Sassari, in Via Renzo Mossa 23.
          Accesso libero senza prenotazione oppure prenotazione online in 30 secondi con conferma immediata su WhatsApp.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;font-size:0.95rem;">
          <div><i class="fas fa-euro-sign" style="color:var(--green);"></i> <strong>€{prezzo}</strong> tariffa trasparente</div>
          <div><i class="fas fa-file-medical" style="color:var(--green);"></i> Referto in <strong>{esc(referto)}</strong></div>
          <div><i class="fas fa-utensils" style="color:var(--green);"></i> {esc(dig)}</div>
          <div><i class="fas fa-clock" style="color:var(--green);"></i> Lun-Ven 7-21, Sab 8-14</div>
        </div>
      </div>
      <div class="price-card" style="background:#fff;border:2px solid var(--green);border-radius:16px;padding:1.5rem;box-shadow:0 8px 24px rgba(0,166,81,0.12);position:sticky;top:110px;">
        <div style="font-size:0.85rem;color:#64748b;">Costo esame</div>
        <div style="font-family:'Poppins';font-size:2.4rem;font-weight:700;color:var(--green-dark);">€{prezzo}</div>
        <div style="font-size:0.85rem;color:#64748b;margin-bottom:1rem;">Referto in {esc(referto)} · portale online</div>
        <a href="/laboratorio/prenota/" class="esame-btn esame-btn-green" style="width:100%;justify-content:center;margin-bottom:0.6rem;"><i class="fas fa-calendar-check"></i> Prenota il prelievo</a>
        <a href="https://wa.me/390799561332" class="esame-btn esame-btn-wa" style="width:100%;justify-content:center;margin-bottom:0.6rem;" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chiedi su WhatsApp</a>
        <a href="tel:0799561332" class="esame-btn esame-btn-outline" style="width:100%;justify-content:center;"><i class="fas fa-phone-alt"></i> 079 956 1332</a>
        <div style="text-align:center;font-size:0.8rem;color:#94a3b8;margin-top:0.85rem;"><i class="fas fa-star" style="color:#fbbf24;"></i> 4.450 recensioni verificate</div>
      </div>
    </div>
  </div>
</section>

<!-- INFO TABLE -->
<section style="padding:2rem 0 0.5rem;">
  <div class="container">
    <h2 style="margin-bottom:1rem;">Informazioni pratiche</h2>
    <table class="info-table">
      <tr><th>Tipo di campione</th><td>{esc(SAMPLE_TXT[st])}</td></tr>
      <tr><th>Preparazione</th><td>{esc(prep)}</td></tr>
      <tr><th>Tempi di refertazione</th><td>Referto disponibile in {esc(referto)}, scaricabile online dal portale referti o ritirabile in sede.</td></tr>
      <tr><th>Prenotazione</th><td>Non obbligatoria: accesso libero Lun-Ven 07:00-21:00, Sab 08:00-14:00. Prenotando online salti la fila e ricevi conferma WhatsApp.</td></tr>
      <tr><th>Convenzioni</th><td>UniSalute, Previmedical, Metasalute, FASI, Generali Welion e altri fondi. <a href="/convenzioni/" style="color:var(--green-dark);">Vedi tutte le convenzioni</a>.</td></tr>
    </table>
  </div>
</section>
{chips_html}
<!-- FAQ -->
<section style="padding:2rem 0 0.5rem;">
  <div class="container">
    <h2 style="margin-bottom:1rem;">Domande frequenti</h2>
    {faq_html}
  </div>
</section>
{rel_html}
<!-- CTA FINALE -->
<section style="padding:1.5rem 0 1rem;">
  <div class="container">
    <div style="background:linear-gradient(135deg,var(--green) 0%,var(--green-dark) 100%);border-radius:16px;padding:2rem;text-align:center;color:#fff;">
      <h2 style="color:#fff;margin-bottom:0.5rem;">Fai {esc(nome)} oggi stesso</h2>
      <p style="opacity:0.92;margin-bottom:1.25rem;">Senza prenotazione Lun-Ven 7:00-21:00 e Sab 8:00-14:00 — oppure prenota online in 30 secondi.</p>
      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
        <a href="/laboratorio/prenota/" class="esame-btn" style="background:#fff;color:var(--green-dark);">Prenota online</a>
        <a href="https://wa.me/390799561332" class="esame-btn" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.5);" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>
      </div>
    </div>
  </div>
</section>

</main>
""" + FOOTER
    return page


def build_hub(esami_by_cat, total):
    url = "https://bio-clinic.it/esami/"
    title = "Esami di Laboratorio a Sassari: Listino Prezzi Trasparente | Bio-Clinic"
    descr = (f"Listino esami di laboratorio a Sassari con prezzi trasparenti: {total} esami con costo e tempi di referto. "
             "Accesso libero Lun-Ven 7-21, Sab 8-14. Conferma prenotazione via WhatsApp.")

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": url,
                "name": "Esami di Laboratorio Bio-Clinic Sassari",
                "url": url,
                "description": descr
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
                    {"@type": "ListItem", "position": 2, "name": "Esami di Laboratorio", "item": url}
                ]
            }
        ]
    }

    sections = ''
    for cat in sorted(esami_by_cat, key=lambda c: -len(esami_by_cat[c])):
        items = sorted(esami_by_cat[cat], key=lambda e: title_case(e['nome']))
        cards = ''.join(
            f'''<a class="rel-card" href="/esami/{e['id']}/">
        <div style="font-weight:600;margin-bottom:0.3rem;">{esc(title_case(e['nome']))}</div>
        <div style="color:var(--green-dark);font-weight:700;">€{fmt_price(e['prezzo'])}</div>
        <div style="font-size:0.82rem;color:#94a3b8;">Referto in {esc(e.get('referto','48-72h'))}</div>
      </a>''' for e in items)
        sections += f"""
<section style="padding:1.5rem 0 0.5rem;" id="{esc(cat.lower().replace('/','-').replace(' ','-'))}">
  <div class="container">
    <h2 style="margin-bottom:1rem;">{esc(cat)} <span style="font-size:0.9rem;color:#94a3b8;font-weight:400;">({len(items)} esami)</span></h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem;">
      {cards}
    </div>
  </div>
</section>"""

    page = HEAD_TOP + f"""
<!-- SEO Meta -->
<title>{esc(title)}</title>
<meta name="description" content="{esc(descr)}">
<meta name="author" content="Bio-Clinic Sassari">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="{url}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(descr)}">
<meta property="og:image" content="https://bio-clinic.it/images/bio-clinic-hero.jpg">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="Bio-Clinic Sassari">
<meta property="og:locale" content="it_IT">
<meta property="article:modified_time" content="{TODAY}T10:00:00+01:00">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(descr)}">

<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
""" + HEAD_ASSETS + HEADER_NAV + f"""
<main id="main-content">

<div style="background:#f9fafb;padding:0.75rem 0;border-bottom:1px solid #e5e7eb;">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> &rsaquo; <strong>Esami di Laboratorio</strong>
    </nav>
  </div>
</div>

<section style="padding:2.5rem 0 1.5rem;background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);">
  <div class="container">
    <h1>Esami di Laboratorio a Sassari</h1>
    <p style="color:#475569;margin:1rem 0;font-size:1.05rem;max-width:760px;">
      Prezzi trasparenti per {total} esami di laboratorio: costo, tempi di referto e preparazione per ogni esame.
      Accesso libero senza prenotazione <strong>Lun-Ven 7:00-21:00 e Sab 8:00-14:00</strong>, oppure prenotazione
      online con <strong>conferma immediata via WhatsApp</strong>.
    </p>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
      <a href="/laboratorio/prenota/" class="esame-btn esame-btn-green"><i class="fas fa-calendar-check"></i> Prenota il prelievo</a>
      <a href="https://wa.me/390799561332" class="esame-btn esame-btn-wa" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chiedi su WhatsApp</a>
      <a href="/convenzioni/" class="esame-btn esame-btn-outline"><i class="fas fa-shield-alt"></i> Convenzioni assicurative</a>
    </div>
  </div>
</section>
{sections}
</main>
""" + FOOTER
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--min-vol', type=int, default=30)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    listino = json.load(open(LISTINO))
    volumi = json.load(open(VOLUMI))

    def excluded(e):
        if e['id'] in EXCLUDE_IDS: return True
        return any(p in e['id'] for p in EXCLUDE_PATTERNS)

    seen = set()
    selected = []
    for e in listino:
        if volumi.get(e['id'], 0) >= args.min_vol and not excluded(e) and e['id'] not in seen:
            seen.add(e['id'])
            selected.append(e)
    selected.sort(key=lambda e: -volumi.get(e['id'], 0))
    print(f"Esami selezionati (vol>={args.min_vol}): {len(selected)}")

    by_cat = {}
    for e in selected:
        by_cat.setdefault(e['cat'], []).append(e)

    if args.dry_run:
        for e in selected[:20]:
            print(f"  {e['id']:50} vol={volumi[e['id']]:>5} €{e['prezzo']}")
        return

    sel_ids = {e['id'] for e in selected}
    urls = []
    for e in selected:
        related = [r for r in by_cat[e['cat']] if r['id'] != e['id']][:6]
        page = build_page(e, related, volumi.get(e['id'], 0))
        d = os.path.join(OUTDIR, e['id'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w').write(page)
        urls.append(f"https://bio-clinic.it/esami/{e['id']}/")

    # hub
    os.makedirs(OUTDIR, exist_ok=True)
    open(os.path.join(OUTDIR, 'index.html'), 'w').write(build_hub(by_cat, len(selected)))
    urls.insert(0, "https://bio-clinic.it/esami/")

    # sitemap
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        prio = '0.8' if u.endswith('/esami/') else '0.7'
        sm.append(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>monthly</changefreq><priority>{prio}</priority></url>")
    sm.append('</urlset>')
    open(SITEMAP, 'w').write('\n'.join(sm) + '\n')

    print(f"Generati: {len(selected)} landing + hub + sitemap-esami.xml ({len(urls)} URL)")

if __name__ == '__main__':
    main()
