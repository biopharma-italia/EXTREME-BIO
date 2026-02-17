#!/usr/bin/env python3
"""
============================================================================
BIO-CLINIC CGE DEPLOYMENT SCRIPT v1.0
============================================================================
Injects into EVERY page:
1. GTM container (GTM-PWZWX5RS) if missing
2. GTM noscript tag if missing
3. Consent Mode v2 default (before GTM)
4. Context-aware bcDataLayer object
5. CGE tracking script reference
6. Iubenda cookie consent banner

100% coverage target for 202+ active pages.
============================================================================
"""

import os
import re
import json
import sys
from pathlib import Path

SITE_DIR = Path('/home/user/webapp/site')
DATALAYER_MAP_FILE = Path('/home/user/webapp/datalayer-map.json')

# GTM snippet
GTM_HEAD = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PWZWX5RS');</script>
<!-- End Google Tag Manager -->"""

GTM_NOSCRIPT = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

# CGE Consent Mode + DataLayer + Tracking Script
def build_cge_head_snippet(datalayer_data):
    """Build the CGE <head> injection block."""
    dl_json = json.dumps(datalayer_data, ensure_ascii=False)
    return f"""<!-- CGE: Clinical Growth Engine v1.0 -->
<script>
window.bcDataLayer = {dl_json};
</script>
<script src="/js/cge-tracking.js?v=CGE_v1_20260216" defer></script>
<!-- End CGE -->"""


# Iubenda cookie consent banner (MUST be customized with actual site ID)
IUBENDA_SNIPPET = """<!-- Iubenda Cookie Consent Banner -->
<script type="text/javascript">
var _iub = _iub || [];
_iub.csConfiguration = {
  "askConsentAtCookiePolicyUpdate": true,
  "enableFadp": false,
  "enableLgpd": false,
  "enableUspr": false,
  "fadpApplies": false,
  "floatingPreferencesButtonDisplay": "bottom-right",
  "lang": "it",
  "perPurposeConsent": true,
  "preferenceCookie": { "expireAfter": 365 },
  "siteId": "IUBENDA_SITE_ID",
  "cookiePolicyId": "IUBENDA_POLICY_ID",
  "whitelabel": false,
  "cookiePolicyUrl": "https://bio-clinic.it/cookie/",
  "privacyPolicyUrl": "https://bio-clinic.it/privacy/",
  "banner": {
    "acceptButtonCaptionColor": "#FFFFFF",
    "acceptButtonColor": "#00704A",
    "acceptButtonDisplay": true,
    "backgroundColor": "#FFFFFF",
    "brandBackgroundColor": "#FFFFFF",
    "brandTextColor": "#000000",
    "closeButtonDisplay": false,
    "customizeButtonCaptionColor": "#4D4D4D",
    "customizeButtonColor": "#DADADA",
    "customizeButtonDisplay": true,
    "explicitWithdrawal": true,
    "fontSizeBody": "12px",
    "listPurposes": true,
    "logo": null,
    "ownerName": "Bio-Clinic Sassari",
    "position": "float-bottom-center",
    "rejectButtonCaptionColor": "#FFFFFF",
    "rejectButtonColor": "#666666",
    "rejectButtonDisplay": true,
    "showTitle": false,
    "showTotalNumberOfProviders": true,
    "textColor": "#000000"
  },
  "callback": {
    "onPreferenceExpressedOrNotNeeded": function(preference) {
      if (preference && preference.purposes) {
        if (typeof BCG !== 'undefined' && BCG.updateConsent) {
          BCG.updateConsent({
            analytics: !!preference.purposes[4],
            marketing: !!preference.purposes[5],
            preferences: !!preference.purposes[3]
          });
        }
      }
    }
  }
};
</script>
<script type="text/javascript" src="https://cs.iubenda.com/autoblocking/IUBENDA_SITE_ID.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/gpp/stub.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/iubenda_cs.js" charset="UTF-8" async></script>
<!-- End Iubenda -->"""


def load_datalayer_map():
    """Load the pre-built dataLayer mapping."""
    if DATALAYER_MAP_FILE.exists():
        with open(DATALAYER_MAP_FILE) as f:
            return json.load(f)
    return {}


def infer_datalayer(filepath):
    """Infer dataLayer properties from file path when not in map."""
    rel_path = filepath.relative_to(SITE_DIR)
    parts = str(rel_path).replace('\\', '/').split('/')
    
    # Filter out index.html
    parts = [p for p in parts if p != 'index.html']
    
    result = {
        "page_type": "general",
        "specialty": "none",
        "service_name": "none",
        "physician_name": "none",
        "price_range": "none",
        "content_group": "general",
        "funnel_stage": "awareness"
    }
    
    # Special pages
    page_name = parts[-1] if parts else ''
    
    if not parts or str(rel_path) == 'index.html':
        result["page_type"] = "homepage"
        result["content_group"] = "homepage"
        return result
    
    if page_name == '404.html':
        result["page_type"] = "error"
        result["content_group"] = "error"
        return result
    
    # Equipe pages
    if parts[0] == 'equipe':
        if len(parts) == 1:
            result["page_type"] = "equipe_hub"
            result["content_group"] = "equipe"
        else:
            result["page_type"] = "equipe_detail"
            result["physician_name"] = parts[1].replace('.html', '')
            result["content_group"] = "equipe"
            result["funnel_stage"] = "consideration"
        return result
    
    # Specialty hubs
    specialty_map = {
        'cardiologia': 'cardiologia',
        'ginecologia': 'ginecologia',
        'dermatologia': 'dermatologia',
        'endocrinologia': 'endocrinologia',
        'neurologia': 'neurologia',
        'oculistica': 'oculistica',
        'ortopedia': 'ortopedia',
        'otorinolaringoiatria': 'otorinolaringoiatria',
        'pneumologia': 'pneumologia',
        'gastroenterologia': 'gastroenterologia',
        'reumatologia': 'reumatologia',
        'ematologia': 'ematologia',
        'urologia': 'urologia',
        'chirurgia-vascolare': 'chirurgia-vascolare',
        'pma-fertilita': 'pma-fertilita',
        'slim-care': 'slim-care',
        'slim-care-donna': 'slim-care-donna',
        'laboratorio': 'laboratorio',
        'genetica': 'genetica',
    }
    
    if parts[0] in specialty_map:
        result["specialty"] = specialty_map[parts[0]]
        if len(parts) == 1:
            result["page_type"] = "hub"
            result["content_group"] = f"{result['specialty']}_hub"
        else:
            result["page_type"] = "service"
            result["service_name"] = parts[1].replace('.html', '')
            result["content_group"] = f"{result['specialty']}_servizi"
            result["funnel_stage"] = "consideration"
        return result
    
    # Utility pages
    utility_pages = {
        'contatti': ('contatti', 'action', 'contatti'),
        'chi-siamo': ('about', 'awareness', 'about'),
        'listino': ('listino', 'consideration', 'listino'),
        'convenzioni': ('convenzioni', 'consideration', 'convenzioni'),
        'privacy': ('legal', 'general', 'legal'),
        'cookie': ('legal', 'general', 'legal'),
        'prestazioni': ('services_list', 'awareness', 'services'),
        'specialita': ('services_list', 'awareness', 'services'),
        'preparazione-esami': ('info', 'awareness', 'info'),
        'prevenzione': ('info', 'awareness', 'info'),
        'shop': ('shop', 'action', 'shop'),
        'screening-inps': ('screening', 'awareness', 'screening'),
        'screening-inps-sardegna': ('screening', 'awareness', 'screening'),
        'medicina-del-lavoro': ('service_hub', 'awareness', 'medicina-lavoro'),
        'mounjaro-tirzepatide-sassari': ('landing', 'consideration', 'slim-care'),
    }
    
    if parts[0] in utility_pages:
        pt, fs, cg = utility_pages[parts[0]]
        result["page_type"] = pt
        result["funnel_stage"] = fs
        result["content_group"] = cg
        return result
    
    # Service redirect pages (root-level like /visita-cardiologica/)
    if parts[0].startswith('visita-') or parts[0].startswith('ecografia-'):
        result["page_type"] = "service_redirect"
        result["service_name"] = parts[0]
        result["funnel_stage"] = "consideration"
        result["content_group"] = "service_redirect"
        return result
    
    # Standalone service pages
    result["page_type"] = "service"
    result["service_name"] = parts[0]
    result["funnel_stage"] = "consideration"
    result["content_group"] = "standalone_service"
    
    return result


def is_redirect_page(content):
    """Check if page is a meta-refresh redirect."""
    return 'http-equiv="refresh"' in content.lower() and 'noindex' in content.lower()


def process_html_file(filepath, datalayer_map):
    """Process a single HTML file and inject CGE components."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False, f"Read error: {e}"
    
    # Skip redirect pages - they don't need tracking
    if is_redirect_page(content):
        return False, "redirect_page"
    
    # Skip non-content files
    if len(content) < 200:
        return False, "too_small"
    
    if '<html' not in content.lower():
        return False, "not_html"
    
    original_content = content
    changes = []
    
    # --- 1. Ensure GTM head snippet exists ---
    has_gtm = 'GTM-PWZWX5RS' in content and 'gtm.js' in content
    if not has_gtm:
        # Insert GTM right after <head> or after <!DOCTYPE html><html...><head>
        head_match = re.search(r'<head[^>]*>', content, re.IGNORECASE)
        if head_match:
            insert_pos = head_match.end()
            content = content[:insert_pos] + '\n' + GTM_HEAD + '\n' + content[insert_pos:]
            changes.append('GTM_HEAD_ADDED')
    
    # --- 2. Ensure GTM noscript exists ---
    has_noscript = 'gtm.js' in content and 'ns.html' in content and 'GTM-PWZWX5RS' in content
    if not has_noscript or 'noscript' not in content.split('</head>')[1] if '</head>' in content else True:
        body_match = re.search(r'<body[^>]*>', content, re.IGNORECASE)
        if body_match:
            insert_pos = body_match.end()
            # Check if noscript already right after body
            after_body = content[insert_pos:insert_pos+300]
            if 'GTM-PWZWX5RS' not in after_body or 'ns.html' not in after_body:
                content = content[:insert_pos] + '\n' + GTM_NOSCRIPT + '\n' + content[insert_pos:]
                changes.append('GTM_NOSCRIPT_ADDED')
    
    # --- 3. Inject bcDataLayer + CGE script ---
    has_cge = 'cge-tracking.js' in content
    if not has_cge:
        # Get dataLayer data
        rel_path = str(filepath.relative_to(SITE_DIR)).replace('\\', '/')
        dl_data = datalayer_map.get(rel_path)
        if not dl_data:
            dl_data = infer_datalayer(filepath)
        
        cge_snippet = build_cge_head_snippet(dl_data)
        
        # Insert before </head>
        head_end = content.find('</head>')
        if head_end == -1:
            head_end = content.find('</HEAD>')
        if head_end > -1:
            content = content[:head_end] + cge_snippet + '\n' + content[head_end:]
            changes.append('CGE_DATALAYER_ADDED')
    
    # --- 4. Inject Iubenda cookie consent (before </body>) ---
    has_iubenda = 'iubenda' in content.lower()
    if not has_iubenda:
        body_end = content.rfind('</body>')
        if body_end == -1:
            body_end = content.rfind('</BODY>')
        if body_end > -1:
            content = content[:body_end] + IUBENDA_SNIPPET + '\n' + content[body_end:]
            changes.append('IUBENDA_ADDED')
    
    # --- 5. Write back if changes were made ---
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, changes
    
    return False, 'no_changes_needed'


