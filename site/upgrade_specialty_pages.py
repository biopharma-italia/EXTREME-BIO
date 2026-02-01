#!/usr/bin/env python3
"""
Bio-Clinic: Upgrade pagine specialità al livello di ginecologia.html
Aggiunge: H1, FAQPage, Physician schema, MedicalWebPage, contenuti educativi
"""

import os
import re
from datetime import datetime

TODAY = datetime.now().strftime("%Y-%m-%d")

# Configurazione specialità con FAQ e medici
SPECIALTIES = {
    "cardiologia": {
        "title_it": "Cardiologia",
        "title_en": "Cardiology",
        "h1": "Cardiologia a Sassari",
        "subtitle": "5 Cardiologi Specialisti | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Tonino Bullitta", "file": "tonino-bullitta", "role": "Cardiologo"},
            {"name": "Dott.ssa Sara Uras", "file": "sara-uras", "role": "Cardiologa"},
            {"name": "Dott.ssa Giuliana Guagnozzi", "file": "giuliana-guagnozzi", "role": "Cardiologa"},
            {"name": "Dott. Paolo Pischedda", "file": "paolo-pischedda", "role": "Cardiologo"},
            {"name": "Dott. Paolo Franca", "file": "paolo-franca", "role": "Cardiologo"},
        ],
        "faqs": [
            {"q": "Quando fare una visita cardiologica?", "a": "Si consiglia una visita cardiologica a partire dai 40 anni come screening, o prima in caso di familiarità per malattie cardiovascolari, ipertensione, diabete, colesterolo alto, fumo, obesità o sintomi come dolore toracico, affanno, palpitazioni."},
            {"q": "Quanto costa una visita cardiologica a Sassari?", "a": "A Bio-Clinic Sassari la visita cardiologica con ECG costa da €80. Il pacchetto completo con ecocardiogramma è disponibile a €150. Accettiamo le principali convenzioni e fondi sanitari."},
            {"q": "Cos'è l'ecocardiogramma e quando serve?", "a": "L'ecocardiogramma è un'ecografia del cuore che permette di valutare la struttura e la funzione cardiaca. È indicato per valvulopatie, scompenso cardiaco, ipertensione, dopo infarto, o come screening in pazienti a rischio cardiovascolare."},
            {"q": "A cosa serve l'Holter ECG 24 ore?", "a": "L'Holter ECG registra il battito cardiaco per 24-48 ore per identificare aritmie, extrasistoli, fibrillazione atriale o altre alterazioni del ritmo che potrebbero non essere rilevate durante un ECG standard."},
        ]
    },
    "endocrinologia": {
        "title_it": "Endocrinologia",
        "title_en": "Endocrinology",
        "h1": "Endocrinologia a Sassari",
        "subtitle": "Specialisti in Tiroide, Diabete, Metabolismo | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Francesco Tolu", "file": "francesco-tolu", "role": "Endocrinologo"},
            {"name": "Dott.ssa Irene Aini", "file": "irene-aini", "role": "Endocrinologa"},
        ],
        "faqs": [
            {"q": "Quando consultare un endocrinologo?", "a": "Si consiglia una visita endocrinologica in caso di problemi alla tiroide (noduli, ipo/ipertiroidismo), diabete, obesità, disturbi ormonali, osteoporosi, problemi di crescita, irsutismo, alterazioni del ciclo mestruale o menopausa."},
            {"q": "Quanto costa una visita endocrinologica a Sassari?", "a": "A Bio-Clinic la visita endocrinologica costa da €90. Il pacchetto tiroide completo (visita + ecografia + TSH) è disponibile a €120."},
            {"q": "Cos'è l'ecografia tiroidea e quando farla?", "a": "L'ecografia tiroidea è un esame indolore che valuta dimensioni, struttura e presenza di noduli alla tiroide. È indicata per noduli palpabili, alterazioni degli ormoni tiroidei, familiarità per patologie tiroidee."},
            {"q": "Come si diagnostica il diabete?", "a": "Il diabete si diagnostica con glicemia a digiuno ≥126 mg/dl, emoglobina glicata (HbA1c) ≥6.5%, o curva da carico di glucosio (OGTT). Bio-Clinic offre tutti questi esami con referto in giornata."},
        ]
    },
    "neurologia": {
        "title_it": "Neurologia",
        "title_en": "Neurology",
        "h1": "Neurologia a Sassari",
        "subtitle": "Specialisti del Sistema Nervoso | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Guido Marongiu", "file": "guido-marongiu", "role": "Neurologo"},
            {"name": "Dott. Sebastiano Traccis", "file": "sebastiano-traccis", "role": "Neurologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un neurologo?", "a": "Si consiglia una visita neurologica in caso di mal di testa frequenti o intensi, vertigini, disturbi della memoria, tremori, formicolii, debolezza muscolare, disturbi del sonno, epilessia o dopo traumi cranici."},
            {"q": "Quanto costa una visita neurologica a Sassari?", "a": "A Bio-Clinic la visita neurologica costa da €100. L'elettromiografia (EMG) è disponibile a €90. Accettiamo convenzioni con i principali fondi sanitari."},
            {"q": "Cos'è l'elettromiografia (EMG)?", "a": "L'elettromiografia è un esame che valuta la funzionalità dei nervi periferici e dei muscoli. È indicata per tunnel carpale, sciatalgia, polineuropatie, miastenia e altre patologie neuromuscolari."},
            {"q": "Come si diagnostica l'emicrania?", "a": "L'emicrania si diagnostica principalmente attraverso l'anamnesi dettagliata e la visita neurologica. In alcuni casi possono essere utili esami strumentali come TAC o risonanza magnetica per escludere altre patologie."},
        ]
    },
    "ortopedia": {
        "title_it": "Ortopedia",
        "title_en": "Orthopedics",
        "h1": "Ortopedia a Sassari",
        "subtitle": "Specialisti in Ossa, Articolazioni, Traumatologia | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Andrea Donato", "file": "andrea-donato", "role": "Ortopedico"},
            {"name": "Dott. Pietro Lisai", "file": "pietro-lisai", "role": "Ortopedico"},
        ],
        "faqs": [
            {"q": "Quando consultare un ortopedico?", "a": "Si consiglia una visita ortopedica per dolori articolari persistenti, mal di schiena, traumi sportivi, fratture, artrosi, ernia del disco, problemi a spalla/ginocchio/anca, o per valutazioni posturali."},
            {"q": "Quanto costa una visita ortopedica a Sassari?", "a": "A Bio-Clinic la visita ortopedica costa da €80. Le infiltrazioni articolari con acido ialuronico partono da €60. Accettiamo convenzioni con i principali fondi sanitari."},
            {"q": "Cosa sono le infiltrazioni articolari?", "a": "Le infiltrazioni articolari sono iniezioni di farmaci (cortisonici o acido ialuronico) direttamente nell'articolazione per ridurre dolore e infiammazione. Sono efficaci per artrosi, tendiniti, borsiti."},
            {"q": "Quando è necessaria la risonanza magnetica?", "a": "La risonanza magnetica è indicata per lesioni meniscali, legamentose, ernie del disco, tendinopatie. L'ortopedico valuta la necessità in base ai sintomi e all'esame clinico."},
        ]
    },
    "urologia": {
        "title_it": "Urologia",
        "title_en": "Urology",
        "h1": "Urologia a Sassari",
        "subtitle": "Specialisti in Apparato Urinario e Genitale Maschile | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Carlos Manuel Cambara Zuniga", "file": "carlos-manuel-cambara-zuniga", "role": "Urologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un urologo?", "a": "Si consiglia una visita urologica per disturbi urinari (minzione frequente, bruciore, sangue nelle urine), problemi prostatici, calcoli renali, disfunzione erettile, infertilità maschile o per screening del PSA dopo i 50 anni."},
            {"q": "Quanto costa una visita urologica a Sassari?", "a": "A Bio-Clinic la visita urologica costa da €90. L'ecografia prostatica transrettale è disponibile a €80. Il PSA con referto in giornata costa €15."},
            {"q": "Cos'è il PSA e quando controllarlo?", "a": "Il PSA (Antigene Prostatico Specifico) è un marker per la prostata. Si consiglia lo screening a partire dai 50 anni, o dai 45 in caso di familiarità per tumore prostatico. A Bio-Clinic il referto è disponibile in giornata."},
            {"q": "Come si diagnostica l'ipertrofia prostatica?", "a": "L'ipertrofia prostatica si diagnostica con visita urologica, ecografia prostatica, PSA ed eventualmente uroflussometria. Bio-Clinic offre un percorso completo per la diagnosi e il follow-up."},
        ]
    },
    "pneumologia": {
        "title_it": "Pneumologia",
        "title_en": "Pulmonology",
        "h1": "Pneumologia a Sassari",
        "subtitle": "Specialisti dell'Apparato Respiratorio | Bio-Clinic",
        "physicians": [
            {"name": "Prof. Pietro Pirina", "file": "pietro-pirina", "role": "Pneumologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un pneumologo?", "a": "Si consiglia una visita pneumologica per tosse persistente, affanno, respiro sibilante, apnee notturne, asma, bronchite cronica, BPCO, o per smettere di fumare."},
            {"q": "Quanto costa una visita pneumologica a Sassari?", "a": "A Bio-Clinic la visita pneumologica costa da €90. La spirometria è disponibile a €40. Il pacchetto completo (visita + spirometria) costa €120."},
            {"q": "Cos'è la spirometria e quando farla?", "a": "La spirometria è un esame che misura la capacità respiratoria. È indicata per asma, BPCO, fibrosi polmonare, valutazione pre-operatoria, medicina del lavoro e per monitorare patologie respiratorie croniche."},
            {"q": "Come si diagnosticano le apnee notturne?", "a": "Le apnee notturne si diagnosticano con la polisonnografia, un esame che registra sonno, respirazione e ossigenazione durante la notte. È indicata per russamento, sonnolenza diurna, cefalea mattutina."},
        ]
    },
    "gastroenterologia": {
        "title_it": "Gastroenterologia",
        "title_en": "Gastroenterology",
        "h1": "Gastroenterologia a Sassari",
        "subtitle": "Specialisti dell'Apparato Digerente | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Angelo Ferruccio Ferruccio Ferruccio Ferruccio Ferruccio Deplano", "file": "angelo-deplano", "role": "Gastroenterologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un gastroenterologo?", "a": "Si consiglia una visita gastroenterologica per bruciore di stomaco, reflusso, dolori addominali, alterazioni dell'alvo (diarrea/stipsi), sangue nelle feci, gonfiore, difficoltà digestive, celiachia o intolleranze."},
            {"q": "Quanto costa una visita gastroenterologica a Sassari?", "a": "A Bio-Clinic la visita gastroenterologica costa da €90. L'ecografia addominale è disponibile a €60. Il test per Helicobacter pylori costa €30."},
            {"q": "Cos'è il test per Helicobacter pylori?", "a": "L'Helicobacter pylori è un batterio che causa gastrite e ulcera. Il test del respiro (breath test) è il metodo più semplice e non invasivo per diagnosticarlo. A Bio-Clinic il risultato è disponibile in giornata."},
            {"q": "Quando fare la gastroscopia?", "a": "La gastroscopia è indicata per reflusso persistente, difficoltà a deglutire, anemia da carenza di ferro, sospetta celiachia, screening Barrett. Bio-Clinic può indirizzare verso centri convenzionati per l'esame."},
        ]
    },
    "oculistica": {
        "title_it": "Oculistica",
        "title_en": "Ophthalmology",
        "h1": "Oculistica a Sassari",
        "subtitle": "Specialisti della Vista | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Francesco Santoru", "file": "francesco-santoru", "role": "Oculista"},
            {"name": "Dott.ssa Maria Pina Pintus", "file": "maria-pina-pintus", "role": "Oculista"},
            {"name": "Dott. Matteo Zucca", "file": "matteo-zucca", "role": "Oculista"},
        ],
        "faqs": [
            {"q": "Ogni quanto fare una visita oculistica?", "a": "Si consiglia una visita oculistica ogni 1-2 anni dopo i 40 anni per screening glaucoma e cataratta. Prima dei 40 anni ogni 2-3 anni, o prima in caso di familiarità o sintomi come visione offuscata, mal di testa."},
            {"q": "Quanto costa una visita oculistica a Sassari?", "a": "A Bio-Clinic la visita oculistica completa costa da €70. La misurazione della pressione oculare è inclusa. Il campo visivo computerizzato costa €40."},
            {"q": "Cos'è il glaucoma e come si diagnostica?", "a": "Il glaucoma è una malattia che danneggia il nervo ottico, spesso legata a pressione oculare elevata. Si diagnostica con tonometria (misura pressione), esame del fondo oculare e campo visivo computerizzato."},
            {"q": "Quando operare la cataratta?", "a": "La cataratta si opera quando compromette significativamente la vista e la qualità di vita. L'oculista valuta l'opacità del cristallino e i sintomi per consigliare il momento migliore per l'intervento."},
        ]
    },
    "otorinolaringoiatria": {
        "title_it": "Otorinolaringoiatria",
        "title_en": "Otorhinolaryngology",
        "h1": "Otorinolaringoiatria a Sassari",
        "subtitle": "Specialisti di Orecchio, Naso, Gola | Bio-Clinic",
        "physicians": [
            {"name": "Prof. Francesco Bussu", "file": "francesco-bussu", "role": "Otorinolaringoiatra"},
            {"name": "Dott.ssa Maria Laura De Luca", "file": "maria-laura-de-luca", "role": "Otorinolaringoiatra"},
        ],
        "faqs": [
            {"q": "Quando consultare un otorino?", "a": "Si consiglia una visita ORL per mal di gola frequenti, problemi di udito, vertigini, acufeni (fischi nelle orecchie), sinusite, rinite, russamento, apnee notturne, noduli alle corde vocali."},
            {"q": "Quanto costa una visita ORL a Sassari?", "a": "A Bio-Clinic la visita otorinolaringoiatrica costa da €80. L'audiometria è disponibile a €30. L'esame vestibolare per vertigini costa €60."},
            {"q": "Cos'è l'audiometria e quando farla?", "a": "L'audiometria è il test dell'udito che misura la capacità di percepire suoni a diverse frequenze e intensità. È indicata per calo dell'udito, acufeni, vertigini, medicina del lavoro, idoneità alla guida."},
            {"q": "Come si curano le vertigini?", "a": "Le vertigini richiedono prima una diagnosi corretta (vertigine periferica vs centrale). L'otorino esegue esame vestibolare e manovre diagnostiche. Il trattamento può includere farmaci, manovre liberatorie o riabilitazione."},
        ]
    },
    "reumatologia": {
        "title_it": "Reumatologia",
        "title_en": "Rheumatology",
        "h1": "Reumatologia a Sassari",
        "subtitle": "Specialisti di Artriti, Artrosi, Malattie Autoimmuni | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Niccolò Melis", "file": "niccolo-melis", "role": "Reumatologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un reumatologo?", "a": "Si consiglia una visita reumatologica per dolori articolari diffusi, rigidità mattutina, gonfiore articolare, sospetta artrite reumatoide, lupus, fibromialgia, gotta, osteoporosi o per interpretare esami autoimmuni alterati."},
            {"q": "Quanto costa una visita reumatologica a Sassari?", "a": "A Bio-Clinic la visita reumatologica costa da €100. Il pannello autoimmune completo (ANA, ENA, FR, anti-CCP) è disponibile a partire da €50."},
            {"q": "Cos'è l'artrite reumatoide?", "a": "L'artrite reumatoide è una malattia autoimmune che causa infiammazione cronica delle articolazioni. Si diagnostica con visita, esami del sangue (FR, anti-CCP, VES, PCR) e imaging. Una diagnosi precoce è fondamentale."},
            {"q": "Cos'è la fibromialgia?", "a": "La fibromialgia è una sindrome caratterizzata da dolore muscolo-scheletrico diffuso, stanchezza cronica e disturbi del sonno. La diagnosi è clinica. Il reumatologo può impostare una terapia multimodale personalizzata."},
        ]
    },
    "ematologia": {
        "title_it": "Ematologia",
        "title_en": "Hematology",
        "h1": "Ematologia a Sassari",
        "subtitle": "Specialisti del Sangue e Malattie Ematologiche | Bio-Clinic",
        "physicians": [
            {"name": "Dott. Daniele Sabiu", "file": "daniele-sabiu", "role": "Ematologo"},
            {"name": "Dott. Luigi Podda", "file": "luigi-podda", "role": "Ematologo"},
        ],
        "faqs": [
            {"q": "Quando consultare un ematologo?", "a": "Si consiglia una visita ematologica per anemia persistente, alterazioni dell'emocromo, linfonodi ingrossati, stanchezza inspiegabile, lividi frequenti, sanguinamenti anomali, o per interpretare esami del sangue alterati."},
            {"q": "Quanto costa una visita ematologica a Sassari?", "a": "A Bio-Clinic la visita ematologica costa da €100. L'emocromo con formula è disponibile a €5. Il profilo coagulativo completo costa €25."},
            {"q": "Cos'è l'anemia e come si cura?", "a": "L'anemia è una riduzione dell'emoglobina nel sangue. Le cause sono molteplici: carenza di ferro, vitamina B12, folati, malattie croniche. L'ematologo identifica la causa e imposta la terapia appropriata."},
            {"q": "Cosa significa emocromo alterato?", "a": "Un emocromo alterato può indicare anemia, infezioni, infiammazioni, malattie del sangue. L'ematologo interpreta i valori nel contesto clinico e prescrive eventuali approfondimenti diagnostici."},
        ]
    },
}


