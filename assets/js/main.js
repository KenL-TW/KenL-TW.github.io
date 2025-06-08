/**
* Template Name: iPortfolio
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Updated: Mar 17 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('body').classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function(direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Portfolio initialization and handlers
   */
  const initPortfolio = () => {
    // Initialize Isotope
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows',
        transitionDuration: '0.4s'
      });

      // Filter handlers
      let portfolioFilters = select('#portfolio-flters li', true);
      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(el => el.classList.remove('filter-active'));
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', () => AOS.refresh());
      }, true);
    }

    // Initialize lightbox
    const portfolioLightbox = GLightbox({
      selector: '.portfolio-lightbox',
      touchNavigation: true,
      loop: true,
      autoplayVideos: true
    });

    // Portfolio details handlers
    const portfolioDetails = select('.portfolio-details');
    if (portfolioDetails) {
      new Swiper('.portfolio-details-slider', {
        speed: 400,
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          type: 'bullets',
          clickable: true
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        }
      });
    }

    // Initialize modals
    initPortfolioModals();
  };

  function initPortfolioModals() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const modal = document.getElementById('portfolio-modal');
    const closeButton = modal.querySelector('.close-modal');

    portfolioItems.forEach(item => {
      item.addEventListener('click', () => {
        const data = item.dataset;
        
        // Set modal content
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-description').textContent = data.description;
        document.getElementById('modal-image').src = item.querySelector('img').src;
        
        // Show modal
        modal.style.display = 'flex';
      });
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Initialize portfolio when DOM is loaded
  window.addEventListener('load', initPortfolio);

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  /**
   * Initiate Pure Counter 
   */
  new PureCounter();

  // Add GA4 event tracking
  document.addEventListener('DOMContentLoaded', function() {
    // Track contact form submissions
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function() {
        gtag('event', 'form_submission', {
          'event_category': 'Contact',
          'event_label': 'Contact Form'
        });
      });
    }

    // Track portfolio item clicks
    document.querySelectorAll('.portfolio-item').forEach(item => {
      item.addEventListener('click', function() {
        gtag('event', 'view_item', {
          'event_category': 'Portfolio',
          'event_label': this.querySelector('h4').textContent
        });
      });
    });

    // Track certification views
    document.querySelectorAll('.certification-box').forEach(cert => {
      cert.addEventListener('click', function() {
        gtag('event', 'view_item', {
          'event_category': 'Certifications',
          'event_label': this.querySelector('h4').textContent
        });
      });
    });
  });

  // Certificate Modal Functions
  function showCertificateModal() {
    const modal = document.getElementById('certificateModal');
    modal.style.display = "block";
    
    // Track modal open in GA
    gtag('event', 'view_certificate', {
      'event_category': 'Engagement',
      'event_label': 'Table Tennis Certificate'
    });
  }

  function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    modal.style.display = "none";
  }

  // Close modal when clicking outside
  window.onclick = function(event) {
    const modal = document.getElementById('certificateModal');
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // Navigation
  function initNavigation() {
    // Your navigation initialization code here
  }

  // Tabs
  function initTabs() {
    // Your tabs initialization code here
  }

  // Forms
  function initForms() {
    // Your forms initialization code here
  }

  // Accordion
  function initAccordion() {
    // Your accordion initialization code here
  }

  /**
   * Page init
   */
  document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    initNavigation();
    
    // Tabs
    initTabs();
    
    // Forms
    initForms();
    
    // Accordion
    initAccordion();
  });

})()