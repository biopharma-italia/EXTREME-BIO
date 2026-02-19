#!/usr/bin/env python3
"""
Bio-Clinic Batch Article Generator v2.0
Uses LLM to generate unique medical content for each article,
then assembles complete HTML pages from template parts.
Output: site/salute/_drafts/{slug}/index.html
"""

import csv, json, os, sys, re, time, yaml
from datetime import datetime
from openai import OpenAI

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SITE_DIR = os.path.join(ROOT_DIR, "site")
DRAFTS_DIR = os.path.join(SITE_DIR, "salute", "_drafts")
CSV_PATH = os.path.join(ROOT_DIR, "bio-clinic-calendario-90gg.csv")

# Load LLM config
config_path = os.path.expanduser("~/.genspark_llm.yaml")
with open(config_path, 'r') as f:
    cfg = yaml.safe_load(f)

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY") or os.environ.get("GENSPARK_TOKEN") or cfg['openai']['api_key'],
    base_url=cfg['openai']['base_url']
)

# Load template parts
with open(os.path.join(SCRIPT_DIR, "template-head.html"), "r", encoding="utf-8") as f:
    TEMPLATE_HEAD = f.read()
with open(os.path.join(SCRIPT_DIR, "template-header.html"), "r", encoding="utf-8") as f:
    TEMPLATE_HEADER = f.read()
with open(os.path.join(SCRIPT_DIR, "template-footer.html"), "r", encoding="utf-8") as f:
    TEMPLATE_FOOTER = f.read()

