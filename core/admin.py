from django.contrib import admin
from .models import Aprendiz, Empresa, CargaExcel

@admin.register(Aprendiz)
class AprendizAdmin(admin.ModelAdmin):
    list_display = ['numero_documento', 'nombre_completo', 'especializacion', 'estado', 'empresa_vinculada']
    list_filter = ['estado', 'tipo_documento', 'fecha_carga']
    search_fields = ['nombres', 'apellidos', 'numero_documento', 'especializacion']
    list_editable = ['estado']
    date_hierarchy = 'fecha_carga'

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nit', 'razon_social', 'sector_economico', 'total_aprendices']
    search_fields = ['nit', 'razon_social']
    
    def total_aprendices(self, obj):
        return obj.aprendices.count()
    total_aprendices.short_description = 'Aprendices'

@admin.register(CargaExcel)
class CargaExcelAdmin(admin.ModelAdmin):
    list_display = ['fecha_carga', 'archivo', 'total_registros', 'registros_nuevos', 'registros_actualizados']
    readonly_fields = ['fecha_carga', 'total_registros', 'registros_nuevos', 'registros_actualizados', 'errores']
