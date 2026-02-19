#!/usr/bin/env python3
"""
Bio-Clinic — Bulk Article Content Generator
Generates article-content.json with medical content for all 63 articles.
Each article follows the proven template: ~3000 words, 6-7 sections, 5 FAQ, bibliography.
"""
import json, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def make_schema(name, alt_names, icd_code, anatomy, risk_factors, symptoms):
    return {
        "@type": "MedicalCondition",
        "name": name,
        "alternateName": alt_names,
        "code": {"@type": "MedicalCode", "code": icd_code, "codingSystem": "ICD-10"},
        "associatedAnatomy": {"@type": "AnatomicalStructure", "name": anatomy},
        "riskFactor": [{"@type": "MedicalRiskFactor", "name": r} for r in risk_factors],
        "signOrSymptom": [{"@type": "MedicalSignOrSymptom", "name": s} for s in symptoms]
    }

def art(reading_time, subtitle, condition_name, cta_text, schema_about, key_points, sections, faq, bibliography):
    return {
        "reading_time": reading_time,
        "subtitle": subtitle,
        "condition_name": condition_name,
        "cta_text": cta_text,
        "schema_about": schema_about,
        "key_points": key_points,
        "sections": sections,
        "faq": faq,
        "bibliography": bibliography
    }

def kp(label, text):
    return {"label": label, "text": text}

def sec(sid, toc, heading, body):
    return {"id": sid, "toc_title": toc, "heading": heading, "body": body}

def fq(q, a_plain, a_html):
    return {"q": q, "a_plain": a_plain, "a_html": a_html}

# Load existing content (ipotiroidismo + endometriosi already done)
content_path = os.path.join(SCRIPT_DIR, 'article-content.json')
with open(content_path, 'r', encoding='utf-8') as f:
    content = json.load(f)

print(f"Starting with {len(content)} existing articles")

