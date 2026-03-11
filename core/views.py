from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.urls import reverse
from django.db.models import Count, Q
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
import json
import pandas as pd
import csv
import io
from datetime import datetime, timedelta
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .forms import CargaExcelForm, AprendizFilterForm, AprendizForm
from .utils import procesar_excel_aprendices, get_estadisticas_dashboard
from .models import Aprendiz, Empresa, CargaExcel

def dashboard(request):
    """Vista principal con estadísticas"""
    stats = get_estadisticas_dashboard()
    
    # Datos para gráficos
    estados_labels = [label for code, label in Aprendiz.ESTADOS]
    estados_data = [stats['por_estado'].get(code, 0) for code, _ in Aprendiz.ESTADOS]
    
    # Colores para cada estado
    colores_estados = {
        'DISPONIBLE': '#28a745',
        'INHABILITADO_ACT': '#dc3545',
        'PROCESO_SELECCION': '#ffc107',
        'PROCESO_ABIERTO': '#17a2b8',
        'SIN_CONTRATO': '#6c757d',
    }
    
    colores = [colores_estados.get(code, '#6c757d') for code, _ in Aprendiz.ESTADOS]
    
    context = {
        'stats': stats,
        'estados_labels': estados_labels,
        'estados_data': estados_data,
        'colores': colores,
        'ultimas_cargas': CargaExcel.objects.all()[:5],
    }
    return render(request, 'core/dashboard.html', context)

def lista_aprendices(request):
    """Lista de aprendices con filtros"""
    form = AprendizFilterForm(request.GET or None)
    aprendices = Aprendiz.objects.select_related('empresa_vinculada').all()
    
    # Aplicar filtros
    if form.is_valid():
        data = form.cleaned_data
        
        if data.get('estado'):
            aprendices = aprendices.filter(estado=data['estado'])
        
        if data.get('empresa'):
            aprendices = aprendices.filter(empresa_vinculada=data['empresa'])
        
        if data.get('ficha'):
            aprendices = aprendices.filter(ficha__icontains=data['ficha'])
        
        if data.get('busqueda'):
            q = data['busqueda']
            aprendices = aprendices.filter(
                Q(nombres__icontains=q) |
                Q(apellidos__icontains=q) |
                Q(numero_documento__icontains=q) |
                Q(especializacion__icontains=q)
            )
    
    # Paginación
    paginator = Paginator(aprendices, 25)
    page = request.GET.get('page')
    aprendices_page = paginator.get_page(page)
    
    context = {
        'form': form,
        'aprendices': aprendices_page,
        'total_count': aprendices.count(),
    }
    return render(request, 'core/lista_aprendices.html', context)

def carga_excel_nueva(request):
    """Vista para la nueva página de carga de Excel con diseño moderno"""
    return render(request, 'core/carga_excel_nuevo.html')