def generate_faq_schema(spec_data):
    """Genera lo schema FAQPage"""
    faq_items = []
    for faq in spec_data["faqs"]:
        faq_items.append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })
    
    return {
        "@type": "FAQPage",
        "mainEntity": faq_items
    }


def generate_physician_schema(physicians):
    """Genera schema Physician per ogni medico"""
    result = []
    for p in physicians:
        result.append({
            "@type": "Physician",
            "@id": f"https://bio-clinic.it/equipe/{p['file']}.html#physician",
            "name": p["name"],
            "jobTitle": p["role"],
            "worksFor": {"@id": "https://bio-clinic.it/#clinic"}
        })
    return result


def add_h1_to_page(content, h1_text, subtitle):
    """Aggiunge H1 dopo la trust-bar se non presente"""
    if '<h1' in content:
        return content, False
    
    # Trova la fine della trust-bar section
    trust_bar_end = '</section>'
    
    # Cerca la prima </section> dopo trust-bar
    trust_bar_match = re.search(r'(<section class="trust-bar">.*?</section>)', content, re.DOTALL)
    
    if trust_bar_match:
        trust_bar_section = trust_bar_match.group(1)
        h1_section = f'''
  <!-- Hero Title -->
  <section class="section" style="padding-top: 2rem; padding-bottom: 1rem;">
    <div class="container">
      <h1 class="text-4xl md:text-5xl font-bold text-center text-primary" style="color: var(--primary); font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem;">
        {h1_text}
      </h1>
      <p class="text-lg text-gray-600 text-center" style="color: var(--gray-600); text-align: center; font-size: 1.125rem;">
        {subtitle}
      </p>
    </div>
  </section>
'''
        new_content = content.replace(trust_bar_section, trust_bar_section + h1_section)
        return new_content, True
    
    return content, False


