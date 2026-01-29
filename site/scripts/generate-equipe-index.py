#!/usr/bin/env python3
"""
Bio-Clinic Équipe Index Page Generator
Generates the main équipe listing page with all physicians grouped by specialty
"""

import json
from pathlib import Path

def get_initials(name):
    """Get initials from name"""
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()

def main():
    script_dir = Path(__file__).parent
    site_dir = script_dir.parent
    data_file = site_dir / 'data' / 'entities' / 'physicians-complete.json'
    output_file = site_dir / 'equipe' / 'index.html'
    
    # Load data
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    physicians = data['physicians']
    specialties_map = data['specialties']
    
    # Group physicians by specialty
    by_specialty = {}
    for p in physicians:
        spec_id = p['specialty_id']
        if spec_id not in by_specialty:
            by_specialty[spec_id] = []
        by_specialty[spec_id].append(p)
    
    # Generate JSON-LD itemListElement
    jsonld_items = []
    jsonld_employees = []
    for i, p in enumerate(physicians, 1):
        jsonld_items.append(f'{{"@type": "ListItem", "position": {i}, "item": {{"@id": "https://bio-clinic.it/equipe/{p["slug"]}/"}}}}')
        jsonld_employees.append(f'{{"@type": "Physician", "name": "{p["full_name"]}", "@id": "https://bio-clinic.it/equipe/{p["slug"]}/#physician"}}')
    
    # Generate specialty sections HTML
    specialty_order = [
        'ginecologia', 'ostetricia', 'cardiologia', 'dermatologia', 'endocrinologia',
        'neurologia', 'oculistica', 'otorinolaringoiatria', 'ortopedia', 'gastroenterologia',
        'medicina-interna', 'nefrologia', 'pneumologia', 'ematologia', 'reumatologia',
        'urologia', 'chirurgia-vascolare', 'ecografia', 'medicina-sport', 'medicina-lavoro',
        'fisiatria', 'pediatria', 'psicologia', 'nutrizione', 'laboratorio'
    ]
    
    sections_html = ""
    for spec_id in specialty_order:
        if spec_id not in by_specialty:
            continue
        
        spec = specialties_map.get(spec_id, {'name': spec_id.title(), 'color': '#0077B6'})
        spec_name = spec.get('name', spec_id.title())
        spec_color = spec.get('color', '#0077B6')
        
        cards_html = ""
        for p in by_specialty[spec_id]:
            initials = get_initials(p['name'])
            role_badge = f'<span class="physician-role-badge">{p["role_badge"]}</span>' if p.get('role_badge') else ''
            avatar_class = 'physician-avatar director' if p.get('role_badge') == 'Direttore Sanitario' else 'physician-avatar'
            
            cards_html += f'''
          <a href="{p['slug']}.html" class="physician-card" data-specialty="{spec_id}">
            <div class="physician-card-header">
              <div class="{avatar_class}" style="background: {spec_color}20; color: {spec_color};">
                <span style="font-weight: 600; font-size: 1.25rem;">{initials}</span>
              </div>
              <div class="physician-info">
                <h3>{p['full_name']}</h3>
                <span class="physician-specialty">{p['job_title']}</span>
                {role_badge}
              </div>
            </div>
            <div class="physician-cta">
              <span style="color: var(--gray-500); font-size: 0.85rem;">Vedi profilo &rarr;</span>
            </div>
          </a>'''
        
        sections_html += f'''
      <section class="specialty-group" id="{spec_id}">
        <h2 style="border-color: {spec_color}; color: {spec_color};">
          <span style="display:inline-block; width:12px; height:12px; background:{spec_color}; border-radius:50%; margin-right:0.75rem;"></span>
          {spec_name}
        </h2>
        <div class="physician-grid">
          {cards_html}
        </div>
      </section>'''
    
    # Generate filter options
    filter_options = ""
    for spec_id in specialty_order:
        if spec_id in by_specialty:
            spec = specialties_map.get(spec_id, {'name': spec_id.title()})
            filter_options += f'<option value="{spec_id}">{spec.get("name", spec_id.title())}</option>\n'
    
    html = f'''<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Équipe Bio-Clinic Sassari: {len(physicians)} medici specialisti in {len(by_specialty)} specialità. Ginecologi, cardiologi, endocrinologi, dermatologi e altri professionisti. Prenota online.">
  <meta name="keywords" content="medici sassari, specialisti sassari, ginecologo sassari, cardiologo sassari, endocrinologo sassari, dermatologo sassari, equipe bio-clinic">
  
  <title>Équipe Medica | {len(physicians)} Specialisti | Bio-Clinic Sassari</title>
  
  <link rel="canonical" href="https://bio-clinic.it/equipe/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/search.css">
  
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "ItemList",
        "@id": "https://bio-clinic.it/equipe/#list",
        "name": "Équipe Medica Bio-Clinic",
        "description": "Lista completa dei {len(physicians)} medici specialisti di Bio-Clinic Sassari",
        "numberOfItems": {len(physicians)},
        "itemListElement": [
          {',\n          '.join(jsonld_items[:20])}
        ]
      }},
      {{
        "@type": "MedicalClinic",
        "@id": "https://bio-clinic.it/#organization",
        "name": "Bio-Clinic Sassari",
        "employee": [
          {',\n          '.join(jsonld_employees[:20])}
        ]
      }},
      {{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bio-clinic.it/"}},
          {{"@type": "ListItem", "position": 2, "name": "Équipe", "item": "https://bio-clinic.it/equipe/"}}
        ]
      }}
    ]
  }}
  </script>
  
  <style>
    .equipe-hero {{
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
    }}
    .equipe-hero h1 {{
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }}
    .equipe-hero p {{
      font-size: 1.2rem;
      opacity: 0.9;
    }}
    .equipe-stats {{
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-top: 2rem;
    }}
    .equipe-stat {{
      text-align: center;
    }}
    .equipe-stat-number {{
      font-size: 2.5rem;
      font-weight: 700;
      display: block;
    }}
    .equipe-stat-label {{
      font-size: 0.9rem;
      opacity: 0.8;
    }}
    .filter-bar {{
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--gray-50);
      border-radius: var(--radius-lg);
      position: sticky;
      top: 80px;
      z-index: 10;
    }}
    .filter-bar select,
    .filter-bar input {{
      padding: 0.75rem 1rem;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      min-width: 200px;
      flex: 1;
    }}
    .physician-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }}
    .physician-card {{
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
      display: block;
    }}
    .physician-card:hover {{
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }}
    .physician-card.hidden {{
      display: none;
    }}
    .physician-card-header {{
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }}
    .physician-avatar {{
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}
    .physician-avatar.director {{
      background: var(--primary) !important;
      color: white !important;
    }}
    .physician-info h3 {{
      font-size: 1.1rem;
      margin: 0 0 0.25rem 0;
      color: var(--gray-900);
    }}
    .physician-specialty {{
      color: var(--primary);
      font-size: 0.9rem;
      font-weight: 500;
    }}
    .physician-role-badge {{
      display: inline-block;
      background: var(--accent);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      margin-top: 0.5rem;
    }}
    .physician-cta {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--gray-100);
    }}
    .specialty-group {{
      margin-bottom: 3rem;
      scroll-margin-top: 160px;
    }}
    .specialty-group h2 {{
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid;
      display: flex;
      align-items: center;
    }}
    .specialty-group.hidden {{
      display: none;
    }}
    @media (max-width: 768px) {{
      .equipe-hero h1 {{ font-size: 1.75rem; }}
      .equipe-stats {{ gap: 1.5rem; flex-wrap: wrap; }}
      .equipe-stat-number {{ font-size: 2rem; }}
      .filter-bar {{ position: static; }}
    }}
  </style>
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
                <a href="../pages/slim-care-donna.html">Slim Care Donna</a>
                <a href="../pages/pma-fertilita.html">PMA / Fertilità</a>
              </div>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">Specialità</a>
              <div class="nav-dropdown">
                <a href="../pages/ginecologia.html">Ginecologia</a>
                <a href="../pages/cardiologia.html">Cardiologia</a>
                <a href="../pages/endocrinologia.html">Endocrinologia</a>
                <a href="../pages/laboratorio.html">Laboratorio</a>
                <a href="../pages/specialita.html">Tutte le Specialità</a>
              </div>
            </li>
            <li class="nav-item"><a href="index.html" class="nav-link active">Équipe</a></li>
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

  <!-- Hero Section -->
  <section class="equipe-hero">
    <div class="container">
      <h1>La Nostra Équipe Medica</h1>
      <p>Professionisti di eccellenza al servizio della tua salute</p>
      <div class="equipe-stats">
        <div class="equipe-stat">
          <span class="equipe-stat-number">{len(physicians)}</span>
          <span class="equipe-stat-label">Medici Specialisti</span>
        </div>
        <div class="equipe-stat">
          <span class="equipe-stat-number">{len(by_specialty)}</span>
          <span class="equipe-stat-label">Specialità</span>
        </div>
        <div class="equipe-stat">
          <span class="equipe-stat-number">1.840+</span>
          <span class="equipe-stat-label">Prestazioni</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <main class="section">
    <div class="container">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <input type="text" id="search-physician" placeholder="Cerca medico per nome..." oninput="filterPhysicians()">
        <select id="filter-specialty" onchange="filterPhysicians()">
          <option value="">Tutte le specialità</option>
          {filter_options}
        </select>
      </div>

      <!-- Physician Listings by Specialty -->
      {sections_html}
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="../images/logo-bioclinic.png" alt="Bio-Clinic" style="height: 40px; margin-bottom: 1rem;">
          <p>Poliambulatorio di riferimento a Sassari con {len(by_specialty)} specialità, {len(physicians)} medici e oltre 1.840 prestazioni.</p>
        </div>
        <div>
          <h4 class="footer-title">Link Rapidi</h4>
          <ul class="footer-links">
            <li><a href="../pages/slim-care.html">Slim Care</a></li>
            <li><a href="../pages/pma-fertilita.html">PMA / Fertilità</a></li>
            <li><a href="index.html">Équipe</a></li>
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

  <script src="../js/main.js"></script>
  <script src="../js/search.js"></script>
  <script src="../js/header-search.js"></script>
  
  <script>
    function filterPhysicians() {{
      const searchTerm = document.getElementById('search-physician').value.toLowerCase();
      const specialty = document.getElementById('filter-specialty').value;
      
      document.querySelectorAll('.physician-card').forEach(card => {{
        const name = card.querySelector('h3').textContent.toLowerCase();
        const cardSpecialty = card.dataset.specialty;
        
        const matchesName = name.includes(searchTerm);
        const matchesSpecialty = !specialty || cardSpecialty === specialty;
        
        card.classList.toggle('hidden', !(matchesName && matchesSpecialty));
      }});
      
      // Hide empty specialty groups
      document.querySelectorAll('.specialty-group').forEach(group => {{
        const visibleCards = group.querySelectorAll('.physician-card:not(.hidden)');
        group.classList.toggle('hidden', visibleCards.length === 0);
      }});
    }}
  </script>
</body>
</html>'''
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Generated équipe index with {len(physicians)} physicians in {len(by_specialty)} specialties")

if __name__ == '__main__':
    main()
