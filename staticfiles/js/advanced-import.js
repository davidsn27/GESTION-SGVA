// Advanced Import Manager - Importación masiva con validación en tiempo real
class AdvancedImportManager {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.validationRules = this.getValidationRules();
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupFileInput();
        this.setupRealTimeValidation();
        this.setupProgressBar();
    }

    // Reglas de validación
    getValidationRules() {
        return {
            required: ['numero_documento', 'nombres', 'apellidos', 'programa_formacion', 'estado'],
            optional: [
                'tipo_documento', 'email', 'telefono', 'ficha', 
                'fecha_inicio_etapa', 'fecha_fin_etapa', 'nit_empresa', 
                'nombre_empresa', 'direccion_empresa', 'telefono_empresa', 
                'email_empresa', 'sector_economico', 'observaciones'
            ],
            estados: ['DISPONIBLE', 'INHABILITADO_ACT', 'PROCESO_SELECCION', 'PROCESO_ABIERTO', 'SIN_CONTRATO'],
            tipos_documento: ['CC', 'TI', 'CE', 'PP'],
            validators: {
                email: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value),
                telefono: (value) => /^[0-9]{7,15}$/.test(value.replace(/[^0-9]/g, '')),
                documento: (value) => /^[0-9]{6,12}$/.test(value.replace(/[^0-9]/g, '')),
                fecha: (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2030;
                }
            }
        };
    }

    // Configurar drag and drop
    setupDragAndDrop() {
        const dropZone = document.querySelector('.drag-drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        }, false);

        // Click para seleccionar archivo
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.click();
        });
    }

    // Configurar input de archivo
    setupFileInput() {
        const fileInput = document.getElementById('file-input');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    // Configurar validación en tiempo real
    setupRealTimeValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('.validation-input')) {
                this.validateField(e.target);
            }
        });
    }

    // Configurar barra de progreso
    setupProgressBar() {
        const progressBar = document.querySelector('.import-progress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    // Prevenir eventos por defecto
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Manejar archivos
    async handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        
        // Validar archivo
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showNotification(validation.error, 'danger');
            return;
        }

        // Mostrar progreso
        this.showProgress('Validando archivo...', 10);

        try {
            // Leer archivo
            const data = await this.readFile(file);
            this.showProgress('Procesando datos...', 30);

            // Validar estructura
            const structureValidation = this.validateStructure(data);
            if (!structureValidation.valid) {
                this.showNotification(structureValidation.error, 'danger');
                this.hideProgress();
                return;
            }

            this.showProgress('Validando datos...', 50);

            // Validar datos
            const dataValidation = await this.validateData(data);
            this.showProgress('Preparando vista previa...', 80);

            // Mostrar vista previa
            this.showPreview(dataValidation);
            this.showProgress('Listo para importar', 100);

            setTimeout(() => this.hideProgress(), 1000);

        } catch (error) {
            console.error('Error procesando archivo:', error);
            this.showNotification('Error al procesar el archivo', 'danger');
            this.hideProgress();
        }
    }

    // Validar archivo
    validateFile(file) {
        // Validar formato
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            return {
                valid: false,
                error: `Formato no soportado. Use: ${this.supportedFormats.join(', ')}`
            };
        }

        // Validar tamaño
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: 'Archivo demasiado grande. Máximo 10MB'
            };
        }

        return { valid: true };
    }

    // Leer archivo
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const extension = '.' + file.name.split('.').pop().toLowerCase();
                    
                    if (extension === '.csv') {
                        resolve(this.parseCSV(data));
                    } else {
                        // Usar SheetJS para Excel
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                        resolve(jsonData);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    }

    // Parsear CSV
    parseCSV(csvText) {
        const lines = csvText.split('\\n');
        return lines.map(line => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        });
    }

    // Validar estructura
    validateStructure(data) {
        if (!data || data.length < 2) {
            return {
                valid: false,
                error: 'El archivo está vacío o no tiene datos válidos'
            };
        }

        const headers = data[0].map(h => h.toString().toLowerCase().trim());
        const requiredHeaders = this.validationRules.required.map(h => h.toLowerCase());
        
        const missingHeaders = requiredHeaders.filter(header => 
            !headers.some(h => h.includes(header))
        );

        if (missingHeaders.length > 0) {
            return {
                valid: false,
                error: `Faltan columnas requeridas: ${missingHeaders.join(', ')}`
            };
        }

        return { valid: true };
    }

    // Validar datos
    async validateData(data) {
        const headers = data[0];
        const rows = data.slice(1);
        const validatedData = [];
        const errors = [];
        const warnings = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowData = {};
            const rowErrors = [];
            const rowWarnings = [];

            // Mapear datos a columnas
            headers.forEach((header, index) => {
                const cleanHeader = header.toString().toLowerCase().trim().replace(/\\s+/g, '_');
                rowData[cleanHeader] = row[index] || '';
            });

            // Validar campos requeridos
            this.validationRules.required.forEach(field => {
                const value = rowData[field.toLowerCase().replace(/\\s+/g, '_')];
                if (!value || value.toString().trim() === '') {
                    rowErrors.push(`Campo '${field}' es requerido`);
                }
            });

            // Validar formato de campos
            Object.keys(rowData).forEach(key => {
                const value = rowData[key];
                if (!value) return;

                // Validar email
                if (key.includes('email') && !this.validationRules.validators.email(value)) {
                    rowErrors.push(`Email inválido: ${value}`);
                }

                // Validar teléfono
                if (key.includes('telefono') && !this.validationRules.validators.telefono(value)) {
                    rowWarnings.push(`Teléfono con formato sospechoso: ${value}`);
                }

                // Validar documento
                if (key.includes('documento') && !this.validationRules.validators.documento(value)) {
                    rowErrors.push(`Documento inválido: ${value}`);
                }

                // Validar fechas
                if (key.includes('fecha') && !this.validationRules.validators.fecha(value)) {
                    rowErrors.push(`Fecha inválida: ${value}`);
                }

                // Validar estado
                if (key.includes('estado') && !this.validationRules.estados.includes(value.toString().toUpperCase())) {
                    rowWarnings.push(`Estado no reconocido: ${value}`);
                }
            });

            // Agregar a resultados
            validatedData.push({
                row: i + 2, // +2 porque Excel empieza en 1 y omitimos encabezados
                data: rowData,
                errors: rowErrors,
                warnings: rowWarnings,
                valid: rowErrors.length === 0
            });

            // Acumular errores y advertencias
            errors.push(...rowErrors);
            warnings.push(...rowWarnings);
        }

        return {
            data: validatedData,
            totalRows: rows.length,
            validRows: validatedData.filter(row => row.valid).length,
            errors,
            warnings
        };
    }

    // Validar campo individual
    validateField(field) {
        const value = field.value.trim();
        const fieldType = field.dataset.type || 'text';
        
        field.classList.remove('is-valid', 'is-invalid');
        
        let isValid = true;
        let message = '';

        switch (fieldType) {
            case 'email':
                isValid = this.validationRules.validators.email(value);
                message = isValid ? 'Email válido' : 'Email inválido';
                break;
            case 'telefono':
                isValid = this.validationRules.validators.telefono(value);
                message = isValid ? 'Teléfono válido' : 'Teléfono inválido';
                break;
            case 'documento':
                isValid = this.validationRules.validators.documento(value);
                message = isValid ? 'Documento válido' : 'Documento inválido';
                break;
            case 'fecha':
                isValid = this.validationRules.validators.fecha(value);
                message = isValid ? 'Fecha válida' : 'Fecha inválida';
                break;
            case 'required':
                isValid = value !== '';
                message = isValid ? 'Campo válido' : 'Campo requerido';
                break;
        }

        field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        
        // Mostrar tooltip
        if (field.dataset.tooltip === 'true') {
            this.showFieldTooltip(field, message, isValid);
        }
    }

    // Mostrar tooltip de campo
    showFieldTooltip(field, message, isValid) {
        // Eliminar tooltip existente
        const existingTooltip = field.nextElementSibling?.classList.contains('field-tooltip');
        if (existingTooltip) {
            field.nextElementSibling.remove();
        }

        // Crear nuevo tooltip
        const tooltip = document.createElement('div');
        tooltip.className = `field-tooltip ${isValid ? 'valid' : 'invalid'}`;
        tooltip.textContent = message;
        
        field.parentNode.style.position = 'relative';
        field.parentNode.appendChild(tooltip);
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }

    // Mostrar progreso
    showProgress(message, percentage) {
        const progressBar = document.querySelector('.import-progress');
        const progressText = document.querySelector('.progress-text');
        const progressFill = document.querySelector('.progress-bar');
        
        if (progressBar) {
            progressBar.style.display = 'block';
            if (progressText) progressText.textContent = message;
            if (progressFill) {
                progressFill.style.width = percentage + '%';
                progressFill.setAttribute('aria-valuenow', percentage);
            }
        }
    }

    // Ocultar progreso
    hideProgress() {
        const progressBar = document.querySelector('.import-progress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    // Mostrar vista previa
    showPreview(validationResult) {
        const previewContainer = document.getElementById('import-preview');
        if (!previewContainer) return;

        const { data, totalRows, validRows, errors, warnings } = validationResult;
        
        let html = `
            <div class="import-summary mb-4">
                <div class="row">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-primary">${totalRows}</h5>
                                <p class="card-text">Total de filas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-success">${validRows}</h5>
                                <p class="card-text">Filas válidas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-danger">${errors.length}</h5>
                                <p class="card-text">Errores</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-warning">${warnings.length}</h5>
                                <p class="card-text">Advertencias</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar tabla de vista previa
        if (data.length > 0) {
            html += '<div class="preview-table"><table class="table table-striped" id="preview-table">';
            
            // Encabezados
            const headers = Object.keys(data[0].data);
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${header.replace(/_/g, ' ').toUpperCase()}</th>`;
            });
            html += '<th>Estado</th></tr></thead><tbody>';
            
            // Datos (primeras 10 filas)
            data.slice(0, 10).forEach(row => {
                const rowClass = row.valid ? 'table-success' : 'table-danger';
                html += `<tr class="${rowClass}">`;
                
                headers.forEach(header => {
                    html += `<td>${row.data[header] || ''}</td>`;
                });
                
                html += `<td>
                    <span class="badge ${row.valid ? 'bg-success' : 'bg-danger'}">
                        ${row.valid ? 'Válido' : 'Con errores'}
                    </span>
                </td></tr>`;
            });
            
            html += '</tbody></table></div>';
            
            if (data.length > 10) {
                html += `<p class="text-muted">Mostrando primeras 10 filas de ${data.length} totales</p>`;
            }
        }

        // Mostrar errores y advertencias
        if (errors.length > 0 || warnings.length > 0) {
            html += '<div class="validation-messages">';
            
            if (errors.length > 0) {
                html += '<div class="alert alert-danger"><h6>Errores:</h6><ul>';
                errors.slice(0, 10).forEach(error => {
                    html += `<li>${error}</li>`;
                });
                if (errors.length > 10) {
                    html += `<li>... y ${errors.length - 10} errores más</li>`;
                }
                html += '</ul></div>';
            }
            
            if (warnings.length > 0) {
                html += '<div class="alert alert-warning"><h6>Advertencias:</h6><ul>';
                warnings.slice(0, 10).forEach(warning => {
                    html += `<li>${warning}</li>`;
                });
                if (warnings.length > 10) {
                    html += `<li>... y ${warnings.length - 10} advertencias más</li>`;
                }
                html += '</ul></div>';
            }
            
            html += '</div>';
        }

        previewContainer.innerHTML = html;
        previewContainer.style.display = 'block';
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        if (typeof window.showAnimatedNotification === 'function') {
            window.showAnimatedNotification(message, type);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Inicializar importación
    static init() {
        const importManager = new AdvancedImportManager();
        window.advancedImportManager = importManager;
        return importManager;
    }
}

// CSS para el componente
const importCSS = `
.import-progress {
    margin: 2rem 0;
}

.progress-text {
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.field-tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    border-radius: 0.25rem;
    z-index: 1000;
    margin-top: 0.25rem;
}

.field-tooltip.valid {
    background-color: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
    border: 1px solid var(--success-color);
}

.field-tooltip.invalid {
    background-color: rgba(220, 53, 69, 0.1);
    color: var(--danger-color);
    border: 1px solid var(--danger-color);
}

.import-summary .card {
    transition: transform 0.3s ease;
}

.import-summary .card:hover {
    transform: translateY(-5px);
}

.preview-table {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
}

.validation-messages {
    margin-top: 1rem;
}

.validation-messages .alert {
    margin-bottom: 1rem;
}

.validation-messages ul {
    margin: 0;
    padding-left: 1.5rem;
}

.validation-messages li {
    margin-bottom: 0.25rem;
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = importCSS;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AdvancedImportManager.init();
});

// Exportar para uso global
window.AdvancedImportManager = AdvancedImportManager;
