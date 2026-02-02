/**
 * NAV ACTIVE STATE MANAGER v1.0.0
 * ================================
 * Centralizes navigation active state management.
 * Replaces hardcoded 'active' classes in HTML.
 * 
 * @author Bio-Clinic Development Team
 * @date 2026-02-02
 */

(function() {
    'use strict';

    /**
     * Navigation path mappings
     * Maps URL patterns to nav-link selectors
     */
    const NAV_MAPPINGS = {
        // Homepage
        '/': 'home',
        '/index.html': 'home',
        
        // Slim Care
        '/pages/slim-care.html': 'slim-care',
        '/pages/slim-care-donna.html': 'slim-care',
        '/pages/screening-inps-sardegna.html': 'slim-care',
        '/pages/convenzioni.html': 'slim-care',
        
        // Laboratorio
        '/laboratorio/': 'laboratorio',
        '/laboratorio/index.html': 'laboratorio',
        '/pages/genetica.html': 'laboratorio',
        '/pages/preparazione-esami.html': 'laboratorio',
        
        // Aziende
        '/pages/medicina-lavoro.html': 'aziende',
        
        // Donna & PMA
        '/pages/ginecologia.html': 'donna-pma',
        '/pages/pma-fertilita.html': 'donna-pma',
        '/pages/isteroscopia.html': 'donna-pma',
        '/pages/isterosalpingografia.html': 'donna-pma',
        
        // Specialisti
        '/pages/cardiologia.html': 'specialisti',
        '/pages/endocrinologia.html': 'specialisti',
        '/pages/dermatologia.html': 'specialisti',
        '/pages/neurologia.html': 'specialisti',
        '/pages/oculistica.html': 'specialisti',
        '/pages/ortopedia.html': 'specialisti',
        '/pages/specialita.html': 'specialisti',
        '/equipe/': 'specialisti',
        '/equipe/index.html': 'specialisti',
        
        // Shop
        '/shop/': 'shop',
        '/shop/index.html': 'shop',
        
        // Contatti
        '/pages/contatti.html': 'contatti'
    };

    /**
     * Nav link data attributes
     */
    const NAV_SELECTORS = {
        'home': '[data-nav="home"], .nav-link[href="index.html"], .nav-link[href="/"]',
        'slim-care': '[data-nav="slim-care"], .nav-item:has(.nav-link[title*="Slim Care"]) > .nav-link',
        'laboratorio': '[data-nav="laboratorio"], .nav-item:has(.nav-link[title*="Laboratorio"]) > .nav-link',
        'aziende': '[data-nav="aziende"], .nav-link[href*="medicina-lavoro"]',
        'donna-pma': '[data-nav="donna-pma"], .nav-item:has(.nav-link[title*="Donna"]) > .nav-link',
        'specialisti': '[data-nav="specialisti"], .nav-item:has(.nav-dropdown a[href*="cardiologia"]) > .nav-link',
        'shop': '[data-nav="shop"], .nav-link[href*="shop"]',
        'contatti': '[data-nav="contatti"], .nav-link[href*="contatti"]'
    };

    /**
     * Initialize active state management
     */
    function initNavActiveState() {
        // Get current path
        const path = window.location.pathname;
        
        // Remove all existing active classes
        document.querySelectorAll('.nav-link.active').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find matching nav section
        let activeSection = null;
        
        // Exact match first
        if (NAV_MAPPINGS[path]) {
            activeSection = NAV_MAPPINGS[path];
        } else {
            // Partial match
            for (const [pattern, section] of Object.entries(NAV_MAPPINGS)) {
                if (path.includes(pattern.replace('/index.html', '').replace('.html', ''))) {
                    activeSection = section;
                    break;
                }
            }
        }
        
        // Default to home if no match
        if (!activeSection) {
            activeSection = 'home';
        }
        
        // Apply active class
        applyActiveState(activeSection);
        
        console.log('[NavActiveState] Active section:', activeSection, 'for path:', path);
    }

    /**
     * Apply active state to nav links
     */
    function applyActiveState(section) {
        // Simple approach: find nav links by href pattern
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const title = link.getAttribute('title') || '';
            const text = link.textContent.trim().toLowerCase();
            
            let shouldBeActive = false;
            
            switch (section) {
                case 'home':
                    shouldBeActive = href === 'index.html' || href === '/' || href === '../index.html' || text === 'home';
                    break;
                case 'slim-care':
                    shouldBeActive = title.toLowerCase().includes('slim care') || text.includes('slim care');
                    break;
                case 'laboratorio':
                    shouldBeActive = title.toLowerCase().includes('laboratorio') || text === 'laboratorio';
                    break;
                case 'aziende':
                    shouldBeActive = href.includes('medicina-lavoro') || text === 'aziende';
                    break;
                case 'donna-pma':
                    shouldBeActive = title.toLowerCase().includes('donna') || text.includes('donna');
                    break;
                case 'specialisti':
                    shouldBeActive = text === 'specialisti' || title.toLowerCase().includes('specialist');
                    break;
                case 'shop':
                    shouldBeActive = href.includes('shop') || text.includes('shop');
                    break;
                case 'contatti':
                    shouldBeActive = href.includes('contatti') || text === 'contatti';
                    break;
            }
            
            if (shouldBeActive) {
                link.classList.add('active');
            }
        });
        
        // Also handle mobile nav
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-list a');
        mobileNavLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            
            // Simple active detection for mobile
            if (section === 'home' && (href.includes('index.html') || href === '/')) {
                link.classList.add('active');
            } else if (section === 'laboratorio' && href.includes('laboratorio')) {
                link.classList.add('active');
            }
            // Add more as needed
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavActiveState);
    } else {
        initNavActiveState();
    }

    // Export for testing
    window.NavActiveState = {
        init: initNavActiveState,
        mappings: NAV_MAPPINGS
    };

})();