# ═══════════════════════════════════════════════════════════════
# ARTICLE 4: diabete-tipo-2-sardegna
# ═══════════════════════════════════════════════════════════════
content["diabete-tipo-2-sardegna"] = art(
    "13", 
    "La Sardegna detiene il primato mondiale per il diabete di tipo 1 e una prevalenza di tipo 2 superiore alla media italiana. Scopri sintomi, rischi e cura con la diabetologa Bio-Clinic.",
    "il diabete di tipo 2",
    "Controllo diabetologico completo (glicemia, HbA1c, profilo metabolico) disponibile a Bio-Clinic Sassari.",
    make_schema("Diabete mellito di tipo 2", ["Diabete tipo 2", "Diabete non insulino-dipendente"], "E11", "Pancreas",
                ["Obesità", "Sedentarietà", "Familiarità", "Sindrome metabolica"],
                ["Poliuria", "Polidipsia", "Astenia", "Vista offuscata"]),
    [kp("Definizione", "alterazione del metabolismo glucidico con insulino-resistenza e/o deficit secretivo"),
     kp("Prevalenza in Italia", "circa 3,5 milioni di diabetici noti + 1 milione di non diagnosticati"),
     kp("Sardegna", "primato mondiale per DM tipo 1; prevalenza DM tipo 2 superiore alla media per genetica isolana"),
     kp("Sintomi", "spesso silenzioso; sete eccessiva, minzione frequente, stanchezza, vista offuscata"),
     kp("Diagnosi a Bio-Clinic", "glicemia a digiuno, HbA1c, curva da carico orale (OGTT), profilo lipidico e renale")],
    [sec("cos-e", "Cos'è il diabete di tipo 2", "Cos'è il diabete di tipo 2",
         """    <p>Il <strong>diabete mellito di tipo 2</strong> è una malattia metabolica cronica caratterizzata da <strong>iperglicemia</strong> (elevati livelli di glucosio nel sangue) dovuta a una combinazione di <strong>insulino-resistenza</strong> (i tessuti rispondono male all'insulina) e <strong>deficit progressivo della secrezione insulinica</strong> da parte delle cellule beta del pancreas.</p>
    <p>A differenza del diabete di tipo 1 (autoimmune), il tipo 2 rappresenta circa il <strong>90-95% di tutti i casi di diabete</strong> e si sviluppa tipicamente in età adulta, anche se l'incidenza in giovane età è in aumento.</p>
    <p>Si distinguono diverse fasi:</p>
    <ul>
      <li><strong>Prediabete:</strong> glicemia a digiuno 100-125 mg/dL o HbA1c 5,7-6,4%. Fase reversibile con intervento sullo stile di vita</li>
      <li><strong>Diabete conclamato:</strong> glicemia a digiuno ≥ 126 mg/dL o HbA1c ≥ 6,5%. Richiede trattamento farmacologico</li>
    </ul>
    <table class="symptoms-table">
      <thead><tr><th>Parametro</th><th>Normale</th><th>Prediabete</th><th>Diabete</th></tr></thead>
      <tbody>
        <tr><td><strong>Glicemia a digiuno</strong></td><td>&lt; 100 mg/dL</td><td>100-125 mg/dL</td><td>≥ 126 mg/dL</td></tr>
        <tr><td><strong>HbA1c</strong></td><td>&lt; 5,7%</td><td>5,7-6,4%</td><td>≥ 6,5%</td></tr>
        <tr><td><strong>OGTT 2h</strong></td><td>&lt; 140 mg/dL</td><td>140-199 mg/dL</td><td>≥ 200 mg/dL</td></tr>
      </tbody>
    </table>"""),
     sec("sardegna", "Il diabete in Sardegna: genetica unica", "Il diabete in Sardegna: genetica unica",
         """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>La Sardegna detiene il <strong>primato mondiale per l'incidenza di diabete di tipo 1</strong> (dopo la Finlandia), con circa 45 casi per 100.000 abitanti/anno. Per il tipo 2, la prevalenza è <strong>superiore alla media italiana</strong> per la combinazione di genetica isolana, progressivo abbandono della dieta mediterranea tradizionale e aumento dell'obesità.</p>
    </div>
    <p>Il profilo genetico unico della popolazione sarda influenza il rischio diabetico:</p>
    <ul>
      <li><strong>Varianti HLA specifiche:</strong> gli stessi geni che predispongono al DM tipo 1 possono influenzare la suscettibilità al tipo 2</li>
      <li><strong>Studio SardiNIA:</strong> ha identificato varianti genetiche associate al metabolismo glucidico nella popolazione sarda</li>
      <li><strong>Transizione alimentare:</strong> il passaggio dalla dieta tradizionale sarda (ricca di legumi, verdure, pane integrale) a modelli alimentari industriali ha accelerato l'epidemia diabetica</li>
      <li><strong>Zone blu:</strong> paradossalmente, la Sardegna ospita una delle \"Blue Zones\" con centenari, ma l'abbandono dello stile di vita tradizionale sta erodendo questo vantaggio</li>
    </ul>"""),
     sec("sintomi", "Sintomi e segnali d'allarme", "Sintomi e segnali d'allarme",
         """    <p>Il diabete di tipo 2 è spesso definito \"<strong>malattia silente</strong>\" perché i sintomi si sviluppano gradualmente e possono passare inosservati per anni:</p>
    <table class="symptoms-table">
      <thead><tr><th>Sintomo</th><th>Descrizione</th><th>Quando consultare</th></tr></thead>
      <tbody>
        <tr><td><strong>Poliuria</strong></td><td>Minzione frequente, soprattutto notturna (nicturia)</td><td>Se persistente da settimane</td></tr>
        <tr><td><strong>Polidipsia</strong></td><td>Sete intensa e costante, bocca secca</td><td>Se inusuale e persistente</td></tr>
        <tr><td><strong>Astenia</strong></td><td>Stanchezza inspiegabile, debolezza muscolare</td><td>Se cronica e progressiva</td></tr>
        <tr><td><strong>Calo ponderale</strong></td><td>Perdita di peso involontaria nonostante appetito normale o aumentato</td><td>Se > 5% del peso in 3 mesi</td></tr>
        <tr><td><strong>Vista offuscata</strong></td><td>Difficoltà visive transitorie per edema del cristallino</td><td>Sempre da indagare</td></tr>
        <tr><td><strong>Infezioni ricorrenti</strong></td><td>Candidosi, infezioni urinarie, lenta guarigione ferite</td><td>Se frequenti</td></tr>
        <tr><td><strong>Formicolii</strong></td><td>Parestesie a mani e piedi (neuropatia iniziale)</td><td>Se progressivi</td></tr>
      </tbody>
    </table>"""),
     sec("diagnosi", "Diagnosi e screening", "Diagnosi e screening a Bio-Clinic",
         """    <p>La diagnosi precoce è fondamentale per prevenire le complicanze. A <a href="/laboratorio/">Bio-Clinic Sassari</a> è disponibile il percorso diagnostico completo:</p>
    <h3>Esami di primo livello</h3>
    <ul>
      <li><strong>Glicemia a digiuno:</strong> il test di base, da ripetere per conferma se ≥ 126 mg/dL</li>
      <li><strong>Emoglobina glicata (HbA1c):</strong> riflette la glicemia media degli ultimi 2-3 mesi; ≥ 6,5% = diabete</li>
      <li><strong>Curva da carico orale di glucosio (OGTT):</strong> gold standard per la diagnosi di prediabete e diabete gestazionale</li>
    </ul>
    <h3>Profilo metabolico completo</h3>
    <ul>
      <li><strong>Profilo lipidico:</strong> colesterolo totale, LDL, HDL, trigliceridi</li>
      <li><strong>Funzionalità renale:</strong> creatinina, eGFR, microalbuminuria (screening nefropatia)</li>
      <li><strong>Funzionalità epatica:</strong> ALT, AST, GGT (steatosi epatica associata)</li>
      <li><strong>Insulinemia basale e indice HOMA:</strong> per valutare l'insulino-resistenza</li>
    </ul>
    <p>Lo screening è raccomandato a tutti gli adulti sopra i 45 anni, o prima se presenti fattori di rischio (sovrappeso, familiarità, Sardegna per predisposizione genetica).</p>"""),
     sec("cura", "Cura e trattamento", "Cura e trattamento",
         """    <p>Il trattamento del diabete tipo 2 è <strong>multimodale</strong> e personalizzato dalla <a href="/equipe/fabrizia-caucci/">Dott.ssa Fabrizia Caucci</a>, diabetologa ed endocrinologa Bio-Clinic:</p>
    <h3>Modifiche dello stile di vita (primo passo)</h3>
    <ul>
      <li><strong>Alimentazione:</strong> dieta mediterranea, riduzione zuccheri semplici, cereali integrali, abbondante verdura</li>
      <li><strong>Attività fisica:</strong> almeno 150 minuti/settimana di esercizio aerobico moderato (camminata veloce, nuoto, bicicletta)</li>
      <li><strong>Calo ponderale:</strong> perdere il 5-10% del peso corporeo riduce la HbA1c di 0,5-1%</li>
    </ul>
    <h3>Terapia farmacologica</h3>
    <ul>
      <li><strong>Metformina:</strong> farmaco di prima linea, riduce la produzione epatica di glucosio</li>
      <li><strong>Inibitori SGLT2:</strong> gliflozine (empagliflozin, dapagliflozin) con benefici cardiovascolari e renali</li>
      <li><strong>Agonisti GLP-1:</strong> semaglutide, liraglutide — effetto ipoglicemizzante + perdita di peso</li>
      <li><strong>Inibitori DPP-4:</strong> sitagliptin, linagliptin — ben tollerati, neutri sul peso</li>
      <li><strong>Insulina:</strong> nelle fasi avanzate o quando gli ipoglicemizzanti orali non bastano</li>
    </ul>"""),
     sec("prevenzione", "Prevenzione e complicanze", "Prevenzione delle complicanze",
         """    <p>Le complicanze del diabete non trattato sono gravi ma <strong>prevenibili</strong> con un buon controllo glicemico:</p>
    <ol>
      <li><strong>Retinopatia diabetica:</strong> controllo oculistico annuale (disponibile a <a href="/oculistica/">Bio-Clinic</a>)</li>
      <li><strong>Nefropatia diabetica:</strong> microalbuminuria e creatinina ogni 6 mesi</li>
      <li><strong>Neuropatia periferica:</strong> screening annuale del piede diabetico</li>
      <li><strong>Malattia cardiovascolare:</strong> ECG, profilo lipidico, PA — rischio CV 2-4 volte maggiore</li>
      <li><strong>Piede diabetico:</strong> ispezione quotidiana, calzature adeguate, cura podologica</li>
      <li><strong>Monitoraggio HbA1c:</strong> ogni 3-6 mesi; obiettivo < 7% (personalizzabile)</li>
    </ol>""")],
    [fq("Quali sono i primi sintomi del diabete di tipo 2?",
        "I primi sintomi del diabete tipo 2 sono spesso sfumati: sete eccessiva, minzione frequente (soprattutto di notte), stanchezza, vista offuscata, infezioni ricorrenti e lenta guarigione delle ferite. Molti pazienti non hanno sintomi e la diagnosi avviene tramite esami di routine.",
        "<p>I primi sintomi del diabete tipo 2 sono spesso sfumati: <strong>sete eccessiva</strong>, minzione frequente (soprattutto di notte), stanchezza, vista offuscata, infezioni ricorrenti e lenta guarigione delle ferite. Molti pazienti non hanno sintomi e la diagnosi avviene tramite <a href=\"/laboratorio/\">esami di routine</a>.</p>"),
     fq("Perché il diabete è così diffuso in Sardegna?",
        "La Sardegna ha il primato mondiale per il diabete di tipo 1 per ragioni genetiche (varianti HLA). Per il tipo 2, la prevalenza è in aumento per l'abbandono progressivo della dieta tradizionale sarda, l'aumento dell'obesità e la predisposizione genetica insulare unica.",
        "<p>La Sardegna ha il <strong>primato mondiale per il diabete di tipo 1</strong> per ragioni genetiche (varianti HLA). Per il tipo 2, la prevalenza è in aumento per l'abbandono della dieta tradizionale sarda, l'aumento dell'obesità e la <strong>predisposizione genetica insulare</strong>.</p>"),
     fq("Come si diagnostica il diabete a Bio-Clinic Sassari?",
        "A Bio-Clinic Sassari il percorso diagnostico prevede: glicemia a digiuno, emoglobina glicata (HbA1c), profilo lipidico e renale, insulinemia e indice HOMA. Tutti gli esami sono eseguibili presso il Laboratorio Analisi con accesso diretto dalle 07:00 alle 10:00.",
        "<p>A Bio-Clinic il percorso prevede: <strong>glicemia a digiuno</strong>, <strong>emoglobina glicata (HbA1c)</strong>, profilo lipidico e renale, insulinemia e indice HOMA. Tutti gli esami al <a href=\"/laboratorio/\">Laboratorio Analisi</a> con accesso diretto 07:00-10:00.</p>"),
     fq("Il prediabete si può curare?",
        "Sì, il prediabete è una condizione reversibile. Modifiche dello stile di vita (dieta, esercizio, calo ponderale del 5-10%) possono ridurre il rischio di progressione a diabete del 58%. La metformina può essere indicata nei casi ad alto rischio.",
        "<p><strong>Sì, il prediabete è reversibile.</strong> Modifiche dello stile di vita (dieta, esercizio, calo ponderale del 5-10%) riducono il rischio di progressione a diabete del <strong>58%</strong>. La metformina può essere indicata nei casi ad alto rischio.</p>"),
     fq("Quanto costa un controllo diabetologico a Sassari?",
        "A Bio-Clinic Sassari la visita diabetologica costa da €100, gli esami del sangue (glicemia, HbA1c, profilo metabolico) circa €80, l'ECG €100. Sono disponibili convenzioni con fondi sanitari. Per prenotare: 079 956 1332.",
        "<p>La <strong>visita diabetologica</strong> costa da €100, gli <strong>esami del sangue</strong> circa €80, l'ECG €100. Disponibili <a href=\"/convenzioni/\">convenzioni</a>. Prenotazioni: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
    ["American Diabetes Association (ADA). <em>Standards of Care in Diabetes — 2024.</em> Diabetes Care. 2024;47(Suppl 1).",
     "Pilia G, et al. <em>Heritability of cardiovascular and personality traits in 6,148 Sardinians.</em> PLoS Genet. 2006;2(8):e132.",
     "Società Italiana di Diabetologia (SID). <em>Standard italiani per la cura del diabete mellito 2018.</em> <a href=\"https://www.siditalia.it/\" target=\"_blank\" rel=\"noopener\">www.siditalia.it</a>",
     "Cucca F, et al. <em>Genetics of type 1 diabetes in Sardinia.</em> Diabetes. 2001;50(Suppl 1):S7-S13.",
     "Buysschaert M, Bergman M. <em>Definition of prediabetes.</em> Med Clin North Am. 2011;95(2):289-297."]
)

print("✅ diabete-tipo-2-sardegna")

# ═══════════════════════════════════════════════════════════════
# ARTICLE 5: anemia-mediterranea-talassemia
# ═══════════════════════════════════════════════════════════════
content["anemia-mediterranea-talassemia"] = art(
    "12",
    "La Sardegna ha la più alta prevalenza in Europa di portatori sani di talassemia (12-13%). Guida completa su screening, diagnosi e follow-up con l'ematologo Bio-Clinic.",
    "l'anemia mediterranea (talassemia)",
    "Screening talassemico completo (emocromo, elettroforesi emoglobina, ferritina) disponibile al Laboratorio Bio-Clinic.",
    make_schema("Talassemia", ["Anemia mediterranea", "Beta-talassemia"], "D56", "Midollo osseo",
                ["Portatore sano", "Familiarità", "Origine sarda/mediterranea"],
                ["Anemia microcitica", "Pallore", "Astenia", "Ittero lieve"]),
    [kp("Definizione", "gruppo di anemie ereditarie causate da difetto nella sintesi delle catene globiniche dell'emoglobina"),
     kp("Sardegna", "12-13% della popolazione è portatore sano del tratto talassemico, la più alta prevalenza in Europa"),
     kp("Portatore sano", "asintomatico o con lieve microcitosi; fondamentale lo screening per la pianificazione familiare"),
     kp("Forme cliniche", "minor (portatore), intermedia (anemia moderata), major (trasfusione-dipendente)"),
     kp("Diagnosi a Bio-Clinic", "emocromo con indici eritrocitari, elettroforesi Hb, dosaggio HbA2 e HbF, ferritina")],
    [sec("cos-e", "Cos'è la talassemia", "Cos'è l'anemia mediterranea (talassemia)",
         """    <p>La <strong>talassemia</strong> (o anemia mediterranea) è un gruppo di <strong>malattie genetiche ereditarie</strong> caratterizzate da un difetto quantitativo nella produzione di emoglobina. Il termine \"mediterranea\" riflette l'alta prevalenza nelle popolazioni del bacino del Mediterraneo.</p>
    <p>L'emoglobina (Hb) è la proteina contenuta nei globuli rossi che trasporta l'ossigeno. È composta da 4 catene globiniche: 2 alfa (α) e 2 beta (β). Nella <strong>beta-talassemia</strong> (la forma più comune in Sardegna), il difetto riguarda le catene beta:</p>
    <ul>
      <li><strong>Beta-talassemia minor (portatore sano):</strong> un solo gene beta difettoso. Asintomatico o lieve microcitosi. MCV &lt; 80 fL, HbA2 elevata (&gt; 3,5%)</li>
      <li><strong>Beta-talassemia intermedia:</strong> due geni difettosi con fenotipo variabile. Anemia moderata, non sempre trasfusione-dipendente</li>
      <li><strong>Beta-talassemia major (morbo di Cooley):</strong> due geni gravemente difettosi. Anemia severa, trasfusione-dipendente dalla prima infanzia</li>
    </ul>"""),
     sec("sardegna", "Talassemia in Sardegna: prevalenza record", "Talassemia in Sardegna: la prevalenza più alta d'Europa",
         """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>In Sardegna circa il <strong>12-13% della popolazione è portatore sano</strong> di beta-talassemia, la percentuale più alta d'Europa. In alcune zone interne (Barbagia, Ogliastra), la prevalenza raggiunge il 15-20%. Questo rende lo screening pre-concezionale una priorità di salute pubblica.</p>
    </div>
    <p>La selezione naturale ha favorito il gene talassemico in Sardegna perché i portatori sani sono più resistenti alla <strong>malaria</strong>, endemica nell'isola fino agli anni '50:</p>
    <ul>
      <li><strong>Vantaggio selettivo:</strong> i globuli rossi dei portatori sono meno ospitali per il Plasmodium falciparum</li>
      <li><strong>Effetto fondatore:</strong> l'isolamento geografico dell'isola ha concentrato il gene nella popolazione</li>
      <li><strong>Programma di screening regionale:</strong> dagli anni '70, la Sardegna ha il miglior programma di screening neonatale italiano, riducendo drasticamente le nascite di talassemici major</li>
      <li><strong>Consulenza genetica:</strong> fondamentale per le coppie in cui entrambi i partner sono portatori (25% di rischio di figlio affetto)</li>
    </ul>"""),
     sec("sintomi", "Sintomi per forma clinica", "Sintomi in base alla forma clinica",
         """    <table class="symptoms-table">
      <thead><tr><th>Forma</th><th>Sintomi</th><th>Necessità di trattamento</th></tr></thead>
      <tbody>
        <tr><td><strong>Minor (portatore sano)</strong></td><td>Generalmente asintomatico. Possibile lieve anemia, pallore, stanchezza sotto sforzo</td><td>Nessuna terapia specifica. No supplementi di ferro se ferritina normale</td></tr>
        <tr><td><strong>Intermedia</strong></td><td>Anemia moderata (Hb 7-10 g/dL), ittero lieve, splenomegalia, calcoli biliari</td><td>Trasfusioni occasionali, acido folico, monitoraggio sovraccarico marziale</td></tr>
        <tr><td><strong>Major (Cooley)</strong></td><td>Anemia severa dalla prima infanzia, ritardo di crescita, deformità ossee, epatosplenomegalia</td><td>Trasfusioni regolari (ogni 2-4 settimane) + terapia chelante del ferro</td></tr>
      </tbody>
    </table>
    <p style="font-size: 0.85em; color: #888;">Nota: il portatore sano NON deve assumere ferro a meno che sia documentata una carenza marziale concomitante. L'eccesso di ferro è dannoso.</p>"""),
     sec("diagnosi", "Diagnosi e screening", "Diagnosi e screening genetico",
         """    <p>La diagnosi di talassemia si basa su esami di laboratorio disponibili al <a href="/laboratorio/">Laboratorio Bio-Clinic</a>:</p>
    <h3>Esami di primo livello</h3>
    <ul>
      <li><strong>Emocromo completo:</strong> microcitosi (MCV &lt; 80 fL), anemia lieve (Hb 10-12 g/dL nel portatore)</li>
      <li><strong>Striscio di sangue periferico:</strong> cellule target, anisopoichilocitosi</li>
      <li><strong>Elettroforesi dell'emoglobina:</strong> HbA2 &gt; 3,5% conferma il tratto beta-talassemico</li>
      <li><strong>Dosaggio HbF:</strong> elevata nella talassemia major e in alcune forme intermedie</li>
      <li><strong>Sideremia, ferritina, transferrina:</strong> per distinguere dalla carenza di ferro</li>
    </ul>
    <h3>Esami di secondo livello</h3>
    <ul>
      <li><strong>Test genetico molecolare:</strong> identifica la mutazione specifica del gene HBB</li>
      <li><strong>Consulenza genetica:</strong> fondamentale per coppie a rischio (entrambi portatori)</li>
    </ul>
    <p>Lo screening è raccomandato per tutti i sardi in età riproduttiva, idealmente <strong>prima del concepimento</strong>.</p>"""),
     sec("cura", "Gestione e follow-up", "Gestione e follow-up",
         """    <h3>Portatore sano (minor)</h3>
    <ul>
      <li><strong>Nessuna terapia:</strong> non è una malattia ma un tratto genetico</li>
      <li><strong>Evitare ferro non necessario:</strong> la supplementazione di ferro in assenza di carenza documentata è controindicata</li>
      <li><strong>Acido folico:</strong> supplementazione in gravidanza (come per tutte le donne)</li>
      <li><strong>Screening del partner:</strong> fondamentale prima della gravidanza</li>
    </ul>
    <h3>Talassemia intermedia e major</h3>
    <ul>
      <li><strong>Terapia trasfusionale:</strong> mantenere Hb pre-trasfusionale > 9-10 g/dL</li>
      <li><strong>Chelazione del ferro:</strong> deferasirox, deferoxamina, deferiprone per prevenire il sovraccarico</li>
      <li><strong>Splenectomia:</strong> in casi selezionati di ipersplenismo</li>
      <li><strong>Terapia genica:</strong> nuove prospettive con betibeglogene autotemcel (Zynteglo)</li>
      <li><strong>Trapianto di midollo:</strong> unica cura definitiva, da donatore familiare compatibile</li>
    </ul>"""),
     sec("prevenzione", "Prevenzione: lo screening salva vite", "Prevenzione: lo screening salva vite",
         """    <p>La prevenzione della talassemia major si basa sullo <strong>screening di popolazione</strong>:</p>
    <ol>
      <li><strong>Screening ematologico per tutti i sardi:</strong> emocromo + elettroforesi Hb prima dell'età riproduttiva</li>
      <li><strong>Consulenza genetica di coppia:</strong> se entrambi i partner sono portatori, rischio 25% per ogni gravidanza</li>
      <li><strong>Diagnosi prenatale:</strong> villocentesi o amniocentesi nelle coppie a rischio</li>
      <li><strong>Screening neonatale:</strong> il programma sardo è un modello a livello nazionale</li>
      <li><strong>Educazione sanitaria:</strong> informare la popolazione sull'importanza del test</li>
    </ol>""")],
    [fq("Cos'è il portatore sano di talassemia?",
        "Il portatore sano (beta-talassemia minor) ha un solo gene beta-globinico difettoso. È generalmente asintomatico, con lieve microcitosi all'emocromo. Non richiede trattamento. L'importanza dello screening è nella pianificazione familiare: se entrambi i partner sono portatori, c'è il 25% di rischio di avere un figlio con talassemia major.",
        "<p>Il portatore sano ha un solo gene difettoso. È <strong>generalmente asintomatico</strong>. L'importanza dello screening è nella <strong>pianificazione familiare</strong>: se entrambi i partner sono portatori, c'è il 25% di rischio di figlio con talassemia major.</p>"),
     fq("Perché la talassemia è così diffusa in Sardegna?",
        "In Sardegna il 12-13% della popolazione è portatore sano, la prevalenza più alta d'Europa. Il motivo è la selezione naturale: i portatori del tratto talassemico erano più resistenti alla malaria, endemica in Sardegna fino agli anni '50. L'isolamento geografico ha concentrato il gene nella popolazione.",
        "<p>Il <strong>12-13% dei sardi è portatore</strong>. La ragione è la selezione naturale: i portatori erano più <strong>resistenti alla malaria</strong>, endemica fino agli anni '50. L'isolamento geografico ha concentrato il gene.</p>"),
     fq("Come si fa lo screening per la talassemia a Sassari?",
        "Al Laboratorio Bio-Clinic Sassari lo screening prevede: emocromo completo con indici eritrocitari, elettroforesi dell'emoglobina con dosaggio HbA2, sideremia e ferritina. Esami eseguibili con accesso diretto dalle 07:00 alle 10:00. Risultati in 24-48 ore.",
        "<p>Al <a href=\"/laboratorio/\">Laboratorio Bio-Clinic</a> lo screening prevede: <strong>emocromo completo</strong>, <strong>elettroforesi Hb</strong> con dosaggio HbA2, sideremia e ferritina. Accesso diretto 07:00-10:00. Risultati in 24-48 ore.</p>"),
     fq("Il portatore sano deve prendere il ferro?",
        "No, il portatore sano di talassemia NON deve assumere integratori di ferro a meno che non sia documentata una carenza marziale concomitante (ferritina bassa). La microcitosi della talassemia non è dovuta a carenza di ferro e la supplementazione inappropriata può causare sovraccarico marziale.",
        "<p><strong>No</strong>, il portatore sano NON deve assumere ferro a meno che non sia documentata una <strong>carenza marziale concomitante</strong> (ferritina bassa). La supplementazione inappropriata può causare sovraccarico marziale.</p>"),
     fq("Quanto costa lo screening talassemico a Sassari?",
        "Al Laboratorio Bio-Clinic l'emocromo costa circa €15, l'elettroforesi dell'emoglobina circa €25, sideremia e ferritina circa €20. Pacchetto screening completo disponibile. Convenzioni con i principali fondi sanitari. Prenotazioni: 079 956 1332.",
        "<p>L'emocromo costa circa €15, l'<strong>elettroforesi Hb</strong> circa €25, sideremia e ferritina circa €20. Pacchetto screening disponibile. <a href=\"/convenzioni/\">Convenzioni</a> attive. Prenotazioni: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
    ["Weatherall DJ, Clegg JB. <em>The Thalassaemia Syndromes.</em> 4th ed. Blackwell Science; 2001.",
     "Origa R, et al. <em>β-Thalassemia.</em> GeneReviews. 2023. <a href=\"https://www.ncbi.nlm.nih.gov/books/NBK1426/\" target=\"_blank\" rel=\"noopener\">NCBI</a>",
     "Cao A, Galanello R. <em>Beta-thalassemia.</em> Genet Med. 2010;12(2):61-76.",
     "Melis MA, et al. <em>Molecular basis of beta-thalassemia in Sardinia.</em> Haematologica. 1998;83(1):26-30."]
)

print("✅ anemia-mediterranea-talassemia")

# ═══════════════════════════════════════════════════════════════
# REMAINING ARTICLES (6-64) — Abbreviated content generation
# Each article gets full structure: sections, FAQ, bibliography
# ═══════════════════════════════════════════════════════════════

# Helper: generate a standard medical article quickly
def quick_article(slug, data):
    """Generate a full article from abbreviated data dict."""
    sections = []
    for s in data['secs']:
        sections.append(sec(s[0], s[1], s[2], s[3]))
    faqs = []
    for f in data['faqs']:
        faqs.append(fq(f[0], f[1], f[2]))
    return art(
        data.get('rt', '11'),
        data['sub'],
        data['cond'],
        data['cta'],
        data['schema'],
        [kp(k[0], k[1]) for k in data['kps']],
        sections,
        faqs,
        data['bib']
    )

# ── 6: reflusso-gastroesofageo ──
content["reflusso-gastroesofageo"] = quick_article("reflusso-gastroesofageo", {
    "rt": "11",
    "sub": "Il reflusso gastroesofageo colpisce il 20-25% della popolazione italiana. In Sardegna, la dieta tradizionale con vino e formaggi stagionati può aggravare i sintomi.",
    "cond": "il reflusso gastroesofageo",
    "cta": "Visita gastroenterologica con valutazione del reflusso disponibile a Bio-Clinic Sassari.",
    "schema": make_schema("Malattia da reflusso gastroesofageo", ["MRGE", "GERD", "Reflusso acido"], "K21", "Esofago",
                          ["Obesità", "Ernia iatale", "Fumo", "Dieta grassa"],
                          ["Pirosi", "Rigurgito acido", "Disfagia", "Tosse cronica"]),
    "kps": [("Definizione", "risalita patologica del contenuto gastrico in esofago con sintomi e/o lesioni mucosali"),
            ("Prevalenza", "20-25% della popolazione italiana adulta; in aumento per sovrappeso e stress"),
            ("Sardegna", "dieta tradizionale (vino, pecorino, insaccati) e pasti abbondanti possono aggravare i sintomi"),
            ("Sintomi tipici", "bruciore retrosternale (pirosi), rigurgito acido, soprattutto dopo i pasti e in posizione supina"),
            ("Diagnosi a Bio-Clinic", "visita gastroenterologica, EGDS, pH-impedenziometria 24h")],
    "secs": [
        ("cos-e", "Cos'è il reflusso gastroesofageo", "Cos'è la malattia da reflusso gastroesofageo (MRGE)",
         """    <p>La <strong>malattia da reflusso gastroesofageo (MRGE)</strong> è una condizione cronica in cui il contenuto acido dello stomaco risale nell'esofago, provocando sintomi fastidiosi e potenziali danni alla mucosa esofagea. Si verifica quando lo <strong>sfintere esofageo inferiore (LES)</strong> non funziona correttamente.</p>
    <p>Si distinguono:</p>
    <ul>
      <li><strong>MRGE non erosiva (NERD):</strong> sintomi presenti ma nessun danno visibile all'EGDS (60-70% dei casi)</li>
      <li><strong>Esofagite erosiva:</strong> lesioni mucosali visibili, classificate secondo Los Angeles (grado A-D)</li>
      <li><strong>Esofago di Barrett:</strong> metaplasia della mucosa esofagea, condizione precancerosa che richiede sorveglianza</li>
    </ul>
    <table class="symptoms-table">
      <thead><tr><th>Grado</th><th>Descrizione</th><th>Approccio</th></tr></thead>
      <tbody>
        <tr><td><strong>NERD</strong></td><td>Sintomi senza erosioni</td><td>Stile di vita + PPI a domanda</td></tr>
        <tr><td><strong>Los Angeles A-B</strong></td><td>Erosioni lievi-moderate</td><td>PPI ciclo 4-8 settimane</td></tr>
        <tr><td><strong>Los Angeles C-D</strong></td><td>Erosioni severe</td><td>PPI a lungo termine + follow-up</td></tr>
        <tr><td><strong>Barrett</strong></td><td>Metaplasia intestinale</td><td>Sorveglianza endoscopica periodica</td></tr>
      </tbody>
    </table>"""),
        ("sardegna", "Reflusso e dieta sarda", "Reflusso e dieta tradizionale sarda",
         """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>La dieta tradizionale sarda, pur essendo di base mediterranea e salutare, include alcuni elementi che possono <strong>aggravare il reflusso</strong>: vino rosso, formaggi stagionati (pecorino), insaccati, pane carasau condito con olio, olive e pasti serali abbondanti.</p>
    </div>
    <ul>
      <li><strong>Vino rosso:</strong> rilassa il LES e aumenta la secrezione acida</li>
      <li><strong>Formaggi grassi:</strong> il pecorino stagionato rallenta lo svuotamento gastrico</li>
      <li><strong>Pasti abbondanti:</strong> la tradizione sarda del pranzo lungo aumenta la pressione intragastrica</li>
      <li><strong>Olio d'oliva in eccesso:</strong> salutare in quantità moderate, ma in eccesso rallenta la digestione</li>
      <li><strong>Caffè e mirto:</strong> consumo frequente che può peggiorare la pirosi</li>
    </ul>
    <p>Non si tratta di eliminare la dieta sarda, ma di <strong>adattarla</strong>: porzioni moderate, cena leggera almeno 3 ore prima di coricarsi, limitare vino e formaggi stagionati nelle fasi sintomatiche.</p>"""),
        ("sintomi", "Sintomi tipici e atipici", "Sintomi tipici e atipici del reflusso",
         """    <table class="symptoms-table">
      <thead><tr><th>Tipo</th><th>Sintomo</th><th>Descrizione</th></tr></thead>
      <tbody>
        <tr><td><strong>Tipico</strong></td><td>Pirosi</td><td>Bruciore retrosternale che risale verso la gola, peggiora dopo i pasti e in posizione supina</td></tr>
        <tr><td><strong>Tipico</strong></td><td>Rigurgito acido</td><td>Risalita di liquido acido o cibo in bocca, sapore amaro</td></tr>
        <tr><td><strong>Atipico</strong></td><td>Tosse cronica</td><td>Tosse notturna o dopo i pasti, senza causa polmonare evidente</td></tr>
        <tr><td><strong>Atipico</strong></td><td>Laringite da reflusso</td><td>Raucedine mattutina, necessità di schiarirsi la voce, sensazione di nodo in gola</td></tr>
        <tr><td><strong>Atipico</strong></td><td>Dolore toracico</td><td>Può simulare un dolore cardiaco; sempre escludere prima la causa cardiaca</td></tr>
        <tr><td><strong>Atipico</strong></td><td>Erosioni dentali</td><td>Usura dello smalto per esposizione acida cronica</td></tr>
        <tr><td><strong>Allarme</strong></td><td>Disfagia</td><td>Difficoltà a deglutire — richiede EGDS urgente per escludere stenosi o Barrett</td></tr>
      </tbody>
    </table>"""),
        ("diagnosi", "Diagnosi gastroenterologica", "Diagnosi: visita e accertamenti",
         """    <p>La diagnosi è spesso clinica, basata sui <strong>sintomi tipici</strong>. Il <a href="/equipe/angelo-deplano/">Dott. Angelo Deplano</a>, gastroenterologo Bio-Clinic, valuta la necessità di accertamenti:</p>
    <h3>Quando è sufficiente la diagnosi clinica</h3>
    <p>Pirosi e rigurgito tipici in paziente giovane, senza sintomi d'allarme → trial terapeutico con PPI per 4 settimane.</p>
    <h3>Quando servono accertamenti</h3>
    <ul>
      <li><strong>EGDS (esofagogastroduodenoscopia):</strong> indicata se sintomi d'allarme (disfagia, calo ponderale, anemia), sintomi persistenti nonostante terapia, età > 50 anni al primo episodio</li>
      <li><strong>pH-impedenziometria 24h:</strong> gold standard per quantificare il reflusso, indicata quando la diagnosi è dubbia o prima della chirurgia</li>
      <li><strong>Manometria esofagea:</strong> valuta la motilità esofagea, utile prima della chirurgia antireflusso</li>
      <li><strong>Test per H. pylori:</strong> per escludere infezione concomitante</li>
    </ul>"""),
        ("cura", "Cura e trattamento", "Cura: stile di vita, farmaci e chirurgia",
         """    <h3>Modifiche dello stile di vita (primo passo)</h3>
    <ul>
      <li><strong>Elevare la testata del letto</strong> di 15-20 cm (non solo cuscini)</li>
      <li><strong>Cena leggera:</strong> almeno 3 ore prima di coricarsi</li>
      <li><strong>Perdita di peso:</strong> riduce la pressione intra-addominale</li>
      <li><strong>Evitare:</strong> cibi grassi, cioccolato, menta, agrumi, pomodoro, alcol, caffè, bibite gassate</li>
      <li><strong>Non fumare:</strong> il fumo rilassa il LES</li>
      <li><strong>Evitare indumenti stretti</strong> sull'addome</li>
    </ul>
    <h3>Terapia farmacologica</h3>
    <ul>
      <li><strong>PPI (inibitori di pompa protonica):</strong> omeprazolo, pantoprazolo, esomeprazolo — gold standard, cicli di 4-8 settimane</li>
      <li><strong>Anti-H2:</strong> ranitidina, famotidina — per sintomi lievi o come terapia aggiuntiva</li>
      <li><strong>Alginati:</strong> barriera protettiva sulla superficie gastrica, utili dopo i pasti</li>
      <li><strong>Procinetici:</strong> domperidone, migliorano lo svuotamento gastrico</li>
    </ul>
    <h3>Chirurgia antireflusso</h3>
    <p>Riservata ai casi refrattari alla terapia medica: fundoplicatio secondo Nissen per via laparoscopica.</p>"""),
        ("prevenzione", "Prevenzione e stile di vita", "Prevenzione: le 7 regole d'oro",
         """    <ol>
      <li><strong>Mantenere il peso forma:</strong> l'obesità è il principale fattore di rischio modificabile</li>
      <li><strong>Cena frugale e precoce:</strong> almeno 3 ore prima di andare a letto</li>
      <li><strong>Pasti piccoli e frequenti:</strong> evitare abbuffate, masticare lentamente</li>
      <li><strong>Limitare alcol e caffè:</strong> massimo 1-2 unità alcoliche/die, caffè dopo i pasti</li>
      <li><strong>Non fumare:</strong> il fumo è un fattore aggravante diretto</li>
      <li><strong>Attività fisica regolare:</strong> camminare dopo i pasti favorisce la digestione</li>
      <li><strong>Gestire lo stress:</strong> tecniche di rilassamento, l'ansia aumenta la percezione del reflusso</li>
    </ol>""")
    ],
    "faqs": [
        ("Quali sono i sintomi del reflusso gastroesofageo?",
         "I sintomi tipici sono bruciore retrosternale (pirosi) e rigurgito acido, che peggiorano dopo i pasti e in posizione sdraiata. Sintomi atipici includono tosse cronica, raucedine, sensazione di nodo in gola e dolore toracico.",
         "<p>I sintomi tipici sono <strong>bruciore retrosternale</strong> (pirosi) e <strong>rigurgito acido</strong>. Sintomi atipici: tosse cronica, raucedine, sensazione di nodo in gola e dolore toracico.</p>"),
        ("Il reflusso può diventare pericoloso?",
         "Se non trattato, il reflusso cronico può causare esofagite erosiva, stenosi esofagea e, nel 10-15% dei casi, esofago di Barrett (metaplasia precancerosa). Per questo è importante il trattamento e il follow-up gastroenterologico.",
         "<p>Se non trattato, può causare <strong>esofagite</strong>, stenosi e <strong>esofago di Barrett</strong> (precanceroso). Per questo è importante il follow-up <a href=\"/gastroenterologia/\">gastroenterologico</a>.</p>"),
        ("Come si diagnostica il reflusso a Bio-Clinic?",
         "Il Dott. Angelo Deplano valuta i sintomi e, se necessario, prescrive EGDS (gastroscopia), pH-impedenziometria 24h o test per H. pylori. In molti casi la diagnosi è clinica e si procede con un trial terapeutico con PPI.",
         "<p>Il <a href=\"/equipe/angelo-deplano/\">Dott. Deplano</a> valuta i sintomi e prescrive <strong>EGDS</strong>, pH-impedenziometria o test H. pylori. Spesso la diagnosi è clinica con trial terapeutico PPI.</p>"),
        ("La dieta sarda fa male al reflusso?",
         "La dieta sarda di base è salutare (mediterranea), ma alcuni elementi possono aggravare il reflusso: vino rosso, pecorino stagionato, insaccati, pasti abbondanti. Si consiglia di adattare porzioni e orari, non di eliminare la tradizione culinaria sarda.",
         "<p>La dieta sarda è di base <strong>salutare</strong>, ma vino, pecorino, insaccati e pasti abbondanti possono peggiorare il reflusso. Si consiglia di <strong>adattare porzioni e orari</strong>.</p>"),
        ("Quanto costa una visita gastroenterologica a Sassari?",
         "A Bio-Clinic Sassari la visita gastroenterologica costa da €100, l'EGDS diagnostica da €200. Sono disponibili convenzioni con fondi sanitari. Per prenotare: 079 956 1332.",
         "<p>La <strong>visita gastroenterologica</strong> costa da €100, l'EGDS da €200. <a href=\"/convenzioni/\">Convenzioni</a> disponibili. Prenotazioni: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")
    ],
    "bib": [
        "Gyawali CP, et al. <em>ACG Clinical Guideline: Management of Gastroesophageal Reflux Disease.</em> Am J Gastroenterol. 2022;117(1):27-56.",
        "Vakil N, et al. <em>The Montreal definition and classification of gastroesophageal reflux disease.</em> Am J Gastroenterol. 2006;101(8):1900-1920.",
        "AIGO/SIGE. <em>Linee guida italiane per la gestione della MRGE.</em> 2023.",
        "Katz PO, et al. <em>Guidelines for the Diagnosis and Management of GERD.</em> Am J Gastroenterol. 2013;108(3):308-328."
    ]
})
print("✅ reflusso-gastroesofageo")

# Save intermediate
with open(content_path, 'w', encoding='utf-8') as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
print(f"\n📊 Total articles so far: {len(content)}")
print("Saved to article-content.json")
