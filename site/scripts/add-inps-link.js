const fs = require('fs');
const path = require('path');

const pagesDir = './pages';

// Pattern to find and replace in Slim Care dropdown
const oldPattern = `<a href="slim-care-donna.html" title="Slim Care Donna - Dimagrimento Femminile" role="menuitem">
              <span style="color: #E91E8C;">💗</span> Slim Care Donna
            </a>
          </div>
        </li>
        
        <!-- LABORATORIO -->`;

const newPattern = `<a href="slim-care-donna.html" title="Slim Care Donna - Dimagrimento Femminile" role="menuitem">
              <span style="color: #E91E8C;">💗</span> Slim Care Donna
            </a>
            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #eee;">
            <a href="screening-inps-sardegna.html" title="Screening INPS Sardegna 2025-2026" role="menuitem" style="background: #E8F4FD;">
              <span>🏆</span> <strong>Screening INPS</strong> <span style="background: #0066CC; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">NEW</span>
            </a>
          </div>
        </li>
        
        <!-- LABORATORIO -->`;

// Get all HTML files in pages directory
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip the screening-inps-sardegna.html page itself (already has the link)
  if (file === 'screening-inps-sardegna.html') return;
  
  // Check if already has INPS link
  if (content.includes('screening-inps-sardegna.html')) {
    console.log(`⏭ ${file} - Already has INPS link`);
    return;
  }
  
  // Try to add the link
  if (content.includes('Slim Care Donna') && content.includes('<!-- LABORATORIO -->')) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`✅ ${file} - Added INPS link`);
  } else {
    console.log(`⚠️ ${file} - Pattern not found`);
  }
});

console.log(`\n📊 Total: ${updatedCount} files updated`);
