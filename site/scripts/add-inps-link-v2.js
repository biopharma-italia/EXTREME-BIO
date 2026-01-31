const fs = require('fs');
const path = require('path');

const pagesDir = './pages';

// Get all HTML files
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has INPS link
  if (content.includes('screening-inps-sardegna.html')) {
    return;
  }
  
  // Pattern 1: Desktop menu - after Slim Care Donna, before </div></li>
  const desktopPattern = /(<a href="slim-care-donna\.html"[^>]*>[\s\S]*?Slim Care Donna[\s\S]*?<\/a>)\s*(<\/div>\s*<\/li>)/;
  
  const inpsLinkDesktop = `$1
            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #eee;">
            <a href="screening-inps-sardegna.html" title="Screening INPS Sardegna 2025-2026" role="menuitem" style="background: #E8F4FD;">
              <span>🏆</span> <strong>Screening INPS</strong> <span style="background: #0066CC; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">NEW</span>
            </a>
          $2`;
  
  if (desktopPattern.test(content)) {
    content = content.replace(desktopPattern, inpsLinkDesktop);
    
    // Pattern 2: Mobile menu - after Slim Care Donna li, before </ul></li>
    const mobilePattern = /(<li><a href="slim-care-donna\.html"[^>]*>💗 Slim Care Donna<\/a><\/li>)\s*(<\/ul>\s*<\/li>)/;
    
    const inpsLinkMobile = `$1
        <li><a href="screening-inps-sardegna.html" style="background: #E8F4FD; color: #0066CC; font-weight: 600;">🏆 Screening INPS</a></li>
      $2`;
    
    if (mobilePattern.test(content)) {
      content = content.replace(mobilePattern, inpsLinkMobile);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file} - Desktop pattern not found`);
  }
});

console.log(`\n📊 Total: ${updatedCount} files updated`);
