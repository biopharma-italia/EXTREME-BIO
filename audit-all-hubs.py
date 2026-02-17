#!/usr/bin/env python3
"""
Comprehensive SEO/E-E-A-T/AI-Friendliness Audit for ALL hub clusters on bio-clinic.it
Follows the exact same 14-point methodology used for the Cardiologia audit.
"""

import os
import re
import json
import sys
from html.parser import HTMLParser

SITE_DIR = "/home/user/webapp/site"
BASE_URL = "https://bio-clinic.it"

# Define all hubs (excluding cardiologia — already optimized)
HUBS = {
    "ginecologia": {
        "name": "Ginecologia",
        "hub": "ginecologia",
        "subs": [
            "assistenza-ostetrica", "caressflow", "colposcopia", "corso-preparto",
            "duopap", "ecografia-mammaria", "ecografia-morfologica", "ecografia-ostetrica-3d",
            "ecografia-pelvica", "ecografia-transvaginale", "ginecologi-sassari",
            "hpv-dna-test", "isterosalpingografia", "isteroscopia", "pap-test-hpv",
            "pap-test", "perifit-kegel-sassari", "radiofrequenza-vaginale",
            "riabilitazione-pavimento-pelvico", "trattamenti-pavimento-pelvico",
            "visita-ginecologica"
        ]
    },
    "dermatologia": {
        "name": "Dermatologia",
        "hub": "dermatologia",
        "subs": ["mappatura-nevi", "visita-dermatologica"]
    },
    "endocrinologia": {
        "name": "Endocrinologia",
        "hub": "endocrinologia",
        "subs": ["checkup-tiroide", "ecografia-tiroidea", "visita-endocrinologica"]
    },
    "neurologia": {
        "name": "Neurologia",
        "hub": "neurologia",
        "subs": ["elettromiografia", "visita-neurologica"]
    },
    "ortopedia": {
        "name": "Ortopedia",
        "hub": "ortopedia",
        "subs": ["infiltrazioni-articolari", "visita-fisiatrica", "visita-ortopedica"]
    },
    "urologia": {
        "name": "Urologia",
        "hub": "urologia",
        "subs": ["ecografia-prostatica", "ecografia-renale", "visita-urologica"]
    },
    "chirurgia-vascolare": {
        "name": "Chirurgia Vascolare",
        "hub": "chirurgia-vascolare",
        "subs": ["eco-doppler-arti", "scleroterapia", "visita-chirurgia-vascolare"]
    },
    "otorinolaringoiatria": {
        "name": "Otorinolaringoiatria",
        "hub": "otorinolaringoiatria",
        "subs": ["audiometria", "campo-visivo", "spirometria", "visita-orl"]
    },
    "gastroenterologia": {
        "name": "Gastroenterologia",
        "hub": "gastroenterologia",
        "subs": ["ecografia-addominale", "visita-gastroenterologica"]
    },
    "oculistica": {
        "name": "Oculistica",
        "hub": "oculistica",
        "subs": ["visita-oculistica"]
    },
    "pneumologia": {
        "name": "Pneumologia",
        "hub": "pneumologia",
        "subs": ["visita-pneumologica"]
    },
    "ematologia": {
        "name": "Ematologia",
        "hub": "ematologia",
        "subs": ["visita-ematologica"]
    },
    "reumatologia": {
        "name": "Reumatologia",
        "hub": "reumatologia",
        "subs": ["visita-reumatologica"]
    },
}


def count_words(html):
    """Approximate visible word count"""
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.S|re.I)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.S|re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&[a-z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    words = [w for w in text.split() if len(w) > 1]
    return len(words)


def audit_page(filepath, page_url, page_slug, hub_slug, is_hub=False):
    """Run all 14 audit checks on a single page"""
    if not os.path.exists(filepath):
        return None
    
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        html = f.read()
    
    result = {
        "url": page_url,
        "slug": page_slug,
        "is_hub": is_hub,
        "file_size": len(html),
        "word_count": count_words(html),
        "checks": {}
    }
    
    # 1. H1 tag
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.S|re.I)
    h1_text = re.sub(r'<[^>]+>', '', h1_matches[0]).strip() if h1_matches else ""
    result["checks"]["h1"] = {
        "present": len(h1_matches) > 0,
        "count": len(h1_matches),
        "text": h1_text[:80] if h1_text else "",
        "score": 10 if len(h1_matches) == 1 else (5 if len(h1_matches) > 1 else 0)
    }
    
    # 2. Breadcrumb schema URLs (check for /pages/ legacy)
    breadcrumb_match = re.search(r'"BreadcrumbList"', html)
    pages_in_breadcrumb = len(re.findall(r'/pages/', html[:html.find('</script>', html.find('BreadcrumbList')) if 'BreadcrumbList' in html else 0] if 'BreadcrumbList' in html else ''))
    # Simpler: just count /pages/ occurrences in the whole file
    pages_refs = len(re.findall(r'/pages/', html))
    result["checks"]["breadcrumb_urls"] = {
        "has_breadcrumb_schema": breadcrumb_match is not None,
        "legacy_pages_refs": pages_refs,
        "score": 10 if breadcrumb_match and pages_refs == 0 else (5 if breadcrumb_match else 0)
    }
    
    # 3. @id correctness (check for /pages/ in @id)
    id_matches = re.findall(r'"@id"\s*:\s*"([^"]*)"', html)
    bad_ids = [i for i in id_matches if '/pages/' in i]
    result["checks"]["at_id"] = {
        "total_ids": len(id_matches),
        "bad_ids": bad_ids,
        "score": 10 if len(id_matches) > 0 and len(bad_ids) == 0 else (3 if len(bad_ids) > 0 else 1)
    }
    
    # 4. FAQPage schema
    faq_present = 'FAQPage' in html
    faq_questions = len(re.findall(r'"acceptedAnswer"', html))
    result["checks"]["faqpage"] = {
        "present": faq_present,
        "question_count": faq_questions,
        "score": 10 if faq_present and faq_questions >= 2 else (5 if faq_present else 0)
    }
    
    # 5. Person/Physician schema
    person_count = len(re.findall(r'"Person"|"Physician"', html))
    result["checks"]["person_schema"] = {
        "present": person_count > 0,
        "count": person_count,
        "score": 10 if person_count > 0 else 0
    }
    
    # 6. Internal cross-linking (links to sibling pages within the same hub)
    hub_links = re.findall(rf'href="/{hub_slug}/[^"]*"', html)
    # Exclude self-references
    self_ref = f'/{hub_slug}/{page_slug}/' if not is_hub else f'/{hub_slug}/'
    cross_links = [l for l in hub_links if self_ref not in l]
    result["checks"]["cross_linking"] = {
        "internal_hub_links": len(cross_links),
        "score": 10 if len(cross_links) >= 3 else (7 if len(cross_links) >= 2 else (4 if len(cross_links) >= 1 else 0))
    }
    
    # 7. Author/reviewer credits
    author_patterns = [
        r'revisionat[oaie]', r'verificat[oaie]\s+da', r'a\s+cura\s+di',
        r'reviewedBy', r'author.*dott', r'medico.*responsabile',
        r'supervisione.*medica', r'validat[oaie].*da'
    ]
    author_found = any(re.search(p, html, re.I) for p in author_patterns)
    result["checks"]["author_credit"] = {
        "present": author_found,
        "score": 10 if author_found else 0
    }
    
    # 8. Content depth (word count > 1000)
    wc = result["word_count"]
    result["checks"]["content_depth"] = {
        "word_count": wc,
        "score": 10 if wc >= 1200 else (7 if wc >= 1000 else (4 if wc >= 700 else (2 if wc >= 500 else 0)))
    }
    
    # 9. MedicalWebPage + SpeakableSpecification
    has_mwp = 'MedicalWebPage' in html
    has_speakable = 'SpeakableSpecification' in html
    result["checks"]["medical_webpage"] = {
        "MedicalWebPage": has_mwp,
        "SpeakableSpecification": has_speakable,
        "score": 10 if has_mwp and has_speakable else (5 if has_mwp or has_speakable else 0)
    }
    
    # 10. First paragraph optimization (definition-first for AI)
    # Check if the first substantial <p> contains a keyword-rich definition
    first_p = re.search(r'<p[^>]*data-speakable[^>]*>(.*?)</p>', html, re.S|re.I)
    if not first_p:
        first_p = re.search(r'<main[^>]*>.*?<p[^>]*>(.*?)</p>', html, re.S|re.I)
    has_optimized_p = first_p is not None and len(re.sub(r'<[^>]+>', '', first_p.group(1)).strip()) > 80
    result["checks"]["first_paragraph"] = {
        "optimized": has_optimized_p,
        "has_data_speakable": 'data-speakable' in html,
        "score": 10 if has_optimized_p else (3 if 'data-speakable' in html else 0)
    }
    
    # 11. HowTo schema
    has_howto = '"HowTo"' in html
    howto_steps = len(re.findall(r'"HowToStep"', html))
    result["checks"]["howto_schema"] = {
        "present": has_howto,
        "steps": howto_steps,
        "score": 10 if has_howto and howto_steps >= 3 else (5 if has_howto else 0)
    }
    
    # 12. og:type
    og_type_match = re.search(r'og:type.*?content="([^"]*)"', html, re.I)
    og_type = og_type_match.group(1) if og_type_match else ""
    expected_og = "website" if is_hub else "article"
    result["checks"]["og_type"] = {
        "value": og_type,
        "expected": expected_og,
        "score": 10 if og_type == expected_og else (3 if og_type else 0)
    }
    
    # 13. Title tag optimization
    title_match = re.search(r'<title>(.*?)</title>', html, re.I)
    title = title_match.group(1).strip() if title_match else ""
    title_has_location = 'sassari' in title.lower()
    title_has_brand = 'bio-clinic' in title.lower() or 'bio clinic' in title.lower()
    title_len = len(title)
    result["checks"]["title_tag"] = {
        "text": title,
        "length": title_len,
        "has_location": title_has_location,
        "has_brand": title_has_brand,
        "score": 10 if title_has_location and title_has_brand and 30 <= title_len <= 65 else (
            7 if title_has_brand and 25 <= title_len <= 70 else (3 if title else 0))
    }
    
    # 14. Images with alt text
    images = re.findall(r'<img[^>]*>', html, re.I)
    imgs_with_alt = len([i for i in images if 'alt="' in i and 'alt=""' not in i])
    result["checks"]["images_alt"] = {
        "total_images": len(images),
        "with_alt": imgs_with_alt,
        "score": 10 if len(images) > 0 and imgs_with_alt == len(images) else (
            7 if imgs_with_alt > 0 else (3 if len(images) > 0 else 2))
    }
    
    # Calculate total score
    total = sum(c["score"] for c in result["checks"].values())
    result["total_score"] = total
    result["max_score"] = 140
    result["percentage"] = round(total / 140 * 100, 1)
    
    return result


