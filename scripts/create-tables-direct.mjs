#!/usr/bin/env node
/**
 * Script para crear las tablas en Supabase directamente usando la API REST
 * 
 * Requiere: SUPABASE_SERVICE_ROLE_KEY en .env.local
 * 
 * Para obtener la service role key:
 * 1. Ve a Supabase Dashboard → Settings → API
 * 2. Copia la "service_role" key (secreta, no la anon key)
 * 3. Agregala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui
 * 
 * Uso: node scripts/create-tables-direct.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Leer .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    return env;
  } catch {
    return {};
  }
}

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...\n');

  const env = loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  // Leer el archivo SQL
  const sqlFile = join(process.cwd(), 'scripts', 'create-tables.sql');
  const sql = readFileSync(sqlFile, 'utf-8');

  if (!supabaseServiceKey) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY no está configurado\n');
    console.log('📝 Para ejecutar automáticamente necesitas la service role key:');
    console.log('   1. Ve a Supabase Dashboard → Settings → API');
    console.log('   2. Copia la "service_role" key (secreta)');
    console.log('   3. Agregala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui\n');
    console.log('💡 Método alternativo (más fácil):');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Copia el contenido de scripts/create-tables.sql');
    console.log('   3. Pégalo y ejecuta (Run)\n');
    console.log('📄 SQL:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    process.exit(0);
  }

  try {
    // Ejecutar SQL usando la API REST de Supabase
    // Usar el endpoint de PostgREST para ejecutar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      // Si no existe la función exec_sql, intentar método alternativo
      console.log('⚠️  No se puede ejecutar SQL directamente vía API');
      console.log('📝 Ejecuta el SQL manualmente:\n');
      console.log('   1. Ve a Supabase Dashboard → SQL Editor');
      console.log('   2. Copia el contenido de scripts/create-tables.sql');
      console.log('   3. Pégalo y ejecuta (Run)\n');
      console.log('📄 SQL:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      process.exit(0);
    }

    const result = await response.json();
    console.log('✅ Tablas creadas exitosamente!\n');
    console.log('📊 Verifica en Supabase Dashboard que las tablas se crearon correctamente.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Ejecuta el SQL manualmente en Supabase SQL Editor');
    console.log('   Archivo: scripts/create-tables.sql\n');
    console.log('📄 SQL:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    process.exit(1);
  }
}

createTables();

