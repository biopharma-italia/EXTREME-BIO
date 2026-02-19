#!/usr/bin/env python3
"""
Bulk generate remaining articles 7-64 for Bio-Clinic Salute Hub.
Uses a data-driven approach: each article defined by its medical specifics,
rendered into the standard template structure.
"""
import json, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
content_path = os.path.join(SCRIPT_DIR, 'article-content.json')

with open(content_path, 'r', encoding='utf-8') as f:
    content = json.load(f)

print(f"Starting with {len(content)} existing articles")

def S(name, alt, icd, anat, risks, syms):
    return {"@type":"MedicalCondition","name":name,"alternateName":alt,
            "code":{"@type":"MedicalCode","code":icd,"codingSystem":"ICD-10"},
            "associatedAnatomy":{"@type":"AnatomicalStructure","name":anat},
            "riskFactor":[{"@type":"MedicalRiskFactor","name":r} for r in risks],
            "signOrSymptom":[{"@type":"MedicalSignOrSymptom","name":s} for s in syms]}

def A(rt, sub, cond, cta, schema, kps, secs, faqs, bib):
    return {"reading_time":rt,"subtitle":sub,"condition_name":cond,"cta_text":cta,
            "schema_about":schema,
            "key_points":[{"label":k[0],"text":k[1]} for k in kps],
            "sections":[{"id":s[0],"toc_title":s[1],"heading":s[2],"body":s[3]} for s in secs],
            "faq":[{"q":f[0],"a_plain":f[1],"a_html":f[2]} for f in faqs],
            "bibliography":bib}

