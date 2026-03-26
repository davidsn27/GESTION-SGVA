// Real-time Notification System - Sistema de notificaciones en tiempo real
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.defaultDuration = 5000;
        this.container = null;
        this.soundEnabled = true;
        this.desktopNotificationsEnabled = false;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.setupEventListeners();
        this.requestDesktopPermission();
        this.setupWebSocket();
        this.loadSettings();
    }

    // Crear contenedor de notificaciones
    createNotificationContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Escuchar notificaciones del servidor
        document.addEventListener('notification', (e) => {
            this.showNotification(e.detail.message, e.detail.type, e.detail.options);
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.clearAll();
            }
        });
    }

    // Solicitar permiso para notificaciones de escritorio
    async requestDesktopPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                this.desktopNotificationsEnabled = permission === 'granted';
            } catch (error) {
                console.warn('No se pudo solicitar permiso de notificaciones:', error);
            }
        }
    }

    // Configurar WebSocket para notificaciones en tiempo real
    setupWebSocket() {
        // Si tienes WebSocket configurado, descomenta y ajusta esto
        /*
        if (window.location.protocol === 'https:') {
            this.ws = new WebSocket(`wss://${window.location.host}/ws/notifications/`);
        } else {
            this.ws = new WebSocket(`ws://${window.location.host}/ws/notifications/`);
        }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.showNotification(data.message, data.type, data.options);
        };

        this.ws.onclose = () => {
            // Reintentar conexión después de 5 segundos
            setTimeout(() => this.setupWebSocket(), 5000);
        };
        */
    }

    // Cargar configuración
    loadSettings() {
        const settings = localStorage.getItem('notification-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.soundEnabled = parsed.soundEnabled !== false;
            this.desktopNotificationsEnabled = parsed.desktopNotificationsEnabled === true;
        }
    }

    // Guardar configuración
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            desktopNotificationsEnabled: this.desktopNotificationsEnabled
        };
        localStorage.setItem('notification-settings', JSON.stringify(settings));
    }

    // Mostrar notificación
    showNotification(message, type = 'info', options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            timestamp: new Date(),
            duration: options.duration || this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            icon: options.icon || this.getDefaultIcon(type),
            title: options.title || this.getDefaultTitle(type)
        };

        // Agregar a la lista
        this.notifications.unshift(notification);
        this.trimNotifications();

        // Mostrar en UI
        this.renderNotification(notification);

        // Mostrar notificación de escritorio
        if (this.desktopNotificationsEnabled) {
            this.showDesktopNotification(notification);
        }

        // Reproducir sonido
        if (this.soundEnabled) {
            this.playSound(type);
        }

        // Disparar evento
        window.dispatchEvent(new CustomEvent('notificationShown', {
            detail: notification
        }));

        return notification.id;
    }

    // Generar ID único
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Obtener ícono por defecto
    getDefaultIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            task: 'fas fa-tasks',
            reminder: 'fas fa-bell',
            update: 'fas fa-sync-alt'
        };
        return icons[type] || icons.info;
    }

    // Obtener título por defecto
    getDefaultTitle(type) {
        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información',
            task: 'Tarea',
            reminder: 'Recordatorio',
            update: 'Actualización'
        };
        return titles[type] || titles.info;
    }

    // Renderizar notificación
    renderNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type} slide-in-right`;
        element.dataset.id = notification.id;
        
        element.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    <i class="${notification.icon}"></i>
                </div>
                <div class="notification-title">${notification.title}</div>
                <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                ${!notification.persistent ? `
                <button class="notification-close" onclick="notificationSystem.closeNotification('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </div>
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${notification.actions.length > 0 ? `
                <div class="notification-actions">
                    ${notification.actions.map(action => `
                        <button class="btn btn-sm btn-${action.type || 'primary'}" 
                                onclick="${action.onclick}">
                            <i class="${action.icon || 'fas fa-arrow-right'}"></i>
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            <div class="notification-progress">
                <div class="notification-progress-bar"></div>
            </div>
        `;

        this.container.appendChild(element);

        // Animación de progreso
        if (!notification.persistent) {
            const progressBar = element.querySelector('.notification-progress-bar');
            progressBar.style.animation = `notificationProgress ${notification.duration}ms linear`;
        }

        // Auto-cerrar
        if (!notification.persistent) {
            setTimeout(() => {
                this.closeNotification(notification.id);
            }, notification.duration);
        }

        // Animación de entrada
        requestAnimationFrame(() => {
            element.classList.add('notification-visible');
        });
    }

    // Cerrar notificación
    closeNotification(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('notification-hiding');
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
                
                // Remover de la lista
                this.notifications = this.notifications.filter(n => n.id !== id);
                
                // Disparar evento
                window.dispatchEvent(new CustomEvent('notificationClosed', {
                    detail: { id }
                }));
            }, 300);
        }
    }

    // Mostrar notificación de escritorio
    showDesktopNotification(notification) {
        if ('Notification' in window && this.desktopNotificationsEnabled) {
            const desktopNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '/static/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.persistent
            });

            desktopNotif.onclick = () => {
                window.focus();
                desktopNotif.close();
            };

            if (!notification.persistent) {
                setTimeout(() => desktopNotif.close(), notification.duration);
            }
        }
    }

    // Reproducir sonido
    playSound(type) {
        if (!this.soundEnabled) return;

        // Crear audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar sonido según tipo
        const frequencies = {
            success: 800,
            error: 300,
            warning: 600,
            info: 500,
            task: 700,
            reminder: 400,
            update: 550
        };

        oscillator.frequency.value = frequencies[type] || 500;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    // Formatear tiempo
    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) {
            return 'ahora';
        } else if (diff < 3600000) {
            return `hace ${Math.floor(diff / 60000)} min`;
        } else if (diff < 86400000) {
            return `hace ${Math.floor(diff / 3600000)} h`;
        } else {
            return timestamp.toLocaleDateString('es-CO');
        }
    }

    // Limitar número de notificaciones
    trimNotifications() {
        if (this.notifications.length > this.maxNotifications) {
            const excess = this.notifications.length - this.maxNotifications;
            for (let i = 0; i < excess; i++) {
                const oldNotification = this.notifications.pop();
                this.closeNotification(oldNotification.id);
            }
        }
    }

    // Limpiar todas las notificaciones
    clearAll() {
        const elements = this.container.querySelectorAll('.notification');
        elements.forEach(element => {
            const id = element.dataset.id;
            this.closeNotification(id);
        });
    }

    // Mostrar notificaciones específicas
    showSuccess(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    showError(message, options = {}) {
        return this.showNotification(message, 'error', options);
    }

    showWarning(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    showInfo(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    showTask(message, options = {}) {
        return this.showNotification(message, 'task', options);
    }

    showReminder(message, options = {}) {
        return this.showNotification(message, 'reminder', options);
    }

    showUpdate(message, options = {}) {
        return this.showNotification(message, 'update', options);
    }

    // Notificaciones programadas
    scheduleNotification(message, type, delay, options = {}) {
        setTimeout(() => {
            this.showNotification(message, type, options);
        }, delay);
    }

    // Notificaciones condicionales
    showConditional(condition, message, type, options = {}) {
        if (condition) {
            return this.showNotification(message, type, options);
        }
        return null;
    }

    // Obtener historial de notificaciones
    getHistory() {
        return [...this.notifications];
    }

    // Obtener notificaciones no leídas
    getUnread() {
        return this.notifications.filter(n => !n.read);
    }

    // Marcar como leída
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            notification.readAt = new Date();
        }
    }

    // Marcar todas como leídas
    markAllAsRead() {
        this.notifications.forEach(n => {
            n.read = true;
            n.readAt = new Date();
        });
    }

    // Crear panel de configuración
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'notification-settings-panel';
        panel.innerHTML = `
            <div class="settings-header">
                <h5>Configuración de Notificaciones</h5>
                <button class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="settings-body">
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="soundEnabled" 
                           ${this.soundEnabled ? 'checked' : ''}>
                    <label class="form-check-label" for="soundEnabled">
                        Activar sonidos
                    </label>
                </div>
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="desktopEnabled" 
                           ${this.desktopNotificationsEnabled ? 'checked' : ''}>
                    <label class="form-check-label" for="desktopEnabled">
                        Notificaciones de escritorio
                    </label>
                </div>
                <div class="mb-3">
                    <label class="form-label">Duración predeterminada (ms)</label>
                    <input type="number" class="form-control" id="defaultDuration" 
                           value="${this.defaultDuration}" min="1000" max="30000" step="1000">
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="notificationSystem.saveSettingsFromPanel()">
                        Guardar
                    </button>
                    <button class="btn btn-secondary" onclick="notificationSystem.testNotification()">
                        Probar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    // Guardar configuración desde panel
    saveSettingsFromPanel() {
        const soundEnabled = document.getElementById('soundEnabled').checked;
        const desktopEnabled = document.getElementById('desktopEnabled').checked;
        const defaultDuration = parseInt(document.getElementById('defaultDuration').value);

        this.soundEnabled = soundEnabled;
        this.desktopNotificationsEnabled = desktopEnabled;
        this.defaultDuration = defaultDuration;

        this.saveSettings();
        this.showSuccess('Configuración guardada exitosamente');
        
        // Cerrar panel
        document.querySelector('.notification-settings-panel')?.remove();
    }

    // Probar notificación
    testNotification() {
        this.showInfo('Esta es una notificación de prueba', {
            title: 'Prueba',
            actions: [
                {
                    text: 'Aceptar',
                    type: 'success',
                    icon: 'fas fa-check',
                    onclick: 'notificationSystem.showSuccess("Acción aceptada")'
                }
            ]
        });
    }

    // Inicializar sistema
    static init() {
        const notificationSystem = new NotificationSystem();
        window.notificationSystem = notificationSystem;
        
        // Reemplazar función global de notificación
        window.showNotification = (message, type, options) => {
            return notificationSystem.showNotification(message, type, options);
        };
        
        window.showAnimatedNotification = (message, type, duration) => {
            return notificationSystem.showNotification(message, type, { duration });
        };
        
        return notificationSystem;
    }
}

