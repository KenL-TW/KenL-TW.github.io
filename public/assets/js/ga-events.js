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

    // 9. Chatbot 互動追蹤
    initializeChatbotTracking();
}

// ========================================
// Chatbot 追蹤相關函數
// ========================================
function initializeChatbotTracking() {
    // 監測全局 Chatbot 對象的創建
    if (window.DTZ_CHATBOT) {
        const originalOpen = window.DTZ_CHATBOT.open;
        const originalClose = window.DTZ_CHATBOT.close;
        const originalSendMessage = window.DTZ_CHATBOT.send;
        const originalClear = window.DTZ_CHATBOT.clear;
        const originalSetMode = window.DTZ_CHATBOT.setMode;

        let chatbotSessionStart = null;
        let messageCount = 0;
        let questionCount = 0;

        // Override: Chatbot 打開
        if (typeof originalOpen === 'function') {
            window.DTZ_CHATBOT.open = function() {
                trackEvent('chatbot_open', {
                    timestamp: new Date().toISOString(),
                    page_title: document.title
                });
                chatbotSessionStart = Date.now();
                messageCount = 0;
                return originalOpen.apply(this, arguments);
            };
        }

        // Override: Chatbot 關閉
        if (typeof originalClose === 'function') {
            window.DTZ_CHATBOT.close = function() {
                const sessionDuration = chatbotSessionStart ? Math.round((Date.now() - chatbotSessionStart) / 1000) : 0;
                trackEvent('chatbot_close', {
                    session_duration_seconds: sessionDuration,
                    message_count: messageCount,
                    page_title: document.title
                });
                chatbotSessionStart = null;
                return originalClose.apply(this, arguments);
            };
        }

        // Override: 用戶發送消息 & 取得回答
        if (typeof originalSendMessage === 'function') {
            window.DTZ_CHATBOT.send = function(message) {
                const sendTimestamp = Date.now();
                questionCount++;
                messageCount++;

                // 追蹤用戶提問
                trackEvent('chatbot_user_message', {
                    question: message.substring(0, 100), // 限制字數用於隱私
                    message_length: message.length,
                    message_count: messageCount,
                    question_number: questionCount,
                    current_mode: window.DTZ_CHATBOT?.getMode?.() || 'unknown'
                });

                // 等待回答並追蹤
                Promise.resolve(originalSendMessage.apply(this, arguments)).then(() => {
                    const responseTime = Math.round((Date.now() - sendTimestamp) / 1000);
                    trackEvent('chatbot_response_received', {
                        response_time_seconds: responseTime,
                        message_number: messageCount,
                        current_mode: window.DTZ_CHATBOT?.getMode?.() || 'unknown'
                    });
                }).catch(() => {
                    trackEvent('chatbot_response_error', {
                        response_time_seconds: Math.round((Date.now() - sendTimestamp) / 1000),
                        message_number: messageCount
                    });
                });

                return originalSendMessage.apply(this, arguments);
            };
        }

        // Override: 清除對話
        if (typeof originalClear === 'function') {
            window.DTZ_CHATBOT.clear = function() {
                trackEvent('chatbot_clear', {
                    message_count_before_clear: messageCount,
                    question_count_before_clear: questionCount
                });
                messageCount = 0;
                questionCount = 0;
                return originalClear.apply(this, arguments);
            };
        }

        // Override: 切換模式
        if (typeof originalSetMode === 'function') {
            window.DTZ_CHATBOT.setMode = function(mode) {
                trackEvent('chatbot_mode_change', {
                    new_mode: mode,
                    previous_mode: window.DTZ_CHATBOT?.getMode?.() || 'unknown',
                    message_count: messageCount
                });
                return originalSetMode.apply(this, arguments);
            };
        }
    }

    // 監聽 DOM 中的 Chatbot 相關互動
    setTimeout(() => {
        const chatbotWidget = document.querySelector('.dt-chatbot');
        if (!chatbotWidget) return;

        // 追蹤建議提問點擊（如果存在）
        const observer = new MutationObserver(() => {
            const suggestedChips = chatbotWidget.querySelectorAll('.dt-chip');
            suggestedChips.forEach(chip => {
                if (!chip.dataset.tracked) {
                    chip.addEventListener('click', () => {
                        trackEvent('chatbot_suggestion_click', {
                            suggestion_text: chip.textContent.substring(0, 100),
                            suggestion_length: chip.textContent.length
                        });
                    });
                    chip.dataset.tracked = 'true';
                }
            });

            // 追蹤 Sources（引用來源）點擊
            const sourceLinks = chatbotWidget.querySelectorAll('.dt-src');
            sourceLinks.forEach(link => {
                if (!link.dataset.tracked) {
                    link.addEventListener('click', () => {
                        trackEvent('chatbot_source_click', {
                            source_label: link.textContent.substring(0, 100),
                            source_url: link.href
                        });
                    });
                    link.dataset.tracked = 'true';
                }
            });

            // 追蹤快速切換模式按鈕
            const modeSelect = chatbotWidget.querySelector('[data-slot="mode"]');
            if (modeSelect && !modeSelect.dataset.tracked) {
                modeSelect.addEventListener('change', () => {
                    trackEvent('chatbot_quick_mode_switch', {
                        selected_mode: modeSelect.value
                    });
                });
                modeSelect.dataset.tracked = 'true';
            }

            // 追蹤清空按鈕
            const clearBtn = chatbotWidget.querySelector('[data-action="clear"]');
            if (clearBtn && !clearBtn.dataset.tracked) {
                clearBtn.addEventListener('click', () => {
                    trackEvent('chatbot_clear_button_click', {});
                });
                clearBtn.dataset.tracked = 'true';
            }

            // 追蹤關閉按鈕
            const closeBtn = chatbotWidget.querySelector('[data-action="close"]');
            if (closeBtn && !closeBtn.dataset.tracked) {
                closeBtn.addEventListener('click', () => {
                    trackEvent('chatbot_close_button_click', {});
                });
                closeBtn.dataset.tracked = 'true';
            }
        });

        observer.observe(chatbotWidget, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 追蹤 Chatbot FAB 按鈕點擊（打開/關閉）
        const fab = chatbotWidget.querySelector('.dt-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                const isOpen = chatbotWidget.querySelector('.dt-panel')?.classList?.contains('open');
                trackEvent('chatbot_fab_click', {
                    action: isOpen ? 'close' : 'open'
                });
            });
        }
    }, 1000); // 延遲以等待 Chatbot 加載完成
}

// 當 DOM 載入完成後初始化所有追蹤
document.addEventListener('DOMContentLoaded', initializeTracking);