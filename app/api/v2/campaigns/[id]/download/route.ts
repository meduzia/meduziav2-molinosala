/**
 * API v2 - Download ZIP
 *
 * POST /api/v2/campaigns/[id]/download - Generate ZIP with filtered content
 */

import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getCampaignStateAsync } from '@/lib/stores/campaign-store'
import { readFile } from 'fs/promises'
import path from 'path'

interface DownloadRequest {
  typeFilter: 'all' | 'images' | 'videos'
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected'
  contentStatuses: Record<string, 'pending' | 'approved' | 'rejected'>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body: DownloadRequest = await request.json()
    const { typeFilter, statusFilter, contentStatuses } = body

    // Get campaign state
    const state = await getCampaignStateAsync(id)
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Filter outputs - only those approved for client first
    const clientApprovedOutputs = (state.outputs || []).filter(
      output => output.approvedForClient === true
    )

    // Apply type filter
    let filteredOutputs = clientApprovedOutputs.filter(output => {
      if (typeFilter === 'images' && output.type !== 'image') return false
      if (typeFilter === 'videos' && output.type !== 'video') return false
      return true
    })

    // Apply status filter (using client feedback statuses)
    if (statusFilter !== 'all') {
      filteredOutputs = filteredOutputs.filter(output => {
        const status = contentStatuses[output.id] || output.clientFeedback || 'pending'
        return status === statusFilter
      })
    }

    if (filteredOutputs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay contenido para descargar con los filtros seleccionados' },
        { status: 400 }
      )
    }

    // Create ZIP
    const zip = new JSZip()

    // Create folders for organization
    const imagesFolder = zip.folder('imagenes')
    const videosFolder = zip.folder('videos')

    // Download and add files to ZIP
    let imageCount = 0
    let videoCount = 0

    for (const output of filteredOutputs) {
      try {
        // Use editedUrl if available, otherwise use original url
        const urlToFetch = output.editedUrl || output.url
        let buffer: Buffer
        let extension = ''

        // Check if it's a local file (starts with /) or remote URL
        if (urlToFetch.startsWith('/')) {
          // Local file - read from filesystem
          const localPath = path.join(process.cwd(), 'public', urlToFetch)
          try {
            buffer = await readFile(localPath)
            // Get extension from filename
            const ext = path.extname(urlToFetch).toLowerCase()
            extension = ext || '.png'
          } catch (fsError) {
            console.error(`Failed to read local file ${localPath}:`, fsError)
            continue
          }
        } else {
          // Remote URL - fetch normally
          const response = await fetch(urlToFetch)
          if (!response.ok) {
            console.error(`Failed to fetch ${urlToFetch}: ${response.status}`)
            continue
          }

          const arrayBuffer = await response.arrayBuffer()
          buffer = Buffer.from(arrayBuffer)

          // Determine extension from content type
          const contentType = response.headers.get('content-type') || ''
          if (output.type === 'image') {
            if (contentType.includes('png')) extension = '.png'
            else if (contentType.includes('webp')) extension = '.webp'
            else if (contentType.includes('gif')) extension = '.gif'
            else extension = '.jpg'
          } else {
            if (contentType.includes('webm')) extension = '.webm'
            else extension = '.mp4'
          }
        }

        // Add to ZIP
        if (output.type === 'image') {
          if (!extension) extension = '.png'
          imageCount++
          const filename = `imagen_${imageCount}${extension}`
          imagesFolder?.file(filename, buffer)
        } else {
          if (!extension) extension = '.mp4'
          videoCount++
          const filename = `video_${videoCount}${extension}`
          videosFolder?.file(filename, buffer)
        }
      } catch (error) {
        console.error(`Error downloading ${output.url}:`, error)
        continue
      }
    }

    // Check if we have any content
    if (imageCount === 0 && videoCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudo descargar ningún contenido' },
        { status: 500 }
      )
    }

    // Remove empty folders
    if (imageCount === 0) zip.remove('imagenes')
    if (videoCount === 0) zip.remove('videos')

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Create filename with campaign name and filter info
    const campaignName = state.campaign.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
    const filterInfo = `${typeFilter === 'all' ? 'todo' : typeFilter}_${statusFilter === 'all' ? 'todos' : statusFilter}`
    const filename = `${campaignName}_${filterInfo}.zip`

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[API] Error generating ZIP:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando ZIP',
      },
      { status: 500 }
    )
  }
}
