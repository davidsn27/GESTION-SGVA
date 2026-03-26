# 🎭 Efectos de Carga - Loading Effects

Este sistema proporciona efectos de carga profesionales y modernos para mejorar la experiencia del usuario en todas las acciones de la aplicación.

## 📁 Archivos

- **`static/css/loading-effects.css`** - Estilos CSS para todos los efectos de carga
- **`static/js/loading-effects.js`** - JavaScript con el gestor de carga
- **`templates/core/base.html`** - Template base actualizado con los efectos

## 🚀 Características

### ✨ Efectos Disponibles

1. **Botones con carga** - Spinners animados en botones
2. **Overlay de carga** - Pantalla completa con mensaje personalizado
3. **Skeleton loading** - Efecto placeholder mientras carga contenido
4. **Shimmer de tabla** - Efecto brillante en filas de tabla
5. **Barra de progreso** - Indicador de progreso animado
6. **Validación en tiempo real** - Efectos sutiles en formularios

### 🎨 Tipos de Efectos

- **`loading-save`** - Para acciones de guardar/actualizar (verde)
- **`loading-delete`** - Para acciones de eliminar (rojo)
- **`loading-search`** - Para búsquedas (morado)
- **`loading-upload`** - Para carga de archivos (azul)

## 💡 Uso Automático

Los efectos se aplican automáticamente a:

### 📝 Formularios
```html
<form method="post">
    <button type="submit">Guardar</button>
    <!-- Se aplicará efecto de carga automáticamente -->
</form>
```

### 📂 Carga de Archivos
```html
<form enctype="multipart/form-data">
    <input type="file" name="excel">
    <button type="submit">Subir</button>
    <!-- Mostrará progreso y tamaño del archivo -->
</form>
```

### 🗑️ Botones de Eliminación
```html
<button class="btn-danger">Eliminar</button>
<!-- Pedirá confirmación y mostrará carga -->
```

## 🔧 Uso Manual

### Mostrar/Ocultar Carga
```javascript
// Mostrar carga personalizada
window.showLoading('Procesando...', 'Espera un momento');

// Ocultar carga
window.hideLoading();
```

### Skeleton Loading
```javascript
// Mostrar skeleton
const container = document.getElementById('content');
window.showSkeleton(container, 3); // 3 elementos

// Ocultar skeleton
window.hideSkeleton(container);
```

### Efectos en Tablas
```javascript
// Mostrar shimmer en tabla
const table = document.querySelector('.table');
window.loadingManager.showTableShimmer(table);

// Ocultar shimmer
window.loadingManager.hideTableShimmer(table);
```

### Barra de Progreso
```javascript
// Mostrar progreso
const container = document.getElementById('progress');
const interval = window.loadingManager.showProgress(container, 'Procesando...');

// Completar progreso
window.loadingManager.completeProgress(interval, container);
```

## 🎯 Ejemplos por Página

### 📋 Lista de Aprendices
- ✅ Shimmer en tabla mientras carga
- ✅ Efecto en búsqueda
- ✅ Confirmación en eliminación masiva
- ✅ Carga individual en botones de acción

### ✏️ Editar Aprendiz
- ✅ Carga al guardar cambios
- ✅ Validación sutil en campos
- ✅ Efectos en botones de acción

### 📊 Cargar Excel
- ✅ Validación de archivo
- ✅ Información del archivo seleccionado
- ✅ Barra de progreso durante carga
- ✅ Tamaño y nombre del archivo

### 🗑️ Confirmar Eliminación
- ✅ Checkbox animado
- ✅ Efecto en botón eliminar
- ✅ Animación en advertencias
- ✅ Efecto en cancelar

## 🎨 Personalización

### Modificar Colores
```css
.btn-loading.loading-save {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}
```

### Modificar Tiempos
```javascript
// En loading-effects.js
setTimeout(() => {
    window.loadingManager.hideLoading();
}, 2000); // 2 segundos
```

### Mensajes Personalizados
```javascript
window.loadingManager.showLoading(
    'Mensaje personalizado',
    'Submensaje opcional'
);
```

## 🔄 Eventos

### Eventos Automáticos
- `submit` en formularios
- `click` en botones
- `change` en inputs de archivo
- `blur` en validación de campos

### Eventos Personalizados
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Efectos personalizados para tu página
});
```

## 📱 Responsive

Los efectos se adaptan automáticamente:

- **Móvil**: Overlay más pequeño, spinner más pequeño
- **Tablet**: Tamaño intermedio
- **Desktop**: Efectos completos

## 🐛 Solución de Problemas

### Efectos no aparecen
1. Verifica que los archivos CSS/JS estén cargados en `base.html`
2. Revisa la consola del navegador para errores
3. Asegúrate de que el JavaScript se ejecute después del DOM

### Efectos muy lentos
1. Reduce los timeouts en el JavaScript
2. Optimiza las animaciones CSS
3. Revisa el rendimiento del servidor

### Conflictos con otros scripts
1. Usa `window.loadingManager` para acceder al gestor
2. Evita múltiples listeners en los mismos elementos
3. Usa `event.preventDefault()` cuando sea necesario

## 🚀 Mejoras Futuras

- [ ] Efectos de carga para AJAX
- [ ] Animaciones más avanzadas
- [ ] Soporte para WebSockets
- [ ] Efectos de carga offline
- [ ] Personalización por usuario

## 📞 Soporte

Si tienes problemas con los efectos de carga:

1. Revisa la consola del navegador
2. Verifica que los archivos existan en `static/`
3. Prueba con diferentes navegadores
4. Limpia la caché del navegador

---

**Creado por:** Sistema de Gestión SENA  
**Versión:** 1.0  
**Última actualización:** 2024
