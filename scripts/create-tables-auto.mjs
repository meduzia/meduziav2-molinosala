import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para crear las tablas en Supabase
 * Ejecuta: node scripts/create-tables-auto.mjs
 */

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...\n');

  // Leer .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configurados');
    process.exit(1);
  }

  // Leer el archivo SQL
  const sqlFile = path.join(process.cwd(), 'scripts', 'create-tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  // Crear cliente de Supabase
  const supabase = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('📋 Intentando crear tablas...\n');

    // Método 1: Intentar verificar si las tablas existen
    // Si no existen, mostrar instrucciones para crearlas manualmente
    const { data: checkData, error: checkError } = await supabase
      .from('ads_performance')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('⚠️  Las tablas no existen aún.\n');
      
      if (!supabaseServiceKey) {
        console.log('📝 Para crear las tablas automáticamente, necesitas la service role key:');
        console.log('   1. Ve a Supabase Dashboard → Settings → API');
        console.log('   2. Copia la "service_role" key (secreta)');
        console.log('   3. Agregala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui');
        console.log('   4. Ejecuta este script nuevamente\n');
      }
      
      console.log('💡 Método manual (recomendado):');
      console.log('   1. Ve a Supabase Dashboard → SQL Editor');
      console.log('   2. Copia el contenido de scripts/create-tables.sql');
      console.log('   3. Pégalo y ejecuta (Run)\n');
      
      console.log('📄 SQL:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      
      // Intentar ejecutar el SQL usando fetch directamente
      if (supabaseServiceKey) {
        console.log('\n🔄 Intentando ejecutar SQL automáticamente...\n');
        
        try {
          // Usar la API REST de Supabase para ejecutar SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: sql })
          });

          if (response.ok) {
            console.log('✅ Tablas creadas exitosamente!\n');
            return;
          } else {
            const errorText = await response.text();
            console.log('⚠️  No se pudo ejecutar automáticamente vía API');
            console.log('   Error:', errorText.substring(0, 100));
            console.log('\n📝 Ejecuta el SQL manualmente en Supabase SQL Editor\n');
          }
        } catch (fetchError) {
          console.log('⚠️  Error al ejecutar automáticamente:', fetchError.message);
          console.log('📝 Ejecuta el SQL manualmente en Supabase SQL Editor\n');
        }
      }
      
      process.exit(0);
    } else {
      console.log('✅ Las tablas ya existen!\n');
      console.log('📊 Verifica en Supabase Dashboard que las tablas estén correctas.');
      return;
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Ejecuta el SQL manualmente en Supabase SQL Editor');
    console.log('   Archivo: scripts/create-tables.sql');
    process.exit(1);
  }
}

createTables();

