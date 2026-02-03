#!/usr/bin/env node
/**
 * GTM INJECTION SCRIPT - Bio-Clinic
 * ================================
 * Inietta Google Tag Manager in tutti i file HTML del progetto
 * 
 * GTM ID: GTM-PWZWX5RS
 * 
 * Regole:
 * 1. Head Injection: subito dopo <head>
 * 2. Body Injection: subito dopo <body>
 * 3. Idempotenza: salta file già processati
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAZIONE
// ============================================
const GTM_ID = 'GTM-PWZWX5RS';

const GTM_HEAD_CODE = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY_CODE = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

// Directory da escludere
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'backups',
  'backup',
  'output',
  'components',
  'templates'
];

// ============================================
// STATISTICHE
// ============================================
let stats = {
  scanned: 0,
  modified: 0,
  skipped: 0,
  errors: 0,
  files: {
    modified: [],
    skipped: [],
    errors: []
  }
};

// ============================================
// FUNZIONI UTILITY
// ============================================

/**
 * Scansiona ricorsivamente una directory per trovare file HTML
 */
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Salta directory escluse
      if (EXCLUDED_DIRS.includes(file)) {
        continue;
      }
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Verifica se il file contiene già il GTM
 */
function hasGTM(content) {
  return content.includes(GTM_ID);
}

/**
 * Inietta il codice GTM nel file HTML
 */
function injectGTM(content) {
  let modified = content;
  
  // 1. Iniezione nel HEAD (subito dopo <head>)
  // Gestisce vari formati: <head>, <head >, <HEAD>, etc.
  const headRegex = /(<head[^>]*>)/i;
  if (headRegex.test(modified)) {
    modified = modified.replace(headRegex, `$1\n${GTM_HEAD_CODE}`);
  }
  
  // 2. Iniezione nel BODY (subito dopo <body>)
  // Gestisce vari formati: <body>, <body class="...">, etc.
  const bodyRegex = /(<body[^>]*>)/i;
  if (bodyRegex.test(modified)) {
    modified = modified.replace(bodyRegex, `$1\n${GTM_BODY_CODE}`);
  }
  
  return modified;
}

/**
 * Processa un singolo file HTML
 */
function processFile(filePath) {
  stats.scanned++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Controlla idempotenza
    if (hasGTM(content)) {
      stats.skipped++;
      stats.files.skipped.push(filePath);
      return { status: 'skipped', path: filePath };
    }
    
    // Inietta GTM
    const modifiedContent = injectGTM(content);
    
    // Verifica che le modifiche siano state applicate
    if (modifiedContent === content) {
      stats.errors++;
      stats.files.errors.push({ path: filePath, error: 'No <head> or <body> tag found' });
      return { status: 'error', path: filePath, error: 'No injection points found' };
    }
    
    // Scrivi il file modificato
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    
    stats.modified++;
    stats.files.modified.push(filePath);
    return { status: 'modified', path: filePath };
    
  } catch (error) {
    stats.errors++;
    stats.files.errors.push({ path: filePath, error: error.message });
    return { status: 'error', path: filePath, error: error.message };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     GTM INJECTION PROTOCOL - BIO-CLINIC                      ║');
console.log('║     Google Tag Manager: ' + GTM_ID + '                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

const startTime = Date.now();
const rootDir = process.cwd();

console.log(`📂 Scanning directory: ${rootDir}`);
console.log(`🚫 Excluded directories: ${EXCLUDED_DIRS.join(', ')}`);
console.log('');

// Trova tutti i file HTML
const htmlFiles = findHtmlFiles(rootDir);
console.log(`📄 Found ${htmlFiles.length} HTML files`);
console.log('');

// Processa ogni file
console.log('🔄 Processing files...');
console.log('─'.repeat(60));

for (const filePath of htmlFiles) {
  const relativePath = path.relative(rootDir, filePath);
  const result = processFile(filePath);
  
  switch (result.status) {
    case 'modified':
      console.log(`✅ MODIFIED: ${relativePath}`);
      break;
    case 'skipped':
      console.log(`⏭️  SKIPPED:  ${relativePath} (GTM already present)`);
      break;
    case 'error':
      console.log(`❌ ERROR:    ${relativePath} - ${result.error}`);
      break;
  }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// ============================================
// REPORT FINALE
// ============================================
console.log('');
console.log('═'.repeat(60));
console.log('');
console.log('📊 GTM INJECTION REPORT');
console.log('─'.repeat(60));
console.log(`   📄 Files scanned:    ${stats.scanned}`);
console.log(`   ✅ Files modified:   ${stats.modified}`);
console.log(`   ⏭️  Files skipped:    ${stats.skipped}`);
console.log(`   ❌ Files with errors: ${stats.errors}`);
console.log(`   ⏱️  Execution time:   ${duration}s`);
console.log('─'.repeat(60));
console.log('');

if (stats.modified > 0) {
  console.log('🎯 GTM INJECTION SUCCESSFUL!');
  console.log(`   ${stats.modified} pages are now tracking with GTM-${GTM_ID}`);
} else if (stats.skipped === stats.scanned) {
  console.log('ℹ️  ALL FILES ALREADY HAVE GTM');
  console.log('   No modifications needed.');
} else {
  console.log('⚠️  INJECTION COMPLETED WITH ISSUES');
  console.log('   Check the error log above.');
}

console.log('');
console.log('═'.repeat(60));

// Exit code basato sui risultati
process.exit(stats.errors > 0 ? 1 : 0);
