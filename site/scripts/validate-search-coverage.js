#!/usr/bin/env node
/**
 * BIO-CLINIC SEARCH COVERAGE VALIDATOR
 * =====================================
 * Build-time validation script to ensure all critical clinical entities
 * are searchable and no regressions occur.
 * 
 * Run: node scripts/validate-search-coverage.js
 * Exit: 0 = pass, 1 = fail
 * 
 * @version 1.0.0
 * @date 2026-02-01
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  dataDir: path.join(__dirname, '../data'),
  jsDir: path.join(__dirname, '../js'),
  pagesDir: path.join(__dirname, '../pages'),
  
  // Minimum required coverage (tests.json + database.js combined)
  minTests: 20,  // tests.json has ~23, database.js adds 1136
  minPacks: 10,
  minProcedures: 30,
  minSpecialties: 8,
  
  // Critical terms that MUST be searchable (with expected results)
  criticalSearchTerms: [
    // Basic lab exams
    { term: 'tsh', type: 'test', required: true },
    { term: 'emocromo', type: 'test', required: true },
    { term: 'esame urine', type: 'test', required: true },
    { term: 'glicemia', type: 'test', required: true },
    { term: 'colesterolo', type: 'test', required: true },
    { term: 'ferritina', type: 'test', required: true },
    { term: 'vitamina d', type: 'test', required: true },
    { term: 'creatinina', type: 'test', required: true },
    
    // Gynecology/Women's health
    { term: 'nipt', type: 'test', required: true },
    { term: 'colposcopia', type: 'procedure', required: true },
    { term: 'caressflow', type: 'procedure', required: true },
    { term: 'radiofrequenza', type: 'procedure', required: true },
    { term: 'pap test', type: 'procedure', required: true },
    { term: 'ecografia transvaginale', type: 'procedure', required: true },
    
    // Specialties
    { term: 'cardiologia', type: 'specialty', required: true },
    { term: 'endocrinologia', type: 'specialty', required: true },
    { term: 'ginecologia', type: 'specialty', required: true },
    { term: 'dermatologia', type: 'specialty', required: true },
    { term: 'laboratorio', type: 'specialty', required: true },
    
    // Care pathways
    { term: 'slim-care', type: 'pathway', required: true },
    { term: 'slim care', type: 'pathway', required: true },
    { term: 'pma', type: 'pathway', required: true },
    
    // Packs
    { term: 'check-up', type: 'pack', required: true },
    { term: 'profilo tiroide', type: 'pack', required: true },
    { term: 'checkup', type: 'pack', required: true }
  ],
  
  // Critical pages that must exist
  criticalPages: [
    'laboratorio.html',
    'cardiologia.html',
    'endocrinologia.html',
    'ginecologia.html',
    'dermatologia.html',
    'colposcopia.html',
    'caressflow.html',
    'radiofrequenza-vaginale.html',
    'genetica.html',
    'isteroscopia.html'
  ]
};

// Validation results
let errors = [];
let warnings = [];
let stats = {
  testsFound: 0,
  packsFound: 0,
  proceduresFound: 0,
  specialtiesFound: 0,
  searchTermsValidated: 0,
  pagesFound: 0
};

/**
 * Load JSON file safely
 */
function loadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    errors.push(`Failed to load ${filePath}: ${e.message}`);
    return null;
  }
}

/**
 * Validate entity counts
 */
