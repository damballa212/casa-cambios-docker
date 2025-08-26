// Script para verificar la conexión directa a PostgreSQL y explorar las tablas
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

// Cargar variables de entorno
dotenv.config({ path: './.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Conectando a PostgreSQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    await client.connect();
    console.log('✅ Conexión exitosa!');
    
    // Listar todas las tablas
    console.log('\n📋 Listando tablas disponibles...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tablas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar cada tabla que esperamos
    const expectedTables = ['global_rate', 'collaborators', 'clients', 'transactions'];
    
    console.log('\n🔍 Verificando tablas esperadas...');
    for (const tableName of expectedTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} registros`);
        
        // Mostrar estructura de la tabla
        const structure = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position;
        `, [tableName]);
        
        console.log(`   Columnas:`);
        structure.rows.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type})`);
        });
        
      } catch (err) {
        console.log(`❌ ${tableName}: No existe o error - ${err.message}`);
      }
    }
    
    // Probar una consulta simple
    console.log('\n🧪 Probando consulta de ejemplo...');
    try {
      const testResult = await client.query('SELECT NOW() as current_time');
      console.log(`✅ Consulta exitosa: ${testResult.rows[0].current_time}`);
    } catch (err) {
      console.log(`❌ Error en consulta: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    await client.end();
    console.log('\n🔚 Conexión cerrada.');
  }
}

checkDatabase().catch(console.error);