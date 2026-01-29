#!/usr/bin/env python3
"""
Bio-Clinic Physician Page Generator
Generates individual HTML pages for all physicians with MioDottore booking widget
"""

import json
import os
from pathlib import Path

# Template HTML per pagina medico
TEMPLATE = '''<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{meta_description}">
  <meta name="keywords" content="{meta_keywords}">
  
  <title>{page_title}</title>
  
  <link rel="canonical" href="https://bio-clinic.it/equipe/{slug}/">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/search.css">
  <link rel="stylesheet" href="../css/physician.css">
  
  <!-- Schema.org Physician -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "Physician",
        "@id": "https://bio-clinic.it/equipe/{slug}/#physician",
        "name": "{full_name}",
        "givenName": "{first_name}",
        "familyName": "{last_name}",
        "honorificPrefix": "{title}",
        "jobTitle": "{job_title}",
        "description": "{bio}",
        "medicalSpecialty": "{specialty_schema}",
        "worksFor": {{
          "@type": "MedicalClinic",
          "@id": "https://bio-clinic.it/#organization",
          "name": "Bio-Clinic Sassari",
          "address": {{
            "@type": "PostalAddress",
            "streetAddress": "Via Renzo Mossa, 23",
            "addressLocality": "Sassari",
            "postalCode": "07100",
            "addressRegion": "SS",
            "addressCountry": "IT"
          }},
          "telephone": "+39 079 956 1332"
        }},
        "availableService": [{procedures_schema}]
      }},
      {{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"}},
          {{"@type": "ListItem", "position": 2, "name": "Equipe", "item": "https://bio-clinic.it/equipe/"}},
          {{"@type": "ListItem", "position": 3, "name": "{full_name}", "item": "https://bio-clinic.it/equipe/{slug}/"}}
        ]
      }}
    ]
  }}
  </script>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-top">
      <div class="container flex-between">
        <div class="flex" style="gap: 1.5rem;">
          <a href="tel:+390799561332" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            079 956 1332
          </a>
          <span class="hide-mobile">Lun-Ven 07:00-21:00 | Sab 08:00-14:00</span>
        </div>
        <div class="flex" style="gap: 1rem;">
          <a href="https://www.facebook.com/bioclinicss" target="_blank" aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/bioclinicss/" target="_blank" aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/></svg>
          </a>
        </div>
      </div>
    </div>
    
    <div class="header-main">
      <div class="container header-content">
        <a href="../index.html" class="logo">
          <img src="../images/logo-bioclinic.png" alt="Bio-Clinic" style="height: 50px; width: auto;">
        </a>
        
        <nav class="nav">
          <ul class="nav-list">
            <li class="nav-item"><a href="../index.html" class="nav-link">Home</a></li>
            <li class="nav-item">
              <a href="#" class="nav-link">Percorsi</a>
              <div class="nav-dropdown">
                <a href="../pages/slim-care.html">Slim Care</a>
                <a href="../pages/pma-fertilita.html">PMA / Fertilita</a>
              </div>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">Specialita</a>
              <div class="nav-dropdown">
                <a href="../pages/ginecologia.html">Ginecologia</a>
                <a href="../pages/cardiologia.html">Cardiologia</a>
                <a href="../pages/endocrinologia.html">Endocrinologia</a>
                <a href="../pages/laboratorio.html">Laboratorio</a>
                <a href="../pages/specialita.html">Tutte le Specialita</a>
              </div>
            </li>
            <li class="nav-item"><a href="index.html" class="nav-link active">Equipe</a></li>
            <li class="nav-item"><a href="../prestazioni/index.html" class="nav-link">Prestazioni</a></li>
            <li class="nav-item"><a href="../pages/contatti.html" class="nav-link">Contatti</a></li>
          </ul>
          <a href="tel:+390799561332" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Prenota
          </a>
        </nav>
        
        <button class="menu-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Breadcrumb -->
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <div class="container">
      <ol class="breadcrumb-list">
        <li><a href="../index.html">Home</a></li>
        <li><a href="index.html">Equipe</a></li>
        <li aria-current="page">{full_name}</li>
      </ol>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="physician-page">
    <div class="container">
      <div class="physician-hero">
        <!-- Profile Section -->
        <div class="physician-profile">
          <div class="physician-photo-wrapper">
            <div class="physician-photo-placeholder" style="background: {specialty_color}20;">
              <span class="physician-initials" style="color: {specialty_color};">{initials}</span>
            </div>
            <!-- Placeholder per foto: sostituire con <img src="../images/equipe/{slug}.jpg" alt="{full_name}"> -->
          </div>
          
          <div class="physician-info">
            <span class="physician-specialty-badge" style="background: {specialty_color};">{specialty_name}</span>
            {role_badge_html}
            <h1 class="physician-name">{full_name}</h1>
            <p class="physician-job-title">{job_title}</p>
          </div>
          
          <div class="physician-bio">
            <p>{bio}</p>
          </div>
          
          {pathways_html}
        </div>
        
        <!-- Booking Widget Section -->
        <div class="booking-section">
          <div class="booking-card">
            <h3>Prenota una visita</h3>
            <p class="booking-subtitle">Prenota online con {full_name}</p>
            
            <div class="booking-widget">
              {widget_html}
            </div>
            
            <div class="booking-alternative">
              <p>Oppure chiama per prenotare:</p>
              <a href="tel:+390799561332" class="btn btn-outline btn-block">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                079 956 1332
              </a>
            </div>
          </div>
          
          <div class="clinic-info-card">
            <h4>Bio-Clinic Sassari</h4>
            <p><strong>Indirizzo:</strong> Via Renzo Mossa, 23 - 07100 Sassari</p>
            <p><strong>Orari:</strong> Lun-Ven 07:00-21:00 | Sab 08:00-14:00</p>
          </div>
        </div>
      </div>
      
      <!-- Procedures Section -->
      <section class="physician-procedures">
        <h2>Prestazioni</h2>
        <div class="procedure-grid">
          {procedures_html}
        </div>
      </section>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="../images/logo-bioclinic.png" alt="Bio-Clinic" style="height: 40px; margin-bottom: 1rem;">
          <p>Poliambulatorio di riferimento a Sassari con 31 specialita, 67 medici e oltre 1.840 prestazioni.</p>
        </div>
        <div>
          <h4 class="footer-title">Link Rapidi</h4>
          <ul class="footer-links">
            <li><a href="../pages/slim-care.html">Slim Care</a></li>
            <li><a href="../pages/pma-fertilita.html">PMA / Fertilita</a></li>
            <li><a href="index.html">Equipe</a></li>
            <li><a href="../prestazioni/index.html">Prestazioni</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-title">Contatti</h4>
          <ul class="footer-contact">
            <li>Via Renzo Mossa, 23 - 07100 Sassari</li>
            <li><a href="tel:+390799561332">079 956 1332</a></li>
            <li><a href="mailto:gestione@bio-clinic.it">gestione@bio-clinic.it</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Bio Pharma S.r.l. - P.IVA 02869450904</p>
        <p>Direttore Sanitario: Prof. Emerito Salvatore Dessole</p>
      </div>
    </div>
  </footer>

  <!-- Search Results Panel -->
  <div id="search-overlay" class="search-overlay"></div>
  <div id="search-results-panel" class="search-results-panel">
    <div class="search-results-header">
      <h3>Risultati della ricerca</h3>
      <button id="search-results-close" class="search-results-close" aria-label="Chiudi">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div id="search-results-content" class="search-results-content"></div>
  </div>

  <!-- Scripts -->
  <script src="../js/main.js"></script>
  <script src="../js/search.js"></script>
  <script src="../js/header-search.js"></script>
  
  <!-- MioDottore Widget Script -->
  <script>
  !function($_x,_s,id){{
    var js,fjs=$_x.getElementsByTagName(_s)[0];
    if(!$_x.getElementById(id)){{
      js=$_x.createElement(_s);
      js.id=id;
      js.src="//platform.docplanner.com/js/widget.js";
      fjs.parentNode.insertBefore(js,fjs);
    }}
  }}(document,"script","zl-widget-s");
  </script>
</body>
</html>'''

