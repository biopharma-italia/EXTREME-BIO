#!/usr/bin/env python3
"""
Fix per le team cards - ripristina struttura corretta
"""

import re
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent

def fix_ginecologia():
    """Fix ginecologia page with correct structure"""
    path = SITE_ROOT / 'pages' / 'ginecologia.html'
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Trova la sezione team e sostituiscila completamente
    team_section = '''      <div class="team-grid" data-animate data-delay="100">
        <a href="../equipe/salvatore-dessole.html" class="team-member team-member-clickable" title="Vedi profilo di Prof. Salvatore Dessole - Direttore Sanitario">
          <div class="team-avatar" style="background: var(--primary); color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Prof. Salvatore Dessole</h4>
          <p class="team-role">Direttore Sanitario</p>
          <p style="font-size: 0.8rem; color: var(--gray-500);">Professore Emerito</p>
        </a>
        <a href="../equipe/francesco-dessole.html" class="team-member team-member-clickable" title="Vedi profilo di Dott. Francesco Dessole - Ginecologo">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott. Francesco Dessole</h4>
          <p class="team-role">Ginecologo</p>
        </a>
        <a href="../equipe/margherita-dessole.html" class="team-member team-member-clickable" title="Vedi profilo di Dott.ssa Margherita Dessole - Ginecologa">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Margherita Dessole</h4>
          <p class="team-role">Ginecologa</p>
        </a>
        <a href="../equipe/paolo-dessole.html" class="team-member team-member-clickable" title="Vedi profilo di Dott. Paolo Dessole - Ginecologo">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott. Paolo Dessole</h4>
          <p class="team-role">Ginecologo</p>
        </a>
        <a href="../equipe/antonella-pruneddu.html" class="team-member team-member-clickable" title="Vedi profilo di Dott.ssa Antonella Pruneddu - Ginecologa">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Antonella Pruneddu</h4>
          <p class="team-role">Ginecologa</p>
        </a>
      </div>'''
    
    # Pattern per la sezione team-grid corrotta
    pattern = r'<div class="team-grid" data-animate data-delay="100">.*?</div>\s*\n\s*<!-- Ostetriche -->'
    
    replacement = team_section + '\n      \n      <!-- Ostetriche -->'
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ ginecologia.html - Fixed")

def fix_laboratorio():
    """Fix laboratorio page"""
    path = SITE_ROOT / 'pages' / 'laboratorio.html'
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Cerca e correggi la sezione team
    team_section = '''      <div class="team-grid" style="max-width: 600px; margin: 0 auto;" data-animate data-delay="100">
        <a href="../equipe/cinzia-guarino.html" class="team-member team-member-clickable" title="Vedi profilo di Dott.ssa Cinzia Guarino - Biologa">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Cinzia Guarino</h4>
          <p class="team-role">Biologa</p>
        </a>
        <a href="../equipe/gloria-reggiani.html" class="team-member team-member-clickable" title="Vedi profilo di Dott.ssa Gloria Reggiani - Biologa">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Gloria Reggiani</h4>
          <p class="team-role">Biologa</p>
        </a>
      </div>'''
    
    pattern = r'<div class="team-grid" style="max-width: 600px; margin: 0 auto;" data-animate data-delay="100">.*?</div>\s*\n\s*</div>\s*\n\s*</section>'
    
    replacement = team_section + '\n    </div>\n  </section>'
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ laboratorio.html - Fixed")

def fix_slim_care_donna():
    """Fix slim-care-donna page"""
    path = SITE_ROOT / 'pages' / 'slim-care-donna.html'
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern per medici non cliccabili
    # Cerca div.team-member con link interno e converti in <a>
    
    # Primo pattern: Francesco Dessole con style avatar
    old1 = '''<div class="team-member">
          <div class="team-avatar" style="background: var(--primary);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott. Francesco Dessole</h4>
          <p class="team-role">Ginecologo</p>
        </a>'''
    
    new1 = '''<a href="../equipe/francesco-dessole.html" class="team-member team-member-clickable" title="Vedi profilo di Dott. Francesco Dessole - Ginecologo">
          <div class="team-avatar" style="background: var(--primary);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott. Francesco Dessole</h4>
          <p class="team-role">Ginecologo</p>
        </a>'''
    
    content = content.replace(old1, new1)
    
    # Secondo pattern: Irene Aini
    old2 = '''<div class="team-member">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Irene Aini</h4>
          <p class="team-role">Endocrinologa</p>
        </a>'''
    
    new2 = '''<a href="../equipe/irene-aini.html" class="team-member team-member-clickable" title="Vedi profilo di Dott.ssa Irene Aini - Endocrinologa">
          <div class="team-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h4 class="team-name">Dott.ssa Irene Aini</h4>
          <p class="team-role">Endocrinologa</p>
        </a>'''
    
    content = content.replace(old2, new2)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ slim-care-donna.html - Fixed")

if __name__ == '__main__':
    print("Fixing team cards...")
    fix_ginecologia()
    fix_laboratorio()
    fix_slim_care_donna()
    print("Done!")
