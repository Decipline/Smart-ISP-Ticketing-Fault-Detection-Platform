/**
 * Smart ISP Platform - Ticket Management Module
 * Secure ticket handling with validation and performance optimization
 */

(function() {
    'use strict';

    // Ticket State Management
    const TicketState = {
        tickets: [],
        currentTicket: null,
        filters: {
            status: 'all',
            priority: 'all',
            dateRange: null
        },
        pagination: {
            page: 1,
            perPage: 20,
            total: 0
        }
    };

    // Security Validation
    const TicketValidator = {
        validateTicketData(data) {
            const errors = [];
            
            if (!data.subject || data.subject.trim().length === 0) {
                errors.push('Subject is required');
            } else if (data.subject.length > 200) {
                errors.push('Subject must be less than 200 characters');
            }
            
            if (!data.description || data.description.trim().length === 0) {
                errors.push('Description is required');
            } else if (data.description.length > 5000) {
                errors.push('Description must be less than 5000 characters');
            }
            
            if (!data.customerId) {
                errors.push('Customer ID is required');
            }
            
            if (!data.priority || !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
                errors.push('Valid priority is required');
            }
            
            if (!data.category) {
                errors.push('Category is required');
            }
            
            return {
                isValid: errors.length === 0,
                errors
            };
        },
        
        sanitizeInput(input) {
            if (typeof input !== 'string') return input;
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .trim();
        },
        
        validateCustomerId(id) {
            return /^[A-Z0-9]{6,12}$/.test(id);
        },
        
        validateTicketId(id) {
            return /^TKT-[0-9]{6}$/.test(id);
        }
    };

    // Ticket Service
    const TicketService = {
        async createTicket(ticketData) {
            // Validate input
            const validation = TicketValidator.validateTicketData(ticketData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Sanitize input
            const sanitizedData = {
                subject: TicketValidator.sanitizeInput(ticketData.subject),
                description: TicketValidator.sanitizeInput(ticketData.description),
                customerId: TicketValidator.sanitizeInput(ticketData.customerId),
                priority: ticketData.priority,
                category: ticketData.category,
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                id: this.generateTicketId()
            };
            
            // In production, this would be an API call
            await this.simulateNetworkDelay();
            
            // Add to state
            TicketState.tickets.unshift(sanitizedData);
            
            return sanitizedData;
        },
        
        async updateTicket(ticketId, updates) {
            if (!TicketValidator.validateTicketId(ticketId)) {
                throw new Error('Invalid ticket ID format');
            }
            
            const ticketIndex = TicketState.tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex === -1) {
                throw new Error('Ticket not found');
            }
            
            // Validate updates
            const allowedUpdates = ['status', 'priority', 'assignedTo', 'resolution'];
            const validUpdates = {};
            
            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    validUpdates[key] = TicketValidator.sanitizeInput(updates[key]);
                }
            }
            
            validUpdates.updatedAt = new Date().toISOString();
            
            // Update ticket
            TicketState.tickets[ticketIndex] = {
                ...TicketState.tickets[ticketIndex],
                ...validUpdates
            };
            
            await this.simulateNetworkDelay();
            
            return TicketState.tickets[ticketIndex];
        },
        
        async getTickets(filters = {}) {
            await this.simulateNetworkDelay();
            
            let filteredTickets = [...TicketState.tickets];
            
            // Apply filters
            if (filters.status && filters.status !== 'all') {
                filteredTickets = filteredTickets.filter(t => t.status === filters.status);
            }
            
            if (filters.priority && filters.priority !== 'all') {
                filteredTickets = filteredTickets.filter(t => t.priority === filters.priority);
            }
            
            if (filters.customerId) {
                filteredTickets = filteredTickets.filter(t => 
                    t.customerId === filters.customerId
                );
            }
            
            // Update pagination
            TicketState.pagination.total = filteredTickets.length;
            
            // Apply pagination
            const start = (filters.page || 1) * (filters.perPage || 20) - (filters.perPage || 20);
            const end = start + (filters.perPage || 20);
            
            return {
                tickets: filteredTickets.slice(start, end),
                pagination: {
                    page: filters.page || 1,
                    perPage: filters.perPage || 20,
                    total: filteredTickets.length
                }
            };
        },
        
        async getTicketById(ticketId) {
            if (!TicketValidator.validateTicketId(ticketId)) {
                throw new Error('Invalid ticket ID format');
            }
            
            await this.simulateNetworkDelay();
            
            const ticket = TicketState.tickets.find(t => t.id === ticketId);
            if (!ticket) {
                throw new Error('Ticket not found');
            }
            
            return ticket;
        },
        
        async deleteTicket(ticketId) {
            if (!TicketValidator.validateTicketId(ticketId)) {
                throw new Error('Invalid ticket ID format');
            }
            
            const ticketIndex = TicketState.tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex === -1) {
                throw new Error('Ticket not found');
            }
            
            await this.simulateNetworkDelay();
            
            TicketState.tickets.splice(ticketIndex, 1);
            
            return { success: true };
        },
        
        generateTicketId() {
            const timestamp = Date.now().toString().slice(-6);
            return `TKT-${timestamp}`;
        },
        
        simulateNetworkDelay() {
            return new Promise(resolve => setTimeout(resolve, 300));
        },
        
        // Initialize with sample data
        initializeSampleData() {
            const sampleTickets = [
                {
                    id: 'TKT-824731',
                    subject: 'Internet connection intermittent',
                    description: 'Customer reports frequent disconnections throughout the day',
                    customerId: 'CUST001',
                    priority: 'high',
                    category: 'connectivity',
                    status: 'open',
                    assignedTo: null,
                    createdAt: '2026-05-27T06:30:00Z',
                    updatedAt: '2026-05-27T06:30:00Z'
                },
                {
                    id: 'TKT-824732',
                    subject: 'Slow internet speed',
                    description: 'Download speed is significantly lower than subscribed plan',
                    customerId: 'CUST002',
                    priority: 'medium',
                    category: 'performance',
                    status: 'in_progress',
                    assignedTo: 'TECH001',
                    createdAt: '2026-05-27T05:45:00Z',
                    updatedAt: '2026-05-27T06:15:00Z'
                },
                {
                    id: 'TKT-824733',
                    subject: 'No internet access',
                    description: 'Complete loss of internet connectivity',
                    customerId: 'CUST003',
                    priority: 'critical',
                    category: 'outage',
                    status: 'open',
                    assignedTo: null,
                    createdAt: '2026-05-27T06:00:00Z',
                    updatedAt: '2026-05-27T06:00:00Z'
                }
            ];
            
            TicketState.tickets = sampleTickets;
        }
    };

    // Ticket UI Controller
    const TicketUI = {
        init() {
            this.bindEvents();
            TicketService.initializeSampleData();
            this.loadTickets();
        },
        
        bindEvents() {
            // Create ticket form
            const createForm = document.getElementById('create-ticket-form');
            if (createForm) {
                createForm.addEventListener('submit', this.handleCreateTicket.bind(this));
            }
            
            // Filter controls
            const statusFilter = document.getElementById('status-filter');
            const priorityFilter = document.getElementById('priority-filter');
            
            if (statusFilter) {
                statusFilter.addEventListener('change', this.handleFilterChange.bind(this));
            }
            
            if (priorityFilter) {
                priorityFilter.addEventListener('change', this.handleFilterChange.bind(this));
            }
            
            // Search
            const searchInput = document.getElementById('ticket-search');
            if (searchInput) {
                searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
            }
        },
        
        async handleCreateTicket(e) {
            e.preventDefault();
            
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            // Gather form data
            const ticketData = {
                subject: form.subject.value,
                description: form.description.value,
                customerId: form.customerId.value,
                priority: form.priority.value,
                category: form.category.value
            };
            
            // Disable button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            
            try {
                const ticket = await TicketService.createTicket(ticketData);
                this.showNotification('Ticket created successfully', 'success');
                form.reset();
                this.loadTickets();
            } catch (error) {
                this.showNotification(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Ticket';
            }
        },
        
        async handleFilterChange(e) {
            const status = document.getElementById('status-filter')?.value || 'all';
            const priority = document.getElementById('priority-filter')?.value || 'all';
            
            await this.loadTickets({ status, priority });
        },
        
        async handleSearch(e) {
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                await this.loadTickets();
                return;
            }
            
            // Search in tickets
            const filtered = TicketState.tickets.filter(t => 
                t.subject.toLowerCase().includes(query.toLowerCase()) ||
                t.description.toLowerCase().includes(query.toLowerCase()) ||
                t.customerId.toLowerCase().includes(query.toLowerCase())
            );
            
            this.renderTicketList(filtered);
        },
        
        async loadTickets(filters = {}) {
            try {
                const result = await TicketService.getTickets(filters);
                this.renderTicketList(result.tickets);
                this.renderPagination(result.pagination);
            } catch (error) {
                this.showNotification('Failed to load tickets', 'error');
            }
        },
        
        renderTicketList(tickets) {
            const container = document.getElementById('ticket-list');
            if (!container) return;
            
            if (tickets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No tickets found</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = tickets.map(ticket => `
                <div class="ticket-item" data-ticket-id="${ticket.id}">
                    <div class="ticket-info">
                        <div class="ticket-id">${ticket.id}</div>
                        <div class="ticket-subject">${this.escapeHtml(ticket.subject)}</div>
                        <div class="ticket-customer">${ticket.customerId}</div>
                    </div>
                    <div class="ticket-meta">
                        <span class="ticket-priority ${ticket.priority}">${ticket.priority}</span>
                        <span class="badge badge-${this.getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
                        <span class="ticket-time">${this.formatDate(ticket.createdAt)}</span>
                    </div>
                    <div class="ticket-actions">
                        <button class="action-btn" onclick="SmartISP.TicketUI.viewTicket('${ticket.id}')">View</button>
                        <button class="action-btn" onclick="SmartISP.TicketUI.editTicket('${ticket.id}')">Edit</button>
                    </div>
                </div>
            `).join('');
        },
        
        renderPagination(pagination) {
            const container = document.getElementById('ticket-pagination');
            if (!container) return;
            
            const totalPages = Math.ceil(pagination.total / pagination.perPage);
            
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }
            
            let html = '<div class="pagination">';
            
            // Previous button
            html += `<button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} 
                     onclick="SmartISP.TicketUI.goToPage(${pagination.page - 1})">Previous</button>`;
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="pagination-btn ${i === pagination.page ? 'active' : ''}" 
                         onclick="SmartISP.TicketUI.goToPage(${i})">${i}</button>`;
            }
            
            // Next button
            html += `<button class="pagination-btn" ${pagination.page === totalPages ? 'disabled' : ''} 
                     onclick="SmartISP.TicketUI.goToPage(${pagination.page + 1})">Next</button>`;
            
            html += '</div>';
            container.innerHTML = html;
        },
        
        async goToPage(page) {
            const status = document.getElementById('status-filter')?.value || 'all';
            const priority = document.getElementById('priority-filter')?.value || 'all';
            
            await this.loadTickets({ status, priority, page });
        },
        
        async viewTicket(ticketId) {
            try {
                const ticket = await TicketService.getTicketById(ticketId);
                // Show ticket details modal
                console.log('View ticket:', ticket);
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        },
        
        async editTicket(ticketId) {
            try {
                const ticket = await TicketService.getTicketById(ticketId);
                // Show edit modal
                console.log('Edit ticket:', ticket);
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        },
        
        showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type}`;
            notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.top = '1rem';
            notification.style.right = '1rem';
            notification.style.zIndex = '9999';
            notification.style.animation = 'slideInRight 0.3s ease';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        getStatusBadgeClass(status) {
            const classes = {
                open: 'info',
                in_progress: 'warning',
                resolved: 'success',
                closed: 'secondary'
            };
            return classes[status] || 'info';
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
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TicketUI.init();
        });
    } else {
        TicketUI.init();
    }

    // Expose to global scope
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.TicketService = TicketService;
    window.SmartISP.TicketUI = TicketUI;
    window.SmartISP.TicketValidator = TicketValidator;

})();