# ── Specialist Database ──
SPECIALIST_DB = {
    'alessandra-musinu': {'name': 'Dott.ssa Alessandra Musinu', 'role': 'Dermatologa', 'albo': '5405'},
    'alessandro-pandolfi': {'name': 'Dott. Alessandro Pandolfi', 'role': 'Biologo Nutrizionista', 'albo': '73215'},
    'alessia-piras': {'name': 'Dott.ssa Alessia Piras', 'role': 'Psicoterapeuta', 'albo': ''},
    'andrea-donato': {'name': 'Dott. Andrea Donato', 'role': 'Ortopedico', 'albo': '5659'},
    'angelica-fois': {'name': 'Dott.ssa Angelica Fois', 'role': 'Ostetrica', 'albo': '5905'},
    'angelo-deplano': {'name': 'Dott. Angelo Deplano', 'role': 'Gastroenterologo', 'albo': '1773'},
    'antonella-galatino': {'name': 'Dott.ssa Antonella Galatino', 'role': 'Nutrizionista', 'albo': ''},
    'antonella-pruneddu': {'name': 'Dott.ssa Antonella Pruneddu', 'role': 'Ginecologa', 'albo': '4957'},
    'antonio-michele-cavazzuti': {'name': 'Dott. Antonio Michele Cavazzuti', 'role': 'Ecografista', 'albo': '2060'},
    'antonio-solinas': {'name': 'Prof. Antonio Solinas', 'role': 'Internista - Epatologo', 'albo': '1577'},
    'camilla-ruzzoli': {'name': 'Dott.ssa Camilla Ruzzoli', 'role': 'Ostetrica', 'albo': ''},
    'carlo-burrai': {'name': 'Dr. Carlo Burrai', 'role': 'Endocrinologo Pediatra', 'albo': '2295'},
    'carlos-manuel-cambara-zuniga': {'name': 'Dott. Carlos Manuel Cambara Zuniga', 'role': 'Urologo - Andrologo', 'albo': '5506'},
    'cinzia-guarino': {'name': 'Dott.ssa Cinzia Guarino', 'role': 'Biologa Laboratorio', 'albo': ''},
    'daniele-sabiu': {'name': 'Dr. Daniele Sabiu', 'role': 'Ematologo', 'albo': '3669'},
    'fabrizia-caucci': {'name': 'Dott.ssa Fabrizia Caucci', 'role': 'Diabetologa - Endocrinologa', 'albo': '4213'},
    'francesco-bussu': {'name': 'Prof. Francesco Bussu', 'role': 'Otorinolaringoiatra', 'albo': '56622'},
    'francesco-dessole': {'name': 'Dott. Francesco Dessole', 'role': 'Ginecologo', 'albo': '5244'},
    'francesco-santoru': {'name': 'Dott. Francesco Santoru', 'role': 'Oculista', 'albo': '6098'},
    'francesco-tolu': {'name': 'Dott. Francesco Tolu', 'role': 'Endocrinologo', 'albo': '4803'},
    'gianfranco-manchia': {'name': 'Dott. Gianfranco Manchia', 'role': 'Medico Competente', 'albo': '3431'},
    'giorgio-chiarelli': {'name': 'Dr. Giorgio Chiarelli', 'role': 'Medico dello Sport', 'albo': '3471'},
    'giovanna-costa': {'name': 'Dott.ssa Giovanna Costa', 'role': 'Dermatologa', 'albo': '2596'},
    'giuliana-guagnozzi': {'name': 'Dott.ssa Giuliana Guagnozzi', 'role': 'Cardiologa', 'albo': '42447'},
    'gloria-reggiani': {'name': 'Dott.ssa Gloria Reggiani', 'role': 'Biologa Laboratorio', 'albo': ''},
    'guido-marongiu': {'name': 'Dott. Guido Marongiu', 'role': 'Chirurgo Vascolare', 'albo': '6287'},
    'irene-aini': {'name': 'Dott.ssa Irene Aini', 'role': 'Endocrinologa', 'albo': '6379'},
    'luigi-podda': {'name': 'Dott. Luigi Podda', 'role': 'Ematologo', 'albo': '3633'},
    'maddalena-pola': {'name': 'Dott.ssa Maddalena Pola', 'role': 'Ginecologa', 'albo': '5037'},
    'marco-petrillo': {'name': 'Prof. Marco Petrillo', 'role': 'Ginecologo', 'albo': '6333'},
    'margherita-dessole': {'name': 'Dott.ssa Margherita Dessole', 'role': 'Ginecologa', 'albo': '5333'},
    'maria-laura-de-luca': {'name': 'Dott.ssa Maria Laura De Luca', 'role': 'Neurologa', 'albo': '5408'},
    'maria-pina-pintus': {'name': 'Dott.ssa Maria Pina Pintus', 'role': 'Oculista', 'albo': '3241'},
    'mariolina-azara': {'name': 'Dott.ssa Mariolina Azara', 'role': 'Pediatra', 'albo': '4300'},
    'matteo-zucca': {'name': 'Dott. Matteo Zucca', 'role': 'Oculista', 'albo': '6230'},
    'niccolo-melis': {'name': 'Dott. Niccolo Melis', 'role': 'Reumatologo', 'albo': '2937'},
    'nicola-frau': {'name': 'Dott. Nicola Frau', 'role': 'Fisiatra', 'albo': '1306'},
    'paola-dettori': {'name': 'Dott.ssa Paola Dettori', 'role': 'Chirurgo Vascolare', 'albo': '4879'},
    'paolo-dessole': {'name': 'Dott. Paolo Dessole', 'role': 'Nefrologo', 'albo': '2748'},
    'paolo-franca': {'name': 'Dott. Paolo Franca', 'role': 'Cardiologo', 'albo': '6108'},
    'paolo-pischedda': {'name': 'Dott. Paolo Pischedda', 'role': 'Cardiologo', 'albo': '5264'},
    'pietro-lisai': {'name': 'Dott. Pietro Lisai', 'role': 'Ortopedico', 'albo': '3174'},
    'pietro-pirina': {'name': 'Prof. Pietro Pirina', 'role': 'Pneumologo', 'albo': '2987'},
    'roberto-mancino': {'name': 'Dott. Roberto Mancino', 'role': 'Chirurgo Vascolare', 'albo': '5359'},
    'salvatore-dessole': {'name': 'Prof. Salvatore Dessole', 'role': 'Direttore Sanitario', 'albo': '1556'},
    'sara-uras': {'name': 'Dott.ssa Sara Uras', 'role': 'Cardiologa', 'albo': '5084'},
    'sebastiano-traccis': {'name': 'Dott. Sebastiano Traccis', 'role': 'Neurologo', 'albo': '2714'},
    'sergio-paolo-sotgia': {'name': 'Dott. Sergio Paolo Sotgia', 'role': 'Nefrologo', 'albo': '5050'},
    'sonia-bove': {'name': 'Dott.ssa Sonia Bove', 'role': 'Ginecologa - Senologa', 'albo': '59654'},
    'speranza-anedda': {'name': 'Dott.ssa Speranza Anedda', 'role': 'Dermatologa', 'albo': '10444'},
    'tonino-bullitta': {'name': 'Dr. Tonino Bullitta', 'role': 'Cardiologo', 'albo': '2054'},
}

