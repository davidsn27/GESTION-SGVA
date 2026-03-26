// Interactive Dashboard System - Dashboard interactivo con drill-down
class InteractiveDashboard {
    constructor() {
        this.charts = new Map();
        this.drilldownData = new Map();
        this.currentDrilldown = null;
        this.animationDuration = 1000;
        this.init();
    }

    init() {
        this.setupCharts();
        this.setupDrilldownEvents();
        this.setupRealTimeUpdates();
        this.setupKeyboardNavigation();
        this.loadDashboardSettings();
    }

    // Configurar gráficos
    setupCharts() {
        // Esperar a que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.setupCharts(), 100);
            return;
        }

        // Configurar gráfico de estados
        this.setupEstadosChart();
        
        // Configurar gráfico de evolución
        this.setupEvolucionChart();
        
        // Configurar gráfico de empresas
        this.setupEmpresasChart();
        
        // Configurar gráfico de programas
        this.setupProgramasChart();
    }

    // Configurar gráfico de estados
    setupEstadosChart() {
        const ctx = document.getElementById('estadosChart');
        if (!ctx) return;

        const data = {
            labels: ['Disponible', 'Inhabilitado', 'Proceso Selección', 'Proceso Abierto', 'Sin Contrato'],
            datasets: [{
                label: 'Aprendices por Estado',
                data: [45, 12, 28, 15, 8],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(23, 162, 184, 0.8)',
                    'rgba(108, 117, 125, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(108, 117, 125, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const estado = data.labels[index];
                        this.drilldownEstados(estado);
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: this.animationDuration
                }
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set('estados', chart);
    }

    // Configurar gráfico de evolución
    setupEvolucionChart() {
        const ctx = document.getElementById('evolucionChart');
        if (!ctx) return;

        const data = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Aprendices Activos',
                data: [65, 72, 78, 85, 89, 95],
                borderColor: 'rgba(0, 123, 255, 1)',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }, {
                label: 'Empresas Vinculadas',
                data: [12, 15, 18, 22, 25, 28],
                borderColor: 'rgba(40, 167, 69, 1)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const datasetIndex = elements[0].datasetIndex;
                        const index = elements[0].index;
                        const month = data.labels[index];
                        const dataset = data.datasets[datasetIndex];
                        this.drilldownEvolucion(month, dataset.label, dataset.data[index]);
                    }
                },
                animation: {
                    duration: this.animationDuration
                }
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set('evolucion', chart);
    }

    // Configurar gráfico de empresas
    setupEmpresasChart() {
        const ctx = document.getElementById('empresasChart');
        if (!ctx) return;

        const data = {
            labels: ['Tech Solutions', 'Marketing Digital', 'Design Studio', 'Data Analytics', 'Cloud Systems'],
            datasets: [{
                label: 'Aprendices por Empresa',
                data: [15, 12, 8, 6, 4],
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const empresa = data.labels[index];
                        this.drilldownEmpresas(empresa);
                    }
                },
                animation: {
                    duration: this.animationDuration
                }
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set('empresas', chart);
    }

    // Configurar gráfico de programas
    setupProgramasChart() {
        const ctx = document.getElementById('programasChart');
        if (!ctx) return;

        const data = {
            labels: ['Programación', 'Diseño', 'Marketing', 'Datos', 'Redes'],
            datasets: [{
                label: 'Aprendices por Programa',
                data: [25, 20, 18, 15, 12],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        };

        const config = {
            type: 'polarArea',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const programa = data.labels[index];
                        this.drilldownProgramas(programa);
                    }
                },
                animation: {
                    duration: this.animationDuration
                }
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set('programas', chart);
    }

    // Configurar eventos de drilldown
    setupDrilldownEvents() {
        // Botón de volver
        document.addEventListener('click', (e) => {
            if (e.target.matches('.drilldown-back, .drilldown-back *')) {
                this.goBack();
            }
        });

        // Botón de reset
        document.addEventListener('click', (e) => {
            if (e.target.matches('.dashboard-reset, .dashboard-reset *')) {
                this.resetDashboard();
            }
        });
    }

    // Configurar actualizaciones en tiempo real
    setupRealTimeUpdates() {
        // Simular actualizaciones cada 30 segundos
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);

        // Escuchar eventos personalizados
        window.addEventListener('dashboardUpdate', (e) => {
            this.handleDashboardUpdate(e.detail);
        });
    }

    // Configurar navegación por teclado
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+R para resetear dashboard
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.resetDashboard();
            }

            // Esc para volver del drilldown
            if (e.key === 'Escape' && this.currentDrilldown) {
                this.goBack();
            }
        });
    }

    // Cargar configuración del dashboard
    loadDashboardSettings() {
        const settings = localStorage.getItem('dashboard-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.animationDuration = parsed.animationDuration || 1000;
            this.autoRefresh = parsed.autoRefresh !== false;
        }
    }

    // Drilldown en gráfico de estados
    drilldownEstados(estado) {
        this.showDrilldownLoading();
        
        // Simular carga de datos
        setTimeout(() => {
            const aprendices = this.getAprendicesByEstado(estado);
            this.showDrilldownModal('Aprendices - ' + estado, aprendices, this.createAprendicesTable(aprendices));
            this.currentDrilldown = { type: 'estado', value: estado };
        }, 500);
    }

    // Drilldown en gráfico de evolución
    drilldownEvolucion(month, dataset, value) {
        this.showDrilldownLoading();
        
        setTimeout(() => {
            const details = this.getEvolucionDetails(month, dataset);
            this.showDrilldownModal(`${dataset} - ${month}`, details, this.createEvolucionTable(details));
            this.currentDrilldown = { type: 'evolucion', month, dataset };
        }, 500);
    }

    // Drilldown en gráfico de empresas
    drilldownEmpresas(empresa) {
        this.showDrilldownLoading();
        
        setTimeout(() => {
            const aprendices = this.getAprendicesByEmpresa(empresa);
            this.showDrilldownModal('Aprendices - ' + empresa, aprendices, this.createAprendicesTable(aprendices));
            this.currentDrilldown = { type: 'empresa', value: empresa };
        }, 500);
    }

    // Drilldown en gráfico de programas
    drilldownProgramas(programa) {
        this.showDrilldownLoading();
        
        setTimeout(() => {
            const aprendices = this.getAprendicesByPrograma(programa);
            this.showDrilldownModal('Aprendices - ' + programa, aprendices, this.createAprendicesTable(aprendices));
            this.currentDrilldown = { type: 'programa', value: programa };
        }, 500);
    }

    // Obtener aprendices por estado (simulado)
    getAprendicesByEstado(estado) {
        const mockData = [
            { id: 1, nombre: 'Juan Pérez', documento: '12345678', programa: 'Programación', empresa: 'Tech Solutions' },
            { id: 2, nombre: 'María García', documento: '87654321', programa: 'Diseño', empresa: 'Design Studio' },
            { id: 3, nombre: 'Carlos Rodríguez', documento: '45678912', programa: 'Marketing', empresa: 'Marketing Digital' }
        ];
        
        return mockData.filter(aprendiz => {
            // Simular filtrado por estado
            return Math.random() > 0.3;
        });
    }

    // Obtener aprendices por empresa (simulado)
    getAprendicesByEmpresa(empresa) {
        const mockData = [
            { id: 1, nombre: 'Juan Pérez', documento: '12345678', programa: 'Programación', estado: 'Disponible' },
            { id: 2, nombre: 'Ana López', documento: '23456789', programa: 'Datos', estado: 'Proceso Selección' },
            { id: 3, nombre: 'Luis Martínez', documento: '34567890', programa: 'Redes', estado: 'Disponible' }
        ];
        
        return mockData.filter(aprendiz => aprendiz.empresa === empresa);
    }

    // Obtener aprendices por programa (simulado)
    getAprendicesByPrograma(programa) {
        const mockData = [
            { id: 1, nombre: 'Juan Pérez', documento: '12345678', empresa: 'Tech Solutions', estado: 'Disponible' },
            { id: 2, nombre: 'Sofía Ramírez', documento: '56789012', empresa: 'Data Analytics', estado: 'Proceso Abierto' },
            { id: 3, nombre: 'Diego Herrera', documento: '67890123', empresa: 'Cloud Systems', estado: 'Disponible' }
        ];
        
        return mockData.filter(aprendiz => aprendiz.programa === programa);
    }

    // Obtener detalles de evolución (simulado)
    getEvolucionDetails(month, dataset) {
        return {
            month,
            dataset,
            value: Math.floor(Math.random() * 50) + 10,
            change: (Math.random() * 20 - 10).toFixed(1),
            details: [
                { metric: 'Nuevos ingresos', value: Math.floor(Math.random() * 10) + 1 },
                { metric: 'Finalizados', value: Math.floor(Math.random() * 5) + 1 },
                { metric: 'Activos', value: Math.floor(Math.random() * 30) + 20 }
            ]
        };
    }

    // Crear tabla de aprendices
    createAprendicesTable(aprendices) {
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Documento</th>
                            <th>Programa</th>
                            <th>Empresa</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        aprendices.forEach(aprendiz => {
            html += `
                <tr>
                    <td>${aprendiz.id}</td>
                    <td>${aprendiz.nombre}</td>
                    <td>${aprendiz.documento}</td>
                    <td>${aprendiz.programa}</td>
                    <td>${aprendiz.empresa}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.location.href='/aprendiz/${aprendiz.id}/'">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="window.location.href='/aprendiz/${aprendiz.id}/editar/'">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    // Crear tabla de evolución
    createEvolucionTable(details) {
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Resumen</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Mes:</strong> ${details.month}</p>
                            <p><strong>Dataset:</strong> ${details.dataset}</p>
                            <p><strong>Valor:</strong> ${details.value}</p>
                            <p><strong>Cambio:</strong> <span class="${details.change >= 0 ? 'text-success' : 'text-danger'}">${details.change}%</span></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Detalles</h6>
                        </div>
                        <div class="card-body">
        `;

        details.details.forEach(detail => {
            html += `<p><strong>${detail.metric}:</strong> ${detail.value}</p>`;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    // Mostrar loading de drilldown
    showDrilldownLoading() {
        const modal = document.getElementById('drilldownModal');
        if (!modal) {
            this.createDrilldownModal();
        }
        
        const modalBody = document.querySelector('#drilldownModal .modal-body');
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3">Cargando detalles...</p>
            </div>
        `;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    // Mostrar modal de drilldown
    showDrilldownModal(title, data, content) {
        const modal = document.getElementById('drilldownModal');
        const modalTitle = document.querySelector('#drilldownModal .modal-title');
        const modalBody = document.querySelector('#drilldownModal .modal-body');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    // Crear modal de drilldown
    createDrilldownModal() {
        const modalHtml = `
            <div class="modal fade" id="drilldownModal" tabindex="-1" aria-labelledby="drilldownModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="drilldownModalLabel">Detalles</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- El contenido se cargará dinámicamente -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary drilldown-back">
                                <i class="fas fa-arrow-left me-2"></i>Volver
                            </button>
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Volver atrás
    goBack() {
        if (this.currentDrilldown) {
            this.currentDrilldown = null;
            const modal = bootstrap.Modal.getInstance(document.getElementById('drilldownModal'));
            if (modal) {
                modal.hide();
            }
        }
    }

    // Resetear dashboard
    resetDashboard() {
        // Resetear todos los gráficos
        this.charts.forEach(chart => {
            chart.reset();
            chart.update();
        });
        
        // Limpiar drilldown actual
        this.currentDrilldown = null;
        
        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
            window.showNotification('Dashboard reseteado', 'info');
        }
    }

    // Actualizar datos en tiempo real
    updateRealTimeData() {
        // Simular actualización de datos
        this.charts.forEach((chart, key) => {
            // Actualizar datos aleatoriamente para simular cambios
            chart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(value => {
                    const change = (Math.random() - 0.5) * 10;
                    return Math.max(0, value + change);
                });
            });
            
            chart.update('none'); // Actualizar sin animación para no interrumpir
        });
        
        // Actualizar contadores
        this.updateCounters();
    }

    // Actualizar contadores
    updateCounters() {
        document.querySelectorAll('.dashboard-counter').forEach(counter => {
            const currentValue = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
            const newValue = Math.max(0, currentValue + Math.floor((Math.random() - 0.5) * 5));
            
            if (typeof window.animationManager !== 'undefined') {
                window.animationManager.animateNumber(counter, newValue, 500);
            } else {
                counter.textContent = newValue.toLocaleString('es-CO');
            }
        });
    }

    // Manejar actualización del dashboard
    handleDashboardUpdate(data) {
        switch (data.type) {
            case 'new_aprendiz':
                this.addNewAprendiz(data.aprendiz);
                break;
            case 'estado_change':
                this.updateEstado(data.aprendizId, data.newEstado);
                break;
            case 'new_empresa':
                this.addNewEmpresa(data.empresa);
                break;
        }
    }

    // Agregar nuevo aprendiz
    addNewAprendiz(aprendiz) {
        // Actualizar contadores
        const totalCounter = document.querySelector('[data-counter="total"]');
        if (totalCounter) {
            const currentValue = parseInt(totalCounter.textContent.replace(/[^0-9]/g, ''));
            totalCounter.textContent = (currentValue + 1).toLocaleString('es-CO');
        }
        
        // Actualizar gráficos
        this.updateRealTimeData();
        
        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Nuevo aprendiz agregado: ${aprendiz.nombre}`, 'success');
        }
    }

    // Actualizar estado
    updateEstado(aprendizId, newEstado) {
        // Actualizar gráfico de estados
        const estadosChart = this.charts.get('estados');
        if (estadosChart) {
            // Lógica para actualizar el gráfico de estados
            this.updateRealTimeData();
        }
        
        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Estado actualizado a: ${newEstado}`, 'info');
        }
    }

    // Agregar nueva empresa
    addNewEmpresa(empresa) {
        // Actualizar contadores
        const empresasCounter = document.querySelector('[data-counter="empresas"]');
        if (empresasCounter) {
            const currentValue = parseInt(empresasCounter.textContent.replace(/[^0-9]/g, ''));
            empresasCounter.textContent = (currentValue + 1).toLocaleString('es-CO');
        }
        
        // Actualizar gráficos
        this.updateRealTimeData();
        
        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Nueva empresa agregada: ${empresa.nombre}`, 'success');
        }
    }

    // Exportar dashboard
    exportDashboard(format = 'png') {
        const dashboard = document.querySelector('.container');
        
        if (format === 'png' && typeof html2canvas !== 'undefined') {
            html2canvas(dashboard).then(canvas => {
                const link = document.createElement('a');
                link.download = `dashboard_${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        } else if (typeof window.exportManager !== 'undefined') {
            window.exportManager.exportDashboard('dashboard');
        }
    }

    // Inicializar dashboard
    static init() {
        const dashboard = new InteractiveDashboard();
        window.interactiveDashboard = dashboard;
        return dashboard;
    }
}