function validateEntityCounts() {
  console.log('\n📊 Validating entity counts...');
  
  // Tests from tests.json
  const testsFile = path.join(CONFIG.dataDir, 'entities/tests.json');
  const tests = loadJson(testsFile);
  if (tests && tests.tests) {
    stats.testsFound = tests.tests.length;
    if (stats.testsFound < CONFIG.minTests) {
      errors.push(`Tests count (${stats.testsFound}) below minimum (${CONFIG.minTests})`);
    } else {
      console.log(`  ✅ Tests (entities): ${stats.testsFound} (min: ${CONFIG.minTests})`);
    }
  }
  
  // Additional tests from database.js (listino)
  const dbFile = path.join(CONFIG.jsDir, 'database.js');
  try {
    const dbContent = fs.readFileSync(dbFile, 'utf8');
    const listinoMatch = dbContent.match(/listino:\s*\[[\s\S]*?\]/);
    if (listinoMatch) {
      const esameMatches = dbContent.match(/"id":\s*"[^"]+"/g);
      const dbTestsCount = esameMatches ? esameMatches.length : 0;
      console.log(`  ✅ Tests (database.js listino): ~${dbTestsCount} entries`);
    }
  } catch (e) {
    console.log(`  ℹ️  Could not parse database.js test count`);
  }
  
  // Packs
  const packsFile = path.join(CONFIG.dataDir, 'entities/packs.json');
  const packs = loadJson(packsFile);
  if (packs && packs.packs) {
    stats.packsFound = Object.keys(packs.packs).length;
    if (stats.packsFound < CONFIG.minPacks) {
      errors.push(`Packs count (${stats.packsFound}) below minimum (${CONFIG.minPacks})`);
    } else {
      console.log(`  ✅ Packs: ${stats.packsFound} (min: ${CONFIG.minPacks})`);
    }
  }
  
  // Procedures
  const proceduresFile = path.join(CONFIG.dataDir, 'entities/procedures.json');
  const procedures = loadJson(proceduresFile);
  if (procedures && procedures.procedures) {
    stats.proceduresFound = procedures.procedures.length;
    if (stats.proceduresFound < CONFIG.minProcedures) {
      errors.push(`Procedures count (${stats.proceduresFound}) below minimum (${CONFIG.minProcedures})`);
    } else {
      console.log(`  ✅ Procedures: ${stats.proceduresFound} (min: ${CONFIG.minProcedures})`);
    }
  }
  
  // Specialties
  const specialtiesFile = path.join(CONFIG.dataDir, 'entities/specialties.json');
  const specialties = loadJson(specialtiesFile);
  if (specialties && specialties.specialties) {
    stats.specialtiesFound = specialties.specialties.length;
    if (stats.specialtiesFound < CONFIG.minSpecialties) {
      errors.push(`Specialties count (${stats.specialtiesFound}) below minimum (${CONFIG.minSpecialties})`);
    } else {
      console.log(`  ✅ Specialties: ${stats.specialtiesFound} (min: ${CONFIG.minSpecialties})`);
    }
  }
}

/**
 * Validate search index coverage
 */
function validateSearchIndex() {
  console.log('\n🔍 Validating search index coverage...');
  
  const indexFile = path.join(CONFIG.dataDir, 'search/index.json');
  const index = loadJson(indexFile);
  
  if (!index) {
    errors.push('Search index file missing or invalid');
    return;
  }
  
  // Check for required terms in index
  const indexContent = JSON.stringify(index).toLowerCase();
  
  CONFIG.criticalSearchTerms.forEach(item => {
    const termLower = item.term.toLowerCase();
    const found = indexContent.includes(termLower);
    
    if (!found && item.required) {
      errors.push(`Critical search term "${item.term}" (${item.type}) NOT found in search index`);
    } else if (found) {
      stats.searchTermsValidated++;
      console.log(`  ✅ "${item.term}" (${item.type})`);
    } else {
      warnings.push(`Optional search term "${item.term}" not found in index`);
    }
  });
}

/**
 * Validate unified-search synonyms
 */
function validateSynonyms() {
  console.log('\n📝 Validating unified-search synonyms...');
  
  const unifiedSearchFile = path.join(CONFIG.jsDir, 'unified-search.js');
  
  try {
    const content = fs.readFileSync(unifiedSearchFile, 'utf8');
    
    // Check critical synonyms exist
    const criticalSynonyms = [
      'tsh', 'emocromo', 'urine', 'nipt', 'colposcopia', 
      'caressflow', 'radiofrequenza', 'pap test', 'slim care'
    ];
    
    criticalSynonyms.forEach(syn => {
      if (!content.toLowerCase().includes(`'${syn}'`)) {
        warnings.push(`Synonym "${syn}" might be missing from unified-search.js`);
      } else {
        console.log(`  ✅ Synonym "${syn}" present`);
      }
    });
    
  } catch (e) {
    errors.push(`Failed to validate unified-search.js: ${e.message}`);
  }
}

