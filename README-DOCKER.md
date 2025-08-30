# Casa de Cambios - Despliegue con Docker y EasyPanel

## 🐳 Configuración para Docker

Este proyecto está configurado para desplegarse usando Docker y EasyPanel con una arquitectura de microservicios.

### Arquitectura

- **Frontend**: React + TypeScript + Vite servido por Nginx
- **Backend**: Node.js + Express API
- **Base de Datos**: PostgreSQL (Supabase)
- **Proxy Reverso**: Nginx (incluido en el frontend)

## 📋 Prerrequisitos

1. **VPS con EasyPanel instalado**
2. **Cuenta de Supabase configurada**
3. **Redis (opcional, para rate limiting)**

## 🚀 Despliegue en EasyPanel

### Paso 1: Preparar el repositorio

1. Sube tu código a un repositorio Git (GitHub, GitLab, etc.)
2. Asegúrate de que todos los archivos Docker estén incluidos:
   - `Dockerfile.frontend`
   - `Dockerfile.backend`
   - `docker-compose.easypanel.yml`
   - `nginx.conf`
   - `.dockerignore`

### Paso 2: Configurar en EasyPanel

1. **Crear nueva aplicación**:
   - Tipo: Docker Compose
   - Repositorio: Tu repositorio Git
   - Archivo compose: `docker-compose.easypanel.yml`

2. **Configurar variables de entorno**:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# PostgreSQL Configuration
DATABASE_URL=postgresql://postgres.tu-proyecto:tu_password@region.pooler.supabase.com:5432/postgres?sslmode=require
DB_HOST=region.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.tu-proyecto
DB_PASSWORD=tu_password

# JWT Configuration
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres
JWT_EXPIRES_IN=24h

# Redis Configuration (opcional)
REDIS_URL=redis://tu-redis-url:6379
REDIS_PASSWORD=tu_redis_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=tu_session_secret_minimo_32_caracteres
```

### Paso 3: Configurar dominio

1. En EasyPanel, configura tu dominio personalizado
2. EasyPanel manejará automáticamente:
   - Certificados SSL
   - Proxy reverso
   - Load balancing

## 🔧 Configuración de Servicios

### Frontend (Puerto 80)
- Servido por Nginx
- Archivos estáticos optimizados
- Proxy automático a la API backend
- Configuración SPA para React Router

### Backend (Puerto 3001)
- API Node.js + Express
- Conexión a Supabase
- Rate limiting con Redis
- Health checks automáticos

## 🏥 Health Checks

Ambos servicios incluyen health checks:

- **Frontend**: `GET /` (Nginx status)
- **Backend**: `GET /health` (API + DB status)

## 🔒 Seguridad

### Variables de entorno sensibles
- Nunca hardcodees credenciales en el código
- Usa las variables de entorno de EasyPanel
- Rota regularmente JWT_SECRET y SESSION_SECRET

### Configuración de red
- Los servicios se comunican a través de una red Docker privada
- Solo el frontend está expuesto públicamente
- El backend solo es accesible desde el frontend

## ⚠️ Notas Importantes

### Seguridad
- **NUNCA** hardcodees credenciales en el código
- Usa variables de entorno para todos los secretos
- Rota regularmente JWT_SECRET y SESSION_SECRET
- Mantén actualizadas las credenciales de Supabase

### Configuración Específica de EasyPanel
- **Proxy Port**: SIEMPRE configura a **80** para el frontend (puerto interno de Nginx)
- **NO uses labels de Traefik** - EasyPanel maneja esto automáticamente
- **NO definas networks** - EasyPanel crea la red automáticamente
- **NO expongas puertos** en docker-compose - EasyPanel los maneja
- **Usa Traefik integrado** - viene preconfigurado con EasyPanel

### Comunicación entre Servicios
- Los servicios se comunican usando nombres de servicio (ej: `backend:3001`)
- EasyPanel crea automáticamente una red Docker interna
- Solo el frontend necesita estar expuesto públicamente
- El backend es accesible solo desde el frontend a través del proxy

### Base de Datos y Conexiones
- **IMPORTANTE**: Configura connection pool mínimo a 0 para evitar problemas con Docker
- EasyPanel puede matar conexiones inactivas automáticamente
- Usa connection pooling inteligente que maneje reconexiones

## 📊 Monitoreo

### Logs
- EasyPanel proporciona logs en tiempo real
- Logs estructurados en formato JSON
- Separación de logs por servicio

### Métricas
- Health checks automáticos cada 30 segundos
- Reinicio automático en caso de fallo
- Métricas de CPU y memoria disponibles

## 🛠️ Troubleshooting

### Problemas comunes

1. **Backend no conecta con Supabase**:
   - Verifica las variables de entorno
   - Comprueba la configuración de red de Supabase
   - Revisa los logs del contenedor backend

2. **Frontend no carga**:
   - Verifica que el build de Vite sea exitoso
   - Comprueba la configuración de Nginx
   - Revisa los logs del contenedor frontend

3. **API calls fallan**:
   - Verifica la configuración del proxy en nginx.conf
   - Comprueba que ambos servicios estén en la misma red
   - Revisa los logs de ambos contenedores

### Comandos útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart

# Reconstruir y reiniciar
docker-compose up --build -d
```

## 🔄 Actualizaciones

1. **Push cambios al repositorio**
2. **En EasyPanel**: Trigger rebuild
3. **EasyPanel automáticamente**:
   - Descarga el código actualizado
   - Reconstruye las imágenes
   - Despliega sin downtime

## 📈 Escalabilidad

### Horizontal scaling
- EasyPanel puede escalar automáticamente
- Configurar múltiples réplicas según demanda
- Load balancing automático

### Optimizaciones
- Imágenes Docker optimizadas con Alpine Linux
- Multi-stage builds para reducir tamaño
- Gzip compression en Nginx
- Cache de archivos estáticos

## 🆘 Soporte

Para problemas específicos de despliegue:
1. Revisa los logs en EasyPanel
2. Verifica la configuración de variables de entorno
3. Comprueba el estado de Supabase
4. Contacta al equipo de desarrollo si persisten los problemas