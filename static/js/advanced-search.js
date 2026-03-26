// Advanced Search System - Búsqueda con autocompletar y filtrado avanzado
class AdvancedSearchSystem {
    constructor() {
        this.searchCache = new Map();
        this.debounceDelay = 300;
        this.minSearchLength = 2;
        this.maxSuggestions = 10;
        this.currentSearch = null;
        this.init();
    }

    init() {
        this.setupSearchInputs();
        this.setupAdvancedFilters();
        this.setupKeyboardNavigation();
        this.setupSearchHistory();
        this.loadSearchSettings();
    }

    // Configurar inputs de búsqueda
    setupSearchInputs() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('.advanced-search')) {
                this.handleSearchInput(e.target);
            }
        });

        document.addEventListener('focus', (e) => {
            if (e.target.matches('.advanced-search')) {
                this.showSearchSuggestions(e.target);
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.matches('.advanced-search')) {
                setTimeout(() => this.hideSearchSuggestions(e.target), 200);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.matches('.advanced-search')) {
                this.handleSearchKeydown(e);
            }
        });
    }

    // Configurar filtros avanzados
    setupAdvancedFilters() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('.filter-control')) {
                this.applyFilters();
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.matches('.advanced-search-form')) {
                e.preventDefault();
                this.performAdvancedSearch(e.target);
            }
        });
    }

    // Configurar navegación por teclado
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K para focus en búsqueda principal
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const mainSearch = document.querySelector('.advanced-search') || 
                                 document.querySelector('input[type="search"]') ||
                                 document.querySelector('input[placeholder*="buscar"]');
                if (mainSearch) {
                    mainSearch.focus();
                }
            }

            // Escape para limpiar búsqueda
            if (e.key === 'Escape' && document.activeElement.matches('.advanced-search')) {
                this.clearSearch(document.activeElement);
            }
        });
    }

    // Configurar historial de búsqueda
    setupSearchHistory() {
        this.searchHistory = this.loadSearchHistory();
    }

    // Cargar configuración de búsqueda
    loadSearchSettings() {
        const settings = localStorage.getItem('search-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.debounceDelay = parsed.debounceDelay || 300;
            this.minSearchLength = parsed.minSearchLength || 2;
            this.maxSuggestions = parsed.maxSuggestions || 10;
        }
    }

    // Manejar input de búsqueda
    handleSearchInput(input) {
        const query = input.value.trim();
        const searchType = input.dataset.searchType || 'general';
        
        // Actualizar input actual
        this.currentSearch = { input, query, searchType };

        // Limpiar debounce anterior
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Si la consulta es muy corta, mostrar historial
        if (query.length < this.minSearchLength) {
            this.showSearchHistory(input);
            return;
        }

        // Debounce para autocompletar
        this.searchTimeout = setTimeout(() => {
            this.performAutocomplete(input, query, searchType);
        }, this.debounceDelay);
    }

    // Realizar autocompletar
    async performAutocomplete(input, query, searchType) {
        try {
            // Verificar caché
            const cacheKey = `${searchType}:${query}`;
            if (this.searchCache.has(cacheKey)) {
                this.showSuggestions(input, this.searchCache.get(cacheKey));
                return;
            }

            // Mostrar loading
            this.showSearchLoading(input);

            // Obtener sugerencias según tipo
            let suggestions = [];
            switch (searchType) {
                case 'aprendices':
                    suggestions = await this.getAprendizSuggestions(query);
                    break;
                case 'empresas':
                    suggestions = await this.getEmpresaSuggestions(query);
                    break;
                case 'general':
                default:
                    suggestions = await this.getGeneralSuggestions(query);
                    break;
            }

            // Guardar en caché
            this.searchCache.set(cacheKey, suggestions);

            // Mostrar sugerencias
            this.showSuggestions(input, suggestions);

        } catch (error) {
            console.error('Error en autocompletar:', error);
            this.hideSearchSuggestions(input);
        }
    }

    // Obtener sugerencias de aprendices
    async getAprendizSuggestions(query) {
        // Simular API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockSuggestions = [
                    { type: 'aprendiz', id: 1, name: 'Juan Pérez', document: '12345678', program: 'Programación' },
                    { type: 'aprendiz', id: 2, name: 'María García', document: '87654321', program: 'Diseño' },
                    { type: 'aprendiz', id: 3, name: 'Carlos Rodríguez', document: '45678912', program: 'Marketing' }
                ].filter(item => 
                    item.name.toLowerCase().includes(query.toLowerCase()) ||
                    item.document.includes(query) ||
                    item.program.toLowerCase().includes(query.toLowerCase())
                );
                resolve(mockSuggestions);
            }, 200);
        });
    }

    // Obtener sugerencias de empresas
    async getEmpresaSuggestions(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockSuggestions = [
                    { type: 'empresa', id: 1, name: 'Tech Solutions SAS', nit: '900123456', sector: 'Tecnología' },
                    { type: 'empresa', id: 2, name: 'Marketing Digital Ltda', nit: '900789456', sector: 'Marketing' },
                    { type: 'empresa', id: 3, name: 'Design Studio', nit: '900456789', sector: 'Diseño' }
                ].filter(item => 
                    item.name.toLowerCase().includes(query.toLowerCase()) ||
                    item.nit.includes(query) ||
                    item.sector.toLowerCase().includes(query.toLowerCase())
                );
                resolve(mockSuggestions);
            }, 200);
        });
    }

    // Obtener sugerencias generales
    async getGeneralSuggestions(query) {
        const [aprendices, empresas] = await Promise.all([
            this.getAprendizSuggestions(query),
            this.getEmpresaSuggestions(query)
        ]);
        return [...aprendices, ...empresas].slice(0, this.maxSuggestions);
    }

    // Mostrar sugerencias
    showSuggestions(input, suggestions) {
        if (suggestions.length === 0) {
            this.hideSearchSuggestions(input);
            return;
        }

        let suggestionsHtml = '';
        suggestions.forEach((suggestion, index) => {
            const icon = suggestion.type === 'aprendiz' ? 'fa-user' : 'fa-building';
            const subtitle = suggestion.type === 'aprendiz' 
                ? `${suggestion.document} - ${suggestion.program}`
                : `${suggestion.nit} - ${suggestion.sector}`;
            
            suggestionsHtml += `
                <div class="suggestion-item" data-index="${index}" data-type="${suggestion.type}" data-id="${suggestion.id}">
                    <div class="suggestion-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="suggestion-content">
                        <div class="suggestion-title">${this.highlightMatch(suggestion.name, input.value.trim())}</div>
                        <div class="suggestion-subtitle">${subtitle}</div>
                    </div>
                    <div class="suggestion-type">${suggestion.type}</div>
                </div>
            `;
        });

        // Agregar opción de búsqueda avanzada
        suggestionsHtml += `
            <div class="suggestion-item suggestion-advanced">
                <div class="suggestion-icon">
                    <i class="fas fa-search"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">Buscar "${input.value.trim()}"</div>
                    <div class="suggestion-subtitle">Búsqueda avanzada en todos los campos</div>
                </div>
            </div>
        `;

        this.renderSuggestions(input, suggestionsHtml);
        this.attachSuggestionEvents(input, suggestions);
    }

    // Resaltar coincidencias
    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Renderizar sugerencias
    renderSuggestions(input, html) {
        let container = input.nextElementSibling;
        if (!container || !container.classList.contains('suggestions-container')) {
            container = document.createElement('div');
            container.className = 'suggestions-container';
            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(container);
        }

        container.innerHTML = html;
        container.style.display = 'block';
        container.classList.add('suggestions-visible');
    }

    // Adjuntar eventos a sugerencias
    attachSuggestionEvents(input, suggestions) {
        const container = input.nextElementSibling;
        const items = container.querySelectorAll('.suggestion-item');
        
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (item.classList.contains('suggestion-advanced')) {
                    this.performAdvancedSearch(input);
                } else {
                    this.selectSuggestion(input, suggestions[index]);
                }
            });

            item.addEventListener('mouseenter', () => {
                this.highlightSuggestion(container, index);
            });
        });
    }

    // Seleccionar sugerencia
    selectSuggestion(input, suggestion) {
        input.value = suggestion.name;
        this.hideSearchSuggestions(input);
        this.addToSearchHistory(input.value);
        
        // Navegar al resultado
        if (suggestion.type === 'aprendiz') {
            window.location.href = `/aprendiz/${suggestion.id}/`;
        } else if (suggestion.type === 'empresa') {
            window.location.href = `/empresa/${suggestion.id}/`;
        }
    }

    // Manejar teclado en búsqueda
    handleSearchKeydown(e) {
        const container = e.target.nextElementSibling;
        if (!container || !container.classList.contains('suggestions-container')) return;

        const items = container.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('suggestion-highlighted')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, items.length - 1);
                this.highlightSuggestion(container, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, -1);
                this.highlightSuggestion(container, currentIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    items[currentIndex].click();
                } else {
                    this.performAdvancedSearch(e.target);
                }
                break;
            case 'Tab':
                this.hideSearchSuggestions(e.target);
                break;
        }
    }

    // Resaltar sugerencia
    highlightSuggestion(container, index) {
        const items = container.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            item.classList.toggle('suggestion-highlighted', i === index);
        });
    }

    // Mostrar historial de búsqueda
    showSearchHistory(input) {
        if (this.searchHistory.length === 0) {
            this.hideSearchSuggestions(input);
            return;
        }

        let historyHtml = '<div class="suggestions-header">Historial de búsqueda</div>';
        this.searchHistory.slice(0, 5).forEach((term, index) => {
            historyHtml += `
                <div class="suggestion-item history-item" data-index="${index}">
                    <div class="suggestion-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <div class="suggestion-content">
                        <div class="suggestion-title">${term}</div>
                    </div>
                    <div class="suggestion-remove" data-term="${term}">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            `;
        });

        this.renderSuggestions(input, historyHtml);
        
        // Adjuntar eventos del historial
        const container = input.nextElementSibling;
        container.querySelectorAll('.history-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                input.value = this.searchHistory[index];
                this.performSearch(input.value);
            });
        });

        container.querySelectorAll('.suggestion-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromSearchHistory(btn.dataset.term);
                this.showSearchHistory(input);
            });
        });
    }

    // Realizar búsqueda
    performSearch(query) {
        this.addToSearchHistory(query);
        
        // Mostrar loading
        if (this.currentSearch) {
            this.showSearchLoading(this.currentSearch.input);
        }

        // Aquí iría la lógica real de búsqueda
        console.log('Buscando:', query);
        
        // Simular resultados
        setTimeout(() => {
            this.hideSearchLoading(this.currentSearch?.input);
            this.showNotification(`Búsqueda "${query}" completada`, 'success');
        }, 1000);
    }

    // Realizar búsqueda avanzada
    performAdvancedSearch(formOrInput) {
        let query, formData;
        
        if (formOrInput.tagName === 'FORM') {
            formData = new FormData(formOrInput);
            query = formData.get('q') || '';
        } else {
            query = formOrInput.value.trim();
        }

        if (!query) {
            this.showNotification('Ingrese un término de búsqueda', 'warning');
            return;
        }

        this.addToSearchHistory(query);
        this.hideSearchSuggestions(formOrInput.tagName === 'INPUT' ? formOrInput : null);
        
        // Construir URL de búsqueda avanzada
        const params = new URLSearchParams();
        params.set('q', query);
        
        if (formData) {
            for (const [key, value] of formData.entries()) {
                if (key !== 'q' && value) {
                    params.set(key, value);
                }
            }
        }

        // Redirigir a resultados
        window.location.href = `/buscar?${params.toString()}`;
    }

    // Aplicar filtros
    applyFilters() {
        const form = document.querySelector('.advanced-search-form');
        if (!form) return;

        const formData = new FormData(form);
        const filters = {};
        
        for (const [key, value] of formData.entries()) {
            if (value) {
                filters[key] = value;
            }
        }

        // Aplicar filtros a la tabla o lista actual
        this.filterCurrentResults(filters);
    }

    // Filtrar resultados actuales
    filterCurrentResults(filters) {
        const table = document.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            let showRow = true;
            
            // Aplicar cada filtro
            Object.entries(filters).forEach(([key, value]) => {
                const cellIndex = this.getColumnIndex(key);
                if (cellIndex >= 0) {
                    const cell = row.cells[cellIndex];
                    if (cell && !cell.textContent.toLowerCase().includes(value.toLowerCase())) {
                        showRow = false;
                    }
                }
            });

            row.style.display = showRow ? '' : 'none';
            if (showRow) visibleCount++;
        });

        // Mostrar contador de resultados
        this.updateResultCount(visibleCount, rows.length);
    }

    // Obtener índice de columna por nombre
    getColumnIndex(filterName) {
        const headerMap = {
            'estado': 0,
            'nombre': 1,
            'documento': 2,
            'programa': 3,
            'empresa': 4
        };
        return headerMap[filterName] || -1;
    }

    // Actualizar contador de resultados
    updateResultCount(visible, total) {
        let counter = document.querySelector('.search-results-count');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'search-results-count alert alert-info';
            const container = document.querySelector('table').parentNode;
            container.insertBefore(counter, container.firstChild);
        }
        
        counter.textContent = `Mostrando ${visible} de ${total} resultados`;
    }

    // Mostrar loading de búsqueda
    showSearchLoading(input) {
        input.classList.add('search-loading');
        if (!input.nextElementSibling?.classList.contains('search-spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'search-spinner';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(spinner);
        }
    }

    // Ocultar loading de búsqueda
    hideSearchLoading(input) {
        input.classList.remove('search-loading');
        const spinner = input.parentNode?.querySelector('.search-spinner');
        if (spinner) spinner.remove();
    }

    // Ocultar sugerencias
    hideSearchSuggestions(input) {
        const container = input?.nextElementSibling;
        if (container && container.classList.contains('suggestions-container')) {
            container.classList.remove('suggestions-visible');
            setTimeout(() => {
                if (!container.classList.contains('suggestions-visible')) {
                    container.style.display = 'none';
                }
            }, 300);
        }
    }

    // Limpiar búsqueda
    clearSearch(input) {
        input.value = '';
        this.hideSearchSuggestions(input);
        this.clearFilters();
    }

    // Limpiar filtros
    clearFilters() {
        const form = document.querySelector('.advanced-search-form');
        if (form) {
            form.reset();
        }
        
        // Mostrar todas las filas
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        
        // Ocultar contador
        const counter = document.querySelector('.search-results-count');
        if (counter) counter.remove();
    }

    // Gestión de historial
    loadSearchHistory() {
        const history = localStorage.getItem('search-history');
        return history ? JSON.parse(history) : [];
    }

    saveSearchHistory() {
        localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
    }

    addToSearchHistory(term) {
        term = term.trim();
        if (!term) return;
        
        // Remover si ya existe
        this.searchHistory = this.searchHistory.filter(item => item !== term);
        
        // Agregar al principio
        this.searchHistory.unshift(term);
        
        // Limitar a 20 términos
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        this.saveSearchHistory();
    }

    removeFromSearchHistory(term) {
        this.searchHistory = this.searchHistory.filter(item => item !== term);
        this.saveSearchHistory();
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
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
        const searchSystem = new AdvancedSearchSystem();
        window.advancedSearchSystem = searchSystem;
        return searchSystem;
    }
}

