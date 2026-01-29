/**
 * BIO-CLINIC Symptom Checker v1.0.0
 * Sistema di triage digitale per guidare i pazienti
 * Basato su sintomi -> suggerimenti clinici
 */

const SymptomChecker = (function() {
    'use strict';

    // Database sintomi con mappatura a specialità, esami e percorsi
    const SYMPTOMS_DATABASE = {
        // === SINTOMI GENERALI ===
        stanchezza: {
            label: "Stanchezza cronica",
            icon: "😴",
            category: "generale",
            urgency: "low",
            suggestions: {
                specialists: ["endocrinologia", "medicina-interna"],
                exams: ["emocromo", "ferritina", "vitamina-d", "tsh", "glicemia"],
                packs: ["check-up-base", "check-up-tiroide-base"],
                pathways: [],
                description: "La stanchezza persistente può avere molte cause: carenze nutrizionali (ferro, vitamina D, B12), problemi tiroidei, anemia, diabete o altre condizioni."
            },
            questions: [
                {
                    text: "La stanchezza è presente da quanto tempo?",
                    options: [
                        { label: "Meno di 2 settimane", value: "acute", modifier: { urgency: "medium" } },
                        { label: "2-4 settimane", value: "subacute" },
                        { label: "Più di 1 mese", value: "chronic", modifier: { addExams: ["cortisolo", "vitamina-b12"] } }
                    ]
                },
                {
                    text: "Hai notato anche perdita o aumento di peso?",
                    options: [
                        { label: "Sì, perdita di peso", value: "weight_loss", modifier: { addSpecialists: ["oncologia"], urgency: "medium" } },
                        { label: "Sì, aumento di peso", value: "weight_gain", modifier: { addPacks: ["check-up-tiroide-plus"] } },
                        { label: "No, peso stabile", value: "stable" }
                    ]
                }
            ]
        },

        mal_di_testa: {
            label: "Mal di testa / Cefalea",
            icon: "🤕",
            category: "neurologico",
            urgency: "low",
            suggestions: {
                specialists: ["neurologia"],
                exams: [],
                packs: [],
                pathways: [],
                description: "La cefalea può essere primaria (emicrania, cefalea tensiva) o secondaria a altre condizioni. Una valutazione neurologica può identificare la causa e impostare la terapia."
            },
            questions: [
                {
                    text: "Com'è il tuo mal di testa?",
                    options: [
                        { label: "Pulsante, spesso da un lato", value: "migraine", modifier: { addDescription: "Potrebbe trattarsi di emicrania." } },
                        { label: "Come una fascia stretta", value: "tension", modifier: { addDescription: "Potrebbe essere una cefalea tensiva." } },
                        { label: "Improvviso e molto forte", value: "severe", modifier: { urgency: "emergency", addDescription: "⚠️ ATTENZIONE: Un mal di testa improvviso e molto intenso richiede valutazione urgente." } }
                    ]
                },
                {
                    text: "Hai altri sintomi associati?",
                    options: [
                        { label: "Nausea/vomito, sensibilità alla luce", value: "aura", modifier: { addExams: ["visita-oculistica"] } },
                        { label: "Febbre e rigidità del collo", value: "meningeal", modifier: { urgency: "emergency", addDescription: "⚠️ URGENTE: Questi sintomi richiedono valutazione immediata." } },
                        { label: "Nessun altro sintomo", value: "isolated" }
                    ]
                }
            ],
            redFlags: ["improvviso e molto forte", "febbre", "rigidità collo", "confusione", "disturbi visivi"]
        },

        dolore_toracico: {
            label: "Dolore al petto",
            icon: "💔",
            category: "cardiologico",
            urgency: "high",
            suggestions: {
                specialists: ["cardiologia"],
                exams: ["ecg", "troponina"],
                packs: ["check-up-cardiologico-plus"],
                pathways: ["checkup-cardiovascolare"],
                description: "Il dolore toracico richiede sempre una valutazione cardiologica per escludere cause cardiache. Può essere dovuto a problemi cardiaci, muscolari, gastrici o ansiosi."
            },
            questions: [
                {
                    text: "Come descriveresti il dolore?",
                    options: [
                        { label: "Oppressivo, come un peso", value: "oppressive", modifier: { urgency: "emergency", addDescription: "⚠️ URGENTE: Dolore oppressivo richiede valutazione immediata." } },
                        { label: "Puntorio, aumenta con il respiro", value: "pleuritic", modifier: { addSpecialists: ["pneumologia"] } },
                        { label: "Bruciore, peggiora dopo i pasti", value: "reflux", modifier: { addSpecialists: ["gastroenterologia"], addExams: [] } }
                    ]
                },
                {
                    text: "Il dolore si irradia?",
                    options: [
                        { label: "Al braccio sinistro/mandibola", value: "radiation", modifier: { urgency: "emergency" } },
                        { label: "Alla schiena", value: "back" },
                        { label: "Non si irradia", value: "localized" }
                    ]
                }
            ],
            redFlags: ["oppressivo", "irradiato al braccio", "sudorazione fredda", "affanno"],
            emergencyNote: "⚠️ Se il dolore è forte, oppressivo e si irradia al braccio sinistro, CHIAMA IL 118 IMMEDIATAMENTE."
        },

        difficolta_respiratoria: {
            label: "Difficoltà a respirare / Affanno",
            icon: "🫁",
            category: "pneumologico",
            urgency: "medium",
            suggestions: {
                specialists: ["pneumologia", "cardiologia"],
                exams: ["spirometria", "rx-torace"],
                packs: [],
                pathways: [],
                description: "La dispnea può avere cause polmonari (asma, BPCO, infezioni) o cardiache (scompenso). Una valutazione specialistica identifica la causa."
            },
            questions: [
                {
                    text: "Quando compare l'affanno?",
                    options: [
                        { label: "A riposo", value: "rest", modifier: { urgency: "high" } },
                        { label: "Sotto sforzo (scale, camminata)", value: "exertion" },
                        { label: "Di notte, svegliandomi", value: "nocturnal", modifier: { addSpecialists: ["cardiologia"], addExams: ["ecocardiogramma"] } }
                    ]
                },
                {
                    text: "Hai altri sintomi?",
                    options: [
                        { label: "Tosse persistente", value: "cough", modifier: { addExams: ["rx-torace"] } },
                        { label: "Gonfiore alle caviglie", value: "edema", modifier: { addSpecialists: ["cardiologia"] } },
                        { label: "Respiro sibilante (fischi)", value: "wheeze", modifier: { addDescription: "Possibile componente asmatica." } }
                    ]
                }
            ],
            redFlags: ["a riposo", "labbra blu", "confusione"],
            emergencyNote: "⚠️ Difficoltà respiratoria grave a riposo richiede valutazione urgente al Pronto Soccorso."
        },

        dolore_addominale: {
            label: "Dolore addominale / Mal di pancia",
            icon: "🤢",
            category: "gastroenterologico",
            urgency: "low",
            suggestions: {
                specialists: ["gastroenterologia"],
                exams: ["ecografia-addome", "esame-feci"],
                packs: [],
                pathways: [],
                description: "Il dolore addominale può derivare da problemi gastrointestinali (gastrite, reflusso, colon irritabile), epatici, renali o ginecologici."
            },
            questions: [
                {
                    text: "Dove si localizza il dolore?",
                    options: [
                        { label: "Parte alta (stomaco)", value: "upper", modifier: { addExams: ["gastroscopia", "test-helicobacter"] } },
                        { label: "Intorno all'ombelico", value: "periumbilical" },
                        { label: "Parte bassa/laterale", value: "lower", modifier: { addSpecialists: ["ginecologia", "urologia"] } }
                    ]
                },
                {
                    text: "Hai notato alterazioni dell'alvo?",
                    options: [
                        { label: "Diarrea frequente", value: "diarrhea", modifier: { addExams: ["calprotectina-fecale", "esame-parassitologico"] } },
                        { label: "Stipsi", value: "constipation" },
                        { label: "Sangue nelle feci", value: "blood", modifier: { urgency: "high", addExams: ["colonscopia"] } }
                    ]
                }
            ],
            redFlags: ["sangue nelle feci", "vomito persistente", "febbre alta", "addome rigido"]
        },

        problemi_pelle: {
            label: "Problemi alla pelle / Nei sospetti",
            icon: "🔬",
            category: "dermatologico",
            urgency: "low",
            suggestions: {
                specialists: ["dermatologia"],
                exams: ["dermatoscopia", "mappatura-nei"],
                packs: [],
                pathways: [],
                description: "La salute della pelle merita attenzione: controllo dei nei, acne, eczemi, psoriasi. La mappatura dei nei è fondamentale per la prevenzione del melanoma."
            },
            questions: [
                {
                    text: "Qual è il problema principale?",
                    options: [
                        { label: "Neo cambiato o sospetto", value: "mole", modifier: { urgency: "medium", addDescription: "Un neo che cambia va controllato tempestivamente." } },
                        { label: "Acne / brufoli", value: "acne" },
                        { label: "Prurito / eczema", value: "itch" },
                        { label: "Macchie cutanee", value: "spots" }
                    ]
                },
                {
                    text: "Hai familiarità per melanoma?",
                    options: [
                        { label: "Sì", value: "yes", modifier: { urgency: "medium", addDescription: "La familiarità richiede controlli più frequenti." } },
                        { label: "No", value: "no" },
                        { label: "Non so", value: "unknown" }
                    ]
                }
            ],
            redFlags: ["neo asimmetrico", "bordi irregolari", "colore variabile", "crescita rapida"]
        },

        problemi_vista: {
            label: "Problemi alla vista",
            icon: "👁️",
            category: "oculistico",
            urgency: "low",
            suggestions: {
                specialists: ["oculistica"],
                exams: ["visita-oculistica", "tonometria", "fondo-oculare"],
                packs: [],
                pathways: [],
                description: "I disturbi visivi vanno sempre valutati: calo della vista, visione offuscata, mosche volanti, lampi di luce."
            },
            questions: [
                {
                    text: "Qual è il sintomo principale?",
                    options: [
                        { label: "Calo graduale della vista", value: "gradual" },
                        { label: "Visione offuscata improvvisa", value: "sudden", modifier: { urgency: "emergency" } },
                        { label: "Mosche volanti / Lampi di luce", value: "floaters", modifier: { urgency: "high", addDescription: "Lampi e mosche volanti improvvise richiedono controllo urgente." } },
                        { label: "Dolore all'occhio", value: "pain", modifier: { urgency: "medium" } }
                    ]
                }
            ],
            redFlags: ["perdita improvvisa della vista", "visione doppia", "lampi di luce improvvisi", "dolore intenso"]
        },

        dolore_articolare: {
            label: "Dolore articolare / Mal di schiena",
            icon: "🦴",
            category: "ortopedico",
            urgency: "low",
            suggestions: {
                specialists: ["ortopedia"],
                exams: ["rx", "ecografia-articolare"],
                packs: [],
                pathways: [],
                description: "Il dolore articolare o vertebrale può essere da artrosi, infiammazione, trauma o sovraccarico. Una valutazione ortopedica identifica la causa."
            },
            questions: [
                {
                    text: "Quale zona è interessata?",
                    options: [
                        { label: "Schiena (lombare/cervicale)", value: "spine" },
                        { label: "Ginocchio", value: "knee" },
                        { label: "Spalla", value: "shoulder" },
                        { label: "Anca", value: "hip" },
                        { label: "Altre articolazioni", value: "other" }
                    ]
                },
                {
                    text: "Da cosa è scatenato il dolore?",
                    options: [
                        { label: "Trauma recente", value: "trauma", modifier: { urgency: "medium", addExams: ["rx"] } },
                        { label: "Sforzi / attività fisica", value: "strain" },
                        { label: "Senza causa apparente", value: "spontaneous", modifier: { addSpecialists: ["reumatologia"] } }
                    ]
                }
            ]
        },

        problemi_urinari: {
            label: "Problemi urinari",
            icon: "🚽",
            category: "urologico",
            urgency: "low",
            suggestions: {
                specialists: ["urologia"],
                exams: ["esame-urine", "ecografia-renale", "psa"],
                packs: [],
                pathways: [],
                description: "Disturbi urinari come bruciore, frequenza aumentata, difficoltà a urinare o sangue nelle urine richiedono valutazione urologica."
            },
            questions: [
                {
                    text: "Qual è il sintomo principale?",
                    options: [
                        { label: "Bruciore durante la minzione", value: "dysuria", modifier: { addExams: ["urinocoltura"] } },
                        { label: "Difficoltà a urinare (uomo)", value: "obstruction", modifier: { addExams: ["uroflussometria"] } },
                        { label: "Sangue nelle urine", value: "hematuria", modifier: { urgency: "medium", addExams: ["ecografia-vescica", "citologia-urinaria"] } },
                        { label: "Frequenza aumentata", value: "frequency" }
                    ]
                }
            ],
            redFlags: ["sangue nelle urine", "febbre alta", "dolore lombare intenso"]
        },

        irregolarita_mestruali: {
            label: "Irregolarità mestruali / Problemi ginecologici",
            icon: "👩",
            category: "ginecologico",
            urgency: "low",
            suggestions: {
                specialists: ["ginecologia"],
                exams: ["ecografia-transvaginale", "pap-test"],
                packs: ["check-up-donna-under-40", "check-up-donna-over-40"],
                pathways: [],
                description: "Irregolarità del ciclo, dolori mestruali intensi, perdite anomale richiedono una valutazione ginecologica per escludere cause organiche o ormonali."
            },
            questions: [
                {
                    text: "Qual è il problema principale?",
                    options: [
                        { label: "Ciclo irregolare o assente", value: "irregular", modifier: { addExams: ["ormoni-femminili", "tsh"] } },
                        { label: "Mestruazioni molto dolorose", value: "dysmenorrhea" },
                        { label: "Sanguinamenti anomali", value: "bleeding", modifier: { urgency: "medium" } },
                        { label: "Perdite vaginali", value: "discharge", modifier: { addExams: ["tampone-vaginale"] } }
                    ]
                },
                {
                    text: "Stai cercando una gravidanza?",
                    options: [
                        { label: "Sì, da più di 12 mesi", value: "infertility", modifier: { addPathways: ["pma-fertilita"] } },
                        { label: "Sì, da poco", value: "trying" },
                        { label: "No", value: "no" }
                    ]
                }
            ]
        },

        sovrappeso: {
            label: "Sovrappeso / Difficoltà a dimagrire",
            icon: "⚖️",
            category: "metabolico",
            urgency: "low",
            suggestions: {
                specialists: ["endocrinologia"],
                exams: ["glicemia", "emoglobina-glicata", "colesterolo", "trigliceridi", "tsh"],
                packs: ["check-up-base"],
                pathways: ["slim-care", "slim-care-donna"],
                description: "Il sovrappeso può avere cause metaboliche, ormonali o comportamentali. Un approccio integrato con specialisti e percorsi dedicati può aiutarti a raggiungere i tuoi obiettivi."
            },
            questions: [
                {
                    text: "Hai già provato diete senza successo?",
                    options: [
                        { label: "Sì, molte volte", value: "failed_diets", modifier: { addDescription: "I nuovi farmaci GLP-1 (Wegovy, Mounjaro) possono essere un'opzione efficace." } },
                        { label: "Qualche tentativo", value: "some" },
                        { label: "No, è la prima volta che cerco aiuto", value: "first_time" }
                    ]
                },
                {
                    text: "Hai patologie associate?",
                    options: [
                        { label: "Diabete / Pre-diabete", value: "diabetes", modifier: { addPacks: [] } },
                        { label: "Ipertensione", value: "hypertension", modifier: { addSpecialists: ["cardiologia"] } },
                        { label: "Problemi tiroidei", value: "thyroid", modifier: { addPacks: ["check-up-tiroide-plus"] } },
                        { label: "Nessuna nota", value: "none" }
                    ]
                }
            ]
        },

        ansia_stress: {
            label: "Ansia / Stress / Disturbi del sonno",
            icon: "😰",
            category: "psicologico",
            urgency: "low",
            suggestions: {
                specialists: ["neurologia", "medicina-interna"],
                exams: ["tsh", "cortisolo", "magnesio"],
                packs: [],
                pathways: [],
                description: "Ansia, stress e disturbi del sonno possono avere cause organiche (tiroide, carenze) o richiedere supporto psicologico. Un check-up esclude cause fisiche."
            }
        },

        perdita_capelli: {
            label: "Perdita di capelli",
            icon: "💇",
            category: "dermatologico",
            urgency: "low",
            suggestions: {
                specialists: ["dermatologia", "endocrinologia"],
                exams: ["ferritina", "tsh", "vitamina-d", "zinco"],
                packs: ["check-up-tiroide-base"],
                pathways: [],
                description: "La caduta dei capelli può dipendere da stress, carenze nutrizionali (ferro, zinco), problemi tiroidei o cause dermatologiche. Una tricoscopia identifica la causa."
            }
        }
    };

    // Configurazione
    const CONFIG = {
        urgencyLevels: {
            low: { label: "Non urgente", color: "#4caf50", icon: "✅", message: "Puoi prenotare una visita nei prossimi giorni." },
            medium: { label: "Consigliato entro 1 settimana", color: "#ff9800", icon: "⚠️", message: "È consigliabile una valutazione tempestiva." },
            high: { label: "Urgente - Entro 24-48h", color: "#f44336", icon: "🔴", message: "Richiedi una valutazione prioritaria." },
            emergency: { label: "EMERGENZA", color: "#d32f2f", icon: "🚨", message: "Contatta immediatamente il 118 o recati al Pronto Soccorso." }
        },
        emergencyPhone: "118",
        clinicPhone: "+39 079 956 1332"
    };

    // Stato
    let state = {
        currentSymptom: null,
        answers: [],
        currentQuestionIndex: 0,
        finalSuggestions: null
    };

    // Funzione per avviare il checker
    function start(symptomKey) {
        const symptom = SYMPTOMS_DATABASE[symptomKey];
        if (!symptom) {
            console.error(`Symptom ${symptomKey} not found`);
            return null;
        }

        state = {
            currentSymptom: symptom,
            symptomKey: symptomKey,
            answers: [],
            currentQuestionIndex: 0,
            finalSuggestions: JSON.parse(JSON.stringify(symptom.suggestions))
        };

        return {
            symptom: symptom,
            hasQuestions: symptom.questions && symptom.questions.length > 0,
            firstQuestion: symptom.questions ? symptom.questions[0] : null
        };
    }

    // Funzione per rispondere a una domanda
    function answer(optionValue) {
        const symptom = state.currentSymptom;
        const question = symptom.questions[state.currentQuestionIndex];
        const selectedOption = question.options.find(o => o.value === optionValue);

        if (!selectedOption) return null;

        state.answers.push({
            question: question.text,
            answer: selectedOption.label,
            value: optionValue
        });

        // Applica modificatori
        if (selectedOption.modifier) {
            applyModifier(selectedOption.modifier);
        }

        state.currentQuestionIndex++;

        // Verifica se ci sono altre domande
        if (state.currentQuestionIndex < symptom.questions.length) {
            return {
                hasMore: true,
                nextQuestion: symptom.questions[state.currentQuestionIndex]
            };
        } else {
            return {
                hasMore: false,
                results: getResults()
            };
        }
    }

    // Applica modificatori dalla risposta
    function applyModifier(modifier) {
        if (modifier.urgency) {
            state.currentUrgency = modifier.urgency;
        }
        if (modifier.addSpecialists) {
            state.finalSuggestions.specialists = [
                ...new Set([...state.finalSuggestions.specialists, ...modifier.addSpecialists])
            ];
        }
        if (modifier.addExams) {
            state.finalSuggestions.exams = [
                ...new Set([...state.finalSuggestions.exams, ...modifier.addExams])
            ];
        }
        if (modifier.addPacks) {
            state.finalSuggestions.packs = [
                ...new Set([...state.finalSuggestions.packs, ...modifier.addPacks])
            ];
        }
        if (modifier.addPathways) {
            state.finalSuggestions.pathways = [
                ...new Set([...state.finalSuggestions.pathways, ...modifier.addPathways])
            ];
        }
        if (modifier.addDescription) {
            state.additionalDescription = (state.additionalDescription || '') + ' ' + modifier.addDescription;
        }
    }

    // Ottieni risultati finali
    function getResults() {
        const symptom = state.currentSymptom;
        const urgency = state.currentUrgency || symptom.urgency;
        const urgencyConfig = CONFIG.urgencyLevels[urgency];

        return {
            symptom: {
                key: state.symptomKey,
                label: symptom.label,
                icon: symptom.icon
            },
            urgency: {
                level: urgency,
                ...urgencyConfig
            },
            suggestions: state.finalSuggestions,
            description: symptom.suggestions.description + (state.additionalDescription || ''),
            answers: state.answers,
            emergencyNote: symptom.emergencyNote,
            redFlags: symptom.redFlags,
            isEmergency: urgency === 'emergency'
        };
    }

    // Skip domande e vai ai risultati
    function skipToResults() {
        return getResults();
    }

    // Ottieni tutti i sintomi
    function getAllSymptoms() {
        return Object.entries(SYMPTOMS_DATABASE).map(([key, symptom]) => ({
            key,
            label: symptom.label,
            icon: symptom.icon,
            category: symptom.category
        }));
    }

    // Raggruppa sintomi per categoria
    function getSymptomsByCategory() {
        const categories = {
            generale: { label: "Sintomi Generali", icon: "🩺", symptoms: [] },
            cardiologico: { label: "Cuore e Circolazione", icon: "❤️", symptoms: [] },
            neurologico: { label: "Sistema Nervoso", icon: "🧠", symptoms: [] },
            pneumologico: { label: "Respiratorio", icon: "🫁", symptoms: [] },
            gastroenterologico: { label: "Apparato Digerente", icon: "🍽️", symptoms: [] },
            dermatologico: { label: "Pelle", icon: "🔬", symptoms: [] },
            oculistico: { label: "Vista", icon: "👁️", symptoms: [] },
            ortopedico: { label: "Ossa e Articolazioni", icon: "🦴", symptoms: [] },
            urologico: { label: "Apparato Urinario", icon: "🚽", symptoms: [] },
            ginecologico: { label: "Ginecologia", icon: "👩", symptoms: [] },
            metabolico: { label: "Metabolismo", icon: "⚖️", symptoms: [] },
            psicologico: { label: "Mente e Benessere", icon: "😰", symptoms: [] }
        };

        Object.entries(SYMPTOMS_DATABASE).forEach(([key, symptom]) => {
            if (categories[symptom.category]) {
                categories[symptom.category].symptoms.push({
                    key,
                    label: symptom.label,
                    icon: symptom.icon
                });
            }
        });

        return categories;
    }

    // Genera HTML per il widget
    function renderWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = getSymptomsByCategory();

        let html = `
        <div class="symptom-checker-widget">
            <div class="sc-header">
                <span class="sc-icon">🏥</span>
                <h2>Di cosa hai bisogno oggi?</h2>
                <p>Seleziona il sintomo principale per ricevere suggerimenti personalizzati</p>
            </div>
            
            <div class="sc-categories">
        `;

        Object.entries(categories).forEach(([catKey, category]) => {
            if (category.symptoms.length === 0) return;

            html += `
                <div class="sc-category">
                    <h3><span>${category.icon}</span> ${category.label}</h3>
                    <div class="sc-symptoms-grid">
            `;

            category.symptoms.forEach(symptom => {
                html += `
                        <button class="sc-symptom-btn" data-symptom="${symptom.key}">
                            <span class="sc-symptom-icon">${symptom.icon}</span>
                            <span class="sc-symptom-label">${symptom.label}</span>
                        </button>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            
            <div class="sc-disclaimer">
                <p>⚠️ <strong>Importante:</strong> Questo strumento fornisce suggerimenti generali e non sostituisce la diagnosi medica. 
                In caso di emergenza, chiama il <strong>118</strong>.</p>
            </div>
        </div>
        
        <!-- Modal per domande e risultati -->
        <div class="sc-modal" id="sc-modal">
            <div class="sc-modal-content">
                <button class="sc-modal-close">&times;</button>
                <div class="sc-modal-body"></div>
            </div>
        </div>
        `;

        container.innerHTML = html;

        // Bind eventi
        container.querySelectorAll('.sc-symptom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const symptomKey = btn.dataset.symptom;
                openSymptomFlow(symptomKey);
            });
        });

        container.querySelector('.sc-modal-close').addEventListener('click', closeModal);
        container.querySelector('.sc-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('sc-modal')) closeModal();
        });
    }

    // Apri flusso sintomo
    function openSymptomFlow(symptomKey) {
        const result = start(symptomKey);
        if (!result) return;

        const modal = document.getElementById('sc-modal');
        const modalBody = modal.querySelector('.sc-modal-body');

        if (result.hasQuestions) {
            renderQuestion(modalBody, result.symptom, result.firstQuestion);
        } else {
            const results = skipToResults();
            renderResults(modalBody, results);
        }

        modal.classList.add('active');
    }

    // Render domanda
    function renderQuestion(container, symptom, question) {
        let html = `
            <div class="sc-question-view">
                <div class="sc-symptom-header">
                    <span class="sc-big-icon">${symptom.icon}</span>
                    <h3>${symptom.label}</h3>
                </div>
                
                <div class="sc-question">
                    <p class="sc-question-text">${question.text}</p>
                    <div class="sc-options">
        `;

        question.options.forEach(option => {
            html += `
                        <button class="sc-option-btn" data-value="${option.value}">
                            ${option.label}
                        </button>
            `;
        });

        html += `
                    </div>
                </div>
                
                <div class="sc-skip">
                    <button class="sc-skip-btn">Salta le domande →</button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Bind eventi
        container.querySelectorAll('.sc-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const result = answer(btn.dataset.value);
                if (result.hasMore) {
                    renderQuestion(container, state.currentSymptom, result.nextQuestion);
                } else {
                    renderResults(container, result.results);
                }
            });
        });

        container.querySelector('.sc-skip-btn').addEventListener('click', () => {
            const results = skipToResults();
            renderResults(container, results);
        });
    }

    // Render risultati
    function renderResults(container, results) {
        let html = `
            <div class="sc-results-view">
        `;

        // Banner emergenza se necessario
        if (results.isEmergency) {
            html += `
                <div class="sc-emergency-banner">
                    <span class="sc-emergency-icon">🚨</span>
                    <div>
                        <strong>ATTENZIONE</strong>
                        <p>I sintomi che hai descritto richiedono una valutazione medica immediata.</p>
                        <a href="tel:118" class="sc-emergency-call">📞 CHIAMA IL 118</a>
                    </div>
                </div>
            `;
        }

        // Header con urgenza
        html += `
                <div class="sc-results-header" style="border-left: 4px solid ${results.urgency.color}">
                    <span class="sc-urgency-icon">${results.urgency.icon}</span>
                    <div>
                        <span class="sc-urgency-label" style="color: ${results.urgency.color}">${results.urgency.label}</span>
                        <p>${results.urgency.message}</p>
                    </div>
                </div>
                
                <div class="sc-symptom-summary">
                    <h3>${results.symptom.icon} ${results.symptom.label}</h3>
                    <p>${results.description}</p>
                </div>
        `;

        // Suggerimenti
        html += `<div class="sc-suggestions">`;

        // Percorsi consigliati (priorità alta)
        if (results.suggestions.pathways && results.suggestions.pathways.length > 0) {
            html += `
                <div class="sc-suggestion-section sc-pathways">
                    <h4>🎯 Percorso Consigliato</h4>
                    <div class="sc-suggestion-list">
            `;
            results.suggestions.pathways.forEach(pathway => {
                const pathwayUrl = `/pages/${pathway}.html`;
                const pathwayLabel = formatLabel(pathway);
                html += `
                        <a href="${pathwayUrl}" class="sc-suggestion-item sc-pathway-item">
                            <span class="sc-item-icon">✨</span>
                            <span class="sc-item-name">${pathwayLabel}</span>
                            <span class="sc-item-arrow">→</span>
                        </a>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        }

        // Specialisti
        if (results.suggestions.specialists && results.suggestions.specialists.length > 0) {
            html += `
                <div class="sc-suggestion-section sc-specialists">
                    <h4>👨‍⚕️ Specialisti da Consultare</h4>
                    <div class="sc-suggestion-list">
            `;
            results.suggestions.specialists.forEach(specialist => {
                const specUrl = `/pages/${specialist}.html`;
                const specLabel = formatLabel(specialist);
                html += `
                        <a href="${specUrl}" class="sc-suggestion-item sc-specialist-item">
                            <span class="sc-item-icon">🩺</span>
                            <span class="sc-item-name">Visita ${specLabel}</span>
                            <span class="sc-item-arrow">→</span>
                        </a>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        }

        // Pacchetti esami
        if (results.suggestions.packs && results.suggestions.packs.length > 0) {
            html += `
                <div class="sc-suggestion-section sc-packs">
                    <h4>📦 Check-Up Consigliati</h4>
                    <div class="sc-suggestion-list">
            `;
            results.suggestions.packs.forEach(pack => {
                const packUrl = `/laboratorio/index.html#pack-${pack}`;
                const packLabel = formatLabel(pack);
                html += `
                        <a href="${packUrl}" class="sc-suggestion-item sc-pack-item">
                            <span class="sc-item-icon">🧪</span>
                            <span class="sc-item-name">${packLabel}</span>
                            <span class="sc-item-arrow">→</span>
                        </a>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        }

        // Esami singoli
        if (results.suggestions.exams && results.suggestions.exams.length > 0) {
            html += `
                <div class="sc-suggestion-section sc-exams">
                    <h4>🧬 Esami Utili</h4>
                    <div class="sc-suggestion-list sc-exam-tags">
            `;
            results.suggestions.exams.forEach(exam => {
                const examLabel = formatLabel(exam);
                html += `
                        <span class="sc-exam-tag">${examLabel}</span>
                `;
            });
            html += `
                    </div>
                    <a href="/laboratorio/index.html" class="sc-view-all">Vedi tutti gli esami →</a>
                </div>
            `;
        }

        html += `</div>`; // fine suggestions

        // CTA finale
        html += `
                <div class="sc-cta-section">
                    <p>Hai bisogno di aiuto per scegliere?</p>
                    <div class="sc-cta-buttons">
                        <a href="tel:${CONFIG.clinicPhone}" class="sc-cta-btn sc-cta-primary">
                            📞 Chiama 079 956 1332
                        </a>
                        <a href="/pages/contatti.html" class="sc-cta-btn sc-cta-secondary">
                            ✉️ Contattaci
                        </a>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Chiudi modal
    function closeModal() {
        const modal = document.getElementById('sc-modal');
        if (modal) modal.classList.remove('active');
    }

    // Formatta label
    function formatLabel(key) {
        return key
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // CSS
    const STYLES = `
    <style>
    /* Symptom Checker Widget Styles */
    .symptom-checker-widget {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .sc-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .sc-header .sc-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 15px;
    }
    
    .sc-header h2 {
        font-size: 2rem;
        color: #1a1a2e;
        margin-bottom: 10px;
    }
    
    .sc-header p {
        color: #666;
        font-size: 1.1rem;
    }
    
    .sc-categories {
        display: grid;
        gap: 30px;
    }
    
    .sc-category h3 {
        font-size: 1.1rem;
        color: #1a1a2e;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .sc-symptoms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }
    
    .sc-symptom-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .sc-symptom-btn:hover {
        border-color: #00a651;
        background: #f8fff9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,166,81,0.1);
    }
    
    .sc-symptom-icon {
        font-size: 1.5rem;
    }
    
    .sc-symptom-label {
        font-size: 0.95rem;
        color: #333;
    }
    
    .sc-disclaimer {
        margin-top: 40px;
        padding: 20px;
        background: #fff3cd;
        border-radius: 10px;
        font-size: 0.9rem;
        color: #664d03;
    }
    
    /* Modal */
    .sc-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .sc-modal.active {
        display: flex;
    }
    
    .sc-modal-content {
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    
    .sc-modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: #f0f0f0;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 1;
    }
    
    .sc-modal-body {
        padding: 30px;
    }
    
    /* Question View */
    .sc-symptom-header {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .sc-big-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: 10px;
    }
    
    .sc-symptom-header h3 {
        font-size: 1.5rem;
        color: #1a1a2e;
    }
    
    .sc-question-text {
        font-size: 1.1rem;
        color: #333;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .sc-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .sc-option-btn {
        padding: 16px 20px;
        background: #f8f9fa;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .sc-option-btn:hover {
        border-color: #00a651;
        background: #f8fff9;
    }
    
    .sc-skip {
        margin-top: 30px;
        text-align: center;
    }
    
    .sc-skip-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .sc-skip-btn:hover {
        color: #00a651;
    }
    
    /* Results View */
    .sc-emergency-banner {
        background: #ffebee;
        border: 2px solid #f44336;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        display: flex;
        gap: 15px;
        align-items: flex-start;
    }
    
    .sc-emergency-icon {
        font-size: 2rem;
    }
    
    .sc-emergency-banner strong {
        color: #c62828;
        font-size: 1.1rem;
    }
    
    .sc-emergency-call {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        background: #f44336;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
    }
    
    .sc-results-header {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 20px;
        background: #f8f9fa;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    
    .sc-urgency-icon {
        font-size: 2rem;
    }
    
    .sc-urgency-label {
        font-weight: 700;
        font-size: 1rem;
    }
    
    .sc-symptom-summary {
        margin-bottom: 25px;
    }
    
    .sc-symptom-summary h3 {
        font-size: 1.2rem;
        margin-bottom: 10px;
    }
    
    .sc-symptom-summary p {
        color: #555;
        line-height: 1.6;
    }
    
    .sc-suggestion-section {
        margin-bottom: 20px;
    }
    
    .sc-suggestion-section h4 {
        font-size: 1rem;
        color: #1a1a2e;
        margin-bottom: 12px;
    }
    
    .sc-suggestion-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .sc-suggestion-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: #f8f9fa;
        border-radius: 10px;
        text-decoration: none;
        color: #333;
        transition: all 0.2s;
    }
    
    .sc-suggestion-item:hover {
        background: #e8f5e9;
        transform: translateX(5px);
    }
    
    .sc-pathway-item {
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border: 1px solid #a5d6a7;
    }
    
    .sc-item-icon {
        font-size: 1.2rem;
    }
    
    .sc-item-name {
        flex: 1;
        font-weight: 500;
    }
    
    .sc-item-arrow {
        color: #00a651;
    }
    
    .sc-exam-tags {
        flex-direction: row;
        flex-wrap: wrap;
    }
    
    .sc-exam-tag {
        display: inline-block;
        padding: 8px 14px;
        background: #e3f2fd;
        color: #1565c0;
        border-radius: 20px;
        font-size: 0.85rem;
    }
    
    .sc-view-all {
        display: block;
        margin-top: 10px;
        color: #00a651;
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    .sc-cta-section {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
    }
    
    .sc-cta-section p {
        color: #666;
        margin-bottom: 15px;
    }
    
    .sc-cta-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .sc-cta-btn {
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .sc-cta-primary {
        background: #00a651;
        color: white;
    }
    
    .sc-cta-primary:hover {
        background: #008c44;
    }
    
    .sc-cta-secondary {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #e0e0e0;
    }
    
    .sc-cta-secondary:hover {
        background: #e8e8e8;
    }
    
    @media (max-width: 768px) {
        .sc-symptoms-grid {
            grid-template-columns: 1fr;
        }
        
        .sc-modal-body {
            padding: 20px;
        }
    }
    </style>
    `;

    // Injecta stili
    function injectStyles() {
        if (!document.getElementById('symptom-checker-styles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'symptom-checker-styles';
            styleEl.innerHTML = STYLES;
            document.head.appendChild(styleEl.querySelector('style'));
        }
    }

    // Init
    function init(containerId) {
        injectStyles();
        renderWidget(containerId);
    }

    // Export API
    return {
        version: '1.0.0',
        init,
        start,
        answer,
        skipToResults,
        getAllSymptoms,
        getSymptomsByCategory,
        renderWidget,
        database: SYMPTOMS_DATABASE,
        config: CONFIG
    };
})();

// Global export
if (typeof window !== 'undefined') {
    window.SymptomChecker = SymptomChecker;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SymptomChecker;
}
