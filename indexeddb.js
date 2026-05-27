/**
 * Smart ISP Platform - IndexedDB Wrapper
 * Local data storage with full CRUD operations and advanced features
 * GDPR compliant with data retention policies
 */

const DB_NAME = 'SmartISPDB';
const DB_VERSION = 2;

const STORES = {
    TICKETS: 'tickets',
    CUSTOMERS: 'customers',
    TECHNICIANS: 'technicians',
    AUDIT_LOGS: 'audit_logs',
    OFFLINE_QUEUE: 'offline_queue',
    CACHE: 'cache',
    USER_PREFERENCES: 'user_preferences',
    CONSENTS: 'consents',
    PERFORMANCE_METRICS: 'performance_metrics'
};

class IndexedDBWrapper {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    /**
     * Initialize database
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[IndexedDB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[IndexedDB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[IndexedDB] Upgrading database to version', DB_VERSION);

                // Create object stores
                this.createStores(db);
            };
        });

        return this.initPromise;
    }

    /**
     * Create all object stores
     */
    createStores(db) {
        // Tickets store
        if (!db.objectStoreNames.contains(STORES.TICKETS)) {
            const ticketStore = db.createObjectStore(STORES.TICKETS, { keyPath: 'id' });
            ticketStore.createIndex('status', 'status', { unique: false });
            ticketStore.createIndex('priority', 'priority', { unique: false });
            ticketStore.createIndex('customerId', 'customerId', { unique: false });
            ticketStore.createIndex('createdAt', 'createdAt', { unique: false });
            ticketStore.createIndex('assignedTo', 'assignedTo', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
            const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
            customerStore.createIndex('name', 'name', { unique: false });
            customerStore.createIndex('email', 'email', { unique: true });
            customerStore.createIndex('status', 'status', { unique: false });
        }

        // Technicians store
        if (!db.objectStoreNames.contains(STORES.TECHNICIANS)) {
            const techStore = db.createObjectStore(STORES.TECHNICIANS, { keyPath: 'id' });
            techStore.createIndex('name', 'name', { unique: false });
            techStore.createIndex('status', 'status', { unique: false });
            techStore.createIndex('specialization', 'specialization', { unique: false });
        }

        // Audit logs store
        if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
            const auditStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id', autoIncrement: true });
            auditStore.createIndex('timestamp', 'timestamp', { unique: false });
            auditStore.createIndex('userId', 'userId', { unique: false });
            auditStore.createIndex('action', 'action', { unique: false });
            auditStore.createIndex('entity', 'entity', { unique: false });
        }

        // Offline queue store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
            const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            queueStore.createIndex('status', 'status', { unique: false });
        }

