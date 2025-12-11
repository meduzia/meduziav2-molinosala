-- Tabla insights para insights_summarizer workflow
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  insight_type text NOT NULL CHECK (insight_type IN ('winner', 'anomaly', 'opportunity')),
  entity_type text CHECK (entity_type IN ('ad', 'ad_set', 'campaign')),
  entity_id text,
  entity_name text,
  metric text,
  value numeric(10,2),
  threshold numeric(10,2),
  change_percentage numeric(5,2),
  reasoning text,
  evidence jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  anomaly_type text CHECK (anomaly_type IN ('ctr_fatigue', 'cpa_above_target')),
  opportunity_type text CHECK (opportunity_type IN ('winning_angle', 'underperforming_ad_set')),
  angle text,
  recommendation text,
  potential_impact text,
  generated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para insights
CREATE INDEX IF NOT EXISTS insights_type_idx ON insights(insight_type);
CREATE INDEX IF NOT EXISTS insights_entity_type_idx ON insights(entity_type);
CREATE INDEX IF NOT EXISTS insights_priority_idx ON insights(priority);
CREATE INDEX IF NOT EXISTS insights_generated_at_idx ON insights(generated_at DESC);
CREATE INDEX IF NOT EXISTS insights_created_at_idx ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS insights_angle_idx ON insights(angle) WHERE angle IS NOT NULL;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_insights_updated_at 
BEFORE UPDATE ON insights
FOR EACH ROW EXECUTE FUNCTION update_insights_updated_at();

-- Vista útil: Últimos insights por tipo
CREATE OR REPLACE VIEW v_recent_insights AS
SELECT 
  insight_type,
  entity_type,
  entity_name,
  metric,
  value,
  priority,
  reasoning,
  generated_at
FROM insights
WHERE generated_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY 
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  generated_at DESC;

-- Vista útil: Anomalías críticas
CREATE OR REPLACE VIEW v_critical_anomalies AS
SELECT 
  id,
  anomaly_type,
  entity_type,
  entity_name,
  metric,
  value,
  threshold,
  change_percentage,
  reasoning,
  generated_at
FROM insights
WHERE insight_type = 'anomaly'
  AND priority = 'high'
  AND generated_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY generated_at DESC;

-- Vista útil: Ángulos ganadores
CREATE OR REPLACE VIEW v_winning_angles AS
SELECT 
  angle,
  COUNT(*) as insight_count,
  MAX(generated_at) as last_seen,
  AVG(value) as avg_value
FROM insights
WHERE insight_type = 'opportunity'
  AND opportunity_type = 'winning_angle'
  AND angle IS NOT NULL
  AND generated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY angle
ORDER BY insight_count DESC, avg_value DESC;