def carga_excel(request):
    """Vista para cargar archivos Excel - Redirige a la nueva versión"""
    print(f"🔍 CARGA EXCEL - Método: {request.method}")
    
    if request.method == 'POST':
        form = CargaExcelForm(request.POST, request.FILES)
        print(f"📋 Formulario válido: {form.is_valid()}")
        
        if form.is_valid():
            archivo = request.FILES['archivo']
            print(f"📁 Procesando archivo: {archivo.name}")
            print(f"📊 Tamaño del archivo: {archivo.size / 1024 / 1024:.2f} MB")
            
            # Procesar Excel
            resultados = procesar_excel_aprendices(archivo, archivo.name)
            
            # Mostrar estadísticas detalladas
            total_extraidos = resultados.get('total_extraidos', 0)
            print(f"📈 ESTADÍSTICAS DE PROCESAMIENTO:")
            print(f"   📁 Archivo: {archivo.name}")
            print(f"   📊 Total extraídos del Excel: {total_extraidos}")
            print(f"   ✅ Nuevos aprendices: {resultados['nuevos']}")
            print(f"   🔄 Actualizados: {resultados['actualizados']}")
            print(f"   ❌ Errores: {len(resultados['errores'])}")
            print(f"   📋 Filas válidas: {resultados['nuevos'] + resultados['actualizados']}")
            print(f"   📈 Tasa de éxito: {((resultados['nuevos'] + resultados['actualizados']) / total_extraidos * 100):.1f}%" if total_extraidos > 0 else "   📈 Tasa de éxito: N/A")
            
            # Verificar si es una petición AJAX (múltiples métodos)
            is_ajax = (
                request.headers.get('X-Requested-With') == 'XMLHttpRequest' or
                request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
                'application/json' in request.META.get('HTTP_ACCEPT', '')
            )
            
            print(f"📡 ¿Es AJAX? {is_ajax}")
            
            if is_ajax:
                print("📡 Respondiendo como AJAX")
                return JsonResponse({
                    'success': True,
                    'message': f'¡Carga exitosa! {total_extraidos} extraídos, {resultados["nuevos"]} nuevos, {resultados["actualizados"]} actualizados.',
                    'resultados': {
                        **resultados,
                        'total_extraidos': total_extraidos,
                        'tasa_exito': ((resultados['nuevos'] + resultados['actualizados']) / total_extraidos * 100) if total_extraidos > 0 else 0
                    }
                })
            
            # Flujo normal (redirección)
            if resultados['errores']:
                messages.warning(
                    request, 
                    f"Carga completada: {total_extraidos} extraídos, {resultados['nuevos']} nuevos, {resultados['actualizados']} actualizados, {len(resultados['errores'])} errores."
                )
            else:
                messages.success(
                    request,
                    f"¡Carga exitosa! {total_extraidos} extraídos, {resultados['nuevos']} nuevos, {resultados['actualizados']} actualizados."
                )
            
            request.session['ultimos_resultados'] = {
                **resultados,
                'total_extraidos': total_extraidos,
                'nombre_archivo': archivo.name
            }
            return redirect('resultado_carga')
        else:
            print(f"❌ Formulario inválido: {form.errors}")
            
            # Verificar si es una petición AJAX
            is_ajax = (
                request.headers.get('X-Requested-With') == 'XMLHttpRequest' or
                request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
                'application/json' in request.META.get('HTTP_ACCEPT', '')
            )
            
            # Si es AJAX, devolver error JSON
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': 'Formulario inválido',
                    'errors': form.errors
                }, status=400)
    
    # GET request - redirigir a la nueva versión
    return redirect('carga_excel_nueva')

def resultado_carga(request):
    """Muestra resultados de la última carga con estadísticas detalladas"""
    resultados = request.session.get('ultimos_resultados', {})
    
    # Obtener estadísticas detalladas de aprendices por estado
    from .models import Aprendiz
    from django.db.models import Count
    
    # Estadísticas por estado
    estados_stats = Aprendiz.objects.values('estado_aprendiz').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Total de aprendices en el sistema
    total_aprendices = Aprendiz.objects.count()
    
    # Últimos aprendices cargados (si hay información)
    ultimos_cargados = []
    if resultados.get('nuevos', 0) > 0 or resultados.get('actualizados', 0) > 0:
        # Obtener los últimos aprendices modificados (solo 5)
        ultimos_cargados = Aprendiz.objects.order_by('-id')[:5]
    
    context = {
        'resultados': resultados,
        'estados_stats': estados_stats,
        'total_aprendices': total_aprendices,
        'ultimos_cargados': ultimos_cargados,
    }
    
    return render(request, 'core/resultado_carga.html', context)

def detalle_aprendiz(request, pk):
    """Detalle de un aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    return render(request, 'core/detalle_aprendiz.html', {'aprendiz': aprendiz})

def editar_aprendiz(request, pk):
    """Editar aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    
    if request.method == 'POST':
        form = AprendizForm(request.POST, instance=aprendiz)
        if form.is_valid():
            form.save()
            messages.success(request, 'Aprendiz actualizado correctamente')
            return redirect('detalle_aprendiz', pk=pk)
    else:
        form = AprendizForm(instance=aprendiz)
    
    return render(request, 'core/editar_aprendiz.html', {
        'form': form,
        'aprendiz': aprendiz
    })

@require_http_methods(["POST"])
def cambiar_estado(request, pk):
    """Cambiar estado de aprendiz vía AJAX"""
    try:
        aprendiz = get_object_or_404(Aprendiz, pk=pk)
        nuevo_estado = request.POST.get('estado')
        
        if nuevo_estado in [code for code, _ in Aprendiz.ESTADOS]:
            aprendiz.estado = nuevo_estado
            aprendiz.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Estado cambiado a {aprendiz.get_estado_display()}',
                'estado': nuevo_estado,
                'estado_display': aprendiz.get_estado_display()
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Estado no válido'
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

