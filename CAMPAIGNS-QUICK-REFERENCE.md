# Campaigns System - Quick Reference

## Quick Start (5 minutes)

### 1. Run Migration
Go to Supabase SQL Editor and paste content from `CAMPAIGNS-SETUP.md` SQL section

### 2. Test Creation
```bash
curl -X POST http://localhost:3000/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "producto",
    "brief_text": "Anti-aging cream with marine collagen",
    "target_audience": "Women 35-55",
    "executeOptions": {"executeResearch": true, "executeAngles": true}
  }'
```

### 3. View Results
- List: http://localhost:3000/campaigns
- Detail: http://localhost:3000/campaigns/[campaign-id]

---

## Key Files Reference

| File | Purpose | Key Functions |
|------|---------|----------------|
| `app/lib/campaigns-db.ts` | Database CRUD | `getCampaign()`, `listCampaigns()`, `saveCampaignResearch()`, etc. |
| `app/api/campaigns/create/route.ts` | Create campaigns | POST handler with auth & orchestration |
| `app/api/campaigns/[id]/route.ts` | Get single campaign | Loads from DB with all related data |
| `app/api/campaigns/list/route.ts` | List campaigns | Pagination support |
| `app/lib/agents/orchestrator.ts` | Orchestration | `executeFull()`, `onFlowComplete` callback |
| `app/campaigns/page.tsx` | List UI | Fetches from `/api/campaigns/list` |
| `app/campaigns/[id]/page.tsx` | Detail UI | 4 tabs: Research, Angles, Prompts, Variations |

---

## API Reference

### POST /api/campaigns/create
Creates and executes campaign

**Request:**
```json
{
  "type": "producto|servicio",
  "brief_text": "Product description",
  "target_audience": "Target market",
  "product_image_url": "URL (optional)",
  "info_extra": "Extra info (optional)",
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

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "status": "completed",
    "createdAt": "ISO timestamp",
    "summary": {
      "research": { "painPoints": 10, "benefits": 10 },
      "angles": { "total": 20 },
      "prompts": { "total": 20 },
      "variations": { "total": 60 }
    },
    "flows": [
      {
        "step": "research",
        "status": "completed",
        "duration": 3000,
        "error": null
      }
    ]
  }
}
```

---

### GET /api/campaigns/[id]
Gets complete campaign

**Response:**
```json
{
  "campaign": {
    "id": "uuid",
    "status": "completed",
    "input": { "type": "producto", "brief_text": "..." },
    "research": {
      "pain_points": [{ "id": "1", "description": "..." }],
      "benefits": [{ "id": "1", "description": "..." }],
      "objections": [...],
      "promises": [...]
    },
    "angles": {
      "angles": [{
        "angle_id": "1",
        "angle_name": "Luxury Anti-Aging",
        "big_idea": "...",
        "hook_type": "transformation",
        "pain_point_target": "lines",
        "key_benefit_target": "youthful skin",
        "suggested_creator": "beauty influencer",
        "context": "bathroom at home"
      }]
    },
    "prompts": [{
      "angle_id": "1",
      "prompt_text": "Full video generation prompt...",
      "technical_parameters": { ... }
    }],
    "variations": [{
      "variation_id": "v1",
      "parent_prompt_id": "p1",
      "prompt_text": "Variation prompt...",
      "hypothesis": "Testing emoji-led hook",
      "target_metric": "ctr"
    }],
    "flows": [...]
  }
}
```

---

### GET /api/campaigns/list
Lists campaigns with pagination

**Query Params:**
- `limit`: Page size (default 20)
- `offset`: Start position (default 0)

**Response:**
```json
{
  "campaigns": [{
    "id": "uuid",
    "type": "producto",
    "brief_text": "...",
    "status": "completed",
    "createdAt": "ISO timestamp",
    "summary": {
      "research": { "painPoints": 10, "benefits": 10 },
      "angles": { "total": 20 },
      "prompts": { "total": 20 },
      "variations": { "total": 0 }
    }
  }],
  "total": 45,
  "hasMore": true
}
```

---

## Database Schema Quick View

