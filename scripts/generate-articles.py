#!/usr/bin/env python3
"""
Bio-Clinic Article Generator v1.0
Generates complete HTML articles from CSV calendar data.
Each article follows the exact schema of the published ipertensione-arteriosa article.
Articles are saved as drafts in site/salute/_drafts/{slug}/index.html
"""

import csv
import json
import os
import sys
import html as html_module
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SITE_DIR = os.path.join(ROOT_DIR, "site")
DRAFTS_DIR = os.path.join(SITE_DIR, "salute", "_drafts")
CSV_PATH = os.path.join(ROOT_DIR, "bio-clinic-calendario-90gg.csv")

# ── Specialist Database ──
SPECIALIST_DB = {
    'alessandra-musinu': {'name': 'Dott.ssa Alessandra Musinu', 'role': 'Dermatologa', 'albo': '5405'},
    'alessandro-pandolfi': {'name': 'Dott. Alessandro Pandolfi', 'role': 'Biologo Nutrizionista', 'albo': '73215'},
    'alessia-piras': {'name': 'Dott.ssa Alessia Piras', 'role': 'Psicoterapeuta', 'albo': ''},
    'andrea-donato': {'name': 'Dott. Andrea Donato', 'role': 'Ortopedico', 'albo': '5659'},
    'angelica-fois': {'name': 'Dott.ssa Angelica Fois', 'role': 'Ostetrica', 'albo': '5905'},
    'angelo-deplano': {'name': 'Dott. Angelo Deplano', 'role': 'Gastroenterologo', 'albo': '1773'},
    'antonella-galatino': {'name': 'Dott.ssa Antonella Galatino', 'role': 'Nutrizionista', 'albo': ''},
    'antonella-pruneddu': {'name': 'Dott.ssa Antonella Pruneddu', 'role': 'Ginecologa', 'albo': '4957'},
    'antonio-michele-cavazzuti': {'name': 'Dott. Antonio Michele Cavazzuti', 'role': 'Ecografista', 'albo': '2060'},
    'antonio-solinas': {'name': 'Prof. Antonio Solinas', 'role': 'Internista - Epatologo', 'albo': '1577'},
    'camilla-ruzzoli': {'name': 'Dott.ssa Camilla Ruzzoli', 'role': 'Ostetrica', 'albo': ''},
    'carlo-burrai': {'name': 'Dr. Carlo Burrai', 'role': 'Endocrinologo Pediatra', 'albo': '2295'},
    'carlos-manuel-cambara-zuniga': {'name': 'Dott. Carlos Manuel Cambara Zuniga', 'role': 'Urologo - Andrologo', 'albo': '5506'},
    'cinzia-guarino': {'name': 'Dott.ssa Cinzia Guarino', 'role': 'Biologa Laboratorio', 'albo': ''},
    'daniele-sabiu': {'name': 'Dr. Daniele Sabiu', 'role': 'Ematologo', 'albo': '3669'},
    'fabrizia-caucci': {'name': 'Dott.ssa Fabrizia Caucci', 'role': 'Diabetologa - Endocrinologa', 'albo': '4213'},
    'francesco-bussu': {'name': 'Prof. Francesco Bussu', 'role': 'Otorinolaringoiatra', 'albo': '56622'},
    'francesco-dessole': {'name': 'Dott. Francesco Dessole', 'role': 'Ginecologo', 'albo': '5244'},
    'francesco-santoru': {'name': 'Dott. Francesco Santoru', 'role': 'Oculista', 'albo': '6098'},
    'francesco-tolu': {'name': 'Dott. Francesco Tolu', 'role': 'Endocrinologo', 'albo': '4803'},
    'gianfranco-manchia': {'name': 'Dott. Gianfranco Manchia', 'role': 'Medico Competente', 'albo': '3431'},
    'giorgio-chiarelli': {'name': 'Dr. Giorgio Chiarelli', 'role': 'Medico dello Sport', 'albo': '3471'},
    'giovanna-costa': {'name': 'Dott.ssa Giovanna Costa', 'role': 'Dermatologa', 'albo': '2596'},
    'giuliana-guagnozzi': {'name': 'Dott.ssa Giuliana Guagnozzi', 'role': 'Cardiologa', 'albo': '42447'},
    'gloria-reggiani': {'name': 'Dott.ssa Gloria Reggiani', 'role': 'Biologa Laboratorio', 'albo': ''},
    'guido-marongiu': {'name': 'Dott. Guido Marongiu', 'role': 'Chirurgo Vascolare', 'albo': '6287'},
    'irene-aini': {'name': 'Dott.ssa Irene Aini', 'role': 'Endocrinologa', 'albo': '6379'},
    'luigi-podda': {'name': 'Dott. Luigi Podda', 'role': 'Ematologo', 'albo': '3633'},
    'maddalena-pola': {'name': 'Dott.ssa Maddalena Pola', 'role': 'Ginecologa', 'albo': '5037'},
    'marco-petrillo': {'name': 'Prof. Marco Petrillo', 'role': 'Ginecologo', 'albo': '6333'},
    'margherita-dessole': {'name': 'Dott.ssa Margherita Dessole', 'role': 'Ginecologa', 'albo': '5333'},
    'maria-laura-de-luca': {'name': 'Dott.ssa Maria Laura De Luca', 'role': 'Neurologa', 'albo': '5408'},
    'maria-pina-pintus': {'name': 'Dott.ssa Maria Pina Pintus', 'role': 'Oculista', 'albo': '3241'},
    'mariolina-azara': {'name': 'Dott.ssa Mariolina Azara', 'role': 'Pediatra', 'albo': '4300'},
    'matteo-zucca': {'name': 'Dott. Matteo Zucca', 'role': 'Oculista', 'albo': '6230'},
    'niccolo-melis': {'name': 'Dott. Niccolò Melis', 'role': 'Reumatologo', 'albo': '2937'},
    'nicola-frau': {'name': 'Dott. Nicola Frau', 'role': 'Fisiatra', 'albo': '1306'},
    'paola-dettori': {'name': 'Dott.ssa Paola Dettori', 'role': 'Chirurgo Vascolare', 'albo': '4879'},
    'paolo-dessole': {'name': 'Dott. Paolo Dessole', 'role': 'Nefrologo', 'albo': '2748'},
    'paolo-franca': {'name': 'Dott. Paolo Franca', 'role': 'Cardiologo', 'albo': '6108'},
    'paolo-pischedda': {'name': 'Dott. Paolo Pischedda', 'role': 'Cardiologo', 'albo': '5264'},
    'pietro-lisai': {'name': 'Dott. Pietro Lisai', 'role': 'Ortopedico', 'albo': '3174'},
    'pietro-pirina': {'name': 'Prof. Pietro Pirina', 'role': 'Pneumologo', 'albo': '2987'},
    'roberto-mancino': {'name': 'Dott. Roberto Mancino', 'role': 'Chirurgo Vascolare', 'albo': '5359'},
    'salvatore-dessole': {'name': 'Prof. Salvatore Dessole', 'role': 'Direttore Sanitario', 'albo': '1556'},
    'sara-uras': {'name': 'Dott.ssa Sara Uras', 'role': 'Cardiologa', 'albo': '5084'},
    'sebastiano-traccis': {'name': 'Dott. Sebastiano Traccis', 'role': 'Neurologo', 'albo': '2714'},
    'sergio-paolo-sotgia': {'name': 'Dott. Sergio Paolo Sotgia', 'role': 'Nefrologo', 'albo': '5050'},
    'sonia-bove': {'name': 'Dott.ssa Sonia Bove', 'role': 'Ginecologa - Senologa', 'albo': '59654'},
    'speranza-anedda': {'name': 'Dott.ssa Speranza Anedda', 'role': 'Dermatologa', 'albo': '10444'},
    'tonino-bullitta': {'name': 'Dr. Tonino Bullitta', 'role': 'Cardiologo', 'albo': '2054'},
}