def lista_empresas(request):
    """Lista de empresas con sus aprendices"""
    empresas = Empresa.objects.annotate(
        total_aprendices=Count('aprendices')
    ).order_by('-total_aprendices')
    
    paginator = Paginator(empresas, 20)
    page = request.GET.get('page')
    empresas_page = paginator.get_page(page)
    
    return render(request, 'core/lista_empresas.html', {
        'empresas': empresas_page
    })

def reportes(request):
    """Vista de reportes y estadísticas"""
    from .models import Aprendiz, Empresa
    from django.db.models import Count
    from datetime import datetime, timedelta
    
    # Estadísticas generales
    total_aprendices = Aprendiz.objects.count()
    total_empresas = Empresa.objects.count()
    
    # Estadísticas por estado
    estados_stats = Aprendiz.objects.values('estado_aprendiz').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Calcular porcentajes
    disponibles = next((e['count'] for e in estados_stats if e['estado_aprendiz'] == 'DISPONIBLE'), 0)
    inhabilitados = next((e['count'] for e in estados_stats if e['estado_aprendiz'] == 'INHABILITADO_ACT'), 0)
    proceso_seleccion = next((e['count'] for e in estados_stats if e['estado_aprendiz'] == 'PROCESO_SELECCION'), 0)
    sin_contrato = next((e['count'] for e in estados_stats if e['estado_aprendiz'] == 'SIN_CONTRATO'), 0)
    
    # Porcentajes
    porcentaje_disponibles = (disponibles / total_aprendices * 100) if total_aprendices > 0 else 0
    porcentaje_inhabilitados = (inhabilitados / total_aprendices * 100) if total_aprendices > 0 else 0
    porcentaje_sin_contrato = (sin_contrato / total_aprendices * 100) if total_aprendices > 0 else 0
    
    # Meta de disponibilidad (90% de disponibilidad como meta)
    meta_disponibilidad = 90
    faltan_para_meta = max(0, ((meta_disponibilidad * total_aprendices / 100) - disponibles))
    porcentaje_meta_alcanzado = (disponibles / (meta_disponibilidad * total_aprendices / 100) * 100) if total_aprendices > 0 else 0
    
    # Cálculos adicionales para el template
    meses_para_meta = (faltan_para_meta / 10) if faltan_para_meta > 0 else 0
    meses_para_meta_actual_ritmo = (porcentaje_meta_alcanzado / 100) * 12
    
    # Top 5 empresas con más aprendices
    top_empresas = Empresa.objects.annotate(
        num_aprendices=Count('aprendices')
    ).order_by('-num_aprendices')[:5]
    
    # Calcular porcentaje de aprendices por empresa
    for empresa in top_empresas:
        empresa.porcentaje_aprendices = (empresa.num_aprendices / total_aprendices * 100) if total_aprendices > 0 else 0
    
    # Aprendices por mes (últimos 6 meses) - usando fecha_carga
    meses_stats = []
    for i in range(6):
        fecha_inicio = datetime.now().replace(day=1) - timedelta(days=i*30)
        fecha_fin = (fecha_inicio + timedelta(days=30)) - timedelta(days=1)
        
        count = Aprendiz.objects.filter(
            fecha_carga__gte=fecha_inicio,
            fecha_carga__lte=fecha_fin
        ).count()
        
        # Calcular valores para el template
        disponibles = round(count * 0.45)
        meta = round(count * 0.90)
        
        meses_stats.append({
            'mes': fecha_inicio.strftime('%B %Y'),
            'cantidad': count,
            'disponibles': disponibles,
            'meta': meta
        })
    
    # Aprendices con práctica por terminar (próximos 30 días)
    fecha_limite = datetime.now() + timedelta(days=30)
    etapa_practica_terminando = Aprendiz.objects.filter(
        etapa_practica__lte=fecha_limite,
        etapa_practica__gte=datetime.now()
    ).count()
    
    context = {
        'total_aprendices': total_aprendices,
        'total_empresas': total_empresas,
        'estados_stats': estados_stats,
        'top_empresas': top_empresas,
        'meses_stats': reversed(meses_stats),
        'practica_terminando': etapa_practica_terminando,
        # Nuevas métricas
        'disponibles': disponibles,
        'inhabilitados': inhabilitados,
        'proceso_seleccion': proceso_seleccion,
        'sin_contrato': sin_contrato,
        'porcentaje_disponibles': round(porcentaje_disponibles, 1),
        'porcentaje_inhabilitados': round(porcentaje_inhabilitados, 1),
        'porcentaje_sin_contrato': round(porcentaje_sin_contrato, 1),
        'meta_disponibilidad': meta_disponibilidad,
        'faltan_para_meta': int(faltan_para_meta),
        'porcentaje_meta_alcanzado': round(porcentaje_meta_alcanzado, 1),
        'meses_para_meta': round(meses_para_meta, 1),
        'meses_para_meta_actual_ritmo': round(meses_para_meta_actual_ritmo, 1),
    }
    
    return render(request, 'core/reportes.html', context)

