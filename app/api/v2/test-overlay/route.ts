/**
 * API v2 - Test overlay de texto
 *
 * GET /api/v2/test-overlay?url=...&headline=...&subheadline=...&cta=...&badge=...&position=...&layout=...&logo=...
 *
 * Endpoint de prueba para verificar el sistema de overlay con múltiples layouts
 *
 * Layouts disponibles:
 * - gradient-bottom: Gradiente violeta en parte inferior (default)
 * - solid-band: Banda sólida violeta
 * - floating-text: Textos flotantes con sombra
 * - testimonial: Para testimonios con estrellas
 * - bullet-points: Lista de beneficios (usar | para separar items en subheadline)
 * - minimal: Solo headline grande
 */

import { NextRequest, NextResponse } from 'next/server'
import { applyTextOverlayToUrl, type OverlayLayout } from '@/lib/agents-v2/text-overlay-service'

const VALID_LAYOUTS: OverlayLayout[] = [
  'gradient-bottom',
  'solid-band',
  'floating-text',
  'testimonial',
  'bullet-points',
  'minimal',
]

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)

    const imageUrl = searchParams.get('url')
    const headline = searchParams.get('headline') || 'HASTA 45% OFF'
    const subheadline = searchParams.get('subheadline') || '12 cuotas sin interés'
    const cta = searchParams.get('cta') || 'Cotizá ahora'
    const badge = searchParams.get('badge') || ''
    const position = (searchParams.get('position') as 'top' | 'center' | 'bottom') || 'bottom'
    const layoutParam = searchParams.get('layout') || 'gradient-bottom'
    const showLogo = searchParams.get('logo') === 'true'

    // Validar layout
    const layout: OverlayLayout = VALID_LAYOUTS.includes(layoutParam as OverlayLayout)
      ? (layoutParam as OverlayLayout)
      : 'gradient-bottom'

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Se requiere el parámetro url',
          help: {
            layouts: VALID_LAYOUTS,
            example:
              '/api/v2/test-overlay?url=IMAGE_URL&headline=50%25%20OFF&layout=gradient-bottom&logo=true',
          },
        },
        { status: 400 }
      )
    }

    console.log(`[Test Overlay] URL: ${imageUrl}`)
    console.log(`[Test Overlay] Layout: ${layout}`)
    console.log(`[Test Overlay] Headline: ${headline}`)
    console.log(`[Test Overlay] Subheadline: ${subheadline}`)
    console.log(`[Test Overlay] CTA: ${cta}`)
    console.log(`[Test Overlay] Position: ${position}`)
    console.log(`[Test Overlay] ShowLogo: ${showLogo}`)

    const imageBuffer = await applyTextOverlayToUrl(imageUrl, {
      textOverlay: {
        headline,
        subheadline,
        cta,
        badge: badge || undefined,
      },
      textPosition: position,
      layout,
      showLogo,
    })

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="pax-overlay-${layout}.png"`,
      },
    })
  } catch (error) {
    console.error('[Test Overlay] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error aplicando overlay' },
      { status: 500 }
    )
  }
}
