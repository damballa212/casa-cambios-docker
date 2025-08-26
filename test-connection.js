// Script para probar la conexión con Supabase y verificar el sistema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno del servidor
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Verificando conexión con Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'No encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Credenciales de Supabase no encontradas');
  console.log('Verifica que el archivo server/.env existe y tiene las credenciales correctas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🧪 Probando conexión...');
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('global_rate')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error conectando con Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    console.log('📊 Datos de prueba:', data);
    
    // Verificar tablas principales
    console.log('\n🔍 Verificando tablas...');
    
    const tables = ['global_rate', 'collaborators', 'clients', 'transactions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK (${data?.length || 0} registros encontrados)`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: Error - ${err.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error general:', error.message);
    return false;
  }
}

async function testAPI() {
  try {
    console.log('\n🌐 Probando API Backend...');
    
    const response = await fetch('http://localhost:3001/health');
    
    if (!response.ok) {
      console.log('❌ API Backend no responde');
      return false;
    }
    
    const health = await response.json();
    console.log('✅ API Backend funcionando:', health);
    
    // Probar endpoint de métricas
    const metricsResponse = await fetch('http://localhost:3001/api/dashboard/metrics');
    
    if (metricsResponse.ok) {
      const metrics = await metricsResponse.json();
      console.log('✅ Métricas del dashboard:', metrics);
    } else {
      console.log('⚠️  Endpoint de métricas no disponible');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error probando API:', error.message);
    console.log('💡 Asegúrate de que el backend esté ejecutándose: cd server && npm start');
    return false;
  }
}

async function main() {
  console.log('🚀 Casa de Cambios - Test de Conexión\n');
  
  const dbOk = await testConnection();
  const apiOk = await testAPI();
  
  console.log('\n📋 Resumen:');
  console.log(`Database: ${dbOk ? '✅ OK' : '❌ Error'}`);
  console.log(`API Backend: ${apiOk ? '✅ OK' : '❌ Error'}`);
  
  if (dbOk && apiOk) {
    console.log('\n🎉 ¡Sistema listo para usar!');
    console.log('🌐 Frontend: http://localhost:5173');
    console.log('🔧 Backend: http://localhost:3001');
    console.log('📊 Health: http://localhost:3001/health');
  } else {
    console.log('\n⚠️  Hay problemas que necesitan resolverse.');
    console.log('📖 Consulta el README.md para más información.');
  }
}

main().catch(console.error);