/**
 * API v2 - Obtener imagen con overlay de texto
 *
 * GET /api/v2/campaigns/[id]/outputs/[outputId]/with-overlay?layout=...&logo=...
 *
 * Devuelve la imagen generada con los textos publicitarios superpuestos
 * usando el layout especificado o el configurado en el prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCampaignState } from '@/lib/stores/campaign-store'
import { applyTextOverlayToUrl, suggestLayout, type OverlayLayout } from '@/lib/agents-v2/text-overlay-service'
import type { TextOverlay } from '@/lib/types/campaign-types'

const VALID_LAYOUTS: OverlayLayout[] = [
  'gradient-bottom',
  'solid-band',
  'floating-text',
  'testimonial',
  'bullet-points',
  'minimal',
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; outputId: string }> }
): Promise<NextResponse> {
  try {
    const { id, outputId } = await params
    const { searchParams } = new URL(request.url)

    // Parámetros opcionales de URL (override)
    const layoutParam = searchParams.get('layout')
    const logoParam = searchParams.get('logo')

    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Buscar el output
    const output = state.outputs.find((o) => o.id === outputId)
    if (!output) {
      return NextResponse.json({ error: 'Output no encontrado' }, { status: 404 })
    }

    // Buscar el prompt asociado para obtener los textos y configuración
    const prompt = state.prompts.find((p) => p.id === output.promptId)

    // Buscar el ángulo para contexto
    const angle = prompt ? state.angles.find((a) => a.id === prompt.angleId) : null

    // Determinar el textOverlay a usar
    let textOverlay: TextOverlay
    let textPosition: 'top' | 'center' | 'bottom' = 'center'
    let layout: OverlayLayout = 'gradient-bottom'
    let showLogo = false

    if (prompt?.textOverlay && (prompt.textOverlay.headline || prompt.textOverlay.subheadline)) {
      // Usar textOverlay del prompt
      textOverlay = prompt.textOverlay as TextOverlay
      textPosition = prompt.textPosition || 'center'
      layout = prompt.overlayLayout || suggestLayout(textOverlay)
      showLogo = prompt.showLogo ?? false
    } else {
      // Generar textos de fallback basados en el ángulo/campaña
      textOverlay = {
        headline: 'HASTA 45% OFF',
        subheadline: angle?.title || '12 cuotas sin interés',
        cta: 'Cotizá ahora',
      }
    }

    // Override desde URL si se especifica
    if (layoutParam && VALID_LAYOUTS.includes(layoutParam as OverlayLayout)) {
      layout = layoutParam as OverlayLayout
    }
    if (logoParam !== null) {
      showLogo = logoParam === 'true'
    }

    console.log(`[API] Generando imagen con overlay para output: ${outputId}`)
    console.log(`[API] Layout: ${layout}`)
    console.log(`[API] ShowLogo: ${showLogo}`)
    console.log(`[API] TextOverlay:`, textOverlay)

    // Aplicar overlay
    const imageBuffer = await applyTextOverlayToUrl(output.url, {
      textOverlay,
      textPosition,
      layout,
      showLogo,
    })

    // Devolver imagen con headers correctos
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="pax-ad-${outputId}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error generando overlay:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generando overlay' },
      { status: 500 }
    )
  }
}
