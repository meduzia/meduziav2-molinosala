-- Tablas para Meta Ads Sync workflow
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar vistas si existen (para poder recrear las tablas)
DROP VIEW IF EXISTS v_weekly_metrics_summary;
DROP VIEW IF EXISTS v_ads_metrics_daily;

-- Eliminar tablas si existen (para recrearlas con la estructura correcta)
DROP TABLE IF EXISTS metrics_daily CASCADE;
DROP TABLE IF EXISTS ads CASCADE;

-- ads table (información de los anuncios)
CREATE TABLE ads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL UNIQUE,
  ad_name text NOT NULL,
  adset_id text,
  campaign_id text,
  creative_url text,
  permalink_url text,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para ads
CREATE INDEX IF NOT EXISTS ads_ad_id_idx ON ads(ad_id);
CREATE INDEX IF NOT EXISTS ads_adset_id_idx ON ads(adset_id) WHERE adset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ads_campaign_id_idx ON ads(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ads_created_time_idx ON ads(created_time DESC);
CREATE INDEX IF NOT EXISTS ads_updated_time_idx ON ads(updated_time DESC);

-- metrics_daily table (métricas diarias por ad)
CREATE TABLE metrics_daily (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpa numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  week_iso text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para metrics_daily
CREATE INDEX IF NOT EXISTS metrics_daily_ad_id_idx ON metrics_daily(ad_id);
CREATE INDEX IF NOT EXISTS metrics_daily_date_idx ON metrics_daily(date DESC);
CREATE INDEX IF NOT EXISTS metrics_daily_week_iso_idx ON metrics_daily(week_iso) WHERE week_iso IS NOT NULL;
CREATE INDEX IF NOT EXISTS metrics_daily_created_at_idx ON metrics_daily(created_at DESC);

-- Índice único para evitar duplicados (mismo ad_id en mismo día)
CREATE UNIQUE INDEX IF NOT EXISTS metrics_daily_ad_id_date_unique 
ON metrics_daily(ad_id, date);

-- Función para calcular week_iso (ISO 8601 week format: YYYY-Www)
CREATE OR REPLACE FUNCTION get_week_iso(date_val date)
RETURNS text AS $$
DECLARE
  year_val integer;
  week_val integer;
BEGIN
  -- Calcular año y semana ISO 8601
  year_val := EXTRACT(YEAR FROM date_val);
  week_val := EXTRACT(WEEK FROM date_val);
  
  -- Ajustar año si la semana está en enero pero pertenece al año anterior
  IF week_val = 1 AND EXTRACT(MONTH FROM date_val) = 12 THEN
    year_val := year_val + 1;
  ELSIF week_val >= 52 AND EXTRACT(MONTH FROM date_val) = 1 THEN
    year_val := year_val - 1;
  END IF;
  
  RETURN year_val || '-W' || LPAD(week_val::text, 2, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_ads_updated_at 
BEFORE UPDATE ON ads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_daily_updated_at 
BEFORE UPDATE ON metrics_daily
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista útil: Métricas diarias con información de ads
CREATE OR REPLACE VIEW v_ads_metrics_daily AS
SELECT 
  m.id,
  m.ad_id,
  a.ad_name,
  a.adset_id,
  a.campaign_id,
  m.date,
  m.impressions,
  m.clicks,
  m.spend,
  m.ctr,
  m.cpc,
  m.cpa,
  m.roas,
  m.week_iso,
  a.creative_url,
  a.permalink_url,
  m.created_at,
  m.updated_at
FROM metrics_daily m
LEFT JOIN ads a ON m.ad_id = a.ad_id
ORDER BY m.date DESC, m.ad_id;

-- Vista útil: Resumen semanal por ad
CREATE OR REPLACE VIEW v_weekly_metrics_summary AS
SELECT 
  ad_id,
  week_iso,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(spend) as total_spend,
  AVG(ctr) as avg_ctr,
  AVG(cpc) as avg_cpc,
  AVG(cpa) as avg_cpa,
  AVG(roas) as avg_roas,
  COUNT(*) as days_active
FROM metrics_daily
WHERE week_iso IS NOT NULL
GROUP BY ad_id, week_iso
ORDER BY week_iso DESC, ad_id;

