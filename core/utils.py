import pandas as pd
from datetime import datetime
from django.db import transaction
from .models import Aprendiz, Empresa, CargaExcel

# Mapeo de estados para clasificación automática
MAPEO_ESTADOS = {
    # DISPONIBLE
    'disponible': 'DISPONIBLE',
    'disponible para practicas': 'DISPONIBLE',
    'buscando practicas': 'DISPONIBLE',
    'activo': 'DISPONIBLE',
    'libre': 'DISPONIBLE',
    'disponibilidad': 'DISPONIBLE',
    
    # INHABILITADO_ACT
    'inhabilitado': 'INHABILITADO_ACT',
    'inhabilitado por actualizacion': 'INHABILITADO_ACT',
    'inhabilitado por actualización': 'INHABILITADO_ACT',
    'inactivo': 'INHABILITADO_ACT',
    'suspendido': 'INHABILITADO_ACT',
    'bloqueado': 'INHABILITADO_ACT',
    
    # PROCESO_ABIERTO (prioridad sobre PROCESO_SELECCION)
    'proceso abierto': 'PROCESO_ABIERTO',
    'proceso de seleccion abierto': 'PROCESO_ABIERTO',
    'procesos de seleccion abiertos': 'PROCESO_ABIERTO',
    'proceso de selección abierto': 'PROCESO_ABIERTO',
    'procesos de selección abiertos': 'PROCESO_ABIERTO',
    'aprendiz con procesos de selección abiertos': 'PROCESO_ABIERTO',
    'aprendiz con procesos de seleccion abiertos': 'PROCESO_ABIERTO',
    'abierto': 'PROCESO_ABIERTO',
    'postulado': 'PROCESO_ABIERTO',
    'aplicado': 'PROCESO_ABIERTO',
    'candidato': 'PROCESO_ABIERTO',
    'interesado': 'PROCESO_ABIERTO',
    
    # PROCESO_SELECCION
    'proceso de seleccion': 'PROCESO_SELECCION',
    'proceso seleccion': 'PROCESO_SELECCION',
    'en seleccion': 'PROCESO_SELECCION',
    'seleccion': 'PROCESO_SELECCION',
    'entrevista': 'PROCESO_SELECCION',
    'evaluacion': 'PROCESO_SELECCION',
    'evaluación': 'PROCESO_SELECCION',
    
    # CONTRATO_NO_REGISTRADO
    'contrato no registrado': 'CONTRATO_NO_REGISTRADO',
    'sin contrato': 'CONTRATO_NO_REGISTRADO',
    'sin contrato registrado': 'CONTRATO_NO_REGISTRADO',
    'esperando contrato': 'CONTRATO_NO_REGISTRADO',
    'pendiente de contrato': 'CONTRATO_NO_REGISTRADO',
    's.c.': 'CONTRATO_NO_REGISTRADO',
    'sc': 'CONTRATO_NO_REGISTRADO',
    
    # PRACTICA_ACTIVA
    'practica activa': 'PRACTICA_ACTIVA',
    'practica': 'PRACTICA_ACTIVA',
    'practicando': 'PRACTICA_ACTIVA',
    'vinculado': 'PRACTICA_ACTIVA',
    'contratado': 'PRACTICA_ACTIVA',
    
    # FINALIZADO
    'finalizado': 'FINALIZADO',
    'terminado': 'FINALIZADO',
    'completado': 'FINALIZADO',
    'graduado': 'FINALIZADO',
    'retirado': 'RETIRADO',
    'abandonado': 'RETIRADO',
    'desertado': 'RETIRADO',
    'cancelado': 'RETIRADO',
    # Abreviaturas y variantes
    'dispo': 'DISPONIBLE',
    'inhab': 'INHABILITADO_ACT',
    'proc': 'PROCESO_SELECCION',
    'sel': 'PROCESO_SELECCION',
    'abi': 'PROCESO_ABIERTO',
    'abi.': 'PROCESO_ABIERTO',
    'sc': 'CONTRATO_NO_REGISTRADO',
    's.c.': 'CONTRATO_NO_REGISTRADO'
}

