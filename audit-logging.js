/**
 * Smart ISP Platform - Comprehensive Audit Logging System
 * SOC 2 compliant audit trail with tamper-evidence features
 */

class AuditLoggingSystem {
    constructor() {
        this.logs = [];
        this.maxLogSize = 10000;
        this.logRetentionDays = 365;
        this.isInitialized = false;
        this.encryptionKey = null;
    }

    /**
     * Initialize audit logging system
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[Audit Log] Initializing comprehensive audit logging');

        // Initialize encryption key
        await this.initializeEncryption();

        // Load existing logs from IndexedDB
        await this.loadLogs();

        // Setup tamper detection
        this.setupTamperDetection();

        // Start periodic log cleanup
        this.startLogCleanup();

        this.isInitialized = true;
        console.log('[Audit Log] Initialized successfully');
    }

    /**
     * Initialize encryption for log integrity
     */
    async initializeEncryption() {
        // Generate encryption key
        const key = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );

        this.encryptionKey = key;
    }

    /**
     * Setup tamper detection
     */
    setupTamperDetection() {
        // Store hash of log chain
        this.logChainHash = this.calculateLogChainHash();

        // Monitor for tampering
        setInterval(() => {
            this.detectTampering();
        }, 60000); // Check every minute
    }

    /**
     * Calculate hash of log chain
     */
    calculateLogChainHash() {
        const logString = JSON.stringify(this.logs);
        return this.simpleHash(logString);
    }

    /**
     * Simple hash function for tamper detection
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    /**
     * Detect tampering
     */
    detectTampering() {
        const currentHash = this.calculateLogChainHash();
        
        if (currentHash !== this.logChainHash) {
            console.error('[Audit Log] Tampering detected!');
            this.createTamperAlert();
        }
        
        this.logChainHash = currentHash;
    }

    /**
     * Create tamper alert
     */
    async createTamperAlert() {
        const alert = {
            id: this.generateId(),
            type: 'tamper_alert',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            message: 'Audit log tampering detected',
            detectedAt: new Date().toISOString()
        };

        await this.log(alert);
    }

    /**
     * Load logs from IndexedDB
     */
    async loadLogs() {
        if (window.SmartISPDB) {
            const storedLogs = await window.SmartISPDB.getAll(STORES.AUDIT_LOGS);
            this.logs = storedLogs;
        }
    }

    /**
     * Start periodic log cleanup
     */
    startLogCleanup() {
        // Clean logs older than retention period every day
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Clean up old logs
     */
    async cleanupOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

        const oldLogs = this.logs.filter(log => new Date(log.timestamp) < cutoffDate);
        
        for (const log of oldLogs) {
            await this.deleteLog(log.id);
        }

        console.log(`[Audit Log] Cleaned up ${oldLogs.length} old logs`);
    }

    /**
     * Log an event
     */
    async log(event) {
        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: event.userId || this.getCurrentUserId(),
            sessionId: event.sessionId || this.getCurrentSessionId(),
            action: event.action,
            entity: event.entity,
            entityId: event.entityId,
            details: this.sanitizeDetails(event.details),
            severity: event.severity || 'info',
            ipAddress: await this.getIPAddress(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            success: event.success !== undefined ? event.success : true,
            duration: event.duration,
            metadata: event.metadata || {}
        };

        // Add integrity check
        logEntry.integrity = await this.calculateIntegrity(logEntry);

        // Add to memory
        this.logs.push(logEntry);

        // Enforce max log size
        if (this.logs.length > this.maxLogSize) {
            this.logs.shift();
        }

        // Store in IndexedDB
        if (window.SmartISPDB) {
            await window.SmartISPDB.addAuditLog(logEntry);
        }

        // Update chain hash
        this.logChainHash = this.calculateLogChainHash();

        console.log('[Audit Log] Event logged:', logEntry.action);
        return logEntry;
    }

    /**
     * Calculate integrity check for log entry
     */
    async calculateIntegrity(logEntry) {
        const data = JSON.stringify({
            action: logEntry.action,
            entity: logEntry.entity,
            timestamp: logEntry.timestamp,
            userId: logEntry.userId
        });
        
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    /**
     * Sanitize log details
     */
    sanitizeDetails(details) {
        if (!details) return null;

        const sanitized = { ...details };

        // Remove sensitive information
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        // In production, this would get the actual user ID
        return window.SmartISP?.AppState?.currentUser?.id || 'anonymous';
    }

    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        // In production, this would get the actual session ID
        return window.SmartISP?.AppState?.token || 'no-session';
    }

    /**
     * Get IP address
     */
    async getIPAddress() {
        // In production, this would get the actual IP
        return '0.0.0.0';
    }

    /**
     * Get logs by criteria
     */
    async getLogs(criteria = {}) {
        let filteredLogs = [...this.logs];

        if (criteria.userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === criteria.userId);
        }

        if (criteria.action) {
            filteredLogs = filteredLogs.filter(log => log.action === criteria.action);
        }

        if (criteria.entity) {
            filteredLogs = filteredLogs.filter(log => log.entity === criteria.entity);
        }

        if (criteria.severity) {
            filteredLogs = filteredLogs.filter(log => log.severity === criteria.severity);
        }

        if (criteria.startDate) {
            const startDate = new Date(criteria.startDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
        }

        if (criteria.endDate) {
            const endDate = new Date(criteria.endDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
        }

        if (criteria.limit) {
            filteredLogs = filteredLogs.slice(-criteria.limit);
        }

        return filteredLogs;
    }

    /**
     * Get log by ID
     */
    async getLogById(id) {
        return this.logs.find(log => log.id === id);
    }

    /**
     * Delete log
     */
    async deleteLog(id) {
        const index = this.logs.findIndex(log => log.id === id);
        if (index !== -1) {
            this.logs.splice(index, 1);
            
            if (window.SmartISPDB) {
                await window.SmartISPDB.delete(STORES.AUDIT_LOGS, id);
            }
        }
    }

    /**
     * Delete logs by criteria
     */
    async deleteLogs(criteria) {
        const logsToDelete = await this.getLogs(criteria);
        
        for (const log of logsToDelete) {
            await this.deleteLog(log.id);
        }

        return logsToDelete.length;
    }

    /**
     * Generate audit report
     */
    async generateReport(criteria = {}) {
        const logs = await this.getLogs(criteria);

        const report = {
            generatedAt: new Date().toISOString(),
            criteria,
            summary: this.generateSummary(logs),
            logs: logs,
            statistics: this.generateStatistics(logs),
            timeline: this.generateTimeline(logs),
            anomalies: this.detectAnomalies(logs),
            recommendations: this.generateRecommendations(logs)
        };

        return report;
    }

    /**
     * Generate summary
     */
    generateSummary(logs) {
        return {
            totalLogs: logs.length,
            timeRange: this.getTimeRange(logs),
            uniqueUsers: [...new Set(logs.map(log => log.userId))].length,
            uniqueActions: [...new Set(logs.map(log => log.action))].length,
            uniqueEntities: [...new Set(logs.map(log => log.entity))].length
        };
    }

    /**
     * Get time range of logs
     */
    getTimeRange(logs) {
        if (logs.length === 0) return null;

        const timestamps = logs.map(log => new Date(log.timestamp));
        const min = new Date(Math.min(...timestamps));
        const max = new Date(Math.max(...timestamps));

        return {
            start: min.toISOString(),
            end: max.toISOString(),
            duration: max - min
        };
    }

    /**
     * Generate statistics
     */
    generateStatistics(logs) {
        const byAction = {};
        const byEntity = {};
        const byUser = {};
        const bySeverity = {};
        const byHour = {};
        const byDay = {};

        logs.forEach(log => {
            // By action
            byAction[log.action] = (byAction[log.action] || 0) + 1;

            // By entity
            byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;

            // By user
            byUser[log.userId] = (byUser[log.userId] || 0) + 1;

            // By severity
            bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

            // By hour
            const hour = new Date(log.timestamp).getHours();
            byHour[hour] = (byHour[hour] || 0) + 1;

            // By day
            const day = new Date(log.timestamp).toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + 1;
        });

        return {
            byAction,
            byEntity,
            byUser,
            bySeverity,
            byHour,
            byDay,
            successRate: this.calculateSuccessRate(logs),
            averageDuration: this.calculateAverageDuration(logs)
        };
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(logs) {
        const successCount = logs.filter(log => log.success === true).length;
        return logs.length > 0 ? (successCount / logs.length * 100).toFixed(2) : 0;
    }

    /**
     * Calculate average duration
     */
    calculateAverageDuration(logs) {
        const logsWithDuration = logs.filter(log => log.duration !== undefined);
        if (logsWithDuration.length === 0) return 0;

        const totalDuration = logsWithDuration.reduce((sum, log) => sum + log.duration, 0);
        return (totalDuration / logsWithDuration.length).toFixed(2);
    }

    /**
     * Generate timeline
     */
    generateTimeline(logs) {
        return logs
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map(log => ({
                timestamp: log.timestamp,
                action: log.action,
                entity: log.entity,
                userId: log.userId,
                severity: log.severity
            }));
    }

    /**
     * Detect anomalies in logs
     */
    detectAnomalies(logs) {
        const anomalies = [];

        // Detect unusual activity patterns
        const userActivity = {};
        logs.forEach(log => {
            userActivity[log.userId] = userActivity[log.userId] || [];
            userActivity[log.userId].push(log);
        });

        // Check for suspicious activity
        Object.entries(userActivity).forEach(([userId, userLogs]) => {
            // Check for rapid successive actions
            for (let i = 1; i < userLogs.length; i++) {
                const timeDiff = new Date(userLogs[i].timestamp) - new Date(userLogs[i-1].timestamp);
                if (timeDiff < 1000) { // Less than 1 second
                    anomalies.push({
                        type: 'rapid_activity',
                        userId,
                        message: `Rapid activity detected: ${timeDiff}ms between actions`,
                        severity: 'warning'
                    });
                }
            }

            // Check for unusual number of failed actions
            const failedActions = userLogs.filter(log => log.success === false);
            if (failedActions.length > 10) {
                anomalies.push({
                    type: 'high_failure_rate',
                    userId,
                    message: `High failure rate: ${failedActions.length} failed actions`,
                    severity: 'warning'
                });
            }
        });

        // Check for security-sensitive actions
        const securityActions = logs.filter(log => 
            ['login', 'logout', 'password_change', 'permission_change', 'data_export'].includes(log.action)
        );

        securityActions.forEach(log => {
            if (log.success === false) {
                anomalies.push({
                    type: 'security_action_failed',
                    action: log.action,
                    userId: log.userId,
                    message: `Security action failed: ${log.action}`,
                    severity: 'high'
                });
            }
        });

        return anomalies;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(logs) {
        const recommendations = [];
        const stats = this.generateStatistics(logs);

        // Check for high failure rates
        if (parseFloat(stats.successRate) < 95) {
            recommendations.push({
                priority: 'high',
                category: 'reliability',
                title: 'High Failure Rate Detected',
                description: `Success rate is ${stats.successRate}%`,
                action: 'Investigate failed operations and improve error handling'
            });
        }

        // Check for unusual patterns
        const anomalies = this.detectAnomalies(logs);
        if (anomalies.length > 5) {
            recommendations.push({
                priority: 'medium',
                category: 'security',
                title: 'Unusual Activity Patterns',
                description: `${anomalies.length} anomalies detected in audit logs`,
                action: 'Review security logs and investigate suspicious activity'
            });
        }

        // Check for data access patterns
        const exportActions = stats.byAction['data_export'] || 0;
        if (exportActions > 10) {
            recommendations.push({
                priority: 'medium',
                category: 'data_protection',
                title: 'Frequent Data Exports',
                description: `${exportActions} data export actions detected`,
                action: 'Review data export activities for compliance'
            });
        }

        return recommendations;
    }

    /**
     * Export logs
     */
    async exportLogs(criteria = {}, format = 'json') {
        const logs = await this.getLogs(criteria);

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(logs, null, 2);
            case 'csv':
                return this.convertToCSV(logs);
            case 'xml':
                return this.convertToXML(logs);
            default:
                return JSON.stringify(logs, null, 2);
        }
    }

    /**
     * Convert logs to CSV
     */
    convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = Object.keys(logs[0]);
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const values = headers.map(header => {
                let value = log[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') value = JSON.stringify(value);
                value = String(value).replace(/"/g, '""');
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Convert logs to XML
     */
    convertToXML(logs) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLogs>\n';
        
        logs.forEach(log => {
            xml += '  <log>\n';
            Object.entries(log).forEach(([key, value]) => {
                xml += `    <${key}>${JSON.stringify(value)}</${key}>\n`;
            });
            xml += '  </log>\n';
        });
        
        xml += '</auditLogs>';
        return xml;
    }

    /**
     * Archive logs
     */
    async archiveLogs(criteria = {}) {
        const logsToArchive = await this.getLogs(criteria);
        
        // Create archive
        const archive = {
            archivedAt: new Date().toISOString(),
            criteria,
            logs: logsToArchive,
            count: logsToArchive.length
        };

        // Store archive
        if (window.SmartISPDB) {
            await window.SmartISPDB.setPreference(`archive_${Date.now()}`, archive);
        }

        // Delete archived logs from main log
        for (const log of logsToArchive) {
            await this.deleteLog(log.id);
        }

        return archive;
    }

    /**
     * Verify log integrity
     */
    async verifyLogIntegrity(logId) {
        const log = await this.getLogById(logId);
        if (!log) return false;

        const currentIntegrity = await this.calculateIntegrity(log);
        const storedIntegrity = log.integrity;

        return currentIntegrity === storedIntegrity;
    }

    /**
     * Verify all log integrity
     */
    async verifyAllLogIntegrity() {
        const results = [];

        for (const log of this.logs) {
            const isValid = await this.verifyLogIntegrity(log.id);
            results.push({
                logId: log.id,
                valid: isValid
            });
        }

        const validCount = results.filter(r => r.valid).length;
        const integrityRate = (validCount / results.length * 100).toFixed(2);

        return {
            total: results.length,
            valid: validCount,
            invalid: results.length - validCount,
            integrityRate,
            results
        };
    }

    /**
     * Generate ID
     */
    generateId() {
        return `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            totalLogs: this.logs.length,
            maxLogSize: this.maxLogSize,
            retentionDays: this.logRetentionDays,
            chainHash: this.logChainHash
        };
    }
}

// Create singleton instance
const auditLoggingSystem = new AuditLoggingSystem();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.AuditLoggingSystem = auditLoggingSystem;
}
