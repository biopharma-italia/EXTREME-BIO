#!/usr/bin/env node
/**
 * BIO-CLINIC UNIFIED ENTITIES GENERATOR
 * =====================================
 * Genera il file unified-entities.json da tutte le fonti dati esistenti.
 * 
 * Fonti:
 * - data/entities/procedures.json (38 procedure)
 * - data/entities/packs.json (12 pack)
 * - data/entities/pathways.json (5 percorsi)
 * - data/entities/specialties.json (12 specialità)
 * - data/entities/physicians.json (25 medici)
 * - js/database.js (1136 esami - estratti)
 * 
 * Output: data/unified-entities.json
 * 
 * Uso: node scripts/generate-unified-entities.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ENTITIES_DIR = path.join(DATA_DIR, 'entities');
const OUTPUT_FILE = path.join(DATA_DIR, 'unified-entities.json');

// =============================================
// UTILITY FUNCTIONS
// =============================================

function loadJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error loading ${filepath}:`, e.message);
    return null;
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// =============================================
// ENTITY TRANSFORMERS
// =============================================

function transformSpecialties(data) {
  if (!data || !data.specialties) return [];
  
  return data.specialties.map(s => ({
    id: s.id,
    type: 'specialty',
    name: s.name,
    name_search: [s.name, ...(s.aliases || [])],
    category: 'medical',
    page_url: s.page_url || `/pages/${s.id}.html`,
    bookable: true,
    schema_type: 'MedicalSpecialty',
    relations: {
      physicians: s.physicians || [],
      related_procedures: s.procedures || []
    },
    meta: {
      icon: s.icon,
      color: s.color,
      description: s.description
    }
  }));
}

function transformProcedures(data) {
  if (!data || !data.procedures) return [];
  
  return data.procedures.map(p => ({
    id: p.id,
    type: 'procedure',
    name: p.name,
    name_search: [p.name, p.name_extended, ...(p.search_terms || [])],
    specialty_parent: p.specialty_id,
    category: p.category,
    page_url: p.page_url || `/pages/${p.id}.html`,
    price: p.price,
    bookable: true,
    schema_type: 'MedicalProcedure',
    relations: {
      physicians: p.physicians || [],
      related_procedures: p.related_procedures || [],
      pathways: p.pathways || []
    },
    meta: {
      duration_minutes: p.duration_minutes,
      indications: p.indications,
      description: p.description_short
    }
  }));
}

function transformPacks(data) {
  if (!data || !data.packs) return [];
  
  return data.packs.map(p => ({
    id: `pack-${p.id}`,
    type: 'pack',
    name: p.name || p.nome,  // Support both formats
    name_search: [
      p.name || p.nome,
      p.slug,
      ...(p.target_conditions || []),
      ...(p.tags || [])
    ].filter(Boolean),
    category: p.category || 'general',
    page_url: `/laboratorio/#pack-${p.id}`,
    price: p.prezzo || p.price,
    bookable: true,
    schema_type: 'Product',
    relations: {
      related_exams: p.exams_included || p.esami_chiave || []
    },
    meta: {
      exams_count: p.exams_count || p.esami_count,
      savings: p.savings_percentage || p.risparmio,
      description: p.value_proposition || p.clinical_benefit || p.descrizione,
      target: p.target_patient,
      icon: p.icona
    }
  }));
}

function transformPathways(data) {
  if (!data || !data.pathways) return [];
  
  return data.pathways.map(p => ({
    id: p.id,
    type: 'pathway',
    name: p.name,
    name_search: [p.name, ...(p.keywords || [])],
    specialty_parent: p.specialty,
    category: p.category || 'therapeutic',
    page_url: p.page_url || `/pages/${p.id}.html`,
    price: p.price_from,
    bookable: true,
    schema_type: 'Service',
    relations: {
      related_procedures: p.procedures || [],
      physicians: p.physicians || []
    },
    meta: {
      duration: p.duration,
      description: p.description,
      benefits: p.benefits
    }
  }));
}

function transformPhysicians(data) {
  if (!data || !data.physicians) return [];
  
  return data.physicians.map(p => ({
    id: p.id,
    type: 'physician',
    name: `${p.title || 'Dott.'} ${p.name}`,
    name_search: [p.name, p.surname, `${p.name} ${p.surname}`],
    specialty_parent: p.primary_specialty,
    category: p.role || 'specialist',
    page_url: p.profile_url || `/equipe/${p.id}.html`,
    bookable: true,
    schema_type: 'Physician',
    relations: {
      related_procedures: p.procedures || []
    },
    meta: {
      title: p.title,
      specialties: p.specialties,
      credentials: p.credentials,
      photo: p.photo
    }
  }));
}

// =============================================
// MAIN GENERATOR
// =============================================

function generate() {
  console.log('🔄 Generating unified-entities.json...\n');
  
  const entities = [];
  
  // Load and transform each source
  const sources = [
    { file: 'specialties.json', transform: transformSpecialties },
    { file: 'procedures.json', transform: transformProcedures },
    { file: 'packs.json', transform: transformPacks },
    { file: 'pathways.json', transform: transformPathways },
    { file: 'physicians.json', transform: transformPhysicians }
  ];
  
  for (const source of sources) {
    const filepath = path.join(ENTITIES_DIR, source.file);
    const data = loadJSON(filepath);
    
    if (data) {
      const transformed = source.transform(data);
      entities.push(...transformed);
      console.log(`✅ ${source.file}: ${transformed.length} entities`);
    } else {
      console.log(`⚠️ ${source.file}: skipped (not found or invalid)`);
    }
  }
  
  // Create output
  const output = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    total_entities: entities.length,
    by_type: {
      specialty: entities.filter(e => e.type === 'specialty').length,
      procedure: entities.filter(e => e.type === 'procedure').length,
      pack: entities.filter(e => e.type === 'pack').length,
      pathway: entities.filter(e => e.type === 'pathway').length,
      physician: entities.filter(e => e.type === 'physician').length
    },
    entities
  };
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  console.log(`\n✨ Generated ${OUTPUT_FILE}`);
  console.log(`   Total entities: ${entities.length}`);
  console.log(`   By type:`, output.by_type);
}

// Run
generate();
