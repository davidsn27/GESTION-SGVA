// Funciones JavaScript principales para Gestión SENA

// Función para obtener CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Configuración global para peticiones AJAX
const csrftoken = getCookie('csrftoken');

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar al principio del container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Función para confirmar acciones
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
}

// Función para formatear números
function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

// Función para debounce (limitar ejecución de funciones)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar número de documento colombiano
function isValidDocument(document) {
    // Eliminar espacios y caracteres especiales
    const cleanDoc = document.replace(/[^\d]/g, '');
    
    // Validar longitud (entre 6 y 12 dígitos)
    if (cleanDoc.length < 6 || cleanDoc.length > 12) {
        return false;
    }
    
    return true;
}

// Función para mostrar loading
function showLoading(element, text = 'Cargando...') {
    const originalContent = element.innerHTML;
    element.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        ${text}
    `;
    element.disabled = true;
    
    return originalContent;
}

// Función para ocultar loading
function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
}

// Función para exportar a Excel (simulado)
function exportToExcel(data, filename) {
    // Esta es una simulación - en un proyecto real usarías una librería como SheetJS
    showNotification('Función de exportación no implementada', 'warning');
}

// Función para imprimir contenido
function printContent(elementId) {
    const printContents = document.getElementById(elementId).innerHTML;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Re-inicializar eventos
    location.reload();
}

// Función para inicializar tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Función para inicializar popovers
function initializePopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Función para manejar errores AJAX
function handleAjaxError(error, defaultMessage = 'Ocurrió un error inesperado') {
    console.error('Error:', error);
    
    let message = defaultMessage;
    if (error.responseJSON && error.responseJSON.message) {
        message = error.responseJSON.message;
    } else if (error.statusText) {
        message = `Error: ${error.statusText}`;
    }
    
    showNotification(message, 'danger');
}

// Función para cambiar estado con animación
function cambiarEstadoConAnimacion(pk, nuevoEstado, url) {
    const row = document.querySelector(`tr[data-pk="${pk}"]`);
    if (row) {
        row.style.opacity = '0.5';
        row.style.transition = 'opacity 0.3s ease';
    }
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `estado=${nuevoEstado}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            handleAjaxError({ responseJSON: data });
            if (row) {
                row.style.opacity = '1';
            }
        }
    })
    .catch(error => {
        handleAjaxError(error);
        if (row) {
            row.style.opacity = '1';
        }
    });
}

// Función para buscar con debounce
function setupSearchDebounce(inputId, callback, delay = 300) {
    const input = document.getElementById(inputId);
    if (input) {
        const debouncedSearch = debounce(callback, delay);
        input.addEventListener('input', debouncedSearch);
    }
}

// Función para validar formulario antes de enviar
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
        
        // Validación específica para email
        if (input.type === 'email' && input.value) {
            if (!isValidEmail(input.value)) {
                input.classList.add('is-invalid');
                isValid = false;
            }
        }
        
        // Validación específica para documento
        if (input.id && input.id.includes('documento') && input.value) {
            if (!isValidDocument(input.value)) {
                input.classList.add('is-invalid');
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// Función para limpiar validaciones de formulario
function clearFormValidation(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.querySelectorAll('.is-invalid, .is-valid');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }
}

// Función para contar caracteres restantes
function setupCharacterCounter(textareaId, counterId, maxLength) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (textarea && counter) {
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} caracteres restantes`;
            
            if (remaining < 0) {
                counter.classList.add('text-danger');
                counter.classList.remove('text-muted');
            } else if (remaining < 50) {
                counter.classList.add('text-warning');
                counter.classList.remove('text-muted', 'text-danger');
            } else {
                counter.classList.add('text-muted');
                counter.classList.remove('text-warning', 'text-danger');
            }
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter(); // Inicializar
    }
}

// Función para inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips y popovers
    initializeTooltips();
    initializePopovers();
    
    // Agregar animación de entrada a los cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Configurar búsqueda con debounce si existe
    setupSearchDebounce('search-input', function() {
        // Lógica de búsqueda aquí
        console.log('Buscando...');
    });
    
    // Auto-ocultar alertas después de 5 segundos
    const alerts = document.querySelectorAll('.alert:not(.alert-dismissible)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transition = 'opacity 0.5s ease';
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 500);
            }
        }, 5000);
    });
    
    // Mejorar experiencia en formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Limpiar validaciones al empezar a escribir
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('is-invalid');
            });
        });
    });
    
    // Efecto hover mejorado para botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Exportar funciones para uso global
window.SENAGestion = {
    getCookie,
    showNotification,
    confirmAction,
    formatDate,
    formatNumber,
    debounce,
    isValidEmail,
    isValidDocument,
    showLoading,
    hideLoading,
    exportToExcel,
    printContent,
    initializeTooltips,
    initializePopovers,
    handleAjaxError,
    cambiarEstadoConAnimacion,
    setupSearchDebounce,
    validateForm,
    clearFormValidation,
    setupCharacterCounter
};