SPECIALTY_META = {
    'cardiologia': {'emoji': '&#10084;&#65039;', 'page': '/cardiologia/', 'label': 'Cardiologia'},
    'endocrinologia': {'emoji': '&#129419;', 'page': '/endocrinologia/', 'label': 'Endocrinologia'},
    'ginecologia': {'emoji': '&#128105;&zwj;&#9877;&#65039;', 'page': '/ginecologia/', 'label': 'Ginecologia'},
    'gastroenterologia': {'emoji': '&#128300;', 'page': '/gastroenterologia/', 'label': 'Gastroenterologia'},
    'ortopedia': {'emoji': '&#129460;', 'page': '/ortopedia/', 'label': 'Ortopedia'},
    'dermatologia': {'emoji': '&#129658;', 'page': '/dermatologia/', 'label': 'Dermatologia'},
    'urologia': {'emoji': '&#129658;', 'page': '/urologia/', 'label': 'Urologia'},
    'neurologia': {'emoji': '&#129504;', 'page': '/neurologia/', 'label': 'Neurologia'},
    'ematologia': {'emoji': '&#129656;', 'page': '/ematologia/', 'label': 'Ematologia'},
    'pneumologia': {'emoji': '&#129729;', 'page': '/pneumologia/', 'label': 'Pneumologia'},
    'reumatologia': {'emoji': '&#129460;', 'page': '/reumatologia/', 'label': 'Reumatologia'},
    'oculistica': {'emoji': '&#128065;&#65039;', 'page': '/oculistica/', 'label': 'Oculistica'},
    'otorinolaringoiatria': {'emoji': '&#128066;', 'page': '/otorinolaringoiatria/', 'label': 'ORL'},
    'chirurgia-vascolare': {'emoji': '&#129658;', 'page': '/chirurgia-vascolare/', 'label': 'Chirurgia Vascolare'},
    'nefrologia': {'emoji': '&#129658;', 'page': '/nefrologia/', 'label': 'Nefrologia'},
    'pediatria': {'emoji': '&#128118;', 'page': '/pediatria/', 'label': 'Pediatria'},
    'nutrizionale': {'emoji': '&#129367;', 'page': '/nutrizione/', 'label': 'Nutrizione'},
    'medicina-interna': {'emoji': '&#127973;', 'page': '/medicina-interna/', 'label': 'Medicina Interna'},
    'psicologia': {'emoji': '&#129504;', 'page': '/psicologia/', 'label': 'Psicologia'},
    'medicina-sport': {'emoji': '&#127939;', 'page': '/medicina-sport/', 'label': 'Medicina dello Sport'},
    'medicina-lavoro': {'emoji': '&#127981;', 'page': '/medicina-del-lavoro/', 'label': 'Medicina del Lavoro'},
    'laboratorio': {'emoji': '&#128300;', 'page': '/laboratorio/', 'label': 'Laboratorio Analisi'},
}

ICD10_CODES = {
    'ipotiroidismo': 'E03.9', 'endometriosi-sintomi': 'N80', 'diabete-tipo-2-sardegna': 'E11',
    'anemia-mediterranea-talassemia': 'D56', 'reflusso-gastroesofageo': 'K21', 'noduli-tiroidei': 'E04',
    'cervicalgia-dolore-collo': 'M54.2', 'dermatite-atopica': 'L20', 'cistite-ricorrente': 'N30.1',
    'fibrillazione-atriale': 'I48', 'sindrome-ovaio-policistico': 'E28.2', 'ernia-disco-lombare': 'M51.1',
    'helicobacter-pylori': 'B96.81', 'ipertiroidismo': 'E05', 'asma-bronchiale': 'J45',
    'menopausa-sintomi': 'N95.1', 'psoriasi': 'L40', 'prostatite': 'N41', 'colesterolo-alto': 'E78',
    'artrite-reumatoide-sardegna': 'M05', 'cefalea-emicrania': 'G43', 'infertilita-femminile': 'N97',
    'sclerosi-multipla-sardegna': 'G35', 'insufficienza-venosa': 'I87.2', 'otite-acufeni': 'H93.1',
    'glaucoma': 'H40', 'celiachia-sardegna': 'K90.0', 'nefropatia-diabetica': 'E11.22',
    'obesita-sindrome-metabolica': 'E66', 'calcoli-renali': 'N20', 'ansia-attacchi-panico': 'F41.0',
    'tunnel-carpale': 'G56.0', 'gastrite-cronica': 'K29.5', 'ecografia-gravidanza': 'Z36',
    'apnee-notturne': 'G47.33', 'allergie-stagionali': 'J30.1', 'scoliosi-postura': 'M41',
    'epatite-steatosi-epatica': 'K76.0', 'nei-melanoma-prevenzione': 'D22',
    'endocrinologo-pediatrico': 'E30', 'ipertrofia-prostatica': 'N40', 'vertigini-labirintite': 'H81',
    'infertilita-maschile': 'N46', 'fibromialgia': 'M79.7', 'vitamina-d-carenza': 'E55',
    'visita-medicina-sport': 'Z02.5', 'sindrome-intestino-irritabile': 'K58',
    'osteoporosi-prevenzione': 'M81', 'cataratta': 'H25', 'pap-test-hpv': 'Z12.4',
    'medicina-lavoro-sassari': 'Z02.1', 'dolore-spalla': 'M75', 'tiroide-gravidanza': 'O99.28',
    'eczema-mani': 'L30', 'incontinenza-urinaria': 'N39.3', 'aritmie-cardiache': 'I49',
    'ernia-inguinale': 'K40', 'acne-adulti': 'L70', 'controllo-nei-bambini': 'Z00.1',
    'neuropatia-periferica': 'G62', 'check-up-cardiovascolare': 'Z13.6',
    'alimentazione-sport': 'Z71.3', 'analisi-sangue-guida': 'Z01.7',
}

