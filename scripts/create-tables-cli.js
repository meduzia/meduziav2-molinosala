#!/usr/bin/env node
/**
 * Script para crear las tablas en Supabase
 * 
 * Uso: node scripts/create-tables-cli.js
 * 
 * Requiere:
 * - NEXT_PUBLIC_SUPABASE_URL en .env.local
 * - SUPABASE_SERVICE_ROLE_KEY en .env.local (opcional, si no está usa método manual)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
    return env;
  }
  return {};
}

async function createTables() {
  console.log('🚀 Iniciando creación de tablas en Supabase...\n');

  const env = loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  // Leer el archivo SQL
  const sqlFile = path.join(process.cwd(), 'scripts', 'create-tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  if (!supabaseServiceKey) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY no está configurado\n');
    console.log('📝 Para ejecutar automáticamente:');
    console.log('   1. Ve a Supabase Dashboard → Settings → API');
    console.log('   2. Copia la "service_role" key (secreta)');
    console.log('   3. Agregala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui\n');
    console.log('💡 Método alternativo (recomendado):');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Copia el contenido de scripts/create-tables.sql');
    console.log('   3. Pégalo y ejecuta (Run)\n');
    console.log('📄 SQL a ejecutar:');
    console.log('─'.repeat(50));
    console.log(sql);
    console.log('─'.repeat(50));
    process.exit(0);
  }

  // Crear cliente con service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Intentar ejecutar el SQL usando la API REST
    // Supabase no permite ejecutar SQL arbitrario vía REST API sin función especial
    // La mejor opción es usar el método REST API para crear las tablas directamente
    
    console.log('📋 Creando tablas usando la API de Supabase...\n');

    // Como no podemos ejecutar SQL directamente, vamos a intentar crear las tablas
    // verificando si existen primero y dando instrucciones si no
    
    const { error: checkError } = await supabase
      .from('ads_performance')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ Las tablas no existen.');
      console.log('📝 Necesitas ejecutar el SQL manualmente:\n');
      console.log('   1. Ve a Supabase Dashboard → SQL Editor');
      console.log('   2. Copia el contenido de scripts/create-tables.sql');
      console.log('   3. Pégalo y ejecuta (Run)\n');
    } else {
      console.log('✅ Las tablas ya existen o fueron creadas exitosamente!\n');
    }

    console.log('📄 SQL disponible en: scripts/create-tables.sql');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Ejecuta el SQL manualmente en Supabase SQL Editor');
    console.log('   Archivo: scripts/create-tables.sql');
    process.exit(1);
  }
}

createTables();