// CSS para el sistema de notificaciones
const notificationCSS = `
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    pointer-events: none;
}

.notification {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    box-shadow: 0 0.5rem 1rem var(--shadow-color);
    margin-bottom: 1rem;
    pointer-events: auto;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
}

.notification.notification-visible {
    transform: translateX(0);
    opacity: 1;
}

.notification.notification-hiding {
    transform: translateX(100%);
    opacity: 0;
}

.notification-header {
    display: flex;
    align-items: center;
    padding: 1rem 1rem 0.5rem;
    gap: 0.75rem;
}

.notification-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
}

.notification-success .notification-icon {
    background-color: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
}

.notification-error .notification-icon {
    background-color: rgba(220, 53, 69, 0.1);
    color: var(--danger-color);
}

.notification-warning .notification-icon {
    background-color: rgba(255, 193, 7, 0.1);
    color: var(--warning-color);
}

.notification-info .notification-icon {
    background-color: rgba(23, 162, 184, 0.1);
    color: var(--info-color);
}

.notification-title {
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}

.notification-time {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
}

.notification-content {
    padding: 0 1rem 1rem;
}

.notification-message {
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 0.75rem;
}

.notification-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.notification-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-color: var(--bg-tertiary);
    overflow: hidden;
}

.notification-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), #0056b3);
    width: 100%;
}

@keyframes notificationProgress {
    from {
        width: 100%;
    }
    to {
        width: 0%;
    }
}

.notification-settings-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    box-shadow: 0 1rem 3rem var(--shadow-color);
    z-index: 10000;
    min-width: 350px;
    max-width: 500px;
}

.settings-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.settings-header h5 {
    margin: 0;
    color: var(--text-primary);
}

.settings-body {
    padding: 1.5rem;
}

.settings-body .form-check {
    padding-left: 2.5rem;
}

.settings-body .form-check-label {
    color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
    .notification-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .notification {
        margin-bottom: 0.5rem;
    }
    
    .notification-settings-panel {
        margin: 1rem;
        min-width: auto;
        max-width: none;
    }
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    NotificationSystem.init();
});

// Exportar para uso global
window.NotificationSystem = NotificationSystem;
