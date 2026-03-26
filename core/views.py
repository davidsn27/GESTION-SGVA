from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from .models import Aprendiz
from datetime import date, timedelta
import json

@csrf_exempt
@require_http_methods(["POST"])
def eliminar_aprendiz_ajax(request, aprendiz_id):
    """
    Vista AJAX para eliminar un aprendiz individualmente
    """
    try:
        # Buscar el aprendiz
        aprendiz = Aprendiz.objects.get(id=aprendiz_id)
        nombre_aprendiz = aprendiz.nombre
        
        # Eliminar el aprendiz
        aprendiz.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Aprendiz {nombre_aprendiz} eliminado correctamente'
        })
        
    except Aprendiz.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'El aprendiz no existe'
        }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar: {str(e)}'
        }, status=500)

@csrf_exempt
def index(request):
    """Página de arranque de la plataforma"""
    return render(request, "core/index.html")


def dashboard(request):
    aprendices = Aprendiz.objects.all()

    estados = [
        "Disponible",
        "Aprendiz Aplica",
        "Empresa Solicita",
        "Aprendices Solicitados por Regional",
        "En Proceso de Selección",
        "Proceso de Selección Abierto",
        "Contratado",
        "Final Contrato",
        "Cancelado",
        "Alumno Retirado",
        "Aplazado",
        "Pendiente Por Certificar",
        "Bajo Rendimiento Académico",
        "Aprendiz no interesado en contrato",
        "Inhabilitado Por Actualización",
        "Contrato No Registrado",
        "Fallecido",
    ]

    conteo = {}

    for estado in estados:
        conteo[estado] = Aprendiz.objects.filter(estado=estado).count()

    # Diccionario con claves simples para template
    conteo_simple = {
        'Disponible': conteo.get('Disponible', 0),
        'Aprendiz_Aplica': conteo.get('Aprendiz Aplica', 0),
        'Empresa_Solicita': conteo.get('Empresa Solicita', 0),
        'Aprendices_Solicitados_Regional': conteo.get('Aprendices Solicitados por Regional', 0),
        'En_Proceso_Seleccion': conteo.get('En Proceso de Selección', 0),
        'Proceso_Seleccion_Abierto': conteo.get('Proceso de Selección Abierto', 0),
        'Contratado': conteo.get('Contratado', 0),
        'Final_Contrato': conteo.get('Final Contrato', 0),
        'Cancelado': conteo.get('Cancelado', 0),
        'Alumno_Retirado': conteo.get('Alumno Retirado', 0),
        'Aplazado': conteo.get('Aplazado', 0),
        'Pendiente_Por_Certificar': conteo.get('Pendiente Por Certificar', 0),
        'Bajo_Rendimiento_Academico': conteo.get('Bajo Rendimiento Académico', 0),
        'Aprendiz_no_interesado': conteo.get('Aprendiz no interesado en contrato', 0),
        'Inhabilitado_Por_Actualizacion': conteo.get('Inhabilitado Por Actualización', 0),
        'Contrato_No_Registrado': conteo.get('Contrato No Registrado', 0),
        'Fallecido': conteo.get('Fallecido', 0),
    }

    # Estadísticas por programa/carrera
    programas = aprendices.values_list('programa', flat=True).distinct()
    estadisticas_por_programa = []
    
    for programa in programas:
        if programa:  # Ignorar programas vacíos
            stats_programa = {}
            total_programa = 0
            
            for estado in estados:
                count_estado = aprendices.filter(programa=programa, estado=estado).count()
                stats_programa[estado] = count_estado
                total_programa += count_estado
            
            stats_programa['programa'] = programa
            stats_programa['total'] = total_programa
            stats_programa['mas_contratan'] = stats_programa.get('Contratado', 0)
            
            estadisticas_por_programa.append(stats_programa)
    
    # Ordenar por cantidad de aprendices contratados
    estadisticas_por_programa.sort(key=lambda x: x['mas_contratan'], reverse=True)

    context = {
        "aprendices": aprendices,
        "conteo": conteo,
        "conteo_simple": conteo_simple,
        "total": aprendices.count(),
        "estadisticas_por_programa": estadisticas_por_programa,
        "estados": estados
    }

    return render(request, "core/dashboard.html", context)


