from django.contrib import admin
from .models import Aprendiz, Empresa


@admin.register(Aprendiz)
class AprendizAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'documento', 'programa', 'estado']
    list_filter = ['estado']
    search_fields = ['nombre', 'documento', 'programa']
    list_editable = ['estado']


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nit', 'razon_social', 'sector_economico']
    search_fields = ['nit', 'razon_social']
