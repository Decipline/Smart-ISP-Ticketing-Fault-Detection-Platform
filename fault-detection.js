/**
 * Smart ISP Platform - Automated Fault Detection System
 * ML-powered fault detection with predictive analytics
 */

class FaultDetectionSystem {
    constructor() {
        this.detectors = new Map();
        this.faultHistory = [];
        this.patterns = new Map();
        this.isRunning = false;
        this.detectionInterval = 60000; // 1 minute
    }

    /**
     * Initialize fault detection system
     */
    async initialize() {
        console.log('[Fault Detection] Initializing system...');

        // Register detectors
        this.registerDetector('latency-spike', this.detectLatencySpike.bind(this));
        this.registerDetector('packet-loss-burst', this.detectPacketLossBurst.bind(this));
        this.registerDetector('signal-degradation', this.detectSignalDegradation.bind(this));
        this.registerDetector('olt-overload', this.detectOLTOverload.bind(this));
        this.registerDetector('equipment-failure', this.detectEquipmentFailure.bind(this));
        this.registerDetector('network-congestion', this.detectNetworkCongestion.bind(this));
        this.registerDetector('anomaly-detection', this.detectAnomaly.bind(this));

        // Load historical patterns
        await this.loadPatterns();

        console.log('[Fault Detection] System initialized');
    }

    /**
     * Register a fault detector
     */
    registerDetector(name, detector, options = {}) {
        this.detectors.set(name, {
            name,
            detector,
            enabled: options.enabled !== false,
            sensitivity: options.sensitivity || 'medium',
            threshold: options.threshold,
            lastDetection: null
        });
    }

    /**
     * Start fault detection
     */
    async start() {
        if (this.isRunning) {
            console.log('[Fault Detection] Already running');
            return;
        }

        this.isRunning = true;
        console.log('[Fault Detection] Starting fault detection');

        // Run initial detection
        await this.runDetection();

        // Start periodic detection
        this.intervalId = setInterval(() => {
            this.runDetection();
        }, this.detectionInterval);
    }

    /**
     * Stop fault detection
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('[Fault Detection] Stopped fault detection');
    }

    /**
     * Run all detectors
     */
    async runDetection() {
        if (!this.isRunning) return;

        const results = [];

        for (const [name, detectorObj] of this.detectors) {
            if (!detectorObj.enabled) continue;

            try {
                const result = await detectorObj.detector();
                if (result && result.detected) {
                    results.push({
                        detector: name,
                        ...result
                    });
                    detectorObj.lastDetection = new Date();
                }
            } catch (error) {
                console.error(`[Fault Detection] Error in detector ${name}:`, error);
            }
        }

        // Process detected faults
        if (results.length > 0) {
            await this.processFaults(results);
        }

        return results;
    }

    /**
     * Process detected faults
     */
    async processFaults(faults) {
        console.log(`[Fault Detection] Detected ${faults.length} faults`);

        for (const fault of faults) {
            // Add to history
            this.faultHistory.push({
                ...fault,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                resolved: false
            });

            // Check for patterns
            this.analyzePattern(fault);

            // Log to audit system
            if (window.SmartISPDB) {
                await window.SmartISPDB.addAuditLog({
                    action: 'fault_detected',
                    entity: fault.detector,
                    details: fault,
                    severity: fault.severity
                });
            }

            // Trigger alert
            this.triggerFaultAlert(fault);
        }

        // Clean old history
        this.cleanOldHistory();
    }

    /**
     * Analyze fault patterns
     */
    analyzePattern(fault) {
        const recentFaults = this.faultHistory.slice(-50);
        const sameTypeFaults = recentFaults.filter(f => f.detector === fault.detector);

        if (sameTypeFaults.length >= 3) {
            // Pattern detected
            const pattern = {
                type: fault.detector,
                frequency: sameTypeFaults.length,
                lastOccurrence: new Date(),
                severity: this.calculatePatternSeverity(sameTypeFaults)
            };

            this.patterns.set(fault.detector, pattern);
            console.log(`[Fault Detection] Pattern detected:`, pattern);
        }
    }

    /**
     * Calculate pattern severity
     */
    calculatePatternSeverity(faults) {
        const criticalCount = faults.filter(f => f.severity === 'critical').length;
        const highCount = faults.filter(f => f.severity === 'high').length;

        if (criticalCount >= 2) return 'critical';
        if (highCount >= 3) return 'high';
        if (faults.length >= 5) return 'medium';
        return 'low';
    }

    /**
     * Trigger fault alert
     */
    triggerFaultAlert(fault) {
        console.log(`[Fault Detection] Alert: ${fault.message}`);

        // Send notification
        if (window.SmartISP && window.SmartISP.UIController) {
            window.SmartISP.UIController.showNotification(
                fault.message,
                fault.severity === 'critical' ? 'error' : 'warning'
            );
        }

        // Create automatic ticket if critical
        if (fault.severity === 'critical') {
            this.createAutoTicket(fault);
        }
    }

