#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  BIO-CLINIC SASSARI - SITE VALIDATOR v2.0                                    ║
║  Validatore RIGOROSO basato su SCHEMA-VALIDAZIONE.json                       ║
║  Ultimo aggiornamento: 2026-01-28                                            ║
║                                                                               ║
║  Esegui con: python3 scripts/validate-site-v2.py                             ║
║  Esegui con fix automatico: python3 scripts/validate-site-v2.py --fix        ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict

# Colori per output
class Colors:
    OK = '\033[92m'
    WARNING = '\033[93m'
    ERROR = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def colorize(text, color):
    return f"{color}{text}{Colors.END}"

class SiteValidator:
    def __init__(self, site_dir):
        self.site_dir = Path(site_dir)
        self.errors = []
        self.warnings = []
        self.pages_validated = 0
        self.schema = self.load_schema()
        self.physicians = self.load_physicians()
        self.equipe_files = self.get_equipe_files()
        
    def load_schema(self):
        """Carica lo schema di validazione"""
        schema_path = self.site_dir / 'data' / 'SCHEMA-VALIDAZIONE.json'
        if schema_path.exists():
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_physicians(self):
        """Carica database medici"""
        physicians_path = self.site_dir / 'data' / 'entities' / 'physicians-complete.json'
        if physicians_path.exists():
            with open(physicians_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {p['slug']: p for p in data.get('physicians', data)}
        return {}
    
    def get_equipe_files(self):
        """Ottiene lista file équipe"""
        equipe_dir = self.site_dir / 'equipe'
        if equipe_dir.exists():
            return {f.stem for f in equipe_dir.glob('*.html') if f.stem != 'index'}
        return set()
    
    def add_error(self, code, page, message):
        self.errors.append({
            'code': code,
            'page': page,
            'message': message
        })
    
    def add_warning(self, page, message):
        self.warnings.append({
            'page': page,
            'message': message
        })
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 1: TAG HTML BILANCIATI
    # ═══════════════════════════════════════════════════════════════
    def validate_html_tags(self, file_path, content):
        """Verifica che i tag HTML siano bilanciati"""
        page_name = str(file_path.relative_to(self.site_dir))
        tags_to_check = ['div', 'section', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'span', 'ul', 'li']
        
        for tag in tags_to_check:
            # Conta aperture e chiusure
            open_pattern = rf'<{tag}(?:\s[^>]*)?(?<!/)>'
            close_pattern = rf'</{tag}>'
            
            opens = len(re.findall(open_pattern, content, re.IGNORECASE))
            closes = len(re.findall(close_pattern, content, re.IGNORECASE))
            
            if opens != closes:
                # Per header, è critico
                if tag == 'header':
                    self.add_error('E002', page_name, f"Tag <{tag}> sbilanciato: {opens} aperti, {closes} chiusi")
                elif abs(opens - closes) > 2:
                    self.add_error('E001', page_name, f"Tag <{tag}> gravemente sbilanciato: {opens} aperti, {closes} chiusi")
                else:
                    self.add_warning(page_name, f"Tag <{tag}> lievemente sbilanciato: {opens} aperti, {closes} chiusi")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 2: LINK MEDICI
    # ═══════════════════════════════════════════════════════════════
    def validate_physician_links(self, file_path, content):
        """Verifica che tutti i medici menzionati in sezioni team abbiano link"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        # Escludi pagine che non dovrebbero avere link medici inline
        excluded_pages = ['index.html', 'privacy.html', 'cookie.html', 'contatti.html']
        if any(excl in page_name for excl in excluded_pages):
            return
        
        # Escludi pagine équipe (i link sono nella struttura card, non nel team-name)
        if 'equipe/' in page_name:
            return
        
        # Pattern per trovare nomi di medici in team-name (sezione team delle specialità)
        # SOLO il pattern team-name nelle pagine specialità
        # NOTA: Se team-name è dentro un <a class="team-member-clickable">, il link c'è già sul contenitore
        
        # Prima verifica se la card è già cliccabile (link sul contenitore)
        clickable_cards = set(re.findall(r'<a[^>]*class="[^"]*team-member-clickable[^"]*"[^>]*>.*?<h4[^>]*class=["\']team-name["\'][^>]*>(.*?)</h4>', content, re.DOTALL | re.IGNORECASE))
        clickable_names = {re.sub(r'<[^>]+>', '', m).strip() for m in clickable_cards}
        
        team_patterns = [
            r'<h4[^>]*class=["\']team-name["\'][^>]*>(.*?)</h4>',
        ]
        
        for pattern in team_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                name_clean = re.sub(r'<[^>]+>', '', match).strip()
                
                # Salta se il nome è in una card cliccabile
                if name_clean in clickable_names:
                    continue
                
                # Controlla se contiene un link interno
                if '<a ' not in match.lower():
                    # Ignora contenuti troppo corti o che non sembrano nomi
                    if name_clean and len(name_clean) > 8 and ('Dott' in name_clean or 'Prof' in name_clean):
                        self.add_error('E004', page_name, f"Medico '{name_clean[:50]}' senza link al profilo")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 3: CONSISTENZA MENU
    # ═══════════════════════════════════════════════════════════════
    def validate_menu_consistency(self, file_path, content, reference_menu=None):
        """Verifica che il menu sia consistente"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        # Estrai voci menu dal nav principale
        nav_match = re.search(r'<nav class="nav"[^>]*>.*?</nav>', content, re.DOTALL | re.IGNORECASE)
        if not nav_match:
            self.add_warning(page_name, "Nav principale non trovato")
            return None
        
        nav_content = nav_match.group()
        
        # Estrai label dei link
        menu_items = re.findall(r'<a[^>]*class="nav-link[^"]*"[^>]*>([^<]+)<', nav_content)
        menu_items = [item.strip() for item in menu_items if item.strip()]
        
        # Normalizza rimuovendo badge e caratteri speciali
        menu_items_clean = []
        for item in menu_items:
            clean = re.sub(r'\s+', ' ', item).strip()
            if clean not in ['', 'NEW']:
                menu_items_clean.append(clean)
        
        if reference_menu:
            if set(menu_items_clean) != set(reference_menu):
                diff = set(menu_items_clean) ^ set(reference_menu)
                self.add_error('E003', page_name, f"Menu inconsistente. Differenze: {diff}")
        
        return menu_items_clean
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 4: PATH CORRETTI
    # ═══════════════════════════════════════════════════════════════
    def validate_paths(self, file_path, content):
        """Verifica che i path siano relativi e corretti"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        # Determina profondità pagina
        rel_path = file_path.relative_to(self.site_dir)
        depth = len(rel_path.parts) - 1  # -1 per il file stesso
        
        # Cerca path assoluti (errati)
        absolute_paths = re.findall(r'(?:href|src)=["\']/((?:equipe|css|js|images)/[^"\']+)["\']', content)
        for path in absolute_paths:
            self.add_error('E005', page_name, f"Path assoluto trovato: /{path} - deve essere relativo")
        
        # Verifica che link équipe esistano
        equipe_links = re.findall(r'href=["\'](?:\.\./)*equipe/([^"\']+\.html)["\']', content)
        for link in equipe_links:
            slug = link.replace('.html', '')
            if slug != 'index' and slug not in self.equipe_files:
                self.add_error('E006', page_name, f"Pagina équipe mancante: equipe/{link}")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 5: JSON-LD
    # ═══════════════════════════════════════════════════════════════
    def validate_json_ld(self, file_path, content):
        """Verifica sintassi JSON-LD"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        json_ld_matches = re.findall(
            r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            content, 
            re.DOTALL | re.IGNORECASE
        )
        
        for i, json_ld in enumerate(json_ld_matches):
            try:
                json.loads(json_ld)
            except json.JSONDecodeError as e:
                self.add_error('E007', page_name, f"JSON-LD #{i+1} sintatticamente errato: {str(e)[:50]}")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 6: META TAGS
    # ═══════════════════════════════════════════════════════════════
    def validate_meta(self, file_path, content):
        """Verifica meta tags SEO"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        # Verifica title
        if not re.search(r'<title>[^<]+</title>', content, re.IGNORECASE):
            self.add_error('E008', page_name, "Tag <title> mancante")
        
        # Verifica meta description
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if not desc_match:
            desc_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
        
        if not desc_match:
            self.add_error('E008', page_name, "Meta description mancante")
        elif len(desc_match.group(1)) > 160:
            self.add_warning(page_name, f"Meta description troppo lunga ({len(desc_match.group(1))} chars, max 160)")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 7: FOOTER
    # ═══════════════════════════════════════════════════════════════
    def validate_footer(self, file_path, content):
        """Verifica presenza footer"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        if not re.search(r'<footer[^>]*class=["\']footer["\']', content, re.IGNORECASE):
            # Alcune pagine (privacy, cookie) possono avere footer minimal
            if 'privacy' not in page_name.lower() and 'cookie' not in page_name.lower():
                self.add_warning(page_name, "Footer principale non trovato")
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDAZIONE 8: MOBILE NAV
    # ═══════════════════════════════════════════════════════════════
    def validate_mobile(self, file_path, content):
        """Verifica struttura mobile"""
        page_name = str(file_path.relative_to(self.site_dir))
        
        if not re.search(r'id=["\']mobile-nav["\']', content, re.IGNORECASE):
            self.add_warning(page_name, "Mobile nav non trovato")
        
        if not re.search(r'class=["\'][^"\']*mobile-overlay[^"\']*["\']', content, re.IGNORECASE):
            self.add_warning(page_name, "Mobile overlay non trovato")
    
    # ═══════════════════════════════════════════════════════════════
    # ESEGUI TUTTE LE VALIDAZIONI
    # ═══════════════════════════════════════════════════════════════
    def validate_page(self, file_path, reference_menu=None):
        """Esegue tutte le validazioni su una pagina"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            self.add_error('E000', str(file_path), f"Impossibile leggere file: {e}")
            return None
        
        self.pages_validated += 1
        
        # Esegui tutte le validazioni
        self.validate_html_tags(file_path, content)
        self.validate_physician_links(file_path, content)
        menu = self.validate_menu_consistency(file_path, content, reference_menu)
        self.validate_paths(file_path, content)
        self.validate_json_ld(file_path, content)
        self.validate_meta(file_path, content)
        self.validate_footer(file_path, content)
        self.validate_mobile(file_path, content)
        
        return menu
    
    def run_validation(self):
        """Esegue validazione completa del sito"""
        print(colorize("╔══════════════════════════════════════════════════════════════════╗", Colors.BOLD))
        print(colorize("║  BIO-CLINIC SITE VALIDATOR v2.0                                  ║", Colors.BOLD))
        print(colorize("╚══════════════════════════════════════════════════════════════════╝", Colors.BOLD))
        print()
        
        # Trova tutte le pagine HTML (esclusi template e componenti)
        html_files = list(self.site_dir.glob('**/*.html'))
        excluded_dirs = ['node_modules', 'templates', 'components']
        excluded_files = ['profilo.html', 'master-header.html']
        html_files = [f for f in html_files 
                      if not any(excl in str(f) for excl in excluded_dirs)
                      and f.name not in excluded_files]
        
        print(f"📁 Trovate {len(html_files)} pagine HTML da validare")
        print(f"👨‍⚕️ Database medici: {len(self.physicians)} medici")
        print(f"📄 Pagine équipe: {len(self.equipe_files)} profili")
        print()
        
        # Prima validazione per ottenere menu di riferimento
        index_path = self.site_dir / 'index.html'
        reference_menu = None
        if index_path.exists():
            reference_menu = self.validate_page(index_path)
            print(f"📋 Menu di riferimento estratto: {reference_menu}")
            print()
        
        # Valida tutte le pagine
        print("🔍 Validazione in corso...")
        for html_file in html_files:
            if html_file != index_path:
                self.validate_page(html_file, reference_menu)
        
        # Report finale
        print()
        print(colorize("═══════════════════════════════════════════════════════════════════", Colors.BOLD))
        print(colorize("                         REPORT VALIDAZIONE                         ", Colors.BOLD))
        print(colorize("═══════════════════════════════════════════════════════════════════", Colors.BOLD))
        print()
        print(f"📊 Pagine validate: {self.pages_validated}")
        print(f"❌ Errori critici: {len(self.errors)}")
        print(f"⚠️  Warning: {len(self.warnings)}")
        print()
        
        # Mostra errori raggruppati per codice
        if self.errors:
            print(colorize("╔═══════════════════════════════════════════════════════════════════╗", Colors.ERROR))
            print(colorize("║                        ERRORI CRITICI                              ║", Colors.ERROR))
            print(colorize("╚═══════════════════════════════════════════════════════════════════╝", Colors.ERROR))
            
            errors_by_code = defaultdict(list)
            for err in self.errors:
                errors_by_code[err['code']].append(err)
            
            for code in sorted(errors_by_code.keys()):
                errs = errors_by_code[code]
                print(f"\n{colorize(code, Colors.ERROR)}: {len(errs)} occorrenze")
                for err in errs[:5]:  # Mostra max 5 per tipo
                    print(f"  → {err['page']}: {err['message']}")
                if len(errs) > 5:
                    print(f"  ... e altri {len(errs)-5}")
        
        # Mostra warnings
        if self.warnings:
            print()
            print(colorize("╔═══════════════════════════════════════════════════════════════════╗", Colors.WARNING))
            print(colorize("║                           WARNING                                  ║", Colors.WARNING))
            print(colorize("╚═══════════════════════════════════════════════════════════════════╝", Colors.WARNING))
            
            for warn in self.warnings[:10]:
                print(f"  ⚠️  {warn['page']}: {warn['message']}")
            if len(self.warnings) > 10:
                print(f"  ... e altri {len(self.warnings)-10} warning")
        
        # Risultato finale
        print()
        if not self.errors:
            print(colorize("✅ VALIDAZIONE COMPLETATA CON SUCCESSO!", Colors.OK))
            print(colorize("   Il sito rispetta tutte le regole dello schema", Colors.OK))
        else:
            print(colorize("❌ VALIDAZIONE FALLITA!", Colors.ERROR))
            print(colorize(f"   {len(self.errors)} errori critici da correggere", Colors.ERROR))
            print()
            print("📌 Suggerimenti di fix:")
            fix_suggestions = self.schema.get('autoFix', {})
            shown_codes = set()
            for err in self.errors:
                if err['code'] not in shown_codes and err['code'] in fix_suggestions:
                    print(f"   {err['code']}: {fix_suggestions[err['code']]}")
                    shown_codes.add(err['code'])
        
        return len(self.errors) == 0


def main():
    # Determina directory del sito
    script_dir = Path(__file__).parent
    site_dir = script_dir.parent
    
    validator = SiteValidator(site_dir)
    success = validator.run_validation()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
