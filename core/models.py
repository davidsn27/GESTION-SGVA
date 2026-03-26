from django.db import models
from django.utils import timezone

class Empresa(models.Model):
    nit = models.CharField(max_length=20, unique=True, verbose_name='NIT')
    razon_social = models.CharField(max_length=200, verbose_name='Razón Social')
    direccion = models.TextField(blank=True, null=True, verbose_name='Dirección')
    telefono = models.CharField(max_length=50, blank=True, null=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    sector_economico = models.CharField(max_length=100, blank=True, null=True, verbose_name='Sector Económico')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'empresas'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['razon_social']
    
    def __str__(self):
        return f"{self.nit} - {self.razon_social}"


class Aprendiz(models.Model):
    ESTADOS = [
        ("Disponible", "Disponible"),
        ("Aprendiz Aplica", "Aprendiz Aplica"),
        ("Empresa Solicita", "Empresa Solicita"),
        ("Aprendices Solicitados por Regional", "Aprendices Solicitados por Regional"),
        ("En Proceso de Selección", "En Proceso de Selección"),
        ("Proceso de Selección Abierto", "Proceso de Selección Abierto"),
        ("Contratado", "Contratado"),
        ("Final Contrato", "Final Contrato"),
        ("Cancelado", "Cancelado"),
        ("Alumno Retirado", "Alumno Retirado"),
        ("Aplazado", "Aplazado"),
        ("Pendiente Por Certificar", "Pendiente Por Certificar"),
        ("Bajo Rendimiento Académico", "Bajo Rendimiento Académico"),
        ("Aprendiz no interesado en contrato", "Aprendiz no interesado en contrato"),
        ("Inhabilitado Por Actualización", "Inhabilitado Por Actualización"),
        ("Contrato No Registrado", "Contrato No Registrado"),
        ("Fallecido", "Fallecido"),
    ]

    # Información básica
    nombre = models.CharField(max_length=200)
    documento = models.CharField(max_length=50)
    tipo_documento = models.CharField(max_length=20, blank=True, null=True)
    
    # Información de contacto
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    # Información académica
    programa = models.CharField(max_length=200, blank=True, null=True)
    ficha = models.CharField(max_length=50, blank=True, null=True)
    
    # Fechas importantes
    fecha_nacimiento = models.DateField(blank=True, null=True)
    fecha_ingreso = models.DateField(blank=True, null=True)
    fecha_lectiva = models.DateField(blank=True, null=True)
    fecha_practica = models.DateField(blank=True, null=True)
    
    # Información de ubicación
    regional = models.CharField(max_length=100, blank=True, null=True)
    centro = models.CharField(max_length=100, blank=True, null=True)
    municipio = models.CharField(max_length=100, blank=True, null=True)
    
    # Estado y vinculación
    estado = models.CharField(max_length=100, choices=ESTADOS, default="Disponible")
    empresa_vinculada = models.ForeignKey(Empresa, on_delete=models.SET_NULL, null=True, blank=True, related_name='aprendices')
    
    # Información del contrato
    nit_empresa = models.CharField(max_length=50, blank=True, null=True)
    razon_social_empresa = models.CharField(max_length=200, blank=True, null=True)
    fecha_inicio_contrato = models.DateField(blank=True, null=True)
    fecha_fin_contrato = models.DateField(blank=True, null=True)
    cantidad_de_contratos = models.IntegerField(blank=True, null=True, default=0)
    
    # Metadatos
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    archivo_origen = models.CharField(max_length=200, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre
