-- Campaigns Schema for UGC Agent System
-- This schema stores all campaign data, agent outputs, and execution flows

-- ============= MAIN CAMPAIGN TABLE =============

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input data
  type text NOT NULL CHECK (type IN ('producto', 'servicio')),
  brief_text text NOT NULL,
  product_image_url text,
  target_audience text,
  info_extra text,
  num_videos_initial integer DEFAULT 50,
  idioma text DEFAULT 'español',

  -- Status tracking
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);

-- ============= AGENT OUTPUTS TABLES =============

-- Agent 1: Research Output
CREATE TABLE IF NOT EXISTS campaign_research (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  pain_points jsonb DEFAULT '[]'::jsonb,    -- Array of {id, description}
  benefits jsonb DEFAULT '[]'::jsonb,
  objections jsonb DEFAULT '[]'::jsonb,
  promises jsonb DEFAULT '[]'::jsonb,

  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Agent 2: Angles Output
CREATE TABLE IF NOT EXISTS campaign_angles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  angle_id text NOT NULL,
  angle_name text NOT NULL,
  big_idea text,
  hook_type text,
  pain_point_target text,
  key_benefit_target text,
  suggested_creator text,
  context text,

  created_at timestamptz DEFAULT now()
);

-- Agent 3: Scriptwriter Output
CREATE TABLE IF NOT EXISTS campaign_prompts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  angle_id text,
  prompt_text text NOT NULL,
  technical_parameters jsonb,
  negative_prompt text,

  created_at timestamptz DEFAULT now()
);

-- Agent 4: Variations Output
CREATE TABLE IF NOT EXISTS campaign_variations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES campaign_prompts(id) ON DELETE SET NULL,

  parent_prompt_id text NOT NULL,
  variation_id text NOT NULL,
  prompt_text text NOT NULL,
  hypothesis text,
  target_metric text CHECK (target_metric IN ('ctr', 'thumbstop', 'roas', 'conversion')),

  created_at timestamptz DEFAULT now()
);

-- ============= EXECUTION FLOW TRACKING =============

CREATE TABLE IF NOT EXISTS campaign_flows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  step text NOT NULL CHECK (step IN ('research', 'angles', 'scriptwriting', 'variations', 'image_generation', 'video_generation')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  input jsonb,
  output jsonb,
  error text,

  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============= GENERATED ASSETS =============

CREATE TABLE IF NOT EXISTS campaign_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,

  prompt_id uuid REFERENCES campaign_prompts(id) ON DELETE SET NULL,
  variation_id uuid REFERENCES campaign_variations(id) ON DELETE SET NULL,

  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============= INDEXES FOR PERFORMANCE =============

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_research_campaign_id ON campaign_research(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_angles_campaign_id ON campaign_angles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_angles_angle_id ON campaign_angles(angle_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prompts_campaign_id ON campaign_prompts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prompts_angle_id ON campaign_prompts(angle_id);
CREATE INDEX IF NOT EXISTS idx_campaign_variations_campaign_id ON campaign_variations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_flows_campaign_id ON campaign_flows(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);

-- ============= TRIGGERS =============

-- Update updated_at on campaign modification
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaigns_updated_at();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Cascade RLS to related tables
CREATE POLICY "Users can view own campaign research" ON campaign_research
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can view own campaign angles" ON campaign_angles
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can view own campaign prompts" ON campaign_prompts
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can view own campaign variations" ON campaign_variations
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can view own campaign flows" ON campaign_flows
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can view own campaign assets" ON campaign_assets
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE auth.uid() = user_id
    )
  );

-- Allow service role to insert (from API)
CREATE POLICY "Service role can insert research" ON campaign_research
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert angles" ON campaign_angles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert prompts" ON campaign_prompts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert variations" ON campaign_variations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert flows" ON campaign_flows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert assets" ON campaign_assets
  FOR INSERT WITH CHECK (true);

-- Allow service role to update campaigns
CREATE POLICY "Service role can update campaigns" ON campaigns
  FOR UPDATE WITH CHECK (true);