    /**
     * Create automatic ticket for fault
     */
    async createAutoTicket(fault) {
        const ticket = {
            subject: `Auto: ${fault.detector} detected`,
            description: fault.message,
            priority: fault.severity,
            category: 'fault-detection',
            autoGenerated: true,
            faultDetails: fault
        };

        // In production, this would call the ticket service
        console.log('[Fault Detection] Auto-created ticket:', ticket);
    }

    /**
     * Fault detectors
     */
    async detectLatencySpike() {
        // Simulate latency data
        const currentLatency = Math.random() * 100 + 10;
        const baselineLatency = 30;

        const spikeThreshold = baselineLatency * 3;
        const isSpike = currentLatency > spikeThreshold;

        return {
            detected: isSpike,
            severity: currentLatency > spikeThreshold * 2 ? 'critical' : 'high',
            message: isSpike ? `Latency spike detected: ${currentLatency.toFixed(2)}ms (baseline: ${baselineLatency}ms)` : null,
            value: currentLatency,
            baseline: baselineLatency,
            threshold: spikeThreshold
        };
    }

    async detectPacketLossBurst() {
        const currentPacketLoss = Math.random() * 5;
        const baselinePacketLoss = 0.5;

        const burstThreshold = baselinePacketLoss * 5;
        isBurst = currentPacketLoss > burstThreshold;

        return {
            detected: isBurst,
            severity: currentPacketLoss > burstThreshold * 2 ? 'critical' : 'high',
            message: isBurst ? `Packet loss burst: ${currentPacketLoss.toFixed(2)}% (baseline: ${baselinePacketLoss}%)` : null,
            value: currentPacketLoss,
            baseline: baselinePacketLoss,
            threshold: burstThreshold
        };
    }

    async detectSignalDegradation() {
        const currentSignal = -Math.random() * 10 - 20;
        const baselineSignal = -15;

        const degradationThreshold = baselineSignal - 5;
        const isDegraded = currentSignal < degradationThreshold;

        return {
            detected: isDegraded,
            severity: currentSignal < degradationThreshold - 5 ? 'critical' : 'high',
            message: isDegraded ? `Signal degradation: ${currentSignal.toFixed(1)}dBm (baseline: ${baselineSignal}dBm)` : null,
            value: currentSignal,
            baseline: baselineSignal,
            threshold: degradationThreshold
        };
    }

    async detectOLTOverload() {
        const oltLoad = Math.random() * 40 + 60;
        const threshold = 85;

        const isOverloaded = oltLoad > threshold;

        return {
            detected: isOverloaded,
            severity: oltLoad > 95 ? 'critical' : 'high',
            message: isOverloaded ? `OLT overload detected: ${oltLoad.toFixed(1)}%` : null,
            value: oltLoad,
            threshold: threshold
        };
    }

    async detectEquipmentFailure() {
        // Simulate equipment health check
        const healthScore = Math.random() * 30 + 70;
        const threshold = 80;

        const isFailing = healthScore < threshold;

        return {
            detected: isFailing,
            severity: healthScore < 60 ? 'critical' : 'high',
            message: isFailing ? `Equipment health degraded: ${healthScore.toFixed(1)}%` : null,
            value: healthScore,
            threshold: threshold
        };
    }

    async detectNetworkCongestion() {
        const bandwidthUtilization = Math.random() * 30 + 60;
        const threshold = 85;

        const isCongested = bandwidthUtilization > threshold;

        return {
            detected: isCongested,
            severity: bandwidthUtilization > 95 ? 'critical' : 'high',
            message: isCongested ? `Network congestion: ${bandwidthUtilization.toFixed(1)}%` : null,
            value: bandwidthUtilization,
            threshold: threshold
        };
    }

    async detectAnomaly() {
        // Statistical anomaly detection
        const metrics = await this.collectMetrics();
        const anomalies = this.detectStatisticalAnomalies(metrics);

        return {
            detected: anomalies.length > 0,
            severity: anomalies.some(a => a.severity === 'critical') ? 'critical' : 'high',
            message: anomalies.length > 0 ? `Anomalies detected: ${anomalies.length}` : null,
            anomalies: anomalies
        };
    }

    /**
     * Collect metrics for anomaly detection
     */
    async collectMetrics() {
        return {
            latency: Array.from({ length: 20 }, () => Math.random() * 50 + 10),
            packetLoss: Array.from({ length: 20 }, () => Math.random() * 2),
            signalStrength: Array.from({ length: 20 }, () => -Math.random() * 10 - 15),
            cpuUsage: Array.from({ length: 20 }, () => Math.random() * 40 + 40)
        };
    }