def format_procedure_name(proc_id):
    """Convert procedure ID to human readable name"""
    return proc_id.replace('-', ' ').title()

def get_initials(name):
    """Get initials from name"""
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()

def generate_page(physician, specialties):
    """Generate HTML page for a physician"""
    
    spec = specialties.get(physician['specialty_id'], {})
    specialty_name = spec.get('name', physician['specialty_id'].title())
    specialty_color = spec.get('color', '#0077B6')
    
    # Parse name
    name_parts = physician['name'].split()
    first_name = name_parts[0] if name_parts else ''
    last_name = name_parts[-1] if len(name_parts) > 1 else ''
    
    # Generate procedures HTML
    procedures = physician.get('procedures', [])
    procedures_html = ''
    for proc in procedures:
        proc_name = format_procedure_name(proc)
        procedures_html += f'''
          <div class="procedure-card">
            <div class="procedure-icon" style="background: {specialty_color}20; color: {specialty_color};">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span class="procedure-name">{proc_name}</span>
          </div>'''
    
    # Generate procedures schema
    procedures_schema = ', '.join([
        f'{{"@type": "MedicalProcedure", "name": "{format_procedure_name(p)}"}}'
        for p in procedures
    ])
    
    # Role badge HTML
    role_badge_html = ''
    if physician.get('role_badge'):
        role_badge_html = f'<span class="physician-role-badge">{physician["role_badge"]}</span>'
    
    # Pathways HTML
    pathways = physician.get('pathways', [])
    pathways_html = ''
    if pathways:
        pathway_links = []
        for p in pathways:
            p_name = p.replace('-', ' ').title()
            pathway_links.append(f'<a href="../pages/{p}.html" class="pathway-tag">{p_name}</a>')
        pathways_html = f'''
          <div class="physician-pathways">
            <h4>Partecipa ai percorsi:</h4>
            <div class="pathway-tags">
              {''.join(pathway_links)}
            </div>
          </div>'''
    
    # Meta info
    meta_description = f"{physician['full_name']} - {physician['job_title']} Bio-Clinic Sassari. {physician['bio'][:100]}... Prenota online."
    meta_keywords = f"{physician['job_title'].lower()} sassari, {physician['name'].lower()}, bio-clinic, {specialty_name.lower()}"
    page_title = f"{physician['full_name']} | {physician['job_title']} | Bio-Clinic Sassari"
    
    # Specialty schema mapping
    specialty_schema_map = {
        'ginecologia': 'Gynecology',
        'ostetricia': 'Obstetrics',
        'cardiologia': 'Cardiology',
        'dermatologia': 'Dermatology',
        'endocrinologia': 'Endocrinology',
        'neurologia': 'Neurology',
        'oculistica': 'Ophthalmology',
        'ortopedia': 'Orthopedics',
        'pediatria': 'Pediatrics',
        'urologia': 'Urology',
        'pneumologia': 'Pulmonology',
        'gastroenterologia': 'Gastroenterology',
        'ematologia': 'Hematology',
        'reumatologia': 'Rheumatology',
        'nefrologia': 'Nephrology',
        'psicologia': 'Psychology',
        'fisiatria': 'PhysicalMedicine'
    }
    specialty_schema = specialty_schema_map.get(physician['specialty_id'], physician['specialty_id'].title())
    
    # Fill template
    html = TEMPLATE.format(
        slug=physician['slug'],
        full_name=physician['full_name'],
        first_name=first_name,
        last_name=last_name,
        title=physician.get('title', ''),
        name=physician['name'],
        job_title=physician['job_title'],
        bio=physician['bio'],
        specialty_id=physician['specialty_id'],
        specialty_name=specialty_name,
        specialty_color=specialty_color,
        specialty_schema=specialty_schema,
        initials=get_initials(physician['name']),
        widget_html=physician.get('widget_html', '<p>Prenotazione telefonica disponibile</p>'),
        procedures_html=procedures_html,
        procedures_schema=procedures_schema,
        role_badge_html=role_badge_html,
        pathways_html=pathways_html,
        meta_description=meta_description,
        meta_keywords=meta_keywords,
        page_title=page_title
    )
    
    return html

def main():
    # Paths
    script_dir = Path(__file__).parent
    site_dir = script_dir.parent
    data_file = site_dir / 'data' / 'entities' / 'physicians-complete.json'
    equipe_dir = site_dir / 'equipe'
    
    # Load data
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    physicians = data['physicians']
    specialties = data['specialties']
    
    # Create equipe directory if not exists
    equipe_dir.mkdir(exist_ok=True)
    
    # Generate pages
    generated = 0
    for physician in physicians:
        html = generate_page(physician, specialties)
        output_file = equipe_dir / f"{physician['slug']}.html"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"Generated: {output_file.name}")
        generated += 1
    
    print(f"\n=== Generated {generated} physician pages ===")

if __name__ == '__main__':
    main()
