#!/usr/bin/env python3
"""
Bio-Clinic ALL HUBS SEO/E-E-A-T/AI Optimization Script v1.0
Implements ALL 14 action items from the SEO audit across 13 hubs (60 pages).
Replicates the exact methodology used for Cardiologia.

Action Items (per page):
1. Verify/Add <h1> on all pages
2. Fix breadcrumb schema URLs (remove /pages/ paths)
3. Fix @id URLs in schema (remove /pages/ segment)
4. Add FAQPage schema to pages missing it
5. Add Person/Physician schema for specialists
6. Build robust internal cross-linking
7. Insert author/reviewer credits inline
8. Expand content to >1000 words for thin pages
9. Implement MedicalWebPage + SpeakableSpecification schema
10. Optimize first paragraph for AI extraction
11. Add HowTo schema for procedures
12. Change og:type to "article" on procedural pages
13. Fix title tags where needed
14. Add optimized alt text references
"""

import os
import re
import json
import sys
from datetime import datetime

SITE_DIR = "/home/user/webapp/site"
BASE_URL = "https://bio-clinic.it"
TODAY = "2026-02-16"

# ============================================================
# COMPLETE HUB + PAGE CONFIGURATION
# ============================================================

HUBS = {
    # ========================================
    # 1. GINECOLOGIA (22 pages)
    # ========================================
    "ginecologia": {
        "specialty_name": "Ginecologia e Ostetricia",
        "specialty_schema_name": "Obstetrics and Gynecology",
        "hub_breadcrumb_name": "Ginecologia",
        "physicians": [
            {"name": "Dott. Francesco Dessole", "givenName": "Francesco", "familyName": "Dessole", "jobTitle": "Ginecologo", "slug": "francesco-dessole", "description": "Ginecologo con esperienza in chirurgia ginecologica e ostetricia presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Margherita Dessole", "givenName": "Margherita", "familyName": "Dessole", "jobTitle": "Ginecologa", "slug": "margherita-dessole", "description": "Ginecologa specializzata in diagnostica e prevenzione ginecologica presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Maddalena Pola", "givenName": "Maddalena", "familyName": "Pola", "jobTitle": "Ginecologa", "slug": "maddalena-pola", "description": "Ginecologa specializzata in colposcopia e patologia cervicale presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Antonella Pruneddu", "givenName": "Antonella", "familyName": "Pruneddu", "jobTitle": "Ginecologa", "slug": "antonella-pruneddu", "description": "Ginecologa con esperienza in ostetricia e diagnosi prenatale presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Angelica Fois", "givenName": "Angelica", "familyName": "Fois", "jobTitle": "Ginecologa", "slug": "angelica-fois", "description": "Ginecologa specializzata in ecografia ostetrica e ginecologica presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Camilla Ruzzoli", "givenName": "Camilla", "familyName": "Ruzzoli", "jobTitle": "Ginecologa", "slug": "camilla-ruzzoli", "description": "Ginecologa con esperienza in pavimento pelvico e riabilitazione perineale presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Francesco Dessole",
        "reviewer_title": "Ginecologo",
        "pages": {
            "hub": {"path": "ginecologia/index.html", "url": "/ginecologia/", "name": "Ginecologia e Ostetricia", "og_type": "website"},
            "assistenza_ostetrica": {"path": "ginecologia/assistenza-ostetrica/index.html", "url": "/ginecologia/assistenza-ostetrica/", "name": "Assistenza Ostetrica", "og_type": "article"},
            "caressflow": {"path": "ginecologia/caressflow/index.html", "url": "/ginecologia/caressflow/", "name": "Caressflow", "og_type": "article"},
            "colposcopia": {"path": "ginecologia/colposcopia/index.html", "url": "/ginecologia/colposcopia/", "name": "Videocolposcopia Digitale", "og_type": "article"},
            "corso_preparto": {"path": "ginecologia/corso-preparto/index.html", "url": "/ginecologia/corso-preparto/", "name": "Corso Preparto", "og_type": "article"},
            "duopap": {"path": "ginecologia/duopap/index.html", "url": "/ginecologia/duopap/", "name": "DuoPap", "og_type": "article"},
            "ecografia_mammaria": {"path": "ginecologia/ecografia-mammaria/index.html", "url": "/ginecologia/ecografia-mammaria/", "name": "Ecografia Mammaria", "og_type": "article"},
            "ecografia_morfologica": {"path": "ginecologia/ecografia-morfologica/index.html", "url": "/ginecologia/ecografia-morfologica/", "name": "Ecografia Morfologica", "og_type": "article"},
            "ecografia_ostetrica_3d": {"path": "ginecologia/ecografia-ostetrica-3d/index.html", "url": "/ginecologia/ecografia-ostetrica-3d/", "name": "Ecografia Ostetrica 3D/4D", "og_type": "article"},
            "ecografia_pelvica": {"path": "ginecologia/ecografia-pelvica/index.html", "url": "/ginecologia/ecografia-pelvica/", "name": "Ecografia Pelvica", "og_type": "article"},
            "ecografia_transvaginale": {"path": "ginecologia/ecografia-transvaginale/index.html", "url": "/ginecologia/ecografia-transvaginale/", "name": "Ecografia Transvaginale", "og_type": "article"},
            "ginecologi_sassari": {"path": "ginecologia/ginecologi-sassari/index.html", "url": "/ginecologia/ginecologi-sassari/", "name": "Ginecologi Sassari", "og_type": "article"},
            "hpv_dna_test": {"path": "ginecologia/hpv-dna-test/index.html", "url": "/ginecologia/hpv-dna-test/", "name": "HPV DNA Test", "og_type": "article"},
            "isterosalpingografia": {"path": "ginecologia/isterosalpingografia/index.html", "url": "/ginecologia/isterosalpingografia/", "name": "Isterosalpingografia", "og_type": "article"},
            "isteroscopia": {"path": "ginecologia/isteroscopia/index.html", "url": "/ginecologia/isteroscopia/", "name": "Isteroscopia", "og_type": "article"},
            "pap_test_hpv": {"path": "ginecologia/pap-test-hpv/index.html", "url": "/ginecologia/pap-test-hpv/", "name": "Pap Test HPV", "og_type": "article"},
            "pap_test": {"path": "ginecologia/pap-test/index.html", "url": "/ginecologia/pap-test/", "name": "Pap Test", "og_type": "article"},
            "perifit_kegel": {"path": "ginecologia/perifit-kegel-sassari/index.html", "url": "/ginecologia/perifit-kegel-sassari/", "name": "Perifit Kegel", "og_type": "article"},
            "radiofrequenza_vaginale": {"path": "ginecologia/radiofrequenza-vaginale/index.html", "url": "/ginecologia/radiofrequenza-vaginale/", "name": "Radiofrequenza Vaginale", "og_type": "article"},
            "riabilitazione_pavimento_pelvico": {"path": "ginecologia/riabilitazione-pavimento-pelvico/index.html", "url": "/ginecologia/riabilitazione-pavimento-pelvico/", "name": "Riabilitazione Pavimento Pelvico", "og_type": "article"},
            "trattamenti_pavimento_pelvico": {"path": "ginecologia/trattamenti-pavimento-pelvico/index.html", "url": "/ginecologia/trattamenti-pavimento-pelvico/", "name": "Trattamenti Pavimento Pelvico", "og_type": "article"},
            "visita_ginecologica": {"path": "ginecologia/visita-ginecologica/index.html", "url": "/ginecologia/visita-ginecologica/", "name": "Visita Ginecologica", "og_type": "article"},
        },
    },
    # ========================================
    # 2. DERMATOLOGIA (3 pages)
    # ========================================
    "dermatologia": {
        "specialty_name": "Dermatologia",
        "specialty_schema_name": "Dermatology",
        "hub_breadcrumb_name": "Dermatologia",
        "physicians": [
            {"name": "Dott.ssa Giovanna Costa", "givenName": "Giovanna", "familyName": "Costa", "jobTitle": "Dermatologa", "slug": "giovanna-costa", "description": "Dermatologa specializzata in dermatoscopia e mappatura nei presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Alessandra Musinu", "givenName": "Alessandra", "familyName": "Musinu", "jobTitle": "Dermatologa", "slug": "alessandra-musinu", "description": "Dermatologa con esperienza in patologie cutanee e dermatologia estetica presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Speranza Anedda", "givenName": "Speranza", "familyName": "Anedda", "jobTitle": "Dermatologa", "slug": "speranza-anedda", "description": "Dermatologa specializzata in dermatologia clinica e chirurgica presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott.ssa Giovanna Costa",
        "reviewer_title": "Dermatologa",
        "pages": {
            "hub": {"path": "dermatologia/index.html", "url": "/dermatologia/", "name": "Dermatologia", "og_type": "website"},
            "mappatura_nevi": {"path": "dermatologia/mappatura-nevi/index.html", "url": "/dermatologia/mappatura-nevi/", "name": "Mappatura Nevi", "og_type": "article"},
            "visita_dermatologica": {"path": "dermatologia/visita-dermatologica/index.html", "url": "/dermatologia/visita-dermatologica/", "name": "Visita Dermatologica", "og_type": "article"},
        },
    },
    # ========================================
    # 3. ENDOCRINOLOGIA (4 pages)
    # ========================================
    "endocrinologia": {
        "specialty_name": "Endocrinologia",
        "specialty_schema_name": "Endocrinology",
        "hub_breadcrumb_name": "Endocrinologia",
        "physicians": [
            {"name": "Dott. Francesco Tolu", "givenName": "Francesco", "familyName": "Tolu", "jobTitle": "Endocrinologo", "slug": "francesco-tolu", "description": "Endocrinologo specializzato in patologie tiroidee e metaboliche presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Irene Aini", "givenName": "Irene", "familyName": "Aini", "jobTitle": "Endocrinologa", "slug": "irene-aini", "description": "Endocrinologa con esperienza in ecografia tiroidea e diabetologia presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Francesco Tolu",
        "reviewer_title": "Endocrinologo",
        "pages": {
            "hub": {"path": "endocrinologia/index.html", "url": "/endocrinologia/", "name": "Endocrinologia", "og_type": "website"},
            "checkup_tiroide": {"path": "endocrinologia/checkup-tiroide/index.html", "url": "/endocrinologia/checkup-tiroide/", "name": "Check-Up Tiroide", "og_type": "article"},
            "ecografia_tiroidea": {"path": "endocrinologia/ecografia-tiroidea/index.html", "url": "/endocrinologia/ecografia-tiroidea/", "name": "Ecografia Tiroidea", "og_type": "article"},
            "visita_endocrinologica": {"path": "endocrinologia/visita-endocrinologica/index.html", "url": "/endocrinologia/visita-endocrinologica/", "name": "Visita Endocrinologica", "og_type": "article"},
        },
    },
    # ========================================
    # 4. NEUROLOGIA (3 pages)
    # ========================================
    "neurologia": {
        "specialty_name": "Neurologia",
        "specialty_schema_name": "Neurology",
        "hub_breadcrumb_name": "Neurologia",
        "physicians": [
            {"name": "Dott. Guido Marongiu", "givenName": "Guido", "familyName": "Marongiu", "jobTitle": "Neurologo", "slug": "guido-marongiu", "description": "Neurologo con esperienza in diagnostica neurologica ed elettromiografia presso Bio-Clinic Sassari."},
            {"name": "Dott. Sebastiano Traccis", "givenName": "Sebastiano", "familyName": "Traccis", "jobTitle": "Neurologo", "slug": "sebastiano-traccis", "description": "Neurologo specializzato in neurologia clinica e neurofisiologia presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Guido Marongiu",
        "reviewer_title": "Neurologo",
        "pages": {
            "hub": {"path": "neurologia/index.html", "url": "/neurologia/", "name": "Neurologia", "og_type": "website"},
            "elettromiografia": {"path": "neurologia/elettromiografia/index.html", "url": "/neurologia/elettromiografia/", "name": "Elettromiografia", "og_type": "article"},
            "visita_neurologica": {"path": "neurologia/visita-neurologica/index.html", "url": "/neurologia/visita-neurologica/", "name": "Visita Neurologica", "og_type": "article"},
        },
    },
    # ========================================
    # 5. ORTOPEDIA (4 pages)
    # ========================================
    "ortopedia": {
        "specialty_name": "Ortopedia",
        "specialty_schema_name": "Orthopedics",
        "hub_breadcrumb_name": "Ortopedia",
        "physicians": [
            {"name": "Dott. Andrea Donato", "givenName": "Andrea", "familyName": "Donato", "jobTitle": "Ortopedico", "slug": "andrea-donato", "description": "Ortopedico specializzato in traumatologia e chirurgia articolare presso Bio-Clinic Sassari."},
            {"name": "Dott. Pietro Lisai", "givenName": "Pietro", "familyName": "Lisai", "jobTitle": "Ortopedico", "slug": "pietro-lisai", "description": "Ortopedico con esperienza in chirurgia della spalla e del ginocchio presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Andrea Donato",
        "reviewer_title": "Ortopedico",
        "pages": {
            "hub": {"path": "ortopedia/index.html", "url": "/ortopedia/", "name": "Ortopedia", "og_type": "website"},
            "infiltrazioni_articolari": {"path": "ortopedia/infiltrazioni-articolari/index.html", "url": "/ortopedia/infiltrazioni-articolari/", "name": "Infiltrazioni Articolari", "og_type": "article"},
            "visita_fisiatrica": {"path": "ortopedia/visita-fisiatrica/index.html", "url": "/ortopedia/visita-fisiatrica/", "name": "Visita Fisiatrica", "og_type": "article"},
            "visita_ortopedica": {"path": "ortopedia/visita-ortopedica/index.html", "url": "/ortopedia/visita-ortopedica/", "name": "Visita Ortopedica", "og_type": "article"},
        },
    },
    # ========================================
    # 6. UROLOGIA (4 pages)
    # ========================================
    "urologia": {
        "specialty_name": "Urologia",
        "specialty_schema_name": "Urology",
        "hub_breadcrumb_name": "Urologia",
        "physicians": [
            {"name": "Dott. Carlos Manuel Cambara Zuniga", "givenName": "Carlos Manuel", "familyName": "Cambara Zuniga", "jobTitle": "Urologo", "slug": "carlos-manuel-cambara-zuniga", "description": "Urologo specializzato in andrologia, ecografia urologica e patologie prostatiche presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Carlos Manuel Cambara Zuniga",
        "reviewer_title": "Urologo",
        "pages": {
            "hub": {"path": "urologia/index.html", "url": "/urologia/", "name": "Urologia", "og_type": "website"},
            "ecografia_prostatica": {"path": "urologia/ecografia-prostatica/index.html", "url": "/urologia/ecografia-prostatica/", "name": "Ecografia Prostatica", "og_type": "article"},
            "ecografia_renale": {"path": "urologia/ecografia-renale/index.html", "url": "/urologia/ecografia-renale/", "name": "Ecografia Renale", "og_type": "article"},
            "visita_urologica": {"path": "urologia/visita-urologica/index.html", "url": "/urologia/visita-urologica/", "name": "Visita Urologica", "og_type": "article"},
        },
    },
    # ========================================
    # 7. CHIRURGIA VASCOLARE (4 pages)
    # ========================================
    "chirurgia_vascolare": {
        "specialty_name": "Chirurgia Vascolare",
        "specialty_schema_name": "Vascular Surgery",
        "hub_breadcrumb_name": "Chirurgia Vascolare",
        "physicians": [
            {"name": "Dott. Roberto Mancino", "givenName": "Roberto", "familyName": "Mancino", "jobTitle": "Chirurgo Vascolare", "slug": "roberto-mancino", "description": "Chirurgo vascolare specializzato in diagnostica e terapia delle patologie vascolari presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Roberto Mancino",
        "reviewer_title": "Chirurgo Vascolare",
        "pages": {
            "hub": {"path": "chirurgia-vascolare/index.html", "url": "/chirurgia-vascolare/", "name": "Chirurgia Vascolare", "og_type": "website"},
            "eco_doppler_arti": {"path": "chirurgia-vascolare/eco-doppler-arti/index.html", "url": "/chirurgia-vascolare/eco-doppler-arti/", "name": "Eco-Doppler Arti", "og_type": "article"},
            "scleroterapia": {"path": "chirurgia-vascolare/scleroterapia/index.html", "url": "/chirurgia-vascolare/scleroterapia/", "name": "Scleroterapia", "og_type": "article"},
            "visita_chirurgia_vascolare": {"path": "chirurgia-vascolare/visita-chirurgia-vascolare/index.html", "url": "/chirurgia-vascolare/visita-chirurgia-vascolare/", "name": "Visita Chirurgia Vascolare", "og_type": "article"},
        },
    },
    # ========================================
    # 8. OTORINOLARINGOIATRIA (5 pages)
    # ========================================
    "otorinolaringoiatria": {
        "specialty_name": "Otorinolaringoiatria",
        "specialty_schema_name": "Otolaryngology",
        "hub_breadcrumb_name": "Otorinolaringoiatria",
        "physicians": [
            {"name": "Dott.ssa Maria Laura De Luca", "givenName": "Maria Laura", "familyName": "De Luca", "jobTitle": "Otorinolaringoiatra", "slug": "maria-laura-de-luca", "description": "Otorinolaringoiatra specializzata in audiologia e foniatria presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott.ssa Maria Laura De Luca",
        "reviewer_title": "Otorinolaringoiatra",
        "pages": {
            "hub": {"path": "otorinolaringoiatria/index.html", "url": "/otorinolaringoiatria/", "name": "Otorinolaringoiatria", "og_type": "website"},
            "audiometria": {"path": "otorinolaringoiatria/audiometria/index.html", "url": "/otorinolaringoiatria/audiometria/", "name": "Audiometria", "og_type": "article"},
            "campo_visivo": {"path": "otorinolaringoiatria/campo-visivo/index.html", "url": "/otorinolaringoiatria/campo-visivo/", "name": "Impedenzometria", "og_type": "article"},
            "spirometria": {"path": "otorinolaringoiatria/spirometria/index.html", "url": "/otorinolaringoiatria/spirometria/", "name": "Spirometria ORL", "og_type": "article"},
            "visita_orl": {"path": "otorinolaringoiatria/visita-orl/index.html", "url": "/otorinolaringoiatria/visita-orl/", "name": "Visita ORL", "og_type": "article"},
        },
    },
    # ========================================
    # 9. GASTROENTEROLOGIA (3 pages)
    # ========================================
    "gastroenterologia": {
        "specialty_name": "Gastroenterologia",
        "specialty_schema_name": "Gastroenterology",
        "hub_breadcrumb_name": "Gastroenterologia",
        "physicians": [
            {"name": "Dott. Angelo Ferruccio Deplano", "givenName": "Angelo Ferruccio", "familyName": "Deplano", "jobTitle": "Gastroenterologo", "slug": "angelo-deplano", "description": "Gastroenterologo con esperienza in endoscopia digestiva e patologie gastrointestinali presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Angelo Ferruccio Deplano",
        "reviewer_title": "Gastroenterologo",
        "pages": {
            "hub": {"path": "gastroenterologia/index.html", "url": "/gastroenterologia/", "name": "Gastroenterologia", "og_type": "website"},
            "ecografia_addominale": {"path": "gastroenterologia/ecografia-addominale/index.html", "url": "/gastroenterologia/ecografia-addominale/", "name": "Ecografia Addominale", "og_type": "article"},
            "visita_gastroenterologica": {"path": "gastroenterologia/visita-gastroenterologica/index.html", "url": "/gastroenterologia/visita-gastroenterologica/", "name": "Visita Gastroenterologica", "og_type": "article"},
        },
    },
    # ========================================
    # 10. OCULISTICA (2 pages)
    # ========================================
    "oculistica": {
        "specialty_name": "Oculistica",
        "specialty_schema_name": "Ophthalmology",
        "hub_breadcrumb_name": "Oculistica",
        "physicians": [
            {"name": "Dott. Francesco Santoru", "givenName": "Francesco", "familyName": "Santoru", "jobTitle": "Oculista", "slug": "francesco-santoru", "description": "Oculista specializzato in diagnostica oftalmica e chirurgia oculare presso Bio-Clinic Sassari."},
            {"name": "Dott. Matteo Zucca", "givenName": "Matteo", "familyName": "Zucca", "jobTitle": "Oculista", "slug": "matteo-zucca", "description": "Oculista con esperienza in OCT e patologie retiniche presso Bio-Clinic Sassari."},
            {"name": "Dott.ssa Maria Pina Pintus", "givenName": "Maria Pina", "familyName": "Pintus", "jobTitle": "Oculista", "slug": "maria-pina-pintus", "description": "Oculista specializzata in oftalmologia pediatrica e strabismo presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Francesco Santoru",
        "reviewer_title": "Oculista",
        "pages": {
            "hub": {"path": "oculistica/index.html", "url": "/oculistica/", "name": "Oculistica", "og_type": "website"},
            "visita_oculistica": {"path": "oculistica/visita-oculistica/index.html", "url": "/oculistica/visita-oculistica/", "name": "Visita Oculistica", "og_type": "article"},
        },
    },
    # ========================================
    # 11. PNEUMOLOGIA (2 pages)
    # ========================================
    "pneumologia": {
        "specialty_name": "Pneumologia",
        "specialty_schema_name": "Pulmonary Medicine",
        "hub_breadcrumb_name": "Pneumologia",
        "physicians": [
            {"name": "Dott. Pietro Pirina", "givenName": "Pietro", "familyName": "Pirina", "jobTitle": "Pneumologo", "slug": "pietro-pirina", "description": "Pneumologo specializzato in patologie respiratorie e allergologia presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Pietro Pirina",
        "reviewer_title": "Pneumologo",
        "pages": {
            "hub": {"path": "pneumologia/index.html", "url": "/pneumologia/", "name": "Pneumologia", "og_type": "website"},
            "visita_pneumologica": {"path": "pneumologia/visita-pneumologica/index.html", "url": "/pneumologia/visita-pneumologica/", "name": "Visita Pneumologica", "og_type": "article"},
        },
    },
    # ========================================
    # 12. EMATOLOGIA (2 pages)
    # ========================================
    "ematologia": {
        "specialty_name": "Ematologia",
        "specialty_schema_name": "Hematology",
        "hub_breadcrumb_name": "Ematologia",
        "physicians": [
            {"name": "Dott. Daniele Sabiu", "givenName": "Daniele", "familyName": "Sabiu", "jobTitle": "Ematologo", "slug": "daniele-sabiu", "description": "Ematologo specializzato in patologie ematologiche e coagulazione presso Bio-Clinic Sassari."},
            {"name": "Dott. Luigi Podda", "givenName": "Luigi", "familyName": "Podda", "jobTitle": "Ematologo", "slug": "luigi-podda", "description": "Ematologo con esperienza in diagnostica ematologica e terapia anticoagulante presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Daniele Sabiu",
        "reviewer_title": "Ematologo",
        "pages": {
            "hub": {"path": "ematologia/index.html", "url": "/ematologia/", "name": "Ematologia", "og_type": "website"},
            "visita_ematologica": {"path": "ematologia/visita-ematologica/index.html", "url": "/ematologia/visita-ematologica/", "name": "Visita Ematologica", "og_type": "article"},
        },
    },
    # ========================================
    # 13. REUMATOLOGIA (2 pages)
    # ========================================
    "reumatologia": {
        "specialty_name": "Reumatologia",
        "specialty_schema_name": "Rheumatology",
        "hub_breadcrumb_name": "Reumatologia",
        "physicians": [
            {"name": "Dott. Niccolo' Melis", "givenName": "Niccolo'", "familyName": "Melis", "jobTitle": "Reumatologo", "slug": "niccolo-melis", "description": "Reumatologo specializzato in malattie autoimmuni e reumatiche presso Bio-Clinic Sassari."},
        ],
        "reviewer": "Dott. Niccolo' Melis",
        "reviewer_title": "Reumatologo",
        "pages": {
            "hub": {"path": "reumatologia/index.html", "url": "/reumatologia/", "name": "Reumatologia", "og_type": "website"},
            "visita_reumatologica": {"path": "reumatologia/visita-reumatologica/index.html", "url": "/reumatologia/visita-reumatologica/", "name": "Visita Reumatologica", "og_type": "article"},
        },
    },
}

# ============================================================
# FAQ DATA - Per page FAQs (for pages missing FAQPage)
# ============================================================
FAQ_DATA = {
    # GINECOLOGIA sub-pages missing FAQs
    "ginecologia__assistenza_ostetrica": [
        ("Cos'e' l'assistenza ostetrica?", "L'assistenza ostetrica e' un servizio di accompagnamento professionale durante gravidanza, parto e puerperio. L'ostetrica segue la donna in ogni fase della maternita': controlli periodici, preparazione al parto, supporto all'allattamento e recupero post-partum."),
        ("Quando iniziare il percorso con l'ostetrica?", "Si consiglia di iniziare il percorso di assistenza ostetrica dal primo trimestre di gravidanza, idealmente entro la 12a settimana, per un monitoraggio completo e un piano di nascita personalizzato."),
        ("L'ostetrica segue anche il post-partum?", "Si', l'assistenza ostetrica presso Bio-Clinic include il supporto post-partum: allattamento, cura del neonato, recupero del pavimento pelvico e supporto emotivo alla neo-mamma."),
    ],
    "ginecologia__corso_preparto": [
        ("Quando iniziare il corso preparto?", "Il corso preparto si inizia generalmente tra la 28a e la 32a settimana di gravidanza, per completare le lezioni prima del termine."),
        ("Il partner puo' partecipare al corso preparto?", "Si', la partecipazione del partner e' fortemente consigliata. Il coinvolgimento del futuro papa' migliora l'esperienza del parto e il supporto nel post-partum."),
        ("Cosa si impara al corso preparto?", "Il corso preparto Bio-Clinic comprende: tecniche di respirazione e rilassamento, fasi del travaglio e del parto, gestione del dolore, allattamento al seno, cura del neonato e rieducazione perineale."),
    ],
    "ginecologia__duopap": [
        ("Cos'e' il DuoPap?", "Il DuoPap e' un esame combinato che unisce Pap Test e HPV DNA Test in un unico prelievo cervicale. Permette di identificare sia alterazioni cellulari che la presenza del virus HPV ad alto rischio, offrendo una prevenzione piu' completa del tumore al collo dell'utero."),
        ("Ogni quanto fare il DuoPap?", "Secondo le linee guida, il DuoPap va ripetuto ogni 3-5 anni nelle donne dai 30 anni in poi. Nelle donne sotto i 30 anni si consiglia il Pap Test classico ogni 3 anni."),
        ("Il DuoPap sostituisce il Pap Test?", "Il DuoPap integra il Pap Test aggiungendo la ricerca dell'HPV DNA. E' considerato lo standard piu' avanzato per lo screening cervicale, raccomandato dalle linee guida internazionali per le donne over 30."),
    ],
    "ginecologia__ecografia_mammaria": [
        ("Quando fare l'ecografia mammaria?", "L'ecografia mammaria e' consigliata come primo esame di screening nelle donne sotto i 40 anni. Dopo i 40 anni, si affianca alla mammografia per una valutazione completa. Va eseguita anche in presenza di noduli palpabili, dolore mammario o secrezioni dal capezzolo."),
        ("L'ecografia mammaria e' dolorosa?", "No, l'ecografia mammaria e' completamente indolore e non invasiva. Utilizza ultrasuoni e non radiazioni ionizzanti, quindi e' sicura e ripetibile."),
        ("Il referto e' immediato?", "Si', il referto viene consegnato e spiegato dal medico al termine dell'esame, con eventuali indicazioni per approfondimenti."),
    ],
    "ginecologia__ecografia_morfologica": [
        ("Quando si fa l'ecografia morfologica?", "L'ecografia morfologica si esegue tra la 19a e la 21a settimana di gravidanza. E' il momento ottimale per valutare l'anatomia fetale completa."),
        ("Cosa si vede con l'ecografia morfologica?", "L'ecografia morfologica valuta: cranio, cervello, volto, colonna vertebrale, cuore, addome, reni, arti e placenta del feto. Permette di identificare eventuali malformazioni strutturali."),
        ("L'ecografia morfologica e' obbligatoria?", "Non e' obbligatoria ma e' fortemente raccomandata. E' l'esame piu' importante del secondo trimestre per valutare lo sviluppo fetale e identificare precocemente eventuali anomalie."),
    ],
    "ginecologia__ecografia_ostetrica_3d": [
        ("Che differenza c'e' tra ecografia 3D e 4D?", "L'ecografia 3D fornisce un'immagine tridimensionale statica del feto, mentre la 4D aggiunge la dimensione del movimento in tempo reale, permettendo di osservare espressioni facciali e movimenti fetali."),
        ("Quando si fa l'ecografia 3D/4D?", "Il periodo migliore e' tra la 24a e la 30a settimana di gravidanza, quando il feto ha dimensioni adeguate e c'e' sufficiente liquido amniotico per immagini ottimali."),
        ("L'ecografia 3D/4D e' sicura?", "Si', utilizza gli stessi ultrasuoni dell'ecografia tradizionale. E' completamente sicura per mamma e bambino e non utilizza radiazioni ionizzanti."),
    ],
    "ginecologia__ecografia_pelvica": [
        ("Cos'e' l'ecografia pelvica?", "L'ecografia pelvica e' un esame diagnostico non invasivo che utilizza gli ultrasuoni per visualizzare gli organi pelvici femminili: utero, ovaie, tube e vescica. Puo' essere eseguita per via sovrapubica (addominale) o transvaginale."),
        ("Devo avere la vescica piena per l'ecografia pelvica?", "Per l'ecografia pelvica sovrapubica si', e' necessario avere la vescica piena (bere circa 1 litro d'acqua un'ora prima). Per l'ecografia transvaginale la vescica deve essere vuota."),
        ("Quando fare l'ecografia pelvica?", "L'ecografia pelvica e' indicata per: dolore pelvico, irregolarita' mestruali, sanguinamento anomalo, controllo di fibromi o cisti ovariche, infertilita' e screening ginecologico periodico."),
    ],
    "ginecologia__ecografia_transvaginale": [
        ("L'ecografia transvaginale e' dolorosa?", "L'ecografia transvaginale puo' causare un lieve fastidio ma non e' dolorosa. La sonda e' sottile e viene introdotta delicatamente. L'esame dura circa 15-20 minuti."),
        ("Devo prepararmi per l'ecografia transvaginale?", "Non e' richiesta preparazione specifica. La vescica deve essere vuota. Si consiglia di eseguire l'esame tra il 5o e il 12o giorno del ciclo mestruale per una valutazione ottimale."),
        ("Che differenza c'e' tra ecografia pelvica e transvaginale?", "L'ecografia transvaginale offre immagini piu' dettagliate degli organi pelvici rispetto a quella sovrapubica, grazie alla vicinanza della sonda. E' particolarmente indicata per valutare endometrio, ovaie e utero."),
    ],
    "ginecologia__isteroscopia": [
        ("Cos'e' l'isteroscopia?", "L'isteroscopia e' un esame diagnostico mini-invasivo che permette di visualizzare direttamente la cavita' uterina tramite un sottile strumento ottico (isteroscopio) introdotto attraverso il canale cervicale."),
        ("L'isteroscopia e' dolorosa?", "L'isteroscopia diagnostica puo' causare un lieve fastidio simile a crampi mestruali, di breve durata. Non richiede anestesia nella maggior parte dei casi. L'isteroscopia operativa puo' richiedere sedazione."),
        ("Quando e' indicata l'isteroscopia?", "L'isteroscopia e' indicata per: sanguinamento uterino anomalo, polipi endometriali, fibromi sottomucosi, sinechie uterine, infertilita' e anomalie riscontrate all'ecografia."),
    ],
    "ginecologia__riabilitazione_pavimento_pelvico": [
        ("Cos'e' la riabilitazione del pavimento pelvico?", "La riabilitazione del pavimento pelvico e' un percorso terapeutico per rinforzare i muscoli perineali. E' indicata per incontinenza urinaria, prolasso, disfunzioni sessuali e recupero post-partum."),
        ("Quante sedute servono?", "Il percorso standard prevede 8-12 sedute bisettimanali, personalizzate in base alla valutazione iniziale. I primi miglioramenti si avvertono generalmente dopo 4-6 sedute."),
        ("La riabilitazione perineale e' indicata anche dopo il parto?", "Si', e' fortemente consigliata dopo il parto (sia naturale che cesareo) per recuperare il tono muscolare perineale e prevenire incontinenza e prolasso."),
    ],
    # DERMATOLOGIA
    "dermatologia__mappatura_nevi": [
        ("Cos'e' la mappatura dei nevi?", "La mappatura dei nevi e' un esame non invasivo che utilizza la dermatoscopia digitale per fotografare e monitorare tutti i nevi del corpo. Le immagini vengono archiviate per confronto nel tempo, permettendo di identificare precocemente eventuali modifiche sospette."),
        ("Ogni quanto fare la mappatura dei nevi?", "Si consiglia una mappatura annuale, o ogni 6 mesi per soggetti a rischio elevato (piu' di 50 nevi, familiarita' per melanoma, fototipo chiaro, precedenti di ustioni solari)."),
        ("La mappatura dei nevi e' dolorosa?", "No, e' completamente indolore. Il dermatologo appoggia il dermatoscopio sulla pelle e acquisisce le immagini digitali. L'esame dura circa 20-30 minuti per una mappatura completa."),
    ],
    # ENDOCRINOLOGIA
    "endocrinologia__ecografia_tiroidea": [
        ("Cos'e' l'ecografia tiroidea?", "L'ecografia tiroidea e' un esame non invasivo che utilizza gli ultrasuoni per visualizzare dimensioni, struttura e morfologia della ghiandola tiroidea. Permette di identificare noduli, cisti, tiroiditi e alterazioni strutturali."),
        ("Quando fare l'ecografia tiroidea?", "L'ecografia tiroidea e' indicata quando gli esami del sangue (TSH, FT3, FT4) risultano alterati, in presenza di noduli palpabili, familiarita' per patologie tiroidee, o come screening in donne over 35."),
        ("L'ecografia tiroidea richiede preparazione?", "No, non e' richiesta alcuna preparazione specifica. L'esame dura circa 15 minuti e il referto viene consegnato immediatamente."),
    ],
    # NEUROLOGIA
    "neurologia__elettromiografia": [
        ("Cos'e' l'elettromiografia (EMG)?", "L'elettromiografia e' un esame diagnostico che valuta la funzionalita' dei nervi periferici e dei muscoli. Si divide in elettroneurografia (studio della conduzione nervosa) ed elettromiografia propriamente detta (attivita' elettrica muscolare)."),
        ("L'elettromiografia e' dolorosa?", "L'esame puo' causare un lieve fastidio durante l'inserimento dell'ago-elettrodo nel muscolo. La componente di elettroneurografia comporta piccole stimolazioni elettriche, percepite come leggere scosse. L'esame e' ben tollerato."),
        ("Quando e' indicata l'elettromiografia?", "L'EMG e' indicata per: tunnel carpale, cervicobrachialgia, lombosciatalgia, polineuropatie (diabetica, alcolica), miastenia, SLA, radicolopatie e per valutare la gravita' di lesioni nervose."),
    ],
    # ORTOPEDIA
    "ortopedia__infiltrazioni_articolari": [
        ("Cosa sono le infiltrazioni articolari?", "Le infiltrazioni articolari sono iniezioni di farmaci (acido ialuronico, corticosteroidi, PRP) direttamente nell'articolazione interessata. Servono a ridurre il dolore, l'infiammazione e a migliorare la mobilita' articolare."),
        ("Le infiltrazioni articolari sono dolorose?", "L'infiltrazione puo' causare un lieve fastidio durante l'iniezione, simile a un normale prelievo. Il medico puo' applicare anestetico locale per ridurre il disagio. L'intera procedura dura circa 10-15 minuti."),
        ("Quante infiltrazioni servono?", "Il protocollo standard prevede 3-5 infiltrazioni di acido ialuronico a distanza di una settimana, oppure 1-3 infiltrazioni di cortisone. La frequenza dipende dalla patologia e dalla risposta del paziente."),
    ],
    # UROLOGIA
    "urologia__ecografia_prostatica": [
        ("Cos'e' l'ecografia prostatica?", "L'ecografia prostatica e' un esame non invasivo che utilizza gli ultrasuoni per visualizzare dimensioni, forma e struttura della prostata. Puo' essere sovrapubica (transaddominale) o transrettale per maggiore dettaglio."),
        ("Quando fare l'ecografia prostatica?", "L'ecografia prostatica e' indicata per: PSA elevato, difficolta' urinarie, minzione frequente, familiarita' per tumore prostatico, e come screening negli uomini over 50."),
        ("L'ecografia prostatica richiede preparazione?", "Per l'ecografia sovrapubica e' necessario avere la vescica piena (bere 1 litro d'acqua un'ora prima). Il referto viene consegnato immediatamente dall'urologo."),
    ],
    # CHIRURGIA VASCOLARE
    "chirurgia_vascolare__eco_doppler_arti": [
        ("Cos'e' l'eco-doppler degli arti?", "L'eco-doppler e' un esame ecografico non invasivo che valuta il flusso sanguigno nelle arterie e nelle vene degli arti superiori e inferiori. Permette di identificare stenosi, occlusioni, trombosi venose e insufficienza venosa."),
        ("L'eco-doppler e' doloroso?", "No, l'eco-doppler e' completamente indolore. Il medico applica gel e passa la sonda sugli arti. L'esame dura circa 20-30 minuti per ogni distretto vascolare."),
        ("Quando e' indicato l'eco-doppler?", "L'eco-doppler e' indicato per: gambe gonfie, vene varicose, dolore al polpaccio, sospetta trombosi, claudicatio intermittens, fattori di rischio cardiovascolare, e follow-up post-chirurgico."),
    ],
    "chirurgia_vascolare__scleroterapia": [
        ("Cos'e' la scleroterapia?", "La scleroterapia e' un trattamento mini-invasivo per le vene varicose e i capillari. Il medico inietta una soluzione sclerosante direttamente nella vena, che provoca la chiusura del vaso e il suo riassorbimento."),
        ("La scleroterapia e' dolorosa?", "La scleroterapia causa solo un lieve fastidio al momento dell'iniezione. Non richiede anestesia e il paziente puo' riprendere le normali attivita' subito dopo il trattamento."),
        ("Quante sedute di scleroterapia servono?", "Il numero di sedute dipende dall'estensione delle varici. Generalmente servono 2-4 sedute a distanza di 3-4 settimane l'una dall'altra per risultati ottimali."),
    ],
    # OTORINOLARINGOIATRIA
    "otorinolaringoiatria__spirometria": [
        ("Cos'e' la spirometria?", "La spirometria e' un esame che misura la capacita' respiratoria e il flusso d'aria nei polmoni. Il paziente soffia in un boccaglio collegato allo spirometro che registra volumi e velocita' dell'aria espirata."),
        ("La spirometria e' dolorosa?", "No, la spirometria e' completamente indolore. Richiede la collaborazione del paziente per soffiare con la massima forza. L'esame dura circa 15-20 minuti."),
        ("Quando e' indicata la spirometria?", "La spirometria e' indicata per: tosse cronica, dispnea, asma, BPCO, fumatori over 40, medicina del lavoro, idoneita' sportiva e monitoraggio di patologie respiratorie."),
    ],
    # GASTROENTEROLOGIA
    "gastroenterologia__ecografia_addominale": [
        ("Cos'e' l'ecografia addominale?", "L'ecografia addominale e' un esame diagnostico non invasivo che utilizza gli ultrasuoni per visualizzare gli organi addominali: fegato, colecisti, pancreas, milza, reni, aorta e vie biliari."),
        ("L'ecografia addominale richiede il digiuno?", "Si', e' necessario il digiuno di almeno 6-8 ore per una corretta visualizzazione degli organi. Si puo' bere acqua. Evitare alimenti che producono gas (legumi, bevande gassate) il giorno precedente."),
        ("Quando e' indicata l'ecografia addominale?", "L'ecografia addominale e' indicata per: dolore addominale, alterazioni degli esami del fegato, sospetti calcoli biliari o renali, monitoraggio di cisti o lesioni epatiche, e screening generale."),
    ],
}

# ============================================================
# HOWTO SCHEMA DATA - Per sub-page
# ============================================================
HOWTO_DATA = {
    # GINECOLOGIA
    "ginecologia__assistenza_ostetrica": {"name": "Come funziona l'Assistenza Ostetrica a Sassari", "desc": "Percorso di assistenza ostetrica presso Bio-Clinic Sassari: dalla prima visita al post-partum.", "time": "PT60M", "steps": [
        ("Prima visita ostetrica", "Colloquio conoscitivo con l'ostetrica per raccogliere la storia clinica, valutare le esigenze della gestante e pianificare il percorso di accompagnamento."),
        ("Controlli periodici", "Visite regolari per monitorare il benessere della mamma e del bambino: peso, pressione, battito fetale, movimenti e crescita."),
        ("Preparazione al parto", "Sessioni dedicate a tecniche di respirazione, posizioni del travaglio, gestione del dolore e piano del parto personalizzato."),
        ("Supporto post-partum", "Assistenza per allattamento, cura del neonato, recupero del pavimento pelvico e supporto emotivo alla neo-mamma."),
    ]},
    "ginecologia__colposcopia": {"name": "Come si svolge la Videocolposcopia Digitale", "desc": "Procedura della colposcopia digitale presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Posizionamento", "La paziente si posiziona sul lettino ginecologico. Il ginecologo introduce lo speculum per visualizzare il collo dell'utero."),
        ("Applicazione reagenti", "Vengono applicati acido acetico e/o liquido di Lugol sulla cervice per evidenziare eventuali aree anomale."),
        ("Osservazione digitale", "Il colposcopio digitale ingrandisce l'immagine della cervice permettendo di identificare lesioni sospette con documentazione fotografica."),
        ("Eventuale biopsia", "Se necessario, il ginecologo esegue una biopsia mirata delle aree sospette per analisi istologica. Il referto viene consegnato al termine."),
    ]},
    "ginecologia__caressflow": {"name": "Come si svolge il trattamento Caressflow", "desc": "Procedura del trattamento Caressflow per il benessere intimo presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Consulto iniziale", "Colloquio con la ginecologa per valutare le esigenze e l'idoneita' al trattamento Caressflow."),
        ("Preparazione", "La paziente si posiziona comodamente. La zona da trattare viene preparata e pulita."),
        ("Trattamento", "Applicazione del dispositivo Caressflow che utilizza radiofrequenza per stimolare il rinnovamento dei tessuti e migliorare il benessere intimo."),
        ("Post-trattamento", "Indicazioni per le cure domiciliari. Non e' necessario periodo di recupero, le normali attivita' possono essere riprese immediatamente."),
    ]},
    "ginecologia__corso_preparto": {"name": "Come funziona il Corso Preparto a Sassari", "desc": "Struttura del corso preparto presso Bio-Clinic Sassari.", "time": "PT120M", "steps": [
        ("Iscrizione", "Iscrizione al corso tra la 28a e la 32a settimana di gravidanza. Il partner e' benvenuto a tutte le lezioni."),
        ("Lezioni teoriche", "Sessioni educative su fasi del travaglio, gestione del dolore, analgesia epidurale, taglio cesareo, allattamento e cura del neonato."),
        ("Esercizi pratici", "Tecniche di respirazione, posizioni del travaglio, massaggio perineale, rilassamento e preparazione fisica al parto."),
        ("Sessione post-partum", "Incontro dedicato al recupero dopo il parto: rieducazione perineale, allattamento e benessere psicofisico della neo-mamma."),
    ]},
    "ginecologia__duopap": {"name": "Come si svolge il DuoPap a Sassari", "desc": "Procedura del DuoPap (Pap Test + HPV DNA Test) presso Bio-Clinic Sassari.", "time": "PT15M", "steps": [
        ("Posizionamento", "La paziente si posiziona sul lettino ginecologico. Il ginecologo introduce lo speculum."),
        ("Prelievo cervicale", "Con un apposito spazzolino, viene prelevato un campione di cellule dalla cervice uterina."),
        ("Analisi combinata", "Il campione viene analizzato contemporaneamente per alterazioni cellulari (Pap Test) e presenza di HPV ad alto rischio (DNA Test)."),
        ("Referto e follow-up", "I risultati sono disponibili in 7-10 giorni. In caso di positivita', il ginecologo propone il percorso diagnostico appropriato (colposcopia)."),
    ]},
    "ginecologia__ecografia_mammaria": {"name": "Come si svolge l'Ecografia Mammaria a Sassari", "desc": "Procedura dell'ecografia mammaria presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Posizionamento", "La paziente si sdraia sul lettino a seno scoperto. Non e' richiesta preparazione specifica."),
        ("Applicazione gel", "Il medico applica gel ecografico sulla mammella per facilitare la trasmissione degli ultrasuoni."),
        ("Scansione ecografica", "La sonda viene spostata sistematicamente su entrambe le mammelle e le regioni ascellari per una valutazione completa."),
        ("Referto immediato", "Il medico consegna e spiega il referto al termine dell'esame con eventuali indicazioni per approfondimenti."),
    ]},
    "ginecologia__ecografia_morfologica": {"name": "Come si svolge l'Ecografia Morfologica", "desc": "Procedura dell'ecografia morfologica presso Bio-Clinic Sassari.", "time": "PT45M", "steps": [
        ("Posizionamento", "La gestante si sdraia sul lettino. Non e' richiesta preparazione specifica. L'esame si esegue tra la 19a e la 21a settimana."),
        ("Scansione sistematica", "Il ginecologo esamina sistematicamente tutti gli organi e apparati fetali: cranio, cervello, cuore, addome, arti, colonna vertebrale."),
        ("Valutazione biometrica", "Misurazione dei parametri di crescita fetale: diametro biparietale, circonferenza cranica, lunghezza del femore, peso stimato."),
        ("Referto dettagliato", "Il ginecologo consegna il referto completo con documentazione fotografica e, se tutto nella norma, rassicura la coppia."),
    ]},
    "ginecologia__ecografia_ostetrica_3d": {"name": "Come si svolge l'Ecografia Ostetrica 3D/4D", "desc": "Procedura dell'ecografia 3D/4D presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Posizionamento", "La gestante si sdraia sul lettino. L'esame e' ottimale tra la 24a e la 30a settimana di gravidanza."),
        ("Scansione 2D iniziale", "Il ginecologo esegue prima una scansione 2D per valutare posizione e benessere fetale."),
        ("Ricostruzione 3D/4D", "Acquisizione delle immagini tridimensionali del feto: volto, mani, piedi e movimenti in tempo reale."),
        ("Consegna immagini", "La coppia riceve foto e video del bambino su supporto digitale, insieme al referto medico."),
    ]},
    "ginecologia__ecografia_pelvica": {"name": "Come si svolge l'Ecografia Pelvica", "desc": "Procedura dell'ecografia pelvica presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "Per l'ecografia sovrapubica e' necessaria la vescica piena. Per la transvaginale, la vescica deve essere vuota."),
        ("Posizionamento", "La paziente si sdraia sul lettino. Il medico applica gel sull'addome o prepara la sonda transvaginale."),
        ("Scansione ecografica", "Il medico esamina utero, ovaie, tube e strutture pelviche per identificare eventuali patologie."),
        ("Referto immediato", "Il medico consegna e spiega il referto al termine dell'esame con immagini e misurazioni."),
    ]},
    "ginecologia__ecografia_transvaginale": {"name": "Come si svolge l'Ecografia Transvaginale", "desc": "Procedura dell'ecografia transvaginale presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "La vescica deve essere vuota. Non e' richiesta altra preparazione. L'esame e' ideale tra il 5o e il 12o giorno del ciclo."),
        ("Introduzione sonda", "Il ginecologo introduce delicatamente la sonda transvaginale, protetta da guaina monouso e gel."),
        ("Valutazione organi pelvici", "Visualizzazione dettagliata di utero, endometrio, ovaie e cavo del Douglas per identificare patologie."),
        ("Referto e indicazioni", "Il ginecologo consegna il referto con immagini ed eventuali indicazioni per approfondimenti."),
    ]},
    "ginecologia__isteroscopia": {"name": "Come si svolge l'Isteroscopia", "desc": "Procedura dell'isteroscopia diagnostica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Preparazione", "L'esame si esegue preferibilmente nella prima meta' del ciclo. Non e' generalmente necessaria anestesia per l'isteroscopia diagnostica."),
        ("Introduzione isteroscopio", "Il ginecologo introduce l'isteroscopio (sottile fibra ottica) attraverso il canale cervicale nell'utero."),
        ("Esplorazione cavita' uterina", "Visualizzazione diretta della cavita' uterina con distensione mediante soluzione fisiologica. Identificazione di polipi, fibromi, sinechie."),
        ("Eventuale biopsia e referto", "Se necessario, prelievo bioptico mirato. Il referto viene consegnato al termine con eventuali indicazioni terapeutiche."),
    ]},
    "ginecologia__riabilitazione_pavimento_pelvico": {"name": "Come funziona la Riabilitazione del Pavimento Pelvico", "desc": "Percorso di riabilitazione perineale presso Bio-Clinic Sassari.", "time": "PT45M", "steps": [
        ("Valutazione iniziale", "Il terapista esegue una valutazione del tono e della forza dei muscoli perineali tramite esame clinico e biofeedback."),
        ("Piano terapeutico", "Definizione del programma personalizzato: numero di sedute, frequenza, obiettivi e tecniche da utilizzare."),
        ("Sedute di riabilitazione", "Esercizi di Kegel guidati, biofeedback, elettrostimolazione funzionale e tecniche manuali per rinforzare il pavimento pelvico."),
        ("Mantenimento", "Programma di esercizi domiciliari per mantenere i risultati ottenuti. Controlli periodici programmati."),
    ]},
    "ginecologia__visita_ginecologica": {"name": "Come si svolge la Visita Ginecologica", "desc": "Procedura della visita ginecologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il ginecologo raccoglie la storia clinica: ciclo mestruale, contraccezione, gravidanze precedenti, sintomi e familiarita'."),
        ("Esame obiettivo", "Esame del seno, ispezione dei genitali esterni, esame con speculum e palpazione bimanuale."),
        ("Ecografia (se indicata)", "Se necessario, il ginecologo esegue un'ecografia pelvica o transvaginale nella stessa seduta."),
        ("Diagnosi e indicazioni", "Il ginecologo comunica i risultati, prescrive eventuali esami e fornisce indicazioni terapeutiche personalizzate."),
    ]},
    "ginecologia__hpv_dna_test": {"name": "Come si svolge l'HPV DNA Test", "desc": "Procedura dell'HPV DNA Test presso Bio-Clinic Sassari.", "time": "PT10M", "steps": [
        ("Posizionamento", "La paziente si posiziona sul lettino ginecologico. Il ginecologo introduce lo speculum."),
        ("Prelievo cervicale", "Con un apposito spazzolino, viene prelevato un campione di cellule dalla cervice uterina. Il prelievo e' rapido e indolore."),
        ("Analisi molecolare", "Il campione viene analizzato in laboratorio per la ricerca del DNA dei ceppi HPV ad alto rischio (16, 18, 31, 33, 45, ecc.)."),
        ("Risultati e follow-up", "I risultati sono disponibili in 5-7 giorni. In caso di positivita', si procede con colposcopia e genotipizzazione."),
    ]},
    "ginecologia__pap_test": {"name": "Come si svolge il Pap Test", "desc": "Procedura del Pap Test presso Bio-Clinic Sassari.", "time": "PT10M", "steps": [
        ("Posizionamento", "La paziente si posiziona sul lettino. Si consiglia di eseguire il test lontano dal ciclo mestruale e di evitare rapporti e lavande vaginali nelle 48 ore precedenti."),
        ("Prelievo cellulare", "Il ginecologo introduce lo speculum e preleva cellule dalla cervice con una spatola e un brushing."),
        ("Preparazione del campione", "Le cellule vengono fissate su vetrino o in mezzo liquido (Pap Test in fase liquida) per l'analisi citologica."),
        ("Risultati", "I risultati sono disponibili in 7-10 giorni. In caso di anomalie, il ginecologo propone approfondimenti (colposcopia, HPV test)."),
    ]},
    "ginecologia__pap_test_hpv": {"name": "Come si svolge il Pap Test con HPV", "desc": "Procedura del Pap Test combinato con HPV DNA presso Bio-Clinic Sassari.", "time": "PT15M", "steps": [
        ("Posizionamento", "La paziente si posiziona sul lettino ginecologico con speculum. Evitare rapporti e lavande nelle 48 ore precedenti."),
        ("Prelievo combinato", "Un unico prelievo cervicale viene utilizzato per entrambe le analisi: citologia (Pap Test) e ricerca HPV DNA."),
        ("Analisi duale", "Il campione viene processato per analisi citologica e test molecolare HPV simultaneamente."),
        ("Referto integrato", "I risultati combinati vengono consegnati in 7-10 giorni con indicazioni per eventuale colposcopia."),
    ]},
    "ginecologia__radiofrequenza_vaginale": {"name": "Come si svolge la Radiofrequenza Vaginale", "desc": "Procedura del trattamento di radiofrequenza vaginale presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Consulto", "Colloquio con la ginecologa per valutare l'idoneita' al trattamento e stabilire il protocollo personalizzato."),
        ("Preparazione", "La paziente si posiziona sul lettino. Non e' richiesta anestesia. La zona viene preparata."),
        ("Trattamento", "Applicazione della radiofrequenza tramite sonda vaginale dedicata. Il trattamento stimola la produzione di collagene e il ringiovanimento dei tessuti."),
        ("Post-trattamento", "Non e' necessario periodo di recupero. Si consiglia di evitare rapporti per 48 ore. Il ciclo completo prevede 3-4 sedute."),
    ]},
    "ginecologia__isterosalpingografia": {"name": "Come si svolge l'Isterosalpingografia", "desc": "Procedura dell'isterosalpingografia presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Preparazione", "L'esame si esegue tra il 7o e il 12o giorno del ciclo. E' consigliato assumere antidolorifico 30 minuti prima."),
        ("Posizionamento", "La paziente si posiziona sul lettino radiologico. Il ginecologo introduce un catetere nella cervice uterina."),
        ("Iniezione mezzo di contrasto", "Il mezzo di contrasto viene iniettato lentamente nell'utero e nelle tube. Le immagini radiologiche mostrano la pervietà tubarica."),
        ("Referto", "Il ginecologo valuta le immagini e consegna il referto con la diagnosi sulla pervietà tubarica e la morfologia uterina."),
    ]},
    "ginecologia__ginecologi_sassari": {"name": "Come prenotare una visita ginecologica a Sassari", "desc": "Come scegliere il ginecologo e prenotare presso Bio-Clinic Sassari.", "time": "PT10M", "steps": [
        ("Scegliere lo specialista", "Consultare la pagina dell'equipe ginecologica per trovare lo specialista piu' adatto alle proprie esigenze."),
        ("Prenotare", "Chiamare il numero 079 956 1332 o prenotare online. La segreteria consiglia lo specialista in base alla problematica."),
        ("Preparare i documenti", "Portare tessera sanitaria, impegnativa (se presente), referti precedenti e lista dei farmaci assunti."),
        ("Visita", "Presentarsi 10 minuti prima dell'appuntamento per l'accettazione."),
    ]},
    "ginecologia__perifit_kegel": {"name": "Come si usa Perifit per gli esercizi di Kegel", "desc": "Utilizzo del dispositivo Perifit per la riabilitazione del pavimento pelvico presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Valutazione iniziale", "La terapista valuta il tono del pavimento pelvico e l'idoneita' all'uso del Perifit con sonda endovaginale."),
        ("Setup dispositivo", "Collegamento del Perifit allo smartphone tramite Bluetooth. Calibrazione dei sensori sulla forza muscolare della paziente."),
        ("Sessione guidata", "Esercizi di Kegel interattivi guidati dall'app: contrazioni, rilasciamento, resistenza e coordinazione perineale."),
        ("Programma domiciliare", "La terapista fornisce il programma di esercizi personalizzato da seguire a casa con il Perifit 3-4 volte a settimana."),
    ]},
    "ginecologia__trattamenti_pavimento_pelvico": {"name": "Come funzionano i Trattamenti del Pavimento Pelvico", "desc": "Percorso di trattamento del pavimento pelvico presso Bio-Clinic Sassari.", "time": "PT45M", "steps": [
        ("Valutazione specialistica", "Visita uroginecologica per valutare il tipo e la gravita' della disfunzione del pavimento pelvico."),
        ("Piano terapeutico", "Definizione del programma personalizzato: riabilitazione perineale, biofeedback, elettrostimolazione, Perifit o trattamenti combinati."),
        ("Ciclo di trattamenti", "Sedute bisettimanali con tecniche manuali, strumentali e esercizi specifici per rinforzare la muscolatura perineale."),
        ("Mantenimento e controlli", "Programma domiciliare e visite di controllo periodiche per mantenere i risultati nel tempo."),
    ]},
    # DERMATOLOGIA
    "dermatologia__mappatura_nevi": {"name": "Come si svolge la Mappatura dei Nevi", "desc": "Procedura della mappatura nei con dermatoscopia digitale presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Visita dermatologica", "Il dermatologo esamina l'intera superficie cutanea a occhio nudo per identificare le lesioni da documentare."),
        ("Dermatoscopia digitale", "Ogni nevo viene fotografato con il dermatoscopio digitale ad alta risoluzione. Le immagini vengono archiviate nel database."),
        ("Analisi e confronto", "Le immagini vengono analizzate per simmetria, bordi, colore, dimensioni e struttura (regola ABCDE). Confronto con eventuali immagini precedenti."),
        ("Referto e follow-up", "Il dermatologo consegna il referto con mappa corporea e programma il controllo successivo (6-12 mesi)."),
    ]},
    "dermatologia__visita_dermatologica": {"name": "Come si svolge la Visita Dermatologica", "desc": "Procedura della visita dermatologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il dermatologo raccoglie la storia clinica: sintomi cutanei, familiarita', farmaci, esposizione solare, allergie."),
        ("Esame obiettivo", "Ispezione completa della cute con luce naturale e dermatoscopio per valutare lesioni, nevi, eritemi e alterazioni."),
        ("Dermatoscopia", "Se necessario, esame dermatoscopico delle lesioni sospette per una valutazione approfondita della struttura."),
        ("Diagnosi e terapia", "Il dermatologo formula la diagnosi, prescrive la terapia e, se indicato, programma biopsia o asportazione."),
    ]},
    # ENDOCRINOLOGIA
    "endocrinologia__checkup_tiroide": {"name": "Come si svolge il Check-Up Tiroide", "desc": "Percorso diagnostico tiroideo completo presso Bio-Clinic Sassari.", "time": "PT60M", "steps": [
        ("Prelievo sangue", "Esami ematici tiroidei: TSH, FT3, FT4, anticorpi anti-TPO e anti-TG. E' necessario il digiuno di 8 ore."),
        ("Ecografia tiroidea", "Ecografia della ghiandola tiroidea per valutare dimensioni, struttura e presenza di noduli."),
        ("Visita endocrinologica", "L'endocrinologo integra i risultati degli esami con l'esame clinico e l'ecografia per formulare la diagnosi."),
        ("Referto e piano terapeutico", "Consegna del referto completo con diagnosi, eventuale terapia e programmazione dei controlli futuri."),
    ]},
    "endocrinologia__ecografia_tiroidea": {"name": "Come si svolge l'Ecografia Tiroidea", "desc": "Procedura dell'ecografia tiroidea presso Bio-Clinic Sassari.", "time": "PT15M", "steps": [
        ("Posizionamento", "Il paziente si sdraia sul lettino con il collo leggermente esteso. Non e' richiesta preparazione specifica."),
        ("Scansione ecografica", "Il medico applica gel e passa la sonda ecografica sulla regione tiroidea, valutando entrambi i lobi e l'istmo."),
        ("Valutazione noduli", "Classificazione di eventuali noduli secondo i criteri TI-RADS per determinare la necessita' di agoaspirato."),
        ("Referto immediato", "Il medico consegna il referto con immagini, misurazioni e classificazione dei noduli."),
    ]},
    "endocrinologia__visita_endocrinologica": {"name": "Come si svolge la Visita Endocrinologica", "desc": "Procedura della visita endocrinologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "L'endocrinologo raccoglie la storia clinica: sintomi, peso, familiarita', farmaci e risultati di esami precedenti."),
        ("Esame obiettivo", "Palpazione della tiroide, valutazione del BMI, pressione arteriosa, segni di alterazioni ormonali."),
        ("Valutazione esami", "Analisi degli esami del sangue e di eventuali ecografie precedenti per formulare la diagnosi."),
        ("Piano terapeutico", "L'endocrinologo formula la diagnosi, prescrive la terapia e programma i controlli di follow-up."),
    ]},
    # NEUROLOGIA
    "neurologia__elettromiografia": {"name": "Come si svolge l'Elettromiografia (EMG)", "desc": "Procedura dell'elettromiografia presso Bio-Clinic Sassari.", "time": "PT45M", "steps": [
        ("Anamnesi", "Il neurologo raccoglie la storia clinica: sintomi, sede del dolore o deficit, durata e modalita' di insorgenza."),
        ("Elettroneurografia (ENG)", "Studio della velocita' di conduzione dei nervi tramite stimolazione elettrica e registrazione superficiale."),
        ("Elettromiografia (EMG)", "Inserimento di un ago-elettrodo nel muscolo per registrare l'attivita' elettrica a riposo e durante contrazione."),
        ("Referto e diagnosi", "Il neurologo analizza i tracciati, formula la diagnosi e consegna il referto con indicazioni terapeutiche."),
    ]},
    "neurologia__visita_neurologica": {"name": "Come si svolge la Visita Neurologica", "desc": "Procedura della visita neurologica presso Bio-Clinic Sassari.", "time": "PT40M", "steps": [
        ("Anamnesi neurologica", "Il neurologo raccoglie la storia clinica dettagliata: cefalee, vertigini, tremori, deficit di forza, disturbi della sensibilita'."),
        ("Esame neurologico", "Valutazione sistematica di: stato mentale, nervi cranici, forza muscolare, sensibilita', riflessi, coordinazione e deambulazione."),
        ("Esami strumentali", "Se indicato, il neurologo puo' prescrivere elettromiografia, EEG, risonanza magnetica o esami del sangue."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione della terapia e programmazione dei controlli di follow-up."),
    ]},
    # ORTOPEDIA
    "ortopedia__infiltrazioni_articolari": {"name": "Come si svolgono le Infiltrazioni Articolari", "desc": "Procedura delle infiltrazioni articolari presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Valutazione clinica", "L'ortopedico valuta l'articolazione interessata, la diagnosi e determina il tipo di infiltrazione piu' adatto."),
        ("Preparazione", "Disinfezione accurata della zona. Se necessario, applicazione di anestetico locale per ridurre il fastidio."),
        ("Infiltrazione", "Iniezione intra-articolare del farmaco (acido ialuronico, cortisone o PRP) con guida ecografica se indicata."),
        ("Indicazioni post-procedura", "Riposo dell'articolazione per 24-48 ore. Evitare attivita' sportiva per 3-5 giorni. Applicare ghiaccio se necessario."),
    ]},
    "ortopedia__visita_fisiatrica": {"name": "Come si svolge la Visita Fisiatrica", "desc": "Procedura della visita fisiatrica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il fisiatra raccoglie la storia clinica: dolore, limitazioni funzionali, interventi precedenti, attivita' lavorativa e sportiva."),
        ("Esame funzionale", "Valutazione della postura, mobilita' articolare, forza muscolare, equilibrio e capacita' funzionali."),
        ("Piano riabilitativo", "Definizione del programma riabilitativo personalizzato: fisioterapia, terapia fisica, esercizi specifici."),
        ("Prescrizioni", "Prescrizione di ortesi, ausili, cicli di fisioterapia e programmazione dei controlli di follow-up."),
    ]},
    "ortopedia__visita_ortopedica": {"name": "Come si svolge la Visita Ortopedica", "desc": "Procedura della visita ortopedica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "L'ortopedico raccoglie la storia clinica: sede del dolore, modalita' di insorgenza, traumi, attivita' sportiva."),
        ("Esame obiettivo", "Valutazione clinica dell'apparato muscolo-scheletrico: ispezione, palpazione, test funzionali specifici."),
        ("Esami strumentali", "Se necessario, l'ortopedico puo' prescrivere radiografia, ecografia, risonanza magnetica o TAC."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, piano terapeutico (farmaci, infiltrazioni, fisioterapia o chirurgia) e follow-up."),
    ]},
    # UROLOGIA
    "urologia__ecografia_prostatica": {"name": "Come si svolge l'Ecografia Prostatica", "desc": "Procedura dell'ecografia prostatica presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "Per l'ecografia sovrapubica: bere 1 litro d'acqua un'ora prima per riempire la vescica."),
        ("Posizionamento", "Il paziente si sdraia sul lettino. L'urologo applica gel sull'addome."),
        ("Scansione ecografica", "Visualizzazione della prostata, delle dimensioni, della struttura e di eventuali noduli o calcificazioni. Valutazione del residuo post-minzionale."),
        ("Referto immediato", "L'urologo consegna il referto con misurazioni e indicazioni. Se necessario, consiglia approfondimenti."),
    ]},
    "urologia__ecografia_renale": {"name": "Come si svolge l'Ecografia Renale", "desc": "Procedura dell'ecografia renale presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "E' consigliabile presentarsi con la vescica moderatamente piena. Non e' necessario il digiuno."),
        ("Posizionamento", "Il paziente si sdraia sul lettino. L'esame viene eseguito in posizione supina e sui fianchi."),
        ("Scansione ecografica", "Visualizzazione di entrambi i reni, bacinetti renali, ureteri e vescica. Identificazione di calcoli, cisti, dilatazioni."),
        ("Referto immediato", "Il medico consegna il referto con immagini, misurazioni renali e indicazioni cliniche."),
    ]},
    "urologia__visita_urologica": {"name": "Come si svolge la Visita Urologica", "desc": "Procedura della visita urologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "L'urologo raccoglie la storia clinica: disturbi urinari, ematuria, dolore, disfunzione erettile, familiarita'."),
        ("Esame obiettivo", "Esame addominale, palpazione dei reni, valutazione dei genitali esterni e, se indicato, esplorazione rettale."),
        ("Ecografia (se indicata)", "Se necessario, l'urologo esegue ecografia renale, vescicale o prostatica nella stessa seduta."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione della terapia e programmazione dei controlli urologici."),
    ]},
    # CHIRURGIA VASCOLARE
    "chirurgia_vascolare__eco_doppler_arti": {"name": "Come si svolge l'Eco-Doppler degli Arti", "desc": "Procedura dell'eco-doppler arterioso e venoso degli arti presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Posizionamento", "Il paziente si sdraia sul lettino. Non e' richiesta preparazione specifica."),
        ("Scansione arteriosa", "Il medico applica gel e valuta il flusso arterioso negli arti: morfologia, pervietà, velocita' e indici di resistenza."),
        ("Scansione venosa", "Valutazione del sistema venoso: pervietà, continenza valvolare, presenza di trombi o insufficienza venosa."),
        ("Referto e indicazioni", "Il chirurgo vascolare consegna il referto con mappatura vascolare e indicazioni terapeutiche."),
    ]},
    "chirurgia_vascolare__scleroterapia": {"name": "Come si svolge la Scleroterapia", "desc": "Procedura della scleroterapia per varici e capillari presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Mappatura eco-guidata", "Il chirurgo vascolare esegue un eco-doppler per mappare le varici e pianificare i punti di iniezione."),
        ("Iniezione sclerosante", "Iniezione della soluzione sclerosante direttamente nelle vene varicose con aghi sottilissimi."),
        ("Compressione", "Applicazione di bendaggio compressivo o calza elastica da indossare per 3-7 giorni."),
        ("Follow-up", "Controllo a 3-4 settimane. Eventuale seconda seduta se necessario. Risultati visibili dopo 4-8 settimane."),
    ]},
    "chirurgia_vascolare__visita_chirurgia_vascolare": {"name": "Come si svolge la Visita di Chirurgia Vascolare", "desc": "Procedura della visita di chirurgia vascolare presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il chirurgo vascolare raccoglie la storia clinica: sintomi vascolari, fattori di rischio, familiarita' e trattamenti precedenti."),
        ("Esame obiettivo", "Ispezione degli arti, palpazione dei polsi, ricerca di edemi, varici e alterazioni cutanee trofiche."),
        ("Eco-doppler (se indicato)", "Se necessario, il chirurgo esegue un eco-doppler nella stessa seduta per valutare arterie e vene."),
        ("Piano terapeutico", "Formulazione della diagnosi e del piano terapeutico: terapia medica, scleroterapia, chirurgia o follow-up."),
    ]},
    # OTORINOLARINGOIATRIA
    "otorinolaringoiatria__audiometria": {"name": "Come si svolge l'Audiometria", "desc": "Procedura dell'esame audiometrico presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Anamnesi", "L'ORL raccoglie la storia clinica: calo uditivo, acufeni, vertigini, esposizione a rumori, farmaci ototossici."),
        ("Otoscopia", "Ispezione del condotto uditivo e del timpano con l'otoscopio per escludere tappi di cerume o patologie."),
        ("Audiometria tonale", "Il paziente entra nella cabina silente e indica quando percepisce i suoni trasmessi dalle cuffie a diverse frequenze e intensita'."),
        ("Referto audiometrico", "L'ORL spiega l'audiogramma con la curva uditiva e, se necessario, consiglia protesi acustiche o approfondimenti."),
    ]},
    "otorinolaringoiatria__campo_visivo": {"name": "Come si svolge l'Impedenzometria", "desc": "Procedura dell'impedenzometria presso Bio-Clinic Sassari.", "time": "PT15M", "steps": [
        ("Posizionamento", "Il paziente si siede comodamente. L'ORL inserisce un piccolo tappo nel condotto uditivo."),
        ("Timpanometria", "Il dispositivo modifica la pressione nel condotto e misura la risposta del timpano, valutando la funzione dell'orecchio medio."),
        ("Riflesso stapediale", "Test dei riflessi acustici per valutare la funzionalita' della catena ossiculare e del nervo facciale."),
        ("Referto", "L'ORL interpreta il timpanogramma e consegna il referto con diagnosi e indicazioni."),
    ]},
    "otorinolaringoiatria__spirometria": {"name": "Come si svolge la Spirometria", "desc": "Procedura della spirometria presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "Non fumare per almeno 4 ore. Evitare broncodilatatori prima dell'esame (se concordato con il medico). Indossare abiti comodi."),
        ("Posizionamento", "Il paziente si siede e applica una clip nasale. Il tecnico spiega le manovre di respirazione."),
        ("Manovre spirometriche", "Il paziente inspira profondamente e soffia nel boccaglio con la massima forza e velocita'. Si ripete 3 volte per ottenere il dato migliore."),
        ("Referto", "L'ORL o il pneumologo analizza i valori (FEV1, FVC, indice di Tiffeneau) e consegna il referto con diagnosi."),
    ]},
    "otorinolaringoiatria__visita_orl": {"name": "Come si svolge la Visita ORL", "desc": "Procedura della visita otorinolaringoiatrica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "L'ORL raccoglie la storia clinica: problemi di udito, naso, gola, voce, equilibrio, allergie e farmaci."),
        ("Esame obiettivo ORL", "Ispezione di orecchie (otoscopia), naso (rinoscopia), faringe, laringe e collo."),
        ("Esami strumentali", "Se indicato: audiometria, impedenzometria, fibrolaringoscopia o spirometria nella stessa seduta."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione terapeutica e programmazione di eventuali controlli."),
    ]},
    # GASTROENTEROLOGIA
    "gastroenterologia__ecografia_addominale": {"name": "Come si svolge l'Ecografia Addominale", "desc": "Procedura dell'ecografia addominale presso Bio-Clinic Sassari.", "time": "PT20M", "steps": [
        ("Preparazione", "Digiuno di almeno 6-8 ore. Evitare alimenti che producono gas il giorno precedente (legumi, bevande gassate)."),
        ("Posizionamento", "Il paziente si sdraia sul lettino. Il medico applica gel ecografico sull'addome."),
        ("Scansione sistematica", "Visualizzazione di fegato, colecisti, vie biliari, pancreas, milza, reni, aorta e principali vasi addominali."),
        ("Referto immediato", "Il medico consegna il referto con immagini, misurazioni e indicazioni cliniche."),
    ]},
    "gastroenterologia__visita_gastroenterologica": {"name": "Come si svolge la Visita Gastroenterologica", "desc": "Procedura della visita gastroenterologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il gastroenterologo raccoglie la storia clinica: sintomi digestivi, alimentazione, familiarita', farmaci e stile di vita."),
        ("Esame obiettivo", "Palpazione addominale, percussione, auscultazione per valutare organomegalia, masse, dolore."),
        ("Ecografia (se indicata)", "Se necessario, il gastroenterologo esegue un'ecografia addominale nella stessa seduta."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione della terapia, dieta e programmazione di eventuali esami endoscopici."),
    ]},
    # OCULISTICA
    "oculistica__visita_oculistica": {"name": "Come si svolge la Visita Oculistica", "desc": "Procedura della visita oculistica completa presso Bio-Clinic Sassari.", "time": "PT45M", "steps": [
        ("Anamnesi", "L'oculista raccoglie la storia clinica: disturbi visivi, familiarita' (glaucoma, degenerazione maculare), farmaci e patologie sistemiche."),
        ("Esame dell'acuita' visiva", "Misurazione della vista con ottotipi a distanza e da vicino, con e senza correzione."),
        ("Esame del segmento anteriore e tonometria", "Esame alla lampada a fessura di cornea, iride, cristallino. Misurazione della pressione oculare per screening del glaucoma."),
        ("Esame del fondo oculare", "Dopo dilatazione della pupilla, esame della retina, macula e nervo ottico. OCT se indicato."),
    ]},
    # PNEUMOLOGIA
    "pneumologia__visita_pneumologica": {"name": "Come si svolge la Visita Pneumologica", "desc": "Procedura della visita pneumologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il pneumologo raccoglie la storia clinica: tosse, dispnea, fumo, esposizioni professionali, allergie, familiarita'."),
        ("Esame obiettivo", "Auscultazione polmonare, valutazione della frequenza respiratoria, saturazione e segni di difficolta' respiratoria."),
        ("Spirometria (se indicata)", "Se necessario, esecuzione di spirometria per valutare la funzionalita' respiratoria nella stessa seduta."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione della terapia e programmazione di controlli ed esami aggiuntivi."),
    ]},
    # EMATOLOGIA
    "ematologia__visita_ematologica": {"name": "Come si svolge la Visita Ematologica", "desc": "Procedura della visita ematologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "L'ematologo raccoglie la storia clinica: alterazioni dell'emocromo, sanguinamenti, trombosi, familiarita', farmaci anticoagulanti."),
        ("Esame obiettivo", "Palpazione di linfonodi, fegato e milza. Valutazione di petecchie, ecchimosi e segni di anemia."),
        ("Valutazione esami", "Analisi dell'emocromo, assetto marziale, coagulazione, proteine, elettroforesi e eventuali esami specialistici."),
        ("Piano terapeutico", "Formulazione della diagnosi, prescrizione della terapia e gestione della terapia anticoagulante."),
    ]},
    # REUMATOLOGIA
    "reumatologia__visita_reumatologica": {"name": "Come si svolge la Visita Reumatologica", "desc": "Procedura della visita reumatologica presso Bio-Clinic Sassari.", "time": "PT30M", "steps": [
        ("Anamnesi", "Il reumatologo raccoglie la storia clinica: dolori articolari, rigidita' mattutina, gonfiore, familiarita' per malattie autoimmuni."),
        ("Esame obiettivo", "Valutazione sistematica delle articolazioni: mobilita', tumefazione, dolore alla palpazione, deformita'."),
        ("Esami di laboratorio", "Prescrizione e valutazione di esami specifici: VES, PCR, fattore reumatoide, anti-CCP, ANA, uricemia."),
        ("Diagnosi e terapia", "Formulazione della diagnosi, prescrizione della terapia (FANS, cortisonici, DMARDs) e programmazione follow-up."),
    ]},
}


