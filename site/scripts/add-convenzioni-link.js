const fs = require('fs');
const path = require('path');

// Update index.html
let indexContent = fs.readFileSync('./index.html', 'utf8');
if (!indexContent.includes('convenzioni.html')) {
  // Add after INPS link in index
  indexContent = indexContent.replace(
    /(<a href="pages\/screening-inps-sardegna\.html"[^>]*>[\s\S]*?<\/a>)\s*(<\/div>\s*<\/li>\s*\n\s*<!-- LABORATORIO -->)/,
    `$1
            <a href="pages/convenzioni.html" title="Convenzioni Fondi Sanitari" role="menuitem" style="background: #F0FDF4;">
              <span>🏥</span> <strong>Convenzioni Fondi</strong>
            </a>
          $2`
  );
  fs.writeFileSync('./index.html', indexContent, 'utf8');
  console.log('✅ index.html');
}

// Update pages
const pagesDir = './pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has convenzioni link
  if (content.includes('convenzioni.html')) {
    return;
  }
  
  // Add after INPS link in pages
  const pattern = /(<a href="screening-inps-sardegna\.html"[^>]*>[\s\S]*?<\/a>)\s*(<\/div>\s*<\/li>)/;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, `$1
            <a href="convenzioni.html" title="Convenzioni Fondi Sanitari" role="menuitem" style="background: #F0FDF4;">
              <span>🏥</span> <strong>Convenzioni Fondi</strong>
            </a>
          $2`);
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file} - Pattern not found`);
  }
});

console.log(`\n📊 Total: ${updatedCount + 1} files updated (including index.html)`);