### campaigns
```
id (PK) | user_id | type | brief_text | status | created_at | updated_at
```

### campaign_research
```
id | campaign_id | pain_points (JSONB) | benefits (JSONB) | ...
```

### campaign_angles
```
id | campaign_id | angle_id | angle_name | big_idea | hook_type | ...
```

### campaign_prompts
```
id | campaign_id | angle_id | prompt_text | technical_parameters | ...
```

### campaign_variations
```
id | campaign_id | parent_prompt_id | variation_id | prompt_text | hypothesis | target_metric
```

### campaign_flows
```
id | campaign_id | step | status | input | output | error | started_at | completed_at
```

---

## Common Tasks

### Add New Output Type to Campaign

1. Create table in Supabase:
```sql
create table campaign_new_output (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id),
  ...
)
```

2. Add function to `campaigns-db.ts`:
```typescript
export async function saveCampaignNewOutput(
  campaignId: string,
  data: NewOutputType
): Promise<void> {
  const { error } = await supabase
    .from('campaign_new_output')
    .insert([{ campaign_id: campaignId, ...data }])
  if (error) throw error
}
```

3. Update orchestrator callback in API:
```typescript
if (flow.step === 'new_step' && flow.status === 'completed') {
  await saveCampaignNewOutput(campaignId, flow.output)
}
```

---

### Query All Campaigns for User (Example)

```typescript
import { listCampaigns } from '@/lib/campaigns-db'

const campaigns = await listCampaigns(userId, 20, 0)
// Returns campaigns with summaries
```

---

### Get Raw Data from Database

```typescript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
const { data, error } = await supabase
  .from('campaign_angles')
  .select('*')
  .eq('campaign_id', campaignId)
```

---

## Debugging

### Campaign Stuck in Progress
```sql
UPDATE campaigns SET status = 'failed' WHERE id = '...'
```

### Clear Campaign Data
```sql
DELETE FROM campaigns WHERE id = '...'
-- Cascades delete all related records
```

### View Execution Timeline
```sql
SELECT step, status, started_at, completed_at,
       (completed_at - started_at) as duration
FROM campaign_flows
WHERE campaign_id = '...'
ORDER BY created_at
```

### Check for RLS Issues
```sql
-- Your user_id should appear in campaigns
SELECT * FROM campaigns WHERE user_id = '[your_id]'
```

---

## Performance Tips

1. **Use listCampaigns()** instead of querying all campaigns
2. **Limit** results to prevent loading thousands of records
3. **Indexes** already exist on user_id, campaign_id, status
4. **JSON columns** (pain_points, benefits) are optimized for queries

---

## Types Reference

```typescript
interface CampaignInput {
  type: 'producto' | 'servicio'
  brief_text: string
  product_image_url?: string
  target_audience?: string
  info_extra?: string
  num_videos_initial: number
  idioma: string
}

interface Campaign {
  id: string
  input: CampaignInput
  research?: ResearchOutput
  angles?: AnglesOutput
  prompts?: VideoPrompt[]
  variations?: PromptVariation[]
  flows: CampaignOrchestrationFlow[]
  status: 'draft' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

interface CampaignOrchestrationFlow {
  step: 'research' | 'angles' | 'scriptwriting' | 'variations'
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: any
  output?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
}
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "No autenticado" | User not logged in | Implement auth check |
| "Could not find table" | Migration not run | Execute SQL in Supabase |
| "Row-level security violation" | Wrong user_id | Check RLS policies |
| "ANTHROPIC_API_KEY not set" | Missing env var | Add to .env.local |
| "Campaign already exists" | Duplicate ID | Use UUID generation |

---

## Links

- Database Setup: [CAMPAIGNS-SETUP.md](CAMPAIGNS-SETUP.md)
- Full Summary: [CAMPAIGNS-IMPLEMENTATION-SUMMARY.md](CAMPAIGNS-IMPLEMENTATION-SUMMARY.md)
- Quick Start: [QUICK-START-AGENTS.md](QUICK-START-AGENTS.md)
- Supabase Docs: https://supabase.com/docs
- Anthropic API: https://docs.anthropic.com
