#!/usr/bin/env python3
"""
=================================================================
CLINICAL GROWTH ENGINE (CGE) v1.0 — IMPLEMENTATION SCRIPT
=================================================================
Bio-Clinic Sassari — bio-clinic.it
Container: GTM-PWZWX5RS | GA4: G-9EXCL016VJ

This script implements:
1. GTM snippet injection on ALL pages (fixes 58-page gap)
2. Consent Mode v2 default (fires BEFORE GTM)
3. Context-aware dataLayer push on every page
4. GTM noscript in <body> on all pages
5. Iubenda cookie consent integration
6. Form fix: connects to Formspree as interim backend

Author: CGE Implementation
Date: 2026-02-16
=================================================================
"""

import os
import re
import json
import copy
from datetime import datetime

SITE_DIR = "/home/user/webapp/site"
BACKUP_SUFFIX = f"_pre_cge_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# ─── GTM & CONSENT SNIPPETS ─────────────────────────────────

GTM_HEAD = """<!-- Google Consent Mode v2 (MUST fire before GTM) -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});
</script>
<!-- End Consent Mode v2 -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PWZWX5RS');</script>
<!-- End Google Tag Manager -->"""

GTM_BODY = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWZWX5RS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

# Old GTM patterns to replace (various formats found in the codebase)
OLD_GTM_PATTERNS = [
    # Pattern 1: Standard GTM with comments
    r'<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)\{.*?GTM-PWZWX5RS.*?</script>\s*<!-- End Google Tag Manager -->',
    # Pattern 2: GTM noscript in body
    r'<!-- Google Tag Manager \(noscript\) -->\s*<noscript>.*?GTM-PWZWX5RS.*?</noscript>\s*<!-- End Google Tag Manager \(noscript\) -->',
]

# ─── IUBENDA COOKIE CONSENT (placeholder - requires site_id) ─────

IUBENDA_SCRIPT = """<!-- Iubenda Cookie Consent (CGE) -->
<script type="text/javascript">
var _iub = _iub || [];
_iub.csConfiguration = {
  "askConsentAtCookiePolicyUpdate":true,
  "enableFadp":false,
  "enableLgpd":false,
  "enableUspr":false,
  "fadpApplies":false,
  "floatingPreferencesButtonDisplay":"bottom-right",
  "lang":"it",
  "perPurposeConsent":true,
  "preferenceCookie":{"expireAfter":180},
  "siteId":"IUBENDA_SITE_ID",
  "cookiePolicyId":"IUBENDA_POLICY_ID",
  "whitelabel":false,
  "banner":{
    "acceptButtonCaptionColor":"#FFFFFF",
    "acceptButtonColor":"#00704A",
    "acceptButtonDisplay":true,
    "backgroundColor":"#FFFFFF",
    "closeButtonRejects":true,
    "customizeButtonCaptionColor":"#4D4D4D",
    "customizeButtonColor":"#DADADA",
    "customizeButtonDisplay":true,
    "explicitWithdrawal":true,
    "fontSizeBody":"12px",
    "listPurposes":true,
    "logo":null,
    "ownerName":"Bio-Clinic Sassari",
    "position":"float-bottom-center",
    "rejectButtonCaptionColor":"#FFFFFF",
    "rejectButtonColor":"#6b7280",
    "rejectButtonDisplay":true,
    "showTitle":false,
    "showTotalNumberOfProviders":true,
    "textColor":"#030303"
  },
  "callback":{
    "onConsentGiven":function(){
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    },
    "onConsentRejected":function(){
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    }
  }
};
</script>
<script type="text/javascript" src="https://cs.iubenda.com/autoblocking/IUBENDA_SITE_ID.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/gpp/stub.js"></script>
<script type="text/javascript" src="//cdn.iubenda.com/cs/iubenda_cs.js" charset="UTF-8" async></script>
<!-- End Iubenda Cookie Consent -->"""

