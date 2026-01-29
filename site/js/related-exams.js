/**
 * BIO-CLINIC Related Exams Bridge v1.0.0
 * Collegamento Laboratorio ↔ Specialistica
 * Mostra esami correlati nelle pagine specialità e viceversa
 */

const RelatedExams = (function() {
    'use strict';

    // Database relazioni Specialità → Esami Consigliati
    const SPECIALTY_EXAMS = {
        cardiologia: {
            title: "Esami Consigliati",
            description: "Prima o dopo la visita cardiologica, questi esami forniscono informazioni utili",
            exams: [
                { name: "Profilo Lipidico Completo", desc: "Colesterolo totale, HDL, LDL, Trigliceridi", price: "€15", priority: "high" },
                { name: "Glicemia", desc: "Screening diabete, fattore di rischio cardiovascolare", price: "€3", priority: "high" },
                { name: "Emoglobina Glicata (HbA1c)", desc: "Controllo diabete a lungo termine", price: "€12", priority: "medium" },
                { name: "Creatinina + eGFR", desc: "Funzionalità renale", price: "€5", priority: "medium" },
                { name: "BNP / NT-proBNP", desc: "Marker di scompenso cardiaco", price: "€35", priority: "specialist" },
                { name: "Troponina", desc: "Marker di danno cardiaco (su indicazione)", price: "€25", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-cardiologico-plus", name: "Check-Up Cardiologico Plus", price: "€185" }
            ],
            labUrl: "/laboratorio/index.html?q=cardiovascolare"
        },

        neurologia: {
            title: "Esami Consigliati",
            description: "Esami utili per escludere cause metaboliche di sintomi neurologici",
            exams: [
                { name: "Emocromo Completo", desc: "Anemia può causare sintomi neurologici", price: "€6", priority: "high" },
                { name: "TSH", desc: "Disfunzioni tiroidee causano sintomi neurologici", price: "€8", priority: "high" },
                { name: "Vitamina B12", desc: "Carenza causa neuropatie e disturbi cognitivi", price: "€15", priority: "high" },
                { name: "Acido Folico", desc: "Carenza associata a disturbi neurologici", price: "€12", priority: "medium" },
                { name: "Glicemia", desc: "Diabete causa neuropatie periferiche", price: "€3", priority: "medium" },
                { name: "VES + PCR", desc: "Marker infiammatori", price: "€10", priority: "medium" }
            ],
            packs: [
                { id: "check-up-base", name: "Check-Up Base", price: "€39" }
            ],
            labUrl: "/laboratorio/index.html"
        },

        ginecologia: {
            title: "Esami Consigliati",
            description: "Esami di laboratorio per la salute femminile",
            exams: [
                { name: "Emocromo + Sideremia + Ferritina", desc: "Anemia frequente nelle donne", price: "€18", priority: "high" },
                { name: "TSH", desc: "Tiroide influenza ciclo e fertilità", price: "€8", priority: "high" },
                { name: "Pap-Test / HPV Test", desc: "Screening tumore cervice", price: "da €25", priority: "high" },
                { name: "Tampone Vaginale", desc: "In caso di perdite o sintomi", price: "€20", priority: "medium" },
                { name: "Ormoni Femminili", desc: "FSH, LH, Estradiolo, Progesterone", price: "€45", priority: "specialist" },
                { name: "AMH (Riserva Ovarica)", desc: "Per valutazione fertilità", price: "€50", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-donna-under-40", name: "Check-Up Donna Under 40", price: "€89" },
                { id: "check-up-donna-over-40", name: "Check-Up Donna Over 40", price: "€129" },
                { id: "check-up-pre-gravidanza", name: "Check-Up Pre-Gravidanza", price: "€99" }
            ],
            labUrl: "/laboratorio/index.html?q=donna"
        },

        dermatologia: {
            title: "Esami Consigliati",
            description: "Esami per identificare cause interne di problemi cutanei",
            exams: [
                { name: "Emocromo Completo", desc: "Anemia e carenze", price: "€6", priority: "medium" },
                { name: "Ferritina + Sideremia", desc: "Carenza ferro causa perdita capelli", price: "€12", priority: "high" },
                { name: "TSH + FT4", desc: "Tiroide influenza pelle e capelli", price: "€15", priority: "high" },
                { name: "Vitamina D", desc: "Carenza associata a problemi cutanei", price: "€18", priority: "medium" },
                { name: "Zinco", desc: "Importante per la salute di pelle e capelli", price: "€15", priority: "medium" },
                { name: "IgE Totali + PRIST", desc: "Screening allergie", price: "€25", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-tiroide-plus", name: "Check-Up Tiroide Plus", price: "€59" }
            ],
            labUrl: "/laboratorio/index.html?q=tiroide"
        },

        endocrinologia: {
            title: "Esami Consigliati",
            description: "Esami per valutare il sistema ormonale",
            exams: [
                { name: "TSH + FT3 + FT4", desc: "Funzione tiroidea completa", price: "€25", priority: "high" },
                { name: "Anti-TPO + Anti-TG", desc: "Anticorpi tiroidei (tiroidite)", price: "€30", priority: "high" },
                { name: "Glicemia + HbA1c", desc: "Screening e controllo diabete", price: "€15", priority: "high" },
                { name: "Profilo Lipidico", desc: "Colesterolo e trigliceridi", price: "€15", priority: "medium" },
                { name: "Cortisolo", desc: "Funzione surrenalica", price: "€18", priority: "specialist" },
                { name: "Insulina", desc: "Insulino-resistenza", price: "€15", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-tiroide-base", name: "Check-Up Tiroide Base", price: "€29" },
                { id: "check-up-tiroide-plus", name: "Check-Up Tiroide Plus", price: "€59" }
            ],
            labUrl: "/laboratorio/index.html?q=tiroide"
        },

        ortopedia: {
            title: "Esami Consigliati",
            description: "Esami utili in ambito ortopedico",
            exams: [
                { name: "VES + PCR", desc: "Marker infiammatori (artrite)", price: "€10", priority: "medium" },
                { name: "Acido Urico", desc: "Gotta, artrite gottosa", price: "€5", priority: "medium" },
                { name: "Vitamina D", desc: "Importante per la salute ossea", price: "€18", priority: "high" },
                { name: "Calcio + Fosforo", desc: "Metabolismo osseo", price: "€8", priority: "medium" },
                { name: "Fattore Reumatoide + Anti-CCP", desc: "Artrite reumatoide", price: "€35", priority: "specialist" },
                { name: "ANA (Anticorpi Anti-Nucleo)", desc: "Malattie autoimmuni", price: "€25", priority: "specialist" }
            ],
            packs: [],
            labUrl: "/laboratorio/index.html?q=infiammazione"
        },

        urologia: {
            title: "Esami Consigliati",
            description: "Esami per la salute urologica maschile",
            exams: [
                { name: "PSA Totale", desc: "Screening prostata (over 50)", price: "€12", priority: "high" },
                { name: "PSA Libero + Rapporto", desc: "Approfondimento se PSA elevato", price: "€25", priority: "specialist" },
                { name: "Esame Urine + Urinocoltura", desc: "Infezioni urinarie", price: "€15", priority: "high" },
                { name: "Creatinina + Azotemia", desc: "Funzionalità renale", price: "€8", priority: "medium" },
                { name: "Testosterone", desc: "Se sintomi di ipogonadismo", price: "€20", priority: "specialist" },
                { name: "Citologia Urinaria", desc: "Se sangue nelle urine", price: "€30", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-uomo-over-40", name: "Check-Up Uomo Over 40", price: "€119" }
            ],
            labUrl: "/laboratorio/index.html?q=psa"
        },

        pneumologia: {
            title: "Esami Consigliati",
            description: "Esami di laboratorio in ambito respiratorio",
            exams: [
                { name: "Emocromo Completo", desc: "Eosinofili alti indicano allergia/asma", price: "€6", priority: "high" },
                { name: "IgE Totali", desc: "Screening allergico", price: "€15", priority: "medium" },
                { name: "Alfa-1-Antitripsina", desc: "Enfisema ereditario", price: "€25", priority: "specialist" },
                { name: "D-Dimero", desc: "Sospetta embolia (su indicazione)", price: "€18", priority: "specialist" },
                { name: "BNP", desc: "Escludere causa cardiaca di dispnea", price: "€35", priority: "specialist" },
                { name: "Emogasanalisi", desc: "Scambi respiratori (in struttura)", price: "€20", priority: "specialist" }
            ],
            packs: [],
            labUrl: "/laboratorio/index.html"
        },

        oculistica: {
            title: "Esami Consigliati",
            description: "Esami utili in ambito oculistico",
            exams: [
                { name: "Glicemia + HbA1c", desc: "Diabete causa retinopatia", price: "€15", priority: "high" },
                { name: "Profilo Lipidico", desc: "Arterosclerosi retinica", price: "€15", priority: "medium" },
                { name: "Emocromo", desc: "Anemia, trombocitopenia", price: "€6", priority: "medium" },
                { name: "VES + PCR", desc: "Uveiti e infiammazioni oculari", price: "€10", priority: "medium" },
                { name: "ANA + ENA", desc: "Malattie autoimmuni (uveite)", price: "€45", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-base", name: "Check-Up Base", price: "€39" }
            ],
            labUrl: "/laboratorio/index.html?q=glicemia"
        },

        gastroenterologia: {
            title: "Esami Consigliati",
            description: "Esami di laboratorio per l'apparato digerente",
            exams: [
                { name: "Emocromo Completo", desc: "Anemia da sanguinamento occulto", price: "€6", priority: "high" },
                { name: "Sideremia + Ferritina", desc: "Carenza ferro (malassorbimento, emorragie)", price: "€12", priority: "high" },
                { name: "Transaminasi (AST, ALT)", desc: "Funzione epatica", price: "€8", priority: "high" },
                { name: "GGT + Bilirubina", desc: "Vie biliari", price: "€10", priority: "medium" },
                { name: "Calprotectina Fecale", desc: "Infiammazione intestinale (IBD)", price: "€35", priority: "specialist" },
                { name: "Sangue Occulto Fecale", desc: "Screening colon (over 50)", price: "€10", priority: "high" },
                { name: "Test Helicobacter (Urea Breath)", desc: "Infezione H. pylori", price: "€30", priority: "specialist" }
            ],
            packs: [
                { id: "check-up-profilo-epatico", name: "Check-Up Profilo Epatico", price: "€45" }
            ],
            labUrl: "/laboratorio/index.html?q=epatico"
        }
    };

    // Genera HTML del componente
    function render(specialty) {
        const data = SPECIALTY_EXAMS[specialty];
        if (!data) return '';

        let html = `
        <section class="related-exams-section">
            <div class="container">
                <div class="re-header">
                    <h2>🧪 ${data.title}</h2>
                    <p>${data.description}</p>
                </div>
                
                <div class="re-grid">
        `;

        // Esami prioritari
        const highPriority = data.exams.filter(e => e.priority === 'high');
        const mediumPriority = data.exams.filter(e => e.priority === 'medium');
        const specialistPriority = data.exams.filter(e => e.priority === 'specialist');

        if (highPriority.length > 0) {
            html += `
                    <div class="re-group">
                        <h3>✅ Consigliati per tutti</h3>
                        <div class="re-exams">
            `;
            highPriority.forEach(exam => {
                html += `
                            <div class="re-exam-card re-high">
                                <div class="re-exam-name">${exam.name}</div>
                                <div class="re-exam-desc">${exam.desc}</div>
                                <div class="re-exam-price">${exam.price}</div>
                            </div>
                `;
            });
            html += `
                        </div>
                    </div>
            `;
        }

        if (mediumPriority.length > 0) {
            html += `
                    <div class="re-group">
                        <h3>💡 Utili in base ai sintomi</h3>
                        <div class="re-exams">
            `;
            mediumPriority.forEach(exam => {
                html += `
                            <div class="re-exam-card re-medium">
                                <div class="re-exam-name">${exam.name}</div>
                                <div class="re-exam-desc">${exam.desc}</div>
                                <div class="re-exam-price">${exam.price}</div>
                            </div>
                `;
            });
            html += `
                        </div>
                    </div>
            `;
        }

        if (specialistPriority.length > 0) {
            html += `
                    <div class="re-group">
                        <h3>🔬 Su indicazione dello specialista</h3>
                        <div class="re-exams">
            `;
            specialistPriority.forEach(exam => {
                html += `
                            <div class="re-exam-card re-specialist">
                                <div class="re-exam-name">${exam.name}</div>
                                <div class="re-exam-desc">${exam.desc}</div>
                                <div class="re-exam-price">${exam.price}</div>
                            </div>
                `;
            });
            html += `
                        </div>
                    </div>
            `;
        }

        // Pacchetti consigliati
        if (data.packs && data.packs.length > 0) {
            html += `
                    <div class="re-packs">
                        <h3>📦 Pacchetti Consigliati</h3>
                        <div class="re-pack-list">
            `;
            data.packs.forEach(pack => {
                html += `
                            <a href="/laboratorio/index.html#pack-${pack.id}" class="re-pack-item">
                                <span class="re-pack-name">${pack.name}</span>
                                <span class="re-pack-price">${pack.price}</span>
                            </a>
                `;
            });
            html += `
                        </div>
                    </div>
            `;
        }

        html += `
                </div>
                
                <div class="re-cta">
                    <p>Accesso diretto al laboratorio senza appuntamento</p>
                    <div class="re-cta-buttons">
                        <a href="${data.labUrl}" class="re-btn re-btn-primary">🧪 Tutti gli Esami</a>
                        <a href="tel:+390799561332" class="re-btn re-btn-secondary">📞 079 956 1332</a>
                    </div>
                </div>
            </div>
        </section>
        `;

        return html;
    }

    // CSS
    const STYLES = `
    <style>
    .related-exams-section {
        padding: 60px 0;
        background: #f8f9fa;
    }
    
    .re-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .re-header h2 {
        font-size: 1.8rem;
        color: #1a1a2e;
        margin-bottom: 10px;
    }
    
    .re-header p {
        color: #666;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .re-grid {
        max-width: 1000px;
        margin: 0 auto;
    }
    
    .re-group {
        margin-bottom: 30px;
    }
    
    .re-group h3 {
        font-size: 1.1rem;
        color: #1a1a2e;
        margin-bottom: 15px;
        padding-left: 10px;
        border-left: 3px solid #00a651;
    }
    
    .re-exams {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
    }
    
    .re-exam-card {
        background: white;
        border-radius: 10px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .re-exam-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .re-exam-card.re-high {
        border-left: 3px solid #00a651;
    }
    
    .re-exam-card.re-medium {
        border-left: 3px solid #ff9800;
    }
    
    .re-exam-card.re-specialist {
        border-left: 3px solid #2196f3;
    }
    
    .re-exam-name {
        font-weight: 600;
        color: #1a1a2e;
    }
    
    .re-exam-desc {
        font-size: 0.85rem;
        color: #666;
    }
    
    .re-exam-price {
        font-weight: 600;
        color: #00a651;
        margin-top: auto;
    }
    
    .re-packs {
        margin-top: 30px;
        padding: 25px;
        background: white;
        border-radius: 12px;
    }
    
    .re-packs h3 {
        margin-bottom: 15px;
        border-left: none;
        padding-left: 0;
    }
    
    .re-pack-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
    
    .re-pack-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 20px;
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border-radius: 10px;
        text-decoration: none;
        color: #1a1a2e;
        transition: all 0.2s;
    }
    
    .re-pack-item:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0,166,81,0.2);
    }
    
    .re-pack-name {
        font-weight: 600;
    }
    
    .re-pack-price {
        color: #00a651;
        font-weight: 700;
    }
    
    .re-cta {
        margin-top: 40px;
        text-align: center;
        padding: 30px;
        background: white;
        border-radius: 12px;
    }
    
    .re-cta p {
        color: #666;
        margin-bottom: 20px;
    }
    
    .re-cta-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .re-btn {
        padding: 12px 25px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .re-btn-primary {
        background: #00a651;
        color: white;
    }
    
    .re-btn-primary:hover {
        background: #008c44;
    }
    
    .re-btn-secondary {
        background: #f8f9fa;
        color: #1a1a2e;
        border: 1px solid #e0e0e0;
    }
    
    .re-btn-secondary:hover {
        background: #e8e8e8;
    }
    
    @media (max-width: 768px) {
        .re-exams {
            grid-template-columns: 1fr;
        }
        
        .re-pack-list {
            flex-direction: column;
        }
        
        .re-cta-buttons {
            flex-direction: column;
            align-items: center;
        }
        
        .re-btn {
            width: 100%;
            max-width: 250px;
            text-align: center;
        }
    }
    </style>
    `;

    // Auto-inject nelle pagine specialità
    function autoInject() {
        const pathname = window.location.pathname;
        const match = pathname.match(/pages\/([^.]+)\.html/);
        
        if (match) {
            const specialty = match[1];
            if (SPECIALTY_EXAMS[specialty]) {
                // Trova punto di inserimento (prima delle FAQ o footer)
                const insertPoint = document.querySelector('.clinical-faq-section') ||
                                   document.querySelector('footer') ||
                                   document.querySelector('.cta-section');
                
                if (insertPoint && !document.querySelector('.related-exams-section')) {
                    const html = render(specialty);
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = STYLES + html;
                    insertPoint.parentNode.insertBefore(wrapper, insertPoint);
                    
                    console.log(`[RelatedExams] Injected for ${specialty}`);
                }
            }
        }
    }

    // Init
    function init() {
        // Inject styles
        if (!document.getElementById('related-exams-styles')) {
            const style = document.createElement('style');
            style.id = 'related-exams-styles';
            style.textContent = STYLES.replace('<style>', '').replace('</style>', '');
            document.head.appendChild(style);
        }
        
        autoInject();
    }

    // Export API
    return {
        version: '1.0.0',
        render,
        init,
        autoInject,
        database: SPECIALTY_EXAMS,
        getSpecialties: () => Object.keys(SPECIALTY_EXAMS)
    };
})();

// Global export
if (typeof window !== 'undefined') {
    window.RelatedExams = RelatedExams;
    
    document.addEventListener('DOMContentLoaded', () => {
        RelatedExams.init();
    });
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelatedExams;
}
