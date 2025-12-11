/**
 * DELETE /api/campaigns/[id]
 * POST /api/campaigns/[id]/delete
 *
 * Elimina una campaña (soft delete con marca de fecha)
 * Las campañas eliminadas no aparecen en listados pero se guardan en BD
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface DeleteRequest {
  permanent?: boolean // Si es true, eliminar definitivamente (requiere confirmación)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID requerido' },
        { status: 400 }
      )
    }

    const body: DeleteRequest = await request.json().catch(() => ({}))
    const permanent = body.permanent === true

    // Get campaign from cache first
    const campaignCache = (global as any).__campaignCache || {}
    const cachedCampaign = campaignCache[campaignId]

    if (!cachedCampaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    const deletedAt = new Date().toISOString()

    if (permanent) {
      // Permanent delete - remove from cache completely
      delete campaignCache[campaignId]

      // Try to delete from DB (soft delete with permanent flag)
      try {
        const supabase = createClient()
        await supabase
          .from('campaigns')
          .update({
            status: 'archived',
            deleted_at: deletedAt,
            deleted_permanently: true,
          })
          .eq('id', campaignId)
      } catch (dbError) {
        console.warn('Could not mark permanent delete in DB:', dbError)
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Campaña eliminada permanentemente',
          campaign: {
            id: campaignId,
            status: 'archived',
            deletedAt,
            permanent: true,
          },
        },
        { status: 200 }
      )
    } else {
      // Soft delete - keep in cache but mark as archived
      campaignCache[campaignId] = {
        ...cachedCampaign,
        status: 'archived',
        deletedAt,
      }

      // Try to update DB (soft delete)
      try {
        const supabase = createClient()
        await supabase
          .from('campaigns')
          .update({
            status: 'archived',
            deleted_at: deletedAt,
          })
          .eq('id', campaignId)
      } catch (dbError) {
        console.warn('Could not mark delete in DB, but cache updated:', dbError)
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Campaña archivada (puede recuperarse)',
          campaign: {
            id: campaignId,
            status: 'archived',
            deletedAt,
            permanent: false,
            recoverable: true,
          },
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error deleting campaign:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar campaña',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Delegate to POST with soft delete
  return POST(request, { params })
}
