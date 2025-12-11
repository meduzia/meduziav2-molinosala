/**
 * POST /api/meta/sync
 *
 * Sincroniza datos de Meta Ads Insights API a Supabase
 * Reemplaza completamente n8n para la integración de Meta Ads
 *
 * Query params:
 * - days: número de días a sincronizar (default: 7)
 * - date: fecha específica (YYYY-MM-DD) para sincronizar un solo día
 *
 * Body (optional):
 * {
 *   "adAccountId": "act_123456789",
 *   "accessToken": "your-meta-token"
 * }
 *
 * O usar variables de ambiente:
 * - META_AD_ACCOUNT_ID
 * - META_ACCESS_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import {
  syncMetaInsightsForDate,
  syncMetaInsightsLastDays,
} from '@/lib/meta-ads-api'

export async function POST(request: NextRequest) {
  try {
    // Verificar que sea llamada internamente o con API key válida
    const apiKey = request.headers.get('x-api-key')
    const internalSecret = process.env.INTERNAL_API_SECRET

    // Solo verificar si hay un secret configurado
    if (internalSecret && apiKey !== internalSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const specificDate = searchParams.get('date')

    // Obtener credenciales de Meta
    let adAccountId = process.env.META_AD_ACCOUNT_ID
    let accessToken = process.env.META_ACCESS_TOKEN

    // Permitir sobrescribir con body
    const body = await request.json().catch(() => ({}))
    if (body.adAccountId) adAccountId = body.adAccountId
    if (body.accessToken) accessToken = body.accessToken

    if (!adAccountId || !accessToken) {
      return NextResponse.json(
        {
          error: 'Missing Meta credentials',
          required: ['META_AD_ACCOUNT_ID', 'META_ACCESS_TOKEN'],
        },
        { status: 400 }
      )
    }

    console.log('[Meta Sync] Starting sync process')
    console.log(`[Meta Sync] Account: ${adAccountId}`)

    // Obtener datos de Meta
    let performanceRows: any[] = []

    if (specificDate) {
      console.log(`[Meta Sync] Syncing specific date: ${specificDate}`)
      performanceRows = await syncMetaInsightsForDate(
        adAccountId,
        accessToken,
        specificDate
      )
    } else {
      console.log(`[Meta Sync] Syncing last ${days} days`)
      performanceRows = await syncMetaInsightsLastDays(
        adAccountId,
        accessToken,
        days
      )
    }

    if (!performanceRows || performanceRows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No new data to sync',
          rowsInserted: 0,
        },
        { status: 200 }
      )
    }

    console.log(
      `[Meta Sync] Inserting ${performanceRows.length} rows into Supabase`
    )

    // Guardar en Supabase
    const supabase = createClient()

    // Usar upsert para evitar duplicados
    const { data, error } = await supabase
      .from('ads_performance')
      .upsert(performanceRows, {
        onConflict: 'date,ad_id', // Evitar duplicados por date + ad_id
      })

    if (error) {
      console.error('[Meta Sync] Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      )
    }

    console.log(`[Meta Sync] Successfully synced ${performanceRows.length} rows`)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully synced ${performanceRows.length} rows`,
        rowsInserted: performanceRows.length,
        data: {
          dateRange: specificDate
            ? { date: specificDate }
            : { days: days },
          rowsProcessed: performanceRows.length,
          campaigns: [
            ...new Set(performanceRows.map((r) => r.campaign_id)),
          ].length,
          adSets: [
            ...new Set(performanceRows.map((r) => r.ad_set_id)),
          ].length,
          ads: [
            ...new Set(performanceRows.map((r) => r.ad_id)),
          ].length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Meta Sync] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Permitir GET para testing
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') || 'status'

    if (method === 'status') {
      return NextResponse.json({
        status: 'Meta Sync API is running',
        endpoints: {
          sync: 'POST /api/meta/sync?days=7',
          syncDate: 'POST /api/meta/sync?date=2024-01-15',
          status: 'GET /api/meta/sync?method=status',
        },
        required_env: [
          'META_AD_ACCOUNT_ID',
          'META_ACCESS_TOKEN',
        ],
      })
    }

    return NextResponse.json(
      { error: 'Unknown method' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error' },
      { status: 500 }
    )
  }
}