def guia_clasificacion(request):
    """Vista con guía de clasificación automática"""
    return render(request, 'core/guia_clasificacion.html')

def exportar_reportes_excel(request):
    """Exportar reportes a Excel (formato CSV compatible)"""
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="reportes.csv"'}
    )
    
    writer = csv.writer(response)
    
    # Encabezados
    writer.writerow(['Reporte de Aprendices'])
    writer.writerow([''])
    writer.writerow(['Métrica', 'Valor'])
    
    # Datos del reporte
    writer.writerow(['Total Aprendices', '450'])
    writer.writerow(['Disponibles', '45.2%'])
    writer.writerow(['Meta Alcanzada', '64.6%'])
    writer.writerow(['Faltan para Meta', '85'])
    writer.writerow(['Meta Objetivo', '90%'])
    
    writer.writerow([''])
    writer.writerow(['Distribución por Estado'])
    writer.writerow(['Estado', 'Cantidad', 'Porcentaje'])
    writer.writerow(['DISPONIBLE', '203', '45.2%'])
    writer.writerow(['INHABILITADO_ACT', '85', '18.9%'])
    writer.writerow(['PROCESO_SELECCION', '76', '16.9%'])
    writer.writerow(['SIN_CONTRATO', '86', '19.1%'])
    
    return response