        // Cache store
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
            const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
            cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }

        // User preferences store
        if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
            db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
        }

        // Consents store (GDPR)
        if (!db.objectStoreNames.contains(STORES.CONSENTS)) {
            const consentStore = db.createObjectStore(STORES.CONSENTS, { keyPath: 'id' });
            consentStore.createIndex('userId', 'userId', { unique: false });
            consentStore.createIndex('type', 'type', { unique: false });
            consentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Performance metrics store
        if (!db.objectStoreNames.contains(STORES.PERFORMANCE_METRICS)) {
            const perfStore = db.createObjectStore(STORES.PERFORMANCE_METRICS, { keyPath: 'id', autoIncrement: true });
            perfStore.createIndex('timestamp', 'timestamp', { unique: false });
            perfStore.createIndex('type', 'type', { unique: false });
        }
    }

    /**
     * Generic add operation
     */
    async add(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic put operation (update or insert)
     */
    async put(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic get operation
     */
    async get(storeName, key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic delete operation
     */
    async delete(storeName, key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic getAll operation
     */
    async getAll(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic query by index
     */
    async getByIndex(storeName, indexName, value) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic query with range
     */
    async getByRange(storeName, indexName, lower, upper, lowerOpen = false, upperOpen = false) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.lowerBound(lower, lowerOpen);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear entire store
     */
    async clear(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Count records in store
     */
    async count(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Ticket-specific operations
     */
    async addTicket(ticket) {
        return this.add(STORES.TICKETS, ticket);
    }

    async getTicket(id) {
        return this.get(STORES.TICKETS, id);
    }

    async getAllTickets() {
        return this.getAll(STORES.TICKETS);
    }

    async updateTicket(ticket) {
        return this.put(STORES.TICKETS, ticket);
    }

    async deleteTicket(id) {
        return this.delete(STORES.TICKETS, id);
    }

    async getTicketsByStatus(status) {
        return this.getByIndex(STORES.TICKETS, 'status', status);
    }

    async getTicketsByPriority(priority) {
        return this.getByIndex(STORES.TICKETS, 'priority', priority);
    }

    async getTicketsByCustomer(customerId) {
        return this.getByIndex(STORES.TICKETS, 'customerId', customerId);
    }

    async getTicketsByTechnician(technicianId) {
        return this.getByIndex(STORES.TICKETS, 'assignedTo', technicianId);
    }

    /**
     * Customer-specific operations
     */
    async addCustomer(customer) {
        return this.add(STORES.CUSTOMERS, customer);
    }

    async getCustomer(id) {
        return this.get(STORES.CUSTOMERS, id);
    }

    async getAllCustomers() {
        return this.getAll(STORES.CUSTOMERS);
    }

    async updateCustomer(customer) {
        return this.put(STORES.CUSTOMERS, customer);
    }

    async deleteCustomer(id) {
        return this.delete(STORES.CUSTOMERS, id);
    }

    /**
     * Technician-specific operations
     */
    async addTechnician(technician) {
        return this.add(STORES.TECHNICIANS, technician);
    }

    async getTechnician(id) {
        return this.get(STORES.TECHNICIANS, id);
    }

    async getAllTechnicians() {
        return this.getAll(STORES.TECHNICIANS);
    }

    async updateTechnician(technician) {
        return this.put(STORES.TECHNICIANS, technician);
    }

    async deleteTechnician(id) {
        return this.delete(STORES.TECHNICIANS, id);
    }

    /**
     * Audit logging (GDPR compliant)
     */
    async addAuditLog(log) {
        const auditLog = {
            ...log,
            timestamp: new Date().toISOString(),
            id: undefined // Let autoIncrement handle it
        };
        return this.add(STORES.AUDIT_LOGS, auditLog);
    }

    async getAuditLogs(userId = null, limit = 100) {
        if (userId) {
            return this.getByIndex(STORES.AUDIT_LOGS, 'userId', userId);
        }
        return this.getAll(STORES.AUDIT_LOGS).then(logs => logs.slice(-limit));
    }

    async getAuditLogsByAction(action) {
        return this.getByIndex(STORES.AUDIT_LOGS, 'action', action);
    }

    /**
     * GDPR: Data retention and cleanup
     */
    async cleanupOldData(retentionDays = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Clean old audit logs
        const oldLogs = await this.getAll(STORES.AUDIT_LOGS);
        const logsToDelete = oldLogs.filter(log => new Date(log.timestamp) < cutoffDate);
        
        for (const log of logsToDelete) {
            await this.delete(STORES.AUDIT_LOGS, log.id);
        }

        // Clean old performance metrics
        const oldMetrics = await this.getAll(STORES.PERFORMANCE_METRICS);
        const metricsToDelete = oldMetrics.filter(metric => new Date(metric.timestamp) < cutoffDate);
        
        for (const metric of metricsToDelete) {
            await this.delete(STORES.PERFORMANCE_METRICS, metric.id);
        }

        return {
            logsDeleted: logsToDelete.length,
            metricsDeleted: metricsToDelete.length
        };
    }

    /**
     * GDPR: Export user data (Right to Data Portability)
     */
    async exportUserData(userId) {
        const tickets = await this.getTicketsByCustomer(userId);
        const auditLogs = await this.getAuditLogs(userId);
        const consents = await this.getByIndex(STORES.CONSENTS, 'userId', userId);
        const preferences = await this.get(STORES.USER_PREFERENCES, `user_${userId}`);

        return {
            tickets,
            auditLogs,
            consents,
            preferences,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * GDPR: Delete user data (Right to be Forgotten)
     */
    async deleteUserData(userId) {
        // Delete tickets
        const tickets = await this.getTicketsByCustomer(userId);
        for (const ticket of tickets) {
            await this.deleteTicket(ticket.id);
        }

        // Delete customer
        await this.deleteCustomer(userId);

        // Delete audit logs (or anonymize them)
        const auditLogs = await this.getAuditLogs(userId);
        for (const log of auditLogs) {
            // Anonymize instead of delete for audit trail
            log.userId = 'ANONYMIZED';
            log.userData = null;
            await this.put(STORES.AUDIT_LOGS, log);
        }

        // Delete consents
        const consents = await this.getByIndex(STORES.CONSENTS, 'userId', userId);
        for (const consent of consents) {
            await this.delete(STORES.CONSENTS, consent.id);
        }

        // Delete preferences
        await this.delete(STORES.USER_PREFERENCES, `user_${userId}`);

        return { success: true };
    }

    /**
     * Cache operations
     */
    async cacheSet(key, value, ttl = 3600000) {
        const expiry = Date.now() + ttl;
        return this.put(STORES.CACHE, { key, value, expiry });
    }

    async cacheGet(key) {
        const cached = await this.get(STORES.CACHE, key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            await this.delete(STORES.CACHE, key);
            return null;
        }
        
        return cached.value;
    }

    async cacheDelete(key) {
        return this.delete(STORES.CACHE, key);
    }

    async cacheClear() {
        return this.clear(STORES.CACHE);
    }

    /**
     * Offline queue operations
     */
    async addToQueue(action) {
        return this.add(STORES.OFFLINE_QUEUE, {
            ...action,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
    }

    async getQueueItems() {
        return this.getByIndex(STORES.OFFLINE_QUEUE, 'status', 'pending');
    }

    async markQueueItemProcessed(id) {
        const item = await this.get(STORES.OFFLINE_QUEUE, id);
        if (item) {
            item.status = 'processed';
            item.processedAt = new Date().toISOString();
            return this.put(STORES.OFFLINE_QUEUE, item);
        }
    }

    async clearProcessedQueueItems() {
        const items = await this.getAll(STORES.OFFLINE_QUEUE);
        const processed = items.filter(item => item.status === 'processed');
        for (const item of processed) {
            await this.delete(STORES.OFFLINE_QUEUE, item.id);
        }
    }

    /**
     * Consent management (GDPR)
     */
    async saveConsent(consent) {
        const consentRecord = {
            ...consent,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        return this.add(STORES.CONSENTS, consentRecord);
    }

    async getConsents(userId) {
        return this.getByIndex(STORES.CONSENTS, 'userId', userId);
    }

    async hasConsent(userId, consentType) {
        const consents = await this.getConsents(userId);
        return consents.some(c => c.type === consentType && c.granted === true);
    }

    async revokeConsent(consentId) {
        const consent = await this.get(STORES.CONSENTS, consentId);
        if (consent) {
            consent.granted = false;
            consent.revokedAt = new Date().toISOString();
            return this.put(STORES.CONSENTS, consent);
        }
    }

    /**
     * Performance metrics
     */
    async addPerformanceMetric(metric) {
        const metricRecord = {
            ...metric,
            timestamp: new Date().toISOString()
        };
        return this.add(STORES.PERFORMANCE_METRICS, metricRecord);
    }

    async getPerformanceMetrics(type = null, limit = 100) {
        if (type) {
            return this.getByIndex(STORES.PERFORMANCE_METRICS, 'type', type);
        }
        return this.getAll(STORES.PERFORMANCE_METRICS).then(metrics => metrics.slice(-limit));
    }

    /**
     * User preferences
     */
    async setPreference(key, value) {
        return this.put(STORES.USER_PREFERENCES, { key, value });
    }

    async getPreference(key) {
        const pref = await this.get(STORES.USER_PREFERENCES, key);
        return pref ? pref.value : null;
    }

    async getAllPreferences() {
        return this.getAll(STORES.USER_PREFERENCES);
    }

    /**
     * Database maintenance
     */
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
        }
    }

    async deleteDatabase() {
        await this.close();
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Create singleton instance
const db = new IndexedDBWrapper();

// Export for use in application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = db;
} else if (typeof window !== 'undefined') {
    window.SmartISPDB = db;
}