MONTHS_IT = {1:'Gennaio',2:'Febbraio',3:'Marzo',4:'Aprile',5:'Maggio',6:'Giugno',
             7:'Luglio',8:'Agosto',9:'Settembre',10:'Ottobre',11:'Novembre',12:'Dicembre'}


def name_to_slug(name):
    """Convert specialist name to slug."""
    name = name.strip()
    for prefix in ['Dott.ssa ', 'Dott. ', 'Prof. ', 'Dr. ']:
        if name.startswith(prefix):
            name = name[len(prefix):]
    slug = name.lower().replace(' ', '-').replace("'", "")
    # Handle special chars
    for a, b in [('à','a'),('è','e'),('é','e'),('ì','i'),('ò','o'),('ù','u'),('ü','u'),('ö','o'),('ä','a')]:
        slug = slug.replace(a, b)
    return slug


def resolve_specialists(specialists_str):
    """Parse specialists string and resolve to DB entries."""
    names = [n.strip() for n in specialists_str.split(',') if n.strip()]
    resolved = []
    for name in names:
        slug = name_to_slug(name)
        if slug in SPECIALIST_DB:
            info = SPECIALIST_DB[slug].copy()
            info['slug'] = slug
            resolved.append(info)
        else:
            # Fallback
            resolved.append({'name': name, 'slug': slug, 'role': '', 'albo': ''})
    return resolved


def format_date_it(date_str):
    """2026-02-19 -> 19 Febbraio 2026"""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return f"{d.day} {MONTHS_IT[d.month]} {d.year}"


