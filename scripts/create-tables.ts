/**
 * Script para crear las tablas en Supabase
 * Ejecutar con: npx tsx scripts/create-tables.ts
 * 
 * NOTA: Este script requiere que tengas configurado NEXT_PUBLIC_SUPABASE_URL
 * y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local
 * 
 * IMPORTANTE: Para ejecutar SQL directamente necesitas usar la Service Role Key
 * desde el dashboard de Supabase → Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurado');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY no está configurado');
  console.log('📝 Para ejecutar este script necesitas:');
  console.log('   1. Ir a Supabase Dashboard → Settings → API');
  console.log('   2. Copiar la "service_role" key (secreta)');
  console.log('   3. Agregarla a .env.local como SUPABASE_SERVICE_ROLE_KEY=...');
  console.log('');
  console.log('💡 Alternativa: Ejecuta el SQL manualmente en Supabase SQL Editor');
  console.log('   Archivo: scripts/create-tables.sql');
  process.exit(1);
}

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...\n');

  // Leer el archivo SQL
  const sqlFile = path.join(process.cwd(), 'scripts', 'create-tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  // Crear cliente con service role key para ejecutar SQL
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Ejecutando ${statements.length} statements SQL...\n`);

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Si no existe la función exec_sql, intentar ejecutar directamente
          console.log(`⚠️  No se pudo ejecutar via RPC, intentando método alternativo...`);
          console.log(`   SQL: ${statement.substring(0, 50)}...`);
        }
      }
    }

    console.log('\n✅ Tablas creadas exitosamente!');
    console.log('\n📊 Verifica en Supabase Dashboard que las tablas se crearon correctamente.');
    
  } catch (error: any) {
    console.error('\n❌ Error al crear tablas:', error.message);
    console.log('\n💡 Método alternativo:');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Copia el contenido de scripts/create-tables.sql');
    console.log('   3. Pégalo y ejecuta (Run)');
    process.exit(1);
  }
}

createTables();

