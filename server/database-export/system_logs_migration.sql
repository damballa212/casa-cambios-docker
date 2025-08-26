-- Migración para tabla de logs del sistema
-- Ejecutar en Supabase para habilitar logging desde n8n

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(20) NOT NULL CHECK (level IN ('success', 'error', 'warning', 'info')),
  component VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  workflow_id VARCHAR(50),
  execution_id VARCHAR(50),
  chat_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_workflow_id ON system_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_chat_id ON system_logs(chat_id);

-- Política de retención: eliminar logs más antiguos de 30 días
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM system_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE system_logs IS 'Logs del sistema incluyendo logs de n8n workflow';
COMMENT ON COLUMN system_logs.level IS 'Nivel del log: success, error, warning, info';
COMMENT ON COLUMN system_logs.component IS 'Componente que generó el log: n8n, Sistema, API, etc.';
COMMENT ON COLUMN system_logs.details IS 'Información adicional en formato JSON';
COMMENT ON COLUMN system_logs.workflow_id IS 'ID del workflow de n8n que generó el log';
COMMENT ON COLUMN system_logs.execution_id IS 'ID de ejecución específica del workflow';
COMMENT ON COLUMN system_logs.chat_id IS 'ID del chat de WhatsApp relacionado';

-- Insertar algunos logs de ejemplo para testing
INSERT INTO system_logs (level, component, message, details) VALUES
('info', 'Sistema', 'Tabla system_logs creada exitosamente', '{"migration": "initial_setup"}'),
('success', 'Migración', 'Base de datos preparada para logging de n8n', '{"tables_created": ["system_logs"], "indexes_created": 5}');

-- Mostrar confirmación
SELECT 'Migración completada exitosamente' as status, COUNT(*) as logs_count FROM system_logs;