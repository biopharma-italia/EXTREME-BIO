#!/usr/bin/env node
/**
 * BIO-CLINIC MASSIVE UPDATE SCRIPT
 * Aggiorna in batch tutte le pagine prestazioni con:
 * 1. Sintomi (SEO Semantica)
 * 2. Tecnologia (Proof)
 * 3. Vantaggio Bio-Clinic (Cross-Selling)
 * 4. Schema.org knowsAbout
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// DATASET - FONTE DI VERITÀ
// ============================================================================
const SPECIALTY_DATA = {
  "Ginecologia": {
    "sintomi": ["Ciclo irregolare o doloroso", "Vampate e Menopausa", "Dolore pelvico cronico", "Perdite anomale", "Ricerca gravidanza"],
    "tech": "Ecografi Voluson™ E10 4D e Colposcopio Digitale HD.",
    "cross_sell": "Integrazione con il Laboratorio per dosaggi ormonali (FSH, LH, Estradiolo) con referto in giornata e protocolli Slim Care Donna.",
    "color": "#E91E63",
    "colorLight": "#FCE4EC",
    "icon": "fa-venus",
    "files": ["visita-ginecologica.html", "ecografia-transvaginale.html", "pap-test.html", "ecografia-pelvica.html", "ecografia-mammaria.html", "isteroscopia.html", "ecografia-morfologica.html", "assistenza-ostetrica.html", "corso-preparto.html", "riabilitazione-pavimento-pelvico.html"]
  },
  "Cardiologia": {
    "sintomi": ["Palpitazioni o Aritmie", "Dolore al torace", "Affanno sotto sforzo", "Ipertensione", "Gonfiore alle caviglie"],
    "tech": "Treadmill Schiller per test massimali e Holter Mortara 12 canali.",
    "cross_sell": "Loop Clinico immediato: se necessario, eseguiamo Troponina, Profilo Lipidico e Coagulazione durante la visita.",
    "color": "#E53935",
    "colorLight": "#FFEBEE",
    "icon": "fa-heartbeat",
    "files": ["visita-cardiologica-ecg.html", "ecocardiogramma.html", "holter-ecg.html", "holter-pressorio.html"]
  },
  "Endocrinologia": {
    "sintomi": ["Aumento di peso ingiustificato", "Stanchezza cronica", "Nodi alla gola", "Perdita di capelli", "Sete eccessiva"],
    "tech": "Ecografia Tiroidea ad alta frequenza e Body Scanner 3D Visbody.",
    "cross_sell": "Dosaggio TSH Reflex, FT3, FT4 e Anticorpi in sede con referto rapido per calibrare la terapia.",
    "color": "#4A90A4",
    "colorLight": "#E3F2FD",
    "icon": "fa-disease",
    "files": ["visita-endocrinologica.html", "ecografia-tiroidea.html", "visita-nutrizionale.html"]
  },
  "Dermatologia": {
    "sintomi": ["Nei che cambiano forma", "Macchie solari", "Prurito persistente", "Acne o Dermatiti", "Caduta capelli"],
    "tech": "Videodermatoscopio Digitale con Mappatura AI.",
    "cross_sell": "Possibilità di piccola chirurgia ambulatoriale immediata con esame istologico rapido.",
    "color": "#8E24AA",
    "colorLight": "#F3E5F5",
    "icon": "fa-hand-holding-medical",
    "files": ["visita-dermatologica.html", "mappatura-nevi.html"]
  },
  "Neurologia": {
    "sintomi": ["Mal di testa cronico", "Tremori", "Perdita di memoria", "Formicolii", "Vertigini"],
    "tech": "Elettromiografo Digitale Multicanale.",
    "cross_sell": "Percorso integrato con Fisiatria e Diagnostica Vascolare (Doppler TSA).",
    "color": "#5C6BC0",
    "colorLight": "#E8EAF6",
    "icon": "fa-brain",
    "files": ["visita-neurologica.html", "elettromiografia.html"]
  },
  "Urologia": {
    "sintomi": ["Difficoltà a urinare", "Bruciore o sangue", "Dolore lombare", "Disfunzione erettile", "Controllo PSA"],
    "tech": "Ecografo Prostatico Transrettale e Uroflussometro Wireless.",
    "cross_sell": "Dosaggio PSA Totale/Libero e Urinocoltura eseguiti direttamente prima della visita.",
    "color": "#FF7043",
    "colorLight": "#FBE9E7",
    "icon": "fa-male",
    "files": ["visita-urologica.html", "ecografia-prostatica.html", "visita-nefrologica.html"]
  },
  "Pneumologia": {
    "sintomi": ["Tosse persistente", "Fiato corto", "Asma", "Apnee notturne", "Fumatore"],
    "tech": "Spirometro Computerizzato con Test di Reversibilità.",
    "cross_sell": "Possibilità di RX Torace e test allergologici (RAST) in sede.",
    "color": "#26A69A",
    "colorLight": "#E0F2F1",
    "icon": "fa-lungs",
    "files": ["visita-pneumologica.html", "spirometria.html"]
  },
  "Oculistica": {
    "sintomi": ["Calo della vista", "Mosche volanti", "Occhio rosso/secco", "Visione distorta", "Mal di testa frequente"],
    "tech": "OCT (Tomografia) Cirrus HD e Campo Visivo Computerizzato Humphrey.",
    "cross_sell": "Screening Retinopatia integrato con il percorso Diabetologico e Cardiologico.",
    "color": "#0288D1",
    "colorLight": "#E1F5FE",
    "icon": "fa-eye",
    "files": ["campo-visivo.html"] // visita-oculistica già aggiornata manualmente
  },
  "Ortopedia": {
    "sintomi": ["Dolore articolare", "Blocco della spalla/ginocchio", "Mal di schiena", "Traumi sportivi", "Formicolii"],
    "tech": "Ecografia Muscolo-Scheletrica e Infiltrazioni Ecoguidate.",
    "cross_sell": "Percorso riabilitativo integrato con Fisiatria e Reumatologia.",
    "color": "#00897B",
    "colorLight": "#E0F2F1",
    "icon": "fa-bone",
    "files": ["visita-ortopedica.html", "infiltrazioni-articolari.html", "visita-fisiatrica.html", "visita-reumatologica.html"]
  },
  "Vascolare": {
    "sintomi": ["Gambe pesanti", "Capillari visibili", "Vene varicose", "Crampi notturni", "Gonfiore"],
    "tech": "Eco-Color-Doppler ad alta risoluzione vascolare.",
    "cross_sell": "Trattamento Scleroterapico estetico e funzionale immediato.",
    "color": "#D32F2F",
    "colorLight": "#FFCDD2",
    "icon": "fa-stream",
    "files": ["visita-chirurgia-vascolare.html", "eco-doppler-arti.html", "scleroterapia.html"]
  },
  "Ematologia": {
    "sintomi": ["Anemia", "Lividi frequenti", "Stanchezza estrema", "Valori sangue alterati", "Coagulazione"],
    "tech": "Microscopia per striscio periferico.",
    "cross_sell": "Accesso diretto ai dati grezzi del laboratorio per un'interpretazione immediata.",
    "color": "#C62828",
    "colorLight": "#FFEBEE",
    "icon": "fa-tint",
    "files": ["visita-ematologica.html"]
  },
  "Gastroenterologia": {
    "sintomi": ["Bruciore di stomaco", "Gonfiore addominale", "Stipsi o diarrea", "Dolore post-prandiale", "Nausea"],
    "tech": "Ecografia Anse Intestinali ad alta frequenza e Breath Test.",
    "cross_sell": "Test Intolleranze (Lattosio/Glutine/H.Pylori) eseguiti direttamente in reparto.",
    "color": "#558B2F",
    "colorLight": "#F1F8E9",
    "icon": "fa-stomach",
    "files": ["visita-gastroenterologica.html", "ecografia-addominale.html"]
  },
  "Altre": {
    "sintomi": ["Check-up generale", "Certificati medici", "Supporto psicologico", "Salute mentale", "Valutazione specialistica"],
    "tech": "Strumentazione diagnostica multidisciplinare.",
    "cross_sell": "Accesso prioritario a tutti i servizi della clinica.",
    "color": "#455A64",
    "colorLight": "#ECEFF1",
    "icon": "fa-user-md",
    "files": ["visita-internistica.html", "visita-medicina-lavoro.html", "visita-medicina-sport.html", "visita-pediatrica.html", "colloquio-psicologico.html"]
  },
  "ORL": {
    "sintomi": ["Otite o mal d'orecchio", "Vertigini", "Sinusite cronica", "Raucedine persistente", "Problemi di udito"],
    "tech": "Audiometro e Impedenzometro diagnostici.",
    "cross_sell": "Esame Audiometrico completo e Lavaggio Auricolare in sede.",
    "color": "#7E57C2",
    "colorLight": "#EDE7F6",
    "icon": "fa-ear-listen",
    "files": ["visita-orl.html"]
  },
  "Ostetricia": {
    "sintomi": ["Gravidanza in corso", "Controlli prenatali", "Ecografia morfologica", "Monitoraggio fetale", "Preparazione parto"],
    "tech": "Ecografi Voluson™ E10 4D per imaging fetale avanzato.",
    "cross_sell": "Percorso nascita completo con corso preparto, assistenza ostetrica e follow-up post-partum.",
    "color": "#E91E8C",
    "colorLight": "#FCE4EC",
    "icon": "fa-baby",
    "files": ["ecografia-ostetrica-3d.html"]
  }
};

// ============================================================================
// GENERATORE BLOCCO HTML
// ============================================================================
function generateStrategicBlock(specialty, data) {
  const sintomiTags = data.sintomi.map(s => 
    `                <span class="px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700 border border-gray-200 hover:border-green-500 transition cursor-default">
                    ${s}
                </span>`
  ).join('\n');

  return `
    <!-- BLOCCO STRATEGICO AUTOMATIZZATO - ${specialty} -->
    <section class="py-12 bg-white border-b border-gray-100">
        <div class="max-w-6xl mx-auto px-4">
            
            <!-- 1. SINTOMI (SEO SEMANTICA) -->
            <div class="mb-10">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-user-injured" style="color: ${data.color};"></i> Quando richiedere questa prestazione?
                </h3>
                <div class="flex flex-wrap gap-3">
${sintomiTags}
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- 2. TECNOLOGIA (PROOF) -->
                <div class="p-6 rounded-xl border-l-4" style="background: ${data.colorLight}; border-color: ${data.color};">
                    <h4 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <i class="fas fa-microchip" style="color: ${data.color};"></i> Dotazione Tecnologica
                    </h4>
                    <p class="text-sm text-gray-600">${data.tech}</p>
                </div>

                <!-- 3. VANTAGGIO BIO-CLINIC (CROSS-SELL) -->
                <div class="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <i class="fas fa-plus-circle text-green-600"></i> Perché Bio-Clinic?
                    </h4>
                    <p class="text-sm text-gray-600">${data.cross_sell}</p>
                </div>
            </div>

        </div>
    </section>`;
}

// ============================================================================
// FUNZIONE PER AGGIORNARE SCHEMA.ORG
// ============================================================================
function updateSchemaOrg(html, sintomi) {
  // Cerca il blocco JSON-LD
  const jsonLdRegex = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/;
  const match = html.match(jsonLdRegex);
  
  if (!match) {
    console.log('    ⚠️  JSON-LD non trovato');
    return html;
  }
  
  try {
    let jsonLd = JSON.parse(match[1]);
    
    // Trova il MedicalProcedure nel graph
    if (jsonLd['@graph']) {
      for (let item of jsonLd['@graph']) {
        if (item['@type'] === 'MedicalProcedure') {
          // Aggiungi o aggiorna knowsAbout
          item.knowsAbout = sintomi;
          break;
        }
      }
    } else if (jsonLd['@type'] === 'MedicalProcedure') {
      jsonLd.knowsAbout = sintomi;
    }
    
    // Ricostruisci il JSON-LD formattato
    const newJsonLd = JSON.stringify(jsonLd, null, 6);
    const newScript = `<script type="application/ld+json">\n    ${newJsonLd}\n    </script>`;
    
    return html.replace(jsonLdRegex, newScript);
  } catch (e) {
    console.log('    ⚠️  Errore parsing JSON-LD:', e.message);
    return html;
  }
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================
const PAGES_DIR = path.join(__dirname, '..', 'pages');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║       BIO-CLINIC MASSIVE UPDATE - 50 PAGINE PRESTAZIONI       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalUpdated = 0;
let totalSkipped = 0;
let totalErrors = 0;

for (const [specialty, data] of Object.entries(SPECIALTY_DATA)) {
  console.log(`\n📂 ${specialty.toUpperCase()}`);
  console.log('─'.repeat(50));
  
  for (const file of data.files) {
    const filePath = path.join(PAGES_DIR, file);
    
    // Verifica esistenza file
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ ${file} - FILE NON TROVATO`);
      totalErrors++;
      continue;
    }
    
    // Leggi il file
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se già aggiornato
    if (html.includes('BLOCCO STRATEGICO AUTOMATIZZATO')) {
      console.log(`   ⏭️  ${file} - già aggiornato`);
      totalSkipped++;
      continue;
    }
    
    // Trova la fine della HERO section (prima </section> dopo "HERO")
    // Pattern: cerca la prima </section> dopo "page-content" o "HERO"
    const heroEndPattern = /(<section[^>]*class="relative[^"]*overflow-hidden"[^>]*>[\s\S]*?<\/section>)/;
    const heroMatch = html.match(heroEndPattern);
    
    if (!heroMatch) {
      // Fallback: cerca dopo la prima section con py-16 o py-24
      const fallbackPattern = /(<section[^>]*>[\s\S]*?<\/section>)/;
      const fallbackMatch = html.match(fallbackPattern);
      
      if (!fallbackMatch) {
        console.log(`   ⚠️  ${file} - Pattern Hero non trovato`);
        totalErrors++;
        continue;
      }
    }
    
    // Genera il blocco strategico
    const strategicBlock = generateStrategicBlock(specialty, data);
    
    // Inserisci dopo la prima </section> che contiene la Hero
    // Strategia: trova "</section>" dopo "HERO SECTION" o dopo il primo gradient
    let insertionDone = false;
    
    // Pattern più preciso: trova la sezione Hero (con gradient o overflow-hidden)
    const heroSectionRegex = /(<section[^>]*(?:overflow-hidden|linear-gradient)[^>]*>[\s\S]*?<\/section>)/;
    const heroSectionMatch = html.match(heroSectionRegex);
    
    if (heroSectionMatch) {
      const heroEnd = heroSectionMatch.index + heroSectionMatch[0].length;
      html = html.slice(0, heroEnd) + '\n' + strategicBlock + html.slice(heroEnd);
      insertionDone = true;
    }
    
    if (!insertionDone) {
      // Fallback: inserisci dopo il primo </section>
      const firstSectionEnd = html.indexOf('</section>');
      if (firstSectionEnd !== -1) {
        const insertPoint = firstSectionEnd + '</section>'.length;
        html = html.slice(0, insertPoint) + '\n' + strategicBlock + html.slice(insertPoint);
        insertionDone = true;
      }
    }
    
    if (!insertionDone) {
      console.log(`   ⚠️  ${file} - Impossibile trovare punto di inserimento`);
      totalErrors++;
      continue;
    }
    
    // Aggiorna Schema.org con knowsAbout
    html = updateSchemaOrg(html, data.sintomi);
    
    // Scrivi il file aggiornato
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`   ✅ ${file} - AGGIORNATO`);
    totalUpdated++;
  }
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                         RIEPILOGO                              ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`   ✅ Aggiornati:  ${totalUpdated}`);
console.log(`   ⏭️  Saltati:     ${totalSkipped}`);
console.log(`   ❌ Errori:      ${totalErrors}`);
console.log(`   📊 Totale:      ${totalUpdated + totalSkipped + totalErrors}`);
console.log('\n🎉 MASSIVE UPDATE COMPLETATO!\n');