def generate_medical_content(article):
    """Use LLM to generate unique medical content for an article."""
    slug = article['Slug']
    title = article['Titolo']
    keyword = article['Keyword']
    specialty = article['Specialita']
    sardinia = article['Angolo_Sardegna']
    specialists = article['Specialisti']
    spec_meta = SPECIALTY_META.get(specialty, {})
    spec_label = spec_meta.get('label', specialty)
    spec_page = spec_meta.get('page', f'/{specialty}/')

    prompt = f"""Sei un redattore medico-scientifico per Bio-Clinic Sassari (poliambulatorio medico, Via Renzo Mossa 23, 07100 Sassari, tel. 079 956 1332).
Genera il contenuto medico HTML per un articolo sulla seguente patologia/tema:

TITOLO: {title}
KEYWORD SEO: {keyword}
SPECIALITA: {spec_label}
PAGINA SPECIALITA: {spec_page}
ANGOLO SARDEGNA: {sardinia}
SPECIALISTI: {specialists}

DEVI generare un JSON con questa struttura ESATTA (tutto in italiano, HTML entities per caratteri speciali):
{{
  "subtitle": "Sottotitolo accattivante di 1-2 frasi con dato epidemiologico e riferimento a Sassari/Sardegna",
  "reading_time": "NN min di lettura",
  "meta_description": "Meta description SEO max 155 caratteri con keyword, localita Sassari e Bio-Clinic",
  "key_points": [
    {{"label": "Definizione", "text": "definizione breve della condizione"}},
    {{"label": "Prevalenza", "text": "dato epidemiologico Italia/Sardegna"}},
    {{"label": "Sintomi", "text": "3-5 sintomi principali separati da virgola"}},
    {{"label": "Diagnosi a Bio-Clinic", "text": "esami/procedure diagnostiche disponibili"}},
    {{"label": "Cura", "text": "approcci terapeutici principali"}}
  ],
  "sections": [
    {{
      "id": "cos-e",
      "title": "Cos'&egrave; [nome condizione]",
      "content": "<p>3-4 paragrafi HTML con definizione medica, dati epidemiologici, classificazione se applicabile. Includi tabella se appropriato (classe symptoms-table). Minimo 200 parole.</p>"
    }},
    {{
      "id": "sardegna",
      "title": "[Titolo specifico Sardegna]",
      "content": "<div class='sardinia-box'><h3>&#127963;&#65039; Il focus Sardegna</h3><p>Box con dati specifici Sardegna.</p></div><p>2-3 paragrafi su epidemiologia sarda, studi locali, fattori genetici/ambientali. Minimo 150 parole.</p>"
    }},
    {{
      "id": "cause",
      "title": "Cause e fattori di rischio",
      "content": "<p>Testo + liste <ul> con cause primarie e fattori di rischio. Minimo 200 parole. Usa <strong> per evidenziare.</p>"
    }},
    {{
      "id": "sintomi",
      "title": "Sintomi e segnali d'allarme",
      "content": "<p>Testo + tabella (classe symptoms-table) con colonne Sintomo/Descrizione/Quando consultare. Minimo 200 parole.</p>"
    }},
    {{
      "id": "diagnosi",
      "title": "Diagnosi: gli esami necessari",
      "content": "<p>Percorso diagnostico a Bio-Clinic. Menziona <a href='/laboratorio/'>Laboratorio Bio-Clinic</a> e pagina specialita <a href='{spec_page}'>{spec_label} Bio-Clinic</a>. Minimo 200 parole.</p>"
    }},
    {{
      "id": "cura",
      "title": "Cura e trattamento",
      "content": "<p>Opzioni terapeutiche: farmacologiche, chirurgiche, stile di vita. Minimo 200 parole.</p>"
    }},
    {{
      "id": "prevenzione",
      "title": "Prevenzione",
      "content": "<p>Lista ordinata <ol> con 5-7 regole pratiche di prevenzione. Minimo 150 parole.</p>"
    }}
  ],
  "faq": [
    {{"q": "Domanda 1 con keyword?", "a": "Risposta 2-3 frasi con <strong> e link interni se appropriato."}},
    {{"q": "Domanda 2 su Sardegna?", "a": "Risposta con dati specifici."}},
    {{"q": "Domanda 3 su costi/prenotazione Bio-Clinic?", "a": "Risposta con prezzi indicativi, tel <a href='tel:+390799561332'>079 956 1332</a>."}},
    {{"q": "Domanda 4 clinica?", "a": "Risposta clinica dettagliata."}},
    {{"q": "Domanda 5?", "a": "Risposta con riferimento a specialisti Bio-Clinic."}}
  ],
  "bibliography": [
    "Autore et al. <em>Titolo studio.</em> Rivista. Anno;Vol:Pagine.",
    "Autore et al. <em>Secondo studio.</em> Rivista. Anno.",
    "Linea guida societaria. <em>Titolo.</em> Anno.",
    "Studio epidemiologico Sardegna se disponibile.",
    "Fonte istituzionale (ISS, OMS, etc.)."
  ],
  "cta_title": "Titolo CTA per prenotazione (es. Prenota la Tua Visita {spec_label})",
  "cta_description": "1 frase per CTA prenotazione"
}}

REGOLE:
- Scrivi in italiano formale medico ma accessibile al paziente
- Usa HTML entities: &egrave; &agrave; &ugrave; &ograve; ecc.
- Contenuto totale almeno 2500 parole
- Dati epidemiologici realistici e coerenti
- Ogni sezione content deve essere HTML valido con <p>, <ul>, <ol>, <table>, <h3>, <strong>, <a>
- Link interni: /laboratorio/ /contatti/ {spec_page} /equipe/SLUG/
- Menziona SEMPRE Bio-Clinic Sassari e numero 079 956 1332
- Rispondi SOLO con il JSON, nessun testo prima o dopo
- Non usare markdown, solo HTML dentro i campi content"""

    try:
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": "Sei un redattore medico esperto. Rispondi ESCLUSIVAMENTE con JSON valido, senza markdown code blocks, senza testo aggiuntivo."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=8000,
        )
        raw = response.choices[0].message.content.strip()
        # Clean markdown code blocks if present
        if raw.startswith("```"):
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)
        return json.loads(raw)
    except Exception as e:
        print(f"  ERROR generating content for {slug}: {e}")
        return None


def build_specialist_cards(specialists_list, specialty):
    """Build HTML specialist cards."""
    cards = []
    for s in specialists_list:
        initials = ''.join([p[0].upper() for p in s['name'].split()[-2:] if p[0].isalpha()])
        if len(initials) < 2:
            initials = s['name'][:2].upper()
        albo_text = f" &middot; Ordine dei Medici n&deg; {s['albo']}" if s.get('albo') else ""
        cards.append(f'''      <a href="/equipe/{s['slug']}/" class="specialist-card" title="Profilo {s['name']}">
        <div class="specialist-initials">{initials}</div>
        <div class="specialist-card-info">
          <h4>{s['name']}</h4>
          <p>{s['role']}{albo_text}</p>
        </div>
      </a>''')
    return '\n'.join(cards)


