/**
 * API para servir imágenes de referencia como URLs públicas
 *
 * GET /api/images/[id] - Retorna la imagen como archivo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCampaignState } from '@/lib/stores/campaign-store'

// Store temporal para imágenes (en memoria)
// En producción, esto debería estar en una DB o storage
declare global {
  // eslint-disable-next-line no-var
  var __imageStore: Map<string, { data: string; mimeType: string }> | undefined
}

const imageStore = globalThis.__imageStore ?? new Map<string, { data: string; mimeType: string }>()
globalThis.__imageStore = imageStore

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: imageId } = await params

    // Buscar la imagen en el store
    const stored = imageStore.get(imageId)
    if (stored) {
      // Decodificar base64 y retornar como imagen
      const buffer = Buffer.from(stored.data, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': stored.mimeType,
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    }

    // Si no está en el store, buscar en todas las campañas
    // Esto es ineficiente pero funciona para desarrollo
    const allCampaigns = getAllCampaignIds()
    for (const campaignId of allCampaigns) {
      const state = getCampaignState(campaignId)
      if (!state) continue

      const refImage = state.referenceImages.find((img) => img.id === imageId)
      if (refImage && refImage.url.startsWith('data:')) {
        // Parsear data URL
        const matches = refImage.url.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          const mimeType = matches[1]
          const base64Data = matches[2]

          // Guardar en store para cache
          imageStore.set(imageId, { data: base64Data, mimeType })

          // Retornar imagen
          const buffer = Buffer.from(base64Data, 'base64')
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=31536000',
            },
          })
        }
      }
    }

    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  } catch (error) {
    console.error('[API Images] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper para obtener todos los IDs de campaña
// En producción esto vendría de la DB
function getAllCampaignIds(): string[] {
  // @ts-ignore - Acceso al store global
  const store = globalThis.__campaignStore as Map<string, unknown> | undefined
  if (!store) return []
  return Array.from(store.keys())
}

// Función para registrar una imagen y obtener su URL pública
export function registerImageForPublicUrl(
  imageId: string,
  dataUrl: string
): string | null {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return null

  const mimeType = matches[1]
  const base64Data = matches[2]

  imageStore.set(imageId, { data: base64Data, mimeType })

  // Retornar la URL relativa (el llamador debe construir la URL completa)
  return `/api/images/${imageId}`
}