def audit_hub(hub_key, hub_data):
    """Audit an entire hub cluster"""
    hub_slug = hub_data["hub"]
    results = []
    
    # Audit the hub page
    hub_path = os.path.join(SITE_DIR, hub_slug, "index.html")
    hub_url = f"{BASE_URL}/{hub_slug}/"
    r = audit_page(hub_path, hub_url, hub_slug, hub_slug, is_hub=True)
    if r:
        results.append(r)
    
    # Audit each sub-page
    for sub in hub_data["subs"]:
        sub_path = os.path.join(SITE_DIR, hub_slug, sub, "index.html")
        sub_url = f"{BASE_URL}/{hub_slug}/{sub}/"
        r = audit_page(sub_path, sub_url, sub, hub_slug, is_hub=False)
        if r:
            results.append(r)
    
    return results


# Run audit for all hubs
print("=" * 80)
print("  AUDIT COMPLETO — TUTTI GLI HUB bio-clinic.it")
print("  14 punti di controllo SEO/E-E-A-T/AI per pagina")
print("=" * 80)

all_results = {}
grand_total = 0
grand_max = 0
critical_issues = []

for hub_key in HUBS:
    hub_data = HUBS[hub_key]
    results = audit_hub(hub_key, hub_data)
    all_results[hub_key] = results
    
    hub_total = sum(r["total_score"] for r in results)
    hub_max = sum(r["max_score"] for r in results)
    grand_total += hub_total
    grand_max += hub_max
    
    page_count = len(results)
    avg_score = hub_total / page_count if page_count > 0 else 0
    avg_pct = hub_total / hub_max * 100 if hub_max > 0 else 0
    
    print(f"\n{'━' * 80}")
    print(f"  HUB: {hub_data['name'].upper()} — {page_count} pagine")
    print(f"  Punteggio medio: {avg_score:.0f}/140 ({avg_pct:.1f}%)")
    print(f"{'━' * 80}")
    
    for r in results:
        label = "HUB" if r["is_hub"] else "SUB"
        print(f"\n  [{label}] {r['url']}")
        print(f"    Size: {r['file_size']:,} bytes | Words: {r['word_count']} | Score: {r['total_score']}/140 ({r['percentage']}%)")
        
        # Print each check with status icon
        for check_name, check_data in r["checks"].items():
            score = check_data["score"]
            icon = "✅" if score >= 8 else ("⚠️" if score >= 4 else "❌")
            
            detail = ""
            if check_name == "h1":
                detail = f"text='{check_data['text'][:50]}'" if check_data['text'] else "MISSING"
            elif check_name == "breadcrumb_urls":
                detail = f"legacy /pages/ refs: {check_data['legacy_pages_refs']}"
            elif check_name == "at_id":
                detail = f"bad IDs: {len(check_data['bad_ids'])}" if check_data['bad_ids'] else "OK"
            elif check_name == "faqpage":
                detail = f"{check_data['question_count']} Q&A" if check_data['present'] else "MISSING"
            elif check_name == "person_schema":
                detail = f"{check_data['count']} physicians" if check_data['present'] else "MISSING"
            elif check_name == "cross_linking":
                detail = f"{check_data['internal_hub_links']} links"
            elif check_name == "author_credit":
                detail = "present" if check_data['present'] else "MISSING"
            elif check_name == "content_depth":
                detail = f"{check_data['word_count']} words"
            elif check_name == "medical_webpage":
                parts = []
                if check_data['MedicalWebPage']: parts.append("MWP")
                if check_data['SpeakableSpecification']: parts.append("Speak")
                detail = "+".join(parts) if parts else "MISSING"
            elif check_name == "first_paragraph":
                detail = "optimized" if check_data['optimized'] else "NOT optimized"
            elif check_name == "howto_schema":
                detail = f"{check_data['steps']} steps" if check_data['present'] else "MISSING"
            elif check_name == "og_type":
                detail = f"'{check_data['value']}' (expected: '{check_data['expected']}')"
            elif check_name == "title_tag":
                detail = f"'{check_data['text'][:55]}' ({check_data['length']}ch)"
            elif check_name == "images_alt":
                detail = f"{check_data['with_alt']}/{check_data['total_images']} with alt"
            
            print(f"      {icon} {check_name}: {score}/10 — {detail}")
            
            # Track critical issues
            if score == 0 and check_name in ["h1", "breadcrumb_urls", "at_id", "faqpage"]:
                critical_issues.append(f"CRITICAL: {r['url']} — {check_name}")

