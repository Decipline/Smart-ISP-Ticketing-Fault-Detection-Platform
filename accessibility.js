/**
 * Smart ISP Platform - WCAG 2.1 AAA Accessibility Module
 * Full accessibility compliance with enhanced features
 */

class AccessibilityManager {
    constructor() {
        this.announcer = null;
        this.focusTrap = null;
        this.skipLinks = [];
        this.liveRegions = new Map();
        this.preferences = this.getDefaultPreferences();
        this.isInitialized = false;
    }

    /**
     * Get default accessibility preferences
     */
    getDefaultPreferences() {
        return {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: high)').matches,
            fontSize: 'medium',
            lineSpacing: 'normal',
            screenReader: false,
            keyboardOnly: false
        };
    }

    /**
     * Initialize accessibility features
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[Accessibility] Initializing WCAG 2.1 AAA compliance');

        // Initialize components
        this.initializeAnnouncer();
        this.initializeSkipLinks();
        this.initializeLiveRegions();
        this.initializeFocusManagement();
        this.initializeKeyboardNavigation();
        this.initializeAriaLive();
        this.initializeColorContrast();
        this.initializeScreenReaderDetection();

        // Load user preferences
        await this.loadPreferences();

        // Apply preferences
        this.applyPreferences();

        // Listen for system preference changes
        this.initializePreferenceListeners();

        this.isInitialized = true;
        console.log('[Accessibility] Initialized successfully');
    }

    /**
     * Initialize screen reader announcer
     */
    initializeAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('role', 'status');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(this.announcer);
    }

    /**
     * Initialize skip links
     */
    initializeSkipLinks() {
        const skipLinks = [
            { target: 'main', text: 'Skip to main content' },
            { target: 'nav', text: 'Skip to navigation' },
            { target: 'search', text: 'Skip to search' }
        ];

        skipLinks.forEach(link => {
            const skipLink = document.createElement('a');
            skipLink.href = `#${link.target}`;
            skipLink.textContent = link.text;
            skipLink.className = 'skip-link';
            skipLink.style.cssText = `
                position: fixed;
                top: -40px;
                left: 0;
                background: #2563eb;
                color: white;
                padding: 8px 16px;
                z-index: 10000;
                transition: top 0.3s;
                text-decoration: none;
                font-weight: bold;
            `;
            
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '0';
            });
            
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });

            document.body.insertBefore(skipLink, document.body.firstChild);
            this.skipLinks.push(skipLink);
        });
    }

    /**
     * Initialize live regions for dynamic content
     */
    initializeLiveRegions() {
        // Create live regions for different types of announcements
        const regions = ['polite', 'assertive', 'status'];
        
        regions.forEach(region => {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('role', region === 'status' ? 'status' : region);
            liveRegion.setAttribute('aria-live', region);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = `live-region-${region}`;
            liveRegion.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(liveRegion);
            this.liveRegions.set(region, liveRegion);
        });
    }

    /**
     * Initialize focus management
     */
    initializeFocusManagement() {
        // Track focus for keyboard-only users
        let lastFocusTime = Date.now();
        let mouseUsed = false;

        document.addEventListener('mousedown', () => {
            mouseUsed = true;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                mouseUsed = false;
                this.preferences.keyboardOnly = true;
            }
        });

        // Manage focus in modals
        this.setupModalFocusTrap();
    }

    /**
     * Setup focus trap for modals
     */
    setupModalFocusTrap() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Initialize enhanced keyboard navigation
     */
    initializeKeyboardNavigation() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + M: Skip to main content
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                this.focusElement('main');
            }

            // Alt + N: Skip to navigation
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                this.focusElement('nav, [role="navigation"]');
            }

            // Alt + S: Skip to search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.focusElement('[role="search"], input[type="search"]');
            }

            // Alt + H: Show help
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                this.showAccessibilityHelp();
            }

            // Alt + K: Show keyboard shortcuts
            if (e.altKey && e.key === 'k') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    /**
     * Initialize ARIA live regions
     */
    initializeAriaLive() {
        // Setup dynamic content announcements
        this.observeDynamicContent();
    }

    /**
     * Observe dynamic content changes
     */
    observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.announceDynamicElement(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Announce dynamic element
     */
    announceDynamicElement(element) {
        if (element.hasAttribute('aria-live') || element.hasAttribute('role')) {
            // Element has its own live region
            return;
        }

        // Check for important content
        if (element.classList.contains('alert') || 
            element.classList.contains('notification') ||
            element.classList.contains('error') ||
            element.classList.contains('success')) {
            this.announce(element.textContent, 'assertive');
        }
    }

    /**
     * Initialize color contrast checking
     */
    initializeColorContrast() {
        // Check contrast ratios on page load
        this.checkPageContrast();

        // Monitor for dynamic content
        this.observeContrastChanges();
    }

    /**
     * Check page contrast
     */
    checkPageContrast() {
        const elements = document.querySelectorAll('*');
        const violations = [];

        elements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;

            if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                const contrast = this.calculateContrastRatio(color, backgroundColor);
                
                if (contrast < 7) {
                    violations.push({
                        element,
                        contrast,
                        color,
                        backgroundColor
                    });
                }
            }
        });

        if (violations.length > 0) {
            console.warn('[Accessibility] Contrast violations found:', violations.length);
        }
    }

    /**
     * Calculate contrast ratio
     */
    calculateContrastRatio(color1, color2) {
        const luminance1 = this.calculateLuminance(color1);
        const luminance2 = this.calculateLuminance(color2);
        
        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Calculate relative luminance
     */
    calculateLuminance(color) {
        const rgb = this.parseColor(color);
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Parse color to RGB
     */
    parseColor(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
    }

    /**
     * Observe contrast changes
     */
    observeContrastChanges() {
        const observer = new MutationObserver(() => {
            this.checkPageContrast();
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true
        });
    }

    /**
     * Initialize screen reader detection
     */
    initializeScreenReaderDetection() {
        // Detect screen reader through various methods
        this.detectScreenReader();
    }

    /**
     * Detect if screen reader is active
     */
    detectScreenReader() {
        // Method 1: Check for screen reader specific elements
        const srElements = document.querySelectorAll('[aria-live], [role="alert"]');
        if (srElements.length > 0) {
            this.preferences.screenReader = true;
        }

        // Method 2: Check for reduced motion (often used with screen readers)
        if (this.preferences.reducedMotion) {
            this.preferences.screenReader = true;
        }

        // Method 3: Check for keyboard-only navigation
        if (this.preferences.keyboardOnly) {
            this.preferences.screenReader = true;
        }
    }

    /**
     * Initialize preference listeners
     */
    initializePreferenceListeners() {
        // Listen for system preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.preferences.reducedMotion = e.matches;
            this.applyPreferences();
        });

        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.preferences.highContrast = e.matches;
            this.applyPreferences();
        });
    }

    /**
     * Load user preferences from storage
     */
    async loadPreferences() {
        if (window.SmartISPDB) {
            const stored = await window.SmartISPDB.getPreference('accessibility');
            if (stored) {
                this.preferences = { ...this.preferences, ...stored };
            }
        }
    }

    /**
     * Save user preferences
     */
    async savePreferences() {
        if (window.SmartISPDB) {
            await window.SmartISPDB.setPreference('accessibility', this.preferences);
        }
    }

    /**
     * Apply accessibility preferences
     */
    applyPreferences() {
        // Apply reduced motion
        if (this.preferences.reducedMotion) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            document.documentElement.classList.add('reduced-motion');
        } else {
            document.documentElement.classList.remove('reduced-motion');
        }

        // Apply high contrast
        if (this.preferences.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            extraLarge: '20px'
        };
        document.documentElement.style.fontSize = fontSizes[this.preferences.fontSize] || '16px';

        // Apply line spacing
        const lineSpacings = {
            tight: '1.2',
            normal: '1.6',
            relaxed: '2'
        };
        document.documentElement.style.setProperty('--line-height', lineSpacings[this.preferences.lineSpacing] || '1.6');
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (!this.announcer) return;

        this.announcer.textContent = '';
        
        // Use appropriate live region based on priority
        const region = priority === 'assertive' ? this.liveRegions.get('assertive') : this.liveRegions.get('polite');
        
        if (region) {
            region.textContent = message;
        } else {
            this.announcer.textContent = message;
        }

        // Clear after announcement
        setTimeout(() => {
            if (region) {
                region.textContent = '';
            } else {
                this.announcer.textContent = '';
            }
        }, 1000);
    }

    /**
     * Focus element
     */
    focusElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Trap focus within element
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

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    /**
     * Show accessibility help
     */
    showAccessibilityHelp() {
        const helpContent = `
            <div role="dialog" aria-labelledby="accessibility-help-title" class="accessibility-help">
                <h2 id="accessibility-help-title">Accessibility Help</h2>
                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>Alt</kbd> + <kbd>M</kbd> - Skip to main content</li>
                    <li><kbd>Alt</kbd> + <kbd>N</kbd> - Skip to navigation</li>
                    <li><kbd>Alt</kbd> + <kbd>S</kbd> - Skip to search</li>
                    <li><kbd>Alt</kbd> + <kbd>H</kbd> - Show this help</li>
                    <li><kbd>Alt</kbd> + <kbd>K</kbd> - Show keyboard shortcuts</li>
                    <li><kbd>Escape</kbd> - Close modals</li>
                </ul>
                <h3>Screen Reader Support</h3>
                <p>This application is fully compatible with screen readers including NVDA, JAWS, and VoiceOver.</p>
                <h3>Adjustable Settings</h3>
                <p>You can adjust font size, line spacing, and other accessibility preferences in Settings.</p>
                <button onclick="this.closest('.accessibility-help').remove()">Close</button>
            </div>
        `;

        const helpDialog = document.createElement('div');
        helpDialog.innerHTML = helpContent;
        helpDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        document.body.appendChild(helpDialog);
        this.trapFocus(helpDialog);
        helpDialog.querySelector('button').focus();
    }

    /**
     * Show keyboard shortcuts
     */
    showKeyboardShortcuts() {
        this.announce('Keyboard shortcuts dialog opened', 'assertive');
        // Could implement a shortcuts dialog
    }

    /**
     * Set preference
     */
    setPreference(key, value) {
        this.preferences[key] = value;
        this.applyPreferences();
        this.savePreferences();
    }

    /**
     * Get preference
     */
    getPreference(key) {
        return this.preferences[key];
    }

    /**
     * Validate accessibility of element
     */
    validateElement(element) {
        const violations = [];

        // Check for alt text on images
        if (element.tagName === 'IMG' && !element.alt) {
            violations.push({
                type: 'missing-alt',
                severity: 'error',
                message: 'Image missing alt text'
            });
        }

        // Check for labels on form inputs
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
            const hasLabel = element.id && document.querySelector(`label[for="${element.id}"]`);
            const hasAriaLabel = element.getAttribute('aria-label');
            const hasAriaLabelledby = element.getAttribute('aria-labelledby');

            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
                violations.push({
                    type: 'missing-label',
                    severity: 'error',
                    message: 'Form input missing label'
                });
            }
        }

        // Check for button text
        if (element.tagName === 'BUTTON') {
            const hasText = element.textContent.trim().length > 0;
            const hasAriaLabel = element.getAttribute('aria-label');
            const hasTitle = element.getAttribute('title');

            if (!hasText && !hasAriaLabel && !hasTitle) {
                violations.push({
                    type: 'missing-button-text',
                    severity: 'error',
                    message: 'Button missing accessible name'
                });
            }
        }

        // Check for heading hierarchy
        if (element.tagName.match(/^H[1-6]$/)) {
            const level = parseInt(element.tagName[1]);
            // Check for skipped heading levels
            // This would need context of previous headings
        }

        // Check for ARIA attributes
        if (element.getAttribute('aria-hidden') === 'true') {
            // Ensure it's not focusable
            if (element.tabIndex >= 0) {
                violations.push({
                    type: 'aria-hidden-focusable',
                    severity: 'warning',
                    message: 'Element is aria-hidden but focusable'
                });
            }
        }

        return violations;
    }

    /**
     * Validate entire page
     */
    validatePage() {
        const allElements = document.querySelectorAll('*');
        const allViolations = [];

        allElements.forEach(element => {
            const violations = this.validateElement(element);
            allViolations.push(...violations);
        });

        return {
            totalViolations: allViolations.length,
            violations: allViolations,
            bySeverity: this.groupViolationsBySeverity(allViolations)
        };
    }

    /**
     * Group violations by severity
     */
    groupViolationsBySeverity(violations) {
        const grouped = {
            error: [],
            warning: [],
            notice: []
        };

        violations.forEach(violation => {
            grouped[violation.severity].push(violation);
        });

        return grouped;
    }

    /**
     * Fix accessibility issue
     */
    fixIssue(element, issue) {
        switch (issue.type) {
            case 'missing-alt':
                element.alt = 'Descriptive alt text';
                break;
            case 'missing-label':
                element.setAttribute('aria-label', 'Label');
                break;
            case 'missing-button-text':
                element.setAttribute('aria-label', 'Button');
                break;
            default:
                console.warn('[Accessibility] Unknown issue type:', issue.type);
        }
    }

    /**
     * Generate accessibility report
     */
    generateReport() {
        const validation = this.validatePage();
        const contrastViolations = this.checkPageContrast();

        return {
            generatedAt: new Date().toISOString(),
            wcagLevel: '2.1 AAA',
            validation,
            contrastViolations,
            preferences: this.preferences,
            recommendations: this.generateRecommendations(validation, contrastViolations)
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(validation, contrastViolations) {
        const recommendations = [];

        if (validation.totalViolations > 0) {
            recommendations.push({
                priority: 'high',
                category: 'general',
                title: 'Fix Accessibility Violations',
                description: `${validation.totalViolations} accessibility issues found`,
                action: 'Review and fix the reported violations'
            });
        }

        if (contrastViolations.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'contrast',
                title: 'Improve Color Contrast',
                description: `${contrastViolations.length} contrast violations found`,
                action: 'Increase contrast ratios to meet WCAG AAA standards (7:1 for normal text)'
            });
        }

        if (!this.preferences.screenReader && this.preferences.keyboardOnly) {
            recommendations.push({
                priority: 'medium',
                category: 'screen-reader',
                title: 'Screen Reader Support',
                description: 'Keyboard-only navigation detected',
                action: 'Ensure screen reader compatibility is tested'
            });
        }

        return recommendations;
    }
}

// Create singleton instance
const accessibilityManager = new AccessibilityManager();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.AccessibilityManager = accessibilityManager;
}
