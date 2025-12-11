-- Tabla para guardar briefs creativos generados
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- briefs table (briefs creativos generados)
CREATE TABLE IF NOT EXISTS briefs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  concept_name text NOT NULL,
  creative_theme text NOT NULL,
  core_message text NOT NULL,
  hook_variations jsonb DEFAULT '[]'::jsonb,
  visual_treatment jsonb DEFAULT '{}'::jsonb,
  ctas jsonb DEFAULT '[]'::jsonb,
  performance_predictions jsonb DEFAULT '{}'::jsonb,
  patterns_json jsonb DEFAULT '{}'::jsonb,
  product_page_summary text,
  historical_learnings text,
  model_used text DEFAULT 'gpt-4o-mini',
  brief_metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_production', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para briefs
CREATE INDEX IF NOT EXISTS briefs_concept_name_idx ON briefs(concept_name);
CREATE INDEX IF NOT EXISTS briefs_creative_theme_idx ON briefs(creative_theme);
CREATE INDEX IF NOT EXISTS briefs_status_idx ON briefs(status);
CREATE INDEX IF NOT EXISTS briefs_created_at_idx ON briefs(created_at DESC);

-- Vista útil: Briefs recientes
CREATE OR REPLACE VIEW v_latest_briefs AS
SELECT 
  id,
  concept_name,
  creative_theme,
  core_message,
  hook_variations,
  visual_treatment,
  ctas,
  performance_predictions,
  status,
  created_at
FROM briefs
ORDER BY created_at DESC
LIMIT 20;

-- Vista útil: Briefs por status
CREATE OR REPLACE VIEW v_briefs_by_status AS
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM briefs
GROUP BY status
ORDER BY count DESC;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_briefs_updated_at 
BEFORE UPDATE ON briefs
FOR EACH ROW EXECUTE FUNCTION update_briefs_updated_at();

