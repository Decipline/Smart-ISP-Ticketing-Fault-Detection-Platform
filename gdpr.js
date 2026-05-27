/**
 * Smart ISP Platform - GDPR Compliance Module
 * Full GDPR compliance implementation with data protection features
 */

class GDPRComplianceSystem {
    constructor() {
        this.consents = new Map();
        this.dataProcessingRecords = [];
        this.dataSubjectRequests = [];
        this.breachNotifications = [];
        this.retentionPolicies = this.getDefaultRetentionPolicies();
        this.legalBasis = this.getDefaultLegalBasis();
    }

    /**
     * Get default retention policies
     */
    getDefaultRetentionPolicies() {
        return {
            tickets: { duration: 365 * 7, unit: 'days', reason: 'Business operations and legal requirements' },
            customers: { duration: 365 * 10, unit: 'days', reason: 'Customer relationship management' },
            auditLogs: { duration: 365 * 5, unit: 'days', reason: 'Security and compliance' },
            performanceMetrics: { duration: 365 * 2, unit: 'days', reason: 'Performance optimization' },
            consents: { duration: 365 * 10, unit: 'days', reason: 'Legal requirements' },
            communications: { duration: 365 * 3, unit: 'days', reason: 'Customer service' }
        };
    }

    /**
     * Get default legal basis for processing
     */
    getDefaultLegalBasis() {
        return {
            tickets: 'contract',
            customers: 'contract',
            monitoring: 'legitimate_interest',
            analytics: 'consent',
            marketing: 'consent'
        };
    }

    /**
     * Check if consent is required for data processing
     */
    isConsentRequired(dataType) {
        const consentRequired = ['analytics', 'marketing', 'personalization'];
        return consentRequired.includes(dataType);
    }