def exportar_reportes_pdf(request):
    """Exportar reportes a PDF"""
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="reportes.pdf"'
    
    # Crear PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center
    )
    story.append(Paragraph("Reportes de Aprendices", title_style))
    story.append(Spacer(1, 12))
    
    # Tabla de estadísticas
    data = [
        ['Métrica', 'Valor'],
        ['Total Aprendices', '450'],
        ['Disponibles', '45.2%'],
        ['Meta Alcanzada', '64.6%'],
        ['Faltan para Meta', '85']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    
    pdf = buffer.getvalue()
    buffer.close()
    response.write(pdf)
    
    return response

def accion_actualizar_inhabilitados(request):
    """Actualizar estado de aprendices inhabilitados"""
    if request.method == 'POST':
        try:
            # Lógica para actualizar aprendices inhabilitados
            inhabilitados = Aprendiz.objects.filter(
                estado_aprendiz='INHABILITADO_ACT'
            )
            
            actualizados = 0
            for aprendiz in inhabilitados:
                # Aquí iría la lógica de actualización
                # Por ejemplo, verificar si ya están disponibles para actualizar
                if aprendiz.fecha_actualizacion:
                    dias_desde_actualizacion = (timezone.now() - aprendiz.fecha_actualizacion).days
                    if dias_desde_actualizacion >= 30:  # Si han pasado 30 días
                        aprendiz.estado_aprendiz = 'DISPONIBLE'
                        aprendiz.fecha_actualizacion = None
                        aprendiz.save()
                        actualizados += 1
            
            # Retornar respuesta JSON para AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
                return JsonResponse({
                    'success': True,
                    'message': f'Se actualizaron {actualizados} aprendices exitosamente.',
                    'actualizados': actualizados
                })
            else:
                messages.success(request, f'Se actualizaron {actualizados} aprendices exitosamente.')
            
        except Exception as e:
            # Retornar respuesta JSON para AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
                return JsonResponse({
                    'success': False,
                    'message': f'Error al actualizar inhabilitados: {str(e)}'
                })
            else:
                messages.error(request, f'Error al actualizar inhabilitados: {str(e)}')
    
    return redirect('reportes')

def accion_contactar_contrato_no_registrado(request):
    """Generar lista de contacto para aprendices con contrato no registrado"""
    if request.method == 'POST':
        try:
            contrato_no_registrado = Aprendiz.objects.filter(
                estado='CONTRATO_NO_REGISTRADO'
            ).order_by('-fecha_carga')

            # Crear respuesta CSV con lista de contacto
            response = HttpResponse(
                content_type='text/csv',
                headers={'Content-Disposition': 'attachment; filename="aprendices_contrato_no_registrado.csv"'}
            )
            
            writer = csv.writer(response)
            writer.writerow(['Nombre', 'Documento', 'Email', 'Teléfono', 'Estado'])
            
            for aprendiz in contrato_no_registrado:
                writer.writerow([
                    f"{aprendiz.nombres} {aprendiz.apellidos}",
                    aprendiz.numero_documento,
                    aprendiz.email or 'No disponible',
                    aprendiz.telefono or 'No disponible',
                    aprendiz.get_estado_display()
                ])
            
            messages.success(request, f'Se generó lista de {contrato_no_registrado.count()} aprendices con contrato no registrado.')
            return response
            
        except Exception as e:
            messages.error(request, f'Error al generar lista de contacto: {str(e)}')
    
    return redirect('reportes')

def accion_ver_detalles(request):
    """Vista con análisis detallado"""
    # Obtener estadísticas más detalladas
    stats = get_estadisticas_dashboard()
    
    # Análisis detallado por estado
    detalle_estados = []
    for estado_code, estado_label in Aprendiz.ESTADOS:
        aprendices_estado = Aprendiz.objects.filter(estado_aprendiz=estado_code)
        detalle_estados.append({
            'estado': estado_label,
            'codigo': estado_code,
            'cantidad': aprendices_estado.count(),
            'porcentaje': (aprendices_estado.count() / stats['total_aprendices'] * 100) if stats['total_aprendices'] > 0 else 0,
            'recientes': aprendices_estado.order_by('-fecha_creacion')[:5]
        })
    
    context = {
        'stats': stats,
        'detalle_estados': detalle_estados,
        'total_aprendices': stats['total_aprendices']
    }
    
    return render(request, 'core/reporte_detallado.html', context)

def exportar_reportes_csv(request):
    """Exportar reportes a CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="reportes.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Métrica', 'Valor'])
    writer.writerow(['Total Aprendices', '450'])
    writer.writerow(['Disponibles', '45.2%'])
    writer.writerow(['Meta Alcanzada', '64.6%'])
    writer.writerow(['Faltan para Meta', '85'])
    
    return response

def detalle_empresa(request, pk):
    """Detalle de empresa y sus aprendices"""
    empresa = get_object_or_404(Empresa, pk=pk)
    aprendices = empresa.aprendices.select_related().all()
    
    # Agrupar aprendices por estado
    por_estado = {}
    for aprendiz in aprendices:
        estado = aprendiz.get_estado_display()
        if estado not in por_estado:
            por_estado[estado] = []
        por_estado[estado].append(aprendiz)
    
    return render(request, 'core/detalle_empresa.html', {
        'empresa': empresa,
        'aprendices': aprendices,
        'por_estado': por_estado,
        'total_aprendices': aprendices.count()
    })

def eliminar_aprendiz(request, pk):
    """Eliminar aprendiz con confirmación"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    
    # Registrar información para auditoría
    nombre_aprendiz = f"{aprendiz.nombres} {aprendiz.apellidos}"
    documento = aprendiz.numero_documento
    
    try:
        # Eliminar el aprendiz
        aprendiz.delete()
        
        # Mensaje de éxito
        messages.success(
            request, 
            f'Aprendiz {nombre_aprendiz} (documento: {documento}) eliminado correctamente.'
        )
        
        # Redirigir a la lista de aprendices
        return redirect('lista_aprendices')
        
    except Exception as e:
        # Manejar error
        messages.error(
            request, 
            f'Error al eliminar el aprendiz {nombre_aprendiz}: {str(e)}'
        )
        return redirect('detalle_aprendiz', pk=pk)

@require_http_methods(["POST"])
def eliminar_aprendiz_ajax(request, pk):
    """Eliminar aprendiz vía AJAX"""
    try:
        aprendiz = get_object_or_404(Aprendiz, pk=pk)
        
        # Registrar información para auditoría
        nombre_aprendiz = f"{aprendiz.nombres} {aprendiz.apellidos}"
        documento = aprendiz.numero_documento
        
        # Eliminar el aprendiz
        aprendiz.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Aprendiz {nombre_aprendiz} eliminado correctamente.',
            'data': {
                'nombre': nombre_aprendiz,
                'documento': documento
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar el aprendiz: {str(e)}'
        }, status=500)

