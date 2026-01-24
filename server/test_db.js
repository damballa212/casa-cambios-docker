import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);
  
  // Test 1: Global Rate (The one used in health check)
  console.log('\n1. Testing global_rate table...');
  const { data: rate, error: rateError } = await supabase.from('global_rate').select('id').limit(1);
  
  if (rateError) {
    console.error('❌ Error accessing global_rate:', rateError.message);
    console.error('   Code:', rateError.code);
    console.error('   Hint:', rateError.hint);
  } else {
    console.log('✅ global_rate access successful');
  }

  // Test 2: Transactions
  console.log('\n2. Testing transactions table...');
  const { count, error: txError } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  
  if (txError) {
    console.error('❌ Error accessing transactions:', txError.message);
  } else {
    console.log('✅ transactions access successful. Count:', count);
  }

  // Test 3: User Sessions
  console.log('\n3. Testing user_sessions table...');
  const { error: sessionError } = await supabase.from('user_sessions').select('id').limit(1);
  
  if (sessionError) {
    console.error('❌ Error accessing user_sessions:', sessionError.message);
  } else {
    console.log('✅ user_sessions access successful');
  }
}

testConnection();
