#!/usr/bin/env python3
"""
Bio-Clinic Site Health Check v1.0
=================================
Script rapido per verificare lo stato generale del sito.
Esegui periodicamente per monitorare la qualità.

Usage:
    python3 health-check.py
    python3 health-check.py --verbose
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

class HealthChecker:
    def __init__(self, site_path):
        self.site_path = Path(site_path)
        self.verbose = '--verbose' in sys.argv or '-v' in sys.argv
        self.issues = []
        self.warnings = []
        self.stats = {}
        
    def check_file_exists(self, path, description):
        """Verifica esistenza file"""
        full_path = self.site_path / path
        if full_path.exists():
            return True
        self.issues.append(f"Missing: {description} ({path})")
        return False
    
    def check_json_valid(self, path, description):
        """Verifica JSON valido"""
        full_path = self.site_path / path
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                json.load(f)
            return True
        except Exception as e:
            self.issues.append(f"Invalid JSON: {description} - {str(e)}")
            return False
    
    def count_files(self, pattern, path=''):
        """Conta file con pattern"""
        search_path = self.site_path / path if path else self.site_path
        return len(list(search_path.glob(pattern)))
    
    def check_html_pages(self):
        """Verifica pagine HTML"""
        # Pages principali
        main_pages = [
            'index.html',
            'pages/cardiologia.html',
            'pages/ginecologia.html',
            'pages/laboratorio.html',
            'pages/slim-care.html',
            'pages/contatti.html',
            'pages/chi-siamo.html'
        ]
        
        for page in main_pages:
            self.check_file_exists(page, f"Main page: {page}")
        
        # Équipe pages
        equipe_count = self.count_files('*.html', 'equipe')
        self.stats['equipe_pages'] = equipe_count
        
        if equipe_count < 50:
            self.warnings.append(f"Low équipe page count: {equipe_count} (expected 53)")
    
    def check_databases(self):
        """Verifica database JSON"""
        dbs = [
            ('data/entities/physicians-complete.json', 'Physicians DB'),
            ('data/entities/physicians-extended.json', 'Extended DB'),
            ('js/database.js', 'Knowledge Graph')
        ]
        
        for path, desc in dbs:
            if path.endswith('.json'):
                self.check_file_exists(path, desc)
                if (self.site_path / path).exists():
                    self.check_json_valid(path, desc)
    
    def check_assets(self):
        """Verifica asset principali"""
        assets = [
            'css/style.css',
            'js/main.js',
            'js/physician-profile.js'
        ]
        
        for asset in assets:
            self.check_file_exists(asset, f"Asset: {asset}")
    
    def check_schema_presence(self):
        """Verifica presenza schema.org"""
        equipe_path = self.site_path / 'equipe'
        pages_with_schema = 0
        pages_with_faq = 0
        
        for html_file in equipe_path.glob('*.html'):
            if html_file.name == 'index.html':
                continue
            
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '"@type": "Physician"' in content or '"@type":"Physician"' in content:
                pages_with_schema += 1
            
            if '"@type": "FAQPage"' in content or '"@type":"FAQPage"' in content:
                pages_with_faq += 1
        
        self.stats['pages_with_physician_schema'] = pages_with_schema
        self.stats['pages_with_faq_schema'] = pages_with_faq
        
        if pages_with_schema < 50:
            self.warnings.append(f"Low schema coverage: {pages_with_schema} pages")
    
    def run(self):
        """Esegue health check completo"""
        print("=" * 50)
        print("BIO-CLINIC HEALTH CHECK")
        print("=" * 50)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Run checks
        print("Running checks...")
        self.check_html_pages()
        self.check_databases()
        self.check_assets()
        self.check_schema_presence()
        
        # Statistics
        self.stats['html_pages'] = self.count_files('**/*.html')
        self.stats['css_files'] = self.count_files('**/*.css')
        self.stats['js_files'] = self.count_files('**/*.js')
        
        print()
        print("STATISTICS")
        print("-" * 40)
        for key, value in self.stats.items():
            print(f"  {key}: {value}")
        
        # Issues
        if self.issues:
            print()
            print("CRITICAL ISSUES")
            print("-" * 40)
            for issue in self.issues:
                print(f"  ✗ {issue}")
        
        # Warnings
        if self.warnings:
            print()
            print("WARNINGS")
            print("-" * 40)
            for warning in self.warnings:
                print(f"  ⚠ {warning}")
        
        # Summary
        print()
        print("=" * 50)
        if self.issues:
            print(f"STATUS: ✗ CRITICAL ({len(self.issues)} issues)")
            return 1
        elif self.warnings:
            print(f"STATUS: ⚠ WARNING ({len(self.warnings)} warnings)")
            return 0
        else:
            print("STATUS: ✓ HEALTHY")
            return 0

def main():
    site_path = Path(__file__).parent.parent
    checker = HealthChecker(site_path)
    exit_code = checker.run()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
