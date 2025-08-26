# Casa de Cambios - Configuración Docker 🐳

## 🎯 Descripción

Este proyecto está completamente dockerizado para facilitar el despliegue en EasyPanel y otros servicios de hosting. Utiliza un puerto inusual (8847) para evitar conflictos.

## 📦 Arquitectura Docker

### Servicios:
- **Frontend**: React + Vite + Nginx (Puerto asignado por EasyPanel)
- **Backend**: Node.js + Express (Puerto 3001 interno)
- **Redis**: Cache y Rate Limiting (Puerto 6379 interno)

### Archivos Docker:
- `Dockerfile.frontend` - Imagen del frontend
- `Dockerfile.backend` - Imagen del backend
- `docker-compose.yml` - Orquestación completa (desarrollo)
- `docker-compose.easypanel.yml` - Configuración optimizada para EasyPanel
- `.dockerignore` - Optimización de builds
- `.env.docker` - Variables de entorno template
- `.env` - Variables de entorno con valores por defecto

## 🚀 Instalación Rápida

### 1. Configurar Variables de Entorno

```bash
# Copiar template de variables
cp .env.docker .env

# Editar con tus credenciales reales
nano .env
```

### 2. Construir y Ejecutar

```bash
# Construir todas las imágenes
docker-compose build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 3. Verificar Funcionamiento

```bash
# Verificar servicios
docker-compose ps

# Verificar salud
curl http://localhost:8847
curl http://localhost:8847/api/health
```

## 🔧 Configuración para EasyPanel

### Paso 1: Subir a GitHub

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial Docker setup"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/casa-cambios.git
git push -u origin main
```

### Paso 2: Configurar en EasyPanel

1. **Crear nuevo servicio** → **Compose**
2. **Repository**: `https://github.com/damballa212/casa-cambios-docker.git`
3. **Branch**: `main`
4. **Compose File**: `docker-compose.easypanel.yml` (⚠️ Usar este archivo específico)
5. **Port**: EasyPanel asignará automáticamente un puerto disponible

### Paso 3: Variables de Entorno en EasyPanel

```env
SUPABASE_URL=https://ixvefxnycehbvipxcngv.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service
DATABASE_URL=postgresql://postgres.proyecto:password@host:5432/postgres
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres
REDIS_PASSWORD=tu_password_redis
SESSION_SECRET=tu_secreto_session_minimo_32_caracteres
```

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Reconstruir solo un servicio
docker-compose build frontend
docker-compose build backend

# Reiniciar un servicio
docker-compose restart frontend
docker-compose restart backend

# Ver logs específicos
docker-compose logs frontend
docker-compose logs backend
docker-compose logs redis
```

### Producción

```bash
# Actualizar desde GitHub
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Limpiar imágenes antiguas
docker system prune -f
docker image prune -f
```

### Debugging

```bash
# Acceder al contenedor backend
docker-compose exec backend sh

# Acceder al contenedor frontend
docker-compose exec frontend sh

# Ver estadísticas de recursos
docker stats

# Inspeccionar red
docker network inspect casa-cambios-network
```

## 📊 Monitoreo

### Health Checks

- **Frontend**: `http://localhost:8847` (cada 30s)
- **Backend**: `http://localhost:8847/api/health` (cada 30s)
- **Redis**: Ping interno (cada 30s)

### Logs

```bash
# Logs en tiempo real
docker-compose logs -f --tail=100

# Logs específicos
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50
```

### Volúmenes

- `backend_logs`: Logs del backend
- `redis_data`: Datos persistentes de Redis

## 🔒 Seguridad

### Configuraciones Aplicadas:

- **Usuario no-root** en contenedores
- **Health checks** para todos los servicios
- **Rate limiting** con Redis
- **Headers de seguridad** en Nginx
- **Compresión gzip** habilitada
- **Variables de entorno** protegidas

### Recomendaciones:

1. **Cambiar passwords por defecto**
2. **Usar secretos seguros** (mínimo 32 caracteres)
3. **Configurar HTTPS** en producción
4. **Monitorear logs** regularmente
5. **Actualizar imágenes** periódicamente

## ⚠️ Problemas Resueltos

### Conflictos de Container Names:
✅ **Solucionado**: Removidos `container_name` del docker-compose.yml
✅ **EasyPanel**: Usar `docker-compose.easypanel.yml` para evitar conflictos

### Variables de Entorno No Configuradas:
✅ **Solucionado**: Creado archivo `.env` con valores por defecto
✅ **Seguridad**: Archivo `.env` está en `.gitignore`

### Versión Obsoleta de Docker Compose:
✅ **Solucionado**: Removida línea `version: '3.8'` obsoleta

## 🚨 Troubleshooting

### Problemas Comunes:

#### Puerto 8847 ocupado
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8848:80"  # Usar otro puerto
```

#### Error de conexión a Supabase
```bash
# Verificar variables de entorno
docker-compose exec backend env | grep SUPABASE

# Probar conexión manual
docker-compose exec backend node -e "console.log(process.env.SUPABASE_URL)"
```

#### Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs backend

# Verificar configuración
docker-compose config
```

#### Problemas de memoria
```bash
# Aumentar límites en docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 📈 Optimizaciones

### Para Producción:

1. **Multi-stage builds** ya implementados
2. **Imágenes Alpine** para menor tamaño
3. **Cache de dependencias** optimizado
4. **Compresión gzip** en Nginx
5. **Health checks** configurados

### Para Desarrollo:

```bash
# Usar override para desarrollo
cp docker-compose.yml docker-compose.override.yml
# Editar override para development
```

## 🌐 URLs de Acceso

- **Dashboard**: `http://tu-dominio-easypanel.com` (puerto asignado automáticamente)
- **API Health**: `http://tu-dominio-easypanel.com/api/health`
- **API Docs**: `http://tu-dominio-easypanel.com/api`

## 📞 Soporte

Para problemas específicos de Docker:

1. Revisar logs: `docker-compose logs`
2. Verificar configuración: `docker-compose config`
3. Reiniciar servicios: `docker-compose restart`
4. Reconstruir: `docker-compose build --no-cache`

---

**🎉 ¡Tu Casa de Cambios está lista para producción con Docker!**