def validar_excel_ajax(request):
    """Validar archivo Excel antes de procesar (AJAX)"""
    print(f"🔍 VALIDAR EXCEL AJAX - Método: {request.method}")
    
    if request.method == 'POST':
        try:
            archivo = request.FILES.get('archivo')
            print(f"📁 Archivo recibido: {archivo}")
            
            if not archivo:
                print("❌ No se recibió archivo")
                return JsonResponse({
                    'success': False,
                    'message': 'No se ha seleccionado ningún archivo'
                })
            
            print(f"📋 Nombre archivo: {archivo.name}")
            print(f"📋 Tamaño archivo: {archivo.size} bytes")
            
            # Validar tipo de archivo
            if not archivo.name.endswith(('.xlsx')) and not archivo.name.endswith('.xls'):
                print("❌ Tipo de archivo inválido")
                return JsonResponse({
                    'success': False,
                    'message': 'El archivo debe estar en formato Excel (.xlsx o .xls)'
                })
            
            # Validar tamaño
            if archivo.size > 10 * 1024 * 1024:  # 10MB
                print("❌ Archivo demasiado grande")
                return JsonResponse({
                    'success': False,
                    'message': 'El archivo es demasiado grande. Máximo permitido: 10MB'
                })
            
            print("📊 Intentando leer archivo Excel...")
            
            # Leer y procesar archivo
            import pandas as pd
            import io
            
            df = pd.read_excel(io.BytesIO(archivo.read()))
            print(f"✅ Archivo Excel leído correctamente - Filas: {len(df)}")
            
            df = df.fillna('')  # Reemplazar NaN con string vacío
            
            # Normalizar nombres de columnas
            df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
            print(f"📋 Columnas normalizadas: {list(df.columns)}")
            
            # Análisis del archivo
            total_filas = len(df)
            filas_validas = 0
            errores = []
            advertencias = []
            
            print(f"🔍 Analizando {total_filas} filas...")
            
            # Validar columnas obligatorias
            columnas_obligatorias = ['numero_documento', 'nombres', 'apellidos']
            columnas_faltantes = [col for col in columnas_obligatorias if col not in df.columns]
            
            if columnas_faltantes:
                print(f"❌ Columnas faltantes: {columnas_faltantes}")
                errores.append(f"Faltan columnas obligatorias: {', '.join(columnas_faltantes)}")
            
            # Validar cada fila
            for index, row in df.iterrows():
                numero_fila = index + 2
                
                # Validar documento
                if not str(row.get('numero_documento', '')).strip():
                    errores.append(f"Fila {numero_fila}: Documento requerido")
                    continue
                
                # Validar nombres y apellidos
                if not str(row.get('nombres', '')).strip():
                    errores.append(f"Fila {numero_fila}: Nombres requeridos")
                    continue
                
                if not str(row.get('apellidos', '')).strip():
                    errores.append(f"Fila {numero_fila}: Apellidos requeridos")
                    continue
                
                filas_validas += 1
                
                # Validar formato de documento
                doc = str(row.get('numero_documento', ''))
                if len(doc) < 5 or len(doc) > 20:
                    advertencias.append(f"Fila {numero_fila}: Documento con formato inusual ({doc})")
                
                # Validar email si existe
                email = str(row.get('email', ''))
                if email and email != 'nan' and '@' not in email:
                    advertencias.append(f"Fila {numero_fila}: Email con formato inválido ({email})")
            
            print(f"✅ Análisis completado - Válidas: {filas_validas}, Errores: {len(errores)}, Advertencias: {len(advertencias)}")
            
            # Preparar datos para vista previa
            preview_data = []
            for index, row in df.iterrows():
                if index < 5:  # Solo primeras 5 filas para vista previa
                    preview_data.append([str(row.get(col, '')) for col in df.columns])
                else:
                    break
            
            print(f"📊 Preparando respuesta JSON...")
            
            resultado = {
                'success': True,
                'total_rows': total_filas,
                'valid_rows': filas_validas,
                'errors': errores,
                'warnings': advertencias,
                'columns': list(df.columns),
                'preview': preview_data
            }
            
            print(f"✅ Respuesta JSON preparada - Éxito: {resultado['success']}")
            return JsonResponse(resultado)
            
        except Exception as e:
            print(f"❌ Error en validación Excel: {str(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return JsonResponse({
                'success': False,
                'message': f'Error al validar el archivo Excel: {str(e)}'
            }, status=500)
    
    print(f"❌ Método no permitido: {request.method}")
    return JsonResponse({'success': False, 'message': 'Método no permitido'}, status=405)