// CSS para el dashboard interactivo
const dashboardCSS = `
.dashboard-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.dashboard-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0.5rem 1rem var(--shadow-color);
}

.dashboard-card .card-body {
    position: relative;
}

.dashboard-card .drilldown-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.dashboard-card:hover .drilldown-indicator {
    opacity: 1;
}

.chart-container {
    position: relative;
    height: 300px;
    margin: 1rem 0;
}

.chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.dashboard-counter {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
}

.dashboard-controls {
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.dashboard-controls .btn {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0.25rem 0.5rem var(--shadow-color);
}

#drilldownModal .modal-dialog {
    max-width: 90vw;
}

#drilldownModal .table-responsive {
    max-height: 60vh;
    overflow-y: auto;
}

.drilldown-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.drilldown-stat {
    text-align: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
}

.drilldown-stat .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.drilldown-stat .label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

@media (max-width: 768px) {
    .dashboard-controls {
        top: auto;
        bottom: 20px;
        right: 20px;
        flex-direction: row;
    }
    
    #drilldownModal .modal-dialog {
        max-width: 95vw;
        margin: 1rem;
    }
    
    .chart-container {
        height: 250px;
    }
    
    .drilldown-stats {
        grid-template-columns: 1fr;
    }
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    InteractiveDashboard.init();
});

// Exportar para uso global
window.InteractiveDashboard = InteractiveDashboard;
