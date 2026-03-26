// Keyboard Shortcuts & Favorites System - Atajos de teclado y sistema de favoritos
class KeyboardShortcutsSystem {
    constructor() {
        this.shortcuts = new Map();
        this.favorites = this.loadFavorites();
        this.shortcutsEnabled = true;
        this.helpModal = null;
        this.init();
    }

    init() {
        this.setupDefaultShortcuts();
        this.setupEventListeners();
        this.setupFavoritesUI();
        this.createHelpModal();
        this.loadSettings();
    }

    // Configurar atajos por defecto
    setupDefaultShortcuts() {
        // Navegación
        this.addShortcut('ctrl+k', () => {
            const searchInput = document.querySelector('.advanced-search') || 
                             document.querySelector('input[type="search"]') ||
                             document.querySelector('input[placeholder*="buscar"]');
            if (searchInput) searchInput.focus();
        }, 'Buscar');

        this.addShortcut('ctrl+/', () => {
            this.showHelp();
        }, 'Ayuda de atajos');

        this.addShortcut('ctrl+h', () => {
            window.location.href = '/';
        }, 'Inicio');

        this.addShortcut('ctrl+d', () => {
            window.location.href = '/dashboard';
        }, 'Dashboard');

        this.addShortcut('ctrl+a', () => {
            window.location.href = '/aprendices';
        }, 'Aprendices');

        this.addShortcut('ctrl+e', () => {
            window.location.href = '/empresas';
        }, 'Empresas');

        this.addShortcut('ctrl+i', () => {
            window.location.href = '/cargar-excel';
        }, 'Importar');

        this.addShortcut('ctrl+r', () => {
            window.location.href = '/reportes';
        }, 'Reportes');

        // Acciones
        this.addShortcut('ctrl+n', () => {
            this.showCreateModal();
        }, 'Nuevo registro');

        this.addShortcut('ctrl+f', () => {
            this.toggleFavorites();
        }, 'Favoritos');

        this.addShortcut('ctrl+s', () => {
            this.saveCurrentForm();
        }, 'Guardar');

        this.addShortcut('ctrl+shift+s', () => {
            this.saveAndContinue();
        }, 'Guardar y continuar');

        this.addShortcut('escape', () => {
            this.closeModals();
        }, 'Cerrar modal');

        // Exportación
        this.addShortcut('ctrl+shift+e', () => {
            this.exportCurrentView();
        }, 'Exportar');

        this.addShortcut('ctrl+shift+p', () => {
            this.printCurrentView();
        }, 'Imprimir');

        // Tema
        this.addShortcut('ctrl+shift+t', () => {
            if (typeof window.themeManager !== 'undefined') {
                window.themeManager.toggleTheme();
            }
        }, 'Cambiar tema');

        // Notificaciones
        this.addShortcut('ctrl+shift+n', () => {
            this.clearNotifications();
        }, 'Limpiar notificaciones');

        // Dashboard
        this.addShortcut('ctrl+shift+r', () => {
            if (typeof window.interactiveDashboard !== 'undefined') {
                window.interactiveDashboard.resetDashboard();
            }
        }, 'Resetear dashboard');

        // Filtros
        this.addShortcut('ctrl+shift+f', () => {
            this.focusFilters();
        }, 'Filtros');

        // Tab navigation
        this.addShortcut('ctrl+tab', () => {
            this.navigateTab('next');
        }, 'Siguiente pestaña');

        this.addShortcut('ctrl+shift+tab', () => {
            this.navigateTab('prev');
        }, 'Pestaña anterior');

        // Números rápidos (1-9)
        for (let i = 1; i <= 9; i++) {
            this.addShortcut(`${i}`, () => {
                this.quickAction(i);
            }, `Acción rápida ${i}`);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.shortcutsEnabled) return;
            
            const key = this.getKeyString(e);
            const shortcut = this.shortcuts.get(key);
            
            if (shortcut) {
                e.preventDefault();
                shortcut.callback();
                
                // Mostrar feedback visual
                this.showShortcutFeedback(shortcut.description);
            }
        });

        // Escuchar cambios en favoritos
        window.addEventListener('favoritesChanged', () => {
            this.updateFavoritesUI();
        });
    }

    // Configurar UI de favoritos
    setupFavoritesUI() {
        // Crear panel de favoritos
        this.createFavoritesPanel();
        
        // Crear botón de favoritos
        this.createFavoritesButton();
        
        // Agregar botones de favorito a elementos
        this.addFavoriteButtons();
    }

    // Agregar atajo
    addShortcut(key, callback, description) {
        this.shortcuts.set(key, {
            callback,
            description,
            key
        });
    }

    // Obtener string de tecla
    getKeyString(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.metaKey) parts.push('meta');
        
        let key = e.key.toLowerCase();
        
        // Mapear teclas especiales
        const keyMap = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'escape': 'escape'
        };
        
        key = keyMap[key] || key;
        
        // Si es una sola letra y no hay modificadores, devolver solo la letra
        if (parts.length === 0 && key.length === 1) {
            return key;
        }
        
        parts.push(key);
        return parts.join('+');
    }

    // Mostrar ayuda de atajos
    showHelp() {
        if (!this.helpModal) {
            this.createHelpModal();
        }
        
        const modal = new bootstrap.Modal(this.helpModal);
        modal.show();
    }

    // Crear modal de ayuda
    createHelpModal() {
        const modalHtml = `
            <div class="modal fade" id="shortcutsHelpModal" tabindex="-1" aria-labelledby="shortcutsHelpModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="shortcutsHelpModalLabel">
                                <i class="fas fa-keyboard me-2"></i>Atajos de Teclado
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">Navegación</h6>
                                    <div class="shortcuts-list">
                                        ${this.generateShortcutsHTML(['Buscar', 'Ayuda de atajos', 'Inicio', 'Dashboard', 'Aprendices', 'Empresas', 'Importar', 'Reportes'])}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">Acciones</h6>
                                    <div class="shortcuts-list">
                                        ${this.generateShortcutsHTML(['Nuevo registro', 'Favoritos', 'Guardar', 'Guardar y continuar', 'Cerrar modal', 'Exportar', 'Imprimir', 'Cambiar tema'])}
                                    </div>
                                </div>
                            </div>
                            <div class="row mt-4">
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">Dashboard</h6>
                                    <div class="shortcuts-list">
                                        ${this.generateShortcutsHTML(['Resetear dashboard', 'Limpiar notificaciones', 'Filtros'])}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">Otros</h6>
                                    <div class="shortcuts-list">
                                        ${this.generateShortcutsHTML(['Siguiente pestaña', 'Pestaña anterior'])}
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <small class="text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Presiona Ctrl+/ en cualquier momento para ver esta ayuda
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="keyboardShortcutsSystem.toggleShortcuts()">
                                <i class="fas fa-power-off me-2"></i>${this.shortcutsEnabled ? 'Desactivar' : 'Activar'} Atajos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.helpModal = document.getElementById('shortcutsHelpModal');
    }

    // Generar HTML de atajos
    generateShortcutsHTML(descriptions) {
        let html = '';
        this.shortcuts.forEach(shortcut => {
            if (descriptions.includes(shortcut.description)) {
                html += `
                    <div class="shortcut-item d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span class="shortcut-desc">${shortcut.description}</span>
                        <kbd class="shortcut-key">${this.formatKey(shortcut.key)}</kbd>
                    </div>
                `;
            }
        });
        return html;
    }

    // Formatear tecla para mostrar
    formatKey(key) {
        return key.split('+').map(part => 
            part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' + ');
    }

    // Mostrar feedback visual
    showShortcutFeedback(description) {
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.innerHTML = `
            <div class="shortcut-feedback-content">
                <i class="fas fa-keyboard me-2"></i>
                <span>${description}</span>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // Animación
        setTimeout(() => feedback.classList.add('show'), 10);
        
        // Remover después de 2 segundos
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    // Alternar atajos
    toggleShortcuts() {
        this.shortcutsEnabled = !this.shortcutsEnabled;
        this.saveSettings();
        
        if (this.shortcutsEnabled) {
            this.showNotification('Atajos de teclado activados', 'success');
        } else {
            this.showNotification('Atajos de teclado desactivados', 'info');
        }
        
        // Cerrar modal si está abierto
        const modal = bootstrap.Modal.getInstance(this.helpModal);
        if (modal) modal.hide();
    }

    // Cargar favoritos
    loadFavorites() {
        const stored = localStorage.getItem('favorites');
        return stored ? JSON.parse(stored) : [];
    }

    // Guardar favoritos
    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
    }

    // Agregar favorito
    addFavorite(item) {
        // Verificar si ya existe
        const exists = this.favorites.some(fav => fav.id === item.id);
        if (exists) {
            this.removeFavorite(item.id);
            return false;
        }
        
        // Agregar nuevo favorito
        this.favorites.unshift({
            ...item,
            addedAt: new Date().toISOString()
        });
        
        // Limitar a 20 favoritos
        this.favorites = this.favorites.slice(0, 20);
        
        this.saveFavorites();
        this.showNotification('Agregado a favoritos', 'success');
        return true;
    }

    // Remover favorito
    removeFavorite(id) {
        this.favorites = this.favorites.filter(fav => fav.id !== id);
        this.saveFavorites();
        this.showNotification('Removido de favoritos', 'info');
    }

    // Crear panel de favoritos
    createFavoritesPanel() {
        const panel = document.createElement('div');
        panel.id = 'favorites-panel';
        panel.className = 'favorites-panel';
        panel.innerHTML = `
            <div class="favorites-header">
                <h6 class="mb-0">
                    <i class="fas fa-star me-2"></i>Favoritos
                </h6>
                <button class="btn-close btn-sm" onclick="keyboardShortcutsSystem.toggleFavorites()"></button>
            </div>
            <div class="favorites-body">
                <div class="favorites-list" id="favorites-list">
                    <!-- Los favoritos se cargarán aquí -->
                </div>
            </div>
            <div class="favorites-footer">
                <small class="text-muted">
                    <kbd>Ctrl+F</kbd> para mostrar/ocultar
                </small>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.updateFavoritesUI();
    }

    // Crear botón de favoritos
    createFavoritesButton() {
        const button = document.createElement('button');
        button.id = 'favorites-toggle';
        button.className = 'favorites-toggle btn btn-outline-primary';
        button.innerHTML = '<i class="fas fa-star"></i>';
        button.title = 'Favoritos (Ctrl+F)';
        button.onclick = () => this.toggleFavorites();
        
        // Agregar al navbar
        const navbar = document.querySelector('.navbar-nav.me-auto');
        if (navbar) {
            navbar.appendChild(button);
        }
    }

    // Agregar botones de favorito a elementos
    addFavoriteButtons() {
        // Agregar a aprendices
        document.addEventListener('DOMContentLoaded', () => {
            this.addFavoriteButtonsToElements();
        });
        
        // Observer para elementos dinámicos
        const observer = new MutationObserver(() => {
            this.addFavoriteButtonsToElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Agregar botones a elementos
    addFavoriteButtonsToElements() {
        // Aprendices
        document.querySelectorAll('[data-aprendiz-id]').forEach(element => {
            if (!element.querySelector('.favorite-btn')) {
                const btn = this.createFavoriteButton('aprendiz', element.dataset.aprendizId, element.dataset.nombre);
                element.appendChild(btn);
            }
        });
        
        // Empresas
        document.querySelectorAll('[data-empresa-id]').forEach(element => {
            if (!element.querySelector('.favorite-btn')) {
                const btn = this.createFavoriteButton('empresa', element.dataset.empresaId, element.dataset.nombre);
                element.appendChild(btn);
            }
        });
        
        // Reportes
        document.querySelectorAll('[data-reporte-id]').forEach(element => {
            if (!element.querySelector('.favorite-btn')) {
                const btn = this.createFavoriteButton('reporte', element.dataset.reporteId, element.dataset.nombre);
                element.appendChild(btn);
            }
        });
    }

    // Crear botón de favorito
    createFavoriteButton(type, id, name) {
        const button = document.createElement('button');
        button.className = 'favorite-btn btn btn-sm btn-outline-warning';
        button.innerHTML = '<i class="fas fa-star"></i>';
        button.title = 'Agregar a favoritos';
        
        // Verificar si ya es favorito
        const isFavorite = this.favorites.some(fav => fav.id === `${type}-${id}`);
        if (isFavorite) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-star"></i>';
            button.title = 'Remover de favoritos';
        }
        
        button.onclick = (e) => {
            e.stopPropagation();
            const item = {
                id: `${type}-${id}`,
                type,
                name,
                url: this.getItemUrl(type, id)
            };
            
            const added = this.addFavorite(item);
            
            // Actualizar botón
            if (added) {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-star"></i>';
                button.title = 'Remover de favoritos';
            } else {
                button.classList.remove('active');
                button.innerHTML = '<i class="far fa-star"></i>';
                button.title = 'Agregar a favoritos';
            }
        };
        
        return button;
    }

    // Obtener URL del elemento
    getItemUrl(type, id) {
        const urlMap = {
            'aprendiz': `/aprendiz/${id}/`,
            'empresa': `/empresa/${id}/`,
            'reporte': `/reporte/${id}/`
        };
        return urlMap[type] || '#';
    }

    // Actualizar UI de favoritos
    updateFavoritesUI() {
        const list = document.getElementById('favorites-list');
        if (!list) return;
        
        if (this.favorites.length === 0) {
            list.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-star fa-2x mb-2"></i>
                    <p>No tienes favoritos guardados</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.favorites.forEach(fav => {
            html += `
                <div class="favorite-item" data-id="${fav.id}">
                    <div class="favorite-icon">
                        <i class="fas ${this.getFavoriteIcon(fav.type)}"></i>
                    </div>
                    <div class="favorite-content">
                        <div class="favorite-name">${fav.name}</div>
                        <div class="favorite-type">${fav.type}</div>
                    </div>
                    <div class="favorite-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.location.href='${fav.url}'">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="keyboardShortcutsSystem.removeFavorite('${fav.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Obtener ícono de favorito
    getFavoriteIcon(type) {
        const icons = {
            'aprendiz': 'fa-user',
            'empresa': 'fa-building',
            'reporte': 'fa-chart-bar'
        };
        return icons[type] || 'fa-star';
    }

    // Alternar panel de favoritos
    toggleFavorites() {
        const panel = document.getElementById('favorites-panel');
        if (!panel) return;
        
        panel.classList.toggle('show');
        
        // Actualizar botón
        const button = document.getElementById('favorites-toggle');
        if (button) {
            button.classList.toggle('active');
        }
    }

    // Acciones rápidas
    quickAction(number) {
        const actions = [
            () => window.location.href = '/aprendices',
            () => window.location.href = '/empresas',
            () => window.location.href = '/dashboard',
            () => window.location.href = '/reportes',
            () => window.location.href = '/cargar-excel',
            () => this.showHelp(),
            () => this.toggleFavorites(),
            () => this.exportCurrentView(),
            () => this.printCurrentView()
        ];
        
        if (actions[number - 1]) {
            actions[number - 1]();
        }
    }

    // Mostrar modal de creación
    showCreateModal() {
        // Implementar según el contexto actual
        if (window.location.pathname.includes('aprendices')) {
            window.location.href = '/aprendiz/nuevo/';
        } else if (window.location.pathname.includes('empresas')) {
            window.location.href = '/empresa/nueva/';
        } else {
            this.showNotification('No hay acción de creación disponible en esta página', 'info');
        }
    }

    // Guardar formulario actual
    saveCurrentForm() {
        const form = document.querySelector('form');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
            } else {
                form.submit();
            }
        } else {
            this.showNotification('No hay formulario para guardar', 'warning');
        }
    }

    // Guardar y continuar
    saveAndContinue() {
        const form = document.querySelector('form');
        if (form) {
            // Agregar campo oculto para indicar que debe continuar
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'save_and_continue';
            input.value = '1';
            form.appendChild(input);
            
            this.saveCurrentForm();
        } else {
            this.showNotification('No hay formulario para guardar', 'warning');
        }
    }

    // Cerrar modales
    closeModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        });
    }

    // Exportar vista actual
    exportCurrentView() {
        if (typeof window.exportManager !== 'undefined') {
            const table = document.querySelector('table');
            if (table && table.id) {
                window.exportManager.exportToExcel(table.id, 'vista_actual');
            } else {
                window.exportManager.exportDashboard('vista_actual');
            }
        } else {
            this.showNotification('Exportación no disponible', 'warning');
        }
    }

    // Imprimir vista actual
    printCurrentView() {
        window.print();
    }

    // Limpiar notificaciones
    clearNotifications() {
        if (typeof window.notificationSystem !== 'undefined') {
            window.notificationSystem.clearAll();
        } else {
            document.querySelectorAll('.alert').forEach(alert => alert.remove());
        }
    }

    // Enfocar filtros
    focusFilters() {
        const firstFilter = document.querySelector('.filter-control');
        if (firstFilter) {
            firstFilter.focus();
        } else {
            this.showNotification('No hay filtros disponibles', 'info');
        }
    }

    // Navegar entre pestañas
    navigateTab(direction) {
        const activeTab = document.querySelector('.nav-link.active');
        if (!activeTab) return;
        
        const tabs = Array.from(document.querySelectorAll('.nav-link'));
        const currentIndex = tabs.indexOf(activeTab);
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % tabs.length;
        } else {
            newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        }
        
        tabs[newIndex].click();
    }

    // Cargar configuración
    loadSettings() {
        const settings = localStorage.getItem('keyboard-shortcuts-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.shortcutsEnabled = parsed.shortcutsEnabled !== false;
        }
    }

    // Guardar configuración
    saveSettings() {
        const settings = {
            shortcutsEnabled: this.shortcutsEnabled
        };
        localStorage.setItem('keyboard-shortcuts-settings', JSON.stringify(settings));
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Inicializar sistema
    static init() {
        const keyboardShortcuts = new KeyboardShortcutsSystem();
        window.keyboardShortcutsSystem = keyboardShortcuts;
        return keyboardShortcuts;
    }
}