def lista_aprendices(request):
    """Lista de aprendices con filtros"""
    estado_filtro = request.GET.get('estado', '')
    busqueda_filtro = request.GET.get('busqueda', '')
    ficha_filtro = request.GET.get('ficha', '')
    empresa_filtro = request.GET.get('empresa', '')
    
    # Obtener todos los aprendices
    aprendices = Aprendiz.objects.all()
    
    # Aplicar filtros
    if estado_filtro:
        aprendices = aprendices.filter(estado=estado_filtro)
    
    if busqueda_filtro:
        aprendices = aprendices.filter(
            Q(nombre_completo__icontains=busqueda_filtro) |
            Q(numero_documento__icontains=busqueda_filtro) |
            Q(especializacion__icontains=busqueda_filtro)
        )
    
    if ficha_filtro:
        aprendices = aprendices.filter(ficha__icontains=ficha_filtro)
    
    if empresa_filtro:
        aprendices = aprendices.filter(empresa_vinculada__razon_social__icontains=empresa_filtro)
    
    context = {
        'aprendices': aprendices,
        'estado_filtro': estado_filtro,
        'busqueda_filtro': busqueda_filtro,
        'ficha_filtro': ficha_filtro,
        'empresa_filtro': empresa_filtro,
    }
    
    return render(request, 'core/lista_aprendices_simple.html', context)


def carga_excel_nueva(request):
    """Página para cargar Excel"""
    return render(request, "core/carga_excel_mejorado.html")