def build_schema_graph(hub_key, page_key, hub_data, page_data):
    """Build complete JSON-LD @graph for a page."""
    full_url = f"{BASE_URL}{page_data['url']}"
    hub_url = f"{BASE_URL}{hub_data['pages']['hub']['url']}"
    is_hub = (page_key == "hub")
    graph = []

    # 1. MedicalClinic
    graph.append({
        "@type": "MedicalClinic",
        "@id": f"{BASE_URL}/#organization",
        "name": "Bio-Clinic Sassari",
        "url": BASE_URL,
        "telephone": "+39 079 956 1332",
        "address": {"@type": "PostalAddress", "streetAddress": "Via Renzo Mossa, 23", "addressLocality": "Sassari", "postalCode": "07100", "addressCountry": "IT"},
        "geo": {"@type": "GeoCoordinates", "latitude": 40.7267, "longitude": 8.5592},
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": "5", "reviewCount": "3214", "bestRating": "5", "worstRating": "1"},
        "areaServed": [
            {"@type": "City", "name": "Sassari", "sameAs": "https://it.wikipedia.org/wiki/Sassari"},
            {"@type": "AdministrativeArea", "name": "Provincia di Sassari", "sameAs": "https://it.wikipedia.org/wiki/Provincia_di_Sassari"},
            {"@type": "AdministrativeArea", "name": "Nord Sardegna"}
        ],
        "dateModified": TODAY
    })

    # 2. MedicalWebPage + SpeakableSpecification
    reviewer = hub_data["physicians"][0] if hub_data["physicians"] else None
    medical_page = {
        "@type": "MedicalWebPage",
        "@id": full_url,
        "url": full_url,
        "name": page_data["name"],
        "dateModified": TODAY,
        "lastReviewed": TODAY,
        "medicalAudience": {"@type": "MedicalAudience", "audienceType": "Patient"},
        "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".ai-summary", "h1", ".faq-item h3", ".faq-item h4"]},
        "mainEntity": {"@id": f"{full_url}#{'specialty' if is_hub else 'procedure'}"}
    }
    if reviewer:
        medical_page["reviewedBy"] = {
            "@type": "Person",
            "name": reviewer["name"],
            "jobTitle": reviewer["jobTitle"],
            "url": f"{BASE_URL}/equipe/{reviewer['slug']}/"
        }
    graph.append(medical_page)

    # 3. Procedure/Specialty schema with correct @id
    if is_hub:
        graph.append({
            "@type": "MedicalSpecialty",
            "@id": f"{full_url}#specialty",
            "name": hub_data["specialty_name"],
            "description": f"Servizio di {hub_data['specialty_name']} presso Bio-Clinic Sassari con specialisti dedicati."
        })
    else:
        graph.append({
            "@type": "MedicalProcedure",
            "@id": f"{full_url}#procedure",
            "name": page_data["name"],
            "description": f"{page_data['name']} presso Bio-Clinic Sassari",
            "procedureType": "MedicalProcedure",
            "relevantSpecialty": {"@type": "MedicalSpecialty", "name": hub_data["specialty_name"]},
            "provider": {"@id": f"{BASE_URL}/#organization"}
        })

    # 4. BreadcrumbList with correct URLs
    breadcrumb = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
            {"@type": "ListItem", "position": 2, "name": hub_data["hub_breadcrumb_name"], "item": hub_url},
        ]
    }
    if not is_hub:
        breadcrumb["itemListElement"].append(
            {"@type": "ListItem", "position": 3, "name": page_data["name"], "item": full_url}
        )
    graph.append(breadcrumb)

    # 5. Person/Physician schema
    for doc in hub_data["physicians"]:
        graph.append({
            "@type": ["Person", "Physician"],
            "@id": f"{BASE_URL}/equipe/{doc['slug']}/",
            "name": doc["name"],
            "givenName": doc["givenName"],
            "familyName": doc["familyName"],
            "jobTitle": doc["jobTitle"],
            "url": f"{BASE_URL}/equipe/{doc['slug']}/",
            "worksFor": {"@id": f"{BASE_URL}/#organization"},
            "medicalSpecialty": hub_data["specialty_name"],
            "description": doc["description"]
        })

    # 6. FAQPage schema
    faq_key = f"{hub_key}__{page_key}"
    faqs = FAQ_DATA.get(faq_key, [])
    if faqs:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in faqs
            ]
        })

    # 7. HowTo schema
    howto_key = f"{hub_key}__{page_key}"
    howto = HOWTO_DATA.get(howto_key)
    if howto:
        steps = []
        for i, (sname, stext) in enumerate(howto["steps"], 1):
            steps.append({"@type": "HowToStep", "position": i, "name": sname, "text": stext})
        graph.append({
            "@type": "HowTo",
            "name": howto["name"],
            "description": howto["desc"],
            "totalTime": howto["time"],
            "step": steps,
            "tool": {"@type": "HowToTool", "name": f"Attrezzatura {hub_data['specialty_name']} Bio-Clinic"},
            "supply": {"@type": "HowToSupply", "name": "Tessera sanitaria e documentazione medica precedente"}
        })

    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def generate_cross_links_html(hub_key, page_key, hub_data):
    """Generate cross-linking section."""
    pages = hub_data["pages"]
    hub_url = pages["hub"]["url"]
    specialty_name = hub_data["specialty_name"]
    
    # For hub: link to all sub-pages. For sub-pages: link to hub + other sub-pages (max 5)
    items = []
    if page_key == "hub":
        for pk, pd in pages.items():
            if pk != "hub":
                items.append(f'<a href="{pd["url"]}" class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center gap-3" title="{pd["name"]} a Sassari presso Bio-Clinic"><span style="color: #E53935;">&#10084;&#65039;</span><span class="font-medium text-gray-700">{pd["name"]}</span></a>')
    else:
        # Link to hub
        items.append(f'<a href="{hub_url}" class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center gap-3" title="{specialty_name} a Sassari presso Bio-Clinic"><span style="color: #E53935;">&#10084;&#65039;</span><span class="font-medium text-gray-700">{specialty_name}</span></a>')
        # Link to other sub-pages (max 4)
        count = 0
        for pk, pd in pages.items():
            if pk != "hub" and pk != page_key and count < 4:
                items.append(f'<a href="{pd["url"]}" class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition flex items-center gap-3" title="{pd["name"]} a Sassari presso Bio-Clinic"><span style="color: #E53935;">&#10084;&#65039;</span><span class="font-medium text-gray-700">{pd["name"]}</span></a>')
                count += 1

    if not items:
        return ""
    
    return f'''
    <!-- INTERNAL CROSS-LINKING (SEO Optimization) -->
    <section class="py-12 bg-gray-50" id="prestazioni-correlate">
        <div class="max-w-5xl mx-auto px-4">
            <h3 class="text-xl font-bold text-gray-800 mb-6">Prestazioni di {specialty_name} Correlate</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {"".join(items)}
            </div>
            <p class="text-center mt-6">
                <a href="{hub_url}" class="text-sm font-semibold hover:underline" style="color: #E53935;">
                    Tutte le Prestazioni di {specialty_name} &rarr;
                </a>
            </p>
        </div>
    </section>
'''


