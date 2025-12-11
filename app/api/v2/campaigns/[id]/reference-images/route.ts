/**
 * API v2 - Reference Images
 *
 * POST /api/v2/campaigns/[id]/reference-images/assign
 * Asigna una imagen de referencia a un arquetipo, ángulo o prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/campaign-types'
import {
  getCampaignState,
  setArchetypeReferenceImage,
  setAngleReferenceImage,
  setPromptReferenceImage,
  addReferenceImage,
  removeReferenceImage,
  getReferenceImages,
} from '@/lib/stores/campaign-store'

interface AssignReferenceImageBody {
  targetType: 'archetype' | 'angle' | 'prompt'
  targetId: string
  referenceImageId: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { id } = await params
    const body: AssignReferenceImageBody = await request.json()

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    let result = false

    switch (body.targetType) {
      case 'archetype':
        result = setArchetypeReferenceImage(id, body.targetId, body.referenceImageId)
        break
      case 'angle':
        result = setAngleReferenceImage(id, body.targetId, body.referenceImageId)
        break
      case 'prompt':
        result = setPromptReferenceImage(id, body.targetId, body.referenceImageId)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'targetType inválido' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: `${body.targetType} no encontrado` },
        { status: 404 }
      )
    }

    console.log(`[API] Reference image ${body.referenceImageId ? 'asignada' : 'removida'} a ${body.targetType} ${body.targetId}`)

    return NextResponse.json({
      success: true,
      data: { success: true },
      message: body.referenceImageId
        ? 'Imagen de referencia asignada'
        : 'Imagen de referencia removida',
    })
  } catch (error) {
    console.error('[API] Error asignando reference image:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ images: ReturnType<typeof getReferenceImages> }>>> {
  try {
    const { id } = await params

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    const images = getReferenceImages(id)

    return NextResponse.json({
      success: true,
      data: { images },
    })
  } catch (error) {
    console.error('[API] Error obteniendo reference images:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// PUT - Agregar nueva imagen de referencia a la campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean; imageId: string }>>> {
  try {
    const { id } = await params
    const body = await request.json()

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Crear la imagen con el campaignId correcto
    const newImage = {
      ...body,
      campaignId: id,
    }

    const result = addReferenceImage(id, newImage)

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Error al agregar imagen' },
        { status: 500 }
      )
    }

    console.log(`[API] Nueva imagen de referencia agregada: ${newImage.id} a campaña ${id}`)

    return NextResponse.json({
      success: true,
      data: { success: true, imageId: newImage.id },
      message: 'Imagen de referencia agregada',
    })
  } catch (error) {
    console.error('[API] Error agregando reference image:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'imageId es requerido' },
        { status: 400 }
      )
    }

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    const result = removeReferenceImage(id, imageId)

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    console.log(`[API] Reference image ${imageId} eliminada de campaña ${id}`)

    return NextResponse.json({
      success: true,
      data: { success: true },
      message: 'Imagen de referencia eliminada',
    })
  } catch (error) {
    console.error('[API] Error eliminando reference image:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