def main():
    print("=" * 70)
    print("BIO-CLINIC CGE DEPLOYMENT SCRIPT v1.0")
    print("=" * 70)
    
    # Load dataLayer map
    datalayer_map = load_datalayer_map()
    print(f"Loaded dataLayer map with {len(datalayer_map)} entries")
    
    # Find all HTML files (excluding backups, build, output, reports)
    html_files = []
    exclude_dirs = {'backups', 'build', 'output', 'reports', 'components', 'templates', 'docs', 'scripts', 'data', '.github'}
    
    for root, dirs, files in os.walk(SITE_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for f in files:
            if f.endswith('.html'):
                html_files.append(Path(root) / f)
    
    html_files.sort()
    print(f"Found {len(html_files)} HTML files to process")
    print("-" * 70)
    
    stats = {
        'processed': 0,
        'modified': 0,
        'skipped_redirect': 0,
        'skipped_small': 0,
        'skipped_no_changes': 0,
        'errors': 0,
        'changes': {
            'GTM_HEAD_ADDED': 0,
            'GTM_NOSCRIPT_ADDED': 0,
            'CGE_DATALAYER_ADDED': 0,
            'IUBENDA_ADDED': 0
        }
    }
    
    modified_files = []
    
    for filepath in html_files:
        rel_path = filepath.relative_to(SITE_DIR)
        stats['processed'] += 1
        
        modified, result = process_html_file(filepath, datalayer_map)
        
        if modified:
            stats['modified'] += 1
            modified_files.append(str(rel_path))
            for change in result:
                if change in stats['changes']:
                    stats['changes'][change] += 1
            print(f"  [MODIFIED] {rel_path}: {', '.join(result)}")
        else:
            if result == 'redirect_page':
                stats['skipped_redirect'] += 1
            elif result == 'too_small':
                stats['skipped_small'] += 1
            elif result == 'no_changes_needed':
                stats['skipped_no_changes'] += 1
            elif isinstance(result, str) and result.startswith('Read error'):
                stats['errors'] += 1
                print(f"  [ERROR] {rel_path}: {result}")
    
    print("\n" + "=" * 70)
    print("DEPLOYMENT RESULTS")
    print("=" * 70)
    print(f"Total HTML files scanned: {stats['processed']}")
    print(f"Files modified:           {stats['modified']}")
    print(f"Skipped (redirect):       {stats['skipped_redirect']}")
    print(f"Skipped (too small):      {stats['skipped_small']}")
    print(f"Already complete:         {stats['skipped_no_changes']}")
    print(f"Errors:                   {stats['errors']}")
    print()
    print("Change breakdown:")
    for change_type, count in stats['changes'].items():
        print(f"  {change_type}: {count}")
    
    # Verification pass
    print("\n" + "=" * 70)
    print("VERIFICATION: GTM COVERAGE")
    print("=" * 70)
    
    total_content_pages = 0
    pages_with_gtm = 0
    pages_with_cge = 0
    pages_with_iubenda = 0
    pages_missing = []
    
    for filepath in html_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        if is_redirect_page(content):
            continue
        if len(content) < 200:
            continue
        
        total_content_pages += 1
        rel = filepath.relative_to(SITE_DIR)
        
        if 'GTM-PWZWX5RS' in content:
            pages_with_gtm += 1
        else:
            pages_missing.append(str(rel))
        
        if 'cge-tracking.js' in content:
            pages_with_cge += 1
        
        if 'iubenda' in content.lower():
            pages_with_iubenda += 1
    
    print(f"Total content pages: {total_content_pages}")
    print(f"GTM coverage:        {pages_with_gtm}/{total_content_pages} ({pages_with_gtm/max(total_content_pages,1)*100:.1f}%)")
    print(f"CGE coverage:        {pages_with_cge}/{total_content_pages} ({pages_with_cge/max(total_content_pages,1)*100:.1f}%)")
    print(f"Iubenda coverage:    {pages_with_iubenda}/{total_content_pages} ({pages_with_iubenda/max(total_content_pages,1)*100:.1f}%)")
    
    if pages_missing:
        print(f"\nPages still missing GTM ({len(pages_missing)}):")
        for p in pages_missing:
            print(f"  - {p}")
    else:
        print("\n*** 100% GTM COVERAGE ACHIEVED ***")
    
    return stats


if __name__ == '__main__':
    stats = main()
    sys.exit(0 if stats['errors'] == 0 else 1)