// CSS para atajos y favoritos
const shortcutsCSS = `
.shortcut-feedback {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    pointer-events: none;
}

.shortcut-feedback-content {
    background: var(--dark-color);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem var(--shadow-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
}

.shortcut-feedback.show .shortcut-feedback-content {
    opacity: 1;
    transform: translateY(0);
}

.shortcuts-list {
    max-height: 300px;
    overflow-y: auto;
}

.shortcut-item:last-child {
    border-bottom: none !important;
}

.shortcut-desc {
    color: var(--text-secondary);
    font-weight: 500;
}

.shortcut-key {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-primary);
}

.favorites-panel {
    position: fixed;
    top: 0;
    right: -350px;
    width: 350px;
    height: 100vh;
    background: var(--card-bg);
    border-left: 1px solid var(--border-color);
    box-shadow: -0.5rem 0 1rem var(--shadow-color);
    z-index: 1040;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
}

.favorites-panel.show {
    right: 0;
}

.favorites-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
}

.favorites-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.favorites-footer {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
}

.favorite-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    background: var(--bg-secondary);
    transition: all 0.3s ease;
}

.favorite-item:hover {
    background: var(--bg-tertiary);
    transform: translateX(-5px);
}

.favorite-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    margin-right: 0.75rem;
    flex-shrink: 0;
}

.favorite-content {
    flex: 1;
    min-width: 0;
}

.favorite-name {
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.favorite-type {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
}

.favorite-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.5rem;
}

.favorites-toggle {
    margin-left: 0.5rem;
    transition: all 0.3s ease;
}

.favorites-toggle:hover,
.favorites-toggle.active {
    background-color: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
    color: white !important;
}

.favorite-btn {
    margin-left: 0.5rem;
    transition: all 0.3s ease;
}

.favorite-btn:hover {
    transform: scale(1.1);
}

.favorite-btn.active {
    background-color: var(--warning-color) !important;
    border-color: var(--warning-color) !important;
    color: white !important;
}

/* Responsive */
@media (max-width: 768px) {
    .favorites-panel {
        width: 100%;
        right: -100%;
    }
    
    .shortcut-feedback-content {
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
    }
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = shortcutsCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    KeyboardShortcutsSystem.init();
});

// Exportar para uso global
window.KeyboardShortcutsSystem = KeyboardShortcutsSystem;