def build_jsonld(article, content_data, specialists_list):
    """Build Schema.org JSON-LD."""
    slug = article['Slug']
    title = article['Titolo']
    date = article['Data']
    specialty = article['Specialita']
    icd10 = ICD10_CODES.get(slug, 'Z00')

    # Authors from specialists
    authors = []
    for s in specialists_list:
        authors.append({
            "@type": "Person",
            "name": s['name'],
            "jobTitle": s['role'],
            "url": f"https://bio-clinic.it/equipe/{s['slug']}/"
        })

    # FAQ
    faq_items = []
    for faq in content_data.get('faq', []):
        faq_items.append({
            "@type": "Question",
            "name": faq['q'],
            "acceptedAnswer": {"@type": "Answer", "text": re.sub(r'<[^>]+>', '', faq['a'])}
        })

    graph = [
        {
            "@type": "MedicalClinic",
            "@id": "https://bio-clinic.it/#organization",
            "name": "Bio-Clinic Sassari",
            "url": "https://bio-clinic.it",
            "telephone": "+39 079 956 1332",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Via Renzo Mossa, 23",
                "addressLocality": "Sassari",
                "postalCode": "07100",
                "addressCountry": "IT"
            }
        },
        {
            "@type": "MedicalWebPage",
            "@id": f"https://bio-clinic.it/salute/{slug}/",
            "url": f"https://bio-clinic.it/salute/{slug}/",
            "name": title,
            "headline": title,
            "description": content_data.get('meta_description', title),
            "datePublished": f"{date}T07:00:00+01:00",
            "dateModified": date,
            "lastReviewed": date,
            "inLanguage": "it-IT",
            "publisher": {"@id": "https://bio-clinic.it/#organization"},
            "about": {
                "@type": "MedicalCondition",
                "name": title.split(':')[0],
                "code": {"@type": "MedicalCode", "code": icd10, "codingSystem": "ICD-10"}
            },
            "reviewedBy": {
                "@type": "Person",
                "name": "Dott. Francesco Dessole",
                "jobTitle": "Medico Chirurgo - Specialista in Ginecologia e Ostetricia",
                "url": "https://bio-clinic.it/equipe/francesco-dessole/",
                "identifier": "5244"
            },
            "author": authors,
            "medicalAudience": {"@type": "MedicalAudience", "audienceType": "Patient"}
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"},
                {"@type": "ListItem", "position": 2, "name": "Guida alla Salute", "item": "https://bio-clinic.it/salute/"},
                {"@type": "ListItem", "position": 3, "name": title.split(':')[0], "item": f"https://bio-clinic.it/salute/{slug}/"}
            ]
        }
    ]
    if faq_items:
        graph.append({"@type": "FAQPage", "mainEntity": faq_items})

    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(',', ':'))


