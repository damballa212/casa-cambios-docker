# 🏦 Casa de Cambios - Dashboard TikTok Producción V2.1.0

## 🎯 Descripción

Sistema completo de casa de cambios que automatiza el procesamiento de transacciones de USD a Guaraníes paraguayos a través de WhatsApp, con un dashboard web de control y monitoreo en tiempo real.

### ✨ **NUEVO EN V2.1.0**
- 🎨 **Modal Profesional de Eliminación** con debugging en tiempo real
- ⚡ **Barra de Progreso Visual** con 5 pasos de validación
- 🛡️ **Sistema de Seguridad Avanzado** con validaciones automáticas
- 🔧 **Pool de Conexiones Optimizado** sin errores de timeout
- 📱 **Diseño Responsive Mejorado** con bordes redondeados profesionales

## 🏗️ Arquitectura del Sistema

### Componentes:
- **Frontend Dashboard**: React + TypeScript + Tailwind CSS
- **Backend API**: Node.js + Express + Supabase
- **Workflow n8n**: Automatización de WhatsApp con IA
- **Base de Datos**: PostgreSQL (Supabase)
- **🆕 Sistema de Debugging**: Validaciones profesionales en tiempo real

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase configurada

### 1. Clonar y configurar el proyecto
```bash
# Clonar repositorio
git clone https://github.com/damballa212/casa-cambios-docker.git
cd casa-cambios-docker

# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd server
npm install
cd ..
```

### 2. Configurar Base de Datos Supabase

**Configuración de Base de Datos:**
- URL: Configurada en variables de entorno
- Credenciales: Configuradas en server/.env (ver .env.example)
- Puerto: 5432

**Crear las tablas necesarias en Supabase:**
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
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales
INSERT INTO global_rate (rate) VALUES (7300);
INSERT INTO collaborators (name, base_pct_usd_total) VALUES 
('Gabriel Zambrano', 0),
('Patty', 5),
('Anael', NULL);
```

### 3. Configurar variables de entorno

El archivo `server/.env` debe contener:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
DB_PASSWORD=tu_password_aqui
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

### 🔐 Credenciales de Acceso:
- **Admin**: admin / admin123
- **Owner**: gabriel / gabriel212

## 📊 Funcionalidades del Dashboard

### 1. Dashboard Principal
- Métricas en tiempo real
- Estado de conexión con Supabase
- Actividad reciente del sistema

### 2. 🆕 Gestión de Transacciones Profesional
- **Lista completa** de transacciones con filtros avanzados
- **🎨 Modal de eliminación profesional** con debugging en tiempo real
- **⚡ Barra de progreso visual** con 5 pasos de validación:
  - ✅ Validación de Seguridad
  - ✅ Verificación de Integridad
  - ✅ Análisis de Impacto
  - ✅ Validación de Permisos
  - ✅ Eliminación Segura
- **🛡️ Validaciones automáticas** de seguridad
- **📊 Estadísticas** de volumen y comisiones

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
- `DELETE /api/transactions/:id` - 🆕 **Eliminación profesional con debugging**

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

### 🆕 **Nuevas Características de Seguridad V2.1.0:**
- **🔍 Debugging profesional** con validaciones exhaustivas
- **⏱️ Análisis de edad** de transacciones (máximo 168 horas)
- **🔗 Verificación de dependencias** (sin transacciones posteriores)
- **👥 Análisis de impacto** en colaboradores y clientes
- **🛡️ Validación de permisos** automática
- **📊 Cálculo de nivel de riesgo** (LOW, MEDIUM, HIGH, CRITICAL)

### Características existentes:
- Rate limiting (10 mensajes/minuto por chat)
- Validación de estructura de datos
- Idempotency keys para prevenir duplicados
- Logging estructurado para auditoría

## 🔍 Troubleshooting

### Backend no conecta con Supabase:
1. Verificar credenciales en `server/.env`
2. Comprobar que las tablas existen
3. Revisar logs en http://localhost:3001/health

### 🆕 **Errores de eliminación de transacciones:**
1. **Error de timeout**: Verificar configuración del pool de conexiones
2. **Validación fallida**: Revisar logs del debugging profesional
3. **Permisos insuficientes**: Verificar rol de usuario (admin/owner)

### Frontend muestra errores:
1. Verificar que el backend esté corriendo
2. Comprobar la URL de la API
3. Revisar la consola del navegador

## 📈 Métricas de Performance V2.1.0

### 🔧 **Mejoras Técnicas:**
- ⚡ **Timeouts de conexión**: De 2s a 10s (500% mejora)
- 🔗 **Pool de conexiones**: De 10 a 15 simultáneas (50% más)
- 🛡️ **Estabilidad**: 0% fallos por timeout
- 📊 **Logging**: Trazabilidad completa de operaciones

### 🎨 **Mejoras de UX:**
- 🎭 **Modal profesional**: Bordes redondeados y gradientes
- ⏱️ **Feedback visual**: Progreso en tiempo real
- 📱 **Responsive**: Funciona en todos los dispositivos
- 🎯 **Accesibilidad**: Botones siempre visibles

## 🎉 Novedades V2.1.0

### ✨ **Características Destacadas:**
- 🎨 **Modal de eliminación completamente rediseñado**
- ⚡ **Sistema de debugging profesional en tiempo real**
- 🛡️ **Validaciones de seguridad automáticas**
- 📊 **Análisis de impacto financiero**
- 🔧 **Pool de conexiones optimizado**
- 📱 **Diseño responsive mejorado**

### 🔗 **Enlaces Importantes:**
- 📋 **Changelog completo**: [CHANGELOG-v2.1.0.md](./CHANGELOG-v2.1.0.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/damballa212/casa-cambios-docker/issues)
- 📖 **Documentación**: Este README

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

**Desarrollado con ❤️ para Casa de Cambios - Dashboard TikTok Producción V2.1.0**

*Sistema profesional de gestión de transacciones con debugging avanzado y diseño moderno*