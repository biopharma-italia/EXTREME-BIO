/**
 * BIO-CLINIC PHYSICIAN PROFILE SYSTEM
 * ====================================
 * Version: 3.0.0 - LEAD ARCHITECT EDITION
 * 
 * Sistema avanzato per la gestione dei profili medici con:
 * - Schema.org Graph complesso (Physician + FAQPage)
 * - Knowledge Graph clinico
 * - Interlinking automatico
 * - Rendering dinamico sintomi e pubblicazioni
 * 
 * © 2026 Bio-Clinic Sassari
 */

const BioClinicPhysician = (function() {
  'use strict';

  // =============================================
  // CONFIGURATION
  // =============================================
  const CONFIG = {
    clinicName: 'Bio-Clinic Sassari',
    clinicUrl: 'https://bio-clinic.it',
    clinicPhone: '+39 079 956 1332',
    clinicAddress: {
      streetAddress: 'Via Renzo Mossa, 23',
      addressLocality: 'Sassari',
      postalCode: '07100',
      addressRegion: 'SS',
      addressCountry: 'IT'
    },
    openingHours: ['Mo-Fr 07:00-21:00', 'Sa 08:00-14:00'],
    logoUrl: 'https://bio-clinic.it/images/logo-bioclinic.png'
  };

  // Mapping specialità IT -> EN per Schema.org
  const SPECIALTY_MAPPING = {
    'ginecologia': { en: 'Gynecology', schema: 'https://schema.org/Gynecologic' },
    'ostetricia': { en: 'Obstetrics', schema: 'https://schema.org/Obstetric' },
    'cardiologia': { en: 'Cardiology', schema: 'https://schema.org/Cardiovascular' },
    'dermatologia': { en: 'Dermatology', schema: 'https://schema.org/Dermatology' },
    'endocrinologia': { en: 'Endocrinology', schema: 'https://schema.org/Endocrine' },
    'neurologia': { en: 'Neurology', schema: 'https://schema.org/Neurologic' },
    'oculistica': { en: 'Ophthalmology', schema: 'https://schema.org/Optometric' },
    'otorinolaringoiatria': { en: 'Otolaryngology', schema: 'https://schema.org/Otolaryngologic' },
    'ortopedia': { en: 'Orthopedics', schema: 'https://schema.org/Musculoskeletal' },
    'gastroenterologia': { en: 'Gastroenterology', schema: 'https://schema.org/Gastroenterologic' },
    'medicina-interna': { en: 'Internal Medicine', schema: 'https://schema.org/InternalMedicine' },
    'nefrologia': { en: 'Nephrology', schema: 'https://schema.org/Renal' },
    'pneumologia': { en: 'Pulmonology', schema: 'https://schema.org/Pulmonary' },
    'ematologia': { en: 'Hematology', schema: 'https://schema.org/Hematologic' },
    'reumatologia': { en: 'Rheumatology', schema: 'https://schema.org/Rheumatologic' },
    'urologia': { en: 'Urology', schema: 'https://schema.org/Urologic' },
    'chirurgia-vascolare': { en: 'Vascular Surgery', schema: 'https://schema.org/Surgical' },
    'pediatria': { en: 'Pediatrics', schema: 'https://schema.org/Pediatric' },
    'psicologia': { en: 'Psychology', schema: 'https://schema.org/Psychiatric' },
    'nutrizione': { en: 'Clinical Nutrition', schema: 'https://schema.org/DietNutrition' },
    'laboratorio': { en: 'Laboratory Medicine', schema: 'https://schema.org/LaboratoryScience' }
  };

  // Keywords per interlinking automatico
  const INTERLINK_KEYWORDS = {
    'PMA': { url: '/pages/pma-fertilita.html', title: 'Procreazione Medicalmente Assistita' },
    'Slim Care': { url: '/pages/slim-care.html', title: 'Percorso Dimagrimento Slim Care' },
    'Wegovy': { url: '/pages/slim-care.html', title: 'Trattamento con Wegovy' },
    'Mounjaro': { url: '/pages/slim-care.html', title: 'Trattamento con Mounjaro' },
    'cardiologia': { url: '/pages/cardiologia.html', title: 'Reparto di Cardiologia' },
    'ginecologia': { url: '/pages/ginecologia.html', title: 'Reparto di Ginecologia' },
    'laboratorio': { url: '/laboratorio/', title: 'Laboratorio Analisi' },
    'endocrinologia': { url: '/pages/endocrinologia.html', title: 'Reparto di Endocrinologia' },
    'dermatologia': { url: '/pages/dermatologia.html', title: 'Reparto di Dermatologia' },
    'tiroide': { url: '/pages/endocrinologia.html', title: 'Patologie della Tiroide' },
    'menopausa': { url: '/pages/slim-care-donna.html', title: 'Gestione Menopausa' },
    'PCOS': { url: '/pages/slim-care-donna.html', title: 'Sindrome dell\'Ovaio Policistico' },
    'fertilità': { url: '/pages/pma-fertilita.html', title: 'Centro Fertilità' }
  };

  // =============================================
  // LEVEL 2: SCHEMA.ORG GRAPH GENERATOR
  // =============================================
  
  /**
   * Genera un Graph JSON-LD complesso per Schema.org
   * Include: Physician, MedicalClinic, FAQPage, BreadcrumbList
   * 
   * @param {Object} medico - Dati del medico dal database
   * @param {Object} extendedData - Dati estesi (pubblicazioni, sintomi, social)
   * @returns {Object} Schema.org Graph
   */
  function generateSchema(medico, extendedData = {}) {
    const specialtyInfo = SPECIALTY_MAPPING[medico.specialty_id] || { en: medico.job_title, schema: '' };
    const hasPublications = extendedData.pubblicazioni && extendedData.pubblicazioni.length > 0;
    const hasSintomi = extendedData.sintomi && extendedData.sintomi.length > 0;
    
    // Build sameAs array
    const sameAs = [];
    if (medico.miodottore_url) sameAs.push(medico.miodottore_url);
    if (extendedData.social) {
      extendedData.social.forEach(s => sameAs.push(s.url));
    }

    // Build citation array (CRITICAL for E-E-A-T)
    const citations = [];
    if (hasPublications) {
      extendedData.pubblicazioni.forEach(pub => {
        citations.push({
          '@type': 'ScholarlyArticle',
          'name': pub.titolo,
          'url': pub.url,
          'datePublished': pub.anno ? pub.anno.toString() : undefined,
          'isPartOf': pub.journal ? { '@type': 'Periodical', 'name': pub.journal } : undefined
        });
      });
    }

    // Build knowsAbout array
    const knowsAbout = [];
    if (hasSintomi) {
      extendedData.sintomi.forEach(s => knowsAbout.push(s));
    }
    // Add procedures as knowledge
    if (medico.procedures) {
      medico.procedures.forEach(p => {
        knowsAbout.push(formatProcedureName(p));
      });
    }

    // Main Graph
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        // 1. Physician Schema (Arricchito)
        {
          '@type': 'Physician',
          '@id': `${CONFIG.clinicUrl}/equipe/${medico.slug}#physician`,
          'name': medico.full_name,
          'givenName': medico.name.split(' ')[0],
          'familyName': medico.name.split(' ').slice(1).join(' '),
          'honorificPrefix': medico.title,
          'jobTitle': medico.job_title,
          'description': medico.bio,
          'medicalSpecialty': specialtyInfo.schema || specialtyInfo.en,
          'isAcceptingNewPatients': true,
          'availableService': medico.procedures ? medico.procedures.map(p => ({
            '@type': 'MedicalProcedure',
            'name': formatProcedureName(p)
          })) : [],
          'knowsAbout': knowsAbout.length > 0 ? knowsAbout : undefined,
          'sameAs': sameAs.length > 0 ? sameAs : undefined,
          'citation': citations.length > 0 ? citations : undefined,
          'affiliation': extendedData.affiliazioni ? extendedData.affiliazioni.map(a => ({
            '@type': 'Organization',
            'name': a
          })) : undefined,
          'worksFor': {
            '@type': 'MedicalClinic',
            '@id': `${CONFIG.clinicUrl}#clinic`,
            'name': CONFIG.clinicName,
            'telephone': CONFIG.clinicPhone,
            'url': CONFIG.clinicUrl,
            'logo': CONFIG.logoUrl,
            'address': {
              '@type': 'PostalAddress',
              ...CONFIG.clinicAddress
            },
            'openingHoursSpecification': CONFIG.openingHours.map(h => ({
              '@type': 'OpeningHoursSpecification',
              'dayOfWeek': h.split(' ')[0],
              'opens': h.split(' ')[1].split('-')[0],
              'closes': h.split(' ')[1].split('-')[1]
            }))
          },
          'image': medico.photo_url || `${CONFIG.clinicUrl}/images/default-physician.jpg`,
          'url': `${CONFIG.clinicUrl}/equipe/${medico.slug}.html`
        },

        // 2. BreadcrumbList
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': CONFIG.clinicUrl
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Équipe Medica',
              'item': `${CONFIG.clinicUrl}/equipe/`
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': medico.full_name,
              'item': `${CONFIG.clinicUrl}/equipe/${medico.slug}.html`
            }
          ]
        },

        // 3. FAQPage (Automatica)
        {
          '@type': 'FAQPage',
          'mainEntity': generateFAQs(medico, extendedData, hasPublications)
        }
      ]
    };

    return graph;
  }

  /**
   * Genera FAQ automatiche basate sui dati del medico
   */
  function generateFAQs(medico, extendedData, hasPublications) {
    const faqs = [];
    const cognome = medico.name.split(' ').slice(-1)[0];
    const prefix = medico.title?.includes('ssa') ? 'la Dott.ssa' : 
                   medico.title?.includes('Prof') ? 'il Prof.' : 'il Dott.';

    // FAQ 1: Patologie trattate
    const patologie = extendedData.sintomi || [];
    faqs.push({
      '@type': 'Question',
      'name': `Quali patologie tratta ${prefix} ${cognome}?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': patologie.length > 0 
          ? `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${cognome} è specializzato nel trattamento di: ${patologie.slice(0, 8).join(', ')}. Prenota una visita chiamando Bio-Clinic al 079 956 1332.`
          : `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${cognome} è ${medico.job_title} presso Bio-Clinic Sassari. Per informazioni sulle patologie trattate, contatta la segreteria al 079 956 1332.`
      }
    });

    // FAQ 2: Pubblicazioni scientifiche
    if (hasPublications && extendedData.pubblicazioni.length > 0) {
      const pubCount = extendedData.pubblicazioni.length;
      const pubTitles = extendedData.pubblicazioni.slice(0, 3).map(p => p.titolo).join('; ');
      faqs.push({
        '@type': 'Question',
        'name': `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${cognome} ha pubblicazioni scientifiche?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Sì, ${prefix} ${cognome} è autore di ${pubCount} pubblicazioni scientifiche indicizzate su PubMed, tra cui: "${pubTitles}". Questo conferma l'alto livello di competenza e aggiornamento professionale.`
        }
      });
    }

    // FAQ 3: Dove riceve
    faqs.push({
      '@type': 'Question',
      'name': `Dove riceve ${prefix} ${cognome}?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${cognome} riceve presso Bio-Clinic Sassari, in Via Renzo Mossa 23, 07100 Sassari. Gli orari di apertura sono: Lunedì-Venerdì 07:00-21:00, Sabato 08:00-14:00. Per prenotare: 079 956 1332.`
      }
    });

    // FAQ 4: Come prenotare
    faqs.push({
      '@type': 'Question',
      'name': `Come posso prenotare una visita con ${prefix} ${cognome}?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': medico.miodottore_url 
          ? `Puoi prenotare una visita con ${prefix} ${cognome} tramite MioDottore.it, chiamando il numero 079 956 1332, oppure recandoti direttamente presso Bio-Clinic Sassari in Via Renzo Mossa 23.`
          : `Per prenotare una visita con ${prefix} ${cognome}, chiama la segreteria di Bio-Clinic al 079 956 1332 oppure recati direttamente in Via Renzo Mossa 23, Sassari.`
      }
    });

    return faqs;
  }

  // =============================================
  // LEVEL 3: FRONTEND RENDERING
  // =============================================

  /**
   * Renderizza i sintomi come TAG cliccabili
   */
  function renderSintomiTags(sintomi, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !sintomi || sintomi.length === 0) return;

    const html = `
      <div class="sintomi-section">
        <h3 class="sintomi-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Cosa Curo
        </h3>
        <div class="sintomi-tags">
          ${sintomi.map(s => `
            <span class="sintomo-tag" data-sintomo="${s}">
              ${s}
            </span>
          `).join('')}
        </div>
      </div>
    `;
    container.innerHTML = html;

    // Add click handlers per ricerca
    container.querySelectorAll('.sintomo-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const sintomo = tag.dataset.sintomo;
        // Redirect to search or laboratorio
        window.location.href = `../laboratorio/?q=${encodeURIComponent(sintomo)}`;
      });
    });
  }

  /**
   * Renderizza le pubblicazioni scientifiche
   */
  function renderPubblicazioni(pubblicazioni, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!pubblicazioni || pubblicazioni.length === 0) {
      container.style.display = 'none';
      return;
    }

    const html = `
      <div class="pubblicazioni-section">
        <h3 class="pubblicazioni-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Ricerca & Pubblicazioni
        </h3>
        <p class="pubblicazioni-intro">
          Pubblicazioni scientifiche indicizzate su PubMed che attestano l'elevata competenza professionale:
        </p>
        <ul class="pubblicazioni-list">
          ${pubblicazioni.map(pub => `
            <li class="pubblicazione-item">
              <a href="${pub.url}" target="_blank" rel="noopener" class="pubblicazione-link">
                <span class="pubblicazione-titolo">${pub.titolo}</span>
                <span class="pubblicazione-meta">
                  ${pub.journal ? `<em>${pub.journal}</em>` : ''}
                  ${pub.anno ? `(${pub.anno})` : ''}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </li>
          `).join('')}
        </ul>
        <div class="pubblicazioni-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
          <span>Ricerca verificata su PubMed</span>
        </div>
      </div>
    `;
    container.innerHTML = html;
    container.style.display = 'block';
  }

  /**
   * Applica interlinking automatico al testo della bio
   */
  function applyInterlinking(text) {
    let linkedText = text;
    
    Object.entries(INTERLINK_KEYWORDS).forEach(([keyword, linkData]) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      linkedText = linkedText.replace(regex, (match) => {
        return `<a href="${linkData.url}" class="bio-interlink" title="${linkData.title}">${match}</a>`;
      });
    });

    return linkedText;
  }

  /**
   * Inietta lo schema JSON-LD nel <head>
   */
  function injectSchema(schema) {
    // Remove existing schema
    const existing = document.getElementById('physician-schema');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'physician-schema';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  }

  /**
   * Formatta nome procedura da slug
   */
  function formatProcedureName(slug) {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // =============================================
  // CSS STYLES (iniettati dinamicamente)
  // =============================================
  function injectStyles() {
    if (document.getElementById('physician-profile-styles')) return;

    const styles = `
      /* Sintomi Tags */
      .sintomi-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f0f7e6 0%, #e8f5e9 100%);
        border-radius: 16px;
        border: 1px solid rgba(124, 186, 61, 0.2);
      }

      .sintomi-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.25rem;
        color: var(--gray-900);
        margin-bottom: 1rem;
      }

      .sintomi-title svg {
        color: var(--primary);
      }

      .sintomi-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .sintomo-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid var(--primary);
        border-radius: 25px;
        font-size: 0.9rem;
        color: var(--gray-700);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sintomo-tag:hover {
        background: var(--primary);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(124, 186, 61, 0.3);
      }

      /* Pubblicazioni Section */
      .pubblicazioni-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background: linear-gradient(135deg, #fef3c7 0%, #fefce8 100%);
        border-radius: 16px;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      .pubblicazioni-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.25rem;
        color: var(--gray-900);
        margin-bottom: 0.75rem;
      }

      .pubblicazioni-title svg {
        color: #f59e0b;
      }

      .pubblicazioni-intro {
        color: var(--gray-600);
        margin-bottom: 1rem;
        font-size: 0.95rem;
      }

      .pubblicazioni-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .pubblicazione-item {
        background: white;
        border-radius: 10px;
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .pubblicazione-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .pubblicazione-link {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
      }

      .pubblicazione-titolo {
        flex: 1 1 100%;
        font-weight: 500;
        color: var(--gray-800);
        line-height: 1.4;
      }

      .pubblicazione-meta {
        font-size: 0.85rem;
        color: var(--gray-500);
      }

      .pubblicazione-link svg {
        color: var(--primary);
        flex-shrink: 0;
        margin-left: auto;
      }

      .pubblicazioni-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(124, 186, 61, 0.1);
        border-radius: 8px;
        font-size: 0.85rem;
        color: var(--primary);
        font-weight: 500;
      }

      /* Bio Interlinking */
      .bio-interlink {
        color: var(--primary);
        text-decoration: none;
        border-bottom: 1px dashed var(--primary);
        transition: all 0.2s ease;
      }

      .bio-interlink:hover {
        background: var(--primary-bg);
        border-bottom-style: solid;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .sintomi-section,
        .pubblicazioni-section {
          padding: 1rem;
        }

        .sintomo-tag {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }

        .pubblicazione-titolo {
          font-size: 0.9rem;
        }
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'physician-profile-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  // =============================================
  // PUBLIC API
  // =============================================
  return {
    generateSchema,
    renderSintomiTags,
    renderPubblicazioni,
    applyInterlinking,
    injectSchema,
    injectStyles,
    formatProcedureName,
    CONFIG,
    SPECIALTY_MAPPING,
    INTERLINK_KEYWORDS
  };

})();

// Auto-initialize styles
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BioClinicPhysician.injectStyles());
} else {
  BioClinicPhysician.injectStyles();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BioClinicPhysician;
}

console.log('[BioClinicPhysician] Module loaded v3.0.0');
