-- Tabla para guardar snapshots semanales de rankings de ads
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ad_rankings table (snapshots semanales de rankings)
CREATE TABLE IF NOT EXISTS ad_rankings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_iso text NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  ranking_type text NOT NULL CHECK (ranking_type IN ('top10', 'bottom10')),
  ad_id text NOT NULL,
  ad_name text,
  creative_url text,
  permalink_url text,
  headline text,
  copy text,
  ctr numeric(5,2),
  roas numeric(10,2),
  cpa numeric(10,2),
  impressions integer,
  clicks integer,
  spend numeric(10,2),
  conversions integer,
  ranking_position integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para ad_rankings
CREATE INDEX IF NOT EXISTS ad_rankings_week_iso_idx ON ad_rankings(week_iso DESC);
CREATE INDEX IF NOT EXISTS ad_rankings_snapshot_date_idx ON ad_rankings(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS ad_rankings_ranking_type_idx ON ad_rankings(ranking_type);
CREATE INDEX IF NOT EXISTS ad_rankings_ad_id_idx ON ad_rankings(ad_id);
CREATE INDEX IF NOT EXISTS ad_rankings_ctr_idx ON ad_rankings(ctr DESC);

-- Índice único para evitar duplicados (mismo week_iso, tipo y posición)
CREATE UNIQUE INDEX IF NOT EXISTS ad_rankings_unique_snapshot 
ON ad_rankings(week_iso, ranking_type, ranking_position);

-- Vista útil: Últimos rankings por semana
CREATE OR REPLACE VIEW v_latest_ad_rankings AS
SELECT 
  week_iso,
  ranking_type,
  ad_id,
  ad_name,
  creative_url,
  headline,
  copy,
  ctr,
  roas,
  cpa,
  ranking_position,
  snapshot_date
FROM ad_rankings
WHERE snapshot_date = (
  SELECT MAX(snapshot_date) 
  FROM ad_rankings r2 
  WHERE r2.week_iso = ad_rankings.week_iso
)
ORDER BY week_iso DESC, ranking_type, ranking_position;

-- Vista útil: Comparación top10 vs bottom10 por semana
CREATE OR REPLACE VIEW v_rankings_comparison AS
SELECT 
  week_iso,
  snapshot_date,
  AVG(CASE WHEN ranking_type = 'top10' THEN ctr END) as avg_ctr_top10,
  AVG(CASE WHEN ranking_type = 'bottom10' THEN ctr END) as avg_ctr_bottom10,
  AVG(CASE WHEN ranking_type = 'top10' THEN roas END) as avg_roas_top10,
  AVG(CASE WHEN ranking_type = 'bottom10' THEN roas END) as avg_roas_bottom10,
  AVG(CASE WHEN ranking_type = 'top10' THEN cpa END) as avg_cpa_top10,
  AVG(CASE WHEN ranking_type = 'bottom10' THEN cpa END) as avg_cpa_bottom10
FROM ad_rankings
GROUP BY week_iso, snapshot_date
ORDER BY week_iso DESC, snapshot_date DESC;

