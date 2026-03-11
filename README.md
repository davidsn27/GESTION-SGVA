# Sistema de Gestión SENA

Un sistema web para la gestión de aprendices del SENA, empresas y etapas prácticas.

## Características

- **Gestión de Aprendices**: Registro, edición y seguimiento de aprendices
- **Gestión de Empresas**: Administración de empresas vinculadas
- **Carga Masiva**: Importación de datos desde archivos Excel
- **Dashboard**: Estadísticas y visualizaciones en tiempo real
- **Estados de Seguimiento**: Control de estados de disponibilidad y selección
- **Alertas**: Notificaciones para prácticas por terminar

## Requisitos

- Python 3.8+
- Django 4.2+
- Pandas 2.0+
- OpenPyXL 3.1+

## Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repositorio-url>
   cd sena20
   ```

2. **Crear entorno virtual**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar base de datos**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Crear superusuario**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Iniciar servidor**:
   ```bash
   python manage.py runserver
   ```

7. **Acceder a la aplicación**:
   - Sitio web: http://127.0.0.1:8000/
   - Panel de administración: http://127.0.0.1:8000/admin/

## Estructura del Proyecto

```
sena20/
├── manage.py                    # Script de gestión de Django
├── requirements.txt             # Dependencias del proyecto
├── README.md                   # Este archivo
├── sena_gestion/              # Configuración del proyecto
│   ├── __init__.py
│   ├── settings.py            # Configuración principal
│   ├── urls.py               # URLs principales
│   ├── wsgi.py               # Configuración WSGI
│   └── asgi.py               # Configuración ASGI
├── core/                     # Aplicación principal
│   ├── __init__.py
│   ├── admin.py              # Configuración de admin
│   ├── apps.py               # Configuración de la app
│   ├── models.py             # Modelos de datos
│   ├── forms.py              # Formularios
│   ├── views.py              # Vistas
│   ├── urls.py               # URLs de la app
│   ├── utils.py              # Utilidades
│   └── templates/core/        # Plantillas HTML
│       ├── base.html
│       ├── dashboard.html
│       ├── lista_aprendices.html
│       ├── carga_excel.html
│       ├── resultado_carga.html
│       ├── detalle_aprendiz.html
│       ├── editar_aprendiz.html
│       ├── lista_empresas.html
│       └── detalle_empresa.html
├── static/                   # Archivos estáticos
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── media/                    # Archivos multimedia
```

## Modelos de Datos

### Aprendiz
- Información personal (documento, nombres, apellidos, contacto)
- Datos académicos (programa, ficha, fechas de práctica)
- Estado actual (disponible, en proceso, etc.)
- Empresa vinculada

### Empresa
- Información básica (NIT, razón social, contacto)
- Sector económico
- Relación con aprendices

### CargaExcel
- Registro histórico de importaciones
- Estadísticas de procesamiento
- Control de errores

## Funcionalidades Principales

### 1. Dashboard
- Estadísticas generales
- Gráficos de estados
- Top empresas
- Últimas cargas

### 2. Gestión de Aprendices
- Lista con filtros avanzados
- Vista detallada
- Edición de datos
- Cambio de estado vía AJAX

### 3. Carga de Excel
- Importación masiva
- Validación de datos
- Reporte de errores
- Creación automática de empresas

### 4. Gestión de Empresas
- Listado de empresas
- Detalle con aprendices
- Estadísticas por empresa

## Formato de Archivo Excel

Para la carga masiva, el archivo Excel debe contener las siguientes columnas:

### Columnas Obligatorias
- `numero_documento`: Número de documento del aprendiz
- `nombres`: Nombres completos
- `apellidos`: Apellidos completos
- `programa_formacion`: Nombre del programa
- `estado`: Estado del aprendiz

### Columnas Opcionales
- `tipo_documento`: Tipo de documento (CC, TI, CE, PP)
- `email`: Correo electrónico
- `telefono`: Teléfono de contacto
- `ficha`: Número de ficha
- `fecha_inicio_etapa`: Fecha de inicio de práctica
- `fecha_fin_etapa`: Fecha de fin de práctica
- `nit_empresa`: NIT de la empresa
- `nombre_empresa`: Razón social de la empresa
- `direccion_empresa`: Dirección de la empresa
- `telefono_empresa`: Teléfono de la empresa
- `email_empresa`: Email de la empresa
- `sector_economico`: Sector económico
- `observaciones`: Observaciones adicionales

## Estados de Aprendices

- **DISPONIBLE**: Disponible para vinculación
- **INHABILITADO_ACT**: Inhabilitado por actualización
- **PROCESO_SELECCION**: En proceso de selección
- **PROCESO_ABIERTO**: Proceso de selección abierto
- **SIN_CONTRATO**: Contrato no registrado

## Configuración

### Variables de Entorno
- `SECRET_KEY`: Clave secreta de Django
- `DEBUG`: Modo de depuración
- `ALLOWED_HOSTS`: Hosts permitidos

### Base de Datos
Por defecto utiliza SQLite3. Para otros motores:

```python
# PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sena_gestion',
        'USER': 'usuario',
        'PASSWORD': 'contraseña',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Desarrollo

### Ejecutar Tests
```bash
python manage.py test
```

### Crear Migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### Recolectar Archivos Estáticos
```bash
python manage.py collectstatic
```

## Despliegue

### Producción
1. Configurar `DEBUG = False`
2. Establecer `ALLOWED_HOSTS`
3. Configurar base de datos producción
4. Recolectar archivos estáticos
5. Configurar servidor web (Nginx + Gunicorn)

### Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## Contribuir

1. Fork del proyecto
2. Crear rama de características (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Soporte

Para soporte técnico, contactar:
- Email: soporte@sena.edu.co
- Issues: [GitHub Issues](https://github.com/repo/issues)

## Créditos

Desarrollado para el Servicio Nacional de Aprendizaje (SENA) - Colombia.