def add_faq_section(content, spec_data):
    """Aggiunge sezione FAQ prima del CTA"""
    if 'id="faq"' in content or 'class="faq-section"' in content:
        return content, False
    
    # Genera HTML FAQ
    faq_html = '''
  <!-- FAQ Section -->
  <section class="section" id="faq" style="background: var(--gray-50);">
    <div class="container">
      <div class="section-header" data-animate>
        <span class="section-badge">Domande Frequenti</span>
        <h2 class="section-title">FAQ {title}</h2>
        <p class="section-description">Le risposte alle domande più comuni dei nostri pazienti</p>
      </div>
      
      <div class="faq-list" style="max-width: 800px; margin: 0 auto;">
'''
    
    for faq in spec_data["faqs"]:
        faq_html += f'''
        <div class="faq-item" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h3 style="color: var(--primary); font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">
            {faq["q"]}
          </h3>
          <p style="color: var(--gray-600); line-height: 1.7; margin: 0;">
            {faq["a"]}
          </p>
        </div>
'''
    
    faq_html += '''
      </div>
    </div>
  </section>
'''
    
    faq_html = faq_html.replace('{title}', spec_data["title_it"])
    
    # Inserisci prima della sezione CTA
    cta_match = re.search(r'(<section class="cta">)', content)
    if cta_match:
        new_content = content.replace(cta_match.group(1), faq_html + '\n' + cta_match.group(1))
        return new_content, True
    
    return content, False