# Palabras clave para clasificación automática
PALABRAS_CLAVE_ESTADO = {
    'DISPONIBLE': [
        'disponible', 'activo', 'libre', 'buscando', 'sin vincular', 
        'disponibilidad', 'practica', 'dispo', 'activo'
    ],
    'INHABILITADO_ACT': [
        'inhabilitado', 'suspendido', 'bloqueado', 'no disponible', 
        'inactivo', 'inhab', 'suspend', 'block',
        'inhabilitado por contrato', 'inhabilitado contrato', 'inhabilitado x contrato',
        'inhabilitado-contrato', 'inhabilitado_contrato'
    ],
    'PROCESO_SELECCION': [
        'seleccion', 'proceso', 'entrevista', 'evaluacion', 'evaluación',
        'seleccionando', 'procesando', 'evaluando', 'proc', 'sel'
    ],
    'PROCESO_ABIERTO': [
        'abierto', 'postulado', 'aplicado', 'candidato', 'interesado',
        'postul', 'aplic', 'candid', 'interes', 'abi',
        'proceso de seleccion abierto', 'procesos de seleccion abiertos',
        'proceso de selección abierto', 'procesos de selección abiertos'
    ],
    'CONTRATO_NO_REGISTRADO': [
        'contrato', 'pendiente', 'esperando', 'documentacion', 'papeles',
        'contrat', 'pend', 'esper', 'doc', 'papel', 'sc'
    ]
}

def normalizar_estado(estado_str):
    """
    Normaliza el estado desde el Excel al formato del modelo
    Soporta múltiples formatos y clasificación automática por palabras clave
    """
    if pd.isna(estado_str) or not str(estado_str).strip():
        return 'DISPONIBLE'
    
    estado_str = str(estado_str).strip()
    estado_lower = estado_str.lower()
    
    # 1. Búsqueda directa en el mapeo
    if estado_lower in MAPEO_ESTADOS:
        return MAPEO_ESTADOS[estado_lower]
    
    # 2. Clasificación automática por palabras clave
    for estado_modelo, palabras_clave in PALABRAS_CLAVE_ESTADO.items():
        for palabra in palabras_clave:
            if palabra in estado_lower:
                return estado_modelo
    
    # 3. Clasificación por palabras clave (orden de prioridad importante)
    if any(word in estado_lower for word in ['dispon', 'activo', 'libre', 'busca']):
        return 'DISPONIBLE'
    elif any(word in estado_lower for word in ['inhab', 'suspend', 'block', 'inact']):
        return 'INHABILITADO_ACT'
    elif any(word in estado_lower for word in ['abier', 'post', 'aplic', 'candi']):
        return 'PROCESO_ABIERTO'
    elif any(word in estado_lower for word in ['selec', 'entre', 'eval']):
        return 'PROCESO_SELECCION'
    elif any(word in estado_lower for word in ['contra', 'pend', 'esper', 'doc']):
        return 'CONTRATO_NO_REGISTRADO'
    
    # 4. Clasificación por valores numéricos
    if estado_lower.isdigit():
        num_estado = int(estado_lower)
        if num_estado == 1:
            return 'DISPONIBLE'
        elif num_estado == 2:
            return 'INHABILITADO_ACT'
        elif num_estado == 3:
            return 'PROCESO_SELECCION'
        elif num_estado == 4:
            return 'PROCESO_ABIERTO'
        elif num_estado == 5:
            return 'CONTRATO_NO_REGISTRADO'
    
    # 5. Valor por defecto
    return 'DISPONIBLE'

def clasificar_aprendiz_automaticamente(aprendiz_datos):
    """
    Clasifica automáticamente el estado de un aprendiz basado en sus datos
    """
    estado = aprendiz_datos.get('estado', '').strip().lower()
    
    # Si ya tiene un estado definido, normalizarlo
    if estado:
        return normalizar_estado(estado)
    
    # Clasificación basada en otras características
    empresa = aprendiz_datos.get('empresa_vinculada')
    fecha_fin = aprendiz_datos.get('etapa_practica')
    
    # Reglas de clasificación automática
    if empresa:
        # Si tiene empresa asignada, probablemente está en proceso o con contrato
        if 'contrato' in str(empresa).lower() or 'pendiente' in str(empresa).lower():
            return 'CONTRATO_NO_REGISTRADO'
        else:
            return 'PROCESO_SELECCION'
    
    if fecha_fin:
        # Si tiene fecha de fin de práctica, está activo
        return 'DISPONIBLE'
    
    # Por defecto, si no hay información específica
    return 'DISPONIBLE'

