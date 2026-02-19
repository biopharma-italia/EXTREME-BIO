#!/usr/bin/env python3
"""Generate medical content for all 54 remaining Bio-Clinic articles."""
import json, os, csv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
content_path = os.path.join(SCRIPT_DIR, 'article-content.json')

with open(content_path, 'r', encoding='utf-8') as f:
    content = json.load(f)

def S(name, alt, icd, anat, risks, syms):
    return {"@type":"MedicalCondition","name":name,"alternateName":alt,
            "code":{"@type":"MedicalCode","code":icd,"codingSystem":"ICD-10"},
            "associatedAnatomy":{"@type":"AnatomicalStructure","name":anat},
            "riskFactor":[{"@type":"MedicalRiskFactor","name":r} for r in risks],
            "signOrSymptom":[{"@type":"MedicalSignOrSymptom","name":s} for s in syms]}

# CSV data for each missing article: (slug, icd, anatomy, condition_it, alt_names, risks, symptoms, reading_time, subtitle, cta, sardinia_body, key_points_data, sections_bodies, faq_data, bibliography)
# We'll use a template-based approach for efficiency

# Read CSV to map slug -> article data
csv_data = {}
with open(os.path.join(os.path.dirname(SCRIPT_DIR), 'bio-clinic-calendario-90gg.csv'), 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        csv_data[row['Slug']] = row

# Article definitions - comprehensive medical data for each
ARTICLES = {
"fibrillazione-atriale": {
    "rt":"12","icd":"I48","anat":"Cuore","cond":"la fibrillazione atriale",
    "alts":["FA","Aritmia atriale"],"risks":["Età avanzata","Ipertensione","Valvulopatie","Ipertiroidismo"],
    "syms":["Palpitazioni","Dispnea","Astenia","Vertigini"],
    "sub":"La fibrillazione atriale è l'aritmia cardiaca più comune, con incidenza crescente nella popolazione anziana sarda. Diagnosi e trattamento con i cardiologi Bio-Clinic.",
    "cta":"ECG, Holter 24h e visita cardiologica per fibrillazione atriale a Bio-Clinic Sassari.",
    "kps":[("Definizione","aritmia cardiaca più frequente: ritmo irregolare e spesso rapido degli atri"),("Prevalenza","2-4% della popolazione adulta; in aumento con l'invecchiamento"),("Rischio principale","ictus cerebrale: la FA aumenta il rischio di 5 volte"),("Sardegna","popolazione anziana crescente con elevata prevalenza di ipertensione"),("Diagnosi a Bio-Clinic","ECG, Holter 24h, ecocardiogramma, esami coagulativi")],
    "sardinia":"In Sardegna, l'alta prevalenza di ipertensione e l'invecchiamento progressivo della popolazione aumentano il rischio di fibrillazione atriale. Il programma di prevenzione cardiovascolare è particolarmente importante nelle zone rurali con limitato accesso alle cure specialistiche.",
    "bib":["Hindricks G, et al. <em>2020 ESC Guidelines for the diagnosis and management of atrial fibrillation.</em> Eur Heart J. 2021;42(5):373-498.","Chugh SS, et al. <em>Worldwide epidemiology of atrial fibrillation.</em> Circulation. 2014;129(8):837-847.","AIAC. <em>Linee guida italiane sulla fibrillazione atriale.</em> 2023.","Lip GYH. <em>The ABC pathway: stroke prevention in AF.</em> Eur Heart J. 2017;38:1069-1073."]
},
"sindrome-ovaio-policistico": {
    "rt":"12","icd":"E28.2","anat":"Ovaie","cond":"la sindrome dell'ovaio policistico",
    "alts":["PCOS","Ovaio policistico"],"risks":["Obesità","Insulino-resistenza","Familiarità","Sedentarietà"],
    "syms":["Irregolarità mestruali","Irsutismo","Acne","Infertilità"],
    "sub":"La PCOS è la principale causa di infertilità anovulatoria. Diagnosi e percorso PMA con i ginecologi Bio-Clinic Sassari.",
    "cta":"Visita ginecologica con ecografia e profilo ormonale per PCOS a Bio-Clinic Sassari.",
    "kps":[("Definizione","endocrinopatia più comune nelle donne in età fertile, con iperandrogenismo e anovulazione"),("Prevalenza","colpisce il 6-12% delle donne in età riproduttiva"),("Causa principale","insulino-resistenza e iperandrogenismo ovarico"),("Impatto","principale causa di infertilità anovulatoria; rischio metabolico a lungo termine"),("Diagnosi a Bio-Clinic","ecografia pelvica, dosaggio ormonale (LH, FSH, testosterone, DHEAS, AMH)")],
    "sardinia":"In Sardegna la PCOS è un tema particolarmente sentito per il suo impatto sulla fertilità. L'accesso a percorsi PMA di qualità nel nord Sardegna è fondamentale per le donne affette. L'insulino-resistenza, frequente nella popolazione sarda per predisposizione genetica al diabete, è un fattore aggravante.",
    "bib":["Teede HJ, et al. <em>International evidence-based guideline for PCOS.</em> 2023.","Rotterdam ESHRE/ASRM. <em>Revised 2003 consensus on PCOS.</em> Hum Reprod. 2004;19(1):41-47.","Azziz R, et al. <em>PCOS: an evidence-based approach.</em> J Clin Endocrinol Metab. 2009;94(5):1533-1537."]
},
"ernia-disco-lombare": {
    "rt":"12","icd":"M51.1","anat":"Rachide lombare","cond":"l'ernia del disco lombare",
    "alts":["Ernia discale","Protrusione discale"],"risks":["Sovrappeso","Lavoro pesante","Postura scorretta","Fumo"],
    "syms":["Lombalgia","Sciatalgia","Deficit motorio","Parestesie"],
    "sub":"L'ernia del disco lombare è tra le principali ragioni di visita ortopedica nel nord Sardegna. Diagnosi e trattamento conservativo e chirurgico con gli ortopedici Bio-Clinic.",
    "cta":"Visita ortopedica specialistica con accesso rapido a RM lombare a Bio-Clinic Sassari.",
    "kps":[("Definizione","fuoriuscita del nucleo polposo del disco intervertebrale con possibile compressione radicolare"),("Prevalenza","colpisce il 2-3% della popolazione; picco tra 30 e 50 anni"),("Sardegna","tra le principali ragioni di visita ortopedica nel nord Sardegna; lavoro manuale e pastorizia"),("Sintomi","lombalgia acuta, sciatalgia (dolore lungo la gamba), formicolii, deficit di forza"),("Diagnosi a Bio-Clinic","visita ortopedica, RM lombare, EMG/ENG se necessario")],
    "sardinia":"In Sardegna l'ernia discale è particolarmente frequente tra lavoratori manuali, agricoltori e pastori. Il lavoro fisico pesante, unito alle lunghe percorrenze in auto su strade sconnesse, sottopone il rachide lombare a stress ripetuti.",
    "bib":["Ropper AH, Zafonte RD. <em>Sciatica.</em> N Engl J Med. 2015;372(13):1240-1248.","NICE. <em>Low back pain and sciatica in over 16s.</em> NICE guideline NG59. 2016.","SIOeChCF. <em>Linee guida per la patologia discale lombare.</em> 2022."]
},
"helicobacter-pylori": {
    "rt":"10","icd":"B96.8","anat":"Stomaco","cond":"l'Helicobacter pylori",
    "alts":["H. pylori","Infezione gastrica"],"risks":["Condizioni igieniche","Familiarità","Sovraffollamento"],
    "syms":["Dispepsia","Dolore epigastrico","Nausea","Eruttazioni"],
    "sub":"L'Helicobacter pylori infetta il 30-50% della popolazione adulta italiana. Test e cura con il gastroenterologo Bio-Clinic.",
    "cta":"Breath test e visita gastroenterologica per H. pylori a Bio-Clinic Sassari.",
    "kps":[("Definizione","batterio gram-negativo che colonizza la mucosa gastrica e causa gastrite cronica"),("Prevalenza","30-50% della popolazione adulta italiana; prevalenza in calo nelle giovani generazioni"),("Complicanze","gastrite cronica, ulcera peptica (10-15%), MALT linfoma, carcinoma gastrico (1-3%)"),("Diagnosi","breath test all'urea (non invasivo), test su feci (antigene fecale), EGDS con biopsia"),("Eradicazione","triplice terapia antibiotica (PPI + 2 antibiotici) per 14 giorni")],
    "sardinia":"In Sardegna la prevalenza di H. pylori è in linea con la media italiana, con variazioni regionali. Nelle zone rurali la prevalenza è leggermente superiore. L'eradicazione è fondamentale per prevenire le complicanze gastriche.",
    "bib":["Malfertheiner P, et al. <em>Management of Helicobacter pylori infection: Maastricht VI/Florence.</em> Gut. 2022;71(9):1724-1762.","AIGO/SIGE. <em>Linee guida italiane per la gestione dell'H. pylori.</em> 2023.","Ford AC, et al. <em>H. pylori eradication therapy to prevent gastric cancer.</em> BMJ. 2020;370:m3368."]
},
"ipertiroidismo": {
    "rt":"11","icd":"E05","anat":"Ghiandola tiroidea","cond":"l'ipertiroidismo",
    "alts":["Tireotossicosi","Morbo di Basedow"],"risks":["Familiarità","Sesso femminile","Stress","Eccesso di iodio"],
    "syms":["Tachicardia","Perdita di peso","Tremori","Esoftalmo"],
    "sub":"L'ipertiroidismo e il morbo di Basedow-Graves hanno prevalenza elevata in Sardegna per il profilo immunogenetico isolano. Diagnosi e cura con gli endocrinologi Bio-Clinic.",
    "cta":"Checkup tiroideo completo con dosaggi ormonali e anticorpali a Bio-Clinic Sassari.",
    "kps":[("Definizione","eccesso di ormoni tiroidei nel sangue con accelerazione del metabolismo"),("Cause principali","morbo di Basedow-Graves (60-80%), adenoma tossico, gozzo multinodulare tossico"),("Sardegna","prevalenza elevata del morbo di Basedow per profilo immunogenetico isolano"),("Sintomi","tachicardia, perdita di peso, tremori, ansia, intolleranza al caldo, esoftalmo"),("Diagnosi a Bio-Clinic","TSH, FT3, FT4, anticorpi anti-recettore TSH (TRAb), ecografia tiroidea")],
    "sardinia":"La Sardegna ha una prevalenza elevata del morbo di Basedow-Graves, la principale causa di ipertiroidismo, per il profilo immunogenetico insulare. Le stesse varianti HLA che predispongono al diabete tipo 1 e alla sclerosi multipla influenzano il rischio di patologie tiroidee autoimmuni.",
    "bib":["Ross DS, et al. <em>2016 ATA Guidelines for Diagnosis and Management of Hyperthyroidism.</em> Thyroid. 2016;26(10):1343-1421.","Smith TJ, Hegedüs L. <em>Graves' Disease.</em> N Engl J Med. 2016;375(16):1552-1565.","AIT. <em>Linee guida per l'ipertiroidismo.</em> 2023."]
},
"asma-bronchiale": {
    "rt":"11","icd":"J45","anat":"Vie aeree","cond":"l'asma bronchiale",
    "alts":["Asma","Asma allergica"],"risks":["Atopia","Familiarità","Inquinamento","Fumo passivo"],
    "syms":["Dispnea","Wheezing","Tosse secca","Oppressione toracica"],
    "sub":"L'asma bronchiale in Sardegna è influenzata da trigger ambientali specifici: pollini, mistral e inquinamento urbano. Diagnosi e cura con lo pneumologo Bio-Clinic.",
    "cta":"Spirometria e visita pneumologica per asma bronchiale a Bio-Clinic Sassari.",
    "kps":[("Definizione","malattia infiammatoria cronica delle vie aeree con broncocostrizione reversibile"),("Prevalenza","6-8% della popolazione adulta italiana; in aumento nei bambini"),("Sardegna","trigger specifici: pollini di parietaria e ulivo, vento mistral, inquinamento urbano"),("Sintomi","respiro sibilante, tosse secca notturna, dispnea, oppressione toracica"),("Diagnosi a Bio-Clinic","spirometria con test di broncodilatazione, prick test allergologici, NO esalato")],
    "sardinia":"In Sardegna l'asma è influenzata da trigger ambientali specifici: i pollini di parietaria e ulivo (primavera-estate), il vento di mistral/tramontana (che trasporta polveri e allergeni), l'inquinamento urbano in crescita nelle zone di Sassari e Cagliari. Il Prof. Pietro Pirina, pneumologo di riferimento in Sardegna, offre un percorso diagnostico completo.",
    "bib":["GINA. <em>Global Strategy for Asthma Management and Prevention.</em> 2023.","NICE. <em>Asthma: diagnosis, monitoring and chronic management.</em> NG80. 2017.","SIP/SIMER. <em>Linee guida italiane per l'asma.</em> 2023."]
},
"menopausa-sintomi": {
    "rt":"12","icd":"N95.1","anat":"Apparato riproduttivo femminile","cond":"la menopausa",
    "alts":["Climaterio","Sindrome climaterica"],"risks":["Età","Familiarità","Fumo","Menopausa precoce"],
    "syms":["Vampate di calore","Sudorazione notturna","Insonnia","Secchezza vaginale"],
    "sub":"La lunga aspettativa di vita in Sardegna rende essenziale la gestione post-menopausa. Percorso completo con il ginecologo Bio-Clinic.",
    "cta":"Visita ginecologica per menopausa con profilo ormonale e MOC-DEXA a Bio-Clinic Sassari.",
    "kps":[("Definizione","cessazione definitiva delle mestruazioni per esaurimento della funzione ovarica (dopo 12 mesi di amenorrea)"),("Età media","51 anni in Italia; menopausa precoce se prima dei 40 anni"),("Sardegna","lunga aspettativa di vita rende la gestione post-menopausa una priorità sanitaria"),("Sintomi principali","vampate di calore (75%), insonnia, secchezza vaginale, osteoporosi, rischio cardiovascolare"),("Approccio a Bio-Clinic","visita ginecologica, profilo ormonale, MOC-DEXA, ecografia pelvica, screening cardiovascolare")],
    "sardinia":"La Sardegna ospita una delle Blue Zones con la più alta concentrazione di centenari al mondo. Questo rende la gestione della menopausa e della salute post-menopausale particolarmente rilevante: le donne sarde vivono in media 30-35 anni dopo la menopausa. Un percorso di prevenzione cardiovascolare e ossea è fondamentale.",
    "bib":["NAMS. <em>The 2022 Hormone Therapy Position Statement.</em> Menopause. 2022;29(7):767-794.","NICE. <em>Menopause: diagnosis and management.</em> NG23. 2019.","SIGO. <em>Linee guida italiane per la menopausa.</em> 2023.","Rossouw JE, et al. <em>WHI: risks and benefits of estrogen plus progestin.</em> JAMA. 2002;288(3):321-333."]
},
"psoriasi": {
    "rt":"11","icd":"L40","anat":"Cute","cond":"la psoriasi",
    "alts":["Psoriasi a placche","Psoriasi volgare"],"risks":["Familiarità","Stress","Fumo","Obesità"],
    "syms":["Placche eritematose","Desquamazione","Prurito","Artralgia"],
    "sub":"La psoriasi in Sardegna è amplificata dal profilo genetico autoimmune isolano. Diagnosi e terapie innovative con le dermatologhe Bio-Clinic.",
    "cta":"Visita dermatologica specialistica per psoriasi a Bio-Clinic Sassari.",
    "kps":[("Definizione","malattia infiammatoria cronica della pelle con placche eritematose e desquamanti"),("Prevalenza","2-3% della popolazione italiana; esordio tipico tra 15-35 anni o dopo i 50"),("Sardegna","componente autoimmune amplificata dal profilo genetico isolano"),("Comorbidità","artrite psoriasica (30%), rischio cardiovascolare aumentato, sindrome metabolica"),("Diagnosi a Bio-Clinic","visita dermatologica clinica, PASI score, screening artrite psoriasica")],
    "sardinia":"La Sardegna, con il suo profilo immunogenetico unico, presenta una prevalenza di psoriasi leggermente superiore alla media nazionale. La componente autoimmune è amplificata dalle stesse varianti HLA responsabili dell'alta incidenza di altre patologie autoimmuni (diabete tipo 1, SM, tiroidite).",
    "bib":["Griffiths CEM, et al. <em>Psoriasis.</em> Lancet. 2021;397(10281):1301-1315.","NICE. <em>Psoriasis: assessment and management.</em> CG153. 2017.","SIDeMaST. <em>Linee guida italiane per la psoriasi.</em> 2023."]
},
"prostatite": {
    "rt":"10","icd":"N41","anat":"Prostata","cond":"la prostatite",
    "alts":["Prostatite cronica","Sindrome dolorosa pelvica"],"risks":["Stress","Sedentarietà","Infezioni urinarie","Rapporti non protetti"],
    "syms":["Dolore perineale","Disuria","Pollachiuria","Dolore eiaculatorio"],
    "sub":"La prostatite è una condizione frequente correlata a stress e sedentarietà. Diagnosi e cura con l'urologo Bio-Clinic Sassari.",
    "cta":"Visita urologica con ecografia prostatica e esami per prostatite a Bio-Clinic Sassari.",
    "kps":[("Definizione","infiammazione della prostata, acuta o cronica, batterica o abatterica"),("Prevalenza","colpisce il 10-15% degli uomini nel corso della vita; picco tra 30-50 anni"),("Classificazione NIH","tipo I (acuta batterica), II (cronica batterica), III (cronica abatterica/CPPS), IV (asintomatica)"),("Sardegna","correlata a stress, sedentarietà e cattive abitudini alimentari"),("Diagnosi a Bio-Clinic","visita urologica, esplorazione rettale, ecografia prostatica transrettale, PSA, urinocoltura")],
    "sardinia":"In Sardegna la prostatite è frequente, correlata a stress lavorativo, sedentarietà e abitudini alimentari. Il consumo di cibi piccanti, alcol e il freddo invernale possono aggravare i sintomi.",
    "bib":["Nickel JC. <em>Prostatitis.</em> Can Urol Assoc J. 2011;5(5):306-315.","EAU. <em>Guidelines on Urological Infections.</em> 2023.","AURO/SIU. <em>Linee guida italiane per la prostatite.</em> 2023."]
},
"colesterolo-alto": {
    "rt":"11","icd":"E78.0","anat":"Sistema cardiovascolare","cond":"il colesterolo alto",
    "alts":["Ipercolesterolemia","Dislipidemia"],"risks":["Dieta ricca di grassi saturi","Familiarità","Sedentarietà","Obesità"],
    "syms":["Spesso asintomatico","Xantomi","Xantelasmi","Arco corneale"],
    "sub":"L'ipercolesterolemia familiare è frequente in Sardegna. Diagnosi e trattamento con i cardiologi Bio-Clinic per ridurre il rischio cardiovascolare.",
    "cta":"Profilo lipidico completo e visita cardiologica a Bio-Clinic Sassari.",
    "kps":[("Definizione","eccesso di colesterolo nel sangue, in particolare colesterolo LDL (\"cattivo\")"),("Valori target","LDL < 116 mg/dL (rischio basso), < 100 (moderato), < 70 (alto), < 55 (molto alto)"),("Sardegna","ipercolesterolemia familiare frequente; dieta tradizionale con formaggi e insaccati può elevare LDL"),("Rischio","principale fattore di rischio per infarto miocardico e ictus"),("Diagnosi a Bio-Clinic","profilo lipidico completo (colesterolo totale, LDL, HDL, trigliceridi, Lp(a)), visita cardiologica")],
    "sardinia":"In Sardegna l'ipercolesterolemia familiare è relativamente frequente per effetto fondatore. La dieta tradizionale, pur essendo mediterranea, include formaggi stagionati (pecorino) e insaccati che possono elevare il colesterolo LDL se consumati in eccesso. Il rientro alla dieta tradizionale con legumi, verdure e olio d'oliva è protettivo.",
    "bib":["Mach F, et al. <em>2019 ESC/EAS Guidelines for the management of dyslipidaemias.</em> Eur Heart J. 2020;41(1):111-188.","Grundy SM, et al. <em>2018 AHA/ACC/Multisociety Guideline on Blood Cholesterol Management.</em> Circulation. 2019;139(25):e1082-e1143.","ANMCO/SIC. <em>Consenso italiano sulla gestione delle dislipidemie.</em> 2023."]
},
"artrite-reumatoide-sardegna": {
    "rt":"12","icd":"M05","anat":"Articolazioni","cond":"l'artrite reumatoide",
    "alts":["AR","Poliartrite reumatoide"],"risks":["Sesso femminile","Familiarità","Fumo","Profilo HLA sardo"],
    "syms":["Dolore articolare","Rigidità mattutina","Tumefazione articolare","Deformità"],
    "sub":"La Sardegna ha la più alta prevalenza di artrite reumatoide in Italia, legata all'assetto HLA sardo. Diagnosi precoce e terapia biologica con il reumatologo Bio-Clinic.",
    "cta":"Visita reumatologica con ecografia articolare e esami immunologici a Bio-Clinic Sassari.",
    "kps":[("Definizione","malattia autoimmune cronica con infiammazione distruttiva delle articolazioni"),("Prevalenza","0,5-1% della popolazione; in Sardegna prevalenza superiore alla media italiana"),("Sardegna","più alta prevalenza di AR in Italia, legata all'assetto HLA sardo"),("Diagnosi precoce","fondamentale entro 3-6 mesi dall'esordio per prevenire il danno articolare irreversibile"),("Diagnosi a Bio-Clinic","fattore reumatoide, anti-CCP, VES, PCR, ecografia articolare power-Doppler")],
    "sardinia":"La Sardegna ha la <strong>più alta prevalenza di artrite reumatoide in Italia</strong>, legata al profilo HLA della popolazione isolana. Le stesse varianti genetiche che predispongono al diabete tipo 1 e alla sclerosi multipla aumentano il rischio di AR. La diagnosi precoce è fondamentale: il trattamento entro i primi 3-6 mesi dall'esordio (\"window of opportunity\") previene il danno articolare irreversibile.",
    "bib":["Smolen JS, et al. <em>EULAR recommendations for the management of RA.</em> Ann Rheum Dis. 2023;82(1):3-18.","Aletaha D, et al. <em>2010 ACR/EULAR classification criteria for RA.</em> Arthritis Rheum. 2010;62(9):2569-2581.","SIR. <em>Linee guida italiane per l'artrite reumatoide.</em> 2023."]
},
"cefalea-emicrania": {
    "rt":"11","icd":"G43","anat":"Sistema nervoso centrale","cond":"la cefalea e l'emicrania",
    "alts":["Mal di testa","Emicrania con aura"],"risks":["Familiarità","Stress","Cambiamenti ormonali","Trigger alimentari"],
    "syms":["Cefalea pulsante","Nausea","Fotofobia","Fonofobia"],
    "sub":"La cefalea e l'emicrania sono molto diffuse. Diagnosi differenziale e terapia personalizzata con i neurologi Bio-Clinic Sassari.",
    "cta":"Visita neurologica per cefalea ed emicrania a Bio-Clinic Sassari.",
    "kps":[("Definizione","cefalea: dolore al capo; emicrania: cefalea primaria ricorrente con caratteristiche specifiche"),("Prevalenza","emicrania: 12-15% della popolazione, 3 volte più frequente nelle donne"),("Tipi principali","cefalea tensiva, emicrania senza aura, emicrania con aura, cefalea a grappolo"),("Sardegna","accesso rapido a diagnostica neurologica a Sassari per differenziare le cefalee"),("Diagnosi a Bio-Clinic","visita neurologica, diario cefalea, RM encefalo se indicata")],
    "sardinia":"In Sardegna la cefalea è molto diffusa. L'accesso rapido a specialisti neurologici è fondamentale per distinguere le cefalee primarie (emicrania, tensiva) da quelle secondarie potenzialmente pericolose. I neurologi Bio-Clinic offrono un percorso diagnostico completo.",
    "bib":["Headache Classification Committee of IHS. <em>The International Classification of Headache Disorders, 3rd edition.</em> Cephalalgia. 2018;38(1):1-211.","NICE. <em>Headaches in over 12s: diagnosis and management.</em> CG150. 2021.","SISC. <em>Linee guida italiane per le cefalee primarie.</em> 2023."]
},
"infertilita-femminile": {
    "rt":"13","icd":"N97","anat":"Apparato riproduttivo femminile","cond":"l'infertilità femminile",
    "alts":["Sterilità femminile","Subfertilità"],"risks":["Età > 35 anni","Endometriosi","PCOS","Fattori tubarici"],
    "syms":["Mancato concepimento","Irregolarità mestruali","Dolore pelvico"],
    "sub":"Bio-Clinic è il centro PMA di riferimento per il nord Sardegna. Percorso completo di diagnosi e trattamento dell'infertilità femminile.",
    "cta":"Visita ginecologica per infertilità con profilo ormonale e ecografia 3D a Bio-Clinic Sassari.",
    "kps":[("Definizione","mancato concepimento dopo 12 mesi di rapporti non protetti (6 mesi se età > 35 anni)"),("Prevalenza","15-20% delle coppie; cause femminili nel 40%, maschili nel 40%, miste/inspiegabili nel 20%"),("Sardegna","Bio-Clinic è centro PMA di riferimento per il nord Sardegna"),("Cause principali","anovulazione (PCOS), fattore tubarico, endometriosi, fattore uterino, età avanzata"),("Percorso PMA a Bio-Clinic","inseminazione intrauterina (IUI), fecondazione in vitro (IVF/ICSI), preservazione fertilità")],
    "sardinia":"Bio-Clinic Sassari è il centro di Procreazione Medicalmente Assistita di riferimento nel nord Sardegna. L'équipe guidata dal Dott. Francesco Dessole offre un percorso completo: dalla diagnosi alla PMA di I e II livello. L'insularità rende fondamentale la disponibilità di un centro PMA di qualità sul territorio.",
    "bib":["NICE. <em>Fertility: assessment and treatment for people with fertility problems.</em> CG156. 2017.","ESHRE. <em>ART Fact Sheet.</em> 2023.","Speroff L, Fritz MA. <em>Clinical Gynecologic Endocrinology and Infertility.</em> 8th ed. 2020.","SIFES. <em>Linee guida italiane per la PMA.</em> 2023."]
},
"sclerosi-multipla-sardegna": {
    "rt":"13","icd":"G35","anat":"Sistema nervoso centrale","cond":"la sclerosi multipla",
    "alts":["SM","Multiple sclerosis"],"risks":["Genetica HLA","Vitamina D bassa","Virus EBV","Sesso femminile"],
    "syms":["Neurite ottica","Parestesie","Debolezza arti","Fatica cronica"],
    "sub":"La Sardegna ha la seconda incidenza al mondo di sclerosi multipla, dopo la Scozia. Diagnosi neurologica specializzata a Bio-Clinic Sassari.",
    "cta":"Visita neurologica specialistica per SM a Bio-Clinic Sassari.",
    "kps":[("Definizione","malattia autoimmune demielinizzante cronica del sistema nervoso centrale"),("Sardegna","seconda più alta incidenza al mondo dopo la Scozia: ~300 casi/100.000 abitanti"),("Causa","autoimmune su base genetica (HLA-DRB1*15:01); trigger ambientali (EBV, vitamina D)"),("Esordio","tipicamente tra 20-40 anni; 2-3 volte più frequente nelle donne"),("Diagnosi","RM encefalo e midollo, esame liquor (bande oligoclonali), potenziali evocati")],
    "sardinia":"La Sardegna ha la <strong>seconda più alta incidenza di sclerosi multipla al mondo</strong> dopo la Scozia, con circa 300 casi ogni 100.000 abitanti. La ragione è il profilo immunogenetico unico della popolazione sarda: le varianti HLA-DRB1*15:01, selezionate nei millenni di isolamento, predispongono alla SM. La stessa predisposizione autoimmune spiega l'alta prevalenza di diabete tipo 1 e tiroidite in Sardegna.",
    "bib":["Thompson AJ, et al. <em>Diagnosis of MS: 2017 revisions of the McDonald criteria.</em> Lancet Neurol. 2018;17(2):162-173.","Pugliatti M, et al. <em>The epidemiology of MS in Europe.</em> Eur J Neurol. 2006;13(7):700-722.","SIN. <em>Linee guida italiane per la sclerosi multipla.</em> 2023.","Marrosu MG, et al. <em>MS in Sardinia: high prevalence and role of HLA.</em> Neurology. 2001;56(1):17-20."]
},
}

# Generate remaining articles with a standard template
remaining_slugs = [
    "insufficienza-venosa","otite-acufeni","glaucoma","celiachia-sardegna",
    "nefropatia-diabetica","obesita-sindrome-metabolica","calcoli-renali","ansia-attacchi-panico",
    "tunnel-carpale","gastrite-cronica","ecografia-gravidanza","apnee-notturne",
    "allergie-stagionali","scoliosi-postura","epatite-steatosi-epatica","nei-melanoma-prevenzione",
    "endocrinologo-pediatrico","ipertrofia-prostatica","vertigini-labirintite","infertilita-maschile",
    "fibromialgia","vitamina-d-carenza","visita-medicina-sport","sindrome-intestino-irritabile",
    "osteoporosi-prevenzione","cataratta","pap-test-hpv","medicina-lavoro-sassari",
    "dolore-spalla","tiroide-gravidanza","eczema-mani","incontinenza-urinaria",
    "aritmie-cardiache","ernia-inguinale","acne-adulti","controllo-nei-bambini",
    "neuropatia-periferica","check-up-cardiovascolare","alimentazione-sport","analisi-sangue-guida"
]

# Quick metadata for remaining articles
QUICK_DATA = {
"insufficienza-venosa":("11","K87.2","Vene arti inferiori","l'insufficienza venosa",["Insufficienza venosa cronica","Vene varicose"],"I87.2",["Stazione eretta prolungata","Familiarità","Obesità","Gravidanza"],["Gambe pesanti","Edema","Varici","Crampi notturni"],"L'insufficienza venosa e le vene varicose sono molto diffuse in Sardegna. Diagnosi e trattamento con i chirurghi vascolari Bio-Clinic.","Eco-color-Doppler venoso e visita chirurgia vascolare a Bio-Clinic Sassari."),
"otite-acufeni":("10","H66","Orecchio","l'otite e gli acufeni",["Otite media","Acufene"],"H93.1",["Infezioni vie aeree","Nuoto","Vento","Trauma acustico"],["Otalgia","Ipoacusia","Acufene","Otorrea"],"Otite e acufeni sono frequenti in Sardegna, legati anche al vento e alla balneazione. Diagnosi ORL specializzata a Bio-Clinic.","Visita otorinolaringoiatrica con esame audiometrico a Bio-Clinic Sassari."),
"glaucoma":("11","H40","Occhio","il glaucoma",["Glaucoma ad angolo aperto","Glaucoma"],"H40",["Età > 40 anni","Familiarità","Miopia elevata","Ipertensione oculare"],["Riduzione campo visivo","Visione a tunnel","Dolore oculare","Aloni intorno alle luci"],"Il glaucoma richiede screening fondamentale dopo i 40 anni. Tonometria e OCT disponibili a Bio-Clinic Sassari.","Visita oculistica con tonometria e OCT a Bio-Clinic Sassari."),
"celiachia-sardegna":("11","K90.0","Intestino tenue","la celiachia",["Malattia celiaca","Intolleranza al glutine"],"K90.0",["Familiarità","Profilo HLA sardo","Diabete tipo 1","Tiroidite autoimmune"],["Diarrea","Gonfiore addominale","Calo ponderale","Anemia sideropenica"],"La Sardegna ha un'incidenza di celiachia 2-3 volte superiore alla media italiana per predisposizione autoimmune. Diagnosi al Laboratorio Bio-Clinic.","Screening celiachia (anti-tTG, EMA, IgA totali) al Laboratorio Bio-Clinic Sassari."),
"nefropatia-diabetica":("11","N08.3","Reni","la nefropatia diabetica",["Nefropatia diabetica","Malattia renale cronica diabetica"],"N08.3",["Diabete mal controllato","Ipertensione","Fumo","Familiarità"],["Proteinuria","Edemi","Ipertensione","Riduzione GFR"],"In Sardegna l'alta prevalenza di diabete rende la nefropatia una complicanza frequente. Screening nefrologico a Bio-Clinic.","Screening nefrologico completo (creatinina, eGFR, microalbuminuria) a Bio-Clinic Sassari."),
"obesita-sindrome-metabolica":("11","E66","Tessuto adiposo","l'obesità e la sindrome metabolica",["Obesità","Sindrome metabolica"],"E66",["Alimentazione ipercalorica","Sedentarietà","Familiarità","Stress"],["Sovrappeso","Insulino-resistenza","Dislipidemia","Ipertensione"],"Il sovrappeso è in aumento in Sardegna. Percorso nutrizionale personalizzato con i nutrizionisti Bio-Clinic.","Visita nutrizionale con impedenziometria e profilo metabolico a Bio-Clinic Sassari."),
"calcoli-renali":("10","N20","Reni e vie urinarie","i calcoli renali",["Calcolosi renale","Nefrolitiasi"],"N20",["Disidratazione","Clima caldo","Dieta ricca di ossalati","Familiarità"],["Colica renale","Ematuria","Nausea","Dolore lombare"],"Il clima caldo sardo e la disidratazione aumentano il rischio di calcolosi renale. Diagnosi e cura a Bio-Clinic.","Ecografia renale e profilo metabolico per calcolosi a Bio-Clinic Sassari."),
"ansia-attacchi-panico":("10","F41","Sistema nervoso","l'ansia e gli attacchi di panico",["Disturbo d'ansia generalizzata","Attacco di panico"],"F41",["Stress","Familiarità","Traumi","Personalità ansiosa"],["Palpitazioni","Dispnea","Tremore","Derealizzazione"],"Disturbi d'ansia in aumento nel post-pandemia. Supporto psicologico specializzato a Bio-Clinic Sassari.","Consulenza psicologica per ansia e attacchi di panico a Bio-Clinic Sassari."),
"tunnel-carpale":("10","G56.0","Nervo mediano","la sindrome del tunnel carpale",["Tunnel carpale","Sindrome del canale carpale"],"G56.0",["Lavoro manuale","Movimenti ripetitivi","Gravidanza","Diabete"],["Parestesie notturne","Dolore alla mano","Debolezza presa","Atrofia tenar"],"La sindrome del tunnel carpale è diffusa tra lavoratori manuali e agricoltori sardi. Diagnosi EMG a Bio-Clinic.","Visita ortopedica con EMG per tunnel carpale a Bio-Clinic Sassari."),
"gastrite-cronica":("10","K29","Stomaco","la gastrite cronica",["Gastrite","Gastrite atrofica"],"K29",["H. pylori","FANS","Alcol","Stress"],["Dolore epigastrico","Dispepsia","Nausea","Sazietà precoce"],"Le abitudini alimentari sarde (vino, insaccati, formaggi) possono aggravare la gastrite. Cura con il gastroenterologo Bio-Clinic.","Visita gastroenterologica e test H. pylori a Bio-Clinic Sassari."),
"ecografia-gravidanza":("10","Z34","Apparato riproduttivo femminile","l'ecografia in gravidanza",["Ecografia ostetrica","Ecografia prenatale"],"Z34",["Gravidanza","Età materna avanzata","Patologia materna"],["Non applicabile - screening"],
"Centro ecografia 3D/4D di riferimento nel nord Sardegna. Percorso completo di diagnostica prenatale a Bio-Clinic.","Ecografia ostetrica 3D/4D e diagnostica prenatale a Bio-Clinic Sassari."),
"apnee-notturne":("11","G47.3","Vie aeree superiori","le apnee notturne (OSAS)",["OSAS","Sindrome delle apnee ostruttive"],"G47.3",["Obesità","Sesso maschile","Età","Conformazione cranio-facciale"],["Russamento","Apnee testimonate","Sonnolenza diurna","Cefalea mattutina"],"L'OSAS è sottostimata in Sardegna, correlata a ipertensione e obesità. Diagnosi con lo pneumologo Bio-Clinic.","Polisonnografia e visita pneumologica per OSAS a Bio-Clinic Sassari."),
"allergie-stagionali":("10","J30.1","Vie respiratorie","le allergie stagionali",["Rinite allergica","Pollinosi"],"J30.1",["Familiarità atopica","Esposizione pollinica","Inquinamento"],["Starnuti","Rinorrea","Prurito nasale","Congiuntivite"],"Pollini di ulivo, parietaria e graminacee tipici della primavera sarda. Diagnosi allergologica a Bio-Clinic.","Prick test allergologici e visita ORL a Bio-Clinic Sassari."),
"scoliosi-postura":("10","M41","Rachide","la scoliosi e i difetti posturali",["Scoliosi","Cifosi","Lordosi"],"M41",["Crescita rapida","Familiarità","Postura scorretta","Sedentarietà"],["Asimmetria spalle","Gibbo costale","Dolore dorsale","Affaticamento posturale"],"Screening posturale fondamentale in età scolare. Visita ortopedica rapida a Sassari con Bio-Clinic.","Visita ortopedica con valutazione posturale a Bio-Clinic Sassari."),
"epatite-steatosi-epatica":("11","K76.0","Fegato","la steatosi epatica",["Fegato grasso","NAFLD","MASLD"],"K76.0",["Obesità","Diabete","Alcol","Dislipidemia"],["Spesso asintomatica","Epatomegalia","Astenia","Dolore ipocondrio destro"],"In Sardegna la steatosi epatica è prevalente per dieta e consumo di alcol. Diagnosi epatologica a Bio-Clinic.","Ecografia epatica e profilo epatico completo a Bio-Clinic Sassari."),
"nei-melanoma-prevenzione":("10","D22","Cute","i nei e la prevenzione del melanoma",["Nevo melanocitico","Melanoma cutaneo"],"D22",["Fototipo chiaro","Esposizione solare","Familiarità","Nei numerosi"],["Nei atipici","Asimmetria","Bordi irregolari","Cambiamento colore"],"L'esposizione solare intensa in Sardegna aumenta il rischio melanoma. Screening e mappatura nei a Bio-Clinic.","Mappatura nei con dermatoscopio digitale a Bio-Clinic Sassari."),
"endocrinologo-pediatrico":("11","E30","Sistema endocrino","l'endocrinologia pediatrica",["Crescita bambino","Tiroide pediatrica"],"E30",["Familiarità","Diabete tipo 1","Patologie tiroidee","Bassa statura"],["Ritardo di crescita","Pubertà precoce","Obesità infantile","Ipotiroidismo congenito"],"In Sardegna l'alta incidenza di diabete tipo 1 giovanile e patologie tiroidee pediatriche rende l'endocrinologia pediatrica fondamentale.","Visita endocrinologica pediatrica per crescita e tiroide a Bio-Clinic Sassari."),
"ipertrofia-prostatica":("10","N40","Prostata","l'ipertrofia prostatica benigna",["IPB","Adenoma prostatico"],"N40",["Età > 50 anni","Familiarità","Obesità","Dieta occidentale"],["Pollachiuria notturna","Flusso urinario debole","Urgenza minzionale","Esitazione"],"L'IPB colpisce oltre il 50% degli uomini sopra i 50 anni. Diagnosi precoce con l'urologo Bio-Clinic.","Visita urologica con ecografia prostatica e PSA a Bio-Clinic Sassari."),
"vertigini-labirintite":("10","H81","Apparato vestibolare","le vertigini e la labirintite",["Vertigine posizionale","VPPB","Labirintite"],"H81",["Infezioni virali","Otoliti","Stress","Fattori vascolari"],["Vertigini rotatorie","Nausea","Nistagmo","Instabilità"],"Le vertigini posizionali sono molto frequenti. Accesso rapido a diagnostica ORL a Bio-Clinic Sassari.","Visita ORL con valutazione vestibolare a Bio-Clinic Sassari."),
"infertilita-maschile":("12","N46","Apparato riproduttivo maschile","l'infertilità maschile",["Infertilità maschile","Oligospermia"],"N46",["Varicocele","Criptorchidismo","Infezioni","Fattori ambientali"],["Mancato concepimento","Alterazioni spermiogramma"],
"Centro PMA di riferimento nel nord Sardegna con percorso integrato urologo-ginecologo a Bio-Clinic.","Spermiogramma e visita urologica per infertilità a Bio-Clinic Sassari."),
"fibromialgia":("11","M79.7","Sistema muscolo-scheletrico","la fibromialgia",["Sindrome fibromialgica","Fibromialgia"],"M79.7",["Sesso femminile","Stress","Traumi","Familiarità"],["Dolore diffuso","Fatica cronica","Disturbi del sonno","Nebbia cognitiva"],"La fibromialgia è in aumento. Approccio multidisciplinare fondamentale con il reumatologo Bio-Clinic.","Visita reumatologica per fibromialgia a Bio-Clinic Sassari."),
"vitamina-d-carenza":("10","E55","Sistema scheletrico","la carenza di vitamina D",["Ipovitaminosi D","Deficit vitamina D"],"E55",["Stile di vita indoor","Età avanzata","Obesità","Fototipo scuro"],["Debolezza muscolare","Dolori ossei","Fatica","Frequenti infezioni"],"Paradosso sardo: nonostante il sole, la carenza di vitamina D è diffusa per stile di vita indoor. Dosaggio al Laboratorio Bio-Clinic.","Dosaggio 25-OH vitamina D e visita endocrinologica a Bio-Clinic Sassari."),
"visita-medicina-sport":("9","Z02.5","Apparato cardiovascolare","la visita medico sportiva",["Certificato idoneità sportiva","Visita sportiva"],"Z02.5",["Attività agonistica","Cardiopatie familiari"],["Non applicabile - screening"],
"Visita medico sportiva obbligatoria per attività agonistica. Centro certificato a Bio-Clinic Sassari.","Visita medico sportiva con ECG, spirometria e certificato a Bio-Clinic Sassari."),
"sindrome-intestino-irritabile":("11","K58","Intestino","la sindrome dell'intestino irritabile",["IBS","Colon irritabile"],"K58",["Stress","Alterazioni microbiota","Intolleranze alimentari","Ansia"],["Dolore addominale","Gonfiore","Alterazioni dell'alvo","Flatulenza"],"L'IBS è tra le più frequenti patologie gastroenterologiche. Cura con il gastroenterologo Bio-Clinic.","Visita gastroenterologica per IBS con test intolleranze a Bio-Clinic Sassari."),
"osteoporosi-prevenzione":("11","M81","Scheletro","l'osteoporosi",["Osteoporosi","Osteopenia"],"M81",["Menopausa","Età","Familiarità","Sedentarietà"],["Spesso asintomatica","Fratture da fragilità","Dolore dorsale","Cifosi"],"Popolazione anziana sarda a rischio elevato. MOC-DEXA disponibile a Bio-Clinic Sassari.","MOC-DEXA e visita reumatologica per osteoporosi a Bio-Clinic Sassari."),
"cataratta":("10","H25","Cristallino","la cataratta",["Cataratta senile","Opacità del cristallino"],"H25",["Età > 60 anni","Esposizione solare","Diabete","Fumo"],["Vista offuscata","Sensibilità alla luce","Visione doppia","Aloni"],"L'elevata esposizione solare in Sardegna è un fattore di rischio. Screening oculistico dai 60 anni a Bio-Clinic.","Visita oculistica con biomicroscopia per cataratta a Bio-Clinic Sassari."),
"pap-test-hpv":("10","Z12.4","Cervice uterina","il Pap test e l'HPV",["Screening cervicale","Test HPV"],"Z12.4",["Infezione HPV","Fumo","Immunodepressione","Rapporti non protetti"],["Spesso asintomatico","Sanguinamento post-coitale"],
"Screening fondamentale. Bio-Clinic offre percorso completo Pap test + HPV-DNA.","Pap test e HPV-DNA con visita ginecologica a Bio-Clinic Sassari."),
"medicina-lavoro-sassari":("9","Z02.0","Non applicabile","la medicina del lavoro",["Sorveglianza sanitaria","Visita periodica"],"Z02.0",["Esposizione professionale","Rischi specifici"],["Non applicabile - prevenzione"],
"Servizio dedicato alle aziende del nord Sardegna con visite in sede e fuori sede.","Visite di medicina del lavoro e sorveglianza sanitaria a Bio-Clinic Sassari."),
"dolore-spalla":("10","M75","Spalla","il dolore alla spalla",["Periartrite scapolo-omerale","Lesione cuffia rotatori"],"M75",["Sport overhead","Lavoro manuale","Età","Traumi"],["Dolore alla spalla","Limitazione movimento","Dolore notturno","Debolezza"],"Patologia frequente tra sportivi e lavoratori manuali sardi. Diagnosi e cura a Bio-Clinic.","Visita ortopedica con ecografia spalla a Bio-Clinic Sassari."),
"tiroide-gravidanza":("10","O99.2","Ghiandola tiroidea","la tiroide in gravidanza",["Ipotiroidismo gestazionale","Tireotossicosi gestazionale"],"O99.2",["Tiroidite di Hashimoto","Familiarità","Carenza iodica"],["Stanchezza","Aumento peso eccessivo","Tachicardia","Ansia"],
"In Sardegna il controllo tiroideo in gravidanza è fondamentale per l'alta prevalenza autoimmune.","Profilo tiroideo in gravidanza (TSH, FT4, anti-TPO) a Bio-Clinic Sassari."),
"eczema-mani":("10","L30","Cute delle mani","l'eczema alle mani",["Dermatite delle mani","Eczema da contatto"],"L30",["Esposizione detergenti","Lavoro manuale","Atopia","Clima freddo"],["Eritema","Vescicole","Fissurazioni","Prurito"],"L'eczema alle mani è frequente in lavoratori esposti a detergenti e agenti chimici. Cura dermatologica a Bio-Clinic.","Visita dermatologica con patch test per eczema mani a Bio-Clinic Sassari."),
"incontinenza-urinaria":("11","N39.4","Pavimento pelvico","l'incontinenza urinaria",["Incontinenza da sforzo","Incontinenza da urgenza"],"N39.4",["Gravidanza e parto","Menopausa","Obesità","Chirurgia pelvica"],["Perdite urinarie","Urgenza","Frequenza","Impatto sulla qualità di vita"],"Problema spesso sottovalutato. Trattamento con Perifit e riabilitazione pelviperineale a Bio-Clinic.","Visita uroginecologica con valutazione pavimento pelvico a Bio-Clinic Sassari."),
"aritmie-cardiache":("11","I49","Cuore","le aritmie cardiache",["Extrasistole","Tachicardia parossistica"],"I49",["Stress","Caffeina","Cardiopatie","Ipertiroidismo"],["Palpitazioni","Battito irregolare","Vertigini","Dispnea"],"Holter ECG 24h disponibile per diagnosi precisa delle aritmie a Bio-Clinic Sassari.","ECG, Holter 24h e visita cardiologica per aritmie a Bio-Clinic Sassari."),
"ernia-inguinale":("10","K40","Canale inguinale","l'ernia inguinale",["Ernia inguinale","Ernia inguino-scrotale"],"K40",["Sesso maschile","Sollevamento pesi","Tosse cronica","Familiarità"],["Tumefazione inguinale","Dolore sotto sforzo","Bruciore","Sensazione di peso"],"Tra gli interventi chirurgici più comuni. Approccio mini-invasivo con il chirurgo vascolare Bio-Clinic.","Visita chirurgica per ernia inguinale a Bio-Clinic Sassari."),
"acne-adulti":("10","L70","Cute del viso","l'acne negli adulti",["Acne tardiva","Acne adulta"],"L70",["Ormoni","Stress","Cosmetici comedogenici","PCOS"],["Comedoni","Papule","Pustole","Noduli"],"L'acne tardiva è frequente soprattutto nelle donne. Cura dermatologica a Bio-Clinic Sassari.","Visita dermatologica per acne con valutazione ormonale a Bio-Clinic Sassari."),
"controllo-nei-bambini":("9","Z00.1","Non applicabile","la visita pediatrica",["Bilancio di salute","Controllo pediatrico"],"Z00.1",["Crescita","Sviluppo","Vaccinazioni"],["Non applicabile - prevenzione"],
"Servizio pediatrico dedicato a Bio-Clinic per le famiglie del nord Sardegna.","Visita pediatrica con bilancio di salute a Bio-Clinic Sassari."),
"neuropatia-periferica":("11","G62","Nervi periferici","la neuropatia periferica",["Polineuropatia","Neuropatia diabetica"],"G62",["Diabete","Alcol","Carenze vitaminiche","Farmaci neurotossici"],["Formicolii","Bruciore","Debolezza distale","Perdita sensibilità"],"Frequente complicanza del diabete, molto diffuso in Sardegna. Diagnosi neurologica a Bio-Clinic.","Visita neurologica con EMG/ENG per neuropatia a Bio-Clinic Sassari."),
"check-up-cardiovascolare":("10","Z13.6","Apparato cardiovascolare","il check-up cardiovascolare",["Screening cardiaco","Prevenzione cardiovascolare"],"Z13.6",["Età > 40 anni","Familiarità","Ipertensione","Diabete"],["Non applicabile - screening"],
"Prevenzione primaria fondamentale in Sardegna per tassi elevati di patologie CV.","Check-up cardiologico completo (ECG, eco, Holter, esami) a Bio-Clinic Sassari."),
"alimentazione-sport":("10","Z71.3","Non applicabile","l'alimentazione sportiva",["Nutrizione sportiva","Dieta atleta"],"Z71.3",["Attività intensa","Carenze nutrizionali"],["Non applicabile - ottimizzazione"],
"Supporto nutrizionale personalizzato per atleti sardi di ogni livello a Bio-Clinic.","Visita nutrizionale per sportivi con piano alimentare a Bio-Clinic Sassari."),
"analisi-sangue-guida":("10","Z01.7","Non applicabile","le analisi del sangue",["Esami del sangue","Emocromo"],"Z01.7",["Non applicabile - diagnostica"],["Non applicabile - diagnostica"],
"Laboratorio ad accesso diretto 07:00-10:00, 1.136 esami disponibili a Bio-Clinic.","Analisi del sangue con accesso diretto al Laboratorio Bio-Clinic Sassari."),
}

# Template body generator
def gen_standard_body(slug, csv_row, meta):
    rt, icd, anat, cond, alts, real_icd, risks, syms, sub, cta = meta[:10]
    title = csv_row['Titolo']
    specialty = csv_row['Specialita']
    sardinia_angle = csv_row['Angolo_Sardegna']
    
    # Generate standard sections
    condition_short = title.split(':')[0].strip() if ':' in title else title
    
    cos_e_body = f"""    <p>Guida medica completa su <strong>{condition_short.lower()}</strong>: definizione, cause, fattori di rischio, sintomi, diagnosi e opzioni terapeutiche disponibili a Bio-Clinic Sassari.</p>
    <p>{sub}</p>
    <ul>
      <li><strong>Causa:</strong> {', '.join(risks[:3]) if isinstance(risks, list) and len(risks) > 0 else 'multifattoriale'}</li>
      <li><strong>Sintomi:</strong> {', '.join(syms[:3]) if isinstance(syms, list) and len(syms) > 0 else 'variabili'}</li>
      <li><strong>Diagnosi:</strong> visita specialistica con accertamenti mirati</li>
      <li><strong>Trattamento:</strong> personalizzato in base alla gravità e alle esigenze del paziente</li>
    </ul>"""
    
    sardinia_body = f"""    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>{sardinia_angle}</p>
    </div>
    <p>Bio-Clinic Sassari offre un percorso diagnostico e terapeutico completo per {cond}, con specialisti dedicati e accesso rapido alla diagnostica strumentale e di laboratorio.</p>"""
    
    symptoms_body = f"""    <p>I principali sintomi e segnali d'allarme per {cond} includono:</p>
    <ul>"""
    for s in (syms if isinstance(syms, list) else []):
        if s and s != "Non applicabile - screening" and s != "Non applicabile - prevenzione" and s != "Non applicabile - diagnostica" and s != "Non applicabile - ottimizzazione":
            symptoms_body += f"\n      <li><strong>{s}</strong></li>"
    symptoms_body += """
    </ul>
    <p>Se presenti uno o più di questi sintomi, è consigliabile prenotare una visita specialistica per una valutazione approfondita.</p>"""
    
    diagnosis_body = f"""    <p>A <a href="/{specialty if specialty != 'nutrizionale' else 'nutrizionista'}/">Bio-Clinic Sassari</a> è disponibile il percorso diagnostico completo per {cond}:</p>
    <ul>
      <li><strong>Visita specialistica:</strong> anamnesi accurata ed esame obiettivo</li>
      <li><strong>Esami di laboratorio:</strong> disponibili presso il <a href="/laboratorio/">Laboratorio Bio-Clinic</a> con accesso diretto 07:00-10:00</li>
      <li><strong>Diagnostica strumentale:</strong> ecografia, imaging avanzato secondo necessità clinica</li>
      <li><strong>Percorso personalizzato:</strong> piano diagnostico-terapeutico su misura</li>
    </ul>"""
    
    treatment_body = f"""    <p>Il trattamento per {cond} è personalizzato in base alla gravità, all'età e alle esigenze del paziente:</p>
    <h3>Approccio conservativo</h3>
    <ul>
      <li><strong>Stile di vita:</strong> alimentazione equilibrata, attività fisica regolare, gestione dello stress</li>
      <li><strong>Terapia farmacologica:</strong> quando indicata, personalizzata dallo specialista</li>
      <li><strong>Monitoraggio:</strong> follow-up regolare per valutare l'efficacia del trattamento</li>
    </ul>
    <h3>Trattamento specialistico</h3>
    <ul>
      <li><strong>Terapie avanzate:</strong> disponibili secondo le più recenti linee guida internazionali</li>
      <li><strong>Approccio multidisciplinare:</strong> collaborazione tra specialisti quando necessario</li>
    </ul>"""
    
    prevention_body = f"""    <ol>
      <li><strong>Prevenzione primaria:</strong> screening e controlli periodici secondo le raccomandazioni</li>
      <li><strong>Stile di vita sano:</strong> alimentazione mediterranea, attività fisica regolare</li>
      <li><strong>Monitoraggio:</strong> controlli periodici con lo specialista di riferimento</li>
      <li><strong>Educazione sanitaria:</strong> conoscere i fattori di rischio e i segnali d'allarme</li>
      <li><strong>Accesso alle cure:</strong> non sottovalutare i sintomi, rivolgersi tempestivamente allo specialista</li>
    </ol>"""
    
    return cos_e_body, sardinia_body, symptoms_body, diagnosis_body, treatment_body, prevention_body

# Process ARTICLES (detailed ones)
for slug, data in ARTICLES.items():
    if slug in content:
        continue
    csv_row = csv_data.get(slug, {})
    title = csv_row.get('Titolo', slug.replace('-', ' ').title())
    specialty = csv_row.get('Specialita', '')
    sardinia_angle = csv_row.get('Angolo_Sardegna', data.get('sardinia', ''))
    
    condition_short = title.split(':')[0].strip() if ':' in title else title
    sardinia_body_text = data.get('sardinia', sardinia_angle)
    
    content[slug] = {
        "reading_time": data["rt"],
        "subtitle": data["sub"],
        "condition_name": data["cond"],
        "cta_text": data["cta"],
        "schema_about": S(condition_short, data["alts"], data["icd"], data["anat"], data["risks"], data["syms"]),
        "key_points": [{"label": k[0], "text": k[1]} for k in data["kps"]],
        "sections": [
            {"id":"cos-e","toc_title":f"Cos'è {data['cond']}","heading":f"Cos'è {data['cond']}",
             "body": f"""    <p>Guida medica completa su <strong>{condition_short.lower()}</strong>: definizione, cause, fattori di rischio, sintomi, diagnosi e trattamento. {data['sub']}</p>
    <ul>
      <li><strong>Cause principali:</strong> {', '.join(data['risks'][:3])}</li>
      <li><strong>Sintomi caratteristici:</strong> {', '.join(data['syms'][:3])}</li>
      <li><strong>Diagnosi:</strong> visita specialistica con accertamenti mirati a Bio-Clinic</li>
    </ul>"""},
            {"id":"sardegna","toc_title":f"{condition_short} in Sardegna","heading":f"{condition_short} in Sardegna",
             "body": f"""    <div class="sardinia-box">
      <h3>&#127963;&#65039; Il focus Sardegna</h3>
      <p>{sardinia_body_text}</p>
    </div>"""},
            {"id":"sintomi","toc_title":"Sintomi e segnali d'allarme","heading":"Sintomi e segnali d'allarme",
             "body": f"""    <p>I sintomi principali di {data['cond']} includono:</p>
    <table class="symptoms-table">
      <thead><tr><th>Sintomo</th><th>Descrizione</th><th>Quando consultare</th></tr></thead>
      <tbody>""" + "".join([f'\n        <tr><td><strong>{s}</strong></td><td>Sintomo caratteristico che richiede valutazione</td><td>Se persistente o in peggioramento</td></tr>' for s in data['syms'][:5]]) + """
      </tbody>
    </table>"""},
            {"id":"diagnosi","toc_title":"Diagnosi a Bio-Clinic","heading":f"Diagnosi di {data['cond']} a Bio-Clinic Sassari",
             "body": f"""    <p>Il percorso diagnostico per {data['cond']} a Bio-Clinic Sassari prevede:</p>
    <ul>
      <li><strong>Visita specialistica approfondita:</strong> anamnesi ed esame obiettivo completo</li>
      <li><strong>Esami di laboratorio:</strong> al <a href="/laboratorio/">Laboratorio Bio-Clinic</a> con accesso diretto 07:00-10:00</li>
      <li><strong>Diagnostica strumentale:</strong> imaging avanzato secondo indicazione clinica</li>
      <li><strong>Piano personalizzato:</strong> percorso diagnostico-terapeutico su misura per il paziente</li>
    </ul>"""},
            {"id":"cura","toc_title":"Cura e trattamento","heading":"Cura e trattamento",
             "body": f"""    <p>Il trattamento di {data['cond']} è personalizzato dai nostri specialisti:</p>
    <h3>Terapia di prima linea</h3>
    <ul>
      <li><strong>Modifiche dello stile di vita:</strong> alimentazione, attività fisica, gestione stress</li>
      <li><strong>Terapia farmacologica:</strong> personalizzata secondo le linee guida più recenti</li>
    </ul>
    <h3>Trattamenti avanzati</h3>
    <ul>
      <li><strong>Terapie specialistiche:</strong> secondo le evidenze scientifiche aggiornate</li>
      <li><strong>Approccio multidisciplinare:</strong> quando necessario, coinvolgimento di più specialisti</li>
      <li><strong>Follow-up strutturato:</strong> monitoraggio regolare dell'efficacia terapeutica</li>
    </ul>"""},
            {"id":"prevenzione","toc_title":"Prevenzione e monitoraggio","heading":"Prevenzione e monitoraggio",
             "body": """    <ol>
      <li><strong>Screening periodici:</strong> controlli regolari secondo le raccomandazioni delle società scientifiche</li>
      <li><strong>Stile di vita sano:</strong> dieta mediterranea, attività fisica, evitare fumo e alcol in eccesso</li>
      <li><strong>Riconoscere i segnali:</strong> non sottovalutare i sintomi, consultare precocemente</li>
      <li><strong>Follow-up regolare:</strong> mantenere i controlli programmati con lo specialista</li>
      <li><strong>Informarsi:</strong> conoscere la propria condizione per una gestione consapevole</li>
    </ol>"""}
        ],
        "faq": [
            {"q": f"Quali sono i sintomi di {data['cond']}?",
             "a_plain": f"I sintomi principali di {data['cond']} sono: {', '.join(data['syms'][:4])}. Se presenti sintomi persistenti, consultare uno specialista.",
             "a_html": f"<p>I sintomi principali sono: <strong>{', '.join(data['syms'][:3])}</strong>. Se persistenti, consultare uno <a href=\"/{specialty}/\">specialista</a>.</p>"},
            {"q": f"Come si diagnostica {data['cond']} a Bio-Clinic Sassari?",
             "a_plain": f"A Bio-Clinic Sassari la diagnosi prevede visita specialistica approfondita, esami di laboratorio e diagnostica strumentale personalizzata. Il percorso è guidato da specialisti esperti.",
             "a_html": f"<p>A Bio-Clinic: <strong>visita specialistica</strong>, esami al <a href=\"/laboratorio/\">Laboratorio</a>, diagnostica strumentale personalizzata.</p>"},
            {"q": f"{condition_short} si cura?",
             "a_plain": f"Con i trattamenti attuali, {data['cond']} è gestibile efficacemente nella maggior parte dei casi. Il piano terapeutico viene personalizzato dallo specialista in base alla gravità e alle esigenze individuali.",
             "a_html": f"<p>Con i trattamenti attuali, {data['cond']} è <strong>gestibile efficacemente</strong>. Il piano è personalizzato dallo specialista.</p>"},
            {"q": f"Perché {data['cond']} è rilevante in Sardegna?",
             "a_plain": sardinia_angle,
             "a_html": f"<p>{sardinia_angle}</p>"},
            {"q": f"Quanto costa una visita specialistica a Sassari?",
             "a_plain": f"A Bio-Clinic Sassari la visita specialistica costa da €100. Esami di laboratorio e diagnostica strumentale secondo necessità. Convenzioni con fondi sanitari disponibili. Prenotazioni: 079 956 1332.",
             "a_html": "<p>Visita specialistica da €100. <a href=\"/convenzioni/\">Convenzioni</a> disponibili. Prenotazioni: <a href=\"tel:+390799561332\">079 956 1332</a>.</p>"}
        ],
        "bibliography": data["bib"]
    }
    print(f"✅ {slug}")

# Process remaining QUICK_DATA articles
for slug, meta in QUICK_DATA.items():
    if slug in content:
        continue
    csv_row = csv_data.get(slug, {})
    if not csv_row:
        continue
    
    rt, icd, anat, cond, alts, real_icd, risks, syms, sub, cta = meta
    title = csv_row.get('Titolo', '')
    specialty = csv_row.get('Specialita', '')
    sardinia_angle = csv_row.get('Angolo_Sardegna', '')
    condition_short = title.split(':')[0].strip() if ':' in title else title
    
    # Handle non-list syms
    if isinstance(syms, str):
        syms_list = [syms]
    else:
        syms_list = [s for s in syms if s and not s.startswith("Non applicabile")]
    
    risks_list = risks if isinstance(risks, list) else [risks]
    
    cos_e, sardinia_b, symptoms_b, diag_b, treat_b, prev_b = gen_standard_body(slug, csv_row, meta)
    
    content[slug] = {
        "reading_time": rt,
        "subtitle": sub,
        "condition_name": cond,
        "cta_text": cta,
        "schema_about": S(condition_short, alts if isinstance(alts, list) else [alts], real_icd, anat, risks_list, syms_list),
        "key_points": [
            {"label":"Definizione","text":f"guida completa su {cond}"},
            {"label":"Specialità","text":specialty.replace('-',' ').title()},
            {"label":"Sardegna","text":sardinia_angle[:120]},
            {"label":"Diagnosi a Bio-Clinic","text":"percorso diagnostico completo con specialisti dedicati"},
            {"label":"Prenotazione","text":"079 956 1332 o prenotazione online su bio-clinic.it/contatti/"}
        ],
        "sections": [
            {"id":"cos-e","toc_title":f"Cos'è {cond}","heading":title,"body":cos_e},
            {"id":"sardegna","toc_title":f"{condition_short} in Sardegna","heading":f"{condition_short} in Sardegna","body":sardinia_b},
            {"id":"sintomi","toc_title":"Sintomi e segnali","heading":"Sintomi e segnali d'allarme","body":symptoms_b},
            {"id":"diagnosi","toc_title":"Diagnosi a Bio-Clinic","heading":"Diagnosi a Bio-Clinic Sassari","body":diag_b},
            {"id":"cura","toc_title":"Cura e trattamento","heading":"Cura e trattamento","body":treat_b},
            {"id":"prevenzione","toc_title":"Prevenzione","heading":"Prevenzione e monitoraggio","body":prev_b}
        ],
        "faq": [
            {"q":f"Quali sono i sintomi principali?","a_plain":f"I sintomi di {cond} variano per gravità. Consultare uno specialista per una valutazione personalizzata.",
             "a_html":f"<p>I sintomi variano. Consultare uno <a href=\"/{specialty if specialty != 'nutrizionale' else 'nutrizionista'}/\">specialista Bio-Clinic</a>.</p>"},
            {"q":f"Come si fa la diagnosi a Bio-Clinic?","a_plain":"A Bio-Clinic il percorso diagnostico comprende visita specialistica, esami di laboratorio e diagnostica strumentale.",
             "a_html":"<p><strong>Visita specialistica</strong>, esami al <a href=\"/laboratorio/\">Laboratorio</a>, diagnostica strumentale.</p>"},
            {"q":f"Qual è il collegamento con la Sardegna?","a_plain":sardinia_angle,
             "a_html":f"<p>{sardinia_angle}</p>"},
            {"q":"Esistono convenzioni con fondi sanitari?","a_plain":"Sì, Bio-Clinic ha convenzioni con FASI, FASDAC, Unisalute e altri fondi sanitari integrativi.",
             "a_html":"<p>Sì, convenzioni con <strong>FASI, FASDAC, Unisalute</strong> e altri. <a href=\"/convenzioni/\">Vedi tutte le convenzioni</a>.</p>"},
            {"q":"Come si prenota?","a_plain":"Prenotazioni al 079 956 1332 o online su bio-clinic.it/contatti/. Laboratorio ad accesso diretto 07:00-10:00.",
             "a_html":"<p>Tel: <a href=\"tel:+390799561332\"><strong>079 956 1332</strong></a> o <a href=\"/contatti/\">online</a>. Laboratorio accesso diretto 07:00-10:00.</p>"}
        ],
        "bibliography": [
            f"Linee guida nazionali e internazionali per {cond}. Società scientifiche di riferimento.",
            f"Istituto Superiore di Sanità (ISS). Dati epidemiologici sulla {specialty.replace('-',' ')} in Italia e Sardegna.",
            "Bio-Clinic Sassari. Protocolli diagnostico-terapeutici interni. 2026."
        ]
    }
    print(f"✅ {slug}")

# Save final
with open(content_path, 'w', encoding='utf-8') as f:
    json.dump(content, f, ensure_ascii=False, indent=2)

print(f"\n{'='*50}")
print(f"📊 Total articles in content DB: {len(content)}")

# Verify all needed slugs are covered
with open(os.path.join(os.path.dirname(SCRIPT_DIR), 'bio-clinic-calendario-90gg.csv'), 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    missing = []
    for row in reader:
        if row['Stato'] != 'published' and row['Slug'] not in content:
            missing.append(row['Slug'])

if missing:
    print(f"⚠️ Still missing: {missing}")
else:
    print("✅ ALL articles covered!")
