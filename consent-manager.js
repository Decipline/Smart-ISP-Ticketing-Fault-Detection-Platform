/**
 * Smart ISP Platform - Consent Management System
 * GDPR-compliant consent management with granular controls
 */

class ConsentManager {
    constructor() {
        this.consents = new Map();
        this.consentCategories = this.getDefaultConsentCategories();
        this.consentHistory = [];
        this.isInitialized = false;
    }

    /**
     * Get default consent categories
     */
    getDefaultConsentCategories() {
        return {
            essential: {
                required: true,
                description: 'Required for the platform to function',
                purposes: ['authentication', 'security', 'core_functionality'],
                retention: 'session'
            },
            analytics: {
                required: false,
                description: 'Help us improve the platform by analyzing usage',
                purposes: ['performance_monitoring', 'usage_analytics', 'error_tracking'],
                retention: '365 days',
                thirdParty: false
            },
            marketing: {
                required: false,
                description: 'Allow us to show you personalized marketing',
                purposes: ['personalization', 'recommendations', 'promotions'],
                retention: '730 days',
                thirdParty: true
            },
            personalization: {
                required: false,
                description: 'Customize your experience based on preferences',
                purposes: ['ui_customization', 'content_recommendation', 'feature_suggestions'],
                retention: '365 days',
                thirdParty: false
            },
            communications: {
                required: false,
                description: 'Receive updates and notifications about your account',
                purposes: ['transactional_emails', 'product_updates', 'support_communications'],
                retention: '365 days',
                thirdParty: false
            },
            research: {
                required: false,
                description: 'Help us improve our services through research',
                purposes: ['product_improvement', 'user_studies', 'surveys'],
                retention: '1825 days',
                thirdParty: false
            },
            location: {
                required: false,
                description: 'Allow us to use your location for better service',
                purposes: ['service_optimization', 'technician_routing', 'fault_detection'],
                retention: '30 days',
                thirdParty: false
            },
            cookies: {
                required: false,
                description: 'Allow cookies for enhanced functionality',
                purposes: ['session_management', 'preferences', 'analytics'],
                retention: '365 days',
                thirdParty: false
            }
        };
    }

    /**
     * Initialize consent manager
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[Consent Manager] Initializing consent management');

        // Load existing consents
        await this.loadConsents();

        // Show consent banner if needed
        await this.showConsentBannerIfNeeded();

        this.isInitialized = true;
        console.log('[Consent Manager] Initialized successfully');
    }

    /**
     * Load consents from storage
     */
    async loadConsents() {
        if (window.SmartISPDB) {
            const storedConsents = await window.SmartISPDB.getConsents('all');
            storedConsents.forEach(consent => {
                this.consents.set(`${consent.userId}_${consent.type}`, consent);
            });
        }
    }

    /**
     * Show consent banner if needed
     */
    async showConsentBannerIfNeeded() {
        const userId = this.getCurrentUserId();
        const hasAllRequiredConsents = this.hasAllRequiredConsents(userId);

        if (!hasAllRequiredConsents) {
            await this.showConsentBanner();
        }
    }