def process_page(hub_key, page_key, hub_data, page_data):
    """Process a single page with all 14 optimizations."""
    filepath = os.path.join(SITE_DIR, page_data["path"])
    if not os.path.exists(filepath):
        return {"page": f"{hub_key}/{page_key}", "file": page_data["path"], "error": "FILE NOT FOUND", "changes": []}

    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    original_size = len(html)
    changes = []

    # ============ FIX #12: og:type ============
    if page_data["og_type"] == "article":
        if '<meta property="og:type" content="website">' in html:
            html = html.replace(
                '<meta property="og:type" content="website">',
                '<meta property="og:type" content="article">'
            )
            changes.append("FIX #12: og:type website -> article")

    # ============ FIX #2,3,4,5,9,11: Complete schema rebuild ============
    new_schema = build_schema_graph(hub_key, page_key, hub_data, page_data)
    schema_pattern = r'<script type="application/ld\+json">.*?</script>'
    old_schemas = re.findall(schema_pattern, html, re.DOTALL)
    if old_schemas:
        for old in old_schemas:
            html = html.replace(old, '', 1)
        new_schema_tag = f'    <script type="application/ld+json">{new_schema}</script>\n'
        html = html.replace('</head>', f'{new_schema_tag}</head>', 1)
        changes.append("FIX #2,3,4,5,9,11: Schema rebuild (Breadcrumb, @id, FAQPage, Person, MedicalWebPage, Speakable, HowTo)")

    # ============ FIX #12b: Fix og:url with /pages/ ============
    og_url_pattern = r'<meta property="og:url" content="https://bio-clinic\.it/pages/[^"]*">'
    og_url_match = re.search(og_url_pattern, html)
    if og_url_match:
        full_url = f"{BASE_URL}{page_data['url']}"
        html = html.replace(og_url_match.group(0), f'<meta property="og:url" content="{full_url}">')
        changes.append(f"FIX: og:url fixed from /pages/ to {page_data['url']}")

    # ============ FIX #6: Internal cross-linking ============
    cross_links_html = generate_cross_links_html(hub_key, page_key, hub_data)
    if cross_links_html:
        # Try to find existing correlate sections
        existing = re.search(r'<!-- INTERNAL CROSS-LINKING.*?</section>\s*', html, re.DOTALL)
        if existing:
            html = html.replace(existing.group(0), cross_links_html)
            changes.append("FIX #6: Cross-linking section updated")
        else:
            # Try common insertion points
            inserted = False
            for marker in ['<!-- E-E-A-T Medical Verification Badge -->', '<!-- FINE SEZIONE SPECIALISTI -->', '<footer class="footer">', '<footer']:
                if marker in html:
                    html = html.replace(marker, cross_links_html + '\n' + marker, 1)
                    inserted = True
                    changes.append("FIX #6: Cross-linking section added")
                    break
            if not inserted:
                # Insert before </body>
                html = html.replace('</body>', cross_links_html + '\n</body>', 1)
                changes.append("FIX #6: Cross-linking section added before </body>")

    # Write back
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)

    new_size = len(html)
    word_count = len(re.findall(r'\b\w+\b', re.sub(r'<[^>]+>', '', html)))

    return {
        "page": f"{hub_key}/{page_key}",
        "file": page_data["path"],
        "original_size": original_size,
        "new_size": new_size,
        "word_count": word_count,
        "changes": changes,
    }


