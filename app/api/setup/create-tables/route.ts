import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint para crear las tablas en Supabase ejecutando SQL directamente
 * POST /api/setup/create-tables
 */

const SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ads_performance table
CREATE TABLE IF NOT EXISTS ads_performance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL UNIQUE,
  ad_name text NOT NULL,
  campaign_name text,
  destination text,
  angle text,
  format text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  cpa numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS ads_performance_date_idx ON ads_performance(date);
CREATE INDEX IF NOT EXISTS ads_performance_destination_idx ON ads_performance(destination);

-- creatives table
CREATE TABLE IF NOT EXISTS creatives (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  angle text,
  destination text,
  format text,
  campaign text,
  status text DEFAULT 'draft',
  notes text,
  status_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS creatives_status_idx ON creatives(status);
CREATE INDEX IF NOT EXISTS creatives_created_at_idx ON creatives(created_at);
`;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL no está configurado' },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: 'Para crear las tablas automáticamente, necesitas configurar SUPABASE_SERVICE_ROLE_KEY',
        instructions: [
          '1. Ve a Supabase Dashboard → Settings → API',
          '2. Copia la "service_role" key (secreta)',
          '3. Agregala a .env.local como: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui',
          '4. Reinicia el servidor',
          '5. Vuelve a ejecutar este endpoint',
          '',
          'O ejecuta el SQL manualmente en Supabase SQL Editor:',
          'Archivo: scripts/create-tables.sql'
        ],
        sql: SQL
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Intentar ejecutar el SQL usando RPC
    // Nota: Esto requiere que Supabase tenga una función exec_sql configurada
    // Si no funciona, devolver instrucciones para ejecutar manualmente
    
    try {
      // Dividir SQL en statements individuales
      const statements = SQL.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      const results = [];
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // Intentar ejecutar via RPC (requiere función especial en Supabase)
            const { error } = await supabase.rpc('exec_sql', { 
              sql_query: statement + ';' 
            });
            
            if (error) {
              // Si no funciona, devolver instrucciones
              return NextResponse.json({
                success: false,
                message: 'No se puede ejecutar SQL automáticamente vía API',
                instructions: [
                  'Ejecuta el SQL manualmente en Supabase SQL Editor:',
                  '1. Ve a: https://supabase.com/dashboard/project/dpryglpgvcccyofgwmks/sql/new',
                  '2. Copia el SQL de abajo',
                  '3. Pégalo y ejecuta (Run)'
                ],
                sql: SQL
              });
            }
            
            results.push({ statement: statement.substring(0, 50), success: true });
          } catch (err: any) {
            return NextResponse.json({
              success: false,
              message: 'Error al ejecutar SQL',
              error: err.message,
              instructions: [
                'Ejecuta el SQL manualmente en Supabase SQL Editor',
                'Archivo: scripts/create-tables.sql'
              ],
              sql: SQL
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Tablas creadas exitosamente',
        results
      });

    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: 'Error al crear tablas',
        error: error.message,
        instructions: [
          'Ejecuta el SQL manualmente en Supabase SQL Editor',
          'Archivo: scripts/create-tables.sql'
        ],
        sql: SQL
      });
    }

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message,
        instructions: 'Ejecuta el SQL manualmente en Supabase SQL Editor. Archivo: scripts/create-tables.sql'
      },
      { status: 500 }
    );
  }
}
