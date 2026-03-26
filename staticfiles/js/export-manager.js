// Export Manager - Sistema de exportación real a Excel, CSV y PDF
class ExportManager {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
        this.init();
    }

    init() {
        this.setupExportButtons();
        this.setupKeyboardShortcuts();
    }

    // Configurar botones de exportación
    setupExportButtons() {
        // Botones de exportación en tablas
        document.addEventListener('click', (e) => {
            if (e.target.matches('.export-excel, .export-csv, .export-pdf')) {
                e.preventDefault();
                const tableId = e.target.dataset.table;
                const filename = e.target.dataset.filename || 'export';
                
                if (e.target.classList.contains('export-excel')) {
                    this.exportToExcel(tableId, filename);
                } else if (e.target.classList.contains('export-csv')) {
                    this.exportToCSV(tableId, filename);
                } else if (e.target.classList.contains('export-pdf')) {
                    this.exportToPDF(tableId, filename);
                }
            }
        });
    }

    // Exportar a Excel
    exportToExcel(tableId, filename = 'export') {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                this.showNotification('Tabla no encontrada', 'danger');
                return;
            }

            // Mostrar loading
            const loadingBtn = document.querySelector(`[data-table="${tableId}"].export-excel`);
            const originalContent = this.showButtonLoading(loadingBtn, 'Exportando...');

            // Preparar datos
            const ws_data = this.prepareTableData(table);
            
            // Crear workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            
            // Ajustar anchos de columna
            const colWidths = ws_data[0].map((_, colIndex) => {
                let maxWidth = 10;
                ws_data.forEach(row => {
                    const cellValue = String(row[colIndex] || '');
                    maxWidth = Math.max(maxWidth, cellValue.length);
                });
                return { wch: Math.min(maxWidth + 2, 50) };
            });
            ws['!cols'] = colWidths;

            // Agregar hoja al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            
            // Generar archivo
            XLSX.writeFile(wb, `${filename}_${this.getCurrentDate()}.xlsx`);
            
            // Restaurar botón
            this.hideButtonLoading(loadingBtn, originalContent);
            this.showNotification('Datos exportados a Excel exitosamente', 'success');
            
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            this.showNotification('Error al exportar a Excel', 'danger');
        }
    }

    // Exportar a CSV
    exportToCSV(tableId, filename = 'export') {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                this.showNotification('Tabla no encontrada', 'danger');
                return;
            }

            // Mostrar loading
            const loadingBtn = document.querySelector(`[data-table="${tableId}"].export-csv`);
            const originalContent = this.showButtonLoading(loadingBtn, 'Exportando...');

            // Preparar datos
            const ws_data = this.prepareTableData(table);
            
            // Convertir a CSV
            const csvContent = this.convertToCSV(ws_data);
            
            // Crear blob y descargar
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${this.getCurrentDate()}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Restaurar botón
            this.hideButtonLoading(loadingBtn, originalContent);
            this.showNotification('Datos exportados a CSV exitosamente', 'success');
            
        } catch (error) {
            console.error('Error exportando a CSV:', error);
            this.showNotification('Error al exportar a CSV', 'danger');
        }
    }

    // Exportar a PDF
    exportToPDF(tableId, filename = 'export') {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                this.showNotification('Tabla no encontrada', 'danger');
                return;
            }

            // Mostrar loading
            const loadingBtn = document.querySelector(`[data-table="${tableId}"].export-pdf`);
            const originalContent = this.showButtonLoading(loadingBtn, 'Exportando...');

            // Preparar datos
            const ws_data = this.prepareTableData(table);
            
            // Crear PDF
            const doc = new this.jsPDF('l', 'mm', 'a4');
            
            // Agregar título
            const title = filename.replace(/_/g, ' ').toUpperCase();
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            
            // Agregar fecha
            doc.setFontSize(10);
            doc.text(`Fecha: ${this.getCurrentDate()}`, 14, 22);
            
            // Preparar datos para autoTable
            const headers = ws_data[0];
            const data = ws_data.slice(1);
            
            // Agregar tabla
            doc.autoTable({
                head: [headers],
                body: data,
                startY: 30,
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [0, 123, 255],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 30, right: 14, bottom: 14, left: 14 }
            });
            
            // Guardar PDF
            doc.save(`${filename}_${this.getCurrentDate()}.pdf`);
            
            // Restaurar botón
            this.hideButtonLoading(loadingBtn, originalContent);
            this.showNotification('Datos exportados a PDF exitosamente', 'success');
            
        } catch (error) {
            console.error('Error exportando a PDF:', error);
            this.showNotification('Error al exportar a PDF', 'danger');
        }
    }

    // Preparar datos de la tabla
    prepareTableData(table) {
        const data = [];
        const rows = table.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            const rowData = [];
            const cells = row.querySelectorAll('th, td');
            
            cells.forEach(cell => {
                // Limpiar texto y remover HTML
                let text = cell.textContent || cell.innerText || '';
                text = text.replace(/\\s+/g, ' ').trim();
                
                // Manejar casos especiales
                if (cell.querySelector('.badge')) {
                    text = cell.querySelector('.badge').textContent.trim();
                }
                
                rowData.push(text);
            });
            
            // Solo agregar filas con datos
            if (rowData.some(cell => cell !== '')) {
                data.push(rowData);
            }
        });
        
        return data;
    }

    // Convertir datos a CSV
    convertToCSV(data) {
        return data.map(row => {
            return row.map(cell => {
                // Escapar comillas y envolver en comillas si contiene comas o comillas
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',');
        }).join('\\n');
    }

    // Exportar datos personalizados
    exportCustomData(data, filename, format = 'excel') {
        try {
            switch (format) {
                case 'excel':
                    this.exportCustomToExcel(data, filename);
                    break;
                case 'csv':
                    this.exportCustomToCSV(data, filename);
                    break;
                case 'pdf':
                    this.exportCustomToPDF(data, filename);
                    break;
                default:
                    throw new Error('Formato no soportado');
            }
        } catch (error) {
            console.error('Error en exportación personalizada:', error);
            this.showNotification('Error en exportación personalizada', 'danger');
        }
    }

    // Exportar datos personalizados a Excel
    exportCustomToExcel(data, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        XLSX.writeFile(wb, `${filename}_${this.getCurrentDate()}.xlsx`);
        this.showNotification('Datos exportados a Excel exitosamente', 'success');
    }

    // Exportar datos personalizados a CSV
    exportCustomToCSV(data, filename) {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${this.getCurrentDate()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Datos exportados a CSV exitosamente', 'success');
    }

    // Exportar datos personalizados a PDF
    exportCustomToPDF(data, filename) {
        const doc = new this.jsPDF('l', 'mm', 'a4');
        
        // Agregar título
        doc.setFontSize(16);
        doc.text(filename.replace(/_/g, ' ').toUpperCase(), 14, 15);
        
        // Agregar fecha
        doc.setFontSize(10);
        doc.text(`Fecha: ${this.getCurrentDate()}`, 14, 22);
        
        // Preparar datos
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(header => item[header] || ''));
            
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 30,
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [0, 123, 255],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });
        }
        
        doc.save(`${filename}_${this.getCurrentDate()}.pdf`);
        this.showNotification('Datos exportados a PDF exitosamente', 'success');
    }

    // Exportar dashboard completo
    exportDashboard(filename = 'dashboard') {
        try {
            // Capturar el dashboard
            const dashboard = document.querySelector('.container');
            if (!dashboard) {
                this.showNotification('Dashboard no encontrado', 'danger');
                return;
            }

            // Mostrar loading
            this.showNotification('Preparando exportación del dashboard...', 'info');

            // Usar html2canvas si está disponible, o exportar datos del dashboard
            if (typeof html2canvas !== 'undefined') {
                this.exportDashboardAsImage(dashboard, filename);
            } else {
                this.exportDashboardData(filename);
            }
            
        } catch (error) {
            console.error('Error exportando dashboard:', error);
            this.showNotification('Error al exportar dashboard', 'danger');
        }
    }

    // Exportar datos del dashboard
    exportDashboardData(filename) {
        const dashboardData = this.collectDashboardData();
        this.exportCustomData(dashboardData, filename, 'excel');
    }

    // Colectar datos del dashboard
    collectDashboardData() {
        const data = [];
        
        // Extraer estadísticas de cards
        document.querySelectorAll('.dashboard-card .card-title').forEach((card, index) => {
            const value = card.textContent.trim();
            const label = card.nextElementSibling?.textContent.trim() || `Estadística ${index + 1}`;
            
            data.push({
                'Métrica': label,
                'Valor': value,
                'Fecha': this.getCurrentDate()
            });
        });
        
        return data;
    }

    // Utilidades
    getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    showButtonLoading(button, text) {
        if (!button) return '';
        const originalContent = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
        button.disabled = true;
        return originalContent;
    }

    hideButtonLoading(button, originalContent) {
        if (!button) return;
        button.innerHTML = originalContent;
        button.disabled = false;
    }

    showNotification(message, type = 'info') {
        if (typeof window.showAnimatedNotification === 'function') {
            window.showAnimatedNotification(message, type);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Configurar atajos de teclado
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+E para exportar tabla actual
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const activeTable = document.querySelector('table:focus') || document.querySelector('table');
                if (activeTable) {
                    this.exportToExcel(activeTable.id, 'tabla_actual');
                }
            }
            
            // Ctrl+Shift+E para exportar a PDF
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                const activeTable = document.querySelector('table:focus') || document.querySelector('table');
                if (activeTable) {
                    this.exportToPDF(activeTable.id, 'tabla_actual');
                }
            }
        });
    }

    // Crear botones de exportación para una tabla
    createExportButtons(tableId, filename = 'export') {
        const container = document.createElement('div');
        container.className = 'export-buttons mb-3';
        container.innerHTML = `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-success export-excel" data-table="${tableId}" data-filename="${filename}">
                    <i class="fas fa-file-excel me-2"></i>Excel
                </button>
                <button type="button" class="btn btn-info export-csv" data-table="${tableId}" data-filename="${filename}">
                    <i class="fas fa-file-csv me-2"></i>CSV
                </button>
                <button type="button" class="btn btn-danger export-pdf" data-table="${tableId}" data-filename="${filename}">
                    <i class="fas fa-file-pdf me-2"></i>PDF
                </button>
            </div>
        `;
        
        return container;
    }

    // Agregar botones de exportación a todas las tablas
    addExportButtonsToAllTables() {
        document.querySelectorAll('table[id]').forEach(table => {
            const tableId = table.id;
            const filename = tableId.replace(/_/g, '-');
            
            // Verificar si ya tiene botones
            if (!table.previousElementSibling?.classList.contains('export-buttons')) {
                const buttons = this.createExportButtons(tableId, filename);
                table.parentNode.insertBefore(buttons, table);
            }
        });
    }

    // Inicializar exportación automática
    static init() {
        const exportManager = new ExportManager();
        
        // Agregar botones a tablas existentes
        setTimeout(() => {
            exportManager.addExportButtonsToAllTables();
        }, 1000);
        
        // Exportar para uso global
        window.exportManager = exportManager;
        
        return exportManager;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ExportManager.init();
});

// Exportar para uso global
window.ExportManager = ExportManager;
