const fs = require('fs');
const path = require('path');

// Pattern to find and replace in desktop menu
const oldDesktopMenu = `<a href="pages/ginecologia.html" title="Ginecologia e Ostetricia" role="menuitem">
              <span>👩‍⚕️</span> Ginecologia
            </a>
            <a href="pages/pma-fertilita.html" title="PMA e Fertilità" role="menuitem">
              <span>👶</span> PMA / Fertilità
            </a>
          </div>
        </li>
        
        <!-- SPECIALISTI -->`;

const newDesktopMenu = `<a href="pages/ginecologia.html" title="Ginecologia e Ostetricia" role="menuitem">
              <span>👩‍⚕️</span> Ginecologia
            </a>
            <a href="pages/pma-fertilita.html" title="PMA e Fertilità" role="menuitem">
              <span>👶</span> PMA / Fertilità
            </a>
            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #eee;">
            <span style="font-size: 0.7rem; color: #888; padding: 0.25rem 0.75rem; display: block;">Diagnostica Avanzata (Prof. Dessole)</span>
            <a href="pages/isteroscopia.html" title="Isteroscopia Diagnostica" role="menuitem">
              <span>🔍</span> Isteroscopia Diagnostica
            </a>
            <a href="pages/isterosalpingografia.html" title="Isterosalpingografia - Pervietà Tubarica" role="menuitem">
              <span>🩺</span> Isterosalpingografia (Tube)
            </a>
          </div>
        </li>
        
        <!-- SPECIALISTI -->`;

// Variant for pages/ directory (different relative paths)
const oldDesktopMenuPages = `<a href="ginecologia.html" title="Ginecologia e Ostetricia" role="menuitem">
              <span>👩‍⚕️</span> Ginecologia
            </a>
            <a href="pma-fertilita.html" title="PMA e Fertilità" role="menuitem">
              <span>👶</span> PMA / Fertilità
            </a>
          </div>
        </li>
        
        <!-- SPECIALISTI -->`;

const newDesktopMenuPages = `<a href="ginecologia.html" title="Ginecologia e Ostetricia" role="menuitem">
              <span>👩‍⚕️</span> Ginecologia
            </a>
            <a href="pma-fertilita.html" title="PMA e Fertilità" role="menuitem">
              <span>👶</span> PMA / Fertilità
            </a>
            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid #eee;">
            <span style="font-size: 0.7rem; color: #888; padding: 0.25rem 0.75rem; display: block;">Diagnostica Avanzata (Prof. Dessole)</span>
            <a href="isteroscopia.html" title="Isteroscopia Diagnostica" role="menuitem">
              <span>🔍</span> Isteroscopia Diagnostica
            </a>
            <a href="isterosalpingografia.html" title="Isterosalpingografia - Pervietà Tubarica" role="menuitem">
              <span>🩺</span> Isterosalpingografia (Tube)
            </a>
          </div>
        </li>
        
        <!-- SPECIALISTI -->`;

// Mobile menu patterns
const oldMobileMenu = `<li><a href="ginecologia.html">👩‍⚕️ Ginecologia</a></li>
        <li><a href="pma-fertilita.html">👶 PMA / Fertilità</a></li>
      </ul>
    </li>
    <li class="mobile-nav-section">
      <span class="mobile-nav-section-title">Specialisti</span>`;

const newMobileMenu = `<li><a href="ginecologia.html">👩‍⚕️ Ginecologia</a></li>
        <li><a href="pma-fertilita.html">👶 PMA / Fertilità</a></li>
        <li style="padding-top: 0.5rem; border-top: 1px solid #eee; margin-top: 0.5rem;">
          <span style="font-size: 0.7rem; color: #888;">Diagnostica Avanzata</span>
        </li>
        <li><a href="isteroscopia.html">🔍 Isteroscopia</a></li>
        <li><a href="isterosalpingografia.html">🩺 Isterosalpingografia</a></li>
      </ul>
    </li>
    <li class="mobile-nav-section">
      <span class="mobile-nav-section-title">Specialisti</span>`;

const pagesDir = './pages';
let updated = 0;

fs.readdirSync(pagesDir).forEach(file => {
  if (!file.endsWith('.html')) return;
  
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Update desktop menu
  if (content.includes(oldDesktopMenuPages)) {
    content = content.replace(oldDesktopMenuPages, newDesktopMenuPages);
    modified = true;
  }
  
  // Update mobile menu
  if (content.includes(oldMobileMenu)) {
    content = content.replace(oldMobileMenu, newMobileMenu);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    updated++;
    console.log(`✅ Updated: ${file}`);
  }
});

console.log(`\n📊 Total: ${updated} files updated`);