/**
 * Validate critical pages exist
 */
function validatePages() {
  console.log('\n📄 Validating critical pages...');
  
  CONFIG.criticalPages.forEach(page => {
    const pagePath = path.join(CONFIG.pagesDir, page);
    
    if (fs.existsSync(pagePath)) {
      stats.pagesFound++;
      console.log(`  ✅ ${page}`);
    } else {
      errors.push(`Critical page missing: ${page}`);
    }
  });
}

/**
 * Validate database.js structure
 */
function validateDatabase() {
  console.log('\n💾 Validating database.js structure...');
  
  const dbFile = path.join(CONFIG.jsDir, 'database.js');
  
  try {
    const content = fs.readFileSync(dbFile, 'utf8');
    
    // Check critical structures exist
    const requiredStructures = [
      'listino',
      'pacchetti',
      'byCategory',
      'bySymptom',
      'cerca',
      'esamiPerCategoria'
    ];
    
    requiredStructures.forEach(struct => {
      if (!content.includes(struct)) {
        errors.push(`Required structure "${struct}" missing from database.js`);
      } else {
        console.log(`  ✅ Structure "${struct}" present`);
      }
    });
    
    // Check listino has sufficient entries
    const listinoMatch = content.match(/listino.*?(\d+)\s*esami/i);
    if (listinoMatch) {
      const count = parseInt(listinoMatch[1]);
      console.log(`  ℹ️  Listino claims ${count} esami`);
    }
    
  } catch (e) {
    errors.push(`Failed to validate database.js: ${e.message}`);
  }
}

/**
 * Cross-reference validation
 */
function validateCrossReferences() {
  console.log('\n🔗 Validating cross-references...');
  
  // Load procedures to check they reference existing pages
  const proceduresFile = path.join(CONFIG.dataDir, 'entities/procedures.json');
  const procedures = loadJson(proceduresFile);
  
  if (procedures && procedures.procedures) {
    let missingPages = 0;
    
    procedures.procedures.forEach(proc => {
      if (proc.page_url) {
        // Handle different URL formats
        let checkPath;
        if (proc.page_url.startsWith('/laboratorio')) {
          checkPath = path.join(__dirname, '..', 'laboratorio', 'index.html');
        } else if (proc.page_url.startsWith('/pages/')) {
          const pageName = proc.page_url.replace('/pages/', '');
          checkPath = path.join(CONFIG.pagesDir, pageName);
        } else {
          // Skip specialita URLs and absolute paths
          return;
        }
        
        if (!fs.existsSync(checkPath)) {
          missingPages++;
          warnings.push(`Procedure "${proc.id}" references non-existent page: ${proc.page_url}`);
        }
      }
    });
    
    if (missingPages === 0) {
      console.log('  ✅ All procedure page references valid');
    } else {
      console.log(`  ⚠️  ${missingPages} procedures reference missing pages`);
    }
  }
}

/**
 * Main validation routine
 */
function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  BIO-CLINIC SEARCH COVERAGE VALIDATOR          ║');
  console.log('║  Build-time validation for clinical search     ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  validateEntityCounts();
  validateSearchIndex();
  validateSynonyms();
  validatePages();
  validateDatabase();
  validateCrossReferences();
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 VALIDATION SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Tests indexed:      ${stats.testsFound}`);
  console.log(`Packs indexed:      ${stats.packsFound}`);
  console.log(`Procedures indexed: ${stats.proceduresFound}`);
  console.log(`Specialties:        ${stats.specialtiesFound}`);
  console.log(`Search terms OK:    ${stats.searchTermsValidated}/${CONFIG.criticalSearchTerms.length}`);
  console.log(`Pages found:        ${stats.pagesFound}/${CONFIG.criticalPages.length}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (' + warnings.length + '):');
    warnings.forEach(w => console.log('  • ' + w));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (' + errors.length + '):');
    errors.forEach(e => console.log('  • ' + e));
    console.log('\n🔴 VALIDATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED - All critical search coverage verified');
    process.exit(0);
  }
}

main();