# ── Specialty Metadata ──
SPECIALTY_META = {
    'cardiologia': {'emoji': '❤️', 'page': '/cardiologia/', 'color': '#E53935', 'label': 'Cardiologia'},
    'endocrinologia': {'emoji': '🦋', 'page': '/endocrinologia/', 'color': '#8E24AA', 'label': 'Endocrinologia'},
    'ginecologia': {'emoji': '👩‍⚕️', 'page': '/ginecologia/', 'color': '#E91E8C', 'label': 'Ginecologia'},
    'gastroenterologia': {'emoji': '🔬', 'page': '/gastroenterologia/', 'color': '#FF8F00', 'label': 'Gastroenterologia'},
    'ortopedia': {'emoji': '🦴', 'page': '/ortopedia/', 'color': '#1565C0', 'label': 'Ortopedia'},
    'dermatologia': {'emoji': '🩺', 'page': '/dermatologia/', 'color': '#00897B', 'label': 'Dermatologia'},
    'urologia': {'emoji': '🩺', 'page': '/urologia/', 'color': '#5D4037', 'label': 'Urologia'},
    'neurologia': {'emoji': '🧠', 'page': '/neurologia/', 'color': '#6A1B9A', 'label': 'Neurologia'},
    'ematologia': {'emoji': '🩸', 'page': '/ematologia/', 'color': '#C62828', 'label': 'Ematologia'},
    'pneumologia': {'emoji': '🫁', 'page': '/pneumologia/', 'color': '#0277BD', 'label': 'Pneumologia'},
    'reumatologia': {'emoji': '🦴', 'page': '/reumatologia/', 'color': '#4527A0', 'label': 'Reumatologia'},
    'oculistica': {'emoji': '👁️', 'page': '/oculistica/', 'color': '#2E7D32', 'label': 'Oculistica'},
    'otorinolaringoiatria': {'emoji': '👂', 'page': '/otorinolaringoiatria/', 'color': '#EF6C00', 'label': 'Otorinolaringoiatria'},
    'chirurgia-vascolare': {'emoji': '🩺', 'page': '/chirurgia-vascolare/', 'color': '#AD1457', 'label': 'Chirurgia Vascolare'},
    'nefrologia': {'emoji': '🩺', 'page': '/nefrologia/', 'color': '#00695C', 'label': 'Nefrologia'},
    'pediatria': {'emoji': '👶', 'page': '/pediatria/', 'color': '#F48FB1', 'label': 'Pediatria'},
    'nutrizionale': {'emoji': '🥗', 'page': '/nutrizione/', 'color': '#7CB342', 'label': 'Nutrizione'},
    'medicina-interna': {'emoji': '🏥', 'page': '/medicina-interna/', 'color': '#546E7A', 'label': 'Medicina Interna'},
    'psicologia': {'emoji': '🧠', 'page': '/psicologia/', 'color': '#AB47BC', 'label': 'Psicologia'},
    'medicina-sport': {'emoji': '🏃', 'page': '/medicina-sport/', 'color': '#00ACC1', 'label': 'Medicina dello Sport'},
    'medicina-lavoro': {'emoji': '🏭', 'page': '/medicina-del-lavoro/', 'color': '#8D6E63', 'label': 'Medicina del Lavoro'},
    'laboratorio': {'emoji': '🔬', 'page': '/laboratorio/', 'color': '#607D8B', 'label': 'Laboratorio Analisi'},
}

