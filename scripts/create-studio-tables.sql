-- ============================================
-- STUDIO CAMPAIGNS - Tabla principal
-- ============================================
-- Almacena las campañas del Studio con todo su estado

CREATE TABLE IF NOT EXISTS studio_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brief TEXT NOT NULL,
  core_message TEXT,
  status TEXT NOT NULL DEFAULT 'draft',

  -- Estado completo de la campaña (JSON)
  -- Incluye: archetypes, angles, prompts, outputs, research, etc.
  state JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Usuario (para multi-tenancy futuro)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_studio_campaigns_status ON studio_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_studio_campaigns_user ON studio_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_campaigns_created ON studio_campaigns(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_studio_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_studio_campaigns_updated_at ON studio_campaigns;
CREATE TRIGGER trigger_studio_campaigns_updated_at
  BEFORE UPDATE ON studio_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_campaigns_updated_at();

-- ============================================
-- STUDIO OUTPUTS - Contenido generado
-- ============================================
-- Tabla separada para outputs para queries más eficientes

CREATE TABLE IF NOT EXISTS studio_outputs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES studio_campaigns(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  angle_id TEXT NOT NULL,
  archetype_id TEXT NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Metadata del contenido
  prompt_text TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_outputs_campaign ON studio_outputs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_studio_outputs_type ON studio_outputs(type);

-- ============================================
-- RLS (Row Level Security) - Opcional
-- ============================================
-- Habilitar si se necesita autenticación

-- ALTER TABLE studio_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE studio_outputs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own campaigns" ON studio_campaigns
--   FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- CREATE POLICY "Users can insert own campaigns" ON studio_campaigns
--   FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- CREATE POLICY "Users can update own campaigns" ON studio_campaigns
--   FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- CREATE POLICY "Users can delete own campaigns" ON studio_campaigns
--   FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