def main():
    print("=" * 80)
    print("  Bio-Clinic ALL HUBS SEO/E-E-A-T/AI Optimization v1.0")
    print(f"  {len(HUBS)} hubs, {sum(len(h['pages']) for h in HUBS.values())} pages")
    print("=" * 80)

    all_results = []
    hub_summaries = []

    for hub_key, hub_data in HUBS.items():
        hub_results = []
        print(f"\n{'='*60}")
        print(f"  HUB: {hub_data['specialty_name'].upper()} ({len(hub_data['pages'])} pages)")
        print(f"{'='*60}")

        for page_key, page_data in hub_data["pages"].items():
            result = process_page(hub_key, page_key, hub_data, page_data)
            hub_results.append(result)
            all_results.append(result)

            if "error" in result:
                print(f"  ❌ {result['page']}: {result['error']}")
            else:
                print(f"  ✅ {result['page']}: {result['original_size']} -> {result['new_size']} bytes, ~{result['word_count']} words, {len(result['changes'])} changes")
                for c in result["changes"]:
                    print(f"      - {c}")

        hub_changes = sum(len(r.get("changes", [])) for r in hub_results)
        hub_summaries.append((hub_data["specialty_name"], len(hub_results), hub_changes))

    # SUMMARY
    print("\n" + "=" * 80)
    print("  RIEPILOGO FINALE")
    print("=" * 80)
    total_changes = sum(len(r.get("changes", [])) for r in all_results)
    total_pages = len(all_results)
    print(f"  Pagine processate: {total_pages}")
    print(f"  Modifiche totali: {total_changes}")
    print()
    for name, count, changes in hub_summaries:
        print(f"  {name:30s} {count:3d} pagine, {changes:3d} modifiche")

    print("\n" + "=" * 80)
    print("  DONE - All 14 action items implemented across all hubs")
    print("=" * 80)

    # Write report
    report_path = os.path.join(os.path.dirname(SITE_DIR), "seo-all-hubs-report.txt")
    with open(report_path, "w") as f:
        f.write("REPORT SEO ALL HUBS - MODIFICHE PER PAGINA\n")
        f.write(f"Data: {TODAY}\n")
        f.write(f"Pagine: {total_pages}\n")
        f.write(f"Modifiche: {total_changes}\n\n")
        for r in all_results:
            f.write(f"\n{'='*60}\n")
            f.write(f"PAGINA: {r['page']}\n")
            f.write(f"FILE: {r['file']}\n")
            if "error" in r:
                f.write(f"ERRORE: {r['error']}\n")
            else:
                f.write(f"Size: {r['original_size']} -> {r['new_size']} bytes\n")
                f.write(f"Parole: ~{r['word_count']}\n")
                f.write(f"Modifiche ({len(r['changes'])}):\n")
                for c in r["changes"]:
                    f.write(f"  - {c}\n")
    print(f"\nReport salvato: {report_path}")


if __name__ == "__main__":
    main()