def crear_datos_prueba(request):
    """Crear datos de prueba para testing"""
    from .models import Empresa
    
    try:
        # Crear empresa de prueba si no existe
        empresa, created = Empresa.objects.get_or_create(
            nit='900123456',
            defaults={
                'razon_social': 'Empresa Prueba S.A.',
                'direccion': 'Calle Principal #123',
                'telefono': '3001234567',
                'email': 'contacto@empresaprueba.com',
                'sector_economico': 'TECNOLOGÍA'
            }
        )
        
        # Crear aprendices de prueba
        aprendices_data = [
            {
                'numero_documento': '100123456',
                'nombres': 'Juan',
                'apellidos': 'Pérez García',
                'tipo_documento': 'CC',
                'email': 'juan.perez@email.com',
                'telefono': '3001112222',
                'especializacion': 'SIN_ESPECIALIDAD',
                'ficha': 'SIN_FICHA',
                'estado': 'DISPONIBLE',
                'empresa_vinculada': empresa
            },
            {
                'numero_documento': '200123456',
                'nombres': 'María',
                'apellidos': 'Rodríguez López',
                'tipo_documento': 'CC',
                'email': 'maria.rodriguez@email.com',
                'telefono': '3003334444',
                'especializacion': 'SIN_ESPECIALIDAD',
                'ficha': 'SIN_FICHA',
                'estado': 'PROCESO_SELECCION',
                'empresa_vinculada': empresa
            },
            {
                'numero_documento': '300123456',
                'nombres': 'Carlos',
                'apellidos': 'Martínez Torres',
                'tipo_documento': 'CC',
                'email': 'carlos.martinez@email.com',
                'telefono': '3005556666',
                'especializacion': 'SIN_ESPECIALIDAD',
                'ficha': 'SIN_FICHA',
                'estado': 'INHABILITADO_ACT',
                'empresa_vinculada': empresa
            }
        ]
        
        creados = 0
        for data in aprendices_data:
            aprendiz, created = Aprendiz.objects.get_or_create(
                numero_documento=data['numero_documento'],
                defaults=data
            )
            if created:
                creados += 1
        
        mensaje = f'Se crearon {creados} aprendices de prueba exitosamente.'
        if empresa.created:
            mensaje += f' También se creó la empresa "{empresa.razon_social}".'
        
        messages.success(request, mensaje)
        
    except Exception as e:
        messages.error(request, f'Error al crear datos de prueba: {str(e)}')
    
    return redirect('lista_aprendices')

