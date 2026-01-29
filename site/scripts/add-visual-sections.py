#!/usr/bin/env python3
"""
Aggiunge le sezioni visive (Cosa Curo, Pubblicazioni) alle pagine profilo
"""

import json
import re
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent
DATA_DIR = SITE_ROOT / "data" / "entities"
EQUIPE_DIR = SITE_ROOT / "equipe"

def load_extended_data():
    with open(DATA_DIR / "physicians-extended.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_sintomi_html(sintomi):
    if not sintomi:
        return ""
    
    tags = '\n                '.join([f'<span class="sintomo-tag">{s}</span>' for s in sintomi[:12]])
    
    return f'''
          <!-- Sezione Cosa Curo -->
          <div class="sintomi-section" id="cosa-curo">
            <h3 class="sintomi-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Cosa Curo
            </h3>
            <div class="sintomi-tags">
                {tags}
            </div>
          </div>
'''

def generate_pubblicazioni_html(pubblicazioni):
    if not pubblicazioni:
        return ""
    
    items = '\n'.join([f'''            <li class="pubblicazione-item">
              <a href="{p['url']}" target="_blank" rel="noopener" class="pubblicazione-link">
                <span class="pubblicazione-titolo">{p['titolo']}</span>
                <span class="pubblicazione-meta">
                  {f"<em>{p['journal']}</em>" if p.get('journal') else ''}
                  {f"({p['anno']})" if p.get('anno') else ''}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </li>''' for p in pubblicazioni])
    
    return f'''
          <!-- Sezione Pubblicazioni Scientifiche -->
          <div class="pubblicazioni-section" id="pubblicazioni">
            <h3 class="pubblicazioni-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Ricerca & Pubblicazioni
            </h3>
            <p class="pubblicazioni-intro">
              Pubblicazioni scientifiche indicizzate su PubMed che attestano l'elevata competenza professionale:
            </p>
            <ul class="pubblicazioni-list">
{items}
            </ul>
            <div class="pubblicazioni-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
              <span>Ricerca verificata su PubMed</span>
            </div>
          </div>
'''

def add_css_to_page(content):
    """Aggiunge il CSS per le sezioni se non presente"""
    if 'sintomi-section' in content and '.sintomi-section' not in content:
        css = '''
  <style>
    /* Sintomi Tags */
    .sintomi-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f0f7e6 0%, #e8f5e9 100%);
      border-radius: 16px;
      border: 1px solid rgba(124, 186, 61, 0.2);
    }
    .sintomi-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      color: var(--gray-900);
      margin-bottom: 1rem;
    }
    .sintomi-title svg { color: var(--primary); }
    .sintomi-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .sintomo-tag {
      display: inline-flex;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid var(--primary);
      border-radius: 25px;
      font-size: 0.9rem;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sintomo-tag:hover {
      background: var(--primary);
      color: white;
      transform: translateY(-2px);
    }
    /* Pubblicazioni */
    .pubblicazioni-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fefce8 100%);
      border-radius: 16px;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    .pubblicazioni-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      color: var(--gray-900);
      margin-bottom: 0.75rem;
    }
    .pubblicazioni-title svg { color: #f59e0b; }
    .pubblicazioni-intro {
      color: var(--gray-600);
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
    .pubblicazioni-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .pubblicazione-item {
      background: white;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    .pubblicazione-item:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .pubblicazione-link {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      text-decoration: none;
      color: inherit;
    }
    .pubblicazione-titolo {
      flex: 1 1 100%;
      font-weight: 500;
      color: var(--gray-800);
      line-height: 1.4;
    }
    .pubblicazione-meta {
      font-size: 0.85rem;
      color: var(--gray-500);
    }
    .pubblicazione-link svg {
      color: var(--primary);
      margin-left: auto;
    }
    .pubblicazioni-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: rgba(124, 186, 61, 0.1);
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--primary);
      font-weight: 500;
    }
  </style>
'''
        content = content.replace('</head>', f'{css}\n</head>')
    return content

def main():
    print("=" * 60)
    print("ADDING VISUAL SECTIONS TO PHYSICIAN PROFILES")
    print("=" * 60)
    
    extended_data = load_extended_data()
    extended_map = extended_data.get('physicians_extended', {})
    default_sintomi = extended_data.get('default_sintomi_by_specialty', {})
    
    # Load physicians list
    with open(DATA_DIR / "physicians-complete.json", 'r', encoding='utf-8') as f:
        physicians = json.load(f)['physicians']
    
    updated = 0
    
    for physician in physicians:
        slug = physician['slug']
        html_path = EQUIPE_DIR / f"{slug}.html"
        
        if not html_path.exists():
            continue
        
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has sections
        if 'id="cosa-curo"' in content:
            continue
        
        # Get extended data
        if slug in extended_map:
            ext = extended_map[slug]
        else:
            specialty = physician.get('specialty_id', '')
            ext = {
                'sintomi': default_sintomi.get(specialty, []),
                'pubblicazioni': []
            }
        
        # Generate HTML sections
        sintomi_html = generate_sintomi_html(ext.get('sintomi', []))
        pubblicazioni_html = generate_pubblicazioni_html(ext.get('pubblicazioni', []))
        
        if not sintomi_html and not pubblicazioni_html:
            continue
        
        combined_html = sintomi_html + pubblicazioni_html
        
        # Find insertion point (after profile-bio or after first <p> in bio section)
        # Look for class="profile-bio" or similar patterns
        patterns = [
            r'(class="profile-bio"[^>]*>.*?</p>)',
            r'(class="bio-text"[^>]*>.*?</p>)',
            r'(<!-- Bio -->.*?</p>)',
        ]
        
        inserted = False
        for pattern in patterns:
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            if match:
                insert_point = match.end()
                content = content[:insert_point] + combined_html + content[insert_point:]
                inserted = True
                break
        
        if not inserted:
            # Alternative: insert before closing main or article tag
            if '</main>' in content:
                content = content.replace('</main>', f'{combined_html}\n</main>')
                inserted = True
            elif '</article>' in content:
                content = content.replace('</article>', f'{combined_html}\n</article>')
                inserted = True
        
        if inserted:
            # Add CSS if needed
            content = add_css_to_page(content)
            
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            has_pub = "📚" if ext.get('pubblicazioni') else "  "
            print(f"  ✅ {has_pub} {physician['full_name']}")
            updated += 1
    
    print(f"\n✨ Aggiornati {updated} profili con sezioni visive")

if __name__ == "__main__":
    main()
