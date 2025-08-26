# Exportación de Base de Datos Casa de Cambios

## Información de la Exportación
- **Fecha**: 2025-08-26T02:12:30.215Z
- **Fuente**: https://ixvefxnycehbvipxcngv.supabase.co
- **Tablas exportadas**: 4

## Archivos Incluidos

### Datos JSON
- `full-database-export.json`: Exportación completa con metadatos
- `global_rate.json`: Datos de la tabla global_rate
- `collaborators.json`: Datos de la tabla collaborators
- `clients.json`: Datos de la tabla clients
- `transactions.json`: Datos de la tabla transactions

### Script SQL
- `migration.sql`: Script para recrear las tablas e insertar datos

## Instrucciones de Migración

### Para PostgreSQL
```bash
psql -h tu-nuevo-host -U tu-usuario -d tu-database -f migration.sql
```

### Para MySQL
```bash
mysql -h tu-nuevo-host -u tu-usuario -p tu-database < migration.sql
```

### Para SQLite
```bash
sqlite3 tu-database.db < migration.sql
```

## Resumen de Datos
- **global_rate**: 21 registros
- **collaborators**: 5 registros
- **clients**: 9 registros
- **transactions**: 23 registros

## Notas Importantes
- Revisa y ajusta los tipos de datos según tu nuevo proveedor
- Verifica las claves primarias y índices
- Considera las restricciones de integridad referencial
- Prueba la migración en un entorno de desarrollo primero
