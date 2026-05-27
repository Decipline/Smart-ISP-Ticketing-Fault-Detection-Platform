/**
 * Smart ISP Platform - Automated Ticket Assignment System
 * Intelligent ticket assignment based on multiple factors
 */

class AutoAssignmentSystem {
    constructor() {
        this.assignmentRules = this.getDefaultRules();
        this.technicianSkills = new Map();
        this.technicianWorkload = new Map();
        this.technicianLocation = new Map();
        this.assignmentHistory = [];
    }

    /**
     * Get default assignment rules
     */
    getDefaultRules() {
        return {
            priority: {
                critical: { maxTickets: 3, skillLevel: 'expert', responseTime: 15 },
                high: { maxTickets: 5, skillLevel: 'senior', responseTime: 30 },
                medium: { maxTickets: 8, skillLevel: 'intermediate', responseTime: 60 },
                low: { maxTickets: 12, skillLevel: 'junior', responseTime: 120 }
            },
            categories: {
                connectivity: { skills: ['network', 'fiber', 'routing'] },
                hardware: { skills: ['hardware', 'equipment', 'installation'] },
                software: { skills: ['software', 'configuration', 'troubleshooting'] },
                billing: { skills: ['customer-service', 'billing'] },
                performance: { skills: ['network', 'optimization', 'monitoring'] }
            },
            workload: {
                maxConcurrentTickets: 10,
                maxDailyTickets: 20,
                maxWeeklyTickets: 80
            },
            location: {
                maxDistance: 50, // km
                preferredDistance: 20 // km
            },
            availability: {
                workingHours: { start: 8, end: 18 },
                breakTime: { start: 12, end: 13 }
            }
        };
    }

    /**
     * Auto-assign a ticket
     */
    async assignTicket(ticket, technicians) {
        console.log('[Auto-Assignment] Processing ticket:', ticket.id);

        // Calculate scores for each technician
        const scoredTechnicians = technicians.map(tech => ({
            technician: tech,
            score: this.calculateAssignmentScore(ticket, tech),
            details: this.getScoreDetails(ticket, tech)
        }));

        // Sort by score (highest first)
        scoredTechnicians.sort((a, b) => b.score - a.score);

        // Get best technician
        const bestMatch = scoredTechnicians[0];

        if (!bestMatch || bestMatch.score < 50) {
            console.log('[Auto-Assignment] No suitable technician found');
            return {
                assigned: false,
                reason: 'No suitable technician available',
                alternatives: scoredTechnicians.slice(0, 3)
            };
        }

        // Assign ticket
        const assignment = {
            ticketId: ticket.id,
            technicianId: bestMatch.technician.id,
            technicianName: bestMatch.technician.name,
            assignedAt: new Date().toISOString(),
            score: bestMatch.score,
            reason: this.getAssignmentReason(bestMatch.details),
            estimatedResponseTime: this.calculateResponseTime(ticket, bestMatch.technician)
        };

        // Record assignment
        this.assignmentHistory.push(assignment);

        console.log('[Auto-Assignment] Ticket assigned:', assignment);
        return {
            assigned: true,
            assignment,
            alternatives: scoredTechnicians.slice(1, 4)
        };
    }

    /**
     * Calculate assignment score for a technician
     */
    calculateAssignmentScore(ticket, technician) {
        let score = 0;
        const weights = {
            skillMatch: 30,
            workload: 25,
            location: 20,
            availability: 15,
            priorityMatch: 10
        };

        // Skill match
        const skillScore = this.calculateSkillScore(ticket, technician);
        score += (skillScore / 100) * weights.skillMatch;

        // Workload
        const workloadScore = this.calculateWorkloadScore(technician);
        score += (workloadScore / 100) * weights.workload;

        // Location
        const locationScore = this.calculateLocationScore(ticket, technician);
        score += (locationScore / 100) * weights.location;

        // Availability
        const availabilityScore = this.calculateAvailabilityScore(technician);
        score += (availabilityScore / 100) * weights.availability;

        // Priority match
        const priorityScore = this.calculatePriorityScore(ticket, technician);
        score += (priorityScore / 100) * weights.priorityMatch;

        return Math.round(score);
    }