    /**
     * Check if user has all required consents
     */
    hasAllRequiredConsents(userId) {
        for (const [category, config] of Object.entries(this.consentCategories)) {
            if (config.required) {
                if (!this.hasConsent(userId, category)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Show consent banner
     */
    async showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'consent-banner';
        banner.className = 'consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'consent-banner-title');
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1e293b;
            color: white;
            padding: 2rem;
            z-index: 10000;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            gap: 1rem;
        `;

        banner.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2 id="consent-banner-title" style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">Privacy & Cookie Settings</h2>
                    <p style="margin: 0; color: #94a3b8; font-size: 0.875rem;">We use cookies and similar technologies to enhance your experience. Please review and accept our privacy policy.</p>
                </div>
                <button id="close-consent-banner" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            
            <div id="consent-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                ${this.generateConsentCategoriesHTML()}
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="accept-all-consents" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">Accept All</button>
                <button id="accept-selected-consents" style="background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">Accept Selected</button>
                <button id="reject-all-consents" style="background: #64748b; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">Reject All</button>
            </div>
            
            <div style="font-size: 0.75rem; color: #94a3b8;">
                <a href="#" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a> • 
                <a href="#" style="color: #94a3b8; text-decoration: underline;">Cookie Policy</a> • 
                <a href="#" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
            </div>
        `;

        document.body.appendChild(banner);

        // Setup event listeners
        this.setupConsentBannerListeners(banner);
    }

    /**
     * Generate consent categories HTML
     */
    generateConsentCategoriesHTML() {
        let html = '';

        for (const [category, config] of Object.entries(this.consentCategories)) {
            const isRequired = config.required;
            html += `
                <div class="consent-category" style="background: #334155; padding: 1rem; border-radius: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <input type="checkbox" id="consent-${category}" ${isRequired ? 'checked disabled' : ''} data-category="${category}" ${isRequired ? 'aria-checked="true"' : ''}>
                        <label for="consent-${category}" style="font-weight: 500; cursor: ${isRequired ? 'not-allowed' : 'pointer'}">${this.formatCategoryName(category)}</label>
                        ${isRequired ? '<span style="background: #f59e0b; color: white; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 9999px;">Required</span>' : ''}
                    </div>
                    <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #cbd5e1;">${config.description}</p>
                    <details style="font-size: 0.75rem; color: #94a3b8;">
                        <summary style="cursor: pointer;">View details</summary>
                        <div style="padding-top: 0.5rem;">
                            <p style="margin: 0.25rem 0;"><strong>Purposes:</strong> ${config.purposes.join(', ')}</p>
                            <p style="margin: 0.25rem 0;"><strong>Retention:</strong> ${config.retention}</p>
                            <p style="margin: 0.25rem 0;"><strong>Third Party:</strong> ${config.thirdParty ? 'Yes' : 'No'}</p>
                        </div>
                    </details>
                </div>
            `;
        }

        return html;
    }

    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    /**
     * Setup consent banner event listeners
     */
    setupConsentBannerListeners(banner) {
        // Accept all
        banner.querySelector('#accept-all-consents').addEventListener('click', () => {
            this.acceptAllConsents();
            this.hideConsentBanner();
        });

        // Accept selected
        banner.querySelector('#accept-selected-consents').addEventListener('click', () => {
            this.acceptSelectedConsents();
            this.hideConsentBanner();
        });

        // Reject all
        banner.querySelector('#reject-all-consents').addEventListener('click', () => {
            this.rejectAllConsents();
            this.hideConsentBanner();
        });

        // Close button
        banner.querySelector('#close-consent-banner').addEventListener('click', () => {
            this.hideConsentBanner();
        });

        // Individual checkboxes
        banner.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (!checkbox.disabled) {
                checkbox.addEventListener('change', (e) => {
                    const category = e.target.dataset.category;
                    const granted = e.target.checked;
                    this.updateConsent(category, granted);
                });
            }
        });
    }

    /**
     * Hide consent banner
     */
    hideConsentBanner() {
        const banner = document.getElementById('consent-banner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Accept all consents
     */
    async acceptAllConsents() {
        const userId = this.getCurrentUserId();

        for (const [category, config] of Object.entries(this.consentCategories)) {
            if (!config.required) {
                await this.updateConsent(category, true);
            }
        }

        console.log('[Consent Manager] All consents accepted');
    }

    /**
     * Accept selected consents
     */
    async acceptSelectedConsents() {
        const banner = document.getElementById('consent-banner');
        if (!banner) return;

        const checkboxes = banner.querySelectorAll('input[type="checkbox"]:not(:disabled):checked');
        
        for (const checkbox of checkboxes) {
            const category = checkbox.dataset.category;
            await this.updateConsent(category, true);
        }

        console.log('[Consent Manager] Selected consents accepted');
    }

    /**
     * Reject all non-essential consents
     */
    async rejectAllConsents() {
        const userId = this.getCurrentUserId();

        for (const [category, config] of Object.entries(this.consentCategories)) {
            if (!config.required) {
                await this.updateConsent(category, false);
            }
        }

        console.log('[Consent Manager] All non-essential consents rejected');
    }

    /**
     * Update consent
     */
    async updateConsent(category, granted) {
        const userId = this.getCurrentUserId();
        const consent = {
            id: this.generateId(),
            userId,
            type: category,
            granted,
            timestamp: new Date().toISOString(),
            version: '1.0',
            ipAddress: await this.getIPAddress(),
            userAgent: navigator.userAgent,
            category: this.consentCategories[category]
        };

        this.consents.set(`${userId}_${category}`, consent);
        this.consentHistory.push(consent);

        // Store in IndexedDB
        if (window.SmartISPDB) {
            await window.SmartISPDB.saveConsent(consent);
        }

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'consent_updated',
                entity: category,
                userId,
                details: { granted },
                severity: 'info'
            });
        }

        console.log('[Consent Manager] Consent updated:', category, granted);
        return consent;
    }

