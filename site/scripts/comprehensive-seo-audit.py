#!/usr/bin/env python3
"""
Audit SEO/SERP AI Completo per Bio-Clinic
Verifica tutti gli aspetti tecnici, contenutistici e strutturali
"""

import json
import re
import os
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlparse
import html.parser

class SEOAudit:
    def __init__(self, site_dir):
        self.site_dir = Path(site_dir)
        self.errors = []
        self.warnings = []
        self.successes = []
        self.scores = {}
        
    def log_error(self, category, message, file=None):
        self.errors.append({"category": category, "message": message, "file": file})
        
    def log_warning(self, category, message, file=None):
        self.warnings.append({"category": category, "message": message, "file": file})
        
    def log_success(self, category, message):
        self.successes.append({"category": category, "message": message})

    def check_html_validity(self, file_path):
        """Verifica validità HTML base"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # DOCTYPE
        if not content.strip().lower().startswith('<!doctype html'):
            issues.append("Manca DOCTYPE")
        
        # Tag essenziali
        essential_tags = ['<html', '<head', '<body', '</html>', '</head>', '</body>']
        for tag in essential_tags:
            if tag not in content.lower():
                issues.append(f"Manca tag: {tag}")
        
        # Charset
        if 'charset' not in content.lower():
            issues.append("Manca charset declaration")
            
        # Viewport
        if 'viewport' not in content.lower():
            issues.append("Manca viewport meta tag")
        
        return issues

    def check_seo_meta(self, file_path):
        """Verifica meta tag SEO"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Title
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
        if not title_match:
            issues.append("Manca tag <title>")
        else:
            title = title_match.group(1)
            if len(title) < 30:
                issues.append(f"Title troppo corto: {len(title)} chars (min 30)")
            elif len(title) > 65:
                issues.append(f"Title troppo lungo: {len(title)} chars (max 65)")
        
        # Meta description
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if not desc_match:
            desc_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
        
        if not desc_match:
            issues.append("Manca meta description")
        else:
            desc = desc_match.group(1)
            if len(desc) < 120:
                issues.append(f"Meta description troppo corta: {len(desc)} chars (min 120)")
            elif len(desc) > 160:
                issues.append(f"Meta description troppo lunga: {len(desc)} chars (max 160)")
        
        # Canonical
        if 'rel="canonical"' not in content and "rel='canonical'" not in content:
            issues.append("Manca canonical URL")
        
        # Open Graph
        og_tags = ['og:title', 'og:description', 'og:type', 'og:url']
        for og in og_tags:
            if og not in content:
                issues.append(f"Manca {og}")
        
        return issues

    def check_schema_markup(self, file_path):
        """Verifica Schema.org markup"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # JSON-LD
        if 'application/ld+json' not in content:
            issues.append("Manca Schema.org JSON-LD")
            return issues
        
        # Estrai e valida JSON-LD
        json_ld_matches = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)
        
        if not json_ld_matches:
            issues.append("JSON-LD presente ma non parsabile")
            return issues
        
        for i, json_str in enumerate(json_ld_matches):
            try:
                data = json.loads(json_str)
                
                # Verifica campi essenziali per Physician
                if data.get('@type') == 'Physician' or (isinstance(data.get('@graph'), list) and any(item.get('@type') == 'Physician' for item in data.get('@graph', []))):
                    physician_data = data if data.get('@type') == 'Physician' else next((item for item in data.get('@graph', []) if item.get('@type') == 'Physician'), {})
                    
                    required_fields = ['name', 'medicalSpecialty', 'worksFor']
                    for field in required_fields:
                        if field not in physician_data:
                            issues.append(f"Schema Physician: manca campo '{field}'")
                    
                    # E-E-A-T fields
                    eeat_fields = ['knowsAbout', 'alumniOf', 'hasCredential']
                    found_eeat = sum(1 for f in eeat_fields if f in physician_data)
                    if found_eeat == 0:
                        issues.append("Schema Physician: nessun campo E-E-A-T (knowsAbout, alumniOf, hasCredential)")
                
            except json.JSONDecodeError as e:
                issues.append(f"JSON-LD #{i+1} invalido: {str(e)[:50]}")
        
        return issues

    def check_accessibility(self, file_path):
        """Verifica accessibilità base"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Lang attribute
        if not re.search(r'<html[^>]*lang=', content, re.IGNORECASE):
            issues.append("Manca attributo lang su <html>")
        
        # Alt text su immagini
        img_without_alt = re.findall(r'<img(?![^>]*alt=)[^>]*>', content, re.IGNORECASE)
        if img_without_alt:
            issues.append(f"{len(img_without_alt)} immagini senza alt text")
        
        # Skip links
        if 'skip' not in content.lower() and 'main-content' not in content.lower():
            issues.append("Potrebbe mancare skip link per accessibilità")
        
        # Heading hierarchy
        headings = re.findall(r'<h([1-6])', content, re.IGNORECASE)
        if headings:
            if headings[0] != '1':
                issues.append("La pagina non inizia con H1")
            
            # Check for skipped levels
            prev_level = 0
            for h in headings:
                level = int(h)
                if level > prev_level + 1 and prev_level > 0:
                    issues.append(f"Gerarchia heading saltata: H{prev_level} -> H{level}")
                    break
                prev_level = level
        
        return issues

    def check_performance_hints(self, file_path):
        """Verifica ottimizzazioni performance"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Lazy loading per immagini
        imgs = re.findall(r'<img[^>]+>', content, re.IGNORECASE)
        imgs_without_lazy = [img for img in imgs if 'loading=' not in img.lower()]
        if imgs_without_lazy and len(imgs_without_lazy) > 2:
            issues.append(f"{len(imgs_without_lazy)} immagini senza lazy loading")
        
        # Preconnect/Preload per risorse esterne
        external_domains = set()
        for match in re.findall(r'(https?://[^/"\'\s]+)', content):
            domain = urlparse(match).netloc
            if domain and 'bio-clinic' not in domain:
                external_domains.add(domain)
        
        if external_domains:
            preconnects = re.findall(r'rel=["\']preconnect["\']', content)
            if len(preconnects) < len(external_domains) // 2:
                issues.append(f"Considera preconnect per domini esterni: {len(external_domains)} trovati")
        
        # CSS/JS inline eccessivo
        inline_styles = re.findall(r'<style[^>]*>.*?</style>', content, re.DOTALL)
        total_inline_css = sum(len(s) for s in inline_styles)
        if total_inline_css > 10000:
            issues.append(f"CSS inline eccessivo: {total_inline_css} bytes")
        
        return issues

    def check_internal_links(self, file_path, all_files):
        """Verifica link interni"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Trova tutti i link interni
        links = re.findall(r'href=["\']([^"\']+)["\']', content)
        
        for link in links:
            if link.startswith('#') or link.startswith('http') or link.startswith('mailto:') or link.startswith('tel:'):
                continue
            
            # Normalizza il path
            if link.startswith('/'):
                target = self.site_dir / link.lstrip('/')
            else:
                target = file_path.parent / link
            
            target_str = str(target.resolve())
            
            # Verifica se il file esiste
            if not target.exists() and not any(str(f).endswith(link.split('/')[-1]) for f in all_files):
                issues.append(f"Link rotto: {link}")
        
        return issues

    def check_content_quality(self, file_path):
        """Verifica qualità contenuto"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Rimuovi HTML tags per analisi testo
        text = re.sub(r'<[^>]+>', ' ', content)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Word count
        words = len(text.split())
        if words < 300 and 'index' not in str(file_path).lower():
            issues.append(f"Contenuto scarso: {words} parole (min 300)")
        
        # Keyword stuffing check (parole ripetute eccessivamente)
        word_freq = defaultdict(int)
        for word in text.lower().split():
            if len(word) > 4:
                word_freq[word] += 1
        
        for word, count in word_freq.items():
            if count > 20 and count / words > 0.03:
                issues.append(f"Possibile keyword stuffing: '{word}' ({count} volte)")
                break
        
        return issues

    def check_mobile_friendly(self, file_path):
        """Verifica mobile-friendliness"""
        issues = []
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Viewport
        if 'viewport' not in content:
            issues.append("Manca viewport meta tag")
        
        # Touch targets (buttons, links)
        small_touch = re.findall(r'font-size:\s*(\d+)px', content)
        if small_touch:
            small_sizes = [int(s) for s in small_touch if int(s) < 12]
            if small_sizes:
                issues.append(f"Font size troppo piccoli per mobile: {small_sizes}")
        
        # Responsive images
        imgs = re.findall(r'<img[^>]+>', content, re.IGNORECASE)
        responsive_imgs = [img for img in imgs if 'srcset' in img or 'sizes' in img]
        if len(imgs) > 3 and len(responsive_imgs) == 0:
            issues.append("Nessuna immagine responsive (srcset/sizes)")
        
        return issues

    def audit_file(self, file_path, all_files):
        """Audit completo di un singolo file"""
        results = {
            "file": str(file_path.relative_to(self.site_dir)),
            "html_validity": self.check_html_validity(file_path),
            "seo_meta": self.check_seo_meta(file_path),
            "schema_markup": self.check_schema_markup(file_path),
            "accessibility": self.check_accessibility(file_path),
            "performance": self.check_performance_hints(file_path),
            "internal_links": self.check_internal_links(file_path, all_files),
            "content_quality": self.check_content_quality(file_path),
            "mobile_friendly": self.check_mobile_friendly(file_path)
        }
        
        return results

    def calculate_score(self, results):
        """Calcola punteggio SEO"""
        total_issues = 0
        category_weights = {
            "html_validity": 10,
            "seo_meta": 25,
            "schema_markup": 20,
            "accessibility": 15,
            "performance": 10,
            "internal_links": 10,
            "content_quality": 5,
            "mobile_friendly": 5
        }
        
        score = 100
        deductions = {}
        
        for category, weight in category_weights.items():
            issues = results.get(category, [])
            num_issues = len(issues)
            
            if num_issues > 0:
                # Deduct proportionally
                deduction = min(weight, num_issues * (weight / 5))
                score -= deduction
                deductions[category] = deduction
                total_issues += num_issues
        
        return max(0, round(score, 1)), deductions, total_issues

    def run_full_audit(self):
        """Esegue audit completo del sito"""
        print("=" * 70)
        print("🔍 AUDIT SEO/SERP AI COMPLETO - BIO-CLINIC")
        print("=" * 70)
        
        # Trova tutti i file HTML
        html_files = list(self.site_dir.glob('**/*.html'))
        html_files = [f for f in html_files if not any(x in str(f) for x in ['node_modules', '.git', 'reports'])]
        
        print(f"\n📁 File HTML trovati: {len(html_files)}")
        
        all_results = []
        total_score = 0
        critical_issues = []
        
        for file_path in html_files:
            results = self.audit_file(file_path, html_files)
            score, deductions, num_issues = self.calculate_score(results)
            results['score'] = score
            results['deductions'] = deductions
            results['total_issues'] = num_issues
            all_results.append(results)
            total_score += score
            
            # Track critical issues
            for cat in ['seo_meta', 'schema_markup', 'internal_links']:
                if results.get(cat):
                    for issue in results[cat]:
                        critical_issues.append({
                            "file": results['file'],
                            "category": cat,
                            "issue": issue
                        })
        
        avg_score = total_score / len(html_files) if html_files else 0
        
        # Report dettagliato
        print(f"\n{'=' * 70}")
        print("📊 RISULTATI AUDIT")
        print("=" * 70)
        
        # Files con score più basso
        sorted_results = sorted(all_results, key=lambda x: x['score'])
        
        print("\n🔴 PAGINE CON SCORE PIÙ BASSO:")
        print("-" * 50)
        for r in sorted_results[:10]:
            print(f"  {r['file']}: {r['score']}/100 ({r['total_issues']} issues)")
            if r['deductions']:
                for cat, ded in sorted(r['deductions'].items(), key=lambda x: -x[1])[:3]:
                    print(f"    └─ {cat}: -{ded:.1f}")
        
        print("\n🟢 PAGINE CON SCORE PIÙ ALTO:")
        print("-" * 50)
        for r in sorted_results[-5:]:
            print(f"  {r['file']}: {r['score']}/100")
        
        # Critical issues summary
        if critical_issues:
            print(f"\n⚠️ PROBLEMI CRITICI ({len(critical_issues)} totali):")
            print("-" * 50)
            
            # Raggruppa per categoria
            by_category = defaultdict(list)
            for ci in critical_issues:
                by_category[ci['category']].append(ci)
            
            for cat, issues in sorted(by_category.items(), key=lambda x: -len(x[1])):
                print(f"\n  📌 {cat.upper()} ({len(issues)} problemi):")
                for issue in issues[:5]:
                    print(f"    • {issue['file']}: {issue['issue'][:60]}...")
                if len(issues) > 5:
                    print(f"    ... e altri {len(issues) - 5}")
        
        # Score distribution
        score_ranges = {
            "90-100": len([r for r in all_results if r['score'] >= 90]),
            "80-89": len([r for r in all_results if 80 <= r['score'] < 90]),
            "70-79": len([r for r in all_results if 70 <= r['score'] < 80]),
            "60-69": len([r for r in all_results if 60 <= r['score'] < 70]),
            "<60": len([r for r in all_results if r['score'] < 60])
        }
        
        print(f"\n📈 DISTRIBUZIONE SCORE:")
        print("-" * 50)
        for range_name, count in score_ranges.items():
            bar = "█" * (count * 2)
            print(f"  {range_name}: {count:3d} {bar}")
        
        # Final summary
        print(f"\n{'=' * 70}")
        print("🏆 VALUTAZIONE FINALE")
        print("=" * 70)
        print(f"\n  📊 Score Medio: {avg_score:.1f}/100")
        print(f"  📁 Pagine Analizzate: {len(html_files)}")
        print(f"  ⚠️ Problemi Critici: {len(critical_issues)}")
        print(f"  ✅ Pagine Score >90: {score_ranges['90-100']}")
        print(f"  ⚡ Pagine Score <70: {score_ranges['70-79'] + score_ranges['60-69'] + score_ranges['<60']}")
        
        # Overall grade
        if avg_score >= 95:
            grade = "A+ (ECCELLENTE)"
        elif avg_score >= 90:
            grade = "A (OTTIMO)"
        elif avg_score >= 85:
            grade = "B+ (MOLTO BUONO)"
        elif avg_score >= 80:
            grade = "B (BUONO)"
        elif avg_score >= 75:
            grade = "C+ (DISCRETO)"
        elif avg_score >= 70:
            grade = "C (SUFFICIENTE)"
        else:
            grade = "D (DA MIGLIORARE)"
        
        print(f"\n  🎯 VOTO COMPLESSIVO: {grade}")
        print("=" * 70)
        
        # Save detailed report
        report_path = self.site_dir / 'reports' / 'seo-audit-detailed.json'
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump({
                "summary": {
                    "average_score": avg_score,
                    "total_pages": len(html_files),
                    "critical_issues": len(critical_issues),
                    "grade": grade,
                    "score_distribution": score_ranges
                },
                "pages": all_results,
                "critical_issues": critical_issues[:50]
            }, f, indent=2)
        
        print(f"\n📄 Report dettagliato salvato: {report_path}")
        
        return avg_score, all_results

if __name__ == "__main__":
    audit = SEOAudit(".")
    audit.run_full_audit()
