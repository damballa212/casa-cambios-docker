# 🔧 Configuración de Variables de Entorno en EasyPanel

## ⚠️ IMPORTANTE

Las variables de entorno deben configurarse directamente en EasyPanel, no se leen automáticamente del archivo `.env` del repositorio.

## 📋 Variables Requeridas para EasyPanel

Copia y pega estas variables en la sección **Environment Variables** de tu servicio en EasyPanel:

### 🔑 Variables Obligatorias (DEBES CAMBIAR ESTOS VALORES)

```env
SUPABASE_URL=https://ixvefxnycehbvipxcngv.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon_real_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_real_aqui
DATABASE_URL=postgresql://postgres.proyecto:tu_password@host:5432/postgres
DB_HOST=tu_host_supabase.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.proyecto
DB_PASSWORD=tu_password_real
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres_muy_seguro_2024
SESSION_SECRET=tu_secreto_session_minimo_32_caracteres_muy_seguro_2024
```

### 🔧 Variables Opcionales (Puedes usar estos valores)

```env
NODE_ENV=production
PORT=3001
JWT_EXPIRES_IN=24h
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=casa_cambios_redis_password_2024
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
LOG_LEVEL=info
LOG_FORMAT=combined
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 🚀 Pasos para Configurar en EasyPanel

### 1. Acceder a tu Servicio
- Ve a tu proyecto en EasyPanel
- Selecciona el servicio "casa-cambios"
- Ve a la pestaña **Settings** o **Environment**

### 2. Agregar Variables de Entorno
- Busca la sección **Environment Variables**
- Agrega cada variable una por una:
  - **Key**: Nombre de la variable (ej: `SUPABASE_URL`)
  - **Value**: Valor de la variable (ej: `https://ixvefxnycehbvipxcngv.supabase.co`)

### 3. Obtener Credenciales Reales de Supabase

#### Para SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** → **API**
3. Copia:
   - **anon public**: Para `SUPABASE_ANON_KEY`
   - **service_role**: Para `SUPABASE_SERVICE_ROLE_KEY`

#### Para DATABASE_URL y credenciales DB:
1. En Supabase, ve a **Settings** → **Database**
2. Busca **Connection string**
3. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 4. Generar Secretos Seguros

#### Para JWT_SECRET y SESSION_SECRET:
```bash
# Genera secretos seguros de 32+ caracteres
openssl rand -base64 32
```

O usa este generador online: https://generate-secret.vercel.app/32

### 5. Reiniciar el Servicio
- Después de agregar todas las variables
- Haz clic en **Deploy** o **Restart**
- Espera a que el servicio se reinicie

## ✅ Verificación

Después de configurar las variables:

1. **Verifica que no hay warnings**:
   - Ve a los logs del servicio
   - No deberías ver más mensajes de "variable is not set"

2. **Prueba la aplicación**:
   - Accede a tu dominio de EasyPanel
   - Verifica que el login funciona
   - Comprueba que se conecta a Supabase

## 🚨 Troubleshooting

### Si sigues viendo warnings:
1. **Verifica que escribiste correctamente** los nombres de las variables
2. **Reinicia el servicio** después de agregar variables
3. **Revisa los logs** para errores específicos

### Si la aplicación no funciona:
1. **Verifica las credenciales de Supabase** en el dashboard
2. **Comprueba la conectividad** de la base de datos
3. **Revisa que los secretos** tengan al menos 32 caracteres

## 📞 Soporte

Si necesitas ayuda:
1. Verifica que todas las variables estén configuradas
2. Revisa los logs del servicio en EasyPanel
3. Comprueba la conectividad con Supabase

---

**🎯 Una vez configuradas todas las variables, tu aplicación Casa de Cambios funcionará perfectamente en EasyPanel!**