def validar_y_clasificar_fila(row, numero_fila):
    """
    Valida y clasifica una fila del Excel
    Retorna (datos_aprendiz, errores)
    """
    errores = []
    datos_aprendiz = {}
    
    try:
        # Función helper para limpiar valores
        def obtener_valor_columna(row, posibles_nombres, valor_defecto=''):
            """
            Obtiene el valor de una columna buscando múltiples nombres posibles
            """
            for nombre in posibles_nombres:
                if nombre in row and limpiar_valor(row[nombre]):
                    return limpiar_valor(row[nombre])
            return valor_defecto

        def limpiar_valor(valor):
            """
            Limpia y valida valores del Excel
            """
            if valor is None or (isinstance(valor, str) and valor.strip() == ''):
                return ''
            if isinstance(valor, str):
                return valor.strip()
            return str(valor)

        # Validar campos obligatorios
        campos_obligatorios = ['numero_documento', 'nombres', 'apellidos']
        for campo in campos_obligatorios:
            valor = limpiar_valor(row.get(campo, ''))
            if not valor:
                errores.append(f"Fila {numero_fila}: Campo '{campo}' es obligatorio")
        # ... (resto del código)
            else:
                datos_aprendiz[campo] = valor
        
        # Si hay errores en campos obligatorios, retornar temprano
        if errores:
            return datos_aprendiz, errores
        
        # Campo especializacion ahora es opcional
        especializacion = limpiar_valor(row.get('especialidad', ''))
        datos_aprendiz['especializacion'] = especializacion if especializacion else None
        
        # Procesar documento
        num_doc = limpiar_valor(row.get('numero_documento', ''))
        datos_aprendiz['numero_documento'] = num_doc
        
        # Clasificar estado
        estado_raw = limpiar_valor(row.get('estado_aprendiz', ''))
        print(f"🔍 Fila {numero_fila}: Estado RAW del Excel = '{estado_raw}'")
        
        estado_normalizado = normalizar_estado(estado_raw)
        datos_aprendiz['estado_aprendiz'] = estado_normalizado
        print(f"🏷️ Fila {numero_fila}: Estado original='{estado_raw}' -> Normalizado='{estado_normalizado}'")
        
        # También guardar en el campo estado para compatibilidad
        datos_aprendiz['estado'] = estado_normalizado
        
        # Clasificación automática si no hay estado claro
        if not limpiar_valor(row.get('estado_aprendiz', '')):
            estado_auto = clasificar_aprendiz_automaticamente(datos_aprendiz)
            datos_aprendiz['estado_aprendiz'] = estado_auto
            datos_aprendiz['estado'] = estado_auto
            datos_aprendiz['estado_clasificado_automaticamente'] = True  # Solo para tracking interno
            print(f"🤖 Fila {numero_fila}: Estado clasificado automáticamente como '{estado_auto}'")
        
        # Procesar otros campos con múltiples variaciones de nombres de columna
        datos_aprendiz['tipo_documento'] = limpiar_valor(obtener_valor_columna(row, ['tipo_documento', 'tipo_doc', 'td', 'tipo'], 'CC')).upper()[:2] or 'CC'
        datos_aprendiz['nombres'] = limpiar_valor(obtener_valor_columna(row, ['nombres', 'nombre', 'name', 'nombre_completo'], ''))
        datos_aprendiz['apellidos'] = limpiar_valor(obtener_valor_columna(row, ['apellidos', 'apellido', 'lastname'], ''))
        datos_aprendiz['email'] = limpiar_valor(obtener_valor_columna(row, ['email', 'correo', 'correo_electronico', 'mail', 'e_mail', 'email_contacto', 'correo_electrónico'], ''))
        datos_aprendiz['telefono'] = limpiar_valor(obtener_valor_columna(row, ['telefono', 'tel', 'celular', 'cel', 'telefono_contacto', 'teléfono', 'telefono_contacto'], ''))
        datos_aprendiz['especializacion'] = limpiar_valor(obtener_valor_columna(row, ['especialidad', 'especializacion', 'programa_formacion', 'programa', 'formacion'], ''))
        datos_aprendiz['ficha'] = limpiar_valor(obtener_valor_columna(row, ['ficha', 'numero_ficha', 'ficha_numero', 'ficha_no', 'grupo'], ''))
        
        # Logging para depuración de email y teléfono
        email_raw = obtener_valor_columna(row, ['email', 'correo', 'correo_electronico', 'mail', 'e_mail', 'email_contacto', 'correo_electrónico'], '')
        telefono_raw = obtener_valor_columna(row, ['telefono', 'tel', 'celular', 'cel', 'telefono_contacto', 'teléfono', 'telefono_contacto'], '')
        email_limpio = datos_aprendiz['email']
        telefono_limpio = datos_aprendiz['telefono']
        
        # Mostrar todas las columnas disponibles para depuración
        print(f"📋 Fila {numero_fila}: Columnas disponibles: {list(row.keys())}")
        
        # Mostrar contenido de columnas que podrían ser email o teléfono
        for col_name in list(row.keys()):
            col_value = str(row[col_name]) if row[col_name] is not None else 'None'
            if any(keyword in col_name.lower() for keyword in ['mail', 'email', 'correo', 'tel', 'cel', 'phone']):
                print(f"🔍 Columna '{col_name}' = '{col_value}'")
        
        print(f"📧 Fila {numero_fila}: Email - Raw='{email_raw}' -> Limpio='{email_limpio}'")
        print(f"📞 Fila {numero_fila}: Teléfono - Raw='{telefono_raw}' -> Limpio='{telefono_limpio}'")
        
        # Procesar fechas con nuevos nombres de columna
        from datetime import datetime
        etapa_electiva = limpiar_valor(obtener_valor_columna(row, [
            'fecha_lectiva', 'fecha_inicio_etapa_lectiva', 'fecha_inicio_etapa_lectiva',
            'etapa_electiva', 'fecha_inicio_etapa_practica'
        ], ''))
        etapa_practica = limpiar_valor(obtener_valor_columna(row, [
            'fecha_productiva', 'fecha_inicio_etapa_productiva', 'fecha_inicio_etapa_productiva',
            'etapa_practica', 'fecha_fin_etapa_practica'
        ], ''))
        
        # Función mejorada para parsear fechas con múltiples formatos
        def parsear_fecha(fecha_str):
            if not fecha_str or not isinstance(fecha_str, str) or not fecha_str.strip():
                return None
            fecha_str = fecha_str.strip()
            
            # Intentar diferentes formatos de fecha (ordenados por prioridad)
            formatos = [
                '%Y-%m-%d',    # 2024-03-15 (formato estándar)
                '%d/%m/%Y',    # 15/03/2024 (formato del usuario)
                '%d-%m-%Y',    # 15-03-2024 (variación)
                '%Y/%m/%d',    # 2024/03/15 (variación)
                '%d-%m-%Y %H:%M:%S',  # 2024-03-15 14:30:00
                '%d/%m/%Y %H:%M:%S',  # 15/03/2024 14:30:00
            ]
            
            for formato in formatos:
                try:
                    fecha_parseada = datetime.strptime(fecha_str, formato).date()
                    print(f"✅ Fecha parseada: '{fecha_str}' -> {fecha_parseada} (formato: {formato})")
                    return fecha_parseada
                except ValueError:
                    continue
            
            print(f"❌ No se pudo parsear la fecha: '{fecha_str}'")
            return None
        
        if etapa_electiva:
            datos_aprendiz['etapa_electiva'] = parsear_fecha(etapa_electiva)
            
        if etapa_practica:
            datos_aprendiz['etapa_practica'] = parsear_fecha(etapa_practica)
        
    except Exception as e:
        errores.append(f"Fila {numero_fila}: Error procesando datos - {str(e)}")
    
    return datos_aprendiz, errores

