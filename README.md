# Casa de Cambios - Dashboard TikTok Producción V1

## 🎯 Descripción

Sistema completo de casa de cambios que automatiza el procesamiento de transacciones de USD a Guaraníes paraguayos a través de WhatsApp, con un dashboard web de control y monitoreo en tiempo real.

## 🏗️ Arquitectura del Sistema

### Componentes:
- **Frontend Dashboard**: React + TypeScript + Tailwind CSS
- **Backend API**: Node.js + Express + Supabase
- **Workflow n8n**: Automatización de WhatsApp con IA
- **Base de Datos**: PostgreSQL (Supabase)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada

### 1. Clonar y configurar el proyecto

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd server
npm install
cd ..
```

### 2. Configurar Base de Datos Supabase

#### Credenciales actuales:
- **URL**: `https://ixvefxnycehbvipxcngv.supabase.co`
- **Password**: `marlon212`
- **Puerto**: `5432`

#### Crear las tablas necesarias en Supabase:

```sql
-- Tabla de tasas globales
CREATE TABLE global_rate (
    id SERIAL PRIMARY KEY,
    rate DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de colaboradores
CREATE TABLE collaborators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    base_pct_usd_total DECIMAL(5,2),
    tx_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    tx_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    chat_id VARCHAR(255),
    colaborador VARCHAR(255),
    cliente VARCHAR(255) NOT NULL,
    usd_total DECIMAL(10,2) NOT NULL,
    comision DECIMAL(5,2) NOT NULL,
    usd_neto DECIMAL(10,2) NOT NULL,
    monto_gs BIGINT NOT NULL,
    monto_colaborador_gs BIGINT,
    monto_colaborador_usd DECIMAL(10,2),
    monto_comision_gabriel_gs BIGINT,
    monto_comision_gabriel_usd DECIMAL(10,2),
    tasa_usada DECIMAL(10,2) NOT NULL,
    observaciones TEXT
);

-- Insertar tasa inicial
INSERT INTO global_rate (rate) VALUES (7300);

-- Insertar colaboradores iniciales
INSERT INTO collaborators (name, base_pct_usd_total) VALUES 
('Gabriel Zambrano', 0),
('Patty', 5),
('Anael', NULL);
```

### 3. Configurar variables de entorno

El archivo `server/.env` ya está configurado con las credenciales proporcionadas:

```env
SUPABASE_URL=https://ixvefxnycehbvipxcngv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DB_PASSWORD=marlon212
PORT=3001
```

## 🎮 Uso del Sistema

### Iniciar el sistema completo:

```bash
# Opción 1: Script automático (recomendado)
./start.sh

# Opción 2: Manual
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
npm run dev
```

### URLs de acceso:
- **Dashboard**: http://localhost:5173
- **API Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📊 Funcionalidades del Dashboard

### 1. Dashboard Principal
- Métricas en tiempo real
- Estado de conexión con Supabase
- Actividad reciente del sistema

### 2. Gestión de Transacciones
- Lista completa de transacciones
- Filtros por estado y búsqueda
- Estadísticas de volumen y comisiones

### 3. Gestión de Tasas
- Actualización manual de tasas USD/Gs
- Historial de cambios
- Calculadora de impacto

### 4. Gestión de Colaboradores
- Perfiles y reglas de comisión
- Estadísticas de performance
- Transacciones por colaborador

### 5. Reportes y Analíticas
- Tendencias mensuales
- Performance por colaborador
- Top clientes

### 6. Logs del Sistema
- Monitoreo en tiempo real
- Filtros por nivel de log
- Estado de salud de componentes

## 🔧 API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - Métricas principales
- `GET /health` - Estado de salud

### Transacciones
- `GET /api/transactions` - Lista de transacciones

### Colaboradores
- `GET /api/collaborators` - Lista de colaboradores

### Tasas
- `GET /api/rate/current` - Tasa actual
- `GET /api/rate/history` - Historial de tasas
- `POST /api/rate/update` - Actualizar tasa

### Reportes
- `GET /api/reports/summary` - Resumen de reportes

## 🔗 Integración con n8n Workflow

El workflow de n8n (`workflow n8n/TIKTOK PRODUCCION V1.json`) procesa automáticamente:

1. **Mensajes de WhatsApp** → Webhook
2. **Extracción de datos** → IA (OpenAI GPT-4)
3. **Validación y cálculos** → Lógica de negocio
4. **Almacenamiento** → PostgreSQL (Supabase)
5. **Sincronización** → Google Sheets
6. **Respuesta** → WhatsApp

### Formatos de mensaje soportados:
```
#TASA 7300
#TRANSACCION Cliente María González: 500$ - 15%
#TRANSACCION Colaborador Patty Cliente Juan: 250$ - 10%
```

## 🛡️ Seguridad

- Rate limiting (10 mensajes/minuto por chat)
- Validación de estructura de datos
- Idempotency keys para prevenir duplicados
- Logging estructurado para auditoría

## 🔍 Troubleshooting

### Backend no conecta con Supabase:
1. Verificar credenciales en `server/.env`
2. Comprobar que las tablas existen
3. Revisar logs en `http://localhost:3001/health`

### Frontend muestra "BD Desconectada":
1. Verificar que el backend esté ejecutándose
2. Comprobar `http://localhost:3001/health`
3. Revisar la consola del navegador

### Workflow n8n no funciona:
1. Verificar credenciales de PostgreSQL
2. Comprobar webhook de WhatsApp
3. Revisar configuración de OpenAI

## 📝 Logs y Monitoreo

- **Backend logs**: Consola del servidor
- **Frontend logs**: Consola del navegador
- **n8n logs**: Panel de n8n
- **Database logs**: Supabase Dashboard

## 🚀 Despliegue en Producción

### Variables de entorno para producción:
```env
NODE_ENV=production
SUPABASE_URL=tu_url_de_produccion
SUPABASE_ANON_KEY=tu_key_de_produccion
PORT=3001
```

### Build del frontend:
```bash
npm run build
npm run preview
```

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Casa de Cambios TikTok Producción V1** - Sistema automatizado de cambio de divisas con dashboard de control en tiempo real.