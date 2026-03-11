/**
 * ===================================
 * EFECTOS DE CARGA - LOADING MANAGER
 * ===================================
 */

class LoadingManager {
    constructor() {
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupFormHandlers();
        this.setupButtonHandlers();
        this.setupAjaxHandlers();
    }

    /**
     * Crear overlay de carga global
     */
    createOverlay() {
        if (document.getElementById('loadingOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Procesando...</div>
                <div class="loading-subtext">Por favor, espera un momento</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Mostrar overlay de carga
     */
    showLoading(text = 'Procesando...', subtext = 'Por favor, espera un momento') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.querySelector('.loading-text').textContent = text;
            overlay.querySelector('.loading-subtext').textContent = subtext;
            overlay.classList.add('active');
        }
    }

    /**
     * Ocultar overlay de carga
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Configurar handlers para formularios
     */
    setupFormHandlers() {
        // Formularios POST
        document.querySelectorAll('form[method="post"]').forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    this.handleFormSubmit(submitBtn, e);
                }
            });
        });

        // Formularios con enctype (para archivos)
        document.querySelectorAll('form[enctype]').forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    this.handleFileUpload(submitBtn, e);
                }
            });
        });
    }

    /**
     * Configurar handlers para botones
     */
    setupButtonHandlers() {
        // Botones de eliminación
        document.querySelectorAll('.btn-danger, .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.form || btn.onclick) {
                    this.handleDeleteAction(btn, e);
                }
            });
        });

        // Botones de búsqueda
        document.querySelectorAll('.btn-search, .btn-primary[type="submit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.form) {
                    this.handleSearchAction(btn, e);
                }
            });
        });
    }

    /**
     * Configurar handlers para AJAX
     */
    setupAjaxHandlers() {
        // Intercepter peticiones fetch
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            this.showAjaxLoading();
            return originalFetch(...args)
                .finally(() => {
                    this.hideAjaxLoading();
                });
        };

        // Intercepter peticiones XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this.addEventListener('loadstart', () => {
                window.loadingManager.showAjaxLoading();
            });
            this.addEventListener('loadend', () => {
                window.loadingManager.hideAjaxLoading();
            });
            return originalXHROpen.apply(this, arguments);
        };
    }

    /**
     * Manejar envío de formulario
     */
    handleFormSubmit(button, event) {
        const form = button.form;
        const action = form.action || '';
        const buttonText = button.innerHTML;

        // Determinar tipo de acción
        let loadingText = 'Guardando...';
        let loadingClass = 'loading-save';

        if (action.includes('eliminar') || button.classList.contains('btn-danger')) {
            loadingText = 'Eliminando...';
            loadingClass = 'loading-delete';
        } else if (action.includes('editar') || action.includes('update')) {
            loadingText = 'Actualizando...';
            loadingClass = 'loading-save';
        } else if (action.includes('buscar') || action.includes('search')) {
            loadingText = 'Buscando...';
            loadingClass = 'loading-search';
        }

        // Aplicar efecto de carga al botón
        this.setButtonLoading(button, loadingText, loadingClass);

        // Mostrar overlay para acciones que toman tiempo
        if (action.includes('eliminar') || form.querySelector('input[type="file"]')) {
            this.showLoading(loadingText);
        }
    }

    /**
     * Manejar carga de archivos
     */
    handleFileUpload(button, event) {
        const fileInput = event.target.querySelector('input[type="file"]');
        const file = fileInput?.files[0];

        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            const loadingText = `Subiendo archivo (${fileSize} MB)...`;
            
            this.setButtonLoading(button, loadingText, 'loading-upload');
            this.showLoading('Subiendo archivo', `Procesando: ${file.name}`);
        }
    }

    /**
     * Manejar acción de eliminación
     */
    handleDeleteAction(button, event) {
        const confirmMessage = button.dataset.confirm || '¿Estás seguro de eliminar este elemento?';
        
        if (confirm(confirmMessage)) {
            this.setButtonLoading(button, 'Eliminando...', 'loading-delete');
            this.showLoading('Eliminando', 'Por favor, espera...');
        } else {
            event.preventDefault();
        }
    }

    /**
     * Manejar acción de búsqueda
     */
    handleSearchAction(button, event) {
        this.setButtonLoading(button, 'Buscando...', 'loading-search');
        
        // Para búsquedas, mostrar un indicador sutil
        setTimeout(() => {
            this.hideLoading();
        }, 1000);
    }

    /**
     * Establecer estado de carga en botón
     */
    setButtonLoading(button, text, className = '') {
        button.classList.add('btn-loading', className);
        button.disabled = true;
        
        // Guardar contenido original
        const originalContent = button.innerHTML;
        button.dataset.originalContent = originalContent;
        
        // Actualizar contenido
        button.innerHTML = `
            <span class="spinner spinner-sm"></span>
            <span class="btn-text">${text}</span>
        `;
    }

    /**
     * Restaurar estado normal del botón
     */
    restoreButton(button) {
        button.classList.remove('btn-loading', 'loading-save', 'loading-delete', 'loading-search', 'loading-upload');
        button.disabled = false;
        
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }

    /**
     * Mostrar carga para AJAX
     */
    showAjaxLoading() {
        // Mostrar indicador sutil para peticiones AJAX rápidas
        clearTimeout(this.ajaxTimeout);
        this.ajaxTimeout = setTimeout(() => {
            this.showLoading('Cargando...', 'Procesando solicitud');
        }, 300);
    }

    /**
     * Ocultar carga para AJAX
     */
    hideAjaxLoading() {
        clearTimeout(this.ajaxTimeout);
        this.hideLoading();
    }

    /**
     * Efecto de skeleton para contenido
     */
    showSkeleton(container, count = 3) {
        const skeletonHTML = Array(count).fill('').map(() => `
            <div class="skeleton-wrapper">
                <div class="skeleton skeleton-text large"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text small"></div>
            </div>
        `).join('');

        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-loading');
    }

    /**
     * Ocultar skeleton
     */
    hideSkeleton(container) {
        container.classList.remove('skeleton-loading');
    }

    /**
     * Efecto de shimmer para tablas
     */
    showTableShimmer(table) {
        table.classList.add('table-loading');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.minHeight = '40px';
            });
        });
    }

    /**
     * Ocultar shimmer de tabla
     */
    hideTableShimmer(table) {
        table.classList.remove('table-loading');
    }

    /**
     * Progreso de carga
     */
    showProgress(container, message = 'Procesando...') {
        const progressHTML = `
            <div class="progress-container">
                <div class="progress-message">${message}</div>
                <div class="progress">
                    <div class="progress-bar progress-bar-animated" role="progressbar" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = progressHTML;
        const progressBar = container.querySelector('.progress-bar');
        
        // Simular progreso
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
        }, 500);
        
        return interval;
    }

    /**
     * Completar progreso
     */
    completeProgress(interval, container) {
        clearInterval(interval);
        const progressBar = container.querySelector('.progress-bar');
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 500);
    }
}

// Instanciar el gestor de carga
window.loadingManager = new LoadingManager();

// Funciones globales para uso manual
window.showLoading = (text, subtext) => window.loadingManager.showLoading(text, subtext);
window.hideLoading = () => window.loadingManager.hideLoading();
window.showSkeleton = (container, count) => window.loadingManager.showSkeleton(container, count);
window.hideSkeleton = (container) => window.loadingManager.hideSkeleton(container);

// Auto-restaurar botones cuando se completa la carga
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar botones después de la carga
    window.addEventListener('load', () => {
        document.querySelectorAll('.btn-loading').forEach(btn => {
            window.loadingManager.restoreButton(btn);
        });
    });

    // Para navegación con History API
    window.addEventListener('popstate', () => {
        window.loadingManager.hideLoading();
    });
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}
