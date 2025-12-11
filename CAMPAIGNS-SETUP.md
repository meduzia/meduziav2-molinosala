# Campaigns & AI Agents System - Setup Guide

## Overview

This system implements a complete UGC (User-Generated Content) campaign creation workflow powered by 4 AI agents (Research, Angles, Scriptwriter, Variations) with persistent database storage.

**Key Features:**
- Create campaigns from product/service briefs
- 4-step agent orchestration for generating creative content
- Real-time persistence to Supabase
- View all campaign history and outputs
- Export campaign data as JSON
- Detailed dashboard with Research, Angles, Prompts, and Variations

---

## Database Setup

### 1. Create Supabase Tables

Run the SQL in your Supabase database (SQL Editor):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Main campaigns table
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('producto', 'servicio')),
  brief_text text not null,
  product_image_url text,
  target_audience text,
  info_extra text,
  num_videos_initial integer default 50,
  idioma text default 'español',
  status text default 'draft' check (status in ('draft', 'in_progress', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Research agent outputs
create table campaign_research (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  pain_points jsonb default '[]',
  benefits jsonb default '[]',
  objections jsonb default '[]',
  promises jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- Angles agent outputs
create table campaign_angles (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  angle_id text not null,
  angle_name text not null,
  big_idea text,
  hook_type text,
  pain_point_target text,
  key_benefit_target text,
  suggested_creator text,
  context text,
  created_at timestamp with time zone default now()
);

-- Scriptwriter agent outputs
create table campaign_prompts (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  angle_id text not null,
  prompt_text text not null,
  technical_parameters jsonb,
  negative_prompt text,
  created_at timestamp with time zone default now()
);

-- Variations agent outputs
create table campaign_variations (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  parent_prompt_id text,
  variation_id text not null,
  prompt_text text not null,
  hypothesis text,
  target_metric text,
  created_at timestamp with time zone default now()
);

-- Execution flow tracking
create table campaign_flows (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  step text not null check (step in ('research', 'angles', 'scriptwriting', 'variations')),
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  input jsonb,
  output jsonb,
  error text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Generated assets (images/videos)
create table campaign_assets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  url text not null,
  prompt_id text,
  variation_id text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index campaigns_user_id_idx on campaigns(user_id);
create index campaigns_status_idx on campaigns(status);
create index campaign_research_campaign_id_idx on campaign_research(campaign_id);
create index campaign_angles_campaign_id_idx on campaign_angles(campaign_id);
create index campaign_prompts_campaign_id_idx on campaign_prompts(campaign_id);
create index campaign_variations_campaign_id_idx on campaign_variations(campaign_id);
create index campaign_flows_campaign_id_idx on campaign_flows(campaign_id);
create index campaign_assets_campaign_id_idx on campaign_assets(campaign_id);

-- Enable RLS
alter table campaigns enable row level security;
alter table campaign_research enable row level security;
alter table campaign_angles enable row level security;
alter table campaign_prompts enable row level security;
alter table campaign_variations enable row level security;
alter table campaign_flows enable row level security;
alter table campaign_assets enable row level security;

-- RLS Policies (users can only access their own campaigns)
create policy "Users can read own campaigns" on campaigns for select using (auth.uid() = user_id);
create policy "Users can insert own campaigns" on campaigns for insert with check (auth.uid() = user_id);
create policy "Users can update own campaigns" on campaigns for update using (auth.uid() = user_id);
create policy "Users can delete own campaigns" on campaigns for delete using (auth.uid() = user_id);

-- Research RLS (via campaign)
create policy "Users can read research from own campaigns" on campaign_research for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert research" on campaign_research for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

-- Similar policies for other tables...
create policy "Users can read angles from own campaigns" on campaign_angles for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert angles" on campaign_angles for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

create policy "Users can read prompts from own campaigns" on campaign_prompts for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert prompts" on campaign_prompts for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

create policy "Users can read variations from own campaigns" on campaign_variations for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert variations" on campaign_variations for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

create policy "Users can read flows from own campaigns" on campaign_flows for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert flows" on campaign_flows for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

create policy "Users can read assets from own campaigns" on campaign_assets for select using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users can insert assets" on campaign_assets for insert with check (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
```

### 2. Verify Environment Variables

Make sure your `.env.local` has:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Anthropic (for AI agents)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Available Endpoints

### Create Campaign
**POST** `/api/campaigns/create`

Request body:
```json
{
  "type": "producto",
  "brief_text": "Crema anti-arrugas con colágeno marino. Reduce líneas en 14 días.",
  "target_audience": "Mujeres 35-55 años",
  "product_image_url": "https://...",
  "info_extra": "Hypoallergenic, cruelty-free",
  "num_videos_initial": 50,
  "idioma": "español",
  "executeOptions": {
    "executeResearch": true,
    "executeAngles": true,
    "executeScriptwriting": true,
    "executeVariations": false,
    "numVariationsPerPrompt": 3
  }
}
```

Response: Campaign object with id, status, and summary

### Get Campaign
**GET** `/api/campaigns/[id]`

Returns full campaign with all research, angles, prompts, variations, and execution flows.

### List Campaigns
**GET** `/api/campaigns/list?limit=20&offset=0`

Returns paginated list of campaigns with summaries.

---

## UI Routes

- **List all campaigns:** `/campaigns`
- **Create campaign:** `/campaigns/create`
- **View campaign:** `/campaigns/[id]`

---

## How It Works

### 1. Campaign Creation Flow

```
User submits brief
        ↓
POST /api/campaigns/create
        ↓
1. Create campaign record in DB (status: draft)
2. Update to "in_progress"
3. Initialize CampaignOrchestrator
4. Set up callback to persist each agent's output
5. Execute agents sequentially:
   - Research Agent (~3s)
   - Angles Agent (~5s)
   - Scriptwriter Agent (~10s)
   - Variations Agent (optional, ~15s)
6. Each step persists to database via callback
7. Update final status (completed/failed)
```

### 2. Data Persistence

The `CampaignOrchestrator` has a callback property:

```typescript
orchestrator.onFlowComplete = async (flow) => {
  // Save flow record to campaign_flows table
  await saveCampaignFlow(campaignId, flow)

  // Save output to appropriate table based on step
  if (flow.step === 'research' && flow.status === 'completed') {
    await saveCampaignResearch(campaignId, flow.output)
  }
  // ... similar for other steps
}
```

This ensures real-time persistence and allows campaigns to survive server restarts.

### 3. Viewing Results

The campaign detail page (`/campaigns/[id]`) displays:

- **Research Tab:** Pain points, benefits, objections, promises
- **Angles Tab:** Creative concepts with hook types and suggested creators
- **Prompts Tab:** Video generation prompts for each angle
- **Variations Tab:** A/B test variations with hypotheses and target metrics

---

## Cost Optimization

A full campaign execution (~50k tokens) costs approximately **$0.46** using Claude 3.5 Sonnet:
- Research Agent: ~2k input / ~2k output tokens
- Angles Agent: ~4k input / ~4k output tokens
- Scriptwriter Agent: ~8k input / ~8k output tokens
- Variations Agent: ~10k input / ~12k output tokens

Running campaigns 70% cheaper than the n8n workflow system.

---

## Files Created/Modified

**New Files:**
- `app/lib/campaigns-db.ts` - Database CRUD layer
- `app/api/campaigns/create/route.ts` - Campaign creation endpoint
- `app/api/campaigns/[id]/route.ts` - Get campaign endpoint
- `app/api/campaigns/list/route.ts` - List campaigns endpoint

**Modified Files:**
- `app/campaigns/page.tsx` - List view with DB fetching
- `app/campaigns/[id]/page.tsx` - Detail view with tabs
- `app/lib/agents/orchestrator.ts` - Added onFlowComplete callback
- `app/lib/supabase.ts` - Added createClient export

---

## Next Steps

1. Run the SQL migration in Supabase
2. Test campaign creation at `/campaigns/create`
3. View saved campaigns at `/campaigns`
4. Export campaign data as JSON from detail view

---

## Troubleshooting

**"No autenticado"** - Make sure user is logged in via Supabase Auth

**"Could not find the table"** - Run the SQL migration above

**Campaign takes too long** - Check ANTHROPIC_API_KEY is valid

**Data not persisting** - Check Supabase credentials and RLS policies