    /**
     * Calculate skill match score
     */
    calculateSkillScore(ticket, technician) {
        const requiredSkills = this.assignmentRules.categories[ticket.category]?.skills || [];
        const techSkills = technician.skills || [];

        if (requiredSkills.length === 0) return 100;

        const matchedSkills = requiredSkills.filter(skill => 
            techSkills.includes(skill)
        );

        const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;

        // Boost for skill level
        const skillLevelBonus = this.getSkillLevelBonus(technician.skillLevel);

        return Math.min(matchPercentage + skillLevelBonus, 100);
    }

    /**
     * Get skill level bonus
     */
    getSkillLevelBonus(skillLevel) {
        const bonuses = {
            expert: 20,
            senior: 15,
            intermediate: 10,
            junior: 5
        };
        return bonuses[skillLevel] || 0;
    }

    /**
     * Calculate workload score
     */
    calculateWorkloadScore(technician) {
        const currentTickets = this.technicianWorkload.get(technician.id) || 0;
        const maxTickets = this.assignmentRules.workload.maxConcurrentTickets;

        if (currentTickets >= maxTickets) return 0;

        const utilization = currentTickets / maxTickets;
        return Math.round((1 - utilization) * 100);
    }

    /**
     * Calculate location score
     */
    calculateLocationScore(ticket, technician) {
        if (!ticket.location || !technician.location) return 50;

        const distance = this.calculateDistance(
            ticket.location.lat,
            ticket.location.lon,
            technician.location.lat,
            technician.location.lon
        );

        const maxDistance = this.assignmentRules.location.maxDistance;
        const preferredDistance = this.assignmentRules.location.preferredDistance;

        if (distance > maxDistance) return 0;

        if (distance <= preferredDistance) return 100;

        // Linear decrease from preferred to max distance
        const score = 100 - ((distance - preferredDistance) / (maxDistance - preferredDistance)) * 100;
        return Math.round(score);
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculate availability score
     */
    calculateAvailabilityScore(technician) {
        const now = new Date();
        const currentHour = now.getHours();
        const workingHours = this.assignmentRules.availability.workingHours;

        // Check if within working hours
        if (currentHour < workingHours.start || currentHour >= workingHours.end) {
            return 0;
        }

        // Check if on break
        if (currentHour >= workingHours.breakTime.start && 
            currentHour < workingHours.breakTime.end) {
            return 50;
        }

        return 100;
    }

    /**
     * Calculate priority match score
     */
    calculatePriorityScore(ticket, technician) {
        const requiredLevel = this.assignmentRules.priority[ticket.priority]?.skillLevel;
        const techLevel = technician.skillLevel;

        const levels = ['junior', 'intermediate', 'senior', 'expert'];
        const requiredIndex = levels.indexOf(requiredLevel);
        const techIndex = levels.indexOf(techLevel);

        if (techIndex >= requiredIndex) return 100;

        // Penalty for lower skill level
        const difference = requiredIndex - techIndex;
        return Math.max(0, 100 - difference * 25);
    }

    /**
     * Get score details
     */
    getScoreDetails(ticket, technician) {
        return {
            skillMatch: this.calculateSkillScore(ticket, technician),
            workload: this.calculateWorkloadScore(technician),
            location: this.calculateLocationScore(ticket, technician),
            availability: this.calculateAvailabilityScore(technician),
            priorityMatch: this.calculatePriorityScore(ticket, technician)
        };
    }

    /**
     * Get assignment reason
     */
    getAssignmentReason(details) {
        const reasons = [];

        if (details.skillMatch > 80) reasons.push('Strong skill match');
        if (details.workload > 70) reasons.push('Good availability');
        if (details.location > 70) reasons.push('Proximity to location');
        if (details.availability > 80) reasons.push 'Available now';
        if (details.priorityMatch > 80) reasons.push('Qualified for priority');

        return reasons.join(', ') || 'Best available match';
    }

    /**
     * Calculate estimated response time
     */
    calculateResponseTime(ticket, technician) {
        const baseTime = this.assignmentRules.priority[ticket.priority]?.responseTime || 60;
        const locationScore = this.calculateLocationScore(ticket, technician);
        
        // Adjust based on location
        const locationFactor = locationScore / 100;
        const adjustedTime = baseTime / locationFactor;

        return Math.round(adjustedTime);
    }

    /**
     * Batch assign multiple tickets
     */
    async batchAssign(tickets, technicians) {
        const results = [];

        for (const ticket of tickets) {
            const result = await this.assignTicket(ticket, technicians);
            results.push(result);

            // Update workload after assignment
            if (result.assigned) {
                const currentWorkload = this.technicianWorkload.get(result.assignment.technicianId) || 0;
                this.technicianWorkload.set(result.assignment.technicianId, currentWorkload + 1);
            }
        }

        return results;
    }

    /**
     * Reassign ticket
     */
    async reassignTicket(ticketId, reason, technicians) {
        // Find current assignment
        const currentAssignment = this.assignmentHistory.find(
            a => a.ticketId === ticketId && !a.reassignedAt
        );

        if (currentAssignment) {
            // Mark as reassigned
            currentAssignment.reassignedAt = new Date().toISOString();
            currentAssignment.reassignmentReason = reason;

            // Decrease workload of previous technician
            const currentWorkload = this.technicianWorkload.get(currentAssignment.technicianId) || 0;
            this.technicianWorkload.set(currentAssignment.technicianId, Math.max(0, currentWorkload - 1));
        }

        // Get ticket details and reassign
        const ticket = { id: ticketId }; // In production, fetch actual ticket
        return await this.assignTicket(ticket, technicians);
    }

    /**
     * Update technician workload
     */
    updateWorkload(technicianId, delta) {
        const currentWorkload = this.technicianWorkload.get(technicianId) || 0;
        this.technicianWorkload.set(technicianId, Math.max(0, currentWorkload + delta));
    }

    /**
     * Get assignment statistics
     */
    getStatistics() {
        const totalAssignments = this.assignmentHistory.length;
        const successfulAssignments = this.assignmentHistory.filter(a => !a.reassignedAt).length;
        const reassignments = this.assignmentHistory.filter(a => a.reassignedAt).length;

        const averageScore = this.assignmentHistory.reduce((sum, a) => sum + a.score, 0) / totalAssignments;

        const assignmentsByTechnician = {};
        this.assignmentHistory.forEach(assignment => {
            const techId = assignment.technicianId;
            assignmentsByTechnician[techId] = (assignmentsByTechnician[techId] || 0) + 1;
        });

        return {
            totalAssignments,
            successfulAssignments,
            reassignments,
            reassignmentRate: (reassignments / totalAssignments * 100).toFixed(2),
            averageScore: averageScore.toFixed(2),
            assignmentsByTechnician,
            currentWorkload: Object.fromEntries(this.technicianWorkload)
        };
    }

    /**
     * Optimize assignments
     */
    async optimizeAssignments(tickets, technicians) {
        console.log('[Auto-Assignment] Optimizing assignments...');

        // Sort tickets by priority
        const sortedTickets = [...tickets].sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Assign in priority order
        const results = await this.batchAssign(sortedTickets, technicians);

        return {
            optimized: true,
            results,
            statistics: this.getStatistics()
        };
    }

    /**
     * Set custom assignment rules
     */
    setRules(rules) {
        this.assignmentRules = { ...this.assignmentRules, ...rules };
    }

    /**
     * Get assignment rules
     */
    getRules() {
        return this.assignmentRules;
    }

    /**
     * Clear assignment history
     */
    clearHistory() {
        this.assignmentHistory = [];
    }
}

// Create singleton instance
const autoAssignmentSystem = new AutoAssignmentSystem();

// Export for use in application
if (typeof window !== 'undefined') {
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.AutoAssignmentSystem = autoAssignmentSystem;
}