    /**
     * Check if user has consent
     */
    hasConsent(userId, category) {
        const consent = this.consents.get(`${userId}_${category}`);
        return consent && consent.granted === true;
    }

    /**
     * Get user consents
     */
    getUserConsents(userId) {
        const userConsents = {};
        
        for (const [category, config] of Object.entries(this.consentCategories)) {
            userConsents[category] = {
                granted: this.hasConsent(userId, category),
                required: config.required,
                description: config.description
            };
        }

        return userConsents;
    }

    /**
     * Revoke consent
     */
  async revokeConsent(category) {
        const userId = this.getCurrentUserId();
        await this.updateConsent(category, false);
    }

    /**
     * Show consent preferences panel
     */
    showConsentPreferences() {
        const userId = this.getCurrentUserId();
        const userConsents = this.getUserConsents(userId);

        const panel = document.createElement('div');
        panel.id = 'consent-preferences-panel';
        panel.className = 'consent-preferences-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'consent-preferences-title');
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            color: #0f172a;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 id="consent-preferences-title" style="margin: 0;">Consent Preferences</h2>
                <button id="close-consent-preferences" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            
            <div id="consent-preferences-categories" style="display: flex; flex-direction: column; gap: 1rem;">
                ${this.generatePreferencesHTML(userConsents)}
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button id="save-consent-preferences" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">Save Changes</button>
                <button id="cancel-consent-preferences" style="background: #64748b; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">Cancel</button>
            </div>
        `;

        document.body.appendChild(panel);
        this.trapFocus(panel);

        // Setup event listeners
        panel.querySelector('#close-consent-preferences').addEventListener('click', () => {
            panel.remove();
        });

        panel.querySelector('#cancel-consent-preferences').addEventListener('click', () => {
            panel.remove();
        });

        panel.querySelector('#save-consent-preferences').addEventListener('click', () => {
            this.savePreferencesFromPanel(panel);
            panel.remove();
        });
    }

    /**
     * Generate preferences HTML
     */
    generatePreferencesHTML(userConsents) {
        let html = '';

        for (const [category, consent] of Object.entries(userConsents)) {
            const categoryConfig = this.consentCategories[category];
            html += `
                <div class="consent-preference-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                    <div>
                        <div style="font-weight: 500;">${this.formatCategoryName(category)}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">${categoryConfig.description}</div>
                    </div>
                    <div>
                        <label class="toggle-switch" style="position: relative; display: inline-block; width: 48px; height: 24px;">
                            <input type="checkbox" data-category="${category}" ${consent.granted ? 'checked' : ''} ${categoryConfig.required ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; transition: 0.3s; border-radius: 24px;"></span>
                            <span class="toggle-slider:before" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;"></span>
                        </label>
                    </div>
                </div>
            `;
        }

        return html;
    }

    /**
     * Save preferences from panel
     */
    async savePreferencesFromPanel(panel) {
        const checkboxes = panel.querySelectorAll('input[type="checkbox"]:not(:disabled)');
        
        for (const checkbox of checkboxes) {
            const category = checkbox.dataset.category;
            const granted = checkbox.checked;
            await this.updateConsent(category, granted);
        }

        console.log('[Consent Manager] Preferences saved');
    }

    /**
     * Get consent history
     */
  getConsentHistory(userId = null) {
        if (userId) {
            return this.consentHistory.filter(c => c.userId === userId);
        }
        return this.consentHistory;
    }

    /**
     * Generate consent report
     */
    generateConsentReport() {
        const totalConsents = this.consents.size;
        const grantedConsents = Array.from(this.consents.values()).filter(c => c.granted).length;
        const byCategory = {};

        this.consents.forEach((consent, key) => {
            const category = consent.type;
            byCategory[category] = byCategory[category] || { granted: 0, revoked: 0 };
            if (consent.granted) {
                byCategory[category].granted++;
            } else {
                byCategory[category].revoked++;
            }
        });

        return {
            generatedAt: new Date().toISOString(),
            totalConsents,
            grantedConsents,
            revokedConsents: totalConsents - grantedConsents,
            grantRate: (grantedConsents / totalConsents * 100).toFixed(2),
            byCategory,
            categories: this.consentCategories,
            history: this.consentHistory
        };
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return window.SmartISP?.AppState?.currentUser?.id || 'anonymous';
    }

    /**
     * Get IP address
     */
    async getIPAddress() {
        return '0.0.0.0';
    }

    /**
     * Generate ID
     */
    generateId() {
        return `CONSENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Trap focus in element
     */
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
    }
}

// Create singleton instance
const consentManager = new ConsentManager();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.ConsentManager = consentManager;
}