def update_schema(content, spec_data, spec_name):
    """Aggiorna lo schema JSON-LD con FAQPage, Physician, MedicalWebPage"""
    
    # Trova il blocco script JSON-LD esistente
    schema_match = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', content, re.DOTALL)
    
    if not schema_match:
        return content, False
    
    try:
        import json
        schema_text = schema_match.group(2).strip()
        schema = json.loads(schema_text)
        
        # Assicurati che sia un @graph
        if "@graph" not in schema:
            schema = {"@context": "https://schema.org", "@graph": [schema]}
        
        graph = schema["@graph"]
        
        # Controlla se FAQPage già esiste
        has_faq = any(item.get("@type") == "FAQPage" for item in graph)
        has_physicians = any(item.get("@type") == "Physician" for item in graph)
        has_webpage = any(item.get("@type") == "MedicalWebPage" for item in graph)
        
        modified = False
        
        # Aggiungi FAQPage
        if not has_faq:
            faq_schema = generate_faq_schema(spec_data)
            graph.append(faq_schema)
            modified = True
        
        # Aggiungi Physicians
        if not has_physicians and spec_data["physicians"]:
            for p_schema in generate_physician_schema(spec_data["physicians"]):
                graph.append(p_schema)
            modified = True
        
        # Aggiungi MedicalWebPage
        if not has_webpage:
            webpage = {
                "@type": "MedicalWebPage",
                "@id": f"https://bio-clinic.it/pages/{spec_name}.html",
                "name": f"Centro di {spec_data['title_it']} Bio-Clinic Sassari",
                "description": f"Pagina informativa del servizio di {spec_data['title_it']} di Bio-Clinic Sassari.",
                "specialty": spec_data["title_en"],
                "lastReviewed": TODAY,
                "dateModified": TODAY,
                "inLanguage": "it-IT"
            }
            graph.append(webpage)
            modified = True
        
        if modified:
            new_schema_text = json.dumps(schema, ensure_ascii=False, indent=2)
            new_content = content.replace(
                schema_match.group(0),
                f'<script type="application/ld+json">\n{new_schema_text}\n</script>'
            )
            return new_content, True
        
    except Exception as e:
        print(f"    ⚠️ Errore parsing schema: {e}")
    
    return content, False