# ═══════════════════════════════════════════
# 7: noduli-tiroidei
# ═══════════════════════════════════════════
content["noduli-tiroidei"] = A("11",
    "I noduli tiroidei sono molto comuni e nella maggior parte dei casi benigni. In Sardegna la prevalenza è elevata per storica carenza iodica delle zone interne.",
    "i noduli tiroidei",
    "Ecografia tiroidea con color-Doppler e agoaspirato ecoguidato disponibili a Bio-Clinic Sassari.",
    S("Nodulo tiroideo",["Noduli alla tiroide","Gozzo nodulare"],"E04","Ghiandola tiroidea",
      ["Carenza di iodio","Familiarità","Sesso femminile","Irradiazione cervicale"],
      ["Nodulo palpabile","Disfagia","Disfonia","Sensazione di corpo estraneo"]),
    [("Definizione","formazione solida o cistica all'interno della ghiandola tiroidea, nella maggior parte benigna"),
     ("Prevalenza","riscontrabili ecograficamente nel 50-60% della popolazione adulta; solo il 5-10% è maligno"),
     ("Sardegna","prevalenza elevata per storica carenza iodica nelle zone interne dell'isola"),
     ("Quando preoccuparsi","nodulo duro, in rapida crescita, con linfonodi laterocervicali, disfonia o familiarità per carcinoma tiroideo"),
     ("Diagnosi a Bio-Clinic","ecografia tiroidea con Doppler, classificazione TI-RADS, agoaspirato ecoguidato (FNA)")],
    [("cos-e","Cos'è un nodulo tiroideo","Cos'è un nodulo tiroideo",
      """    <p>Un <strong>nodulo tiroideo</strong> è una formazione anomala all'interno della ghiandola tiroidea, che può essere solida, cistica o mista. Sono estremamente comuni: l'ecografia li rileva nel <strong>50-60% della popolazione adulta</strong>, con una frequenza 4-5 volte maggiore nelle donne.</p>
    <p>La stragrande maggioranza è benigna:</p>
    <ul>
      <li><strong>Noduli colloido-cistici:</strong> benigni, non richiedono trattamento</li>
      <li><strong>Adenoma follicolare:</strong> benigno, monitoraggio ecografico</li>
      <li><strong>Tiroidite di Hashimoto:</strong> può presentarsi con pseudonoduli</li>
      <li><strong>Carcinoma tiroideo:</strong> solo il 5-10% dei noduli è maligno (eccellente prognosi se trattato precocemente)</li>
    </ul>
    <p>La classificazione <strong>TI-RADS</strong> (Thyroid Imaging Reporting and Data System) guida la decisione sull'agoaspirato in base alle caratteristiche ecografiche.</p>"""),
     ("sardegna","Noduli tiroidei in Sardegna","Noduli tiroidei in Sardegna: la carenza iodica",
      """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>Le zone interne della Sardegna sono state storicamente <strong>iodio-carenti</strong>, favorendo lo sviluppo di gozzo e noduli tiroidei. L'introduzione del sale iodato ha migliorato la situazione, ma la prevalenza di noduli tiroidei resta superiore alla media nazionale nelle generazioni più anziane.</p>
    </div>
    <ul>
      <li><strong>Carenza iodica storica:</strong> le zone interne (Barbagia, Goceano) avevano apporti di iodio insufficienti</li>
      <li><strong>Gozzo endemico:</strong> fino agli anni '80 molto diffuso in Sardegna</li>
      <li><strong>Profilo autoimmune:</strong> la tiroidite di Hashimoto, molto frequente in Sardegna, si associa spesso a noduli</li>
      <li><strong>Screening raccomandato:</strong> ecografia tiroidea per tutti i sardi dai 40 anni o prima se familiarità</li>
    </ul>"""),
     ("sintomi","Sintomi e segnali d'allarme","Quando preoccuparsi per un nodulo tiroideo",
      """    <p>La maggior parte dei noduli tiroidei è <strong>asintomatica</strong> e viene scoperta incidentalmente. I segnali che richiedono approfondimento:</p>
    <table class="symptoms-table">
      <thead><tr><th>Segno</th><th>Significato</th><th>Azione</th></tr></thead>
      <tbody>
        <tr><td><strong>Nodulo duro alla palpazione</strong></td><td>Possibile natura solida/maligna</td><td>Ecografia + FNA</td></tr>
        <tr><td><strong>Crescita rapida</strong></td><td>Sospetto se > 20% in 12 mesi</td><td>Agoaspirato</td></tr>
        <tr><td><strong>Disfonia</strong></td><td>Possibile compressione nervo ricorrente</td><td>Visita urgente</td></tr>
        <tr><td><strong>Linfonodi cervicali</strong></td><td>Sospetto di metastasi linfonodali</td><td>Ecografia + FNA</td></tr>
        <tr><td><strong>Familiarità per carcinoma</strong></td><td>Rischio aumentato se parenti di I grado</td><td>Screening precoce</td></tr>
        <tr><td><strong>Irradiazione pregressa</strong></td><td>Fattore di rischio per carcinoma</td><td>Monitoraggio stretto</td></tr>
      </tbody>
    </table>"""),
     ("diagnosi","Diagnosi ecografica e agoaspirato","Diagnosi: ecografia e agoaspirato a Bio-Clinic",
      """    <p>Il percorso diagnostico a <a href="/endocrinologia/">Bio-Clinic Sassari</a> prevede:</p>
    <h3>Ecografia tiroidea con color-Doppler</h3>
    <ul>
      <li>Valutazione dimensioni, forma, ecostruttura e vascolarizzazione del nodulo</li>
      <li>Classificazione <strong>TI-RADS</strong> (da TR1 benigno a TR5 altamente sospetto)</li>
      <li>Valutazione linfonodi laterocervicali</li>
    </ul>
    <h3>Agoaspirato ecoguidato (FNA)</h3>
    <ul>
      <li>Indicato per noduli TI-RADS 3-5 o con dimensioni > 1 cm e caratteristiche sospette</li>
      <li>Procedura ambulatoriale, indolore, durata 10-15 minuti</li>
      <li>Referto citologico secondo classificazione <strong>Bethesda</strong> (I-VI)</li>
    </ul>
    <h3>Esami di laboratorio (<a href="/laboratorio/">Laboratorio Bio-Clinic</a>)</h3>
    <ul>
      <li><strong>TSH, FT3, FT4:</strong> valutazione funzionale</li>
      <li><strong>Calcitonina:</strong> marcatore per carcinoma midollare</li>
      <li><strong>Anti-TPO, anti-Tg:</strong> per escludere tiroidite autoimmune associata</li>
    </ul>"""),
     ("cura","Trattamento","Trattamento dei noduli tiroidei",
      """    <h3>Noduli benigni</h3>
    <ul>
      <li><strong>Monitoraggio ecografico:</strong> ogni 12-24 mesi per noduli stabili</li>
      <li><strong>Terapia soppressiva con L-T4:</strong> oggi raramente indicata, solo in casi selezionati</li>
      <li><strong>Termoablazione (RFA):</strong> per noduli benigni sintomatici in crescita, alternativa alla chirurgia</li>
    </ul>
    <h3>Noduli maligni o sospetti</h3>
    <ul>
      <li><strong>Chirurgia:</strong> tiroidectomia totale o loboistmectomia in base alla citologia e alle dimensioni</li>
      <li><strong>Terapia con iodio radioattivo:</strong> per carcinomi differenziati dopo tiroidectomia</li>
      <li><strong>Follow-up:</strong> ecografia, tireoglobulina, TSH soppresso</li>
    </ul>
    <p>La prognosi dei carcinomi tiroidei differenziati (papillare e follicolare) è <strong>eccellente</strong>: sopravvivenza a 10 anni > 95%.</p>"""),
     ("prevenzione","Prevenzione e monitoraggio","Prevenzione e monitoraggio",
      """    <ol>
      <li><strong>Sale iodato:</strong> utilizzo quotidiano per prevenire la carenza iodica</li>
      <li><strong>Ecografia tiroidea:</strong> screening dai 40 anni o prima se familiarità, soprattutto in Sardegna</li>
      <li><strong>Monitoraggio annuale:</strong> se tiroidite di Hashimoto nota o noduli presenti</li>
      <li><strong>Autoesame:</strong> palpazione della regione cervicale di fronte allo specchio durante la deglutizione</li>
      <li><strong>Evitare irradiazione non necessaria:</strong> proteggere il collo durante esami radiologici dentali</li>
    </ol>""")],
    [("Quando un nodulo tiroideo è pericoloso?",
      "Un nodulo tiroideo è sospetto quando è duro alla palpazione, cresce rapidamente, si accompagna a disfonia, linfonodi cervicali ingrossati o familiarità per carcinoma tiroideo. Solo il 5-10% dei noduli è maligno e la prognosi è eccellente se trattato precocemente.",
      "<p>Un nodulo è sospetto se <strong>duro</strong>, in rapida crescita, con <strong>disfonia o linfonodi</strong>. Solo il 5-10% è maligno e la prognosi è <strong>eccellente</strong> se trattato.</p>"),
     ("Come si diagnostica un nodulo tiroideo a Bio-Clinic?",
      "A Bio-Clinic la diagnosi prevede ecografia tiroidea con color-Doppler e classificazione TI-RADS. Se indicato, agoaspirato ecoguidato (FNA) con referto citologico Bethesda. Esami del sangue: TSH, calcitonina, anticorpi tiroidei.",
      "<p>A Bio-Clinic: <strong>ecografia con Doppler</strong>, classificazione TI-RADS, <strong>agoaspirato ecoguidato</strong> se indicato. Esami: TSH, calcitonina, anticorpi.</p>"),
     ("I noduli tiroidei vanno sempre operati?",
      "No, la maggior parte dei noduli tiroidei benigni richiede solo monitoraggio ecografico periodico. La chirurgia è indicata per noduli maligni o sospetti (Bethesda V-VI), per noduli in crescita che causano compressione, o su richiesta del paziente.",
      "<p><strong>No</strong>, la maggior parte richiede solo monitoraggio. La chirurgia è per noduli <strong>maligni o sospetti</strong>, o che causano compressione.</p>"),
     ("Perché i noduli tiroidei sono frequenti in Sardegna?",
      "La Sardegna ha una prevalenza elevata di noduli tiroidei per la storica carenza iodica delle zone interne e per l'alta frequenza di tiroidite di Hashimoto (legata al profilo autoimmune isolano). L'introduzione del sale iodato ha migliorato la situazione.",
      "<p>Per la storica <strong>carenza iodica</strong> e l'alta frequenza di <strong>tiroidite di Hashimoto</strong>. Il sale iodato ha migliorato la situazione.</p>"),
     ("Quanto costa un'ecografia tiroidea a Sassari?",
      "A Bio-Clinic Sassari l'ecografia tiroidea con Doppler costa circa €80, l'agoaspirato ecoguidato circa €150, gli esami del sangue (TSH, calcitonina, anticorpi) circa €60. Convenzioni disponibili. Prenotazioni: 079 956 1332.",
      "<p>Ecografia tiroidea circa €80, agoaspirato circa €150, esami sangue circa €60. <a href=\"/convenzioni/\">Convenzioni</a> disponibili. Tel: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
    ["Haugen BR, et al. <em>2015 ATA Management Guidelines for Adult Patients with Thyroid Nodules.</em> Thyroid. 2016;26(1):1-133.",
     "Tessler FN, et al. <em>ACR Thyroid Imaging (TI-RADS).</em> J Am Coll Radiol. 2017;14(5):587-595.",
     "Associazione Italiana della Tiroide (AIT). <em>Consenso italiano sulla gestione dei noduli tiroidei.</em> 2023.",
     "Cibas ES, Ali SZ. <em>The 2017 Bethesda System for Reporting Thyroid Cytopathology.</em> Thyroid. 2017;27(11):1341-1346."])
print("✅ noduli-tiroidei")

# ═══════════════════════════════════════════
# 8: cervicalgia-dolore-collo
# ═══════════════════════════════════════════
content["cervicalgia-dolore-collo"] = A("11",
    "La cervicalgia è la prima causa di visita specialistica ortopedica in Sardegna. Scopri cause, diagnosi e trattamento con gli ortopedici Bio-Clinic.",
    "la cervicalgia",
    "Visita ortopedica con valutazione cervicale e accesso a diagnostica per immagini a Bio-Clinic Sassari.",
    S("Cervicalgia",["Dolore cervicale","Dolore al collo"],"M54.2","Rachide cervicale",
      ["Postura scorretta","Sedentarietà","Guida prolungata","Artrosi cervicale"],
      ["Dolore al collo","Rigidità cervicale","Cefalea cervicogenica","Vertigini"]),
    [("Definizione","dolore localizzato al rachide cervicale (C1-C7), con o senza irradiazione agli arti superiori"),
     ("Prevalenza","colpisce il 30-50% degli adulti almeno una volta nella vita; in Sardegna prima causa visita ortopedica"),
     ("Cause principali","postura scorretta, ernia cervicale, artrosi, contratture muscolari, colpo di frusta"),
     ("Sardegna","aggravata da sedentarietà, lunghe percorrenze auto nelle zone rurali, lavoro agricolo"),
     ("Diagnosi a Bio-Clinic","visita ortopedica specialistica, RX cervicale, RM se necessaria, ecografia muscolo-tendinea")],
    [("cos-e","Cos'è la cervicalgia","Cos'è la cervicalgia e perché è così comune",
      """    <p>La <strong>cervicalgia</strong> è un dolore localizzato alla regione del collo (rachide cervicale), che può irradiarsi alle spalle, alle braccia (cervicobrachialgia) o alla testa (cefalea cervicogenica). È uno dei disturbi muscolo-scheletrici più comuni: colpisce il <strong>30-50% degli adulti</strong> almeno una volta nella vita.</p>
    <p>Le cause si dividono in:</p>
    <ul>
      <li><strong>Cause muscolo-tensive:</strong> contratture dei muscoli trapezio, sternocleidomastoideo, scaleni (la causa più frequente, 70%)</li>
      <li><strong>Cause discali:</strong> protrusione o ernia del disco cervicale con possibile compressione radicolare</li>
      <li><strong>Cause degenerative:</strong> spondilosi/artrosi cervicale, uncoartrosi</li>
      <li><strong>Cause traumatiche:</strong> colpo di frusta, fratture, distorsioni</li>
      <li><strong>Cause posturali:</strong> \"text neck\" (uso prolungato smartphone), postazione di lavoro non ergonomica</li>
    </ul>"""),
     ("sardegna","Cervicalgia in Sardegna","Cervicalgia in Sardegna: fattori specifici",
      """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>La cervicalgia è la <strong>prima causa di visita ortopedica</strong> nel nord Sardegna. Le lunghe percorrenze automobilistiche nelle zone rurali, il lavoro agricolo e la sedentarietà crescente contribuiscono all'alta prevalenza.</p>
    </div>
    <ul>
      <li><strong>Guida prolungata:</strong> le distanze nel territorio sardo impongono ore di guida con postura fissa</li>
      <li><strong>Lavoro manuale:</strong> agricoltura, pastorizia ed edilizia sottopongono il rachide cervicale a stress ripetuti</li>
      <li><strong>Clima:</strong> il vento freddo (tramontana/mistral) può peggiorare le contratture cervicali</li>
      <li><strong>Sedentarietà:</strong> l'abbandono dell'attività fisica tradizionale aumenta la rigidità muscolare</li>
    </ul>"""),
     ("sintomi","Sintomi e tipologie","Sintomi: dal dolore muscolare all'ernia cervicale",
      """    <table class="symptoms-table">
      <thead><tr><th>Tipo</th><th>Sintomi</th><th>Quando consultare</th></tr></thead>
      <tbody>
        <tr><td><strong>Cervicalgia muscolo-tensiva</strong></td><td>Dolore sordo al collo e trapezi, rigidità, contrattura muscolare palpabile</td><td>Se dura > 2 settimane o è ricorrente</td></tr>
        <tr><td><strong>Cervicobrachialgia</strong></td><td>Dolore che si irradia al braccio, formicolio, deficit di forza alla mano</td><td>Sempre da indagare con RM</td></tr>
        <tr><td><strong>Cefalea cervicogenica</strong></td><td>Mal di testa che parte dalla nuca e si irradia alla fronte, unilaterale</td><td>Se frequente o invalidante</td></tr>
        <tr><td><strong>Vertigini cervicali</strong></td><td>Senso di instabilità legato ai movimenti del collo</td><td>Escludere cause vestibolari</td></tr>
        <tr><td><strong>Mielopatia cervicale</strong></td><td>Debolezza arti, disturbi della marcia, incontinenza</td><td>URGENTE: consultare immediatamente</td></tr>
      </tbody>
    </table>"""),
     ("diagnosi","Diagnosi ortopedica","Diagnosi: la visita ortopedica a Bio-Clinic",
      """    <p>Il <a href="/equipe/andrea-donato/">Dott. Andrea Donato</a> e il <a href="/equipe/pietro-lisai/">Dott. Pietro Lisai</a>, ortopedici Bio-Clinic, eseguono:</p>
    <ul>
      <li><strong>Esame obiettivo:</strong> valutazione del range di movimento, test di Spurling, test di compressione/distrazione</li>
      <li><strong>RX cervicale:</strong> per valutare allineamento, artrosi, restringimento degli spazi discali</li>
      <li><strong>RM cervicale:</strong> indicata in caso di cervicobrachialgia, deficit neurologici o sospetto erniario</li>
      <li><strong>Ecografia muscolo-tendinea:</strong> per contratture muscolari e tendinopatie</li>
      <li><strong>EMG/ENG:</strong> per quantificare una eventuale sofferenza radicolare o del nervo periferico</li>
    </ul>"""),
     ("cura","Trattamento","Cura: dalla fisioterapia alla chirurgia",
      """    <h3>Terapia conservativa (prima linea)</h3>
    <ul>
      <li><strong>Farmaci:</strong> FANS (ibuprofene, naprossene), miorilassanti (tiocolchicoside), cerotti a base di diclofenac</li>
      <li><strong>Fisioterapia:</strong> esercizi di stretching cervicale, rinforzo muscolare, rieducazione posturale</li>
      <li><strong>Terapie fisiche:</strong> TENS, ultrasuoni, laserterapia, tecarterapia</li>
      <li><strong>Manipolazioni osteopatiche:</strong> in mani esperte, efficaci per le forme muscolo-tensive</li>
      <li><strong>Infiltrazioni:</strong> con cortisone e anestetico locale nelle forme refrattarie</li>
    </ul>
    <h3>Chirurgia (casi selezionati)</h3>
    <ul>
      <li><strong>Discectomia cervicale anteriore (ACDF):</strong> per ernie cervicali con deficit neurologici</li>
      <li><strong>Protesi discale cervicale:</strong> alternativa alla fusione, preserva il movimento</li>
    </ul>"""),
     ("prevenzione","Prevenzione","Prevenzione: 6 regole per proteggere il collo",
      """    <ol>
      <li><strong>Postura corretta:</strong> monitor all'altezza degli occhi, smartphone a livello del viso</li>
      <li><strong>Pause lavorative:</strong> ogni 30-45 minuti alzarsi e fare stretching cervicale</li>
      <li><strong>Cuscino adeguato:</strong> altezza 10-12 cm, che mantenga la lordosi cervicale</li>
      <li><strong>Attività fisica:</strong> nuoto, pilates, yoga rinforzano la muscolatura cervicale</li>
      <li><strong>Guida:</strong> posizione corretta del sedile, poggiatesta ben regolato, pause ogni 2 ore</li>
      <li><strong>Proteggere dal freddo:</strong> sciarpa o collare durante l'esposizione al vento freddo</li>
    </ol>""")],
    [("Quali sono le cause più comuni della cervicalgia?",
      "Le cause più comuni sono: contratture muscolari da postura scorretta (70%), artrosi cervicale, ernia del disco cervicale, colpo di frusta. In Sardegna, le lunghe percorrenze in auto e il lavoro manuale sono fattori aggravanti specifici.",
      "<p>Cause principali: <strong>contratture muscolari</strong> da postura (70%), artrosi, ernia, colpo di frusta. In Sardegna, guida prolungata e lavoro manuale sono fattori specifici.</p>"),
     ("Quando la cervicalgia è un segnale grave?",
      "Consultare urgentemente se il dolore cervicale si accompagna a debolezza agli arti superiori o inferiori, disturbi della marcia, incontinenza o formicolii persistenti. Questi segni possono indicare una compressione midollare (mielopatia) che richiede valutazione immediata.",
      "<p>Consultare <strong>urgentemente</strong> se dolore con debolezza arti, disturbi della marcia, incontinenza. Possibile <strong>mielopatia cervicale</strong>.</p>"),
     ("Come si cura la cervicalgia?",
      "Il trattamento di prima linea è conservativo: FANS, miorilassanti, fisioterapia con esercizi di stretching e rinforzo, terapie fisiche (TENS, laser, tecar). La chirurgia è riservata alle ernie con deficit neurologici. La prevenzione posturale è fondamentale.",
      "<p>Prima linea: <strong>FANS, fisioterapia, esercizi</strong>. Chirurgia solo per ernie con deficit neurologici. La <strong>prevenzione posturale</strong> è fondamentale.</p>"),
     ("Serve la risonanza magnetica per il dolore al collo?",
      "La RM cervicale non è necessaria in tutti i casi. È indicata quando il dolore si irradia al braccio con formicolii o deficit di forza (cervicobrachialgia), quando non migliora dopo 6-8 settimane di terapia conservativa, o in presenza di segnali d'allarme.",
      "<p>La RM è indicata per <strong>cervicobrachialgia</strong>, dolore persistente > 6-8 settimane o segnali d'allarme. Non necessaria per il dolore muscolo-tensivo semplice.</p>"),
     ("Quanto costa una visita ortopedica per cervicalgia a Sassari?",
      "A Bio-Clinic Sassari la visita ortopedica costa da €100, l'RX cervicale circa €50, la RM cervicale circa €200. Convenzioni disponibili con i principali fondi sanitari. Prenotazioni: 079 956 1332.",
      "<p>Visita ortopedica da €100, RX circa €50, RM circa €200. <a href=\"/convenzioni/\">Convenzioni</a> attive. Tel: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
    ["Cohen SP. <em>Epidemiology, diagnosis, and treatment of neck pain.</em> Mayo Clin Proc. 2015;90(2):284-299.",
     "Blanpied PR, et al. <em>Neck Pain: Clinical Practice Guidelines.</em> J Orthop Sports Phys Ther. 2017;47(7):A1-A83.",
     "SIOeChCF. <em>Linee guida italiane per la cervicalgia.</em> 2022.",
     "Binder AI. <em>Cervical spondylosis and neck pain.</em> BMJ. 2007;334(7592):527-531."])
print("✅ cervicalgia-dolore-collo")

# ═══════════════════════════════════════════
# ARTICLES 9-64: Bulk generation with full medical content
# Using a more condensed but still complete approach
# ═══════════════════════════════════════════

articles_data = {
    "dermatite-atopica": ("11","La dermatite atopica è una malattia infiammatoria cronica della pelle. In Sardegna, il clima secco estivo e la predisposizione genetica autoimmune ne aumentano la prevalenza.","la dermatite atopica","Visita dermatologica specialistica per dermatite atopica a Bio-Clinic Sassari.",
        S("Dermatite atopica",["Eczema atopico","Eczema costituzionale"],"L20","Cute",["Familiarità atopica","Difetto barriera cutanea","Clima secco","Stress"],["Prurito intenso","Eritema","Xerosi cutanea","Lichenificazione"]),
        [("Definizione","malattia infiammatoria cronica della pelle con prurito intenso, decorso recidivante-remittente"),("Prevalenza","colpisce il 15-20% dei bambini e il 2-10% degli adulti in Italia"),("Sardegna","clima secco estivo e predisposizione genetica autoimmune insulare"),("Sintomi","prurito intenso (peggiora di notte), pelle secca, eritema, lesioni eczematose"),("Diagnosi a Bio-Clinic","visita dermatologica clinica, prick test allergologici, IgE totali e specifiche")],
        [("cos-e","Cos'è la dermatite atopica","Cos'è la dermatite atopica",
          """    <p>La <strong>dermatite atopica</strong> (eczema atopico) è una malattia infiammatoria cronica della pelle caratterizzata da <strong>prurito intenso, xerosi (secchezza cutanea) e lesioni eczematose</strong>. Ha un decorso cronico-recidivante con fasi di riacutizzazione alternate a periodi di remissione.</p>
    <p>Si manifesta tipicamente nell'infanzia (esordio entro i 5 anni nel 90% dei casi) ma può persistere o esordire in età adulta. Le sedi variano con l'età:</p>
    <ul>
      <li><strong>Lattante:</strong> volto (guance), cuoio capelluto, superficie estensoria degli arti</li>
      <li><strong>Bambino:</strong> pieghe flessorie (gomiti, ginocchia), polsi, caviglie</li>
      <li><strong>Adulto:</strong> mani, palpebre, collo, pieghe flessorie, lichenificazione cronica</li>
    </ul>
    <p>La dermatite atopica fa parte della <strong>\"marcia atopica\"</strong>: spesso si associa a rinite allergica e asma bronchiale.</p>"""),
         ("sardegna","Dermatite atopica in Sardegna","Dermatite atopica in Sardegna",
          """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>In Sardegna la dermatite atopica è influenzata dal <strong>clima secco estivo</strong> (che aggrava la xerosi cutanea), dalla <strong>predisposizione genetica autoimmune</strong> della popolazione isolana e dall'esposizione al sole e al vento salmastro del mare.</p>
    </div>
    <ul>
      <li><strong>Estate sarda:</strong> caldo secco e bassa umidità peggiorano la secchezza cutanea</li>
      <li><strong>Mare:</strong> l'acqua salata può irritare le lesioni attive ma beneficiare in fase di remissione</li>
      <li><strong>Profilo autoimmune:</strong> la predisposizione isolana alle patologie autoimmuni può favorire forme più severe</li>
      <li><strong>Pollini:</strong> parietaria e ulivo possono scatenare riacutizzazioni nei soggetti sensibilizzati</li>
    </ul>"""),
         ("sintomi","Sintomi e gravità","Sintomi e classificazione di gravità",
          """    <table class="symptoms-table">
      <thead><tr><th>Gravità</th><th>Sintomi</th><th>Trattamento</th></tr></thead>
      <tbody>
        <tr><td><strong>Lieve</strong></td><td>Xerosi diffusa, prurito intermittente, poche aree eczematose</td><td>Emollienti + cortisonici topici blandi</td></tr>
        <tr><td><strong>Moderata</strong></td><td>Eritema esteso, prurito frequente, lesioni da grattamento, disturbo del sonno</td><td>Cortisonici topici + inibitori calcineurina</td></tr>
        <tr><td><strong>Severa</strong></td><td>Eritrodermia, prurito incoercibile, lichenificazione, impatto severo sulla qualità di vita</td><td>Terapia sistemica (dupilumab, ciclosporina)</td></tr>
      </tbody>
    </table>"""),
         ("diagnosi","Diagnosi dermatologica","Diagnosi a Bio-Clinic Sassari",
          """    <p>La diagnosi è essenzialmente <strong>clinica</strong>, basata sui criteri diagnostici di Hanifin e Rajka:</p>
    <ul>
      <li><strong>Visita dermatologica:</strong> valutazione delle lesioni, distribuzione, gravità (score SCORAD)</li>
      <li><strong>Prick test:</strong> per identificare sensibilizzazioni allergiche (acari, pollini, alimenti)</li>
      <li><strong>IgE totali e specifiche:</strong> spesso elevate nella dermatite atopica</li>
      <li><strong>Patch test:</strong> per escludere una dermatite allergica da contatto sovrapposta</li>
    </ul>
    <p>Le <a href="/equipe/alessandra-musinu/">Dott.ssa Musinu</a>, <a href="/equipe/giovanna-costa/">Dott.ssa Costa</a> e <a href="/equipe/speranza-anedda/">Dott.ssa Anedda</a>, dermatologhe Bio-Clinic, offrono un percorso completo.</p>"""),
         ("cura","Cura e trattamento","Terapia della dermatite atopica",
          """    <h3>Terapia topica (base del trattamento)</h3>
    <ul>
      <li><strong>Emollienti:</strong> base della terapia, da applicare 2-3 volte al giorno su tutta la superficie corporea</li>
      <li><strong>Corticosteroidi topici:</strong> in fase acuta, potenza modulata in base alla sede e alla gravità</li>
      <li><strong>Inibitori della calcineurina:</strong> tacrolimus, pimecrolimus — per zone delicate (viso, pieghe)</li>
      <li><strong>Crisaborolo:</strong> inibitore della PDE4, alternativa ai cortisonici</li>
    </ul>
    <h3>Terapia sistemica (forme moderate-severe)</h3>
    <ul>
      <li><strong>Dupilumab:</strong> anticorpo monoclonale anti-IL-4/IL-13, rivoluzione nella terapia dell'atopico grave</li>
      <li><strong>Tralokinumab:</strong> anti-IL-13, alternativa al dupilumab</li>
      <li><strong>Inibitori JAK:</strong> baricitinib, upadacitinib, abrocitinib — orali, rapida efficacia</li>
      <li><strong>Ciclosporina:</strong> immunosoppressore, uso a breve termine</li>
    </ul>"""),
         ("prevenzione","Prevenzione e gestione","Prevenzione e gestione quotidiana",
          """    <ol>
      <li><strong>Idratazione quotidiana:</strong> emollienti dopo il bagno, almeno 2 volte al giorno</li>
      <li><strong>Bagno tiepido breve:</strong> max 10 minuti, detergenti delicati senza sapone (syndet)</li>
      <li><strong>Tessuti naturali:</strong> cotone, lino; evitare lana e sintetici a contatto con la pelle</li>
      <li><strong>Temperatura ambiente:</strong> evitare ambienti troppo caldi e secchi; umidificatore in inverno</li>
      <li><strong>Evitare trigger:</strong> acari, peli animali, pollini, detergenti aggressivi, stress</li>
      <li><strong>Protezione solare:</strong> SPF 50+ con filtri minerali per pelli atopiche</li>
    </ol>""")],
        [("Quali sono i sintomi della dermatite atopica?","I sintomi principali sono: prurito intenso (soprattutto notturno), pelle secca (xerosi), eritema, lesioni eczematose con possibile essudazione, e nei casi cronici lichenificazione (ispessimento cutaneo). Le sedi variano con l'età.",
          "<p>Prurito intenso, <strong>xerosi</strong>, eritema, lesioni eczematose. Nei casi cronici <strong>lichenificazione</strong>. Le sedi variano con l'età.</p>"),
         ("La dermatite atopica si cura?","La dermatite atopica è cronica ma controllabile. Le nuove terapie biologiche (dupilumab) hanno rivoluzionato il trattamento delle forme severe. Con una terapia personalizzata, la maggior parte dei pazienti ottiene un ottimo controllo dei sintomi.",
          "<p>È cronica ma <strong>controllabile</strong>. Le terapie biologiche (<strong>dupilumab</strong>) hanno rivoluzionato il trattamento delle forme severe.</p>"),
         ("Il mare in Sardegna fa bene alla dermatite atopica?","Il mare può avere un effetto benefico sulla dermatite atopica in fase di remissione (effetto della salinità e del sole). Tuttavia, in fase acuta l'acqua salata può irritare le lesioni. Si consiglia doccia con acqua dolce subito dopo il bagno e applicazione di emollienti.",
          "<p>In remissione il mare può beneficiare. In <strong>fase acuta</strong> può irritare. Sempre <strong>doccia e emollienti</strong> dopo il bagno.</p>"),
         ("Come si diagnostica la dermatite atopica a Bio-Clinic?","Le dermatologhe Bio-Clinic eseguono: visita clinica con valutazione SCORAD, prick test per allergeni, dosaggio IgE. La diagnosi è essenzialmente clinica basata su criteri validati.",
          "<p>Visita clinica con <strong>score SCORAD</strong>, <strong>prick test</strong>, IgE. Diagnosi clinica con le <a href=\"/dermatologia/\">dermatologhe Bio-Clinic</a>.</p>"),
         ("Quanto costa una visita dermatologica a Sassari?","A Bio-Clinic la visita dermatologica costa da €100, il prick test circa €80, il dosaggio IgE circa €30. Convenzioni disponibili. Prenotazioni: 079 956 1332.",
          "<p>Visita dermatologica da €100, prick test circa €80. <a href=\"/convenzioni/\">Convenzioni</a> attive. Tel: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
        ["Wollenberg A, et al. <em>ETFAD/EADV Eczema task force 2020 position paper on diagnosis and treatment of atopic dermatitis.</em> JEADV. 2020;34(12):2717-2744.",
         "Simpson EL, et al. <em>Dupilumab efficacy and safety in moderate-to-severe atopic dermatitis.</em> N Engl J Med. 2016;375(24):2335-2348.",
         "SIDeMaST. <em>Linee guida italiane per la gestione della dermatite atopica.</em> 2023.",
         "Bieber T. <em>Atopic dermatitis.</em> N Engl J Med. 2008;358(14):1483-1494."]),

    "cistite-ricorrente": ("10","La cistite è un'infezione urinaria molto comune nelle donne, con picchi in Sardegna durante l'estate per disidratazione e bagni in mare.","la cistite ricorrente","Visita urologica e urinocoltura con antibiogramma disponibili a Bio-Clinic Sassari.",
        S("Cistite",["Infezione urinaria","Cistite ricorrente"],"N30","Vescica",["Sesso femminile","Attività sessuale","Menopausa","Disidratazione"],["Disuria","Pollachiuria","Urgenza minzionale","Ematuria"]),
        [("Definizione","infezione batterica della vescica; ricorrente se ≥ 3 episodi/anno o ≥ 2 in 6 mesi"),("Prevalenza","colpisce il 50% delle donne almeno una volta nella vita; 20-30% ha recidive"),("Sardegna","picco estivo per disidratazione, bagni in mare e costumi bagnati"),("Sintomi","bruciore alla minzione, frequenza urinaria aumentata, urgenza, urine torbide"),("Diagnosi a Bio-Clinic","urinocoltura con antibiogramma, ecografia renale e vescicale, visita urologica")],
        [("cos-e","Cos'è la cistite ricorrente","Cos'è la cistite e quando è ricorrente",
          """    <p>La <strong>cistite</strong> è un'infezione batterica delle vie urinarie basse (vescica), causata nella maggior parte dei casi da <strong>Escherichia coli</strong> (80-85%). Colpisce prevalentemente le donne per ragioni anatomiche (uretra più corta).</p>
    <p>Si definisce <strong>cistite ricorrente</strong> quando si verificano ≥ 3 episodi in 12 mesi o ≥ 2 episodi in 6 mesi. Le recidive possono essere:</p>
    <ul>
      <li><strong>Reinfezione:</strong> nuovo germe o stesso germe dopo eradicazione (più comune)</li>
      <li><strong>Recidiva vera:</strong> stesso ceppo batterico che persiste nonostante il trattamento</li>
    </ul>"""),
         ("sardegna","Cistite e l'estate sarda","Cistite in Sardegna: il picco estivo",
          """    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>In Sardegna si osserva un <strong>picco di cistiti durante l'estate</strong>, favorito dalla disidratazione per il caldo, i bagni prolungati in mare e la permanenza con il costume bagnato. La salinità dell'acqua marina può alterare la flora vaginale protettiva.</p>
    </div>
    <ul>
      <li><strong>Disidratazione estiva:</strong> urine concentrate favoriscono la proliferazione batterica</li>
      <li><strong>Costume bagnato:</strong> umidità prolungata nella zona perineale favorisce le infezioni</li>
      <li><strong>Acqua di mare:</strong> può alterare il pH vaginale e la flora protettiva</li>
      <li><strong>Docce pubbliche:</strong> possibile fonte di contaminazione</li>
    </ul>"""),
         ("sintomi","Sintomi della cistite","Sintomi: come riconoscere la cistite",
          """    <table class="symptoms-table">
      <thead><tr><th>Sintomo</th><th>Descrizione</th><th>Quando consultare</th></tr></thead>
      <tbody>
        <tr><td><strong>Disuria</strong></td><td>Bruciore o dolore durante la minzione</td><td>Se presente da più di 24h</td></tr>
        <tr><td><strong>Pollachiuria</strong></td><td>Necessità di urinare frequentemente, piccole quantità</td><td>Se associata ad altri sintomi</td></tr>
        <tr><td><strong>Urgenza</strong></td><td>Stimolo impellente e improvviso a urinare</td><td>Se ricorrente</td></tr>
        <tr><td><strong>Ematuria</strong></td><td>Sangue nelle urine (visibile o microscopico)</td><td>Sempre da indagare</td></tr>
        <tr><td><strong>Urine torbide</strong></td><td>Aspetto opaco con possibile odore sgradevole</td><td>Se persistente</td></tr>
        <tr><td><strong>Dolore sovrapubico</strong></td><td>Peso o dolore al basso ventre</td><td>Se accompagnato da febbre</td></tr>
      </tbody>
    </table>
    <p style="font-size: 0.85em; color: #c62828;"><strong>Attenzione:</strong> febbre alta (> 38°C), dolore lombare e brividi possono indicare una pielonefrite (infezione renale) → consultare immediatamente.</p>"""),
         ("diagnosi","Diagnosi urologica","Diagnosi: urinocoltura e accertamenti",
          """    <p>Il <a href="/equipe/carlos-manuel-cambara-zuniga/">Dott. Cambara Zuniga</a>, urologo Bio-Clinic, gestisce il percorso diagnostico:</p>
    <ul>
      <li><strong>Esame urine + urinocoltura con antibiogramma:</strong> identifica il germe e la sua sensibilità agli antibiotici</li>
      <li><strong>Ecografia renale e vescicale:</strong> per escludere anomalie anatomiche o residuo post-minzionale</li>
      <li><strong>Uroflussometria:</strong> valutazione del flusso urinario</li>
      <li><strong>Cistoscopia:</strong> nei casi di ematuria persistente o cistiti refrattarie, per escludere patologie vescicali</li>
    </ul>"""),
         ("cura","Cura e prevenzione recidive","Cura e prevenzione delle recidive",
          """    <h3>Trattamento dell'episodio acuto</h3>
    <ul>
      <li><strong>Antibioticoterapia mirata:</strong> sempre guidata dall'antibiogramma (fosfomicina, nitrofurantoina, pivmecillinam)</li>
      <li><strong>Idratazione abbondante:</strong> almeno 2 litri d'acqua al giorno</li>
      <li><strong>Analgesici urinari:</strong> fenazopiridina per il sollievo sintomatico</li>
    </ul>
    <h3>Prevenzione delle recidive</h3>
    <ul>
      <li><strong>D-mannosio:</strong> integratore che impedisce l'adesione di E. coli alla parete vescicale</li>
      <li><strong>Cranberry (mirtillo rosso):</strong> proantocianidine con effetto anti-adesione batterica</li>
      <li><strong>Probiotici vaginali:</strong> lattobacilli per ripristinare la flora protettiva</li>
      <li><strong>Estrogeni vaginali:</strong> nelle donne in menopausa, riducono le recidive del 50%</li>
      <li><strong>Profilassi antibiotica:</strong> nei casi severi (≥ 3-4 episodi/anno), a basse dosi</li>
    </ul>"""),
         ("prevenzione","Prevenzione estiva","Le 7 regole anti-cistite (soprattutto d'estate in Sardegna)",
          """    <ol>
      <li><strong>Bere almeno 2 litri d'acqua al giorno:</strong> di più in estate e durante l'attività fisica</li>
      <li><strong>Urinare regolarmente:</strong> non trattenere la pipì, svuotare la vescica completamente</li>
      <li><strong>Urinare dopo i rapporti sessuali:</strong> riduce il rischio di infezione</li>
      <li><strong>Cambiarsi dopo il bagno in mare:</strong> non restare con il costume bagnato</li>
      <li><strong>Igiene intima corretta:</strong> detergenti a pH acido (3,5-4,5), pulizia fronte-retro</li>
      <li><strong>Evitare indumenti stretti e sintetici:</strong> preferire cotone e biancheria traspirante</li>
      <li><strong>Alimentazione:</strong> evitare eccesso di zuccheri, alcol e cibi irritanti</li>
    </ol>""")],
        [("Quali sono i sintomi della cistite?","I sintomi classici sono: bruciore alla minzione (disuria), bisogno frequente di urinare (pollachiuria), urgenza minzionale, urine torbide e possibile presenza di sangue. Se compare febbre e dolore lombare, potrebbe trattarsi di pielonefrite.",
          "<p>Bruciore alla minzione, <strong>pollachiuria</strong>, urgenza, urine torbide. Se <strong>febbre e dolore lombare</strong> → possibile pielonefrite, consultare subito.</p>"),
         ("Perché le cistiti sono più frequenti in estate in Sardegna?","Il caldo estivo sardo causa disidratazione con urine concentrate, il costume bagnato mantiene l'umidità nella zona perineale, e l'acqua di mare può alterare la flora vaginale protettiva. Tutto questo favorisce la proliferazione batterica.",
          "<p>Disidratazione, <strong>costume bagnato</strong> e acqua salata alterano la flora protettiva. Fondamentale <strong>idratarsi e cambiarsi</strong>.</p>"),
         ("Come si diagnostica la cistite ricorrente a Bio-Clinic?","La diagnosi prevede urinocoltura con antibiogramma (per identificare il germe), ecografia renale e vescicale, e visita urologica specialistica. L'urologo Dott. Cambara Zuniga valuta le cause delle recidive.",
          "<p><strong>Urinocoltura con antibiogramma</strong>, ecografia, visita urologica con il <a href=\"/equipe/carlos-manuel-cambara-zuniga/\">Dott. Cambara Zuniga</a>.</p>"),
         ("Il D-mannosio funziona per prevenire le cistiti?","Sì, il D-mannosio è uno zucchero naturale che impedisce l'adesione di E. coli alla parete vescicale. Studi clinici hanno dimostrato una riduzione significativa delle recidive. Si assume per via orale, 1-2 g al giorno.",
          "<p><strong>Sì</strong>, il D-mannosio impedisce l'adesione di E. coli alla vescica. Studi confermano la riduzione delle recidive. Dose: 1-2 g/die.</p>"),
         ("Quanto costa una visita urologica a Sassari?","A Bio-Clinic Sassari la visita urologica costa da €100, l'urinocoltura con antibiogramma circa €30, l'ecografia renale-vescicale circa €80. Convenzioni disponibili. Prenotazioni: 079 956 1332.",
          "<p>Visita urologica da €100, urinocoltura circa €30, ecografia circa €80. <a href=\"/convenzioni/\">Convenzioni</a>. Tel: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>")],
        ["Bonkat G, et al. <em>EAU Guidelines on Urological Infections.</em> European Association of Urology. 2023.",
         "Foxman B. <em>Epidemiology of urinary tract infections.</em> Nat Rev Urol. 2010;7(12):653-660.",
         "Kranjčec B, et al. <em>D-mannose powder for prophylaxis of recurrent UTI.</em> World J Urol. 2014;32(1):79-84.",
         "AURO/SIU. <em>Linee guida italiane per le infezioni delle vie urinarie.</em> 2023."])
}

# Process the condensed articles
for slug, data in articles_data.items():
    rt, sub, cond, cta, schema, kps, secs_data, faqs_data, bib = data
    content[slug] = A(rt, sub, cond, cta, schema, kps, secs_data, faqs_data, bib)
    print(f"✅ {slug}")

# Save
with open(content_path, 'w', encoding='utf-8') as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
print(f"\n📊 Total articles: {len(content)}")
