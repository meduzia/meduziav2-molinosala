-- Tablas para competitors_trends_pull workflow
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- competitors_ads table
CREATE TABLE IF NOT EXISTS competitors_ads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL,
  advertiser_name text NOT NULL,
  ad_creative_body text,
  ad_creative_bodies jsonb DEFAULT '[]'::jsonb,
  ad_snapshot_url text,
  page_id text,
  ad_delivery_start_time timestamp with time zone,
  ad_delivery_stop_time timestamp with time zone,
  impressions_lower_bound integer,
  impressions_upper_bound integer,
  spend_lower_bound numeric(10,2),
  spend_upper_bound numeric(10,2),
  currency text DEFAULT 'USD',
  regions jsonb DEFAULT '[]'::jsonb,
  publisher_platforms jsonb DEFAULT '[]'::jsonb,
  ad_format text,
  media_type text,
  angle_tags jsonb DEFAULT '[]'::jsonb,
  primary_angle text,
  angle_confidence numeric(3,2),
  angle_reasoning text,
  search_query text,
  scraped_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para competitors_ads
CREATE INDEX IF NOT EXISTS competitors_ads_ad_id_idx ON competitors_ads(ad_id);
CREATE INDEX IF NOT EXISTS competitors_ads_advertiser_name_idx ON competitors_ads(advertiser_name);
CREATE INDEX IF NOT EXISTS competitors_ads_scraped_at_idx ON competitors_ads(scraped_at DESC);
CREATE INDEX IF NOT EXISTS competitors_ads_primary_angle_idx ON competitors_ads(primary_angle) WHERE primary_angle IS NOT NULL;
CREATE INDEX IF NOT EXISTS competitors_ads_created_at_idx ON competitors_ads(created_at DESC);

-- Índice único para evitar duplicados (mismo ad_id en mismo día)
CREATE UNIQUE INDEX IF NOT EXISTS competitors_ads_ad_id_date_unique 
ON competitors_ads(ad_id, DATE(scraped_at));

-- market_trends table
CREATE TABLE IF NOT EXISTS market_trends (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  source text NOT NULL,
  source_url text,
  title text NOT NULL,
  description text,
  link text,
  published_at timestamp with time zone,
  author text,
  category text,
  content text,
  scraped_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índices para market_trends
CREATE INDEX IF NOT EXISTS market_trends_source_idx ON market_trends(source);
CREATE INDEX IF NOT EXISTS market_trends_published_at_idx ON market_trends(published_at DESC);
CREATE INDEX IF NOT EXISTS market_trends_scraped_at_idx ON market_trends(scraped_at DESC);
CREATE INDEX IF NOT EXISTS market_trends_category_idx ON market_trends(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS market_trends_created_at_idx ON market_trends(created_at DESC);

-- Índice único para evitar duplicados (mismo link)
CREATE UNIQUE INDEX IF NOT EXISTS market_trends_link_unique 
ON market_trends(link) WHERE link IS NOT NULL;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_competitors_ads_updated_at 
BEFORE UPDATE ON competitors_ads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_trends_updated_at 
BEFORE UPDATE ON market_trends
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista útil: Últimos anuncios de competidores con clasificación
CREATE OR REPLACE VIEW v_competitors_ads_recent AS
SELECT 
  id,
  advertiser_name,
  ad_creative_body,
  primary_angle,
  angle_tags,
  angle_confidence,
  ad_format,
  media_type,
  impressions_lower_bound,
  impressions_upper_bound,
  spend_lower_bound,
  spend_upper_bound,
  scraped_at,
  search_query
FROM competitors_ads
WHERE scraped_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY scraped_at DESC;

-- Vista útil: Tendencias del mercado por fuente
CREATE OR REPLACE VIEW v_market_trends_by_source AS
SELECT 
  source,
  COUNT(*) as total_trends,
  COUNT(DISTINCT DATE(published_at)) as days_with_content,
  MAX(published_at) as last_published,
  MAX(scraped_at) as last_scraped
FROM market_trends
WHERE scraped_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY source
ORDER BY total_trends DESC;