def process_specialty_page(spec_name, spec_data):
    """Processa una singola pagina specialità"""
    filepath = f'pages/{spec_name}.html'
    
    if not os.path.exists(filepath):
        print(f"❌ {filepath} non trovato")
        return
    
    print(f"\n📄 {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = []
    
    # 1. Aggiungi H1
    content, h1_added = add_h1_to_page(content, spec_data["h1"], spec_data["subtitle"])
    if h1_added:
        changes.append("H1 aggiunto")
    
    # 2. Aggiungi sezione FAQ
    content, faq_added = add_faq_section(content, spec_data)
    if faq_added:
        changes.append("Sezione FAQ aggiunta")
    
    # 3. Aggiorna schema
    content, schema_updated = update_schema(content, spec_data, spec_name)
    if schema_updated:
        changes.append("Schema aggiornato (FAQ + Physicians + MedicalWebPage)")
    
    # Salva se modificato
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ {', '.join(changes)}")
    else:
        print(f"   ⏭️  Nessuna modifica necessaria")


def main():
    print("🔧 Bio-Clinic Specialty Pages Upgrade")
    print("=" * 50)
    
    for spec_name, spec_data in SPECIALTIES.items():
        process_specialty_page(spec_name, spec_data)
    
    print("\n" + "=" * 50)
    print("✅ Upgrade completato!")


if __name__ == '__main__':
    main()
