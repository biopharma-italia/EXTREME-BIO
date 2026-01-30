#!/usr/bin/env node
/**
 * BIO-CLINIC - Fix Residual Issues
 * 1. Optimize titles > 60 chars
 * 2. Add loading="lazy" to images
 * 3. Replace Tailwind CDN with local CSS
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../pages');
const ROOT_DIR = path.join(__dirname, '..');

// ============================================================================
// TITLE OPTIMIZATIONS - Shorten titles > 60 chars
// ============================================================================
const TITLE_REPLACEMENTS = {
  'Trattamenti Pavimento Pelvico Sassari | Radiofrequenza, Perifit, CaressFlow | Bio-Clinic': 
    'Pavimento Pelvico Sassari | Radiofrequenza | Bio-Clinic',
  
  'Urologia e Andrologia Sassari | 1 Specialista | 18 Prestazioni | Bio-Clinic': 
    'Urologia Sassari | Andrologo | Bio-Clinic',
  
  'Otorinolaringoiatria Sassari | 2 Specialisti | 28 Prestazioni | Bio-Clinic': 
    'Otorinolaringoiatria Sassari | ORL | Bio-Clinic',
  
  'Chirurgia Vascolare Sassari | 2 Specialisti | 16 Prestazioni | Bio-Clinic': 
    'Chirurgia Vascolare Sassari | Bio-Clinic',
  
  'Gastroenterologia Sassari | 1 Specialista | 15 Prestazioni | Bio-Clinic': 
    'Gastroenterologia Sassari | Bio-Clinic',
  
  'Visita Oculistica Sassari | OCT, Campo Visivo, Glaucoma | Bio-Clinic': 
    'Oculistica Sassari | OCT, Glaucoma | Bio-Clinic',
  
  'Tutte le Specialità | 31 Specialità Mediche | Bio-Clinic Sassari': 
    'Specialità Mediche | 31 Branche | Bio-Clinic Sassari',
  
  'Reumatologia Sassari | 1 Specialista | 14 Prestazioni | Bio-Clinic': 
    'Reumatologia Sassari | Bio-Clinic',
  
  'Pneumologia Sassari | 1 Specialista | 18 Prestazioni | Bio-Clinic': 
    'Pneumologia Sassari | Bio-Clinic',
  
  'Ginecologia Sassari | 6 Specialisti | 94 Prestazioni | Bio-Clinic': 
    'Ginecologia Sassari | 6 Specialisti | Bio-Clinic',
  
  'Endocrinologia Sassari | Tiroide, Diabete, Slim Care | Bio-Clinic': 
    'Endocrinologia Sassari | Tiroide | Bio-Clinic',
  
  'Contatti | Bio-Clinic Sassari | Via Renzo Mossa 23 | 079 956 1332': 
    'Contatti Bio-Clinic Sassari | 079 956 1332',
  
  'Check-Up Cardiovascolare Sassari | Prevenzione Cuore | Bio-Clinic': 
    'Check-Up Cuore Sassari | Bio-Clinic',
  
  'Cardiologia Sassari | 5 Specialisti | 39 Prestazioni | Bio-Clinic': 
    'Cardiologia Sassari | 5 Specialisti | Bio-Clinic',
  
  'Prevenzione e Check-Up Sassari | Esami di Controllo | Bio-Clinic': 
    'Prevenzione Sassari | Check-Up | Bio-Clinic',
  
  'PMA Fertilità Sassari | Centro Procreazione Assist | Bio-Clinic': 
    'PMA Fertilità Sassari | Bio-Clinic',
  
  'Oculistica Sassari | 3 Specialisti | 25 Prestazioni | Bio-Clinic': 
    'Oculistica Sassari | 3 Specialisti | Bio-Clinic',
  
  'Neurologia Sassari | 2 Specialisti | 22 Prestazioni | Bio-Clinic': 
    'Neurologia Sassari | 2 Specialisti | Bio-Clinic',
  
  'Ematologia Sassari | 2 Specialisti | 12 Prestazioni | Bio-Clinic': 
    'Ematologia Sassari | Bio-Clinic',
  
  'Symptom Checker | Trova il Percorso Giusto | Bio-Clinic Sassari': 
    'Symptom Checker | Bio-Clinic Sassari',
  
  'SLIM CARE Sassari | Dimagrimento con Wegovy e Moun | Bio-Clinic': 
    'Slim Care Sassari | Wegovy, Mounjaro | Bio-Clinic',
  
  'Ortopedia Sassari | 2 Specialisti | 28 Prestazioni | Bio-Clinic': 
    'Ortopedia Sassari | 2 Specialisti | Bio-Clinic',
  
  'Bio-Clinic Sassari | Poliambulatorio Medico | Slim Care, Gin...': 
    'Bio-Clinic Sassari | Poliambulatorio Medico',
  
  'Slim Care Donna | Dimagrimento e Salute Femminile | Bio-Clinic': 
    'Slim Care Donna Sassari | Bio-Clinic',
  
  'Pap Test e HPV Test Sassari | Screening Cervicale | Bio-Clinic': 
    'Pap Test HPV Sassari | Bio-Clinic',
  
  'Dermatologia Sassari | 3 Specialisti | 19 Prestazioni | Bio-Clinic':
    'Dermatologia Sassari | 3 Specialisti | Bio-Clinic'
};

// ============================================================================
// PROCESS FILES
// ============================================================================
function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Fix long titles
  for (const [oldTitle, newTitle] of Object.entries(TITLE_REPLACEMENTS)) {
    if (html.includes(`<title>${oldTitle}</title>`)) {
      html = html.replace(`<title>${oldTitle}</title>`, `<title>${newTitle}</title>`);
      console.log(`   📋 Title shortened: ${path.basename(filePath)}`);
      modified = true;
    }
    // Also fix og:title
    if (html.includes(`og:title" content="${oldTitle.substring(0, 60)}`)) {
      html = html.replace(
        new RegExp(`og:title" content="[^"]*${oldTitle.substring(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"`),
        `og:title" content="${newTitle}"`
      );
    }
  }
  
  // 2. Add loading="lazy" to images (except logo and hero)
  const imgRegex = /<img(?![^>]*loading=)([^>]*)(src="[^"]*(?!logo)[^"]*")([^>]*)>/gi;
  const newHtml = html.replace(imgRegex, (match, before, src, after) => {
    // Skip if already has loading attribute or is a logo/critical image
    if (match.includes('loading=') || 
        match.includes('logo') || 
        match.includes('loading="eager"') ||
        match.includes('hero')) {
      return match;
    }
    modified = true;
    return `<img${before}${src}${after} loading="lazy">`;
  });
  
  if (newHtml !== html) {
    html = newHtml;
    console.log(`   🖼️  Added lazy loading: ${path.basename(filePath)}`);
  }
  
  // 3. Replace Tailwind CDN with local reference (optional - create CSS file)
  if (html.includes('cdn.tailwindcss.com')) {
    // Add a comment to indicate Tailwind is needed
    // We'll create a pre-built CSS file separately
    // For now, just add a fallback local CSS link before the CDN
    if (!html.includes('tailwind-local.css')) {
      html = html.replace(
        '<script src="https://cdn.tailwindcss.com"></script>',
        `<!-- Tailwind CSS - Production: use compiled version -->
    <link rel="stylesheet" href="../css/tailwind-utilities.css">
    <script src="https://cdn.tailwindcss.com"></script>`
      );
      modified = true;
      console.log(`   🎨 Added local Tailwind fallback: ${path.basename(filePath)}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

// ============================================================================
// MAIN
// ============================================================================
function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   BIO-CLINIC - FIX RESIDUAL ISSUES                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  let filesModified = 0;
  
  // Process pages directory
  const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  console.log(`📁 Processing ${pageFiles.length} pages...\n`);
  
  for (const file of pageFiles) {
    const filePath = path.join(PAGES_DIR, file);
    if (processFile(filePath)) {
      filesModified++;
    }
  }
  
  // Process index.html
  const indexPath = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('\n📁 Processing index.html...\n');
    if (processFile(indexPath)) {
      filesModified++;
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         RIEPILOGO                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`   ✅ Files modified: ${filesModified}`);
  console.log('\n🎉 COMPLETATO!');
}

main();