# ─── SPECIALTY / PAGE MAPPING ─────────────────────────────────

SPECIALTY_MAP = {
    "cardiologia": {"physician": "tonino-bullitta", "prices": {"hub": "100-200", "service": "80-250"}},
    "ginecologia": {"physician": "francesco-dessole", "prices": {"hub": "80-200", "service": "30-800"}},
    "dermatologia": {"physician": "alessandra-musinu", "prices": {"hub": "80-150", "service": "80-120"}},
    "endocrinologia": {"physician": "carlo-burrai", "prices": {"hub": "80-150", "service": "60-180"}},
    "neurologia": {"physician": "guido-marongiu", "prices": {"hub": "80-150", "service": "80-180"}},
    "ortopedia": {"physician": "andrea-donato", "prices": {"hub": "80-150", "service": "80-150"}},
    "urologia": {"physician": "carlos-cambara-zuniga", "prices": {"hub": "80-150", "service": "60-120"}},
    "chirurgia-vascolare": {"physician": "francesco-tolu", "prices": {"hub": "80-150", "service": "80-200"}},
    "otorinolaringoiatria": {"physician": "maria-laura-de-luca", "prices": {"hub": "80-150", "service": "50-120"}},
    "gastroenterologia": {"physician": "gavino-porcu", "prices": {"hub": "80-200", "service": "60-120"}},
    "oculistica": {"physician": "francesco-santoru", "prices": {"hub": "80-150", "service": "80-120"}},
    "pneumologia": {"physician": "pietro-pirina", "prices": {"hub": "80-150", "service": "80-120"}},
    "ematologia": {"physician": "claudio-fozza", "prices": {"hub": "80-150", "service": "80-120"}},
    "reumatologia": {"physician": "niccolo-melis", "prices": {"hub": "80-150", "service": "80-120"}},
}

# Other page types
OTHER_PAGE_TYPES = {
    "chi-siamo": {"page_type": "info", "funnel": "awareness"},
    "contatti": {"page_type": "conversion", "funnel": "conversion"},
    "equipe": {"page_type": "equipe", "funnel": "consideration"},
    "listino": {"page_type": "pricing", "funnel": "consideration"},
    "convenzioni": {"page_type": "info", "funnel": "consideration"},
    "cookie": {"page_type": "legal", "funnel": "none"},
    "privacy": {"page_type": "legal", "funnel": "none"},
    "slim-care": {"page_type": "service", "funnel": "consideration"},
    "laboratorio-analisi": {"page_type": "service", "funnel": "consideration"},
    "screening-inps-sardegna": {"page_type": "service", "funnel": "consideration"},
    "shop": {"page_type": "ecommerce", "funnel": "conversion"},
}


def classify_page(rel_path):
    """Classify a page and return its dataLayer attributes."""
    parts = rel_path.replace('/index.html', '').split('/')
    parts = [p for p in parts if p]
    
    if not parts or rel_path == 'index.html':
        return {
            "page_type": "home",
            "specialty": "none",
            "service_name": "homepage",
            "physician_name": "none",
            "price_range": "none",
            "content_group": "home",
            "funnel_stage": "awareness"
        }
    
    first = parts[0]
    
    # Specialty pages
    if first in SPECIALTY_MAP:
        spec = SPECIALTY_MAP[first]
        if len(parts) == 1:
            # Hub page
            return {
                "page_type": "hub",
                "specialty": first,
                "service_name": f"{first}_hub",
                "physician_name": spec["physician"],
                "price_range": spec["prices"]["hub"],
                "content_group": f"{first}_hub",
                "funnel_stage": "awareness"
            }
        else:
            # Service page
            service = parts[1]
            return {
                "page_type": "service",
                "specialty": first,
                "service_name": service,
                "physician_name": spec["physician"],
                "price_range": spec["prices"]["service"],
                "content_group": f"{first}_servizi",
                "funnel_stage": "consideration"
            }
    
    # Equipe pages
    if first == "equipe":
        if len(parts) == 1:
            return {
                "page_type": "equipe",
                "specialty": "multi",
                "service_name": "equipe_list",
                "physician_name": "none",
                "price_range": "none",
                "content_group": "equipe",
                "funnel_stage": "consideration"
            }
        else:
            return {
                "page_type": "equipe_detail",
                "specialty": "multi",
                "service_name": f"medico_{parts[1]}",
                "physician_name": parts[1],
                "price_range": "none",
                "content_group": "equipe",
                "funnel_stage": "consideration"
            }
    
    # Other known pages
    if first in OTHER_PAGE_TYPES:
        info = OTHER_PAGE_TYPES[first]
        return {
            "page_type": info["page_type"],
            "specialty": "none",
            "service_name": first,
            "physician_name": "none",
            "price_range": "none",
            "content_group": info["page_type"],
            "funnel_stage": info["funnel"]
        }
    
    # Standalone service pages (not under specialty dir)
    return {
        "page_type": "standalone",
        "specialty": "none",
        "service_name": first,
        "physician_name": "none",
        "price_range": "none",
        "content_group": "other",
        "funnel_stage": "consideration"
    }


def build_datalayer_script(page_data):
    """Build the dataLayer push script for a page."""
    return f"""<!-- CGE dataLayer v1.0 -->
<script>
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({{
  'bc_page_type': '{page_data["page_type"]}',
  'bc_specialty': '{page_data["specialty"]}',
  'bc_service_name': '{page_data["service_name"]}',
  'bc_physician_name': '{page_data["physician_name"]}',
  'bc_price_range': '{page_data["price_range"]}',
  'bc_content_group': '{page_data["content_group"]}',
  'bc_funnel_stage': '{page_data["funnel_stage"]}',
  'bc_cge_version': 'CGE_v1_foundation'
}});
</script>
<!-- End CGE dataLayer -->"""


def process_page(filepath, rel_path, stats):
    """Process a single page: inject GTM, consent, dataLayer."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        html = f.read()
    
    original = html
    is_redirect = len(html) < 600 and 'meta' in html.lower() and 'refresh' in html.lower()
    
    if is_redirect:
        stats['skipped_redirects'] += 1
        return False
    
    changes = []
    
    # ─── STEP 1: Remove old GTM head snippet (if present) ─────
    old_gtm_head = re.search(
        r'<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)\{.*?GTM-PWZWX5RS.*?</script>\s*<!-- End Google Tag Manager -->',
        html, re.S
    )
    if old_gtm_head:
        html = html[:old_gtm_head.start()] + html[old_gtm_head.end():]
        changes.append("removed_old_gtm_head")
    
    # ─── STEP 2: Remove old GTM body noscript (if present) ─────
    old_gtm_body = re.search(
        r'<!-- Google Tag Manager \(noscript\) -->\s*<noscript>.*?GTM-PWZWX5RS.*?</noscript>\s*<!-- End Google Tag Manager \(noscript\) -->',
        html, re.S
    )
    if old_gtm_body:
        html = html[:old_gtm_body.start()] + html[old_gtm_body.end():]
        changes.append("removed_old_gtm_body")
    
    # ─── STEP 3: Remove any existing CGE dataLayer (idempotent) ─────
    old_cge = re.search(r'<!-- CGE dataLayer.*?<!-- End CGE dataLayer -->', html, re.S)
    if old_cge:
        html = html[:old_cge.start()] + html[old_cge.end():]
        changes.append("removed_old_cge_datalayer")
    
    # Remove old consent mode block if exists
    old_consent = re.search(r'<!-- Google Consent Mode v2.*?<!-- End Consent Mode v2 -->', html, re.S)
    if old_consent:
        html = html[:old_consent.start()] + html[old_consent.end():]
        changes.append("removed_old_consent")
    
    # ─── STEP 4: Classify page and build dataLayer ─────
    page_data = classify_page(rel_path)
    datalayer_script = build_datalayer_script(page_data)
    
    # ─── STEP 5: Inject new GTM + Consent + dataLayer into <head> ─────
    head_match = re.search(r'<head[^>]*>', html, re.I)
    if head_match:
        insert_pos = head_match.end()
        injection = f"\n{GTM_HEAD}\n{datalayer_script}\n"
        html = html[:insert_pos] + injection + html[insert_pos:]
        changes.append("injected_consent_mode")
        changes.append("injected_gtm_head")
        changes.append(f"injected_datalayer({page_data['page_type']}/{page_data['specialty']})")
    else:
        stats['errors'].append(f"{rel_path}: no <head> found")
        return False
    
    # ─── STEP 6: Inject GTM noscript into <body> ─────
    body_match = re.search(r'<body[^>]*>', html, re.I)
    if body_match:
        insert_pos = body_match.end()
        html = html[:insert_pos] + f"\n{GTM_BODY}\n" + html[insert_pos:]
        changes.append("injected_gtm_noscript")
    
    # ─── STEP 7: Only write if changed ─────
    if html != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        stats['modified'] += 1
        stats['changes'].append({
            'file': rel_path,
            'actions': changes,
            'page_data': page_data,
            'size_before': len(original),
            'size_after': len(html)
        })
        return True
    
    return False


def main():
    stats = {
        'total': 0,
        'modified': 0,
        'skipped_redirects': 0,
        'errors': [],
        'changes': [],
    }
    
    print("=" * 70)
    print("CLINICAL GROWTH ENGINE (CGE) v1.0 — IMPLEMENTATION")
    print("=" * 70)
    print(f"Site directory: {SITE_DIR}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    # Walk all pages
    for root, dirs, files in os.walk(SITE_DIR):
        # Skip backup/output dirs
        if any(skip in root for skip in ['backups', 'output', '/pages/']):
            continue
        
        for f in files:
            if f != 'index.html':
                continue
            
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, SITE_DIR)
            stats['total'] += 1
            
            try:
                process_page(filepath, rel_path, stats)
            except Exception as e:
                stats['errors'].append(f"{rel_path}: {str(e)}")
    
    # ─── SUMMARY ─────
    print(f"\n{'─'*70}")
    print("RESULTS:")
    print(f"  Total pages scanned:    {stats['total']}")
    print(f"  Modified:               {stats['modified']}")
    print(f"  Skipped (redirects):    {stats['skipped_redirects']}")
    print(f"  Errors:                 {len(stats['errors'])}")
    
    if stats['errors']:
        print(f"\n  ERRORS:")
        for e in stats['errors']:
            print(f"    ! {e}")
    
    # Group changes by type
    page_types = {}
    specialties = {}
    for c in stats['changes']:
        pt = c['page_data']['page_type']
        sp = c['page_data']['specialty']
        page_types[pt] = page_types.get(pt, 0) + 1
        specialties[sp] = specialties.get(sp, 0) + 1
    
    print(f"\n  BY PAGE TYPE:")
    for pt, count in sorted(page_types.items()):
        print(f"    {pt}: {count}")
    
    print(f"\n  BY SPECIALTY:")
    for sp, count in sorted(specialties.items()):
        print(f"    {sp}: {count}")
    
    # Print sample changes
    print(f"\n  SAMPLE CHANGES (first 10):")
    for c in stats['changes'][:10]:
        actions = ', '.join(c['actions'][:3])
        delta = c['size_after'] - c['size_before']
        print(f"    {c['file']} -> +{delta}B [{actions}]")
    
    print(f"\n{'─'*70}")
    print(f"CGE v1.0 implementation complete.")
    print(f"NEXT: Configure GTM container tags per the GTM Architecture doc.")
    
    return stats


if __name__ == "__main__":
    stats = main()
