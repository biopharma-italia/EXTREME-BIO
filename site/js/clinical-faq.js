/**
 * BIO-CLINIC Clinical FAQ System v1.0.0
 * Sistema FAQ cliniche per tutte le pagine specialità
 * Gestione dinamica, Schema.org, accessibilità
 */

const ClinicalFAQ = (function() {
    'use strict';
    
    // Database FAQ per specialità
    const FAQ_DATABASE = {
        cardiologia: {
            title: "Domande Frequenti sulla Cardiologia",
            icon: "❤️",
            items: [
                {
                    question: "Quando devo fare una visita cardiologica?",
                    answer: `<p>È consigliato effettuare una visita cardiologica nei seguenti casi:</p>
                    <ul>
                        <li><strong>Sintomi sospetti:</strong> dolore toracico, affanno, palpitazioni, gonfiore alle gambe</li>
                        <li><strong>Fattori di rischio:</strong> ipertensione, diabete, colesterolo alto, fumo, familiarità</li>
                        <li><strong>Prevenzione:</strong> dopo i 40 anni (uomini) o 50 anni (donne), anche in assenza di sintomi</li>
                        <li><strong>Sport:</strong> prima di iniziare attività fisica intensa, certificato medico sportivo</li>
                        <li><strong>Follow-up:</strong> se già in terapia cardiologica o dopo un evento cardiovascolare</li>
                    </ul>`
                },
                {
                    question: "Cosa comprende una visita cardiologica?",
                    answer: `<p>La visita cardiologica completa include:</p>
                    <ul>
                        <li><strong>Anamnesi:</strong> raccolta storia clinica, sintomi, familiarità, stile di vita</li>
                        <li><strong>Esame obiettivo:</strong> auscultazione cuore e polmoni, misurazione pressione</li>
                        <li><strong>ECG (elettrocardiogramma):</strong> registrazione attività elettrica del cuore</li>
                        <li><strong>Valutazione rischio:</strong> calcolo del rischio cardiovascolare globale</li>
                        <li><strong>Prescrizione:</strong> eventuali esami di approfondimento, terapia, follow-up</li>
                    </ul>
                    <p><em>Durata media: 30-45 minuti</em></p>`
                },
                {
                    question: "Qual è la differenza tra ECG ed ecocardiogramma?",
                    answer: `<p><strong>ECG (Elettrocardiogramma):</strong></p>
                    <ul>
                        <li>Registra l'attività elettrica del cuore</li>
                        <li>Rileva aritmie, ischemie, infarti pregressi</li>
                        <li>Esame rapido (5-10 minuti), non invasivo</li>
                        <li>Costo contenuto, primo livello diagnostico</li>
                    </ul>
                    <p><strong>Ecocardiogramma:</strong></p>
                    <ul>
                        <li>Ecografia del cuore (immagini in tempo reale)</li>
                        <li>Valuta struttura, valvole, funzione contrattile</li>
                        <li>Esame più approfondito (20-30 minuti)</li>
                        <li>Indicato per valvulopatie, scompenso, cardiomiopatie</li>
                    </ul>`
                },
                {
                    question: "Cos'è l'Holter cardiaco e quando serve?",
                    answer: `<p>L'Holter è un <strong>monitoraggio ECG continuo per 24-48 ore</strong>. È indicato quando:</p>
                    <ul>
                        <li>Palpitazioni o battiti irregolari intermittenti</li>
                        <li>Svenimenti o lipotimie di origine non chiara</li>
                        <li>Valutazione efficacia terapia antiaritmica</li>
                        <li>Screening in pazienti a rischio (post-infarto, cardiopatici)</li>
                    </ul>
                    <p><strong>Come funziona:</strong> Si applica un piccolo registratore portatile collegato a elettrodi sul torace. Il paziente continua le normali attività quotidiane.</p>`
                },
                {
                    question: "Come devo prepararmi alla visita cardiologica?",
                    answer: `<p><strong>Cosa portare:</strong></p>
                    <ul>
                        <li>Esami del sangue recenti (colesterolo, glicemia, creatinina)</li>
                        <li>Esami cardiologici precedenti (ECG, ecocardio, Holter)</li>
                        <li>Lista dei farmaci in uso (con dosaggi)</li>
                        <li>Eventuali lettere di dimissione o referti</li>
                    </ul>
                    <p><strong>Prima della visita:</strong></p>
                    <ul>
                        <li>Non è necessario il digiuno</li>
                        <li>Evitare caffè/energy drink nelle 2 ore precedenti</li>
                        <li>Indossare abbigliamento comodo</li>
                    </ul>`
                },
                {
                    question: "Quali sono i valori normali della pressione arteriosa?",
                    answer: `<p><strong>Classificazione pressione arteriosa (mmHg):</strong></p>
                    <ul>
                        <li><strong>Ottimale:</strong> <120/80</li>
                        <li><strong>Normale:</strong> 120-129/80-84</li>
                        <li><strong>Normale-alta:</strong> 130-139/85-89</li>
                        <li><strong>Ipertensione grado 1:</strong> 140-159/90-99</li>
                        <li><strong>Ipertensione grado 2:</strong> 160-179/100-109</li>
                        <li><strong>Ipertensione grado 3:</strong> ≥180/≥110</li>
                    </ul>
                    <p><em>La pressione va misurata a riposo, in posizione seduta, dopo 5 minuti di relax.</em></p>`
                }
            ]
        },
        
        neurologia: {
            title: "Domande Frequenti sulla Neurologia",
            icon: "🧠",
            items: [
                {
                    question: "Quando consultare un neurologo?",
                    answer: `<p>È consigliata una visita neurologica in caso di:</p>
                    <ul>
                        <li><strong>Cefalee:</strong> mal di testa frequenti, intensi o con caratteristiche nuove</li>
                        <li><strong>Vertigini:</strong> sensazione di giramento, instabilità, disequilibrio</li>
                        <li><strong>Disturbi sensitivi:</strong> formicolii, intorpidimento, perdita di sensibilità</li>
                        <li><strong>Debolezza muscolare:</strong> perdita di forza localizzata o diffusa</li>
                        <li><strong>Disturbi della memoria:</strong> dimenticanze frequenti, disorientamento</li>
                        <li><strong>Tremori:</strong> movimenti involontari a riposo o durante l'azione</li>
                        <li><strong>Disturbi del sonno:</strong> insonnia, apnee, sonnolenza diurna</li>
                    </ul>`
                },
                {
                    question: "Qual è la differenza tra neurologo e neurochirurgo?",
                    answer: `<p><strong>Neurologo:</strong></p>
                    <ul>
                        <li>Diagnosi e terapia medica delle malattie del sistema nervoso</li>
                        <li>Tratta: emicranie, epilessia, Parkinson, sclerosi multipla, neuropatie</li>
                        <li>Approccio farmacologico e riabilitativo</li>
                    </ul>
                    <p><strong>Neurochirurgo:</strong></p>
                    <ul>
                        <li>Interventi chirurgici su cervello, midollo spinale, nervi periferici</li>
                        <li>Tratta: tumori cerebrali, ernie discali, aneurismi, traumi cranici</li>
                        <li>Approccio chirurgico</li>
                    </ul>
                    <p><em>Spesso le due figure collaborano per una gestione integrata del paziente.</em></p>`
                },
                {
                    question: "Come si svolge una visita neurologica?",
                    answer: `<p>La visita neurologica comprende:</p>
                    <ul>
                        <li><strong>Anamnesi dettagliata:</strong> sintomi, storia clinica, familiarità</li>
                        <li><strong>Esame neurologico:</strong> valutazione di:
                            <ul>
                                <li>Funzioni cognitive (memoria, attenzione, linguaggio)</li>
                                <li>Nervi cranici (vista, udito, movimenti oculari, deglutizione)</li>
                                <li>Sistema motorio (forza, tono muscolare, coordinazione)</li>
                                <li>Sistema sensitivo (tatto, dolore, temperatura, vibrazione)</li>
                                <li>Riflessi (osteotendinei, cutanei)</li>
                                <li>Equilibrio e deambulazione</li>
                            </ul>
                        </li>
                    </ul>
                    <p><em>Durata: 40-60 minuti</em></p>`
                },
                {
                    question: "Cos'è l'elettromiografia (EMG) e quando serve?",
                    answer: `<p>L'<strong>elettromiografia</strong> è un esame che valuta la funzionalità dei muscoli e dei nervi periferici.</p>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>Sindrome del tunnel carpale</li>
                        <li>Neuropatie periferiche (diabetica, alcolica)</li>
                        <li>Radicolopatie (ernie discali con compressione nervosa)</li>
                        <li>Malattie muscolari (miopatie)</li>
                        <li>Malattie del motoneurone (SLA)</li>
                    </ul>
                    <p><strong>Come si esegue:</strong> mediante elettrodi ad ago o di superficie si registra l'attività elettrica dei muscoli.</p>
                    <p><em>Lieve fastidio, non richiede preparazione particolare.</em></p>`
                },
                {
                    question: "Quando preoccuparsi per il mal di testa?",
                    answer: `<p><strong>Segnali d'allarme (Red Flags):</strong></p>
                    <ul>
                        <li>Cefalea improvvisa e molto intensa ("il peggiore della mia vita")</li>
                        <li>Cefalea con febbre e rigidità del collo</li>
                        <li>Cefalea dopo trauma cranico</li>
                        <li>Cefalea con disturbi neurologici (visione doppia, debolezza, confusione)</li>
                        <li>Cefalea nuova dopo i 50 anni</li>
                        <li>Cefalea progressivamente ingravescente</li>
                        <li>Cefalea che sveglia dal sonno</li>
                    </ul>
                    <p style="color: #d32f2f;"><strong>⚠️ In presenza di questi sintomi, consultare urgentemente un medico.</strong></p>`
                },
                {
                    question: "Cosa portare alla visita neurologica?",
                    answer: `<p><strong>Documentazione utile:</strong></p>
                    <ul>
                        <li>Referti di esami precedenti (RMN encefalo, TAC, EMG)</li>
                        <li>Lettere di dimissione ospedaliera</li>
                        <li>Lista completa dei farmaci (inclusi integratori)</li>
                        <li>Diario delle cefalee (se mal di testa ricorrente)</li>
                        <li>Video di eventuali episodi (tremori, crisi)</li>
                    </ul>
                    <p><strong>Prima della visita:</strong> non è richiesta preparazione particolare.</p>`
                }
            ]
        },
        
        ginecologia: {
            title: "Domande Frequenti sulla Ginecologia",
            icon: "👩‍⚕️",
            items: [
                {
                    question: "Ogni quanto fare la visita ginecologica?",
                    answer: `<p><strong>Raccomandazioni per età:</strong></p>
                    <ul>
                        <li><strong>Adolescenti:</strong> prima visita dopo l'inizio dell'attività sessuale o entro i 21 anni</li>
                        <li><strong>25-65 anni:</strong> visita annuale con Pap-test ogni 3 anni (o HPV test ogni 5 anni)</li>
                        <li><strong>Dopo i 65 anni:</strong> secondo indicazione del ginecologo</li>
                        <li><strong>Gravidanza:</strong> controlli mensili, poi più frequenti</li>
                    </ul>
                    <p><em>In caso di sintomi (perdite anomale, dolore, sanguinamenti) consultare tempestivamente.</em></p>`
                },
                {
                    question: "Cosa comprende la visita ginecologica?",
                    answer: `<p>La visita ginecologica standard include:</p>
                    <ul>
                        <li><strong>Colloquio:</strong> anamnesi, ciclo mestruale, contraccezione, sintomi</li>
                        <li><strong>Esame del seno:</strong> palpazione per noduli o alterazioni</li>
                        <li><strong>Esame pelvico:</strong> ispezione e palpazione degli organi genitali</li>
                        <li><strong>Ecografia transvaginale:</strong> visualizzazione utero e ovaie</li>
                        <li><strong>Pap-test:</strong> prelievo cellulare per screening tumore cervice</li>
                    </ul>
                    <p><em>La visita è indolore e dura circa 20-30 minuti.</em></p>`
                },
                {
                    question: "Quando fare il Pap-test e il test HPV?",
                    answer: `<p><strong>Pap-test:</strong></p>
                    <ul>
                        <li>Età: 25-64 anni</li>
                        <li>Frequenza: ogni 3 anni se negativo</li>
                        <li>Rileva alterazioni cellulari precancerose</li>
                    </ul>
                    <p><strong>Test HPV:</strong></p>
                    <ul>
                        <li>Età: 30-65 anni (può sostituire il Pap-test)</li>
                        <li>Frequenza: ogni 5 anni se negativo</li>
                        <li>Rileva la presenza del virus HPV ad alto rischio</li>
                    </ul>
                    <p><strong>Importante:</strong> effettuare il prelievo lontano dal ciclo mestruale (almeno 5 giorni), evitare rapporti e lavande nelle 48h precedenti.</p>`
                },
                {
                    question: "Cos'è l'ecografia transvaginale e quando serve?",
                    answer: `<p>L'ecografia transvaginale è un esame che permette di visualizzare utero, ovaie e tube con elevata precisione.</p>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>Controllo ginecologico annuale</li>
                        <li>Irregolarità mestruali, sanguinamenti anomali</li>
                        <li>Dolore pelvico</li>
                        <li>Monitoraggio follicolare (PMA)</li>
                        <li>Screening e follow-up di cisti, fibromi, polipi</li>
                        <li>Prime settimane di gravidanza</li>
                    </ul>
                    <p><em>Esame indolore, non richiede preparazione. Durata: 10-15 minuti.</em></p>`
                },
                {
                    question: "Quali sono i sintomi della menopausa?",
                    answer: `<p>La menopausa (cessazione ciclo mestruale) si manifesta tipicamente tra 45-55 anni.</p>
                    <p><strong>Sintomi comuni:</strong></p>
                    <ul>
                        <li><strong>Vampate di calore:</strong> sensazione improvvisa di caldo, sudorazione</li>
                        <li><strong>Disturbi del sonno:</strong> insonnia, risvegli notturni</li>
                        <li><strong>Alterazioni dell'umore:</strong> irritabilità, ansia, depressione</li>
                        <li><strong>Secchezza vaginale:</strong> disagio, dispareunia</li>
                        <li><strong>Irregolarità mestruali:</strong> nella fase di transizione (perimenopausa)</li>
                    </ul>
                    <p><em>Il ginecologo può consigliare terapie ormonali sostitutive o alternative naturali.</em></p>`
                },
                {
                    question: "Come prepararsi alla visita ginecologica?",
                    answer: `<p><strong>Prima della visita:</strong></p>
                    <ul>
                        <li>Evitare rapporti sessuali nelle 24-48 ore precedenti</li>
                        <li>Non effettuare lavande vaginali</li>
                        <li>Preferibilmente non durante il ciclo mestruale</li>
                        <li>Svuotare la vescica prima dell'ecografia</li>
                    </ul>
                    <p><strong>Cosa portare:</strong></p>
                    <ul>
                        <li>Esami precedenti (Pap-test, ecografie)</li>
                        <li>Annotare data ultimo ciclo mestruale</li>
                        <li>Lista farmaci e integratori in uso</li>
                        <li>Eventuali domande da porre al medico</li>
                    </ul>`
                }
            ]
        },
        
        dermatologia: {
            title: "Domande Frequenti sulla Dermatologia",
            icon: "🔬",
            items: [
                {
                    question: "Quando fare la mappatura dei nei?",
                    answer: `<p>La mappatura dei nei (dermatoscopia) è consigliata:</p>
                    <ul>
                        <li><strong>Screening iniziale:</strong> almeno una volta in età adulta per avere una baseline</li>
                        <li><strong>Controlli periodici:</strong> annuali se si hanno molti nei (>50) o nei atipici</li>
                        <li><strong>Fototipo chiaro:</strong> pelle chiara, capelli rossi/biondi, occhi chiari</li>
                        <li><strong>Familiarità:</strong> casi di melanoma in famiglia</li>
                        <li><strong>Esposizione solare intensa:</strong> scottature pregresse, uso lettini abbronzanti</li>
                        <li><strong>Cambiamenti:</strong> se un neo cambia forma, colore, dimensione o sintomi</li>
                    </ul>`
                },
                {
                    question: "Come riconoscere un neo sospetto? La regola ABCDE",
                    answer: `<p>La regola <strong>ABCDE</strong> aiuta a identificare nei potenzialmente pericolosi:</p>
                    <ul>
                        <li><strong>A - Asimmetria:</strong> una metà diversa dall'altra</li>
                        <li><strong>B - Bordi:</strong> irregolari, frastagliati, sfumati</li>
                        <li><strong>C - Colore:</strong> non uniforme, con più tonalità</li>
                        <li><strong>D - Dimensione:</strong> diametro >6mm o in crescita</li>
                        <li><strong>E - Evoluzione:</strong> cambiamenti nel tempo</li>
                    </ul>
                    <p style="color: #d32f2f;"><strong>⚠️ In presenza di uno o più di questi segni, consultare un dermatologo.</strong></p>`
                },
                {
                    question: "Cos'è la dermatoscopia?",
                    answer: `<p>La <strong>dermatoscopia</strong> (o dermoscopia) è una tecnica diagnostica non invasiva che permette di esaminare i nei con un ingrandimento 10-20x.</p>
                    <p><strong>Vantaggi:</strong></p>
                    <ul>
                        <li>Osservazione di strutture non visibili a occhio nudo</li>
                        <li>Diagnosi precoce di melanoma (aumenta la sensibilità del 30%)</li>
                        <li>Riduce le asportazioni inutili di nei benigni</li>
                        <li>Documentazione fotografica per follow-up</li>
                    </ul>
                    <p><em>Esame indolore, rapido, non richiede preparazione.</em></p>`
                },
                {
                    question: "Come trattare l'acne?",
                    answer: `<p>L'<strong>acne</strong> è una condizione infiammatoria delle ghiandole sebacee. Il trattamento dipende dalla gravità:</p>
                    <p><strong>Acne lieve:</strong></p>
                    <ul>
                        <li>Detergenti delicati specifici</li>
                        <li>Prodotti topici con acido salicilico, benzoil perossido</li>
                        <li>Retinoidi topici</li>
                    </ul>
                    <p><strong>Acne moderata-severa:</strong></p>
                    <ul>
                        <li>Antibiotici topici o orali</li>
                        <li>Retinoidi orali (isotretinoina) nei casi severi</li>
                        <li>Terapia ormonale nelle donne (pillola contraccettiva)</li>
                    </ul>
                    <p><em>Evitare di schiacciare i brufoli (rischio cicatrici) e consultare un dermatologo per un trattamento personalizzato.</em></p>`
                },
                {
                    question: "Quali sono le cause della perdita di capelli?",
                    answer: `<p>Le cause principali della <strong>caduta dei capelli (alopecia)</strong> includono:</p>
                    <ul>
                        <li><strong>Alopecia androgenetica:</strong> la più comune, ereditaria (calvizie maschile/femminile)</li>
                        <li><strong>Telogen effluvium:</strong> caduta temporanea dopo stress, malattie, parto, diete</li>
                        <li><strong>Alopecia areata:</strong> chiazze rotonde senza capelli (autoimmune)</li>
                        <li><strong>Carenze nutrizionali:</strong> ferro, zinco, vitamine B, D</li>
                        <li><strong>Disfunzioni tiroidee:</strong> ipotiroidismo, ipertiroidismo</li>
                        <li><strong>Farmaci:</strong> chemioterapia, anticoagulanti, beta-bloccanti</li>
                    </ul>
                    <p><em>Una visita dermatologica con tricoscopia permette di identificare la causa e impostare la terapia.</em></p>`
                },
                {
                    question: "Come proteggere la pelle dal sole?",
                    answer: `<p><strong>Regole di fotoprotezione:</strong></p>
                    <ul>
                        <li><strong>Crema solare SPF 30-50:</strong> applicare 20 minuti prima dell'esposizione, riapplicare ogni 2 ore</li>
                        <li><strong>Evitare le ore centrali:</strong> 11:00-16:00 (raggi UV più intensi)</li>
                        <li><strong>Indossare protezioni:</strong> cappello, occhiali da sole, maglietta</li>
                        <li><strong>Attenzione alle superfici riflettenti:</strong> acqua, sabbia, neve</li>
                        <li><strong>No lettini abbronzanti:</strong> aumentano significativamente il rischio di melanoma</li>
                        <li><strong>Bambini:</strong> protezione extra, evitare esposizione diretta sotto i 6 mesi</li>
                    </ul>`
                }
            ]
        },
        
        endocrinologia: {
            title: "Domande Frequenti sull'Endocrinologia",
            icon: "🦋",
            items: [
                {
                    question: "Quando consultare un endocrinologo?",
                    answer: `<p>L'endocrinologo tratta le patologie del sistema ormonale. È indicata una visita in caso di:</p>
                    <ul>
                        <li><strong>Tiroide:</strong> noduli, ipotiroidismo, ipertiroidismo, tiroiditi</li>
                        <li><strong>Diabete:</strong> diagnosi, gestione, complicanze</li>
                        <li><strong>Obesità:</strong> sovrappeso resistente a dieta, sindrome metabolica</li>
                        <li><strong>Osteoporosi:</strong> fragilità ossea, prevenzione fratture</li>
                        <li><strong>Disturbi ormonali:</strong> irsutismo, acne, irregolarità mestruali</li>
                        <li><strong>Ghiandole surrenali:</strong> ipertensione secondaria, affaticamento</li>
                        <li><strong>Ipofisi:</strong> adenomi, deficit ormonali</li>
                    </ul>`
                },
                {
                    question: "Quali sono i sintomi di problemi alla tiroide?",
                    answer: `<p><strong>Ipotiroidismo (tiroide lenta):</strong></p>
                    <ul>
                        <li>Stanchezza, sonnolenza</li>
                        <li>Aumento di peso</li>
                        <li>Intolleranza al freddo</li>
                        <li>Pelle secca, capelli fragili</li>
                        <li>Stipsi, ritenzione idrica</li>
                        <li>Bradicardia (battito lento)</li>
                    </ul>
                    <p><strong>Ipertiroidismo (tiroide veloce):</strong></p>
                    <ul>
                        <li>Nervosismo, ansia, tremori</li>
                        <li>Perdita di peso</li>
                        <li>Intolleranza al caldo, sudorazione</li>
                        <li>Palpitazioni, tachicardia</li>
                        <li>Diarrea</li>
                        <li>Insonnia</li>
                    </ul>`
                },
                {
                    question: "Come si diagnostica il diabete?",
                    answer: `<p><strong>Criteri diagnostici per il diabete:</strong></p>
                    <ul>
                        <li><strong>Glicemia a digiuno:</strong> ≥126 mg/dL (confermata in 2 occasioni)</li>
                        <li><strong>Glicemia casuale:</strong> ≥200 mg/dL con sintomi (poliuria, polidipsia, perdita peso)</li>
                        <li><strong>Emoglobina glicata (HbA1c):</strong> ≥6.5%</li>
                        <li><strong>Curva da carico (OGTT):</strong> glicemia ≥200 mg/dL dopo 2 ore</li>
                    </ul>
                    <p><strong>Pre-diabete:</strong></p>
                    <ul>
                        <li>Glicemia a digiuno: 100-125 mg/dL</li>
                        <li>HbA1c: 5.7-6.4%</li>
                    </ul>
                    <p><em>Il pre-diabete è reversibile con dieta, esercizio fisico e controllo del peso.</em></p>`
                },
                {
                    question: "Cos'è la sindrome metabolica?",
                    answer: `<p>La <strong>sindrome metabolica</strong> è un insieme di condizioni che aumentano il rischio cardiovascolare e di diabete.</p>
                    <p><strong>Criteri (almeno 3 su 5):</strong></p>
                    <ul>
                        <li>Circonferenza vita: >102 cm (uomini), >88 cm (donne)</li>
                        <li>Trigliceridi: ≥150 mg/dL</li>
                        <li>HDL (colesterolo "buono"): <40 mg/dL (uomini), <50 mg/dL (donne)</li>
                        <li>Pressione arteriosa: ≥130/85 mmHg</li>
                        <li>Glicemia a digiuno: ≥100 mg/dL</li>
                    </ul>
                    <p><strong>Trattamento:</strong> modifica dello stile di vita (dieta mediterranea, attività fisica), eventuale terapia farmacologica.</p>`
                },
                {
                    question: "Come prepararsi alla visita endocrinologica?",
                    answer: `<p><strong>Esami da portare:</strong></p>
                    <ul>
                        <li>Esami del sangue recenti (TSH, FT3, FT4, glicemia, HbA1c, lipidi)</li>
                        <li>Ecografie tiroidee precedenti</li>
                        <li>Referti di scintigrafie, biopsie</li>
                        <li>Diario glicemico (se diabetico)</li>
                    </ul>
                    <p><strong>Prima della visita:</strong></p>
                    <ul>
                        <li>Annotare tutti i farmaci in uso (con dosaggi)</li>
                        <li>Segnare i sintomi e la loro evoluzione nel tempo</li>
                        <li>Non è necessario il digiuno (salvo diversa indicazione)</li>
                    </ul>`
                },
                {
                    question: "Come funzionano i nuovi farmaci per l'obesità (GLP-1)?",
                    answer: `<p>I farmaci agonisti del <strong>GLP-1</strong> (semaglutide, tirzepatide) rappresentano una nuova frontiera nel trattamento dell'obesità.</p>
                    <p><strong>Come agiscono:</strong></p>
                    <ul>
                        <li>Riducono l'appetito (azione sul cervello)</li>
                        <li>Rallentano lo svuotamento gastrico (maggiore sazietà)</li>
                        <li>Migliorano la sensibilità all'insulina</li>
                    </ul>
                    <p><strong>Risultati attesi:</strong></p>
                    <ul>
                        <li>Perdita del 15-20% del peso corporeo</li>
                        <li>Miglioramento parametri metabolici</li>
                        <li>Riduzione rischio cardiovascolare</li>
                    </ul>
                    <p><em>Presso Bio-Clinic offriamo il percorso <a href="slim-care.html">Slim Care</a> con Wegovy® e Mounjaro® sotto supervisione medica specializzata.</em></p>`
                }
            ]
        },
        
        ortopedia: {
            title: "Domande Frequenti sull'Ortopedia",
            icon: "🦴",
            items: [
                {
                    question: "Quando consultare un ortopedico?",
                    answer: `<p>È consigliata una visita ortopedica in caso di:</p>
                    <ul>
                        <li><strong>Dolore articolare:</strong> ginocchio, anca, spalla, polso, caviglia</li>
                        <li><strong>Mal di schiena:</strong> cervicalgia, lombalgia, lombosciatalgia</li>
                        <li><strong>Traumi:</strong> distorsioni, fratture, lussazioni</li>
                        <li><strong>Limitazione funzionale:</strong> difficoltà nei movimenti quotidiani</li>
                        <li><strong>Deformità:</strong> alluce valgo, piede piatto, scoliosi</li>
                        <li><strong>Patologie degenerative:</strong> artrosi, osteoporosi</li>
                    </ul>`
                },
                {
                    question: "Qual è la differenza tra ortopedico e fisiatra?",
                    answer: `<p><strong>Ortopedico:</strong></p>
                    <ul>
                        <li>Specialista chirurgico dell'apparato muscolo-scheletrico</li>
                        <li>Può effettuare interventi chirurgici (protesi, artroscopie, fratture)</li>
                        <li>Indicato per patologie che potrebbero richiedere chirurgia</li>
                    </ul>
                    <p><strong>Fisiatra:</strong></p>
                    <ul>
                        <li>Specialista della riabilitazione</li>
                        <li>Approccio non chirurgico (fisioterapia, infiltrazioni, terapie fisiche)</li>
                        <li>Indicato per recupero post-trauma, dolore cronico, disabilità</li>
                    </ul>
                    <p><em>Spesso collaborano per una gestione integrata del paziente.</em></p>`
                },
                {
                    question: "Cosa sono le infiltrazioni articolari?",
                    answer: `<p>Le <strong>infiltrazioni</strong> sono iniezioni di farmaci direttamente nell'articolazione o nei tessuti circostanti.</p>
                    <p><strong>Tipi di infiltrazioni:</strong></p>
                    <ul>
                        <li><strong>Cortisonici:</strong> potente anti-infiammatorio, effetto rapido ma temporaneo</li>
                        <li><strong>Acido ialuronico:</strong> "lubrificante" articolare, migliora la viscosità</li>
                        <li><strong>PRP (Plasma Ricco di Piastrine):</strong> fattori di crescita autologhi</li>
                        <li><strong>Collagene:</strong> supporto ai tessuti articolari</li>
                    </ul>
                    <p><strong>Indicazioni:</strong> artrosi, tendiniti, borsiti, capsuliti.</p>
                    <p><em>Procedura ambulatoriale, eseguita con guida ecografica per maggiore precisione.</em></p>`
                },
                {
                    question: "Quando è necessaria la protesi del ginocchio o dell'anca?",
                    answer: `<p>La <strong>protesi articolare</strong> è indicata quando:</p>
                    <ul>
                        <li>Dolore severo che non risponde alle terapie conservative</li>
                        <li>Limitazione funzionale importante (difficoltà a camminare, salire scale)</li>
                        <li>Artrosi avanzata (usura della cartilagine)</li>
                        <li>Qualità della vita significativamente compromessa</li>
                    </ul>
                    <p><strong>Terapie da provare prima:</strong></p>
                    <ul>
                        <li>Fisioterapia e rinforzo muscolare</li>
                        <li>Farmaci anti-infiammatori</li>
                        <li>Infiltrazioni (acido ialuronico, cortisonici)</li>
                        <li>Perdita di peso se in sovrappeso</li>
                    </ul>
                    <p><em>L'intervento va valutato caso per caso con l'ortopedico.</em></p>`
                },
                {
                    question: "Cos'è l'ernia del disco e come si tratta?",
                    answer: `<p>L'<strong>ernia del disco</strong> è la fuoriuscita del nucleo polposo del disco intervertebrale, che può comprimere le radici nervose.</p>
                    <p><strong>Sintomi:</strong></p>
                    <ul>
                        <li>Dolore lombare o cervicale</li>
                        <li>Sciatalgia (dolore che irradia alla gamba)</li>
                        <li>Formicolii, intorpidimento</li>
                        <li>Debolezza muscolare (nei casi più gravi)</li>
                    </ul>
                    <p><strong>Trattamento:</strong></p>
                    <ul>
                        <li><strong>Conservativo (90% dei casi):</strong> riposo, farmaci, fisioterapia, infiltrazioni</li>
                        <li><strong>Chirurgico:</strong> se deficit neurologici progressivi o dolore intrattabile</li>
                    </ul>`
                },
                {
                    question: "Come prevenire i problemi articolari?",
                    answer: `<p><strong>Consigli per la salute delle articolazioni:</strong></p>
                    <ul>
                        <li><strong>Mantenere il peso forma:</strong> ogni kg in meno riduce il carico sulle ginocchia di 4 kg</li>
                        <li><strong>Attività fisica regolare:</strong> nuoto, bici, camminata (basso impatto)</li>
                        <li><strong>Stretching e rinforzo muscolare:</strong> muscoli forti proteggono le articolazioni</li>
                        <li><strong>Postura corretta:</strong> ergonomia sul lavoro, pause frequenti</li>
                        <li><strong>Alimentazione:</strong> omega-3, vitamina D, calcio</li>
                        <li><strong>Evitare sovraccarichi:</strong> sollevare pesi correttamente</li>
                    </ul>`
                }
            ]
        },
        
        urologia: {
            title: "Domande Frequenti sull'Urologia",
            icon: "🩺",
            items: [
                {
                    question: "Quando consultare un urologo?",
                    answer: `<p>È consigliata una visita urologica in caso di:</p>
                    <ul>
                        <li><strong>Disturbi urinari:</strong> difficoltà a urinare, urgenza, frequenza aumentata</li>
                        <li><strong>Sangue nelle urine:</strong> anche episodico, richiede sempre accertamenti</li>
                        <li><strong>Dolore:</strong> ai reni, al basso ventre, ai testicoli</li>
                        <li><strong>Prostata:</strong> PSA elevato, ingrossamento, sospetto tumore</li>
                        <li><strong>Calcoli renali:</strong> coliche, sabbia nelle urine</li>
                        <li><strong>Disfunzioni sessuali maschili:</strong> disfunzione erettile, eiaculazione precoce</li>
                        <li><strong>Infertilità maschile:</strong> difficoltà a concepire</li>
                    </ul>`
                },
                {
                    question: "Cos'è il PSA e quando farlo?",
                    answer: `<p>Il <strong>PSA (Antigene Prostatico Specifico)</strong> è un marcatore prodotto dalla prostata, utile per lo screening del tumore prostatico.</p>
                    <p><strong>Quando dosare il PSA:</strong></p>
                    <ul>
                        <li>Screening: dopo i 50 anni (dopo i 45 se familiarità per tumore prostata)</li>
                        <li>Sintomi urinari sospetti</li>
                        <li>Follow-up dopo interventi o terapie prostatiche</li>
                    </ul>
                    <p><strong>Valori di riferimento:</strong></p>
                    <ul>
                        <li>Normale: <4 ng/mL (varia con l'età)</li>
                        <li>PSA elevato non significa necessariamente tumore (può essere prostatite, ipertrofia)</li>
                    </ul>
                    <p><em>Un PSA alterato richiede sempre valutazione urologica.</em></p>`
                },
                {
                    question: "Quali sono i sintomi dell'ipertrofia prostatica?",
                    answer: `<p>L'<strong>ipertrofia prostatica benigna (IPB)</strong> è l'ingrossamento della prostata, comune dopo i 50 anni.</p>
                    <p><strong>Sintomi ostruttivi:</strong></p>
                    <ul>
                        <li>Difficoltà ad iniziare la minzione</li>
                        <li>Getto urinario debole o interrotto</li>
                        <li>Sensazione di svuotamento incompleto</li>
                        <li>Gocciolamento post-minzionale</li>
                    </ul>
                    <p><strong>Sintomi irritativi:</strong></p>
                    <ul>
                        <li>Urgenza minzionale</li>
                        <li>Frequenza aumentata (anche notturna - nicturia)</li>
                        <li>Bruciore</li>
                    </ul>
                    <p><em>L'IPB è benigna ma può compromettere la qualità della vita. Terapia medica efficace nella maggior parte dei casi.</em></p>`
                },
                {
                    question: "Come prevenire i calcoli renali?",
                    answer: `<p><strong>Consigli per prevenire i calcoli:</strong></p>
                    <ul>
                        <li><strong>Idratazione:</strong> bere almeno 2-2.5 litri di acqua al giorno</li>
                        <li><strong>Limitare il sale:</strong> <5g/giorno</li>
                        <li><strong>Moderare le proteine animali:</strong> carne rossa, insaccati</li>
                        <li><strong>Evitare eccesso di ossalati:</strong> spinaci, cioccolato, tè nero, frutta secca (se calcoli di ossalato)</li>
                        <li><strong>Agrumi:</strong> il citrato nelle urine previene la formazione di calcoli</li>
                        <li><strong>Calcio con i pasti:</strong> il calcio alimentare riduce l'assorbimento di ossalati</li>
                    </ul>
                    <p><em>Chi ha già avuto calcoli dovrebbe fare un'analisi metabolica per una prevenzione mirata.</em></p>`
                },
                {
                    question: "Cos'è l'ecografia prostatica transrettale?",
                    answer: `<p>L'<strong>ecografia prostatica transrettale (TRUS)</strong> è un esame che permette di visualizzare la prostata con elevata precisione.</p>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>PSA elevato o in aumento</li>
                        <li>Esplorazione rettale sospetta</li>
                        <li>Guida per biopsia prostatica</li>
                        <li>Valutazione dimensioni prostata</li>
                        <li>Studio vescicole seminali</li>
                    </ul>
                    <p><strong>Preparazione:</strong> clistere di pulizia 2-3 ore prima dell'esame.</p>
                    <p><em>Esame lievemente fastidioso ma non doloroso. Durata: 15-20 minuti.</em></p>`
                },
                {
                    question: "Come prepararsi alla visita urologica?",
                    answer: `<p><strong>Cosa portare:</strong></p>
                    <ul>
                        <li>Esami del sangue (PSA, creatinina, esame urine)</li>
                        <li>Ecografie precedenti (addome, prostata)</li>
                        <li>Referti di TAC, risonanze</li>
                        <li>Lista farmaci in uso</li>
                    </ul>
                    <p><strong>Prima della visita:</strong></p>
                    <ul>
                        <li>Non è necessario il digiuno</li>
                        <li>Vescica moderatamente piena per l'ecografia</li>
                        <li>Preparare un elenco dei sintomi con date di insorgenza</li>
                    </ul>
                    <p><em>La visita include generalmente l'esplorazione rettale digitale.</em></p>`
                }
            ]
        },
        
        pneumologia: {
            title: "Domande Frequenti sulla Pneumologia",
            icon: "🫁",
            items: [
                {
                    question: "Quando consultare un pneumologo?",
                    answer: `<p>È consigliata una visita pneumologica in caso di:</p>
                    <ul>
                        <li><strong>Tosse persistente:</strong> che dura più di 3 settimane</li>
                        <li><strong>Dispnea:</strong> difficoltà respiratoria, affanno a riposo o sotto sforzo</li>
                        <li><strong>Respiro sibilante:</strong> fischi o sibili durante la respirazione</li>
                        <li><strong>Dolore toracico:</strong> associato alla respirazione</li>
                        <li><strong>Apnee notturne:</strong> russamento, pause respiratorie nel sonno, sonnolenza diurna</li>
                        <li><strong>Infezioni respiratorie ricorrenti:</strong> bronchiti, polmoniti frequenti</li>
                        <li><strong>Fumatori:</strong> screening e valutazione del rischio</li>
                    </ul>`
                },
                {
                    question: "Cos'è la spirometria e a cosa serve?",
                    answer: `<p>La <strong>spirometria</strong> è il test base della funzionalità respiratoria.</p>
                    <p><strong>Cosa misura:</strong></p>
                    <ul>
                        <li>Volume d'aria che i polmoni possono contenere</li>
                        <li>Velocità con cui l'aria viene espulsa (flussi)</li>
                        <li>Presenza di ostruzione o restrizione bronchiale</li>
                    </ul>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>Diagnosi di asma e BPCO</li>
                        <li>Monitoraggio malattie respiratorie croniche</li>
                        <li>Valutazione pre-operatoria</li>
                        <li>Idoneità sportiva</li>
                        <li>Medicina del lavoro (esposizione a polveri, sostanze)</li>
                    </ul>
                    <p><em>Esame semplice, indolore, durata 15-20 minuti.</em></p>`
                },
                {
                    question: "Qual è la differenza tra asma e BPCO?",
                    answer: `<p><strong>Asma:</strong></p>
                    <ul>
                        <li>Infiammazione cronica delle vie aeree</li>
                        <li>Reversibile con terapia (ostruzione variabile)</li>
                        <li>Esordio spesso in età giovane</li>
                        <li>Associata ad allergie (spesso)</li>
                        <li>Sintomi episodici, scatenati da trigger</li>
                    </ul>
                    <p><strong>BPCO (Broncopneumopatia Cronica Ostruttiva):</strong></p>
                    <ul>
                        <li>Ostruzione cronica non completamente reversibile</li>
                        <li>Esordio tipico dopo i 40-50 anni</li>
                        <li>Principale causa: fumo di sigaretta</li>
                        <li>Sintomi progressivi e costanti</li>
                        <li>Include enfisema e bronchite cronica</li>
                    </ul>`
                },
                {
                    question: "Cosa sono le apnee notturne (OSAS)?",
                    answer: `<p>La <strong>sindrome delle apnee ostruttive del sonno (OSAS)</strong> è caratterizzata da pause respiratorie durante il sonno.</p>
                    <p><strong>Sintomi:</strong></p>
                    <ul>
                        <li>Russamento intenso</li>
                        <li>Pause respiratorie riferite dal partner</li>
                        <li>Risvegli con sensazione di soffocamento</li>
                        <li>Sonnolenza diurna eccessiva</li>
                        <li>Cefalea mattutina</li>
                        <li>Difficoltà di concentrazione</li>
                    </ul>
                    <p><strong>Rischi:</strong> ipertensione, aritmie, ictus, incidenti stradali/lavorativi.</p>
                    <p><strong>Diagnosi:</strong> polisonnografia (studio del sonno)</p>
                    <p><strong>Terapia:</strong> CPAP, dispositivi orali, chirurgia nei casi selezionati.</p>`
                },
                {
                    question: "Come prepararsi alla visita pneumologica?",
                    answer: `<p><strong>Cosa portare:</strong></p>
                    <ul>
                        <li>Radiografie del torace precedenti</li>
                        <li>TAC torace (se effettuate)</li>
                        <li>Spirometrie precedenti</li>
                        <li>Lista farmaci (inclusi inalatori)</li>
                        <li>Referti di visite specialistiche correlate</li>
                    </ul>
                    <p><strong>Prima della spirometria:</strong></p>
                    <ul>
                        <li>Non fumare nelle 4-6 ore precedenti</li>
                        <li>Evitare pasti abbondanti nelle 2 ore prima</li>
                        <li>Non assumere broncodilatatori (se non diversamente indicato)</li>
                        <li>Indossare abiti comodi</li>
                    </ul>`
                },
                {
                    question: "Quali esami del sangue sono utili in pneumologia?",
                    answer: `<p><strong>Esami ematici rilevanti:</strong></p>
                    <ul>
                        <li><strong>Emocromo:</strong> eosinofili (allergie, asma), emoglobina (anemia)</li>
                        <li><strong>IgE totali e specifiche:</strong> screening allergologico</li>
                        <li><strong>Alfa-1-antitripsina:</strong> enfisema ereditario</li>
                        <li><strong>D-dimero:</strong> sospetta embolia polmonare</li>
                        <li><strong>Emogasanalisi:</strong> scambi respiratori (O2, CO2)</li>
                        <li><strong>BNP/NT-proBNP:</strong> escludere scompenso cardiaco</li>
                    </ul>
                    <p><em>Gli esami vengono prescritti in base al quadro clinico specifico.</em></p>`
                }
            ]
        },
        
        oculistica: {
            title: "Domande Frequenti sull'Oculistica",
            icon: "👁️",
            items: [
                {
                    question: "Ogni quanto fare la visita oculistica?",
                    answer: `<p><strong>Raccomandazioni per età:</strong></p>
                    <ul>
                        <li><strong>Bambini:</strong> prima visita entro i 3 anni, poi prima della scuola</li>
                        <li><strong>18-40 anni:</strong> ogni 2-3 anni (più frequente se miopi)</li>
                        <li><strong>40-60 anni:</strong> ogni 1-2 anni (screening glaucoma, presbiopia)</li>
                        <li><strong>Oltre 60 anni:</strong> annualmente (cataratta, maculopatia, glaucoma)</li>
                        <li><strong>Diabetici:</strong> annualmente (retinopatia diabetica)</li>
                    </ul>
                    <p><em>In caso di sintomi (visione offuscata, lampi, mosche volanti) consultare tempestivamente.</em></p>`
                },
                {
                    question: "Cosa comprende una visita oculistica completa?",
                    answer: `<p>La visita oculistica completa include:</p>
                    <ul>
                        <li><strong>Anamnesi:</strong> storia clinica, familiarità, farmaci</li>
                        <li><strong>Esame della vista:</strong> acuità visiva con e senza correzione</li>
                        <li><strong>Refrazione:</strong> misurazione difetti (miopia, ipermetropia, astigmatismo)</li>
                        <li><strong>Tonometria:</strong> misurazione pressione oculare (screening glaucoma)</li>
                        <li><strong>Esame del fondo oculare:</strong> retina, macula, nervo ottico</li>
                        <li><strong>Esame alla lampada a fessura:</strong> segmento anteriore</li>
                    </ul>
                    <p><em>Durata: 30-45 minuti. Portare occhiali/lenti in uso.</em></p>`
                },
                {
                    question: "Cos'è il glaucoma e come si diagnostica?",
                    answer: `<p>Il <strong>glaucoma</strong> è una malattia del nervo ottico, spesso associata a pressione oculare elevata, che può portare a perdita della vista.</p>
                    <p><strong>Caratteristiche:</strong></p>
                    <ul>
                        <li>Silenzioso: non dà sintomi nelle fasi iniziali</li>
                        <li>Progressivo: danneggia prima la visione periferica</li>
                        <li>Irreversibile: i danni non sono recuperabili</li>
                    </ul>
                    <p><strong>Screening:</strong></p>
                    <ul>
                        <li>Tonometria (pressione oculare)</li>
                        <li>Esame del campo visivo</li>
                        <li>OCT del nervo ottico</li>
                        <li>Pachimetria corneale</li>
                    </ul>
                    <p><em>Fattori di rischio: età >40 anni, familiarità, miopia elevata, diabete.</em></p>`
                },
                {
                    question: "Quando operare la cataratta?",
                    answer: `<p>La <strong>cataratta</strong> è l'opacizzazione del cristallino, normale con l'invecchiamento.</p>
                    <p><strong>Indicazioni all'intervento:</strong></p>
                    <ul>
                        <li>Visione ridotta che limita le attività quotidiane (guida, lettura)</li>
                        <li>Abbagliamento fastidioso</li>
                        <li>Visione notturna compromessa</li>
                        <li>Necessità di rinnovo patente con visus insufficiente</li>
                    </ul>
                    <p><strong>L'intervento:</strong></p>
                    <ul>
                        <li>Ambulatoriale, in anestesia locale</li>
                        <li>Durata: 15-20 minuti</li>
                        <li>Si impianta una lente artificiale (IOL)</li>
                        <li>Recupero visivo rapido (giorni)</li>
                    </ul>
                    <p><em>Intervento molto sicuro e con eccellenti risultati.</em></p>`
                },
                {
                    question: "Cosa sono le 'mosche volanti'?",
                    answer: `<p>Le <strong>miodesopsie</strong> ("mosche volanti") sono ombre o filamenti che si muovono nel campo visivo.</p>
                    <p><strong>Cause comuni:</strong></p>
                    <ul>
                        <li>Degenerazione del vitreo (normale con l'età)</li>
                        <li>Miopia</li>
                        <li>Post-intervento di cataratta</li>
                    </ul>
                    <p><strong>Segnali d'allarme (consultare urgentemente):</strong></p>
                    <ul>
                        <li>Comparsa improvvisa di molte mosche volanti</li>
                        <li>Lampi di luce (fotopsie)</li>
                        <li>Ombra o tenda nel campo visivo</li>
                    </ul>
                    <p style="color: #d32f2f;"><strong>⚠️ Questi sintomi possono indicare un distacco di retina, emergenza oculistica!</strong></p>`
                },
                {
                    question: "Come prepararsi alla visita oculistica?",
                    answer: `<p><strong>Cosa portare:</strong></p>
                    <ul>
                        <li>Occhiali e/o lenti a contatto in uso</li>
                        <li>Precedenti prescrizioni di occhiali</li>
                        <li>Referti oculistici precedenti (campi visivi, OCT, fluorangiografie)</li>
                        <li>Lista farmaci (alcuni influenzano la vista)</li>
                    </ul>
                    <p><strong>Prima della visita:</strong></p>
                    <ul>
                        <li>Non guidare se verrà effettuata la dilatazione pupillare</li>
                        <li>Portare occhiali da sole (per dopo la visita)</li>
                        <li>Rimuovere le lenti a contatto se richiesto</li>
                    </ul>
                    <p><em>La dilatazione pupillare offusca la vista per 3-4 ore.</em></p>`
                }
            ]
        },
        
        gastroenterologia: {
            title: "Domande Frequenti sulla Gastroenterologia",
            icon: "🩺",
            items: [
                {
                    question: "Quando consultare un gastroenterologo?",
                    answer: `<p>È consigliata una visita gastroenterologica in caso di:</p>
                    <ul>
                        <li><strong>Dolore addominale:</strong> persistente, ricorrente o intenso</li>
                        <li><strong>Disturbi digestivi:</strong> bruciore, gonfiore, nausea, reflusso</li>
                        <li><strong>Alterazioni dell'alvo:</strong> diarrea cronica, stipsi, alternanza</li>
                        <li><strong>Sanguinamento:</strong> sangue nelle feci o nel vomito</li>
                        <li><strong>Perdita di peso inspiegabile</strong></li>
                        <li><strong>Difficoltà a deglutire</strong></li>
                        <li><strong>Alterazioni degli esami epatici</strong></li>
                    </ul>`
                },
                {
                    question: "Cos'è la gastroscopia (EGDS) e quando farla?",
                    answer: `<p>La <strong>gastroscopia</strong> (esofago-gastro-duodenoscopia) è un esame endoscopico che visualizza esofago, stomaco e duodeno.</p>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>Reflusso gastroesofageo persistente</li>
                        <li>Dispepsia (cattiva digestione) non responsiva a terapia</li>
                        <li>Sospetta ulcera gastrica o duodenale</li>
                        <li>Anemia da carenza di ferro (ricerca sanguinamento)</li>
                        <li>Disfagia (difficoltà a deglutire)</li>
                        <li>Diagnosi Helicobacter pylori</li>
                        <li>Screening esofago di Barrett</li>
                    </ul>
                    <p><strong>Preparazione:</strong> digiuno da almeno 8 ore. Sedazione disponibile.</p>`
                },
                {
                    question: "Cos'è la colonscopia e quando farla?",
                    answer: `<p>La <strong>colonscopia</strong> è l'esame endoscopico del colon (intestino crasso).</p>
                    <p><strong>Indicazioni:</strong></p>
                    <ul>
                        <li>Screening tumore del colon (dai 50 anni o prima se familiarità)</li>
                        <li>Sangue nelle feci</li>
                        <li>Alterazioni dell'alvo (diarrea/stipsi croniche)</li>
                        <li>Dolori addominali ricorrenti</li>
                        <li>Anemia da carenza di ferro</li>
                        <li>Follow-up dopo rimozione di polipi</li>
                    </ul>
                    <p><strong>Preparazione:</strong> dieta senza scorie per 3 giorni + lassativo il giorno prima.</p>
                    <p><em>Esame in sedazione, durata 20-30 minuti.</em></p>`
                },
                {
                    question: "Cos'è l'Helicobacter pylori?",
                    answer: `<p>L'<strong>Helicobacter pylori</strong> è un batterio che colonizza lo stomaco, responsabile di:</p>
                    <ul>
                        <li>Gastrite cronica</li>
                        <li>Ulcera gastrica e duodenale</li>
                        <li>Aumentato rischio di tumore gastrico (fattore di rischio)</li>
                    </ul>
                    <p><strong>Diagnosi:</strong></p>
                    <ul>
                        <li>Test del respiro (urea breath test) - non invasivo</li>
                        <li>Ricerca antigene fecale</li>
                        <li>Biopsia durante gastroscopia</li>
                    </ul>
                    <p><strong>Terapia:</strong> antibiotici + gastroprotettore per 10-14 giorni. Eradicazione nel 85-90% dei casi.</p>`
                },
                {
                    question: "Quali sono i sintomi del reflusso gastroesofageo?",
                    answer: `<p>La <strong>malattia da reflusso gastroesofageo (MRGE)</strong> si manifesta con:</p>
                    <p><strong>Sintomi tipici:</strong></p>
                    <ul>
                        <li>Bruciore retrosternale (pirosi)</li>
                        <li>Rigurgito acido</li>
                        <li>Sensazione di risalita del cibo</li>
                    </ul>
                    <p><strong>Sintomi atipici:</strong></p>
                    <ul>
                        <li>Tosse cronica (soprattutto notturna)</li>
                        <li>Raucedine, mal di gola</li>
                        <li>Dolore toracico (simil-cardiaco)</li>
                        <li>Erosioni dentali</li>
                    </ul>
                    <p><strong>Consigli:</strong> pasti piccoli e frequenti, evitare cibi grassi/speziati, non coricarsi subito dopo i pasti, sollevare la testiera del letto.</p>`
                },
                {
                    question: "Cos'è la sindrome dell'intestino irritabile (IBS)?",
                    answer: `<p>L'<strong>IBS (colon irritabile)</strong> è un disturbo funzionale caratterizzato da:</p>
                    <ul>
                        <li>Dolore addominale ricorrente (almeno 1 giorno/settimana)</li>
                        <li>Correlato alla defecazione (migliora o peggiora)</li>
                        <li>Associato a variazioni della frequenza o forma delle feci</li>
                    </ul>
                    <p><strong>Sottotipi:</strong></p>
                    <ul>
                        <li>IBS-D: predominanza diarrea</li>
                        <li>IBS-C: predominanza stipsi</li>
                        <li>IBS-M: alternanza diarrea/stipsi</li>
                    </ul>
                    <p><strong>Diagnosi:</strong> per esclusione (escludere cause organiche).</p>
                    <p><strong>Terapia:</strong> dieta low-FODMAP, probiotici, antispastici, gestione stress.</p>`
                }
            ]
        }
    };

    // Funzione per generare HTML delle FAQ
    function renderFAQ(specialty) {
        const data = FAQ_DATABASE[specialty];
        if (!data) return '';
        
        let html = `
        <section class="clinical-faq-section" id="faq">
            <div class="container">
                <div class="section-header">
                    <span class="faq-icon">${data.icon}</span>
                    <h2>${data.title}</h2>
                    <p>Risposte alle domande più comuni dei nostri pazienti</p>
                </div>
                
                <div class="faq-container">
        `;
        
        data.items.forEach((item, index) => {
            html += `
                    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                        <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${index}">
                            <span itemprop="name">${item.question}</span>
                            <span class="faq-toggle">+</span>
                        </button>
                        <div class="faq-answer" id="faq-answer-${index}" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                            <div itemprop="text">${item.answer}</div>
                        </div>
                    </div>
            `;
        });
        
        html += `
                </div>
                
                <div class="faq-cta">
                    <p>Non hai trovato la risposta che cercavi?</p>
                    <a href="tel:+390799561332" class="btn btn-primary">📞 Chiama 079 956 1332</a>
                </div>
            </div>
        </section>
        `;
        
        return html;
    }

    // Funzione per generare Schema.org JSON-LD per FAQPage
    function generateFAQSchema(specialty) {
        const data = FAQ_DATABASE[specialty];
        if (!data) return null;
        
        return {
            "@type": "FAQPage",
            "@id": `https://bio-clinic.it/pages/${specialty}.html#faq`,
            "mainEntity": data.items.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer.replace(/<[^>]*>/g, '') // Strip HTML tags
                }
            }))
        };
    }

    // CSS per le FAQ
    const FAQ_STYLES = `
    <style>
    /* Clinical FAQ Styles */
    .clinical-faq-section {
        padding: 60px 0;
        background: #f8f9fa;
    }
    
    .clinical-faq-section .section-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .clinical-faq-section .faq-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 15px;
    }
    
    .clinical-faq-section h2 {
        font-size: 2rem;
        color: #1a1a2e;
        margin-bottom: 10px;
    }
    
    .clinical-faq-section .section-header p {
        color: #666;
        font-size: 1.1rem;
    }
    
    .faq-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .faq-item {
        background: white;
        border-radius: 12px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        overflow: hidden;
    }
    
    .faq-question {
        width: 100%;
        padding: 20px 25px;
        background: white;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a2e;
        text-align: left;
        transition: background 0.2s;
    }
    
    .faq-question:hover {
        background: #f8f9fa;
    }
    
    .faq-toggle {
        font-size: 1.5rem;
        color: #00a651;
        transition: transform 0.3s;
        flex-shrink: 0;
        margin-left: 15px;
    }
    
    .faq-item.active .faq-toggle {
        transform: rotate(45deg);
    }
    
    .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }
    
    .faq-item.active .faq-answer {
        max-height: 1000px;
    }
    
    .faq-answer > div {
        padding: 0 25px 25px;
        color: #444;
        line-height: 1.7;
    }
    
    .faq-answer ul {
        padding-left: 20px;
        margin: 10px 0;
    }
    
    .faq-answer li {
        margin-bottom: 8px;
    }
    
    .faq-answer strong {
        color: #1a1a2e;
    }
    
    .faq-answer p {
        margin: 10px 0;
    }
    
    .faq-answer a {
        color: #00a651;
        text-decoration: none;
    }
    
    .faq-answer a:hover {
        text-decoration: underline;
    }
    
    .faq-cta {
        text-align: center;
        margin-top: 40px;
        padding: 30px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .faq-cta p {
        color: #666;
        margin-bottom: 15px;
    }
    
    .faq-cta .btn {
        display: inline-block;
        padding: 12px 25px;
        background: #00a651;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.3s;
    }
    
    .faq-cta .btn:hover {
        background: #008c44;
    }
    
    @media (max-width: 768px) {
        .clinical-faq-section {
            padding: 40px 0;
        }
        
        .faq-question {
            padding: 16px 20px;
            font-size: 0.95rem;
        }
        
        .faq-answer > div {
            padding: 0 20px 20px;
            font-size: 0.9rem;
        }
    }
    </style>
    `;

    // Inizializzazione interattività FAQ
    function initFAQInteraction() {
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', () => {
                const item = button.parentElement;
                const isActive = item.classList.contains('active');
                
                // Chiudi tutti
                document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                    activeItem.classList.remove('active');
                    activeItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });
                
                // Apri quello cliccato (se non era già aperto)
                if (!isActive) {
                    item.classList.add('active');
                    button.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    // Auto-inject FAQ in pagine specialità
    function autoInjectFAQ() {
        const pathname = window.location.pathname;
        const match = pathname.match(/pages\/([^.]+)\.html/);
        
        if (match) {
            const specialty = match[1];
            if (FAQ_DATABASE[specialty]) {
                // Trova punto di inserimento (prima del footer o CTA section)
                const insertPoint = document.querySelector('footer') || 
                                   document.querySelector('.cta-section') ||
                                   document.querySelector('main > section:last-of-type');
                
                if (insertPoint && !document.querySelector('.clinical-faq-section')) {
                    const faqHTML = renderFAQ(specialty);
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = FAQ_STYLES + faqHTML;
                    insertPoint.parentNode.insertBefore(wrapper, insertPoint);
                    
                    initFAQInteraction();
                    console.log(`[ClinicalFAQ] Injected FAQ for ${specialty}`);
                }
            }
        }
    }

    // Esporta API
    return {
        version: '1.0.0',
        database: FAQ_DATABASE,
        render: renderFAQ,
        generateSchema: generateFAQSchema,
        getStyles: () => FAQ_STYLES,
        init: initFAQInteraction,
        autoInject: autoInjectFAQ,
        getSpecialties: () => Object.keys(FAQ_DATABASE)
    };
})();

// Auto-inizializzazione
if (typeof window !== 'undefined') {
    window.ClinicalFAQ = ClinicalFAQ;
    
    document.addEventListener('DOMContentLoaded', () => {
        ClinicalFAQ.autoInject();
    });
}

// Export per Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClinicalFAQ;
}
