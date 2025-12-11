-- Tabla para guardar clasificaciones de ads
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- classifications table (clasificaciones creativas de ads)
CREATE TABLE IF NOT EXISTS classifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL,
  ad_name text,
  creative_url text,
  permalink_url text,
  content_type text,
  emotional_appeal text,
  target_audience text,
  callouts jsonb DEFAULT '[]'::jsonb,
  creative_approach text,
  cta_strength text,
  classification_metadata jsonb DEFAULT '{}'::jsonb,
  model_used text DEFAULT 'gpt-4o-mini',
  confidence_score numeric(3,2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para classifications
CREATE INDEX IF NOT EXISTS classifications_ad_id_idx ON classifications(ad_id);
CREATE INDEX IF NOT EXISTS classifications_content_type_idx ON classifications(content_type) WHERE content_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS classifications_emotional_appeal_idx ON classifications(emotional_appeal) WHERE emotional_appeal IS NOT NULL;
CREATE INDEX IF NOT EXISTS classifications_creative_approach_idx ON classifications(creative_approach) WHERE creative_approach IS NOT NULL;
CREATE INDEX IF NOT EXISTS classifications_cta_strength_idx ON classifications(cta_strength) WHERE cta_strength IS NOT NULL;
CREATE INDEX IF NOT EXISTS classifications_created_at_idx ON classifications(created_at DESC);

-- Índice único para evitar duplicados (un ad_id solo puede tener una clasificación reciente)
CREATE UNIQUE INDEX IF NOT EXISTS classifications_ad_id_unique 
ON classifications(ad_id);

-- Vista útil: Clasificaciones recientes con métricas
CREATE OR REPLACE VIEW v_classifications_with_metrics AS
SELECT 
  c.id,
  c.ad_id,
  c.ad_name,
  c.creative_url,
  c.content_type,
  c.emotional_appeal,
  c.target_audience,
  c.callouts,
  c.creative_approach,
  c.cta_strength,
  c.confidence_score,
  AVG(m.ctr) as avg_ctr,
  AVG(m.roas) as avg_roas,
  AVG(m.cpa) as avg_cpa,
  SUM(m.impressions) as total_impressions,
  SUM(m.clicks) as total_clicks,
  SUM(m.spend) as total_spend,
  c.created_at
FROM classifications c
LEFT JOIN metrics_daily m ON c.ad_id = m.ad_id
WHERE m.date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY c.id, c.ad_id, c.ad_name, c.creative_url, c.content_type, 
         c.emotional_appeal, c.target_audience, c.callouts, 
         c.creative_approach, c.cta_strength, c.confidence_score, c.created_at
ORDER BY c.created_at DESC;

-- Vista útil: Distribución de clasificaciones
CREATE OR REPLACE VIEW v_classification_distribution AS
SELECT 
  content_type,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM classifications
WHERE content_type IS NOT NULL
GROUP BY content_type
ORDER BY count DESC;

CREATE OR REPLACE VIEW v_emotional_appeal_distribution AS
SELECT 
  emotional_appeal,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM classifications
WHERE emotional_appeal IS NOT NULL
GROUP BY emotional_appeal
ORDER BY count DESC;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_classifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_classifications_updated_at 
BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION update_classifications_updated_at();

