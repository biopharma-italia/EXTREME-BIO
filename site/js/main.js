/**
 * BIO-CLINIC SASSARI - Main JavaScript
 * Handles navigation, animations, and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initHeader();
  initMobileNav();
  initSmoothScroll();
  initAnimations();
  initForms();
});

/**
 * Header scroll effect
 */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });
}

/**
 * Mobile Navigation
 */
function initMobileNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const mobileNavClose = document.querySelector('.mobile-nav-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-list a');

  if (!menuToggle || !mobileNav) return;

  function openMobileNav() {
    mobileNav.classList.add('active');
    mobileOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', openMobileNav);
  mobileNavClose?.addEventListener('click', closeMobileNav);
  mobileOverlay?.addEventListener('click', closeMobileNav);

  // Close on link click
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
    }
  });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Scroll animations using Intersection Observer
 */
function initAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('animate-slide-up');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animatedElements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

/**
 * Form handling
 */
function initForms() {
  const forms = document.querySelectorAll('form[data-ajax]');
  
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';
      
      try {
        // Simulate form submission (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Success message
        showNotification('Messaggio inviato con successo! Ti contatteremo presto.', 'success');
        form.reset();
      } catch (error) {
        showNotification('Si è verificato un errore. Riprova o chiamaci al 079 956 1332.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="notification-close">&times;</button>
  `;
  
  // Styles
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    maxWidth: '400px',
    padding: '16px 20px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0891b2',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: '9999',
    animation: 'slideUp 0.3s ease'
  });
  
  document.body.appendChild(notification);
  
  // Close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Phone number formatting for tel: links
 */
function formatPhoneLinks() {
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function() {
      // Track phone clicks (analytics)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          event_category: 'Contact',
          event_label: 'Phone Call'
        });
      }
    });
  });
}

/**
 * Lazy load images
 */
function initLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  }
}

/**
 * Counter animation for statistics
 */
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.counter);
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current).toLocaleString('it-IT');
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString('it-IT');
          }
        };
        
        updateCounter();
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

/**
 * FAQ Accordion
 */
function initAccordion() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');
    
    header?.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      
      // Close all other items
      accordionItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-content').style.maxHeight = null;
      });
      
      // Toggle current item
      if (!isOpen) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
  formatPhoneLinks();
  initLazyLoad();
  animateCounters();
  initAccordion();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
  
  .notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.8;
  }
  
  .notification-close:hover {
    opacity: 1;
  }
`;
document.head.appendChild(style);
