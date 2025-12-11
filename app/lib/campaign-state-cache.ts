/**
 * In-memory cache for campaign state during execution
 *
 * This helps bridge the gap between background orchestration
 * and API requests while database is being set up
 *
 * Uses a plain object instead of Map to avoid hot-reload issues in development
 */

interface CachedCampaignState {
  id: string
  status: 'in_progress' | 'completed' | 'failed'
  flows: any[]
  input?: any
  research?: any
  angles?: any
  prompts?: any
  image_prompts?: any
  updatedAt: number
}

const CACHE_TTL = 3600000 // 1 hour

// Use a plain object instead of Map for better hot-reload compatibility
const campaignCache: Record<string, CachedCampaignState> = (global as any).__campaignCache || {}

// Attach to global to persist across module reloads
if (typeof global !== 'undefined') {
  (global as any).__campaignCache = campaignCache
}

export function setCampaignState(id: string, state: Omit<CachedCampaignState, 'updatedAt'>) {
  campaignCache[id] = {
    ...state,
    updatedAt: Date.now(),
  }
}

export function getCampaignState(id: string): CachedCampaignState | null {
  const cached = campaignCache[id]

  if (!cached) {
    return null
  }

  // Check if cache has expired
  if (Date.now() - cached.updatedAt > CACHE_TTL) {
    delete campaignCache[id]
    return null
  }

  return cached
}

export function clearCampaignState(id: string) {
  delete campaignCache[id]
}
