import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy para descargar imágenes/videos de URLs externas
 * Esto evita problemas de CORS al descargar contenido desde el cliente
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
  }

  try {
    // Validar que sea una URL válida
    const parsedUrl = new URL(url)

    // Lista de dominios permitidos para seguridad
    const allowedDomains = [
      'tempfile.aiquickdraw.com',
      'aiquickdraw.com',
      'i.ibb.co',
      'ibb.co',
      'localhost',
      'kie.ai',
      'api.kie.ai',
      'cdn.kie.ai',
    ]

    const isAllowed = allowedDomains.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Dominio no permitido' },
        { status: 403 }
      )
    }

    // Descargar el archivo
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error descargando: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    // Devolver el archivo con los headers correctos
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Proxy Download] Error:', error)
    return NextResponse.json(
      { error: 'Error descargando archivo' },
      { status: 500 }
    )
  }
}
