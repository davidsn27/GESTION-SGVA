import pandas as pd
from datetime import datetime
from django.db import transaction
from .models import Aprendiz, Empresa

def procesar_excel_simple(archivo, nombre_archivo):
    """
    Procesa archivo Excel con el modelo completo de Aprendiz
    Extrae todos los campos posibles del Excel del SENA
    """
    resultados = {
        'total': 0,
        'nuevos': 0,
        'actualizados': 0,
        'errores': []
    }
    
    try:
        print(f"📊 Leyendo archivo Excel: {nombre_archivo}")
        df = pd.read_excel(archivo)
        print(f"📋 Filas leídas: {len(df)}")
        
        # Limpieza de datos
        df = df.fillna('')
        df = df.replace([float('nan'), float('inf'), float('-inf')], '')
        
        # Normalizar nombres de columnas
        columnas_originales = list(df.columns)
        df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
        print(f"✅ Columnas disponibles: {columnas_originales}")
        print(f"✅ Columnas normalizadas: {list(df.columns)}")
        
        # Función helper para obtener valor de columna
        def obtener_valor(row, posibles_nombres, default=''):
            for nombre in posibles_nombres:
                if nombre in row and str(row[nombre]).strip():
                    return str(row[nombre]).strip()
            return default
        
        # Función para parsear fechas
        def parsear_fecha(fecha_str):
            if not fecha_str or fecha_str == '':
                return None
            try:
                # Intentar diferentes formatos
                for formato in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']:
                    try:
                        return datetime.strptime(str(fecha_str).strip(), formato).date()
                    except:
                        continue
            except:
                pass
            return None
        
        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    resultados['total'] += 1
                    numero_fila = index + 2
                    
                    # === INFORMACIÓN BÁSICA ===
                    # Nombre (combinar Apellidos + Nombres)
                    apellidos = obtener_valor(row, ['apellidos', 'apellido', 'lastname', 'primer_apellido', 'segundo_apellido'])
                    nombres = obtener_valor(row, ['nombres', 'nombre', 'name', 'primer_nombre', 'segundo_nombre'])
                    
                    if apellidos and nombres:
                        nombre_completo = f"{apellidos} {nombres}"
                    elif apellidos:
                        nombre_completo = apellidos
                    elif nombres:
                        nombre_completo = nombres
                    else:
                        nombre_completo = obtener_valor(row, ['nombre_completo', 'aprendiz', 'estudiante'])
                    
                    # Documento y tipo
                    tipo_doc = obtener_valor(row, ['tipo_doc', 'tipo_documento', 'tipo_de_documento', 'td'])
                    documento = obtener_valor(row, [
                        'numero', 'número', 'documento', 'numero_documento', 'numero_doc', 
                        'cedula', 'cc', 'id', 'nit', 'doc', 'document'
                    ])
                    
                    # === INFORMACIÓN DE CONTACTO ===
                    email = obtener_valor(row, ['email', 'correo', 'correo_electronico', 'correo_electrónico', 'e_mail', 'mail'])
                    telefono = obtener_valor(row, ['telefono', 'teléfono', 'celular', 'cel', 'telefono_contacto', 'tel'])
                    direccion = obtener_valor(row, ['direccion', 'dirección', 'direccion_residencia', 'barrio'])
                    
                    # === INFORMACIÓN ACADÉMICA ===
                    programa = obtener_valor(row, ['programa', 'programa_formacion', 'formacion', 'especialidad', 'curso', 'area'])
                    ficha = obtener_valor(row, ['ficha', 'numero_ficha', 'ficha_numero', 'grupo', 'num_ficha'])
                    
                    # === FECHAS ===
                    fecha_nacimiento = parsear_fecha(obtener_valor(row, ['fecha_nacimiento', 'fecha_nac', 'nacimiento']))
                    fecha_ingreso = parsear_fecha(obtener_valor(row, ['fecha_ingreso', 'fecha_inicio']))
                    fecha_lectiva = parsear_fecha(obtener_valor(row, ['fecha_lectiva', 'fecha lectiva', 'fecha_inicio_lectiva', 'inicio_lectiva', 'fecha_leci']))
                    fecha_practica = parsear_fecha(obtener_valor(row, ['fecha_productiva', 'fecha productiva', 'fecha_inicio_practica', 'inicio_productiva', 'fecha_pro']))
                    
                    # === UBICACIÓN ===
                    regional = obtener_valor(row, ['regional', 'codigo_regional', 'reg'])
                    centro = obtener_valor(row, ['centro', 'codigo_centro', 'sede', 'centro_de_formacion'])
                    municipio = obtener_valor(row, ['municipio', 'ciudad', 'municipio_residencia'])
                    
                    # === FILTRO POR CENTRO ===
                    # Solo procesar aprendices del Centro de Tecnologías del Transporte
                    if centro and 'TECNOLOGIAS DEL TRANSPORTE' not in centro.upper():
                        print(f"⏭️ Fila {numero_fila}: Saltando - No es del Centro de Tecnologías del Transporte ({centro})")
                        continue
                    
                    # === ESTADO ===
                    estado_raw = obtener_valor(row, ['estado', 'estado_aprendiz', 'situacion', 'status', 'condicion', 'estado_aprendices'])
                    if not estado_raw:
                        estado_raw = 'Disponible'
                    estado = normalizar_estado_simple(estado_raw)
                    
                    # === EMPRESA Y CONTRATO ===
                    nit_empresa = obtener_valor(row, ['nit_empresa', 'nit', 'nit_de_la_empresa', 'empresa_nit'])
                    razon_social_empresa = obtener_valor(row, ['razon_social', 'empresa', 'nombre_empresa', 'razon_social_empresa'])
                    fecha_inicio_contrato = parsear_fecha(obtener_valor(row, ['fecha_inicio_contrato', 'inicio_contrato']))
                    fecha_fin_contrato = parsear_fecha(obtener_valor(row, ['fecha_fin_contrato', 'fin_contrato', 'fecha_terminacion']))
                    
                    # Cantidad de contratos
                    cant_contratos_str = obtener_valor(row, ['cantidad_de_contratos', 'numero_contratos', 'contratos'])
                    try:
                        cantidad_contratos = int(cant_contratos_str) if cant_contratos_str else 0
                    except:
                        cantidad_contratos = 0
                    
                    # === OBSERVACIONES ===
                    observaciones = obtener_valor(row, ['observaciones', 'obs', 'notas', 'comentarios'])
                    
                    print(f"🔍 Fila {numero_fila}: {nombre_completo} - {documento}")
                    
                    # Validar campos obligatorios
                    if not nombre_completo or not documento:
                        resultados['errores'].append(f"Fila {numero_fila}: Nombre y documento son obligatorios")
                        continue
                    
                    # Buscar si el aprendiz ya existe
                    aprendiz_existente = Aprendiz.objects.filter(documento=documento).first()
                    
                    if aprendiz_existente:
                        # Actualizar todos los campos
                        aprendiz_existente.nombre = nombre_completo
                        aprendiz_existente.tipo_documento = tipo_doc or aprendiz_existente.tipo_documento
                        aprendiz_existente.email = email or aprendiz_existente.email
                        aprendiz_existente.telefono = telefono or aprendiz_existente.telefono
                        aprendiz_existente.direccion = direccion or aprendiz_existente.direccion
                        aprendiz_existente.programa = programa or aprendiz_existente.programa
                        aprendiz_existente.ficha = ficha or aprendiz_existente.ficha
                        aprendiz_existente.fecha_nacimiento = fecha_nacimiento or aprendiz_existente.fecha_nacimiento
                        aprendiz_existente.fecha_ingreso = fecha_ingreso or aprendiz_existente.fecha_ingreso
                        aprendiz_existente.fecha_lectiva = fecha_lectiva or aprendiz_existente.fecha_lectiva
                        aprendiz_existente.fecha_practica = fecha_practica or aprendiz_existente.fecha_practica
                        aprendiz_existente.regional = regional or aprendiz_existente.regional
                        aprendiz_existente.centro = centro or aprendiz_existente.centro
                        aprendiz_existente.municipio = municipio or aprendiz_existente.municipio
                        aprendiz_existente.estado = estado
                        aprendiz_existente.nit_empresa = nit_empresa or aprendiz_existente.nit_empresa
                        aprendiz_existente.razon_social_empresa = razon_social_empresa or aprendiz_existente.razon_social_empresa
                        aprendiz_existente.fecha_inicio_contrato = fecha_inicio_contrato or aprendiz_existente.fecha_inicio_contrato
                        aprendiz_existente.fecha_fin_contrato = fecha_fin_contrato or aprendiz_existente.fecha_fin_contrato
                        aprendiz_existente.cantidad_de_contratos = cantidad_contratos or aprendiz_existente.cantidad_de_contratos
                        aprendiz_existente.observaciones = observaciones or aprendiz_existente.observaciones
                        aprendiz_existente.archivo_origen = nombre_archivo
                        aprendiz_existente.save()
                        resultados['actualizados'] += 1
                        print(f"🔄 Fila {numero_fila}: Aprendiz actualizado - {nombre_completo}")
                    else:
                        # Crear nuevo aprendiz con todos los campos
                        Aprendiz.objects.create(
                            nombre=nombre_completo,
                            documento=documento,
                            tipo_documento=tipo_doc,
                            email=email,
                            telefono=telefono,
                            direccion=direccion,
                            programa=programa,
                            ficha=ficha,
                            fecha_nacimiento=fecha_nacimiento,
                            fecha_ingreso=fecha_ingreso,
                            fecha_lectiva=fecha_lectiva,
                            fecha_practica=fecha_practica,
                            regional=regional,
                            centro=centro,
                            municipio=municipio,
                            estado=estado,
                            nit_empresa=nit_empresa,
                            razon_social_empresa=razon_social_empresa,
                            fecha_inicio_contrato=fecha_inicio_contrato,
                            fecha_fin_contrato=fecha_fin_contrato,
                            cantidad_de_contratos=cantidad_contratos,
                            observaciones=observaciones,
                            archivo_origen=nombre_archivo
                        )
                        resultados['nuevos'] += 1
                        print(f"✅ Fila {numero_fila}: Aprendiz creado - {nombre_completo}")
                        
                except Exception as e:
                    error_msg = f"Fila {numero_fila}: {str(e)}"
                    resultados['errores'].append(error_msg)
                    print(f"❌ {error_msg}")
    
    except Exception as e:
        error_msg = f"Error general procesando archivo: {str(e)}"
        resultados['errores'].append(error_msg)
        print(f"❌ {error_msg}")
    
    # Resumen final
    print(f"\n📊 RESUMEN: {resultados['nuevos']} nuevos, {resultados['actualizados']} actualizados, {len(resultados['errores'])} errores")
    
    return resultados

