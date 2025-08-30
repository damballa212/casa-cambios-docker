# Configuración de Variables de Entorno para EasyPanel

## 📋 Variables Requeridas

Configura estas variables de entorno en tu aplicación de EasyPanel:

### 🗄️ Supabase Configuration
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 🐘 PostgreSQL Configuration
```
DATABASE_URL=postgresql://postgres.tu-proyecto:tu_password@aws-region.pooler.supabase.com:5432/postgres?sslmode=require
DB_HOST=aws-region.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.tu-proyecto
DB_PASSWORD=tu_password_aqui
```

### 🔐 JWT Configuration
```
JWT_SECRET=casa_cambios_jwt_secret_super_seguro_minimo_32_caracteres_2024
JWT_EXPIRES_IN=24h
```

### 🚦 Rate Limiting Configuration
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### 🛡️ Security Configuration
```
BCRYPT_ROUNDS=12
SESSION_SECRET=casa_cambios_session_secret_super_seguro_minimo_32_caracteres_2024
```

### 📊 Redis Configuration (Opcional)
```
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

## 🚀 Pasos para Configurar en EasyPanel

### 1. Crear Nuevo Proyecto
1. Ve a tu panel de EasyPanel
2. Clic en "New" para crear un nuevo proyecto
3. Proporciona un nombre para tu proyecto (ej: "casa-cambios")
4. Clic en "Create" para completar la creación

### 2. Configurar Servicio de Aplicación
1. Dentro del proyecto, clic en "+ Service"
2. Selecciona "App" como tipo de servicio
3. En la sección "Source":
   - Selecciona "Github Repository" o "Custom Git Provider"
   - Conecta tu repositorio
   - Especifica la rama (ej: main)

### 3. Configurar Build
1. Ve a la pestaña "Build"
2. Selecciona "Dockerfile" como método de build
3. **IMPORTANTE**: Especifica el archivo Docker Compose:
   - Archivo: `docker-compose.easypanel.yml`
   - O usa Dockerfile individual si prefieres servicios separados

### 4. Configurar Variables de Entorno
1. Ve a la pestaña "Environment"
2. Agrega cada variable una por una (ver lista completa arriba)
3. **NO hardcodees valores sensibles** - usa las variables de entorno

### 5. Configurar Dominio y Proxy
1. Ve a la pestaña "Domains & Proxy"
2. Agrega tu dominio personalizado
3. **CRÍTICO**: Configura el "Proxy Port" a **80** (puerto interno de Nginx)
4. EasyPanel configurará automáticamente:
   - Certificados SSL Let's Encrypt
   - Proxy reverso con Traefik
   - Balanceador de carga

### 6. Desplegar
1. Clic en "Deploy"
2. EasyPanel automáticamente:
   - Construirá las imágenes Docker
   - Desplegará los contenedores
   - Configurará el proxy
3. Monitorea los logs durante el despliegue

## 🔍 Verificación Post-Despliegue

### Health Checks
1. **Backend Health**: `https://tu-dominio.com/health`
2. **Frontend**: `https://tu-dominio.com`
3. **API Test**: `https://tu-dominio.com/api/dashboard/metrics`

### Logs a Revisar
```bash
# En EasyPanel, revisa los logs de:
- backend: Conexión a Supabase
- frontend: Build exitoso de Vite
- nginx: Configuración de proxy
```

## ⚠️ Notas Importantes

### Seguridad
- **NUNCA** hardcodees credenciales en el código
- Usa variables de entorno para todos los secretos
- Rota regularmente JWT_SECRET y SESSION_SECRET
- Mantén actualizadas las credenciales de Supabase

### Puertos
- **NO especifiques puertos** en la configuración
- EasyPanel asignará puertos automáticamente
- La comunicación interna usa nombres de servicio

### Red
- Los servicios se comunican a través de la red Docker interna
- Solo el frontend está expuesto públicamente
- El backend es accesible solo desde el frontend

## 🛠️ Troubleshooting

### Error: "Cannot connect to Supabase"
1. Verifica `SUPABASE_URL` y `SUPABASE_ANON_KEY`
2. Comprueba que Supabase esté activo
3. Revisa los logs del backend

### Error: "Database connection failed"
1. Verifica todas las variables `DB_*`
2. Comprueba que la IP del VPS esté en la whitelist de Supabase
3. Verifica la configuración de red

### Error: "Frontend no carga"
1. Verifica que el build de Vite sea exitoso
2. Comprueba los logs del contenedor frontend
3. Verifica la configuración de Nginx

### Error: "API calls fail"
1. Verifica que ambos servicios estén corriendo
2. Comprueba la configuración del proxy en nginx.conf
3. Revisa los logs de red entre servicios

## 📞 Contacto

Para soporte adicional:
- Revisa los logs detallados en EasyPanel
- Verifica la configuración paso a paso
- Contacta al equipo de desarrollo si persisten los problemas