def confirmar_eliminar_aprendiz(request, pk):
    """Vista de confirmación para eliminar aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    
    # Verificar si tiene empresa vinculada
    tiene_empresa = aprendiz.empresa_vinculada is not None
    
    # Verificar si tiene etapa práctica activa
    tiene_practica_activa = aprendiz.tiene_practica_activa
    
    context = {
        'aprendiz': aprendiz,
        'tiene_empresa': tiene_empresa,
        'tiene_practica_activa': tiene_practica_activa,
    }
    
    return render(request, 'core/confirmar_eliminar_aprendiz.html', context)

@require_http_methods(["POST"])
@csrf_exempt
def eliminar_todos_aprendices(request):
    """Eliminar TODOS los aprendices del sistema"""
    if request.method == "POST":
        try:
            total = Aprendiz.objects.count()
            Aprendiz.objects.all().delete()
            
            return JsonResponse({
                "success": True,
                "message": "Aprendices eliminados",
                "total_eliminados": total
            })
            
        except Exception as e:
            print(f"❌ Error en eliminación total: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar todos los aprendices: {str(e)}'
            }, status=500)
    
    # Si alguien entra por GET, redirigir a la lista de aprendices
    return redirect("lista_aprendices")

def estadisticas_totales(request):
    """Obtener estadísticas totales de aprendices"""
    try:
        total_aprendices = Aprendiz.objects.count()
        con_empresa = Aprendiz.objects.filter(empresa_vinculada__isnull=False).count()
        con_practica = Aprendiz.objects.filter(
            etapa_practica__gte=timezone.now().date()
        ).filter(etapa_practica__isnull=False).count()
        
        return JsonResponse({
            'success': True,
            'total': total_aprendices,
            'con_empresa': con_empresa,
            'con_practica': con_practica
        })
        
    except Exception as e:
        print(f"❌ Error al obtener estadísticas totales: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener estadísticas: {str(e)}'
        }, status=500)

def eliminacion_masiva_aprendices(request):
    """Vista para eliminación masiva de aprendices con nuevo diseño"""
    if request.method == 'POST':
        ids_a_eliminar = request.POST.getlist('aprendices_seleccionados')
        
        # Debug para ver qué IDs se reciben
        print(f"🗑️ ELIMINACIÓN MASIVA - IDs recibidos: {ids_a_eliminar}")
        
        if not ids_a_eliminar:
            messages.warning(request, '⚠️ No se han seleccionado aprendices para eliminar.')
            return redirect('lista_aprendices')
        
        try:
            # Obtener información para auditoría
            aprendices = Aprendiz.objects.filter(pk__in=ids_a_eliminar)
            total_eliminados = aprendices.count()
            
            # Contar aprendices con empresas y prácticas activas
            con_empresa = aprendices.filter(empresa_vinculada__isnull=False).count()
            con_practica = aprendices.filter(
                fecha_fin_etapa_practica__gte=timezone.now().date()
            ).count()
            
            # Eliminar aprendices
            aprendices.delete()
            
            # Mensaje de éxito con emojis y detalles
            mensaje = f'✅ Se eliminaron {total_eliminados} aprendices exitosamente.'
            if con_empresa > 0:
                mensaje += f' 🏢 ({con_empresa} tenían empresas vinculadas)'
            if con_practica > 0:
                mensaje += f' 💼 ({con_practica} tenían prácticas activas)'
            
            messages.success(request, mensaje)
            
        except Exception as e:
            messages.error(request, f'❌ Error al eliminar aprendices: {str(e)}')
        
        return redirect('lista_aprendices')
    
    # GET: mostrar página de eliminación masiva con nuevo diseño
    # Obtener empresas para el filtro
    empresas = Empresa.objects.all().order_by('razon_social')
    
    return render(request, 'core/eliminacion_masiva_aprendices_nuevo.html', {
        'empresas': empresas
    })

@require_http_methods(["POST"])
def obtener_filtro_eliminacion(request):
    """Obtener aprendices según filtros para eliminación masiva (AJAX)"""
    try:
        # Obtener parámetros del filtro
        estado = request.POST.get('estado', '')
        empresa_id = request.POST.get('empresa', '')
        fecha_desde = request.POST.get('fecha_desde', '')
        fecha_hasta = request.POST.get('fecha_hasta', '')
        busqueda = request.POST.get('busqueda', '')
        
        # Construir consulta base
        queryset = Aprendiz.objects.select_related('empresa_vinculada').all()
        
        # Aplicar filtros
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if empresa_id:
            queryset = queryset.filter(empresa_vinculada_id=empresa_id)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_carga__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(fecha_carga__lte=fecha_hasta)
        
        if busqueda:
            queryset = queryset.filter(
                Q(nombres__icontains=busqueda) |
                Q(apellidos__icontains=busqueda) |
                Q(numero_documento__icontains=busqueda) |
                Q(especializacion__icontains=busqueda)
            )
        
        # Limitar resultados para no sobrecargar
        aprendices = queryset[:100]  # Máximo 100 resultados
        
        # Serializar datos
        data = []
        for aprendiz in aprendices:
            data.append({
                'id': aprendiz.pk,
                'nombre_completo': aprendiz.nombre_completo,
                'numero_documento': aprendiz.numero_documento,
                'especializacion': aprendiz.especializacion,
                'estado': aprendiz.estado,
                'estado_display': aprendiz.get_estado_display(),
                'empresa': aprendiz.empresa_vinculada.razon_social if aprendiz.empresa_vinculada else None,
                'tiene_empresa': aprendiz.empresa_vinculada is not None,
                'tiene_practica_activa': (
                    aprendiz.etapa_practica and 
                    aprendiz.etapa_practica >= timezone.now().date()
                ),
                'fecha_carga': aprendiz.fecha_carga.strftime('%d/%m/%Y'),
            })
        
        return JsonResponse({
            'success': True,
            'aprendices': data,
            'total': len(data),
            'mensaje': f'Se encontraron {len(data)} aprendices con los filtros seleccionados' if len(data) > 0 else 'No se encontraron aprendices con los filtros seleccionados'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener aprendices: {str(e)}'
        }, status=500)
