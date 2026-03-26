// Efectos de carga y animaciones para Gestión SENA

class LoadingManager {
    constructor() {
        this.activeLoadings = new Map();
        this.init();
    }

    init() {
        // Crear overlay global si no existe
        if (!document.getElementById('loading-overlay')) {
            this.createGlobalOverlay();
        }
    }

    createGlobalOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <div class="loading-text mt-2">Procesando...</div>
            </div>
        `;
        
        // Estilos CSS
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;
        
        const spinner = overlay.querySelector('.loading-spinner');
        spinner.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            text-align: center;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        `;
        
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.style.cssText = `
            color: #333;
            font-weight: 500;
        `;
        
        document.body.appendChild(overlay);
    }

    show(message = 'Cargando...', options = {}) {
        const {
            timeout = 0,
            showProgress = false,
            progress = 0
        } = options;

        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay.querySelector('.loading-text');
        
        loadingText.textContent = message;
        
        if (showProgress) {
            loadingText.innerHTML = `${message} <small>(${progress}%)</small>`;
        }
        
        overlay.style.display = 'flex';
        
        // Auto-ocultar después del timeout
        if (timeout > 0) {
            setTimeout(() => {
                this.hide();
            }, timeout);
        }
        
        return this;
    }

    hide() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
        return this;
    }

    updateProgress(progress, message = 'Procesando...') {
        const loadingText = document.querySelector('.loading-text');
        loadingText.innerHTML = `${message} <small>(${progress}%)</small>`;
        return this;
    }

    // Efecto de carga en botones específicos
    showButtonLoading(buttonId, message = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (!button) return this;

        // Guardar estado original
        const originalContent = button.innerHTML;
        const originalDisabled = button.disabled;
        
        this.activeLoadings.set(buttonId, {
            originalContent,
            originalDisabled
        });

        // Aplicar estado de carga
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            ${message}
        `;
        button.disabled = true;
        
        return this;
    }

    hideButtonLoading(buttonId) {
        const button = document.getElementById(buttonId);
        const loadingState = this.activeLoadings.get(buttonId);
        
        if (button && loadingState) {
            button.innerHTML = loadingState.originalContent;
            button.disabled = loadingState.originalDisabled;
            this.activeLoadings.delete(buttonId);
        }
        
        return this;
    }

    // Efecto de carga en tablas
    showTableLoading(tableId, rowCount = 5) {
        const table = document.getElementById(tableId);
        if (!table) return this;

        const tbody = table.querySelector('tbody');
        const originalContent = tbody.innerHTML;
        
        // Guardar estado original
        this.activeLoadings.set(tableId, { originalContent });
        
        // Crear filas de carga
        const loadingRows = Array(rowCount).fill('').map(() => `
            <tr>
                <td colspan="100%" class="text-center py-3">
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        <span>Cargando datos...</span>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = loadingRows;
        return this;
    }

    hideTableLoading(tableId) {
        const table = document.getElementById(tableId);
        const loadingState = this.activeLoadings.get(tableId);
        
        if (table && loadingState) {
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = loadingState.originalContent;
            this.activeLoadings.delete(tableId);
        }
        
        return this;
    }

    // Efecto de skeleton loading
    showSkeletonLoading(containerId, itemCount = 3) {
        const container = document.getElementById(containerId);
        if (!container) return this;

        const originalContent = container.innerHTML;
        this.activeLoadings.set(containerId, { originalContent });
        
        const skeletonItems = Array(itemCount).fill('').map(() => `
            <div class="skeleton-item">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text skeleton-text-sm"></div>
                <div class="skeleton skeleton-text skeleton-text-xs"></div>
            </div>
        `).join('');
        
        container.innerHTML = skeletonItems;
        
        // Agregar estilos CSS si no existen
        if (!document.getElementById('skeleton-styles')) {
            const style = document.createElement('style');
            style.id = 'skeleton-styles';
            style.textContent = `
                .skeleton-item {
                    padding: 1rem;
                    border: 1px solid #e9ecef;
                    border-radius: 0.375rem;
                    margin-bottom: 1rem;
                }
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    border-radius: 0.25rem;
                }
                .skeleton-text {
                    height: 1rem;
                    margin-bottom: 0.5rem;
                    width: 100%;
                }
                .skeleton-text-sm {
                    height: 0.75rem;
                    width: 80%;
                }
                .skeleton-text-xs {
                    height: 0.5rem;
                    width: 60%;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        return this;
    }

    hideSkeletonLoading(containerId) {
        const container = document.getElementById(containerId);
        const loadingState = this.activeLoadings.get(containerId);
        
        if (container && loadingState) {
            container.innerHTML = loadingState.originalContent;
            this.activeLoadings.delete(containerId);
        }
        
        return this;
    }

    // Efecto de progreso en barra
    showProgressBar(containerId, options = {}) {
        const {
            height = '4px',
            color = '#007bff',
            animated = true
        } = options;

        const container = document.getElementById(containerId);
        if (!container) return this;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar-custom';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: 0%; height: ${height}; background: ${color};"></div>
        `;
        
        if (animated) {
            progressBar.querySelector('.progress-fill').style.transition = 'width 0.3s ease';
        }
        
        container.appendChild(progressBar);
        return this;
    }

    updateProgressBar(containerId, percentage) {
        const container = document.getElementById(containerId);
        const progressFill = container?.querySelector('.progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
        
        return this;
    }

    hideProgressBar(containerId) {
        const container = document.getElementById(containerId);
        const progressBar = container?.querySelector('.progress-bar-custom');
        
        if (progressBar) {
            progressBar.remove();
        }
        
        return this;
    }
}

// Crear instancia global
const loadingManager = new LoadingManager();

// Funciones de conveniencia
window.showLoading = (message, options) => loadingManager.show(message, options);
window.hideLoading = () => loadingManager.hide();
window.showButtonLoading = (buttonId, message) => loadingManager.showButtonLoading(buttonId, message);
window.hideButtonLoading = (buttonId) => loadingManager.hideButtonLoading(buttonId);
window.showTableLoading = (tableId, rowCount) => loadingManager.showTableLoading(tableId, rowCount);
window.hideTableLoading = (tableId) => loadingManager.hideTableLoading(tableId);
window.showSkeletonLoading = (containerId, itemCount) => loadingManager.showSkeletonLoading(containerId, itemCount);
window.hideSkeletonLoading = (containerId) => loadingManager.hideSkeletonLoading(containerId);

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}