def procesar_carga_multiple(request):
    """Procesar carga de múltiples archivos Excel"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Método no permitido'
        })
    
    try:
        from .utils import procesar_excel_simple
        
        cantidad_archivos = int(request.POST.get('cantidad_archivos', 0))
        total_procesados = 0
        total_nuevos = 0
        total_actualizados = 0
        errores = []
        
        for i in range(cantidad_archivos):
            archivo_key = f'archivo_{i}'
            if archivo_key in request.FILES:
                archivo = request.FILES[archivo_key]
                
                # Validar archivo
                if not archivo.name.endswith(('.xlsx', '.xls')):
                    errores.append(f'El archivo "{archivo.name}" no es un archivo Excel válido.')
                    continue
                
                # Procesar archivo Excel usando la función simplificada
                try:
                    resultados = procesar_excel_simple(archivo, archivo.name)
                    
                    total_procesados += 1
                    total_nuevos += resultados['nuevos']
                    total_actualizados += resultados['actualizados']
                    
                    # Agregar errores del procesamiento
                    if resultados['errores']:
                        errores.extend([f"{archivo.name}: {error}" for error in resultados['errores']])
                    
                    # Mensaje de éxito para este archivo
                    print(f'✅ Archivo {archivo.name} procesado: {resultados["nuevos"]} nuevos, {resultados["actualizados"]} actualizados')
                    
                except Exception as e:
                    errores.append(f'Error procesando "{archivo.name}": {str(e)}')
        
        if total_procesados > 0:
            mensaje = f'Se procesaron exitosamente {total_procesados} archivos.'
            if total_nuevos > 0:
                mensaje += f' {total_nuevos} aprendices nuevos.'
            if total_actualizados > 0:
                mensaje += f' {total_actualizados} aprendices actualizados.'
            
            return JsonResponse({
                'success': True,
                'message': mensaje,
                'archivos_procesados': total_procesados,
                'aprendices_nuevos': total_nuevos,
                'aprendices_actualizados': total_actualizados,
                'errores': errores
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'No se pudo procesar ningún archivo.',
                'errores': errores
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al procesar archivos: {str(e)}'
        })


def estadisticas_etapas(request):
    """Estadísticas detalladas de etapas"""
    from django.utils import timezone
    from datetime import date, timedelta
    
    aprendices = Aprendiz.objects.all()
    total_aprendices = aprendices.count()
    
    # Estadísticas por etapa
    en_lectiva = aprendices.filter(fecha_lectiva__isnull=False).count()
    en_practica = aprendices.filter(fecha_practica__isnull=False).count()
    sin_etapa = aprendices.filter(fecha_lectiva__isnull=True, fecha_practica__isnull=True).count()
    
    # Calcular porcentajes
    porcentaje_lectiva = round((en_lectiva / total_aprendices * 100), 1) if total_aprendices > 0 else 0
    porcentaje_practica = round((en_practica / total_aprendices * 100), 1) if total_aprendices > 0 else 0
    
    # Datos para el gráfico
    etapas_labels = ['Etapa Lectiva', 'Etapa Práctica', 'Sin Etapa Definida']
    etapas_data = [en_lectiva, en_practica, sin_etapa]
    etapas_colores = ['#1cc88a', '#36b9cc', '#f6c23e']
    
    # Próximos a iniciar etapa (próximos 30 días)
    hoy = date.today()
    treinta_dias = hoy + timedelta(days=30)
    
    # Aprendices próximos a iniciar etapa lectiva
    proximos_inicio_lectiva = []
    for aprendiz in aprendices.filter(fecha_lectiva__isnull=False, fecha_lectiva__gte=hoy, fecha_lectiva__lte=treinta_dias):
        dias_para_inicio = (aprendiz.fecha_lectiva - hoy).days
        proximos_inicio_lectiva.append({
            'pk': aprendiz.pk,
            'nombre': aprendiz.nombre,
            'ficha': aprendiz.ficha,
            'fecha_lectiva': aprendiz.fecha_lectiva,
            'dias_para_inicio_lectiva': dias_para_inicio
        })
    
    # Aprendices próximos a iniciar etapa práctica
    proximos_inicio_practica = []
    for aprendiz in aprendices.filter(fecha_practica__isnull=False, fecha_practica__gte=hoy, fecha_practica__lte=treinta_dias):
        dias_para_inicio = (aprendiz.fecha_practica - hoy).days
        proximos_inicio_practica.append({
            'pk': aprendiz.pk,
            'nombre': aprendiz.nombre,
            'ficha': aprendiz.ficha,
            'fecha_practica': aprendiz.fecha_practica,
            'dias_para_inicio_practica': dias_para_inicio
        })
    
    # Aprendices próximos a finalizar etapa práctica (6 meses después del inicio)
    seis_meses = timedelta(days=180)
    proximos_fin_practica = []
    for aprendiz in aprendices.filter(fecha_practica__isnull=False):
        fecha_fin_estimada = aprendiz.fecha_practica + seis_meses
        if hoy <= fecha_fin_estimada:
            dias_para_fin = (fecha_fin_estimada - hoy).days
            proximos_fin_practica.append({
                'pk': aprendiz.pk,
                'nombre': aprendiz.nombre,
                'ficha': aprendiz.ficha,
                'fecha_inicio_practica': aprendiz.fecha_practica,
                'fecha_fin_estimada_practica': fecha_fin_estimada,
                'dias_para_fin_practica': dias_para_fin
            })
    
    # Detalles de aprendices para la tabla
    aprendices_con_detalles = []
    for aprendiz in aprendices[:50]:  # Limitar a 50 para performance
        # Determinar etapa actual
        if aprendiz.fecha_practica and aprendiz.fecha_lectiva:
            # Si tiene ambas fechas, tomar la más reciente
            if aprendiz.fecha_practica >= aprendiz.fecha_lectiva:
                # Si fecha práctica es después o igual a fecha lectiva
                if hoy < aprendiz.fecha_practica:
                    # Si hoy es ANTES del inicio práctica = etapa lectiva
                    etapa_actual = 'Etapa Lectiva'
                    color_etapa = '#1cc88a'
                    icono_etapa = 'fa-book'
                    dias_restantes_lectiva = (aprendiz.fecha_lectiva - hoy).days if hoy <= aprendiz.fecha_lectiva else None
                    dias_restantes_practica = None
                else:
                    # Si hoy es igual o después del inicio práctica = etapa práctica
                    etapa_actual = 'Etapa Práctica'
                    color_etapa = '#36b9cc'
                    icono_etapa = 'fa-briefcase'
                    dias_restantes_practica = (aprendiz.fecha_practica - hoy).days if hoy <= aprendiz.fecha_practica else None
                    dias_restantes_lectiva = None
            else:
                # Si fecha lectiva es después de fecha práctica
                if hoy < aprendiz.fecha_lectiva:
                    etapa_actual = 'Etapa Lectiva'
                    color_etapa = '#1cc88a'
                    icono_etapa = 'fa-book'
                    dias_restantes_lectiva = (aprendiz.fecha_lectiva - hoy).days if hoy <= aprendiz.fecha_lectiva else None
                    dias_restantes_practica = None
                else:
                    etapa_actual = 'Etapa Práctica'
                    color_etapa = '#36b9cc'
                    icono_etapa = 'fa-briefcase'
                    dias_restantes_practica = (aprendiz.fecha_practica - hoy).days if hoy <= aprendiz.fecha_practica else None
                    dias_restantes_lectiva = None
        elif aprendiz.fecha_practica and not aprendiz.fecha_lectiva:
            # Solo tiene fecha práctica
            if hoy < aprendiz.fecha_practica:
                # Si hoy es ANTES del inicio práctica = etapa lectiva
                etapa_actual = 'Etapa Lectiva'
                color_etapa = '#1cc88a'
                icono_etapa = 'fa-book'
                dias_restantes_lectiva = (aprendiz.fecha_practica - hoy).days if hoy <= aprendiz.fecha_practica else None
                dias_restantes_practica = None
            else:
                # Si hoy es igual o después del inicio práctica = etapa práctica
                etapa_actual = 'Etapa Práctica'
                color_etapa = '#36b9cc'
                icono_etapa = 'fa-briefcase'
                dias_restantes_practica = (aprendiz.fecha_practica - hoy).days if hoy <= aprendiz.fecha_practica else None
                dias_restantes_lectiva = None
        elif aprendiz.fecha_lectiva and not aprendiz.fecha_practica:
            # Solo tiene fecha lectiva
            if hoy <= aprendiz.fecha_lectiva:
                etapa_actual = 'Etapa Lectiva'
                color_etapa = '#1cc88a'
                icono_etapa = 'fa-book'
                dias_restantes_lectiva = (aprendiz.fecha_lectiva - hoy).days if hoy <= aprendiz.fecha_lectiva else None
                dias_restantes_practica = None
            else:
                etapa_actual = 'Sin Etapa'
                color_etapa = '#f6c23e'
                icono_etapa = 'fa-question-circle'
                dias_restantes_lectiva = None
                dias_restantes_practica = None
        else:
            # Sin fechas definidas
            etapa_actual = 'Sin Etapa'
            color_etapa = '#f6c23e'
            icono_etapa = 'fa-question-circle'
            dias_restantes_lectiva = None
            dias_restantes_practica = None
        
        aprendices_con_detalles.append({
            'id': aprendiz.id,
            'nombre': aprendiz.nombre,
            'documento': aprendiz.documento,
            'ficha': aprendiz.ficha,
            'programa': aprendiz.programa,
            'etapa_actual': etapa_actual,
            'color_etapa': color_etapa,
            'icono_etapa': icono_etapa,
            'dias_restantes_lectiva': dias_restantes_lectiva if dias_restantes_lectiva and dias_restantes_lectiva > 0 else None,
            'dias_restantes_practica': dias_restantes_practica if dias_restantes_practica and dias_restantes_practica > 0 else None,
            'empresa': aprendiz.razon_social_empresa
        })
    
    context = {
        'total_aprendices': total_aprendices,
        'en_lectiva': en_lectiva,
        'en_practica': en_practica,
        'sin_etapa_definida': sin_etapa,
        'porcentaje_lectiva': porcentaje_lectiva,
        'porcentaje_practica': porcentaje_practica,
        'proximos_fin_lectiva': proximos_inicio_lectiva,
        'proximos_inicio_practica': proximos_inicio_practica,
        'proximos_fin_practica': proximos_fin_practica,
        'aprendices_con_detalles': aprendices_con_detalles,
        'etapas_labels': etapas_labels,
        'etapas_data': etapas_data,
        'etapas_colores': etapas_colores,
    }
    
    return render(request, "core/estadisticas_etapas.html", context)


def reportes(request):
    """Página de reportes con estadísticas"""
    aprendices = Aprendiz.objects.all()
    
    # Estadísticas por estado
    stats_por_estado = {}
    stats_con_porcentaje = []
    
    for estado, label in Aprendiz.ESTADOS:
        count = aprendices.filter(estado=estado).count()
        stats_por_estado[label] = count
        
        # Calcular porcentaje
        total = aprendices.count()
        porcentaje = (count / total * 100) if total > 0 else 0
        
        stats_con_porcentaje.append({
            'estado': label,
            'count': count,
            'porcentaje': round(porcentaje, 1)
        })
    
    # Estadísticas generales
    total_aprendices = aprendices.count()
    aprendices_contratados = aprendices.filter(estado='Contratado').count()
    aprendices_disponibles = aprendices.filter(estado='Disponible').count()
    
    context = {
        'total_aprendices': total_aprendices,
        'aprendices_contratados': aprendices_contratados,
        'aprendices_disponibles': aprendices_disponibles,
        'stats_por_estado': stats_por_estado,
        'stats_con_porcentaje': stats_con_porcentaje,
        'aprendices': aprendices
    }
    
    return render(request, "core/reportes_mejorado.html", context)


@csrf_exempt
def eliminacion_masiva_aprendices(request):
    """Eliminación masiva de aprendices"""
    if request.method == 'POST':
        try:
            aprendices_a_eliminar = request.POST.getlist('aprendices_ids', [])
            print(f"DEBUG: aprendices_a_eliminar = {aprendices_a_eliminar}")
            print(f"DEBUG: POST data = {dict(request.POST)}")
            print(f"DEBUG: Content-Type = {request.content_type}")
            
            if aprendices_a_eliminar:
                # Convertir a enteros y filtrar válidos
                ids_validos = []
                for id_str in aprendices_a_eliminar:
                    try:
                        ids_validos.append(int(id_str))
                    except (ValueError, TypeError):
                        continue
                
                print(f"DEBUG: ids_validos = {ids_validos}")
                
                if ids_validos:
                    eliminados_count = Aprendiz.objects.filter(id__in=ids_validos).count()
                    print(f"DEBUG: aprendices a eliminar = {eliminados_count}")
                    eliminados = Aprendiz.objects.filter(id__in=ids_validos).delete()
                    print(f"DEBUG: resultado delete = {eliminados}")
                    
                    return JsonResponse({
                        'success': True,
                        'message': f'Se eliminaron {eliminados_count} aprendices exitosamente.',
                        'eliminados': eliminados_count
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'No se encontraron IDs válidos para eliminar.'
                    })
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'No se seleccionaron aprendices para eliminar.'
                })
        except Exception as e:
            print(f"ERROR en eliminacion_masiva: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar aprendices: {str(e)}'
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'}, status=405)


def obtener_todos_ids_aprendices(request):
    """Obtener todos los IDs de aprendices para selección masiva"""
    if request.method == 'GET':
        try:
            # Obtener todos los IDs de aprendices
            ids = list(Aprendiz.objects.values_list('id', flat=True))
            
            return JsonResponse({
                'success': True,
                'ids': ids,
                'total': len(ids)
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al obtener IDs: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})


def eliminar_todos_aprendices(request):
    """Eliminar todos los aprendices"""
    if request.method == 'POST':
        try:
            total_aprendices = Aprendiz.objects.count()
            eliminados = Aprendiz.objects.all().delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Se eliminaron {eliminados} aprendices exitosamente.',
                'total_aprendices': total_aprendices,
                'eliminados': eliminados
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar aprendices: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})


def detalle_aprendiz(request, pk):
    """Ver detalles de un aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    return render(request, 'core/detalle_aprendiz.html', {'aprendiz': aprendiz})


def editar_aprendiz(request, pk):
    """Editar un aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    
    if request.method == 'POST':
        aprendiz.nombre = request.POST.get('nombre', aprendiz.nombre)
        aprendiz.documento = request.POST.get('documento', aprendiz.documento)
        aprendiz.programa = request.POST.get('programa', aprendiz.programa)
        aprendiz.estado = request.POST.get('estado', aprendiz.estado)
        aprendiz.save()
        return redirect('lista_aprendices')
    
    return render(request, 'core/editar_aprendiz.html', {
        'aprendiz': aprendiz,
        'estados': Aprendiz.ESTADOS
    })


def eliminar_aprendiz(request, pk):
    """Eliminar un aprendiz"""
    aprendiz = get_object_or_404(Aprendiz, pk=pk)
    
    if request.method == 'POST':
        aprendiz.delete()
        return redirect('lista_aprendices')
    
    # Redirigir directamente a lista de aprendices con mensaje
    from django.contrib import messages
    messages.warning(request, f'Para eliminar a {aprendiz.nombre}, confirme desde la lista de aprendices.')
    return redirect('lista_aprendices')
