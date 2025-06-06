// Navigation Events
document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
  link.addEventListener('click', function() {
    gtag('event', 'menu_click', {
      'event_category': 'Navigation',
      'event_label': this.querySelector('span').textContent,
      'menu_item': this.getAttribute('href')
    });
  });
});

// Portfolio Item Clicks
document.querySelectorAll('.portfolio-item').forEach(item => {
  item.addEventListener('click', function() {
    const projectTitle = this.querySelector('.portfolio-info h4').textContent;
    const projectCategory = this.dataset.category;
    
    // Send click event to GA4
    gtag('event', 'portfolio_item_click', {
      'event_category': 'Portfolio Interaction',
      'event_label': projectTitle,
      'project_category': projectCategory,
      'project_url': this.querySelector('a')?.href || 'No URL'
    });
  });
});

// Portfolio Items Visibility Tracking
const observePortfolioItems = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const item = entry.target;
        const projectTitle = item.querySelector('.portfolio-info h4').textContent;
        
        // Send impression event to GA4
        gtag('event', 'portfolio_item_view', {
          'event_category': 'Portfolio Visibility',
          'event_label': projectTitle,
          'project_category': item.dataset.category
        });
        
        // Unobserve after first view
        observer.unobserve(item);
      }
    });
  }, {
    threshold: 0.5 // Item must be 50% visible
  });

  // Observe all portfolio items
  document.querySelectorAll('.portfolio-item').forEach(item => {
    observer.observe(item);
  });
};

// Initialize tracking when DOM is loaded
document.addEventListener('DOMContentLoaded', observePortfolioItems);

// Certification Card Views
document.querySelectorAll('.certification-box').forEach(cert => {
  cert.addEventListener('click', function() {
    gtag('event', 'certification_view', {
      'event_category': 'Certifications',
      'event_label': this.querySelector('h4').textContent,
      'certification_date': this.querySelector('.certification-meta span:first-child').textContent
    });
  });
});

// Contact Form Interactions
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  // Form submission
  contactForm.addEventListener('submit', function() {
    gtag('event', 'form_submit', {
      'event_category': 'Contact',
      'event_label': 'Contact Form'
    });
  });

  // Form field focus
  contactForm.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('focus', function() {
      gtag('event', 'form_field_focus', {
        'event_category': 'Contact',
        'event_label': this.name
      });
    });
  });
}

// Social Links Clicks
document.querySelectorAll('.social-links a').forEach(link => {
  link.addEventListener('click', function() {
    gtag('event', 'social_click', {
      'event_category': 'Social',
      'event_label': this.className,
      'outbound_link': this.href
    });
  });
});

// Resume Section Interactions
document.querySelectorAll('.resume-item').forEach(item => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gtag('event', 'resume_section_view', {
          'event_category': 'Resume',
          'event_label': item.querySelector('h4').textContent
        });
        observer.unobserve(entry.target);
      }
    });
  });
  observer.observe(item);
});

// Skills Progress Bar Views
document.querySelectorAll('.progress').forEach(skill => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gtag('event', 'skill_view', {
          'event_category': 'Skills',
          'event_label': skill.querySelector('.skill').textContent,
          'skill_level': skill.querySelector('.val').textContent
        });
        observer.unobserve(entry.target);
      }
    });
  });
  observer.observe(skill);
});

// Download Resume Button (if exists)
const downloadBtn = document.querySelector('.download-resume');
if (downloadBtn) {
  downloadBtn.addEventListener('click', function() {
    gtag('event', 'resume_download', {
      'event_category': 'Downloads',
      'event_label': 'Resume PDF'
    });
  });
}