// CSS para el sistema de búsqueda avanzada
const searchCSS = `
.advanced-search {
    position: relative;
    background: var(--bg-primary);
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: all 0.3s ease;
    width: 100%;
}

.advanced-search:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.advanced-search.search-loading {
    padding-right: 2.5rem;
}

.search-spinner {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary-color);
    font-size: 1rem;
}

.suggestions-container {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 0.5rem 0.5rem;
    box-shadow: 0 0.5rem 1rem var(--shadow-color);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.suggestions-container.suggestions-visible {
    opacity: 1;
    transform: translateY(0);
}

.suggestions-header {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.suggestion-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid var(--border-color);
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.suggestion-highlighted {
    background-color: var(--bg-tertiary);
}

.suggestion-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-tertiary);
    border-radius: 50%;
    margin-right: 0.75rem;
    color: var(--primary-color);
    flex-shrink: 0;
}

.suggestion-content {
    flex: 1;
    min-width: 0;
}

.suggestion-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.suggestion-title mark {
    background-color: rgba(255, 193, 7, 0.3);
    color: inherit;
    padding: 0;
}

.suggestion-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.suggestion-type {
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--text-muted);
    background-color: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
}

.suggestion-remove {
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    margin-left: 0.5rem;
}

.suggestion-remove:hover {
    background-color: var(--danger-color);
    color: white;
}

.suggestion-advanced .suggestion-icon {
    background-color: var(--primary-color);
    color: white;
}

.search-results-count {
    margin-bottom: 1rem;
    border-radius: 0.5rem;
}

.filter-control {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 0.5rem;
    transition: all 0.3s ease;
}

.filter-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.advanced-search-form {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.advanced-search-form .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.advanced-search-form .btn-group {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
    .suggestions-container {
        max-height: 250px;
    }
    
    .advanced-search-form .form-row {
        grid-template-columns: 1fr;
    }
    
    .suggestion-item {
        padding: 0.5rem 0.75rem;
    }
    
    .suggestion-icon {
        width: 28px;
        height: 28px;
        margin-right: 0.5rem;
    }
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = searchCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AdvancedSearchSystem.init();
});

// Exportar para uso global
window.AdvancedSearchSystem = AdvancedSearchSystem;
