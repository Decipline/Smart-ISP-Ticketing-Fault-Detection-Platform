/**
 * Smart ISP Platform - Main Application
 * Security-focused and performance-optimized
 */

(function() {
    'use strict';

    // Application State
    const AppState = {
        isAuthenticated: false,
        currentUser: null,
        token: null,
        currentPage: 'login',
        theme: localStorage.getItem('theme') || 'light'
    };

    // Security Configuration
    const SecurityConfig = {
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        csrfToken: null,
        encryptionKey: null
    };

    // Performance Monitoring
    const PerformanceMonitor = {
        metrics: {},
        startTime: performance.now(),
        
        mark(name) {
            this.metrics[name] = performance.now();
        },
        
        measure(name, startMark, endMark) {
            if (this.metrics[startMark] && this.metrics[endMark]) {
                const duration = this.metrics[endMark] - this.metrics[startMark];
                console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        },
        
        logPageLoad() {
            window.addEventListener('load', () => {
                const pageLoadTime = performance.now() - this.startTime;
                console.log(`[Performance] Page Load Time: ${pageLoadTime.toFixed(2)}ms`);
            });
        }
    };

    // Security Utilities
    const SecurityUtils = {
        // Sanitize HTML to prevent XSS
        sanitizeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        // Validate email format
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        // Validate password strength
        validatePassword(password) {
            const minLength = 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            return {
                isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
                strength: this.calculatePasswordStrength(password)
            };
        },
        
        calculatePasswordStrength(password) {
            let strength = 0;
            if (password.length >= 8) strength += 1;
            if (password.length >= 12) strength += 1;
            if (/[A-Z]/.test(password)) strength += 1;
            if (/[a-z]/.test(password)) strength += 1;
            if (/\d/.test(password)) strength += 1;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
            
            return strength;
        },
        
        // Generate CSRF token
        generateCSRFToken() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },
        
        // Rate limiting
        rateLimiter: {
            attempts: {},
            lastAttempt: {},
            
            isBlocked(identifier) {
                const now = Date.now();
                const attempts = this.attempts[identifier] || 0;
                const lastAttempt = this.lastAttempt[identifier] || 0;
                
                if (attempts >= SecurityConfig.maxLoginAttempts) {
                    const timeSinceLastAttempt = now - lastAttempt;
                    if (timeSinceLastAttempt < SecurityConfig.lockoutDuration) {
                        return true;
                    } else {
                        // Reset after lockout period
                        this.attempts[identifier] = 0;
                    }
                }
                return false;
            },
            
            recordAttempt(identifier) {
                this.attempts[identifier] = (this.attempts[identifier] || 0) + 1;
                this.lastAttempt[identifier] = Date.now();
            },
            
            reset(identifier) {
                delete this.attempts[identifier];
                delete this.lastAttempt[identifier];
            }
        },
        
        // Secure storage
        secureStorage: {
            setItem(key, value, isSensitive = false) {
                if (isSensitive) {
                    // For sensitive data, use session storage (cleared on browser close)
                    sessionStorage.setItem(key, value);
                } else {
                    localStorage.setItem(key, value);
                }
            },
            
            getItem(key) {
                return localStorage.getItem(key) || sessionStorage.getItem(key);
            },
            
            removeItem(key) {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            },
            
            clearSensitive() {
                sessionStorage.clear();
            }
        }
    };

    // Authentication Service
    const AuthService = {
        async login(username, password, rememberMe) {
            // Rate limiting check
            if (SecurityUtils.rateLimiter.isBlocked(username)) {
                throw new Error('Account temporarily locked due to too many failed attempts. Please try again later.');
            }
            
            // Input validation
            if (!username || !password) {
                throw new Error('Username and password are required');
            }
            
            if (username.length < 3 || username.length > 20) {
                throw new Error('Username must be between 3 and 20 characters');
            }
            
            const passwordValidation = SecurityUtils.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers');
            }
            
            try {
                // Simulate API call (replace with actual API endpoint)
                await this.simulateNetworkDelay();
                
                // For demo purposes, accept any valid credentials
                // In production, this would be a real API call
                const userData = {
                    id: 1,
                    username: SecurityUtils.sanitizeHTML(username),
                    role: 'admin',
                    permissions: ['read', 'write', 'delete']
                };
                
                // Generate session token
                const token = SecurityUtils.generateCSRFToken();
                SecurityConfig.csrfToken = token;
                
                // Store session data
                SecurityUtils.secureStorage.setItem('authToken', token, true);
                SecurityUtils.secureStorage.setItem('currentUser', JSON.stringify(userData), rememberMe);
                
                // Reset rate limiter on successful login
                SecurityUtils.rateLimiter.reset(username);
                
                // Update app state
                AppState.isAuthenticated = true;
                AppState.currentUser = userData;
                AppState.token = token;
                
                return { success: true, user: userData };
                
            } catch (error) {
                SecurityUtils.rateLimiter.recordAttempt(username);
                throw error;
            }
        },
        
        logout() {
            // Clear sensitive data
            SecurityUtils.secureStorage.clearSensitive();
            SecurityUtils.secureStorage.removeItem('currentUser');
            
            // Reset app state
            AppState.isAuthenticated = false;
            AppState.currentUser = null;
            AppState.token = null;
            
            // Redirect to login
            window.location.href = 'index.html';
        },
        
        checkSession() {
            const token = SecurityUtils.secureStorage.getItem('authToken');
            const userData = SecurityUtils.secureStorage.getItem('currentUser');
            
            if (token && userData) {
                try {
                    AppState.currentUser = JSON.parse(userData);
                    AppState.token = token;
                    AppState.isAuthenticated = true;
                    return true;
                } catch (e) {
                    console.error('Invalid session data');
                    return false;
                }
            }
            return false;
        },
        
        simulateNetworkDelay() {
            return new Promise(resolve => setTimeout(resolve, 800));
        }
    };

    // UI Controller
    const UIController = {
        init() {
            this.bindEvents();
            this.checkExistingSession();
            this.initTheme();
        },
        
        bindEvents() {
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', this.handleLogin.bind(this));
            }
            
            // Password toggle
            const togglePassword = document.querySelector('.toggle-password');
            if (togglePassword) {
                togglePassword.addEventListener('click', this.togglePasswordVisibility.bind(this));
            }
            
            // Forgot password
            const forgotPassword = document.getElementById('forgot-password');
            if (forgotPassword) {
                forgotPassword.addEventListener('click', this.handleForgotPassword.bind(this));
            }
            
            // Session timeout warning
            this.initSessionTimeout();
        },
        
        async handleLogin(e) {
            e.preventDefault();
            
            const form = e.target;
            const username = form.username.value.trim();
            const password = form.password.value;
            const rememberMe = form['remember-me'].checked;
            const loginBtn = document.getElementById('login-btn');
            const btnText = loginBtn.querySelector('.btn-text');
            const btnLoader = loginBtn.querySelector('.btn-loader');
            
            // Clear previous errors
            this.clearErrors();
            
            // Show loading state
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
            
            try {
                PerformanceMonitor.mark('loginStart');
                
                const result = await AuthService.login(username, password, rememberMe);
                
                PerformanceMonitor.mark('loginEnd');
                PerformanceMonitor.measure('Login Time', 'loginStart', 'loginEnd');
                
                // Hide loading screen
                document.getElementById('loading-screen').classList.add('hidden');
                
                // Load dashboard
                this.loadDashboard();
                
            } catch (error) {
                this.showError(error.message);
                loginBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        },
        
        togglePasswordVisibility(e) {
            const button = e.currentTarget;
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                `;
            } else {
                input.type = 'password';
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                `;
            }
        },
        
        handleForgotPassword(e) {
            e.preventDefault();
            alert('Password reset link will be sent to your registered email address.');
        },
        
        showError(message) {
            const errorElement = document.getElementById('password-error');
            if (errorElement) {
                errorElement.textContent = SecurityUtils.sanitizeHTML(message);
            }
        },
        
        clearErrors() {
            const errorElements = document.querySelectorAll('.error-message');
            errorElements.forEach(el => el.textContent = '');
        },
        
        loadDashboard() {
            // Redirect to dashboard page - use absolute path from root
            window.location.href = '/pages/dashboard.html';
        },
        
        checkExistingSession() {
            if (AuthService.checkSession()) {
                // Redirect to dashboard if session exists - use absolute path from root
                window.location.href = '/pages/dashboard.html';
            } else {
                // Hide loading screen and show login
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                }, 1000);
            }
        },
        
        initSessionTimeout() {
            let timeoutWarning;
            let timeout;
            
            const resetTimeout = () => {
                clearTimeout(timeoutWarning);
                clearTimeout(timeout);
                
                // Show warning 5 minutes before timeout
                timeoutWarning = setTimeout(() => {
                    this.showSessionWarning();
                }, SecurityConfig.sessionTimeout - 5 * 60 * 1000);
                
                // Actual timeout
                timeout = setTimeout(() => {
                    AuthService.logout();
                }, SecurityConfig.sessionTimeout);
            };
            
            // Reset timeout on user activity
            ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetTimeout);
            });
            
            // Initial timeout
            resetTimeout();
        },
        
        showSessionWarning() {
            const warning = confirm('Your session will expire in 5 minutes. Do you want to extend it?');
            if (warning) {
                // Session is extended by activity
            }
        },
        
        initTheme() {
            // Apply saved theme
            if (AppState.theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
    };

    // Initialize application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PerformanceMonitor.mark('appInit');
            UIController.init();
            this.initializeAdvancedSystems();
            PerformanceMonitor.mark('appInitEnd');
            PerformanceMonitor.measure('App Initialization', 'appInit', 'appInitEnd');
            PerformanceMonitor.logPageLoad();
        });
    } else {
        PerformanceMonitor.mark('appInit');
        UIController.init();
        this.initializeAdvancedSystems();
        PerformanceMonitor.mark('appInitEnd');
        PerformanceMonitor.measure('App Initialization', 'appInit', 'appInitEnd');
        PerformanceMonitor.logPageLoad();
    }

    // Initialize advanced automation and compliance systems
    async function initializeAdvancedSystems() {
        console.log('[App] Initializing advanced systems...');

        try {
            // Initialize IndexedDB
            if (window.SmartISPDB) {
                await window.SmartISPDB.init();
                console.log('[App] IndexedDB initialized');
            }

            // Initialize Accessibility Manager
            if (window.SmartISP && window.SmartISP.AccessibilityManager) {
                await window.SmartISP.AccessibilityManager.initialize();
                console.log('[App] Accessibility Manager initialized');
            }

            // Initialize GDPR Compliance System
            if (window.SmartISP && window.SmartISP.GDPRSystem) {
                console.log('[App] GDPR Compliance System initialized');
            }

            // Initialize Audit Logging System
            if (window.SmartISP && window.SmartISP.AuditLoggingSystem) {
                await window.SmartISP.AuditLoggingSystem.initialize();
                console.log('[App] Audit Logging System initialized');
            }

            // Initialize Consent Manager
            if (window.SmartISP && window.SmartISP.ConsentManager) {
                await window.SmartISP.ConsentManager.initialize();
                console.log('[App] Consent Manager initialized');
            }

            // Initialize Automated Monitoring System
            if (window.SmartISP && window.SmartISP.MonitoringSystem) {
                await window.SmartISP.MonitoringSystem.start();
                console.log('[App] Automated Monitoring System started');
            }

            // Initialize Fault Detection System
            if (window.SmartISP && window.SmartISP.FaultDetectionSystem) {
                await window.SmartISP.FaultDetectionSystem.initialize();
                await window.SmartISP.FaultDetectionSystem.start();
                console.log('[App] Fault Detection System started');
            }

            // Initialize Performance Dashboard
            if (window.SmartISP && window.SmartISP.PerformanceDashboard) {
                await window.SmartISP.PerformanceDashboard.initialize();
                console.log('[App] Performance Dashboard initialized');
            }

            // Initialize Automated Reporting System
            if (window.SmartISP && window.SmartISP.AutomatedReportingSystem) {
                await window.SmartISP.AutomatedReportingSystem.initialize();
                console.log('[App] Automated Reporting System initialized');
            }

            console.log('[App] All advanced systems initialized successfully');

        } catch (error) {
            console.error('[App] Error initializing advanced systems:', error);
        }
    }

    // Expose necessary functions to global scope for HTML event handlers
    window.SmartISP = {
        AppState,
        AuthService,
        SecurityUtils,
        UIController,
        PerformanceMonitor,
        initializeAdvancedSystems
    };

})();
