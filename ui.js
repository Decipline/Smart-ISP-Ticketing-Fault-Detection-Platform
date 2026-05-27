/**
 * Smart ISP Platform - UI Module
 * Performance-optimized UI interactions with accessibility support
 */

(function() {
    'use strict';

    // UI State
    const UIState = {
        sidebarOpen: false,
        notifications: [],
        currentTheme: localStorage.getItem('theme') || 'light',
        modals: {}
    };

    // Performance-optimized UI Controller
    const UIController = {
        init() {
            this.initSidebar();
            this.initNotifications();
            this.initModals();
            this.initTooltips();
            this.initDropdowns();
            this.initTheme();
            this.initKeyboardNavigation();
            this.initFocusManagement();
        },

        // Sidebar functionality
        initSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');

            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    this.toggleSidebar();
                });
            }

            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', () => {
                    this.closeSidebar();
                });
            }

            // Close sidebar on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && UIState.sidebarOpen) {
                    this.closeSidebar();
                }
            });
        },

        toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');

            if (!sidebar) return;

            UIState.sidebarOpen = !UIState.sidebarOpen;
            sidebar.classList.toggle('open', UIState.sidebarOpen);

            if (overlay) {
                overlay.classList.toggle('active', UIState.sidebarOpen);
            }

            // Focus management
            if (UIState.sidebarOpen) {
                this.trapFocus(sidebar);
            }
        },

        closeSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');

            if (sidebar) {
                sidebar.classList.remove('open');
            }

            if (overlay) {
                overlay.classList.remove('active');
            }

            UIState.sidebarOpen = false;
        },

        // Notification system
        initNotifications() {
            const notificationBtn = document.querySelector('.notification-btn');
            const notificationPanel = document.querySelector('.notification-panel');

            if (notificationBtn) {
                notificationBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleNotifications();
                });
            }

            // Close notifications when clicking outside
            document.addEventListener('click', (e) => {
                if (notificationPanel && !notificationPanel.contains(e.target) && !notificationBtn?.contains(e.target)) {
                    this.closeNotifications();
                }
            });
        },

        toggleNotifications() {
            const panel = document.querySelector('.notification-panel');
            if (!panel) return;

            const isOpen = panel.style.display === 'block';
            panel.style.display = isOpen ? 'none' : 'block';

            if (!isOpen) {
                this.loadNotifications();
            }
        },

        closeNotifications() {
            const panel = document.querySelector('.notification-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        },

        loadNotifications() {
            const list = document.querySelector('.notification-list');
            if (!list) return;

            // Sample notifications
            const notifications = [
                {
                    id: 1,
                    message: 'New ticket TKT-824733 created',
                    time: '2 minutes ago',
                    unread: true
                },
                {
                    id: 2,
                    message: 'OLT-001 status changed to warning',
                    time: '15 minutes ago',
                    unread: true
                },
                {
                    id: 3,
                    message: 'Technician TECH-001 assigned to ticket',
                    time: '1 hour ago',
                    unread: false
                }
            ];

            list.innerHTML = notifications.map(n => `
                <div class="notification-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notification-content">${this.escapeHtml(n.message)}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `).join('');
        },

        showNotification(message, type = 'info', duration = 3000) {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type}`;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');
            notification.textContent = message;
            
            notification.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                min-width: 300px;
                animation: slideInRight 0.3s ease;
            `;

            document.body.appendChild(notification);

            // Auto-remove after duration
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, duration);

            // Focus for screen readers
            notification.focus();
        },

        // Modal system
        initModals() {
            document.querySelectorAll('[data-modal]').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modalId = trigger.dataset.modal;
                    this.openModal(modalId);
                });
            });

            document.querySelectorAll('[data-close-modal]').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modalId = trigger.dataset.closeModal;
                    this.closeModal(modalId);
                });
            });

            // Close modal on backdrop click
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        const modal = backdrop.querySelector('.modal');
                        if (modal) {
                            this.closeModal(modal.id);
                        }
                    }
                });
            });

            // Close modal on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    Object.keys(UIState.modals).forEach(modalId => {
                        if (UIState.modals[modalId]) {
                            this.closeModal(modalId);
                        }
                    });
                }
            });
        },

        openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const backdrop = modal.parentElement;
            if (backdrop.classList.contains('modal-backdrop')) {
                backdrop.style.display = 'flex';
            }

            modal.style.display = 'block';
            UIState.modals[modalId] = true;

            // Focus management
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Trap focus
            this.trapFocus(modal);

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        },

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const backdrop = modal.parentElement;
            if (backdrop.classList.contains('modal-backdrop')) {
                backdrop.style.display = 'none';
            }

            modal.style.display = 'none';
            delete UIState.modals[modalId];

            // Restore body scroll
            document.body.style.overflow = '';
        },

        // Tooltip system
        initTooltips() {
            document.querySelectorAll('[data-tooltip]').forEach(element => {
                element.addEventListener('mouseenter', (e) => {
                    this.showTooltip(e.target, element.dataset.tooltip);
                });

                element.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });

                // Keyboard support
                element.addEventListener('focus', (e) => {
                    this.showTooltip(e.target, element.dataset.tooltip);
                });

                element.addEventListener('blur', () => {
                    this.hideTooltip();
                });
            });
        },

        showTooltip(element, text) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            tooltip.setAttribute('role', 'tooltip');
            tooltip.id = 'tooltip-' + Date.now();

            const rect = element.getBoundingClientRect();
            tooltip.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 8}px;
                left: ${rect.left + rect.width / 2}px;
                transform: translateX(-50%);
                background: #1e293b;
                color: white;
                padding: 0.5rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                z-index: 10001;
                white-space: nowrap;
                animation: fadeIn 0.2s ease;
            `;

            document.body.appendChild(tooltip);
            element.setAttribute('aria-describedby', tooltip.id);
        },

        hideTooltip() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }

            document.querySelectorAll('[aria-describedby]').forEach(el => {
                el.removeAttribute('aria-describedby');
            });
        },

        // Dropdown system
        initDropdowns() {
            document.querySelectorAll('[data-dropdown]').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdownId = trigger.dataset.dropdown;
                    this.toggleDropdown(dropdownId);
                });
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', () => {
                this.closeAllDropdowns();
            });
        },

        toggleDropdown(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;

            const isOpen = dropdown.style.display === 'block';
            this.closeAllDropdowns();
            dropdown.style.display = isOpen ? 'none' : 'block';
        },

        closeAllDropdowns() {
            document.querySelectorAll('[data-dropdown]').forEach(trigger => {
                const dropdownId = trigger.dataset.dropdown;
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            });
        },

        // Theme management
        initTheme() {
            const themeToggle = document.querySelector('[data-theme-toggle]');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }

            // Apply saved theme
            this.applyTheme(UIState.currentTheme);
        },

        toggleTheme() {
            UIState.currentTheme = UIState.currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', UIState.currentTheme);
            this.applyTheme(UIState.currentTheme);
        },

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            
            const themeToggle = document.querySelector('[data-theme-toggle]');
            if (themeToggle) {
                themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
            }
        },

        // Keyboard navigation
        initKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                // Skip to main content (Alt + M)
                if (e.altKey && e.key === 'm') {
                    e.preventDefault();
                    const mainContent = document.querySelector('main') || document.querySelector('.main-content');
                    if (mainContent) {
                        mainContent.focus();
                        mainContent.scrollIntoView({ behavior: 'smooth' });
                    }
                }

                // Skip to navigation (Alt + N)
                if (e.altKey && e.key === 'n') {
                    e.preventDefault();
                    const nav = document.querySelector('nav') || document.querySelector('.sidebar');
                    if (nav) {
                        nav.focus();
                        nav.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        },

        // Focus management for accessibility
        trapFocus(element) {
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                }
            });
        },

        initFocusManagement() {
            // Manage focus when dynamic content is loaded
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                if (node.hasAttribute('autofocus')) {
                                    node.focus();
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        // Utility functions
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Loading states
        showLoading(element) {
            if (!element) return;
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/>
                </svg>
                Loading...
            `;
        },

        hideLoading(element) {
            if (!element) return;
            element.disabled = false;
            element.textContent = element.dataset.originalText || 'Submit';
        },

        // Confirm dialog
        confirm(message, callback) {
            const confirmed = window.confirm(message);
            if (confirmed && callback) {
                callback();
            }
        },

        // Smooth scroll
        scrollTo(element, offset = 0) {
            const target = typeof element === 'string' 
                ? document.querySelector(element) 
                : element;
            
            if (!target) return;

            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UIController.init();
        });
    } else {
        UIController.init();
    }

    // Expose to global scope
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.UIController = UIController;

})();
