#!/usr/bin/env python3
"""
Script para aplicar correcciones de despliegue
Ejecutar en el servidor de producción
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Ejecuta un comando y muestra el resultado"""
    print(f"\n🔧 {description}")
    print(f"Comando: {command}")
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Éxito: {result.stdout}")
        else:
            print(f"❌ Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Excepción: {e}")
        return False
    
    return True

def main():
    print("🚀 Iniciando correcciones de despliegue para Django")
    
    # 1. Ejecutar migraciones
    if not run_command("python manage.py migrate", "Ejecutando migraciones pendientes"):
        print("❌ Falló la migración")
        return False
    
    # 2. Recolectar archivos estáticos
    if not run_command("python manage.py collectstatic --noinput", "Recolectando archivos estáticos"):
        print("❌ Falló la recolección de estáticos")
        return False
    
    # 3. Verificar configuración
    if not run_command("python manage.py check --deploy", "Verificando configuración de producción"):
        print("⚠️ Advertencias en configuración de producción")
    
    print("\n✅ Correcciones completadas")
    print("🔄 Reinicia el servidor si es necesario")
    
    return True

if __name__ == "__main__":
    main()
