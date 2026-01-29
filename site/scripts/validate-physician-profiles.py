#!/usr/bin/env python3
"""
Bio-Clinic Physician Profiles Validator v2.0
============================================
Script automatico per validare tutte le pagine profilo dei medici.

Controlla:
1. Esistenza file HTML per ogni medico nel DB
2. Presenza schema.org valido (Physician, FAQPage)
3. Completezza meta tags (title, description, canonical)
4. Presenza sezioni chiave (bio, prestazioni, contatti)
5. Link funzionanti (interni)
6. Pubblicazioni e sintomi per medici con dati estesi
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class PhysicianProfileValidator:
    def __init__(self, site_path):
        self.site_path = Path(site_path)
        self.equipe_path = self.site_path / 'equipe'
        self.data_path = self.site_path / 'data' / 'entities'
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'total_physicians': 0,
            'pages_found': 0,
            'pages_missing': [],
            'validation_passed': [],
            'validation_failed': [],
            'warnings': [],
            'schema_stats': {
                'physician_schema': 0,
                'faq_schema': 0,
                'breadcrumb_schema': 0,
                'citations': 0
            },
            'physicians_with_publications': [],
            'physicians_without_data': [],
            'detailed_results': {}
        }
        
    def load_physicians_db(self):
        """Carica database medici principale"""
        db_path = self.data_path / 'physicians-complete.json'
        with open(db_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('physicians', [])
    
    def load_extended_db(self):
        """Carica database medici esteso"""
        ext_path = self.data_path / 'physicians-extended.json'
        try:
            with open(ext_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get('physicians_extended', {})
        except FileNotFoundError:
            return {}
    
    def validate_html_structure(self, html_content, slug):
        """Valida struttura HTML della pagina"""
        issues = []
        checks_passed = []
        
        # Check meta tags
        if '<title>' in html_content:
            checks_passed.append('title_tag')
        else:
            issues.append('Missing <title> tag')
            
        if 'meta name="description"' in html_content:
            checks_passed.append('meta_description')
        else:
            issues.append('Missing meta description')
            
        if 'rel="canonical"' in html_content:
            checks_passed.append('canonical_url')
        else:
            issues.append('Missing canonical URL')
        
        # Check schema.org
        if '"@type": "Physician"' in html_content or '"@type":"Physician"' in html_content:
            checks_passed.append('physician_schema')
            self.results['schema_stats']['physician_schema'] += 1
        else:
            issues.append('Missing Physician schema')
            
        if '"@type": "FAQPage"' in html_content or '"@type":"FAQPage"' in html_content:
            checks_passed.append('faq_schema')
            self.results['schema_stats']['faq_schema'] += 1
        else:
            issues.append('Missing FAQPage schema')
            
        if '"@type": "BreadcrumbList"' in html_content or '"@type":"BreadcrumbList"' in html_content:
            checks_passed.append('breadcrumb_schema')
            self.results['schema_stats']['breadcrumb_schema'] += 1
        
        # Check citations
        if '"citation"' in html_content:
            checks_passed.append('has_citations')
            self.results['schema_stats']['citations'] += 1
            self.results['physicians_with_publications'].append(slug)
        
        # Check knowsAbout (sintomi)
        if '"knowsAbout"' in html_content:
            checks_passed.append('knows_about')
        
        # Check essential sections
        if 'class="bio-section"' in html_content or 'bio' in html_content.lower():
            checks_passed.append('bio_section')
            
        if 'MioDottore' in html_content or 'miodottore' in html_content:
            checks_passed.append('miodottore_widget')
            
        if '+39 079 956 1332' in html_content or '079 956 1332' in html_content:
            checks_passed.append('contact_phone')
        else:
            issues.append('Missing contact phone')
            
        return {
            'checks_passed': checks_passed,
            'issues': issues,
            'score': len(checks_passed) / max(len(checks_passed) + len(issues), 1) * 100
        }
    
    def check_internal_links(self, html_content):
        """Controlla link interni"""
        broken_links = []
        # Pattern per link relativi
        link_pattern = r'href="\.\./(.*?)"'
        matches = re.findall(link_pattern, html_content)
        
        for link in matches:
            link_path = self.site_path / link
            if not link_path.exists() and not link.startswith('#') and not link.startswith('http'):
                # Check senza estensione
                if not (self.site_path / f"{link}.html").exists():
                    broken_links.append(link)
        
        return broken_links
    
    def validate_profile(self, slug, physician_data, extended_data):
        """Valida un singolo profilo"""
        html_file = self.equipe_path / f"{slug}.html"
        result = {
            'slug': slug,
            'name': physician_data.get('name', 'Unknown'),
            'specialty': physician_data.get('specialty_id', 'Unknown'),
            'file_exists': False,
            'validation': None,
            'has_extended_data': slug in extended_data,
            'publications_count': 0,
            'symptoms_count': 0,
            'issues': [],
            'score': 0
        }
        
        if not html_file.exists():
            result['issues'].append(f'File not found: {html_file.name}')
            self.results['pages_missing'].append(slug)
            return result
        
        result['file_exists'] = True
        self.results['pages_found'] += 1
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Validate HTML structure
        validation = self.validate_html_structure(html_content, slug)
        result['validation'] = validation
        result['issues'] = validation['issues']
        result['score'] = validation['score']
        
        # Check internal links
        broken_links = self.check_internal_links(html_content)
        if broken_links:
            result['issues'].extend([f'Broken link: {link}' for link in broken_links])
        
        # Check extended data
        if slug in extended_data:
            ext = extended_data[slug]
            result['publications_count'] = len(ext.get('pubblicazioni', []))
            result['symptoms_count'] = len(ext.get('sintomi', []))
        else:
            self.results['physicians_without_data'].append(slug)
        
        # Determine pass/fail
        if result['score'] >= 70 and not result['issues']:
            self.results['validation_passed'].append(slug)
        elif result['issues']:
            self.results['validation_failed'].append(slug)
        else:
            self.results['warnings'].append({
                'slug': slug,
                'message': 'Low score but no critical issues',
                'score': result['score']
            })
        
        return result
    
    def run_validation(self):
        """Esegue validazione completa"""
        print("=" * 60)
        print("BIO-CLINIC PHYSICIAN PROFILES VALIDATOR v2.0")
        print("=" * 60)
        print()
        
        # Load data
        physicians = self.load_physicians_db()
        extended_data = self.load_extended_db()
        
        self.results['total_physicians'] = len(physicians)
        print(f"Found {len(physicians)} physicians in database")
        print(f"Extended data available for {len(extended_data)} physicians")
        print()
        
        # Validate each profile
        for physician in physicians:
            slug = physician.get('slug')
            if not slug:
                continue
            
            result = self.validate_profile(slug, physician, extended_data)
            self.results['detailed_results'][slug] = result
            
            # Progress indicator
            status = "✓" if result['score'] >= 70 else "✗"
            print(f"  {status} {result['name']:<35} Score: {result['score']:.0f}%")
        
        print()
        return self.generate_report()
    
    def generate_report(self):
        """Genera report di validazione"""
        r = self.results
        
        report = []
        report.append("=" * 60)
        report.append("VALIDATION REPORT")
        report.append("=" * 60)
        report.append(f"Timestamp: {r['timestamp']}")
        report.append("")
        
        # Summary
        report.append("SUMMARY")
        report.append("-" * 40)
        report.append(f"Total Physicians:       {r['total_physicians']}")
        report.append(f"Pages Found:            {r['pages_found']}")
        report.append(f"Pages Missing:          {len(r['pages_missing'])}")
        report.append(f"Validation Passed:      {len(r['validation_passed'])}")
        report.append(f"Validation Failed:      {len(r['validation_failed'])}")
        report.append(f"Warnings:               {len(r['warnings'])}")
        report.append("")
        
        # Schema Stats
        report.append("SCHEMA.ORG STATS")
        report.append("-" * 40)
        report.append(f"Physician Schema:       {r['schema_stats']['physician_schema']}")
        report.append(f"FAQPage Schema:         {r['schema_stats']['faq_schema']}")
        report.append(f"BreadcrumbList Schema:  {r['schema_stats']['breadcrumb_schema']}")
        report.append(f"Pages with Citations:   {r['schema_stats']['citations']}")
        report.append("")
        
        # Publications
        report.append("PHYSICIANS WITH VERIFIED PUBLICATIONS")
        report.append("-" * 40)
        for slug in sorted(r['physicians_with_publications']):
            detail = r['detailed_results'].get(slug, {})
            pub_count = detail.get('publications_count', 0)
            report.append(f"  - {slug}: {pub_count} publications")
        report.append("")
        
        # Missing pages
        if r['pages_missing']:
            report.append("MISSING PAGES (CRITICAL)")
            report.append("-" * 40)
            for slug in r['pages_missing']:
                report.append(f"  ! {slug}.html")
            report.append("")
        
        # Failed validations
        if r['validation_failed']:
            report.append("FAILED VALIDATIONS")
            report.append("-" * 40)
            for slug in r['validation_failed']:
                detail = r['detailed_results'].get(slug, {})
                for issue in detail.get('issues', []):
                    report.append(f"  [{slug}] {issue}")
            report.append("")
        
        # Score summary
        report.append("SCORE DISTRIBUTION")
        report.append("-" * 40)
        score_ranges = {'90-100': 0, '70-89': 0, '50-69': 0, '0-49': 0}
        for slug, detail in r['detailed_results'].items():
            score = detail.get('score', 0)
            if score >= 90:
                score_ranges['90-100'] += 1
            elif score >= 70:
                score_ranges['70-89'] += 1
            elif score >= 50:
                score_ranges['50-69'] += 1
            else:
                score_ranges['0-49'] += 1
        
        for range_name, count in score_ranges.items():
            bar = "█" * (count // 2) if count > 0 else ""
            report.append(f"  {range_name}%: {count:3d} {bar}")
        report.append("")
        
        # Final status
        total_passed = len(r['validation_passed']) + len([w for w in r['warnings']])
        total = r['total_physicians']
        success_rate = (total_passed / total * 100) if total > 0 else 0
        
        report.append("=" * 60)
        if success_rate >= 90:
            report.append(f"OVERALL STATUS: ✓ EXCELLENT ({success_rate:.1f}% success rate)")
        elif success_rate >= 70:
            report.append(f"OVERALL STATUS: ⚠ GOOD ({success_rate:.1f}% success rate)")
        else:
            report.append(f"OVERALL STATUS: ✗ NEEDS ATTENTION ({success_rate:.1f}% success rate)")
        report.append("=" * 60)
        
        report_text = "\n".join(report)
        print(report_text)
        
        # Save report
        report_path = self.site_path / 'reports' / 'physician-validation-report.txt'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\nReport saved to: {report_path}")
        
        # Save JSON results
        json_path = self.site_path / 'reports' / 'physician-validation-results.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(r, f, indent=2, ensure_ascii=False)
        print(f"JSON results saved to: {json_path}")
        
        return r

def main():
    site_path = Path(__file__).parent.parent
    validator = PhysicianProfileValidator(site_path)
    results = validator.run_validation()
    
    # Exit code based on results
    if len(results['validation_failed']) > 0 or len(results['pages_missing']) > 0:
        exit(1)
    exit(0)

if __name__ == "__main__":
    main()
