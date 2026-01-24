-- SQL para corregir el error: Could not find the 'user_id' column of 'system_logs'
-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase

-- 1. Agregar la columna user_id si no existe
ALTER TABLE system_logs 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Agregar la columna details si no existe (por si acaso también falta)
ALTER TABLE system_logs 
ADD COLUMN IF NOT EXISTS details JSONB;

-- 3. Crear índice para mejorar el rendimiento de búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- 4. Opcional: Asegurar que otras columnas necesarias existan
ALTER TABLE system_logs 
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS component TEXT,
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Confirmación
SELECT 'Corrección aplicada exitosamente' as status;