    /**
     * Detect statistical anomalies using Z-score
     */
    detectStatisticalAnomalies(metrics) {
        const anomalies = [];
        const threshold = 2.5;

        for (const [metricName, values] of Object.entries(metrics)) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            values.forEach((value, index) => {
                const zScore = Math.abs((value - mean) / stdDev);
                if (zScore > threshold) {
                    anomalies.push({
                        metric: metricName,
                        value,
                        zScore: zScore.toFixed(2),
                        severity: zScore > 4 ? 'critical' : 'high'
                    });
                }
            });
        }

        return anomalies;
    }

    /**
     * Predictive fault detection
     */
    async predictFaults(horizon = 24) {
        const metrics = await this.collectMetrics();
        const predictions = [];

        for (const [metricName, values] of Object.entries(metrics)) {
            const prediction = this.predictNextValue(values);
            const threshold = this.getThreshold(metricName);

            if (prediction > threshold) {
                predictions.push({
                    metric: metricName,
                    predictedValue: prediction,
                    threshold: threshold,
                    timeToFault: this.estimateTimeToFault(values, threshold),
                    confidence: this.calculateConfidence(values)
                });
            }
        }

        return predictions;
    }

    /**
     * Predict next value using linear regression
     */
    predictNextValue(values) {
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
        const sumXX = x.reduce((a, xi) => a + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return slope * n + intercept;
    }

    /**
     * Get threshold for metric
     */
    getThreshold(metricName) {
        const thresholds = {
            latency: 100,
            packetLoss: 5,
            signalStrength: -25,
            cpuUsage: 90
        };
        return thresholds[metricName] || Infinity;
    }

    /**
     * Estimate time to fault
     */
    estimateTimeToFault(values, threshold) {
        const prediction = this.predictNextValue(values);
        const currentValue = values[values.length - 1];
        const rateOfChange = prediction - currentValue;

        if (rateOfChange <= 0) return Infinity;

        const timeToThreshold = (threshold - currentValue) / rateOfChange;
        return Math.max(0, timeToThreshold);
    }

    /**
     * Calculate prediction confidence
     */
    calculateConfidence(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        const coefficientOfVariation = stdDev / mean;
        return Math.max(0, (1 - coefficientOfVariation) * 100);
    }

    /**
     * Load historical patterns
     */
    async loadPatterns() {
        if (window.SmartISPDB) {
            const storedPatterns = await window.SmartISPDB.getPreference('fault_patterns');
            if (storedPatterns) {
                this.patterns = new Map(Object.entries(storedPatterns));
            }
        }
    }

    /**
     * Save patterns
     */
    async savePatterns() {
        if (window.SmartISPDB) {
            await window.SmartISPDB.setPreference('fault_patterns', Object.fromEntries(this.patterns));
        }
    }

    /**
     * Clean old fault history
     */
    cleanOldHistory() {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();

        this.faultHistory = this.faultHistory.filter(fault => {
            const faultTime = new Date(fault.timestamp).getTime();
            return (now - faultTime) < maxAge;
        });
    }

    /**
     * Get fault statistics
     */
    getStatistics() {
        const totalFaults = this.faultHistory.length;
        const bySeverity = {
            critical: this.faultHistory.filter(f => f.severity === 'critical').length,
            high: this.faultHistory.filter(f => f.severity === 'high').length,
            medium: this.faultHistory.filter(f => f.severity === 'medium').length,
            low: this.faultHistory.filter(f => f.severity === 'low').length
        };

        const byDetector = {};
        this.faultHistory.forEach(fault => {
            byDetector[fault.detector] = (byDetector[fault.detector] || 0) + 1;
        });

        const resolvedCount = this.faultHistory.filter(f => f.resolved).length;
        const acknowledgedCount = this.faultHistory.filter(f => f.acknowledged).length;

        return {
            totalFaults,
            bySeverity,
            byDetector,
            resolvedCount,
            acknowledgedCount,
            resolutionRate: (resolvedCount / totalFaults * 100).toFixed(2),
            patterns: Object.fromEntries(this.patterns)
        };
    }

    /**
     * Generate fault report
     */
    async generateReport() {
        const statistics = this.getStatistics();
        const predictions = await this.predictFaults();

        return {
            generatedAt: new Date().toISOString(),
            statistics,
            predictions,
            recommendations: this.generateRecommendations(statistics, predictions)
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(statistics, predictions) {
        const recommendations = [];

        if (statistics.bySeverity.critical > 5) {
            recommendations.push({
                priority: 'high',
                category: 'infrastructure',
                title: 'Critical Faults Increasing',
                description: 'Number of critical faults is elevated',
                action: 'Review infrastructure and implement preventive measures'
            });
        }

        if (predictions.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'predictive',
                title: 'Predictive Faults Detected',
                description: `${predictions.length} faults predicted within 24 hours`,
                action: 'Schedule preventive maintenance'
            });
        }

        return recommendations;
    }
}

// Create singleton instance
const faultDetectionSystem = new FaultDetectionSystem();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.FaultDetectionSystem = faultDetectionSystem;
}