def procesar_excel_aprendices(archivo, nombre_archivo):
    """
    Procesa archivo Excel de aprendices
    Retorna dict con estadísticas de la carga
    """
    resultados = {
        'total': 0,
        'total_extraidos': 0,
        'nuevos': 0,
        'actualizados': 0,
        'errores': [],
        'empresas_nuevas': 0
    }
    
    try:
        print(f"📊 Leyendo archivo Excel: {nombre_archivo}")
        df = pd.read_excel(archivo)
        print(f"📋 Filas leídas: {len(df)}")
        
        # Limpieza robusta de datos
        df = df.fillna('')  # Reemplazar NaN con string vacío
        df = df.replace([float('nan'), float('inf'), float('-inf')], '')  # Eliminar valores especiales
        df = df.astype(str)  # Convertir todo a string
        
        # Para pandas >= 2.0, usar .map en lugar de .applymap
        try:
            df = df.map(lambda x: str(x).strip() if str(x).strip() != 'nan' else '')  # Pandas >= 2.0
        except AttributeError:
            df = df.applymap(lambda x: str(x).strip() if str(x).strip() != 'nan' else '')  # Pandas < 2.0
        
        print(f"✅ Datos limpiados, columnas: {list(df.columns)}")
        
        # Normalizar nombres de columnas
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        print(f"📋 Columnas normalizadas: {list(df.columns)}")
        
        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    resultados['total'] += 1
                    resultados['total_extraidos'] += 1  # Contar todas las filas extraídas
                    numero_fila = index + 2  # +2 porque Excel empieza en 1 y header es fila 1
                    
                    # Validar y clasificar la fila
                    datos_aprendiz, errores_fila = validar_y_clasificar_fila(row, numero_fila)
                    resultados['errores'].extend(errores_fila)
                    
                    if errores_fila:
                        continue  # Si hay errores obligatorios, saltar esta fila
                    
                    # Buscar o crear empresa si existe NIT
                    empresa = None
                    nit_empresa = str(row.get('nit_empresa', '')).strip()
                    nombre_empresa = str(row.get('nombre_empresa', '')).strip()
                    
                    if nit_empresa and nombre_empresa:
                        empresa, creada = Empresa.objects.get_or_create(
                            nit=nit_empresa,
                            defaults={
                                'razon_social': nombre_empresa,
                                'direccion': str(row.get('direccion_empresa', '')),
                                'telefono': str(row.get('telefono_empresa', '')),
                                'email': str(row.get('email_empresa', '')),
                                'sector_economico': str(row.get('sector_economico', '')),
                            }
                        )
                        if creada:
                            resultados['empresas_nuevas'] += 1
                    
                    # Parsear fechas
                    etapa_electiva = parse_fecha(row.get('fecha_lectiva'))
                    etapa_practica = parse_fecha(row.get('fecha_productiva'))
                    
                    # Completar datos del aprendiz
                    datos_aprendiz.update({
                        'etapa_electiva': etapa_electiva,
                        'etapa_practica': etapa_practica,
                        'empresa_vinculada': empresa,
                        'archivo_origen': nombre_archivo,
                    })
                    
                    # Clasificación final basada en contexto completo
                    if datos_aprendiz.get('estado_clasificado_automaticamente'):
                        # Si fue clasificado automáticamente, registrar en observaciones
                        obs_actual = datos_aprendiz.get('observaciones', '')
                        clasificacion_msg = f"[Estado clasificado automáticamente: {datos_aprendiz['estado']}]"
                        datos_aprendiz['observaciones'] = f"{obs_actual} {clasificacion_msg}".strip()
                    
                    # Eliminar campo temporal antes de crear el objeto
                    datos_aprendiz.pop('estado_clasificado_automaticamente', None)
                    
                    # Verificar si el aprendiz ya existe para preservar su estado
                    aprendiz_existente = Aprendiz.objects.filter(
                        numero_documento=datos_aprendiz['numero_documento']
                    ).first()
                    
                    if aprendiz_existente:
                        # Preservar el estado existente del aprendiz
                        estado_original = datos_aprendiz['estado_aprendiz']
                        estado_preservado = aprendiz_existente.estado_aprendiz
                        datos_aprendiz['estado_aprendiz'] = estado_preservado
                        datos_aprendiz['estado'] = estado_preservado  # También actualizar el campo estado para compatibilidad
                        print(f"🔄 Fila {numero_fila}: Estado preservado '{estado_preservado}' (era '{estado_original}')")
                        
                        # Eliminar el estado de los defaults para no sobreescribir
                        datos_aprendiz_para_actualizar = datos_aprendiz.copy()
                        datos_aprendiz_para_actualizar.pop('estado_aprendiz', None)
                        datos_aprendiz_para_actualizar.pop('estado', None)
                        
                        # Actualizar aprendiz existente sin cambiar el estado
                        for campo, valor in datos_aprendiz_para_actualizar.items():
                            if campo != 'numero_documento':  # No actualizar el documento
                                # Logging específico para email y teléfono
                                if campo in ['email', 'telefono']:
                                    print(f"📝 Actualizando {campo}: '{getattr(aprendiz_existente, campo, 'None')}' -> '{valor}'")
                                setattr(aprendiz_existente, campo, valor)
                        aprendiz_existente.save()
                        
                        # Logging final de email y teléfono después de guardar
                        print(f"✅ Fila {numero_fila}: Después de guardar - Email='{aprendiz_existente.email}', Teléfono='{aprendiz_existente.telefono}'")
                        
                        resultados['actualizados'] += 1
                    else:
                        # Crear nuevo aprendiz con el estado del Excel
                        aprendiz, creado = Aprendiz.objects.update_or_create(
                            numero_documento=datos_aprendiz['numero_documento'],
                            defaults=datos_aprendiz
                        )
                        
                        if creado:
                            resultados['nuevos'] += 1
                            # Registrar clasificación automática en resultados
                            if datos_aprendiz.get('estado_clasificado_automaticamente'):
                                resultados['errores'].append(
                                    f"Fila {numero_fila}: {datos_aprendiz['nombres']} {datos_aprendiz['apellidos']} "
                                    f"clasificado automáticamente como '{datos_aprendiz['estado']}'"
                                )
                        
                except Exception as e:
                    resultados['errores'].append(f"Fila {numero_fila}: {str(e)}")
            
            # Registrar carga
            CargaExcel.objects.create(
                archivo=nombre_archivo,
                total_registros=resultados['total'],
                registros_nuevos=resultados['nuevos'],
                registros_actualizados=resultados['actualizados'],
                errores='\n'.join(resultados['errores']) if resultados['errores'] else None
            )
            
    except Exception as e:
        resultados['errores'].append(f"Error general: {str(e)}")
    
    return resultados