# ── ICD-10 Codes ──
ICD10_CODES = {
    'ipertensione-arteriosa': ('I10', 'Ipertensione arteriosa essenziale'),
    'ipotiroidismo': ('E03.9', 'Ipotiroidismo non specificato'),
    'endometriosi-sintomi': ('N80', 'Endometriosi'),
    'diabete-tipo-2-sardegna': ('E11', 'Diabete mellito tipo 2'),
    'anemia-mediterranea-talassemia': ('D56', 'Talassemia'),
    'reflusso-gastroesofageo': ('K21', 'Malattia da reflusso gastroesofageo'),
    'noduli-tiroidei': ('E04', 'Gozzo non tossico'),
    'cervicalgia-dolore-collo': ('M54.2', 'Cervicalgia'),
    'dermatite-atopica': ('L20', 'Dermatite atopica'),
    'cistite-ricorrente': ('N30.1', 'Cistite interstiziale cronica'),
    'fibrillazione-atriale': ('I48', 'Fibrillazione e flutter atriale'),
    'sindrome-ovaio-policistico': ('E28.2', 'Sindrome dell\'ovaio policistico'),
    'ernia-disco-lombare': ('M51.1', 'Disturbi dei dischi lombari'),
    'helicobacter-pylori': ('B96.81', 'Helicobacter pylori'),
    'ipertiroidismo': ('E05', 'Tireotossicosi'),
    'asma-bronchiale': ('J45', 'Asma'),
    'menopausa-sintomi': ('N95.1', 'Stati menopausali e climaterici'),
    'psoriasi': ('L40', 'Psoriasi'),
    'prostatite': ('N41', 'Prostatite'),
    'colesterolo-alto': ('E78', 'Ipercolesterolemia'),
    'artrite-reumatoide-sardegna': ('M05', 'Artrite reumatoide'),
    'cefalea-emicrania': ('G43', 'Emicrania'),
    'infertilita-femminile': ('N97', 'Infertilità femminile'),
    'sclerosi-multipla-sardegna': ('G35', 'Sclerosi multipla'),
    'insufficienza-venosa': ('I87.2', 'Insufficienza venosa cronica'),
    'otite-acufeni': ('H93.1', 'Acufene'),
    'glaucoma': ('H40', 'Glaucoma'),
    'celiachia-sardegna': ('K90.0', 'Celiachia'),
    'nefropatia-diabetica': ('E11.22', 'Nefropatia diabetica'),
    'obesita-sindrome-metabolica': ('E66', 'Obesità'),
    'calcoli-renali': ('N20', 'Calcolosi renale'),
    'ansia-attacchi-panico': ('F41.0', 'Disturbo di panico'),
    'tunnel-carpale': ('G56.0', 'Sindrome del tunnel carpale'),
    'gastrite-cronica': ('K29.5', 'Gastrite cronica'),
    'ecografia-gravidanza': ('Z36', 'Screening prenatale'),
    'apnee-notturne': ('G47.33', 'Apnea ostruttiva del sonno'),
    'allergie-stagionali': ('J30.1', 'Rinite allergica'),
    'scoliosi-postura': ('M41', 'Scoliosi'),
    'epatite-steatosi-epatica': ('K76.0', 'Steatosi epatica'),
    'nei-melanoma-prevenzione': ('D22', 'Nevi melanocitici'),
    'endocrinologo-pediatrico': ('E30', 'Disturbi endocrini pediatrici'),
    'ipertrofia-prostatica': ('N40', 'Ipertrofia prostatica'),
    'vertigini-labirintite': ('H81', 'Disturbi della funzione vestibolare'),
    'infertilita-maschile': ('N46', 'Infertilità maschile'),
    'fibromialgia': ('M79.7', 'Fibromialgia'),
    'vitamina-d-carenza': ('E55', 'Carenza di vitamina D'),
    'visita-medicina-sport': ('Z02.5', 'Esame per attività sportiva'),
    'sindrome-intestino-irritabile': ('K58', 'Sindrome dell\'intestino irritabile'),
    'osteoporosi-prevenzione': ('M81', 'Osteoporosi'),
    'cataratta': ('H25', 'Cataratta senile'),
    'pap-test-hpv': ('Z12.4', 'Screening tumore cervice'),
    'medicina-lavoro-sassari': ('Z02.1', 'Visita medicina del lavoro'),
    'dolore-spalla': ('M75', 'Lesioni della spalla'),
    'tiroide-gravidanza': ('O99.28', 'Malattie tiroidee in gravidanza'),
    'eczema-mani': ('L30', 'Dermatite da contatto'),
    'incontinenza-urinaria': ('N39.3', 'Incontinenza urinaria'),
    'aritmie-cardiache': ('I49', 'Aritmie cardiache'),
    'ernia-inguinale': ('K40', 'Ernia inguinale'),
    'acne-adulti': ('L70', 'Acne'),
    'controllo-nei-bambini': ('Z00.1', 'Esame di routine del bambino'),
    'neuropatia-periferica': ('G62', 'Neuropatie periferiche'),
    'check-up-cardiovascolare': ('Z13.6', 'Screening cardiovascolare'),
    'alimentazione-sport': ('Z71.3', 'Consulenza dietetica'),
    'analisi-sangue-guida': ('Z01.7', 'Esame di laboratorio'),
}

print("DB loaded:", len(SPECIALIST_DB), "specialists,", len(ICD10_CODES), "ICD-10 codes")
print("Script ready. Use generate_all() or generate_one(slug)")
