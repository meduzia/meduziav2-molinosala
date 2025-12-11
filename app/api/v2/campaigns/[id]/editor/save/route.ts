import { NextRequest, NextResponse } from 'next/server'
import { updateOutputEditedUrlByPromptId } from '@/lib/stores/campaign-store'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body = await request.json()
    const { promptId, imageData, editorState } = body

    if (!promptId || !imageData) {
      return NextResponse.json(
        { error: 'promptId and imageData are required' },
        { status: 400 }
      )
    }

    // Extraer base64 data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const filename = `${campaignId}/edited_${promptId}_${timestamp}.png`

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('edited-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error('[Editor Save] Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Error al subir imagen a storage: ' + error.message },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('edited-images')
      .getPublicUrl(filename)

    const finalImageUrl = publicUrlData.publicUrl

    // Persistir la URL editada en el store (para que aparezca en Gallery)
    const updated = updateOutputEditedUrlByPromptId(campaignId, promptId, finalImageUrl)
    console.log(`[Editor Save] Image saved to Supabase: ${finalImageUrl}, store updated: ${updated}`)

    return NextResponse.json({
      success: true,
      finalImageUrl,
      editorState,
      message: 'Imagen guardada exitosamente',
    })
  } catch (error) {
    console.error('[Editor Save] Error:', error)
    return NextResponse.json(
      { error: 'Error al guardar la imagen' },
      { status: 500 }
    )
  }
}