def parse_fecha(fecha_val):
    """Parsea diferentes formatos de fecha"""
    if pd.isna(fecha_val) or fecha_val == '':
        return None
    
    if isinstance(fecha_val, datetime):
        return fecha_val.date()
    
    # Intentar diferentes formatos
    formatos = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']
    for formato in formatos:
        try:
            return datetime.strptime(str(fecha_val).strip(), formato).date()
        except:
            continue
    
    return None

def get_estadisticas_dashboard():
    """Genera estadísticas para el dashboard"""
    from django.db.models import Count, Q
    from datetime import date, timedelta
    
    # Conteos por estado
    por_estado = dict(Aprendiz.objects.values('estado').annotate(
        total=Count('id')
    ).values_list('estado', 'total'))
    
    # Completar estados faltantes con 0
    for estado_code, estado_label in Aprendiz.ESTADOS:
        if estado_code not in por_estado:
            por_estado[estado_code] = 0
    
    # Aprendices con etapa práctica terminando en 30 días
    fecha_limite = date.today() + timedelta(days=30)
    practica_por_terminar = Aprendiz.objects.filter(
        etapa_practica__lte=fecha_limite,
        etapa_practica__gte=date.today()
    ).count()
    
    # Empresas con más aprendices
    top_empresas = Empresa.objects.annotate(
        num_aprendices=Count('aprendices')
    ).order_by('-num_aprendices')[:5]
    
    # Totales
    total_aprendices = Aprendiz.objects.count()
    total_empresas = Empresa.objects.count()
    total_disponibles = Aprendiz.objects.filter(estado='DISPONIBLE').count()
    
    return {
        'por_estado': por_estado,
        'total_aprendices': total_aprendices,
        'total_empresas': total_empresas,
        'total_disponibles': total_disponibles,
        'practica_por_terminar': practica_por_terminar,
        'top_empresas': top_empresas,
    }
