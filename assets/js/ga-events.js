// 通用事件追蹤函數
function trackEvent(eventName, parameters = {}) {
    gtag('event', eventName, {
        ...parameters,
        page_title: document.title,
        page_location: window.location.href,
        timestamp: new Date().toISOString()
    });
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 主要追蹤初始化
function initializeTracking() {
    // 初始化變數
    let maxScroll = 0;
    let startTime = Date.now();

    // 1. 頁面滾動追蹤
    const handleScroll = debounce(() => {
        const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            trackEvent('scroll_depth', {
                depth_percentage: Math.round(maxScroll),
                scroll_time: Math.round((Date.now() - startTime) / 1000)
            });
        }
    }, 500);

    window.addEventListener('scroll', handleScroll);

    // 2. 導航點擊追蹤
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            trackEvent('navigation_click', {
                section_name: link.getAttribute('href').replace('#', ''),
                link_text: link.querySelector('span')?.textContent || link.textContent
            });
        });
    });

    // 3. 作品集互動追蹤
    const portfolioObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const projectTitle = item.querySelector('.portfolio-info h4')?.textContent;
                if (projectTitle) {
                    trackEvent('portfolio_view', {
                        project_name: projectTitle,
                        project_category: item.dataset.category
                    });
                }
                portfolioObserver.unobserve(item);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.portfolio-item').forEach(item => {
        portfolioObserver.observe(item);
        
        item.addEventListener('click', () => {
            const projectTitle = item.querySelector('.portfolio-info h4')?.textContent;
            if (projectTitle) {
                trackEvent('portfolio_click', {
                    project_name: projectTitle,
                    project_category: item.dataset.category
                });
            }
        });
    });

    // 4. 技能進度條追蹤
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skill = entry.target;
                const skillName = skill.querySelector('.skill')?.textContent;
                const skillValue = skill.querySelector('.val')?.textContent;
                if (skillName && skillValue) {
                    trackEvent('skill_view', {
                        skill_name: skillName.split('<')[0].trim(),
                        skill_value: skillValue
                    });
                }
                skillObserver.unobserve(skill);
            }
        });
    });

    document.querySelectorAll('.progress').forEach(skill => {
        skillObserver.observe(skill);
    });

    // 5. 表單互動追蹤
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const formFields = contactForm.querySelectorAll('input, textarea');
        formFields.forEach(field => {
            field.addEventListener('focus', () => {
                trackEvent('form_field_focus', {
                    field_name: field.name,
                    field_type: field.type
                });
            });
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            trackEvent('form_submit', {
                form_name: 'contact_form'
            });
        });
    }

    // 6. 社群連結追蹤
    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            trackEvent('social_click', {
                platform: Array.from(link.classList)[0] || 'unknown',
                url: link.href
            });
        });
    });

    // 7. 錯誤追蹤
    window.addEventListener('error', (e) => {
        trackEvent('js_error', {
            error_message: e.message,
            error_line: e.lineno,
            error_source: e.filename
        });
    });

    // 8. 頁面離開追蹤
    window.addEventListener('beforeunload', () => {
        trackEvent('page_exit', {
            time_spent: Math.round((Date.now() - startTime) / 1000)
        });
    });
}

// 當 DOM 載入完成後初始化所有追蹤
document.addEventListener('DOMContentLoaded', initializeTracking);