// Script para exportar datos de Supabase a archivos JSON
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas a exportar
const tables = [
  'global_rate',
  'collaborators', 
  'clients',
  'transactions'
];

async function exportTable(tableName) {
  try {
    console.log(`📊 Exportando tabla: ${tableName}`);
    
    // Obtener todos los datos de la tabla
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error exportando ${tableName}:`, error.message);
      return null;
    }
    
    console.log(`✅ ${tableName}: ${data?.length || 0} registros exportados`);
    return data;
    
  } catch (err) {
    console.error(`❌ Error inesperado en ${tableName}:`, err.message);
    return null;
  }
}

async function getTableSchema(tableName) {
  try {
    // Obtener esquema de la tabla usando información del sistema
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: tableName })
      .single();
    
    if (error) {
      console.log(`⚠️ No se pudo obtener esquema de ${tableName}:`, error.message);
      return null;
    }
    
    return data;
  } catch (err) {
    console.log(`⚠️ Error obteniendo esquema de ${tableName}:`, err.message);
    return null;
  }
}

async function exportDatabase() {
  console.log('🚀 Iniciando exportación de base de datos Supabase...');
  console.log(`📡 Conectando a: ${supabaseUrl}`);
  
  // Crear directorio de exportación
  const exportDir = path.join(process.cwd(), 'database-export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  const exportData = {
    timestamp: new Date().toISOString(),
    source: {
      url: supabaseUrl,
      exported_by: 'Casa de Cambios Export Script'
    },
    tables: {}
  };
  
  // Exportar cada tabla
  for (const tableName of tables) {
    const tableData = await exportTable(tableName);
    const tableSchema = await getTableSchema(tableName);
    
    exportData.tables[tableName] = {
      schema: tableSchema,
      data: tableData,
      count: tableData?.length || 0
    };
    
    // Guardar archivo individual por tabla
    const tableFile = path.join(exportDir, `${tableName}.json`);
    fs.writeFileSync(tableFile, JSON.stringify({
      table: tableName,
      schema: tableSchema,
      data: tableData,
      exported_at: new Date().toISOString()
    }, null, 2));
    
    console.log(`💾 Guardado: ${tableFile}`);
  }
  
  // Guardar archivo completo
  const fullExportFile = path.join(exportDir, 'full-database-export.json');
  fs.writeFileSync(fullExportFile, JSON.stringify(exportData, null, 2));
  
  // Crear script SQL de migración
  await createMigrationScript(exportData, exportDir);
  
  console.log('\n✅ Exportación completada!');
  console.log(`📁 Archivos guardados en: ${exportDir}`);
  console.log('\n📋 Archivos generados:');
  console.log('  - full-database-export.json (exportación completa)');
  tables.forEach(table => {
    console.log(`  - ${table}.json (tabla individual)`);
  });
  console.log('  - migration.sql (script de migración)');
  console.log('  - README.md (instrucciones)');
}

async function createMigrationScript(exportData, exportDir) {
  let sqlScript = `-- Script de migración generado automáticamente\n`;
  sqlScript += `-- Fecha: ${new Date().toISOString()}\n`;
  sqlScript += `-- Fuente: ${exportData.source.url}\n\n`;
  
  // Crear tablas (estructura básica)
  for (const [tableName, tableInfo] of Object.entries(exportData.tables)) {
    if (!tableInfo.data || tableInfo.data.length === 0) continue;
    
    sqlScript += `-- Tabla: ${tableName}\n`;
    sqlScript += `DROP TABLE IF EXISTS ${tableName};\n`;
    
    // Inferir estructura de la primera fila
    const firstRow = tableInfo.data[0];
    const columns = Object.keys(firstRow).map(key => {
      const value = firstRow[key];
      let type = 'TEXT';
      
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
      } else if (typeof value === 'boolean') {
        type = 'BOOLEAN';
      } else if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        type = 'TIMESTAMP';
      }
      
      return `  ${key} ${type}`;
    }).join(',\n');
    
    sqlScript += `CREATE TABLE ${tableName} (\n${columns}\n);\n\n`;
    
    // Insertar datos
    for (const row of tableInfo.data) {
      const values = Object.values(row).map(val => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val;
      }).join(', ');
      
      sqlScript += `INSERT INTO ${tableName} VALUES (${values});\n`;
    }
    
    sqlScript += '\n';
  }
  
  const sqlFile = path.join(exportDir, 'migration.sql');
  fs.writeFileSync(sqlFile, sqlScript);
  
  // Crear README con instrucciones
  const readme = `# Exportación de Base de Datos Casa de Cambios

## Información de la Exportación
- **Fecha**: ${exportData.timestamp}
- **Fuente**: ${exportData.source.url}
- **Tablas exportadas**: ${Object.keys(exportData.tables).length}

## Archivos Incluidos

### Datos JSON
- \`full-database-export.json\`: Exportación completa con metadatos
${tables.map(table => `- \`${table}.json\`: Datos de la tabla ${table}`).join('\n')}

### Script SQL
- \`migration.sql\`: Script para recrear las tablas e insertar datos

## Instrucciones de Migración

### Para PostgreSQL
\`\`\`bash
psql -h tu-nuevo-host -U tu-usuario -d tu-database -f migration.sql
\`\`\`

### Para MySQL
\`\`\`bash
mysql -h tu-nuevo-host -u tu-usuario -p tu-database < migration.sql
\`\`\`

### Para SQLite
\`\`\`bash
sqlite3 tu-database.db < migration.sql
\`\`\`

## Resumen de Datos
${Object.entries(exportData.tables).map(([name, info]) => `- **${name}**: ${info.count} registros`).join('\n')}

## Notas Importantes
- Revisa y ajusta los tipos de datos según tu nuevo proveedor
- Verifica las claves primarias y índices
- Considera las restricciones de integridad referencial
- Prueba la migración en un entorno de desarrollo primero
`;
  
  const readmeFile = path.join(exportDir, 'README.md');
  fs.writeFileSync(readmeFile, readme);
}

// Ejecutar exportación
exportDatabase().catch(console.error);