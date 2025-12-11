-- ========================================
-- Meta Ads Performance Schema
-- ========================================
-- Tabla para almacenar datos de Meta Ads Insights API
-- Reemplaza completamente la necesidad de n8n

-- Crear tabla ads_performance
CREATE TABLE IF NOT EXISTS ads_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Fechas
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Estructura de Meta Ads
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_set_id TEXT NOT NULL,
  ad_set_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,

  -- Métricas de gasto
  spend DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Métricas de alcance
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency DECIMAL(5, 2) DEFAULT 0,

  -- Métricas de interacción
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(5, 3) DEFAULT 0,  -- Click-through rate
  cpc DECIMAL(8, 2) DEFAULT 0,  -- Cost per click
  cpm DECIMAL(8, 2) DEFAULT 0,  -- Cost per mille (1000 impressions)
  cpp DECIMAL(8, 2) DEFAULT 0,  -- Cost per person

  -- Conversiones y ROI
  conversions DECIMAL(10, 2) DEFAULT 0,
  cpa DECIMAL(8, 2) DEFAULT 0,  -- Cost per acquisition
  revenue DECIMAL(12, 2) DEFAULT 0,
  roas DECIMAL(5, 2) DEFAULT 0, -- Return on ad spend

  -- Datos adicionales
  destination_type TEXT,  -- web, app, messaging, etc.
  platform TEXT DEFAULT 'meta', -- meta, instagram, facebook, etc.
  creative_id TEXT,
  creative_type TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraint para evitar duplicados
  CONSTRAINT ads_performance_unique_date_ad UNIQUE(date, ad_id)
);

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS ads_performance_date_idx
  ON ads_performance(date DESC);

CREATE INDEX IF NOT EXISTS ads_performance_campaign_idx
  ON ads_performance(campaign_id);

CREATE INDEX IF NOT EXISTS ads_performance_adset_idx
  ON ads_performance(ad_set_id);

CREATE INDEX IF NOT EXISTS ads_performance_ad_idx
  ON ads_performance(ad_id);

CREATE INDEX IF NOT EXISTS ads_performance_date_campaign_idx
  ON ads_performance(date DESC, campaign_id);

CREATE INDEX IF NOT EXISTS ads_performance_created_at_idx
  ON ads_performance(created_at DESC);

-- Crear tabla para tracking de sincronizaciones
CREATE TABLE IF NOT EXISTS meta_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  sync_date DATE NOT NULL,
  sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  rows_synced INTEGER DEFAULT 0,
  rows_inserted INTEGER DEFAULT 0,
  rows_updated INTEGER DEFAULT 0,

  error_message TEXT,
  error_details JSONB DEFAULT '{}',

  duration_ms INTEGER,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meta_sync_log_date_idx
  ON meta_sync_log(sync_date DESC);

CREATE INDEX IF NOT EXISTS meta_sync_log_status_idx
  ON meta_sync_log(status);

-- Crear tabla para cachear campañas activas
CREATE TABLE IF NOT EXISTS meta_campaigns_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  campaign_id TEXT UNIQUE NOT NULL,
  campaign_name TEXT,
  status TEXT,
  objective TEXT,

  daily_budget DECIMAL(12, 2),
  budget_remaining DECIMAL(12, 2),
  start_time TIMESTAMP,
  stop_time TIMESTAMP,

  metadata JSONB DEFAULT '{}',

  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para cachear ad sets
CREATE TABLE IF NOT EXISTS meta_adsets_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  adset_id TEXT UNIQUE NOT NULL,
  adset_name TEXT,
  campaign_id TEXT REFERENCES meta_campaigns_cache(campaign_id),
  status TEXT,

  daily_budget DECIMAL(12, 2),
  targeting JSONB DEFAULT '{}',

  metadata JSONB DEFAULT '{}',

  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meta_adsets_campaign_idx
  ON meta_adsets_cache(campaign_id);

-- Vista materializada para resumen diario por campaña
CREATE MATERIALIZED VIEW IF NOT EXISTS ads_performance_daily_summary AS
SELECT
  date,
  campaign_id,
  campaign_name,
  COUNT(DISTINCT ad_set_id) as adset_count,
  COUNT(DISTINCT ad_id) as ad_count,
  SUM(spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  AVG(ctr) as avg_ctr,
  AVG(cpc) as avg_cpc,
  AVG(cpm) as avg_cpm,
  AVG(cpa) as avg_cpa,
  CASE
    WHEN SUM(spend) > 0 THEN SUM(revenue) / SUM(spend)
    ELSE 0
  END as roas,
  MAX(updated_at) as last_updated
FROM ads_performance
GROUP BY date, campaign_id, campaign_name;

CREATE INDEX IF NOT EXISTS ads_performance_daily_summary_idx
  ON ads_performance_daily_summary(date DESC, campaign_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ads_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER ads_performance_updated_at_trigger
BEFORE UPDATE ON ads_performance
FOR EACH ROW
EXECUTE FUNCTION update_ads_performance_updated_at();

-- Función para loguear sincronizaciones
CREATE OR REPLACE FUNCTION log_meta_sync(
  p_sync_date DATE,
  p_status TEXT,
  p_rows_synced INTEGER,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO meta_sync_log (
    sync_date,
    status,
    rows_synced,
    error_message,
    error_details,
    duration_ms
  ) VALUES (
    p_sync_date,
    p_status,
    p_rows_synced,
    p_error_message,
    p_error_details,
    p_duration_ms
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de ejemplo (opcional - comentar después de testing)
-- INSERT INTO ads_performance (
--   date, campaign_id, campaign_name, ad_set_id, ad_set_name, ad_id, ad_name,
--   spend, impressions, clicks, conversions, revenue, ctr, cpc, cpa, roas, platform
-- ) VALUES (
--   CURRENT_DATE - 1,
--   'act_123456789',
--   'Sample Campaign',
--   'aset_123456789',
--   'Sample AdSet',
--   'ad_123456789',
--   'Sample Ad',
--   100.00, 5000, 150, 10, 500.00, 3.0, 0.67, 10.00, 5.0, 'meta'
-- );

-- Comentarios
COMMENT ON TABLE ads_performance IS 'Datos de Meta Ads Insights API sincronizados desde el endpoint /api/meta/sync';
COMMENT ON TABLE meta_sync_log IS 'Log de sincronizaciones de Meta Ads';
COMMENT ON TABLE meta_campaigns_cache IS 'Cache de campañas activas de Meta';
COMMENT ON TABLE meta_adsets_cache IS 'Cache de ad sets de Meta';
COMMENT ON MATERIALIZED VIEW ads_performance_daily_summary IS 'Resumen diario de desempeño por campaña';

-- Dar permisos básicos (si tienes usuarios específicos)
-- GRANT SELECT ON ads_performance TO authenticated;
-- GRANT SELECT ON meta_sync_log TO authenticated;