def assemble_article(article, content_data):
    """Assemble complete HTML article from template + generated content."""
    slug = article['Slug']
    title = article['Titolo']
    keyword = article['Keyword']
    date = article['Data']
    specialty = article['Specialita']
    sardinia = article['Angolo_Sardegna']
    specialists_str = article['Specialisti']
    
    specialists = resolve_specialists(specialists_str)
    spec_meta = SPECIALTY_META.get(specialty, {'emoji': '', 'page': f'/{specialty}/', 'label': specialty})
    date_it = format_date_it(date)
    meta_desc = content_data.get('meta_description', f"{title}. Guida completa dei specialisti Bio-Clinic Sassari. Diagnosi e cura in Sardegna.")
    reading_time = content_data.get('reading_time', '10 min di lettura')
    
    jsonld = build_jsonld(article, content_data, specialists)
    
    # Build sections HTML
    sections_html = ""
    toc_html = ""
    for i, sec in enumerate(content_data.get('sections', [])):
        sections_html += f'\n    <!-- SECTION {i+1} -->\n    <h2 id="{sec["id"]}">{sec["title"]}</h2>\n    {sec["content"]}\n'
        toc_html += f'        <li><a href="#{sec["id"]}" style="color: #1565c0; text-decoration: none;">{sec["title"]}</a></li>\n'
    
    # Add specialists section to TOC
    toc_html += '        <li><a href="#specialisti" style="color: #1565c0; text-decoration: none;">I nostri specialisti</a></li>\n'
    toc_html += '        <li><a href="#faq" style="color: #1565c0; text-decoration: none;">Domande frequenti</a></li>\n'
    
    # Key points
    kp_html = ""
    for kp in content_data.get('key_points', []):
        kp_html += f'        <li><strong>{kp["label"]}:</strong> {kp["text"]}</li>\n'
    
    # FAQ
    faq_html = ""
    for faq in content_data.get('faq', []):
        faq_html += f'''      <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('open')">{faq["q"]}</div>
        <div class="faq-answer"><p>{faq["a"]}</p></div>
      </div>\n'''
    
    # Bibliography
    bib_html = ""
    for i, ref in enumerate(content_data.get('bibliography', []), 1):
        bib_html += f'        <li>{ref}</li>\n'
    
    # Specialist cards
    cards_html = build_specialist_cards(specialists, specialty)
    
    # CTA
    cta_title = content_data.get('cta_title', f'Prenota la Tua Visita di {spec_meta["label"]}')
    cta_desc = content_data.get('cta_description', f'I nostri specialisti sono a tua disposizione. Prenotazioni rapide.')
    
    # CGE data layer
    physician_slug = specialists[0]['slug'] if specialists else ''
    
    # ── Assemble full HTML ──
    html = f'''{TEMPLATE_HEAD}  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#00704A">
  <meta name="description" content="{meta_desc}">
  <meta name="keywords" content="{keyword}">
  
  <title>{title} | Bio-Clinic</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css?v=20260218-fix1">
  <link rel="stylesheet" href="/css/salute.css?v=20260218-v1">
  <link rel="stylesheet" href="/css/bio-search.css?v=20260216-v7">
  
  <link rel="canonical" href="https://bio-clinic.it/salute/{slug}/">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:type" content="article">
  <meta property="article:published_time" content="{date}T07:00:00+01:00">
  <meta property="article:modified_time" content="{date}T07:00:00+01:00">
  <meta property="article:section" content="{spec_meta['label']}">
  <meta property="og:image" content="https://bio-clinic.it/images/bio-clinic-hero.jpg">
  <meta property="og:url" content="https://bio-clinic.it/salute/{slug}/">
  <meta property="og:site_name" content="Bio-Clinic Sassari">
  <meta property="og:locale" content="it_IT">
  <link rel="stylesheet" href="/css/header-spacing-fix.css?v=1769644194">

<style>
body{{padding-top:100px!important;margin:0!important}}
.header{{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9999!important;background:#fff!important;box-shadow:0 2px 10px rgba(0,0,0,0.1)!important}}
.trust-bar{{margin-top:15px!important;padding-top:1.5rem!important}}
</style>
  <script type="application/ld+json">{jsonld}</script>
<script>
window.bcDataLayer = {{"page_type": "article", "specialty": "{specialty}", "service_name": "{slug.replace('-','_')}", "physician_name": "{physician_slug}", "content_group": "salute_{specialty}", "funnel_stage": "awareness"}};
</script>
<script src="/js/cge-tracking.js?v=CGE_v4_20260217" defer></script>
</head>
<body>
<a href="#main-content" class="skip-link">Vai al contenuto principale</a>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  {TEMPLATE_HEADER}

  <!-- Breadcrumb -->
  <nav aria-label="Breadcrumb" style="padding: 1rem 0 0; background: #f8f9fa;">
    <div class="container">
      <ol style="display: flex; list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: #666; flex-wrap: wrap; gap: 0.25rem;">
        <li><a href="/" style="color: #00704A; text-decoration: none;">Home</a> <span style="margin: 0 0.25rem;">/</span></li>
        <li><a href="/salute/" style="color: #00704A; text-decoration: none;">Guida alla Salute</a> <span style="margin: 0 0.25rem;">/</span></li>
        <li style="color: #333; font-weight: 500;">{title.split(":")[0]}</li>
      </ol>
    </div>
  </nav>

  <!-- Article Content -->
  <article class="salute-article" itemscope itemtype="https://schema.org/MedicalWebPage">
    <div class="article-hero" style="padding-top: 1.5rem;">
      <div class="article-meta">
        <a href="{spec_meta['page']}" class="article-specialty-tag">{spec_meta['emoji']} {spec_meta['label']}</a>
        <span class="article-date"><time datetime="{date}">{date_it}</time></span>
        <span class="reading-time">{reading_time}</span>
      </div>
      <h1>{title}</h1>
      <p class="article-subtitle">{content_data.get('subtitle', '')}</p>
    </div>

    <!-- AI Summary Box -->
    <div class="ai-summary">
      <h2>&#9889; Punti chiave</h2>
      <ul>
{kp_html}      </ul>
    </div>

    <!-- Indice dei contenuti -->
    <nav aria-label="Indice dei contenuti" style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; margin-bottom: 2rem;">
      <strong style="font-size: 0.9em; color: #333;">In questa guida:</strong>
      <ol style="margin: 8px 0 0; padding-left: 1.4em; font-size: 0.88em; color: #555; line-height: 1.8;">
{toc_html}      </ol>
    </nav>

{sections_html}

    <!-- Mid-article CTA -->
    <div class="cta-box">
      <h3>{cta_title}</h3>
      <p>{cta_desc}</p>
      <div class="cta-buttons">
        <a href="tel:+390799561332" class="btn-cta btn-cta-primary" title="Chiama per prenotare">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Prenota: 079 956 1332
        </a>
        <a href="/contatti/" class="btn-cta btn-cta-secondary">Prenota online</a>
      </div>
    </div>

    <!-- Specialist Cards -->
    <h2 id="specialisti">I nostri specialisti</h2>
    <p>L'<a href="{spec_meta['page']}">&eacute;quipe di {spec_meta['label'].lower()} Bio-Clinic</a>:</p>
    <div class="specialist-cards">
{cards_html}
    </div>

    <!-- FAQ -->
    <h2 id="faq">Domande frequenti</h2>
    <div class="salute-faq">
{faq_html}    </div>

    <!-- Bibliografia -->
    <div class="bibliography">
      <h3>Fonti e riferimenti scientifici</h3>
      <ol>
{bib_html}      </ol>
    </div>

    <!-- Reviewer Badge -->
    <div class="reviewer-badge" style="margin-top: 2.5rem;">
      <div class="reviewer-info">
        <div class="reviewer-label">Revisionato da</div>
        <div class="reviewer-name"><a href="/equipe/francesco-dessole/">Dott. Francesco Dessole</a></div>
        <div class="reviewer-credentials">Medico Chirurgo &ndash; Specialista in Ginecologia e Ostetricia &middot; Ordine dei Medici di Sassari n&deg; 5244</div>
      </div>
    </div>

    <!-- Last updated -->
    <div class="last-updated">
      <p>Ultimo aggiornamento: <time datetime="{date}">{date_it}</time> &middot; Revisionato dal <a href="/equipe/francesco-dessole/" style="color: #00704A;">Dott. Francesco Dessole</a></p>
    </div>
  </article>

  <!-- E-E-A-T Badge -->
  <section style="padding: 1.5rem 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
    <div class="container">
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap; text-align: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span style="color: #166534; font-size: 0.9rem;">
          <strong>Informazioni verificate dall'&eacute;quipe medica Bio-Clinic</strong> &bull;
          Aggiornato: {date.split("-")[2]}/{date.split("-")[1]}/{date.split("-")[0]} &bull;
          <a href="/equipe/salvatore-dessole/" style="color: #166534; text-decoration: underline;">Dir. Sanitario: Prof. S. Dessole</a>
        </span>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container">
      <h2 class="cta-title" data-animate>{cta_title}</h2>
      <p class="cta-description" data-animate data-delay="100">{cta_desc}</p>
      <div class="cta-buttons" data-animate data-delay="200">
        <a href="tel:+390799561332" class="btn btn-white btn-lg" title="Chiama Bio-Clinic Sassari">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Chiama: 079 956 1332
        </a>
        <a href="/contatti/" class="btn btn-outline btn-lg" style="border-color: white; color: white;">Scrivici</a>
      </div>
    </div>
  </section>

{TEMPLATE_FOOTER}'''

    return html


