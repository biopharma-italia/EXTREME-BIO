/**
 * BIO-CLINIC Smart Comparator v1.0.0
 * Confronto intelligente tra Esami, Pacchetti e Percorsi Clinici
 * Aiuta il paziente a scegliere la soluzione migliore
 */

const SmartComparator = (function() {
    'use strict';

    // Database comparazioni per scenario clinico
    const COMPARISON_DATABASE = {
        // === TIROIDE ===
        tiroide: {
            title: "Controllo Tiroide: Cosa Scegliere?",
            icon: "🦋",
            description: "Confronta le opzioni per valutare la funzionalità tiroidea",
            scenarios: [
                {
                    id: "screening",
                    label: "Screening iniziale / Controllo di routine",
                    recommendation: "pack"
                },
                {
                    id: "symptoms",
                    label: "Ho sintomi (stanchezza, peso, capelli)",
                    recommendation: "pack_plus"
                },
                {
                    id: "monitoring",
                    label: "Già in terapia, devo monitorare",
                    recommendation: "exam"
                },
                {
                    id: "diagnosis",
                    label: "Sospetta patologia autoimmune",
                    recommendation: "specialist"
                }
            ],
            options: [
                {
                    type: "exam",
                    id: "tsh-singolo",
                    name: "Solo TSH",
                    price: 8.50,
                    priceLabel: "€8,50",
                    pros: [
                        "Costo minimo",
                        "Screening base della funzione tiroidea",
                        "Risultati in 24h"
                    ],
                    cons: [
                        "Non valuta FT3/FT4 liberi",
                        "Può non rilevare patologie subcliniche",
                        "Non include anticorpi"
                    ],
                    bestFor: "Monitoraggio terapia con Eutirox se valori stabili",
                    url: "/laboratorio/index.html#esame-tsh",
                    bookingType: "direct"
                },
                {
                    type: "pack",
                    id: "check-up-tiroide-base",
                    name: "Check-Up Tiroide Base",
                    price: 29,
                    priceLabel: "€29",
                    includes: ["TSH", "FT4"],
                    pros: [
                        "Valutazione completa funzione",
                        "Ottimo rapporto qualità/prezzo",
                        "Rileva ipo/ipertiroidismo"
                    ],
                    cons: [
                        "Non include FT3",
                        "Non include anticorpi tiroidei"
                    ],
                    bestFor: "Screening iniziale, controlli periodici",
                    recommended: false,
                    url: "/laboratorio/index.html#pack-check-up-tiroide-base",
                    bookingType: "direct"
                },
                {
                    type: "pack",
                    id: "check-up-tiroide-plus",
                    name: "Check-Up Tiroide Plus",
                    price: 59,
                    priceLabel: "€59",
                    includes: ["TSH", "FT3", "FT4", "Anti-TPO", "Anti-TG"],
                    pros: [
                        "Valutazione completa con anticorpi",
                        "Rileva tiroiditi autoimmuni",
                        "Diagnosi accurata"
                    ],
                    cons: [
                        "Costo maggiore",
                        "Non sempre necessario se già diagnosticati"
                    ],
                    bestFor: "Prima diagnosi, sospetta tiroidite, gravidanza, familiarità",
                    recommended: true,
                    url: "/laboratorio/index.html#pack-check-up-tiroide-plus",
                    bookingType: "direct"
                },
                {
                    type: "specialist",
                    id: "visita-endocrinologia",
                    name: "Visita Endocrinologica",
                    price: 100,
                    priceLabel: "da €100",
                    pros: [
                        "Valutazione clinica completa",
                        "Interpretazione degli esami",
                        "Piano terapeutico personalizzato",
                        "Ecografia tiroidea se necessaria"
                    ],
                    cons: [
                        "Richiede appuntamento",
                        "Costo più elevato"
                    ],
                    bestFor: "Valori alterati, noduli, necessità di terapia",
                    url: "/pages/endocrinologia.html",
                    bookingType: "miodottore"
                }
            ],
            relatedExams: ["ecografia-tiroidea", "calcitonina", "tireoglobulina"],
            faqs: [
                {
                    q: "Devo fare sempre tutti gli esami tiroidei?",
                    a: "No. Per un semplice screening o monitoraggio di terapia stabile, TSH + FT4 sono sufficienti. Gli anticorpi sono utili per la prima diagnosi o sospetta tiroidite."
                },
                {
                    q: "Ogni quanto controllare la tiroide?",
                    a: "In soggetti sani senza familiarità: ogni 3-5 anni dopo i 35 anni. In terapia: ogni 6-12 mesi o secondo indicazione medica."
                }
            ]
        },

        // === CARDIOLOGIA ===
        cuore: {
            title: "Controllo Cardiologico: Cosa Scegliere?",
            icon: "❤️",
            description: "Confronta le opzioni per la salute del tuo cuore",
            scenarios: [
                {
                    id: "prevention",
                    label: "Prevenzione / Ho più di 40 anni",
                    recommendation: "pack"
                },
                {
                    id: "symptoms",
                    label: "Ho sintomi (affanno, palpitazioni, dolore)",
                    recommendation: "specialist"
                },
                {
                    id: "sport",
                    label: "Devo fare sport / Certificato medico",
                    recommendation: "specialist"
                },
                {
                    id: "risk",
                    label: "Ho fattori di rischio (diabete, ipertensione, familiarità)",
                    recommendation: "pack"
                }
            ],
            options: [
                {
                    type: "exam",
                    id: "ecg",
                    name: "Solo ECG",
                    price: 35,
                    priceLabel: "€35",
                    pros: [
                        "Esame base della funzione cardiaca",
                        "Rapido (10 minuti)",
                        "Rileva aritmie, ischemie"
                    ],
                    cons: [
                        "Foto istantanea (non vede aritmie sporadiche)",
                        "Non valuta struttura del cuore",
                        "Senza interpretazione specialistica"
                    ],
                    bestFor: "Screening base, pre-interventi, controllo rapido",
                    url: "/pages/cardiologia.html",
                    bookingType: "miodottore"
                },
                {
                    type: "pack",
                    id: "check-up-cardiologico",
                    name: "Check-Up Cardiologico",
                    price: 150,
                    priceLabel: "€150",
                    includes: ["Visita cardiologica", "ECG", "Misurazione pressione"],
                    pros: [
                        "Valutazione clinica completa",
                        "ECG con interpretazione",
                        "Calcolo rischio cardiovascolare"
                    ],
                    cons: [
                        "Non include ecocardiogramma",
                        "Non include esami del sangue"
                    ],
                    bestFor: "Screening periodico, soggetti a basso rischio",
                    recommended: false,
                    url: "/pages/checkup-cardiovascolare.html",
                    bookingType: "miodottore"
                },
                {
                    type: "pack",
                    id: "check-up-cardiologico-plus",
                    name: "Check-Up Cardiologico Plus",
                    price: 250,
                    priceLabel: "€250",
                    includes: ["Visita cardiologica", "ECG", "Ecocardiogramma", "Esami sangue (colesterolo, glicemia)"],
                    pros: [
                        "Valutazione strutturale del cuore",
                        "Include esami metabolici",
                        "Diagnosi completa"
                    ],
                    cons: [
                        "Costo maggiore",
                        "Tempo più lungo"
                    ],
                    bestFor: "Prevenzione completa, fattori di rischio, familiarità",
                    recommended: true,
                    url: "/pages/checkup-cardiovascolare.html",
                    bookingType: "miodottore"
                },
                {
                    type: "exam",
                    id: "holter",
                    name: "Holter ECG 24h",
                    price: 80,
                    priceLabel: "€80",
                    pros: [
                        "Monitoraggio continuo 24 ore",
                        "Rileva aritmie sporadiche",
                        "Correlazione sintomi-tracciato"
                    ],
                    cons: [
                        "Richiede di portare il dispositivo",
                        "Non valuta struttura del cuore"
                    ],
                    bestFor: "Palpitazioni, svenimenti, aritmie intermittenti",
                    url: "/pages/cardiologia.html",
                    bookingType: "miodottore"
                }
            ],
            relatedExams: ["holter-pressorio", "test-da-sforzo", "ecocolordoppler-tsa"],
            faqs: [
                {
                    q: "ECG o Ecocardiogramma: quale fare?",
                    a: "L'ECG valuta l'attività elettrica (aritmie, ischemie). L'ecocardiogramma valuta la struttura (valvole, dimensioni, funzione contrattile). Sono complementari, non alternativi."
                },
                {
                    q: "Ogni quanto fare il check-up cardiologico?",
                    a: "Senza fattori di rischio: ogni 3-5 anni dopo i 40 anni. Con fattori di rischio: annualmente o secondo indicazione del cardiologo."
                }
            ]
        },

        // === DONNA ===
        donna: {
            title: "Salute della Donna: Cosa Scegliere?",
            icon: "👩",
            description: "Confronta le opzioni per la prevenzione femminile",
            scenarios: [
                {
                    id: "routine",
                    label: "Controllo ginecologico di routine",
                    recommendation: "specialist"
                },
                {
                    id: "prevention",
                    label: "Prevenzione completa (under 40)",
                    recommendation: "pack_under"
                },
                {
                    id: "over40",
                    label: "Prevenzione over 40 / Menopausa",
                    recommendation: "pack_over"
                },
                {
                    id: "fertility",
                    label: "Cerco una gravidanza / Infertilità",
                    recommendation: "pathway"
                }
            ],
            options: [
                {
                    type: "specialist",
                    id: "visita-ginecologica",
                    name: "Visita Ginecologica",
                    price: 100,
                    priceLabel: "da €100",
                    includes: ["Visita", "Ecografia transvaginale"],
                    pros: [
                        "Valutazione clinica completa",
                        "Ecografia utero/ovaie",
                        "Pap-test se necessario"
                    ],
                    cons: [
                        "Non include esami del sangue",
                        "Non include screening metabolico"
                    ],
                    bestFor: "Controllo annuale, sintomi ginecologici",
                    url: "/pages/ginecologia.html",
                    bookingType: "miodottore"
                },
                {
                    type: "pack",
                    id: "check-up-donna-under-40",
                    name: "Check-Up Donna Under 40",
                    price: 89,
                    priceLabel: "€89",
                    includes: ["Emocromo", "Sideremia", "Ferritina", "TSH", "Glicemia", "Vitamina D"],
                    pros: [
                        "Screening anemia e tiroide",
                        "Controllo metabolico base",
                        "Vitamina D inclusa"
                    ],
                    cons: [
                        "Non include visita ginecologica",
                        "Non include ormoni femminili"
                    ],
                    bestFor: "Screening ematico per donne giovani",
                    recommended: false,
                    url: "/laboratorio/index.html#pack-check-up-donna-under-40",
                    bookingType: "direct"
                },
                {
                    type: "pack",
                    id: "check-up-donna-over-40",
                    name: "Check-Up Donna Over 40",
                    price: 129,
                    priceLabel: "€129",
                    includes: ["Emocromo", "Profilo lipidico", "Glicemia", "TSH", "Vitamina D", "Calcio", "Vitamina B12"],
                    pros: [
                        "Screening cardiovascolare",
                        "Controllo tiroide e ossa",
                        "Prevenzione menopausa"
                    ],
                    cons: [
                        "Non include visita ginecologica",
                        "Non include ormoni"
                    ],
                    bestFor: "Prevenzione completa per over 40, pre-menopausa",
                    recommended: true,
                    url: "/laboratorio/index.html#pack-check-up-donna-over-40",
                    bookingType: "direct"
                },
                {
                    type: "pathway",
                    id: "pma-fertilita",
                    name: "Percorso PMA / Fertilità",
                    price: null,
                    priceLabel: "Personalizzato",
                    includes: ["Consulenza specialistica", "Esami ormonali", "Ecografie", "Supporto dedicato"],
                    pros: [
                        "Percorso completo e guidato",
                        "Équipe dedicata",
                        "Supporto psicologico",
                        "Tecniche avanzate (IUI, FIVET, ICSI)"
                    ],
                    cons: [
                        "Percorso lungo",
                        "Costi variabili"
                    ],
                    bestFor: "Difficoltà a concepire da >12 mesi, infertilità",
                    featured: true,
                    url: "/pages/pma-fertilita.html",
                    bookingType: "whatsapp"
                }
            ],
            relatedExams: ["pap-test", "hpv-test", "ormoni-femminili", "moc-dexa"],
            faqs: [
                {
                    q: "Pap-test o HPV test?",
                    a: "Il Pap-test (25-64 anni) rileva alterazioni cellulari. L'HPV test (30-65 anni) rileva il virus. Dopo i 30 anni, l'HPV test può sostituire il Pap-test con intervalli più lunghi (5 anni vs 3)."
                },
                {
                    q: "Quando iniziare i controlli per la menopausa?",
                    a: "Verso i 45-50 anni o alla comparsa dei primi sintomi (vampate, irregolarità mestruali). Il Check-Up Donna Over 40 include gli esami utili per questa fase."
                }
            ]
        },

        // === DIMAGRIMENTO ===
        dimagrimento: {
            title: "Percorso Dimagrimento: Cosa Scegliere?",
            icon: "⚖️",
            description: "Confronta le opzioni per perdere peso in modo efficace e sicuro",
            scenarios: [
                {
                    id: "check",
                    label: "Voglio escludere cause mediche",
                    recommendation: "exam"
                },
                {
                    id: "start",
                    label: "Voglio iniziare un percorso guidato",
                    recommendation: "pathway"
                },
                {
                    id: "failed",
                    label: "Ho provato diete senza successo",
                    recommendation: "pathway"
                },
                {
                    id: "medical",
                    label: "Ho patologie associate (diabete, ipertensione)",
                    recommendation: "specialist"
                }
            ],
            options: [
                {
                    type: "exam",
                    id: "check-up-metabolico",
                    name: "Check-Up Metabolico",
                    price: 69,
                    priceLabel: "€69",
                    includes: ["Glicemia", "HbA1c", "Colesterolo totale/HDL/LDL", "Trigliceridi", "TSH", "Uricemia"],
                    pros: [
                        "Esclude cause metaboliche",
                        "Valuta rischio cardiovascolare",
                        "Base per impostare la dieta"
                    ],
                    cons: [
                        "Solo esami, senza visita",
                        "Non include piano alimentare"
                    ],
                    bestFor: "Screening iniziale, escludi cause ormonali",
                    url: "/laboratorio/index.html",
                    bookingType: "direct"
                },
                {
                    type: "specialist",
                    id: "visita-endocrinologia-obesita",
                    name: "Visita Endocrinologica",
                    price: 120,
                    priceLabel: "€120",
                    pros: [
                        "Valutazione medica completa",
                        "Diagnosi di eventuali patologie",
                        "Prescrizione farmaci se indicati"
                    ],
                    cons: [
                        "Singola visita",
                        "Follow-up da prenotare a parte"
                    ],
                    bestFor: "Sospetta causa ormonale, necessità farmaci",
                    url: "/pages/endocrinologia.html",
                    bookingType: "miodottore"
                },
                {
                    type: "pathway",
                    id: "slim-care",
                    name: "Percorso Slim Care",
                    price: null,
                    priceLabel: "da €199/mese",
                    includes: ["Visite endocrinologiche", "Esami del sangue", "Farmaci GLP-1 (Wegovy/Mounjaro)", "Follow-up mensili", "Supporto dedicato"],
                    pros: [
                        "Percorso completo e guidato",
                        "Farmaci di ultima generazione",
                        "Risultati medi: -15/20% del peso",
                        "Supervisione medica continua"
                    ],
                    cons: [
                        "Impegno a lungo termine (6-12 mesi)",
                        "Costo mensile"
                    ],
                    bestFor: "Obesità, fallimento diete tradizionali, BMI >30",
                    featured: true,
                    recommended: true,
                    url: "/pages/slim-care.html",
                    bookingType: "whatsapp"
                },
                {
                    type: "pathway",
                    id: "slim-care-donna",
                    name: "Percorso Slim Care Donna",
                    price: null,
                    priceLabel: "Personalizzato",
                    includes: ["Tutto Slim Care", "Valutazione ormonale femminile", "Supporto per PCOS/menopausa"],
                    pros: [
                        "Specifico per esigenze femminili",
                        "Include ormoni e tiroide",
                        "Supporto per PCOS"
                    ],
                    cons: [
                        "Solo per donne",
                        "Percorso più articolato"
                    ],
                    bestFor: "Donne con PCOS, menopausa, difficoltà ormonali",
                    featured: true,
                    url: "/pages/slim-care-donna.html",
                    bookingType: "whatsapp"
                }
            ],
            relatedExams: ["insulina", "cortisolo", "leptina", "composizione-corporea"],
            faqs: [
                {
                    q: "Cosa sono i farmaci GLP-1 (Wegovy, Mounjaro)?",
                    a: "Sono farmaci che riducono l'appetito e rallentano lo svuotamento gastrico, permettendo perdite di peso del 15-20%. Richiedono prescrizione medica e supervisione specialistica."
                },
                {
                    q: "Il percorso Slim Care è adatto a tutti?",
                    a: "È indicato per persone con BMI ≥30 (obesità) o BMI ≥27 con comorbidità. Non è adatto in gravidanza, allattamento, o con alcune patologie. La valutazione medica è fondamentale."
                }
            ]
        },

        // === PREVENZIONE GENERALE ===
        prevenzione: {
            title: "Check-Up Generale: Cosa Scegliere?",
            icon: "🩺",
            description: "Confronta i pacchetti di prevenzione per ogni età",
            scenarios: [
                {
                    id: "basic",
                    label: "Check-up di base / Primo controllo",
                    recommendation: "pack_base"
                },
                {
                    id: "under40",
                    label: "Ho meno di 40 anni",
                    recommendation: "pack_under"
                },
                {
                    id: "over40",
                    label: "Ho più di 40 anni",
                    recommendation: "pack_over"
                },
                {
                    id: "complete",
                    label: "Voglio un check-up completo",
                    recommendation: "pack_complete"
                }
            ],
            options: [
                {
                    type: "pack",
                    id: "check-up-base",
                    name: "Check-Up Base",
                    price: 39,
                    priceLabel: "€39",
                    includes: ["Emocromo", "Glicemia", "Creatinina", "Transaminasi", "Colesterolo", "Trigliceridi", "Esame urine"],
                    pros: [
                        "Costo contenuto",
                        "Screening essenziale",
                        "Adatto a tutte le età"
                    ],
                    cons: [
                        "Non include tiroide",
                        "Non include marker specifici"
                    ],
                    bestFor: "Primo check-up, controllo annuale base",
                    url: "/laboratorio/index.html#pack-check-up-base",
                    bookingType: "direct"
                },
                {
                    type: "pack",
                    id: "check-up-uomo-under-40",
                    name: "Check-Up Uomo Under 40",
                    price: 79,
                    priceLabel: "€79",
                    includes: ["Emocromo", "Glicemia", "Creatinina", "Profilo lipidico", "Transaminasi", "TSH", "Vitamina D"],
                    pros: [
                        "Include tiroide e vitamina D",
                        "Screening metabolico completo",
                        "Ottimo rapporto qualità/prezzo"
                    ],
                    cons: [
                        "Non include marker tumorali",
                        "Non include esami specifici"
                    ],
                    bestFor: "Uomini 20-40 anni, prevenzione base",
                    url: "/laboratorio/index.html#pack-check-up-uomo-under-40",
                    bookingType: "direct"
                },
                {
                    type: "pack",
                    id: "check-up-uomo-over-40",
                    name: "Check-Up Uomo Over 40",
                    price: 119,
                    priceLabel: "€119",
                    includes: ["Emocromo", "Profilo lipidico", "Glicemia", "HbA1c", "Creatinina", "TSH", "PSA", "Vitamina D"],
                    pros: [
                        "Include PSA (prostata)",
                        "Screening diabete completo",
                        "Prevenzione cardiovascolare"
                    ],
                    cons: [
                        "Non include visita medica"
                    ],
                    bestFor: "Uomini over 40, prevenzione completa",
                    recommended: true,
                    url: "/laboratorio/index.html#pack-check-up-uomo-over-40",
                    bookingType: "direct"
                },
                {
                    type: "exam",
                    id: "esami-singoli",
                    name: "Esami Singoli",
                    price: null,
                    priceLabel: "Variabile",
                    pros: [
                        "Scegli solo quello che serve",
                        "Massima flessibilità"
                    ],
                    cons: [
                        "Spesso più costoso dei pacchetti",
                        "Richiede di sapere cosa fare"
                    ],
                    bestFor: "Monitoraggio specifico, prescrizione medica",
                    url: "/laboratorio/index.html",
                    bookingType: "direct"
                }
            ],
            relatedExams: ["vitamina-b12", "acido-folico", "magnesio", "omocisteina"],
            faqs: [
                {
                    q: "Ogni quanto fare il check-up?",
                    a: "Senza fattori di rischio: ogni 2-3 anni sotto i 40, annualmente sopra i 40. Con fattori di rischio o patologie: secondo indicazione medica, spesso annualmente."
                },
                {
                    q: "Devo essere a digiuno?",
                    a: "Sì, per la maggior parte degli esami del sangue è richiesto un digiuno di 8-12 ore. Si può bere acqua. I prelievi sono dalle 7:00 alle 11:00."
                }
            ]
        }
    };

    // Stato
    let currentComparison = null;
    let selectedScenario = null;

    // Genera HTML del comparatore
    function render(containerId, comparisonKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const comparison = COMPARISON_DATABASE[comparisonKey];
        if (!comparison) {
            console.error(`Comparison ${comparisonKey} not found`);
            return;
        }

        currentComparison = comparison;

        let html = `
        <div class="smart-comparator">
            <div class="sc-comp-header">
                <span class="sc-comp-icon">${comparison.icon}</span>
                <h2>${comparison.title}</h2>
                <p>${comparison.description}</p>
            </div>
            
            <!-- Scenario Selector -->
            <div class="sc-scenarios">
                <h3>Qual è la tua situazione?</h3>
                <div class="sc-scenario-buttons">
        `;

        comparison.scenarios.forEach(scenario => {
            html += `
                    <button class="sc-scenario-btn" data-scenario="${scenario.id}" data-rec="${scenario.recommendation}">
                        ${scenario.label}
                    </button>
            `;
        });

        html += `
                </div>
            </div>
            
            <!-- Comparison Table -->
            <div class="sc-comparison-table">
                <div class="sc-options-grid">
        `;

        comparison.options.forEach(option => {
            const typeLabel = {
                exam: "🧪 Esame",
                pack: "📦 Pacchetto",
                specialist: "👨‍⚕️ Visita",
                pathway: "🎯 Percorso"
            }[option.type] || option.type;

            const isRecommended = option.recommended;
            const isFeatured = option.featured;

            html += `
                    <div class="sc-option-card ${isRecommended ? 'recommended' : ''} ${isFeatured ? 'featured' : ''}" data-option="${option.id}">
                        ${isRecommended ? '<span class="sc-badge recommended">CONSIGLIATO</span>' : ''}
                        ${isFeatured ? '<span class="sc-badge featured">TOP CHOICE</span>' : ''}
                        
                        <div class="sc-option-type">${typeLabel}</div>
                        <h4 class="sc-option-name">${option.name}</h4>
                        <div class="sc-option-price">${option.priceLabel}</div>
                        
                        ${option.includes ? `
                        <div class="sc-option-includes">
                            <strong>Include:</strong>
                            <ul>
                                ${option.includes.map(item => `<li>✓ ${item}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        <div class="sc-option-pros">
                            <strong>✅ Vantaggi</strong>
                            <ul>
                                ${option.pros.map(pro => `<li>${pro}</li>`).join('')}
                            </ul>
                        </div>
                        
                        ${option.cons && option.cons.length > 0 ? `
                        <div class="sc-option-cons">
                            <strong>⚠️ Limiti</strong>
                            <ul>
                                ${option.cons.map(con => `<li>${con}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        <div class="sc-option-bestfor">
                            <strong>🎯 Ideale per:</strong>
                            <p>${option.bestFor}</p>
                        </div>
                        
                        <a href="${option.url}" class="sc-option-cta">
                            ${option.bookingType === 'direct' ? 'Prenota Esami' : 
                              option.bookingType === 'miodottore' ? 'Prenota Visita' : 
                              'Scopri di più'} →
                        </a>
                    </div>
            `;
        });

        html += `
                </div>
            </div>
            
            <!-- FAQ -->
            ${comparison.faqs && comparison.faqs.length > 0 ? `
            <div class="sc-faqs">
                <h3>❓ Domande Frequenti</h3>
                ${comparison.faqs.map(faq => `
                    <div class="sc-faq-item">
                        <div class="sc-faq-q">${faq.q}</div>
                        <div class="sc-faq-a">${faq.a}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <!-- Help CTA -->
            <div class="sc-help">
                <p>Non sai quale scegliere?</p>
                <a href="tel:+390799561332" class="sc-help-btn">📞 Chiama e ti guideremo: 079 956 1332</a>
            </div>
        </div>
        `;

        container.innerHTML = html;

        // Bind eventi
        container.querySelectorAll('.sc-scenario-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                container.querySelectorAll('.sc-scenario-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const rec = btn.dataset.rec;
                highlightRecommendation(container, rec);
            });
        });

        // Inject styles
        injectStyles();
    }

    // Evidenzia la raccomandazione
    function highlightRecommendation(container, recommendation) {
        // Reset all highlights
        container.querySelectorAll('.sc-option-card').forEach(card => {
            card.classList.remove('highlighted');
        });

        // Map recommendation to option ID
        const recMap = {
            'exam': currentComparison.options.find(o => o.type === 'exam')?.id,
            'pack': currentComparison.options.find(o => o.type === 'pack' && !o.recommended)?.id,
            'pack_plus': currentComparison.options.find(o => o.type === 'pack' && o.recommended)?.id,
            'pack_under': currentComparison.options.find(o => o.id?.includes('under'))?.id,
            'pack_over': currentComparison.options.find(o => o.id?.includes('over'))?.id,
            'pack_base': currentComparison.options.find(o => o.id?.includes('base'))?.id,
            'pack_complete': currentComparison.options.find(o => o.recommended)?.id,
            'specialist': currentComparison.options.find(o => o.type === 'specialist')?.id,
            'pathway': currentComparison.options.find(o => o.type === 'pathway')?.id
        };

        const targetId = recMap[recommendation];
        if (targetId) {
            const targetCard = container.querySelector(`.sc-option-card[data-option="${targetId}"]`);
            if (targetCard) {
                targetCard.classList.add('highlighted');
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // CSS
    const STYLES = `
    <style>
    .smart-comparator {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .sc-comp-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .sc-comp-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 15px;
    }
    
    .sc-comp-header h2 {
        font-size: 2rem;
        color: #1a1a2e;
        margin-bottom: 10px;
    }
    
    .sc-comp-header p {
        color: #666;
    }
    
    .sc-scenarios {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 30px;
    }
    
    .sc-scenarios h3 {
        text-align: center;
        margin-bottom: 20px;
        font-size: 1.1rem;
    }
    
    .sc-scenario-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
    }
    
    .sc-scenario-btn {
        padding: 12px 20px;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    
    .sc-scenario-btn:hover {
        border-color: #00a651;
    }
    
    .sc-scenario-btn.active {
        background: #00a651;
        color: white;
        border-color: #00a651;
    }
    
    .sc-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
    }
    
    .sc-option-card {
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 16px;
        padding: 25px;
        position: relative;
        transition: all 0.3s;
    }
    
    .sc-option-card:hover {
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        transform: translateY(-3px);
    }
    
    .sc-option-card.recommended {
        border-color: #00a651;
    }
    
    .sc-option-card.featured {
        border-color: #ff9800;
        background: linear-gradient(to bottom, #fff8e1 0%, white 30%);
    }
    
    .sc-option-card.highlighted {
        border-color: #2196f3;
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2);
        transform: scale(1.02);
    }
    
    .sc-badge {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        color: white;
    }
    
    .sc-badge.recommended {
        background: #00a651;
    }
    
    .sc-badge.featured {
        background: #ff9800;
    }
    
    .sc-option-type {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 8px;
    }
    
    .sc-option-name {
        font-size: 1.3rem;
        color: #1a1a2e;
        margin-bottom: 10px;
    }
    
    .sc-option-price {
        font-size: 1.8rem;
        font-weight: 700;
        color: #00a651;
        margin-bottom: 15px;
    }
    
    .sc-option-includes {
        background: #f0f9f4;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
    }
    
    .sc-option-includes ul {
        list-style: none;
        padding: 0;
        margin: 8px 0 0;
        font-size: 0.9rem;
    }
    
    .sc-option-includes li {
        padding: 3px 0;
        color: #2e7d32;
    }
    
    .sc-option-pros, .sc-option-cons {
        margin-bottom: 15px;
    }
    
    .sc-option-pros ul, .sc-option-cons ul {
        list-style: none;
        padding: 0;
        margin: 8px 0 0;
        font-size: 0.9rem;
    }
    
    .sc-option-pros li {
        padding: 4px 0;
        color: #2e7d32;
    }
    
    .sc-option-cons li {
        padding: 4px 0;
        color: #f57c00;
    }
    
    .sc-option-bestfor {
        background: #e3f2fd;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        font-size: 0.9rem;
    }
    
    .sc-option-bestfor p {
        margin: 5px 0 0;
        color: #1565c0;
    }
    
    .sc-option-cta {
        display: block;
        text-align: center;
        padding: 12px;
        background: #00a651;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.2s;
    }
    
    .sc-option-cta:hover {
        background: #008c44;
    }
    
    .sc-faqs {
        margin-top: 40px;
        padding: 25px;
        background: #f8f9fa;
        border-radius: 12px;
    }
    
    .sc-faqs h3 {
        margin-bottom: 20px;
    }
    
    .sc-faq-item {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .sc-faq-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .sc-faq-q {
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 8px;
    }
    
    .sc-faq-a {
        color: #555;
        font-size: 0.95rem;
        line-height: 1.6;
    }
    
    .sc-help {
        margin-top: 30px;
        text-align: center;
        padding: 25px;
        background: #1a1a2e;
        border-radius: 12px;
        color: white;
    }
    
    .sc-help p {
        margin-bottom: 15px;
    }
    
    .sc-help-btn {
        display: inline-block;
        padding: 14px 30px;
        background: #00a651;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
    }
    
    .sc-help-btn:hover {
        background: #008c44;
    }
    
    @media (max-width: 768px) {
        .sc-options-grid {
            grid-template-columns: 1fr;
        }
        
        .sc-scenario-buttons {
            flex-direction: column;
        }
        
        .sc-scenario-btn {
            width: 100%;
        }
    }
    </style>
    `;

    function injectStyles() {
        if (!document.getElementById('smart-comparator-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'smart-comparator-styles';
            styleEl.textContent = STYLES.replace('<style>', '').replace('</style>', '');
            document.head.appendChild(styleEl);
        }
    }

    // Lista comparazioni disponibili
    function getAvailableComparisons() {
        return Object.keys(COMPARISON_DATABASE).map(key => ({
            key,
            title: COMPARISON_DATABASE[key].title,
            icon: COMPARISON_DATABASE[key].icon
        }));
    }

    // Export API
    return {
        version: '1.0.0',
        render,
        getAvailableComparisons,
        database: COMPARISON_DATABASE
    };
})();

// Global export
if (typeof window !== 'undefined') {
    window.SmartComparator = SmartComparator;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartComparator;
}