# Summary
print(f"\n{'=' * 80}")
print(f"  RIEPILOGO GLOBALE")
print(f"{'=' * 80}")
print(f"  Hub analizzati: {len(HUBS)}")
total_pages = sum(len(v) for v in all_results.values())
print(f"  Pagine totali: {total_pages}")
print(f"  Punteggio globale: {grand_total}/{grand_max} ({grand_total/grand_max*100:.1f}%)")

# Per-hub summary table
print(f"\n  {'Hub':<25} {'Pagine':>7} {'Score':>8} {'%':>7} {'Avg/page':>10}")
print(f"  {'─'*25} {'─'*7} {'─'*8} {'─'*7} {'─'*10}")
for hub_key in HUBS:
    results = all_results[hub_key]
    pc = len(results)
    ht = sum(r["total_score"] for r in results)
    hm = sum(r["max_score"] for r in results)
    pct = ht/hm*100 if hm > 0 else 0
    avg = ht/pc if pc > 0 else 0
    print(f"  {HUBS[hub_key]['name']:<25} {pc:>7} {ht:>5}/{hm:<3} {pct:>6.1f}% {avg:>8.1f}/140")

# Critical issues
if critical_issues:
    print(f"\n  ⚠️  ISSUE CRITICHE ({len(critical_issues)}):")
    for ci in critical_issues[:30]:
        print(f"    • {ci}")

# Per-check global averages
print(f"\n  MEDIA PER VOCE (tutti gli hub):")
check_names = ["h1", "breadcrumb_urls", "at_id", "faqpage", "person_schema", 
               "cross_linking", "author_credit", "content_depth", "medical_webpage",
               "first_paragraph", "howto_schema", "og_type", "title_tag", "images_alt"]
for cn in check_names:
    all_scores = []
    for hub_key in all_results:
        for r in all_results[hub_key]:
            all_scores.append(r["checks"][cn]["score"])
    avg = sum(all_scores)/len(all_scores) if all_scores else 0
    icon = "✅" if avg >= 8 else ("⚠️" if avg >= 4 else "❌")
    print(f"    {icon} {cn:<22}: {avg:.1f}/10")

print(f"\n{'=' * 80}")