def generate_one(article_row, force=False):
    """Generate a single article."""
    slug = article_row['Slug']
    draft_dir = os.path.join(DRAFTS_DIR, slug)
    draft_path = os.path.join(draft_dir, "index.html")
    content_cache = os.path.join(DRAFTS_DIR, f".content-{slug}.json")
    
    if os.path.exists(draft_path) and not force:
        print(f"  SKIP {slug} (already exists, use --force to regenerate)")
        return True
    
    # Check content cache
    content_data = None
    if os.path.exists(content_cache) and not force:
        with open(content_cache, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        print(f"  CACHED content for {slug}")
    else:
        print(f"  Generating content for {slug}...", end=" ", flush=True)
        content_data = generate_medical_content(article_row)
        if content_data:
            with open(content_cache, 'w', encoding='utf-8') as f:
                json.dump(content_data, f, ensure_ascii=False, indent=2)
            print("OK")
        else:
            print("FAILED")
            return False
    
    # Assemble HTML
    html = assemble_article(article_row, content_data)
    os.makedirs(draft_dir, exist_ok=True)
    with open(draft_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    lines = html.count('\n')
    print(f"  SAVED {slug}/index.html ({lines} lines, {len(html)} bytes)")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate Bio-Clinic articles")
    parser.add_argument("--slug", type=str, help="Generate single article by slug")
    parser.add_argument("--force", action="store_true", help="Regenerate even if exists")
    parser.add_argument("--start", type=int, default=2, help="Start from article ID (default: 2)")
    parser.add_argument("--end", type=int, default=64, help="End at article ID (default: 64)")
    parser.add_argument("--batch", type=int, default=5, help="Batch size before pause")
    args = parser.parse_args()
    
    # Read CSV
    articles = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            articles.append(row)
    
    os.makedirs(DRAFTS_DIR, exist_ok=True)
    
    if args.slug:
        row = next((a for a in articles if a['Slug'] == args.slug), None)
        if not row:
            print(f"Article '{args.slug}' not found in CSV")
            sys.exit(1)
        generate_one(row, args.force)
        return
    
    # Batch generate
    to_generate = [a for a in articles if int(a['ID']) >= args.start and int(a['ID']) <= args.end]
    print(f"\n{'='*60}")
    print(f"Bio-Clinic Article Generator")
    print(f"Articles to generate: {len(to_generate)} (ID {args.start}-{args.end})")
    print(f"Output: {DRAFTS_DIR}")
    print(f"{'='*60}\n")
    
    success = 0
    failed = 0
    for i, row in enumerate(to_generate):
        print(f"\n[{i+1}/{len(to_generate)}] Article #{row['ID']}: {row['Slug']}")
        if generate_one(row, args.force):
            success += 1
        else:
            failed += 1
        
        # Rate limit pause
        if (i + 1) % args.batch == 0 and i + 1 < len(to_generate):
            print(f"  ... pausa 2s (batch {args.batch})")
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"DONE: {success} generated, {failed} failed")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
