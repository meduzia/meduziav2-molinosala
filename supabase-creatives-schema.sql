-- Create creatives table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS creatives (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  file_url text not null,
  file_type text not null CHECK (file_type IN ('image', 'video')),
  angle text,
  destination text,
  format text,
  campaign text,
  status text default 'draft' CHECK (status IN ('draft', 'review', 'approved', 'live')),
  notes text,
  status_history jsonb default '[]'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
CREATE INDEX IF NOT EXISTS idx_creatives_created_at ON creatives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign) WHERE campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creatives_angle ON creatives(angle) WHERE angle IS NOT NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON creatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add status_history column to existing table (run if table already exists)
-- ALTER TABLE creatives ADD COLUMN IF NOT EXISTS status_history jsonb default '[]'::jsonb;
