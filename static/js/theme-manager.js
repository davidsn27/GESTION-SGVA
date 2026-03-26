// Theme Management System - Simplificado
class ThemeManager {
    constructor() {
        this.storageKey = 'sena-gestion-theme';
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.init();
    }

    init() {
        // Cargar tema guardado o detectar preferencia del sistema
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const theme = savedTheme || systemTheme;
        
        this.setTheme(theme);
        this.setupEventListeners();
    }

    getSavedTheme() {
        return localStorage.getItem(this.storageKey);
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-sun';
            }
        } else {
            root.removeAttribute('data-theme');
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-moon';
            }
        }

        // Guardar preferencia
        localStorage.setItem(this.storageKey, theme);
        
        console.log('Theme changed to:', theme);
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked');
                this.toggleTheme();
            });
        } else {
            console.warn('Theme toggle button not found');
        }

        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Inicializar gestor de temas
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ThemeManager...');
    window.themeManager = new ThemeManager();
    console.log('ThemeManager initialized');
});

// Exportar para uso global
window.ThemeManager = ThemeManager;