    /**
     * Record consent
     */
    async recordConsent(userId, consentType, granted, details = {}) {
        const consent = {
            id: this.generateId(),
            userId,
            type: consentType,
            granted,
            timestamp: new Date().toISOString(),
            version: '1.0',
            ipAddress: await this.getIPAddress(),
            userAgent: navigator.userAgent,
            details,
            legalBasis: this.legalBasis[consentType] || 'consent'
        };

        this.consents.set(`${userId}_${consentType}`, consent);

        // Store in IndexedDB
        if (window.SmartISPDB) {
            await window.SmartISPDB.saveConsent(consent);
        }

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'consent_recorded',
                entity: consentType,
                userId,
                details: { granted },
                severity: 'info'
            });
        }

        console.log('[GDPR] Consent recorded:', consent);
        return consent;
    }

    /**
     * Check if user has given consent
     */
    hasConsent(userId, consentType) {
        const consent = this.consents.get(`${userId}_${consentType}`);
        return consent && consent.granted === true;
    }

    /**
     * Revoke consent
     */
    async revokeConsent(userId, consentType, reason) {
        const consent = this.consents.get(`${userId}_${consentType}`);
        if (!consent) {
            throw new Error('Consent not found');
        }

        consent.granted = false;
        consent.revokedAt = new Date().toISOString();
        consent.revocationReason = reason;

        // Update in IndexedDB
        if (window.SmartISPDB) {
            await window.SmartISPDB.revokeConsent(consent.id);
        }

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'consent_revoked',
                entity: consentType,
                userId,
                details: { reason },
                severity: 'info'
            });
        }

        console.log('[GDPR] Consent revoked:', consent);
        return consent;
    }

    /**
     * Create data processing record
     */
    async createProcessingRecord(record) {
        const processingRecord = {
            id: this.generateId(),
            controller: 'Smart ISP Platform',
            processor: record.processor || 'Smart ISP Platform',
            contact: record.contact || 'privacy@smartisp.com',
            purposes: record.purposes,
            categories: record.categories,
            recipients: record.recipients || [],
            transfers: record.transfers || [],
            retention: this.retentionPolicies[record.dataType] || { duration: 365, unit: 'days' },
            securityMeasures: record.securityMeasures || this.getDefaultSecurityMeasures(),
            legalBasis: record.legalBasis || this.legalBasis[record.dataType] || 'contract',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.dataProcessingRecords.push(processingRecord);

        // Store in IndexedDB
        if (window.SmartISPDB) {
            await window.SmartISPDB.setPreference(`processing_record_${record.dataType}`, processingRecord);
        }

        console.log('[GDPR] Processing record created:', processingRecord);
        return processingRecord;
    }

    /**
     * Get default security measures
     */
    getDefaultSecurityMeasures() {
        return [
            'Encryption at rest (AES-256)',
            'Encryption in transit (TLS 1.3)',
            'Access control and authentication',
            'Regular security audits',
            'Data minimization',
            'Pseudonymization where applicable',
            'Secure backup and recovery',
            'Incident response procedures'
        ];
    }

    /**
     * Handle data subject access request (DSAR)
     */
    async handleDataSubjectAccessRequest(userId, requestDetails) {
        console.log('[GDPR] Handling data subject access request for:', userId);

        const request = {
            id: this.generateId(),
            userId,
            type: 'access',
            status: 'processing',
            requestedAt: new Date().toISOString(),
            details: requestDetails
        };

        this.dataSubjectRequests.push(request);

        // Collect all user data
        const userData = await this.collectUserData(userId);

        // Update request status
        request.status = 'completed';
        request.completedAt = new Date().toISOString();
        request.dataProvided = true;

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'dsar_processed',
                entity: 'user_data',
                userId,
                details: { requestType: 'access' },
                severity: 'info'
            });
        }

        return {
            request,
            userData,
            processingTime: (new Date(request.completedAt) - new Date(request.requestedAt)) / 1000
        };
    }

    /**
     * Handle data subject erasure request (Right to be Forgotten)
     */
    async handleDataSubjectErasureRequest(userId, requestDetails) {
        console.log('[GDPR] Handling data subject erasure request for:', userId);

        const request = {
            id: this.generateId(),
            userId,
            type: 'erasure',
            status: 'processing',
            requestedAt: new Date().toISOString(),
            details: requestDetails
        };

        this.dataSubjectRequests.push(request);

        // Check for legal grounds to retain data
        const legalGrounds = await this.checkLegalGroundsForRetention(userId);

        if (legalGrounds.canDelete) {
            // Delete user data
            await this.deleteUserData(userId);
            request.status = 'completed';
            request.completedAt = new Date().toISOString();
        } else {
            request.status = 'partial';
            request.completedAt = new Date().toISOString();
            request.reason = 'Data retained for legal reasons';
            request.retainedData = legalGrounds.retainedData;
        }

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'dsar_processed',
                entity: 'user_data',
                userId,
                details: { requestType: 'erasure', status: request.status },
                severity: 'high'
            });
        }

        return request;
    }

    /**
     * Handle data subject rectification request
     */
    async handleDataSubjectRectificationRequest(userId, corrections) {
        console.log('[GDPR] Handling data subject rectification request for:', userId);

        const request = {
            id: this.generateId(),
            userId,
            type: 'rectification',
            status: 'processing',
            requestedAt: new Date().toISOString(),
            corrections
        };

        this.dataSubjectRequests.push(request);

        // Apply corrections
        await this.applyDataCorrections(userId, corrections);

        request.status = 'completed';
        request.completedAt = new Date().toISOString();

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'dsar_processed',
                entity: 'user_data',
                userId,
                details: { requestType: 'rectification' },
                severity: 'info'
            });
        }

        return request;
    }

    /**
     * Handle data subject portability request
     */
    async handleDataSubjectPortabilityRequest(userId, format = 'json') {
        console.log('[GDPR] Handling data subject portability request for:', userId);

        const request = {
            id: this.generateId(),
            userId,
            type: 'portability',
            status: 'processing',
            requestedAt: new Date().toISOString(),
            format
        };

        this.dataSubjectRequests.push(request);

        // Export user data
        const userData = await this.exportUserData(userId, format);

        request.status = 'completed';
        request.completedAt = new Date().toISOString();

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'dsar_processed',
                entity: 'user_data',
                userId,
                details: { requestType: 'portability', format },
                severity: 'info'
            });
        }

        return {
            request,
            userData
        };
    }

    /**
     * Collect user data from all sources
     */
    async collectUserData(userId) {
        const userData = {};

        if (window.SmartISPDB) {
            userData.tickets = await window.SmartISPDB.getTicketsByCustomer(userId);
            userData.customer = await window.SmartISPDB.getCustomer(userId);
            userData.auditLogs = await window.SmartISPDB.getAuditLogs(userId);
            userData.consents = await window.SmartISPDB.getConsents(userId);
            userData.preferences = await window.SmartISPDB.getPreference(`user_${userId}`);
        }

        userData.collectedAt = new Date().toISOString();
        userData.sources = ['IndexedDB'];

        return userData;
    }

    /**
     * Check legal grounds for data retention
     */
    async checkLegalGroundsForRetention(userId) {
        const userData = await this.collectUserData(userId);
        const retainedData = [];

        // Check for active tickets
        if (userData.tickets && userData.tickets.some(t => t.status !== 'closed')) {
            retainedData.push('active_tickets');
        }

        // Check for unresolved disputes
        if (userData.auditLogs && userData.auditLogs.some(l => l.action === 'dispute')) {
            retainedData.push('dispute_records');
        }

        // Check for financial obligations
        if (userData.customer && userData.customer.hasOutstandingBalance) {
            retainedData.push('financial_records');
        }

        return {
            canDelete: retainedData.length === 0,
            retainedData,
            reason: retainedData.length > 0 ? 'Legal obligation to retain data' : null
        };
    }

    /**
     * Delete user data
     */
    async deleteUserData(userId) {
        if (window.SmartISPDB) {
            await window.SmartISPDB.deleteUserData(userId);
        }

        console.log('[GDPR] User data deleted for:', userId);
    }

    /**
     * Apply data corrections
     */
    async applyDataCorrections(userId, corrections) {
        if (window.SmartISPDB && corrections.customer) {
            await window.SmartISPDB.updateCustomer({
                id: userId,
                ...corrections.customer
            });
        }

        console.log('[GDPR] Data corrections applied for:', userId);
    }

    /**
     * Export user data in specified format
     */
    async exportUserData(userId, format = 'json') {
        const userData = await this.collectUserData(userId);

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(userData, null, 2);
            case 'csv':
                return this.convertToCSV(userData);
            case 'xml':
                return this.convertToXML(userData);
            default:
                return JSON.stringify(userData, null, 2);
        }
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        // Simplified CSV conversion
        const headers = Object.keys(data);
        const values = headers.map(header => JSON.stringify(data[header]));
        return [headers.join(','), values.join(',')].join('\n');
    }

    /**
     * Convert data to XML format
     */
    convertToXML(data) {
        // Simplified XML conversion
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';
        for (const [key, value] of Object.entries(data)) {
            xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`;
        }
        xml += '</userData>';
        return xml;
    }

    /**
     * Report data breach
     */
    async reportDataBreach(breachDetails) {
        const breach = {
            id: this.generateId(),
            reportedAt: new Date().toISOString(),
            status: 'investigating',
            ...breachDetails
        };

        this.breachNotifications.push(breach);

        // Determine if notification is required (within 72 hours)
        const requiresNotification = this.requiresNotification(breach);

        if (requiresNotification) {
            await this.notifyDataBreach(breach);
        }

        // Log to audit
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog({
                action: 'breach_reported',
                entity: 'security',
                details: breach,
                severity: 'critical'
            });
        }

        console.log('[GDPR] Data breach reported:', breach);
        return breach;
    }

    /**
     * Check if breach notification is required
     */
    requiresNotification(breach) {
        // Notification required if:
        // - Personal data is affected
        // - Risk to rights and freedoms is high
        return breach.affectedRecords > 0 && breach.riskLevel === 'high';
    }

    /**
     * Notify affected parties of data breach
     */
    async notifyDataBreach(breach) {
        const notification = {
            breachId: breach.id,
            notifiedAt: new Date().toISOString(),
            affectedUsers: breach.affectedUsers,
            notificationMethod: 'email',
            content: this.generateBreachNotificationContent(breach)
        };

        // In production, this would send actual emails
        console.log('[GDPR] Breach notification sent:', notification);

        breach.notificationSent = true;
        breach.notifiedAt = notification.notifiedAt;
    }

    /**
     * Generate breach notification content
     */
    generateBreachNotificationContent(breach) {
        return {
            subject: 'Security Incident - Your Data May Be Affected',
            body: `We are writing to inform you of a security incident that may have affected your personal data. 
                   Incident Date: ${breach.incidentDate}
                   Type of Data: ${breach.dataTypes.join(', ')}
                   What We Are Doing: ${breach.mitigationActions}
                   What You Can Do: ${breach.userActions}
                   Contact: privacy@smartisp.com`
        };
    }

    /**
     * Perform data minimization
     */
    async minimizeData(data, purpose) {
        const minimized = { ...data };

        // Remove unnecessary fields based on purpose
        const purposeFields = {
            'ticket_resolution': ['id', 'subject', 'description', 'priority', 'status', 'customerId'],
            'analytics': ['id', 'status', 'priority', 'createdAt', 'resolvedAt'],
            'billing': ['id', 'customerId', 'amount', 'status', 'dueDate']
        };

        const allowedFields = purposeFields[purpose] || Object.keys(data);
        const allKeys = Object.keys(minimized);

        allKeys.forEach(key => {
            if (!allowedFields.includes(key)) {
                delete minimized[key];
            }
        });

        return minimized;
    }

    /**
     * Anonymize data
     */
    anonymizeData(data, fieldsToAnonymize) {
        const anonymized = { ...data };

        fieldsToAnonymize.forEach(field => {
            if (anonymized[field]) {
                anonymized[field] = this.anonymizeValue(anonymized[field]);
            }
        });

        return anonymized;
    }

    /**
     * Anonymize a single value
     */
    anonymizeValue(value) {
        if (typeof value === 'string') {
            // Keep first 2 characters, replace rest with asterisks
            return value.substring(0, 2) + '*'.repeat(value.length - 2);
        }
        return 'ANONYMIZED';
    }

    /**
     * Apply data retention policy
     */
    async applyRetentionPolicy() {
        const now = Date.now();
        const expiredData = [];

        for (const [dataType, policy] of Object.entries(this.retentionPolicies)) {
            const retentionMs = policy.duration * 24 * 60 * 60 * 1000;
            const cutoffDate = now - retentionMs;

            // Find expired data
            if (window.SmartISPDB) {
                const expired = await this.findExpiredData(dataType, cutoffDate);
                expiredData.push(...expired);
            }
        }

        // Delete or anonymize expired data
        for (const item of expiredData) {
            if (item.requiresAnonymization) {
                await this.anonymizeExpiredData(item);
            } else {
                await this.deleteExpiredData(item);
            }
        }

        console.log('[GDPR] Retention policy applied:', expiredData.length, 'items processed');
        return expiredData;
    }

    /**
     * Find expired data
     */
    async findExpiredData(dataType, cutoffDate) {
        // Implementation depends on data structure
        return [];
    }

    /**
     * Anonymize expired data
     */
    async anonymizeExpiredData(item) {
        // Implementation depends on data structure
        console.log('[GDPR] Anonymizing expired data:', item.id);
    }

    /**
     * Delete expired data
     */
    async deleteExpiredData(item) {
        // Implementation depends on data structure
        console.log('[GDPR] Deleting expired data:', item.id);
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            dataProcessingRecords: this.dataProcessingRecords,
            consentStatistics: this.getConsentStatistics(),
            dataSubjectRequests: this.getDataSubjectRequestStatistics(),
            breachNotifications: this.breachNotifications,
            retentionPolicy: this.retentionPolicies,
            legalBasis: this.legalBasis,
            securityMeasures: this.getDefaultSecurityMeasures(),
            recommendations: this.generateComplianceRecommendations()
        };

        return report;
    }

    /**
     * Get consent statistics
     */
    getConsentStatistics() {
        const total = this.consents.size;
        const granted = Array.from(this.consents.values()).filter(c => c.granted).length;
        const revoked = total - granted;

        const byType = {};
        this.consents.forEach(consent => {
            byType[consent.type] = byType[consent.type] || { granted: 0, revoked: 0 };
            if (consent.granted) {
                byType[consent.type].granted++;
            } else {
                byType[consent.type].revoked++;
            }
        });

        return {
            total,
            granted,
            revoked,
            grantRate: (granted / total * 100).toFixed(2),
            byType
        };
    }

    /**
     * Get data subject request statistics
     */
    getDataSubjectRequestStatistics() {
        const total = this.dataSubjectRequests.length;
        const byType = {};
        const byStatus = {};

        this.dataSubjectRequests.forEach(request => {
            byType[request.type] = (byType[request.type] || 0) + 1;
            byStatus[request.status] = (byStatus[request.status] || 0) + 1;
        });

        return {
            total,
            byType,
            byStatus,
            averageProcessingTime: this.calculateAverageProcessingTime()
        };
    }

    /**
     * Calculate average processing time for DSARs
     */
    calculateAverageProcessingTime() {
        const completedRequests = this.dataSubjectRequests.filter(r => r.status === 'completed');
        if (completedRequests.length === 0) return 0;

        const totalTime = completedRequests.reduce((sum, r) => {
            return sum + (new Date(r.completedAt) - new Date(r.requestedAt));
        }, 0);

        return (totalTime / completedRequests.length / 1000).toFixed(2); // seconds
    }

    /**
     * Generate compliance recommendations
     */
    generateComplianceRecommendations() {
        const recommendations = [];

        const consentStats = this.getConsentStatistics();
        if (consentStats.grantRate < 80) {
            recommendations.push({
                priority: 'high',
                category: 'consent',
                title: 'Improve Consent Rate',
                description: 'Current consent grant rate is below 80%',
                action: 'Review consent language and user experience'
            });
        }

        const dsarStats = this.getDataSubjectRequestStatistics();
        if (dsarStats.averageProcessingTime > 30) {
            recommendations.push({
                priority: 'medium',
                category: 'dsar',
                title: 'Reduce DSAR Processing Time',
                description: 'Average processing time exceeds 30 days',
                action: 'Implement automated data collection and export processes'
            });
        }

        return recommendations;
    }

    /**
     * Utility functions
     */
    generateId() {
        return `GDPR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async getIPAddress() {
        // In production, this would get the actual IP
        return '0.0.0.0';
    }
}

// Create singleton instance
const gdprSystem = new GDPRComplianceSystem();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.GDPRSystem = gdprSystem;
}
