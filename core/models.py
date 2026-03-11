from django.db import models
from django.core.validators import RegexValidator
import os

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
        ('DISPONIBLE', 'Disponible'),
        ('INHABILITADO_ACT', 'Inhabilitado por Actualización'),
        ('PROCESO_SELECCION', 'Proceso de Selección'),
        ('PROCESO_ABIERTO', 'Proceso de Selección Abierto'),
        ('CONTRATO_NO_REGISTRADO', 'Contrato no Registrado'),
    ]
    
    TIPO_DOCUMENTO = [
        ('CC', 'Cédula de Ciudadanía'),
        ('TI', 'Tarjeta de Identidad'),
        ('CE', 'Cédula de Extranjería'),
        ('PP', 'Pasaporte'),
    ]
    
    # Datos básicos
    tipo_documento = models.CharField(max_length=2, choices=TIPO_DOCUMENTO, default='CC', verbose_name='Tipo de Documento')
    numero_documento = models.CharField(max_length=20, unique=True, verbose_name='Número de Documento')
    nombres = models.CharField(max_length=100, verbose_name='Nombres')
    apellidos = models.CharField(max_length=100, verbose_name='Apellidos')
    email = models.EmailField(blank=True, null=True, verbose_name='Correo Electrónico')
    telefono = models.CharField(max_length=50, blank=True, null=True, verbose_name='Teléfono')
    
    # Datos del programa
    especializacion = models.CharField(max_length=200, blank=True, null=True, verbose_name='Especialización')
    ficha = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de Ficha')
    etapa_electiva = models.DateField(null=True, blank=True, verbose_name='Etapa Electiva')
    etapa_practica = models.DateField(null=True, blank=True, verbose_name='Etapa Práctica')
    
    # Estado y empresa
    estado_aprendiz = models.CharField(max_length=50, default='DISPONIBLE', verbose_name='Estado Aprendiz')
    estado = models.CharField(max_length=25, choices=ESTADOS, default='DISPONIBLE', verbose_name='Estado')
    empresa_vinculada = models.ForeignKey(
        Empresa, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='aprendices',
        verbose_name='Empresa Vinculada'
    )
    
    # Metadatos
    observaciones = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    fecha_carga = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Carga')
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    archivo_origen = models.CharField(max_length=200, blank=True, null=True, verbose_name='Archivo de Origen')
    
    class Meta:
        db_table = 'aprendices'
        verbose_name = 'Aprendiz'
        verbose_name_plural = 'Aprendices'
        ordering = ['-fecha_carga']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['empresa_vinculada']),
        ]
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.get_estado_display()}"
    
    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
    
    @property
    def dias_restantes_practica(self):
        """Calcula días restantes de etapa práctica"""
        from datetime import date
        if self.etapa_practica:
            dias = (self.etapa_practica - date.today()).days
            return dias if dias > 0 else 0
        return None
    
    @property
    def etapa_actual(self):
        """Determina la etapa actual según la fecha actual"""
        from datetime import date
        
        hoy = date.today()
        
        # Si tiene etapa práctica y está vigente
        if self.etapa_practica and self.etapa_practica >= hoy:
            return 'PRÁCTICA'
        
        # Si tiene etapa electiva y está vigente
        if self.etapa_electiva and self.etapa_electiva >= hoy:
            return 'ELECTIVA'
        
        # Si no tiene etapas o ya pasaron, está en etapa lectiva
        return 'LECTIVA'
    
    @property
    def tiene_practica_activa(self):
        """Determina si está en etapa práctica activa"""
        from datetime import date
        return self.etapa_practica and self.etapa_practica >= date.today()
    
    @property
    def tiene_electiva_activa(self):
        """Determina si está en etapa electiva activa"""
        from datetime import date
        return self.etapa_electiva and self.etapa_electiva >= date.today()

class CargaExcel(models.Model):
    """Registro histórico de cargas de Excel"""
    archivo = models.FileField(upload_to='cargas_excel/%Y/%m/', verbose_name='Archivo')
    fecha_carga = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Carga')
    total_registros = models.IntegerField(default=0, verbose_name='Total Registros')
    registros_nuevos = models.IntegerField(default=0, verbose_name='Registros Nuevos')
    registros_actualizados = models.IntegerField(default=0, verbose_name='Registros Actualizados')
    errores = models.TextField(blank=True, null=True, verbose_name='Errores')
    procesado_por = models.CharField(max_length=100, blank=True, null=True, verbose_name='Procesado Por')
    
    class Meta:
        db_table = 'cargas_excel'
        verbose_name = 'Carga Excel'
        verbose_name_plural = 'Cargas Excel'
        ordering = ['-fecha_carga']
    
    def __str__(self):
        return f"Carga {self.fecha_carga.strftime('%d/%m/%Y %H:%M')}"
    
    def filename(self):
        return os.path.basename(self.archivo.name)
