-- Tabla para guardar patrones detectados en ads
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- patterns table (patrones detectados en análisis de ads)
CREATE TABLE IF NOT EXISTS patterns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_iso text,
  analysis_date date NOT NULL DEFAULT CURRENT_DATE,
  recurring_patterns_top jsonb DEFAULT '{}'::jsonb,
  recurring_patterns_bottom jsonb DEFAULT '{}'::jsonb,
  hypothesized_drivers jsonb DEFAULT '{}'::jsonb,
  top10_ads jsonb DEFAULT '[]'::jsonb,
  bottom10_ads jsonb DEFAULT '[]'::jsonb,
  model_used text DEFAULT 'gpt-4o-mini',
  analysis_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para patterns
CREATE INDEX IF NOT EXISTS patterns_week_iso_idx ON patterns(week_iso DESC);
CREATE INDEX IF NOT EXISTS patterns_analysis_date_idx ON patterns(analysis_date DESC);
CREATE INDEX IF NOT EXISTS patterns_created_at_idx ON patterns(created_at DESC);

-- Vista útil: Últimos patrones detectados
CREATE OR REPLACE VIEW v_latest_patterns AS
SELECT 
  id,
  week_iso,
  analysis_date,
  recurring_patterns_top,
  recurring_patterns_bottom,
  hypothesized_drivers,
  created_at
FROM patterns
ORDER BY analysis_date DESC, created_at DESC
LIMIT 10;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_patterns_updated_at 
BEFORE UPDATE ON patterns
FOR EACH ROW EXECUTE FUNCTION update_patterns_updated_at();

