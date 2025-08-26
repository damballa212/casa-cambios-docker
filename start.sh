#!/bin/bash

# Script para iniciar Casa de Cambios Dashboard con Backend
echo "🚀 Iniciando Casa de Cambios - Dashboard y API Backend"
echo "================================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ Node.js y npm están disponibles"

# Instalar dependencias del frontend si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
fi

# Instalar dependencias del backend si no existen
if [ ! -d "server/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd server && npm install && cd ..
fi

echo "🔧 Verificando configuración..."

# Verificar que existe el archivo .env del servidor
if [ ! -f "server/.env" ]; then
    echo "⚠️  Advertencia: No se encontró server/.env"
    echo "Asegúrate de configurar las credenciales de Supabase"
fi

echo "🌐 Iniciando servidores..."
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001"
echo "Health Check: http://localhost:3001/health"
echo ""
echo "Para detener los servidores, presiona Ctrl+C"
echo "================================================"

# Función para manejar la señal de interrupción
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servidores detenidos"
    exit 0
}

# Configurar trap para manejar Ctrl+C
trap cleanup SIGINT SIGTERM

# Iniciar backend en segundo plano
echo "🔧 Iniciando API Backend..."
cd server && npm start &
BACKEND_PID=$!
cd ..

# Esperar un momento para que el backend se inicie
sleep 3

# Iniciar frontend en segundo plano
echo "🎨 Iniciando Frontend Dashboard..."
npm run dev &
FRONTEND_PID=$!

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID