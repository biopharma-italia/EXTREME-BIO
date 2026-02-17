/**
 * Lab Booking Services — Static fallback data
 * Bio-Clinic Sassari — Laboratorio Analisi
 * 
 * Used when D1 database is not yet bound.
 * Matches D1 schema: services table
 * 
 * @version 1.1.0
 * @date 2026-02-17
 */
export const FALLBACK_SERVICES = [
  {
    id: "prelievo-standard",
    name: "Prelievo Ematico Standard",
    slug: "prelievo-standard",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 5.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno da almeno 8 ore. Bere solo acqua.",
    max_per_slot: 3,
    sort_order: 1,
    active: true
  },
  {
    id: "prelievo-urgente",
    name: "Prelievo Ematico Urgente",
    slug: "prelievo-urgente",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 15.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno da almeno 8 ore. Bere solo acqua. Referto in giornata.",
    max_per_slot: 3,
    sort_order: 2,
    active: true
  },
  {
    id: "urine-standard",
    name: "Esame Urine Completo",
    slug: "urine-standard",
    category: "urine",
    duration_minutes: 10,
    price_eur: 8.00,
    requires_fasting: false,
    prep_instructions: "Portare campione di urina del mattino (mitto intermedio) in contenitore sterile.",
    max_per_slot: 3,
    sort_order: 3,
    active: true
  },
  {
    id: "tampone-vaginale",
    name: "Tampone Vaginale / Cervicale",
    slug: "tampone-vaginale",
    category: "microbiologia",
    duration_minutes: 20,
    price_eur: 25.00,
    requires_fasting: false,
    prep_instructions: "Non effettuare lavande vaginali nelle 24h precedenti. Non usare ovuli o creme vaginali per 5 giorni prima.",
    max_per_slot: 3,
    sort_order: 10,
    active: true
  },
  {
    id: "tampone-faringeo",
    name: "Tampone Faringeo",
    slug: "tampone-faringeo",
    category: "microbiologia",
    duration_minutes: 10,
    price_eur: 20.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno. Non usare collutorio. Non assumere antibiotici nelle 48h precedenti.",
    max_per_slot: 3,
    sort_order: 11,
    active: true
  },
  {
    id: "profilo-tiroide",
    name: "Profilo Tiroideo Completo (TSH, FT3, FT4)",
    slug: "profilo-tiroide",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 35.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare eventuali farmaci tiroidei assunti.",
    max_per_slot: 3,
    sort_order: 20,
    active: true
  },
  {
    id: "profilo-ormonale-donna",
    name: "Profilo Ormonale Donna",
    slug: "profilo-ormonale-donna",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 65.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 8 ore. Eseguire al 3\u00b0-5\u00b0 giorno del ciclo, salvo diversa indicazione medica.",
    max_per_slot: 3,
    sort_order: 21,
    active: true
  },
  {
    id: "marcatori-tumorali",
    name: "Pannello Marcatori Tumorali",
    slug: "marcatori-tumorali",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 80.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 8 ore. Include: PSA, CEA, CA 19-9, CA 125, AFP.",
    max_per_slot: 3,
    sort_order: 22,
    active: true
  },
  {
    id: "test-hpv",
    name: "HPV DNA Test",
    slug: "test-hpv",
    category: "microbiologia",
    duration_minutes: 20,
    price_eur: 55.00,
    requires_fasting: false,
    prep_instructions: "Non durante mestruazioni. Astenersi da rapporti sessuali 48h prima.",
    max_per_slot: 3,
    sort_order: 12,
    active: true
  },
  {
    id: "test-allergologico",
    name: "Pannello Allergologico (IgE Specifiche)",
    slug: "test-allergologico",
    category: "allergologia",
    duration_minutes: 15,
    price_eur: 45.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare antistaminici assunti (non sospendere senza indicazione medica).",
    max_per_slot: 3,
    sort_order: 30,
    active: true
  },
  {
    id: "glicemia-curva",
    name: "Curva Glicemica da Carico (OGTT)",
    slug: "glicemia-curva",
    category: "profilo",
    duration_minutes: 120,
    price_eur: 25.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 10-12 ore. Il test richiede circa 2 ore con prelievi multipli. Non fumare durante il test.",
    max_per_slot: 3,
    sort_order: 23,
    active: true
  },
  {
    id: "emocromo-completo",
    name: "Emocromo Completo con Formula",
    slug: "emocromo-completo",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 8.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare eventuali terapie in corso.",
    max_per_slot: 3,
    sort_order: 4,
    active: true
  }
];
