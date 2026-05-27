/**
 * Smart ISP Platform - Charts Module
 * Performance-optimized chart rendering with lazy loading
 */

(function() {
    'use strict';

    // Chart Configuration
    const ChartConfig = {
        defaultColors: {
            primary: '#2563eb',
            secondary: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4'
        },
        animationDuration: 300,
        responsive: true,
        maintainAspectRatio: false
    };

    // Performance-optimized Chart Renderer
    const ChartRenderer = {
        charts: {},
        observer: null,

        init() {
            this.initIntersectionObserver();
            this.initResizeObserver();
        },

        // Lazy load charts using Intersection Observer
        initIntersectionObserver() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const chartId = entry.target.dataset.chartId;
                            if (chartId && !this.charts[chartId]) {
                                this.renderChart(chartId);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px',
                    threshold: 0.1
                });
            }
        },

        // Handle responsive resizing
        initResizeObserver() {
            if ('ResizeObserver' in window) {
                const resizeObserver = new ResizeObserver((entries) => {
                    entries.forEach(entry => {
                        const chartId = entry.target.dataset.chartId;
                        if (chartId && this.charts[chartId]) {
                            this.resizeChart(chartId);
                        }
                    });
                });

                document.querySelectorAll('[data-chart-id]').forEach(el => {
                    resizeObserver.observe(el);
                });
            }
        },

        // Register chart for lazy loading
        registerChart(containerId, config) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.dataset.chartId = containerId;
            container.dataset.chartConfig = JSON.stringify(config);

            if (this.observer) {
                this.observer.observe(container);
            } else {
                // Fallback for browsers without Intersection Observer
                this.renderChart(containerId);
            }
        },

        // Render chart when visible
        renderChart(chartId) {
            const container = document.getElementById(chartId);
            if (!container) return;

            try {
                const config = JSON.parse(container.dataset.chartConfig);
                const canvas = this.createCanvas(container);
                
                switch (config.type) {
                    case 'line':
                        this.renderLineChart(canvas, config);
                        break;
                    case 'bar':
                        this.renderBarChart(canvas, config);
                        break;
                    case 'pie':
                        this.renderPieChart(canvas, config);
                        break;
                    case 'doughnut':
                        this.renderDoughnutChart(canvas, config);
                        break;
                    case 'area':
                        this.renderAreaChart(canvas, config);
                        break;
                    default:
                        console.warn(`Unknown chart type: ${config.type}`);
                }

                this.charts[chartId] = {
                    canvas,
                    config,
                    container
                };

            } catch (error) {
                console.error(`Error rendering chart ${chartId}:`, error);
            }
        },

        createCanvas(container) {
            const canvas = document.createElement('canvas');
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            container.appendChild(canvas);
            return canvas;
        },

        resizeChart(chartId) {
            const chart = this.charts[chartId];
            if (!chart) return;

            const { canvas, container, config } = chart;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            // Re-render with new dimensions
            switch (config.type) {
                case 'line':
                    this.renderLineChart(canvas, config);
                    break;
                case 'bar':
                    this.renderBarChart(canvas, config);
                    break;
                case 'pie':
                    this.renderPieChart(canvas, config);
                    break;
                case 'doughnut':
                    this.renderDoughnutChart(canvas, config);
                    break;
                case 'area':
                    this.renderAreaChart(canvas, config);
                    break;
            }
        },

        // Simple line chart rendering (lightweight, no external dependencies)
        renderLineChart(canvas, config) {
            const ctx = canvas.getContext('2d');
            const { data, labels, colors } = config;
            const padding = 40;
            const width = canvas.width - padding * 2;
            const height = canvas.height - padding * 2;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw axes
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height + padding);
            ctx.lineTo(width + padding, height + padding);
            ctx.stroke();

            // Calculate scales
            const maxValue = Math.max(...data);
            const minValue = Math.min(...data);
            const range = maxValue - minValue || 1;

            // Draw line
            ctx.strokeStyle = colors?.[0] || ChartConfig.defaultColors.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((value, index) => {
                const x = padding + (index / (data.length - 1)) * width;
                const y = padding + height - ((value - minValue) / range) * height;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Draw points
            data.forEach((value, index) => {
                const x = padding + (index / (data.length - 1)) * width;
                const y = padding + height - ((value - minValue) / range) * height;

                ctx.fillStyle = colors?.[0] || ChartConfig.defaultColors.primary;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw labels
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';

            labels.forEach((label, index) => {
                const x = padding + (index / (labels.length - 1)) * width;
                ctx.fillText(label, x, height + padding + 20);
            });
        },

        // Simple bar chart rendering
        renderBarChart(canvas, config) {
            const ctx = canvas.getContext('2d');
            const { data, labels, colors } = config;
            const padding = 40;
            const width = canvas.width - padding * 2;
            const height = canvas.height - padding * 2;
            const barWidth = width / data.length - 10;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw axes
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height + padding);
            ctx.lineTo(width + padding, height + padding);
            ctx.stroke();

            // Calculate scales
            const maxValue = Math.max(...data);

            // Draw bars
            data.forEach((value, index) => {
                const x = padding + index * (width / data.length) + 5;
                const barHeight = (value / maxValue) * height;
                const y = padding + height - barHeight;

                ctx.fillStyle = colors?.[index % colors.length] || ChartConfig.defaultColors.primary;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Draw value
                ctx.fillStyle = '#64748b';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(value, x + barWidth / 2, y - 5);

                // Draw label
                ctx.fillText(labels[index], x + barWidth / 2, height + padding + 20);
            });
        },

        // Simple pie chart rendering
        renderPieChart(canvas, config) {
            const ctx = canvas.getContext('2d');
            const { data, labels, colors } = config;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 40;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const total = data.reduce((sum, value) => sum + value, 0);
            let startAngle = -Math.PI / 2;

            data.forEach((value, index) => {
                const sliceAngle = (value / total) * Math.PI * 2;
                const endAngle = startAngle + sliceAngle;

                ctx.fillStyle = colors?.[index % colors.length] || ChartConfig.defaultColors.primary;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();

                // Draw label
                const labelAngle = startAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

                ctx.fillStyle = '#ffffff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);

                startAngle = endAngle;
            });
        },

        // Doughnut chart
        renderDoughnutChart(canvas, config) {
            const ctx = canvas.getContext('2d');
            const { data, labels, colors } = config;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const outerRadius = Math.min(centerX, centerY) - 40;
            const innerRadius = outerRadius * 0.6;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const total = data.reduce((sum, value) => sum + value, 0);
            let startAngle = -Math.PI / 2;

            data.forEach((value, index) => {
                const sliceAngle = (value / total) * Math.PI * 2;
                const endAngle = startAngle + sliceAngle;

                ctx.fillStyle = colors?.[index % colors.length] || ChartConfig.defaultColors.primary;
                ctx.beginPath();
                ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
                ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fill();

                startAngle = endAngle;
            });

            // Draw center text
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total, centerX, centerY);
        },

        // Area chart
        renderAreaChart(canvas, config) {
            const ctx = canvas.getContext('2d');
            const { data, labels, colors } = config;
            const padding = 40;
            const width = canvas.width - padding * 2;
            const height = canvas.height - padding * 2;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw axes
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height + padding);
            ctx.lineTo(width + padding, height + padding);
            ctx.stroke();

            // Calculate scales
            const maxValue = Math.max(...data);
            const minValue = Math.min(...data);
            const range = maxValue - minValue || 1;

            // Draw area
            ctx.fillStyle = (colors?.[0] || ChartConfig.defaultColors.primary) + '20';
            ctx.beginPath();

            data.forEach((value, index) => {
                const x = padding + (index / (data.length - 1)) * width;
                const y = padding + height - ((value - minValue) / range) * height;

                if (index === 0) {
                    ctx.moveTo(x, height + padding);
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.lineTo(padding + width, height + padding);
            ctx.closePath();
            ctx.fill();

            // Draw line on top
            ctx.strokeStyle = colors?.[0] || ChartConfig.defaultColors.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((value, index) => {
                const x = padding + (index / (data.length - 1)) * width;
                const y = padding + height - ((value - minValue) / range) * height;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        },

        // Destroy chart
        destroyChart(chartId) {
            const chart = this.charts[chartId];
            if (chart) {
                if (this.observer) {
                    this.observer.unobserve(chart.container);
                }
                delete this.charts[chartId];
            }
        },

        // Destroy all charts
        destroyAll() {
            Object.keys(this.charts).forEach(chartId => {
                this.destroyChart(chartId);
            });
        }
    };

    // Initialize charts module
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ChartRenderer.init();
        });
    } else {
        ChartRenderer.init();
    }

    // Expose to global scope
    window.SmartISP = window.SmartISP || {};
    window.SmartISP.ChartRenderer = ChartRenderer;
    window.SmartISP.ChartConfig = ChartConfig;

})();
