'use client'

import { Download, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { GeneratedAsset } from '@/lib/agents/types'

interface ImageGalleryProps {
  images?: GeneratedAsset[]
  campaignId?: string
}

export const ImageGallery = ({ images = [], campaignId }: ImageGalleryProps) => {
  const handleDownload = async (image: GeneratedAsset) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (!images || images.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8">
          <div className="text-center text-gray-500">
            <ImageIcon className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>No hay imágenes generadas</p>
            <p className="text-sm">Selecciona prompts y genera para ver aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedImages = images.filter((img) => img.status === 'completed')
  const processingImages = images.filter((img) => img.status === 'processing')
  const failedImages = images.filter((img) => img.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedImages.length}</div>
              <div className="text-xs text-gray-500 mt-1">Completadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{processingImages.length}</div>
              <div className="text-xs text-gray-500 mt-1">En proceso</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedImages.length}</div>
              <div className="text-xs text-gray-500 mt-1">Errores</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imágenes Completadas */}
      {completedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes Generadas</CardTitle>
            <CardDescription>{completedImages.length} imagen(es) completada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden bg-gray-100 aspect-square"
                >
                  <img
                    src={image.url}
                    alt={`Generated image ${image.id}`}
                    className="w-full h-full object-cover group-hover:opacity-75 transition"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition gap-1"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </Button>
                  </div>
                  {image.metadata?.angleName && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition">
                      {image.metadata.angleName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imágenes en Proceso */}
      {processingImages.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Generando...</CardTitle>
            <CardDescription className="text-blue-700">
              {processingImages.length} imagen(es) en proceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processingImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-blue-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {image.metadata?.angleName || `Imagen ${image.id.slice(0, 8)}`}
                      </div>
                      <div className="text-xs text-gray-500">Generando...</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imágenes con Error */}
      {failedImages.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Errores</CardTitle>
            <CardDescription className="text-red-700">
              {failedImages.length} imagen(es) con error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-start gap-3 p-3 bg-white rounded border border-red-200"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {image.metadata?.angleName || `Imagen ${image.id.slice(0, 8)}`}
                    </div>
                    {image.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">{image.errorMessage}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
