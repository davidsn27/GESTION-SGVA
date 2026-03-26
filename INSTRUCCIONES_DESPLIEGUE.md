# 🚀 Instrucciones para Corregir Error 500 en Producción

## Problema Identificado
Error 500 (Internal Server Error) en: `sena--gestion-sgva--wzhvyyl6cgrx.code.run`

## ✅ Soluciones Aplicadas

### 1. ALLOWED_HOSTS Configurado
- **Archivo**: `sena_gestion/settings.py`
- **Cambio**: Agregado el dominio de producción a ALLOWED_HOSTS
- **Valor**: `sena--gestion-sgva--wzhvyyl6cgrx.code.run`

### 2. Archivos Estáticos Listos
- **Favicon**: Creado `static/favicon.ico` y `static/favicon.svg`
- **Configuración**: STATIC_ROOT configurado correctamente

## 🔧 Pasos para Desplegar

### Opción A: Automático (Recomendado)
```bash
# Ejecutar script de corrección
python deploy_fixes.py
```

### Opción B: Manual
```bash
# 1. Ejecutar migraciones
python manage.py migrate

# 2. Recolectar archivos estáticos
python manage.py collectstatic --noinput

# 3. Verificar configuración
python manage.py check --deploy

# 4. Reiniciar servidor (si es necesario)
```

## 🧪 Verificación

Después de desplegar, verifica:

1. **Sitio principal**: `https://sena--gestion-sgva--wzhvyyl6cgrx.code.run/`
2. **Favicon**: No debe mostrar error 500
3. **Consola**: No debe haber errores de JavaScript export

## 📋 Notas

- El error `webpage_content_reporter.js` es una extensión del navegador, no afecta la app
- Los cambios locales deben ser subidos al repositorio para que se reflejen en producción
- Si el error persiste, revisa los logs del servidor en Northflank

## 🔄 Si el Error Continúa

1. Verifica variables de entorno en Northflank
2. Revisa logs de despliegue
3. Confirma que los cambios están en el repositorio
4. Verifica configuración de la base de datos en producción