def normalizar_estado_simple(estado_str):
    """
    Normaliza el estado al formato del modelo simplificado
    """
    if not estado_str or estado_str.strip() == '':
        return 'Disponible'
    
    estado_str = estado_str.strip().lower()
    
    # Mapeo de estados simples
    mapeo_estados = {
        'disponible': 'Disponible',
        'aprendiz aplica': 'Aprendiz Aplica',
        'empresa solicita': 'Empresa Solicita',
        'en proceso de selección': 'En Proceso de Selección',
        'proceso de selección abierto': 'Proceso de Selección Abierto',
        'aprendiz con procesos de seleccion abiertos': 'Proceso de Selección Abierto',
        'aprendiz con procesos de selección abiertos': 'Proceso de Selección Abierto',
        'contratado': 'Contratado',
        'final contrato': 'Final Contrato',
        'cancelado': 'Cancelado',
        'alumno retirado': 'Alumno Retirado',
        'aplazado': 'Aplazado',
        'pendiente por certificar': 'Pendiente Por Certificar',
        'bajo rendimiento académico': 'Bajo Rendimiento Académico',
        'aprendiz no interesado en contrato': 'Aprendiz no interesado en contrato',
        'inhabilitado por actualización': 'Inhabilitado Por Actualización',
        'contrato no registrado': 'Contrato No Registrado',
        'fallecido': 'Fallecido',
    }
    
    # Buscar coincidencia exacta
    if estado_str in mapeo_estados:
        return mapeo_estados[estado_str]
    
    # Búsqueda por palabras clave
    if 'disponible' in estado_str or 'activo' in estado_str:
        return 'Disponible'
    elif 'aplica' in estado_str or 'postul' in estado_str:
        return 'Aprendiz Aplica'
    elif 'empresa' in estado_str or 'solicita' in estado_str:
        return 'Empresa Solicita'
    elif 'proceso' in estado_str or 'selección' in estado_str or 'seleccion' in estado_str:
        return 'En Proceso de Selección'
    elif 'contrat' in estado_str or 'vincul' in estado_str:
        return 'Contratado'
    elif 'final' in estado_str or 'termin' in estado_str:
        return 'Final Contrato'
    elif 'cancel' in estado_str or 'anul' in estado_str:
        return 'Cancelado'
    elif 'retir' in estado_str or 'abandon' in estado_str:
        return 'Alumno Retirado'
    elif 'aplaz' in estado_str or 'pospon' in estado_str:
        return 'Aplazado'
    elif 'certific' in estado_str or 'cert' in estado_str:
        return 'Pendiente Por Certificar'
    elif 'rendimiento' in estado_str or 'bajo' in estado_str:
        return 'Bajo Rendimiento Académico'
    elif 'interesado' in estado_str or 'no quiere' in estado_str:
        return 'Aprendiz no interesado en contrato'
    elif 'inhabilit' in estado_str or 'suspend' in estado_str:
        return 'Inhabilitado Por Actualización'
    elif 'no registr' in estado_str or 'sin contrato' in estado_str:
        return 'Contrato No Registrado'
    elif 'fallec' in estado_str or 'muerto' in estado_str:
        return 'Fallecido'
    
    # Valor por defecto
    return 'Disponible'

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
