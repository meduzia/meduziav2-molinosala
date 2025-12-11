'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Save, Loader2, X, Eye, EyeOff } from 'lucide-react'

const TITLE_FONT = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif'
const SUBTITLE_FONT = '"Quicksand", "Segoe UI", Tahoma, sans-serif'

interface InlineImageEditorProps {
  imageUrl: string
  initialTitle?: string
  initialSubtitle?: string
  onSave: (finalImageUrl: string) => void
  onCancel: () => void
  campaignId: string
  promptId: string
}

export default function InlineImageEditor({
  imageUrl,
  initialTitle = '50% OFF',
  initialSubtitle = 'Tu próxima aventura te espera',
  onSave,
  onCancel,
  campaignId,
  promptId,
}: InlineImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1920 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)

  // Estados para los degradados
  const [showTopGradient, setShowTopGradient] = useState(true)
  const [showBottomGradient, setShowBottomGradient] = useState(true)

  // Referencias a los objetos de degradado
  const topGradientRef = useRef<fabric.Rect | null>(null)
  const bottomGradientRef = useRef<fabric.Rect | null>(null)

  useEffect(() => {
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return

    const proxyUrl = imageUrl.startsWith('/')
      ? imageUrl
      : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (!canvasRef.current || fabricCanvasRef.current) return

      const imgWidth = img.width
      const imgHeight = img.height

      setCanvasSize({ width: imgWidth, height: imgHeight })
      setIsInitialized(true)

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: imgWidth,
        height: imgHeight,
        backgroundColor: '#000000',
        selection: true,
      })

      fabricCanvasRef.current = canvas

      // Detectar selección de objetos
      canvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })
      canvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })
      canvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: 'anonymous' }).then((fabricImg) => {
        if (!fabricImg || !fabricCanvasRef.current) return

        fabricImg.set({
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          selectable: false,
          evented: false,
        })

        canvas.add(fabricImg)
        canvas.sendObjectToBack(fabricImg)

        const titleTop = imgHeight * 0.05
        const subtitleTop = imgHeight * 0.12
        const logoTop = imgHeight * 0.88
        const centerX = imgWidth / 2
        const gradientHeight = imgHeight * 0.35

        // Degradado superior (violeta a transparente, de arriba hacia abajo)
        const topGradient = new fabric.Rect({
          left: 0,
          top: 0,
          width: imgWidth,
          height: gradientHeight,
          selectable: false,
          evented: false,
        })
        topGradient.set('fill', new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: 0, y2: gradientHeight },
          colorStops: [
            { offset: 0, color: 'rgba(91,33,182,0.95)' },
            { offset: 0.5, color: 'rgba(91,33,182,0.5)' },
            { offset: 1, color: 'rgba(91,33,182,0)' },
          ],
        }))
        canvas.add(topGradient)
        topGradientRef.current = topGradient

        // Degradado inferior (violeta a transparente, de abajo hacia arriba)
        const bottomGradient = new fabric.Rect({
          left: 0,
          top: imgHeight - gradientHeight,
          width: imgWidth,
          height: gradientHeight,
          selectable: false,
          evented: false,
        })
        bottomGradient.set('fill', new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: gradientHeight, x2: 0, y2: 0 },
          colorStops: [
            { offset: 0, color: 'rgba(91,33,182,0.95)' },
            { offset: 0.5, color: 'rgba(91,33,182,0.5)' },
            { offset: 1, color: 'rgba(91,33,182,0)' },
          ],
        }))
        canvas.add(bottomGradient)
        bottomGradientRef.current = bottomGradient

        // Título - Impact sin sombra
        const titleText = new fabric.IText(initialTitle, {
          fontFamily: TITLE_FONT,
          fontSize: Math.round(imgHeight * 0.05),
          fill: '#FFFFFF',
          top: titleTop,
          left: centerX,
          originX: 'center',
          textAlign: 'center',
          fontWeight: 'bold',
        })
        canvas.add(titleText)

        // Subtítulo - Quicksand sin sombra
        const subtitleText = new fabric.IText(initialSubtitle, {
          fontFamily: SUBTITLE_FONT,
          fontSize: Math.round(imgHeight * 0.028),
          fill: '#FFFFFF',
          top: subtitleTop,
          left: centerX,
          originX: 'center',
          textAlign: 'center',
          fontWeight: '500',
        })
        canvas.add(subtitleText)

        // Logo PAX - cargar imagen PNG
        const logoUrl = '/assets/LOGO-PAX-16.png'
        fabric.FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' }).then((logoImg) => {
          if (!logoImg || !fabricCanvasRef.current) return

          const logoScale = (imgWidth * 0.25) / (logoImg.width || 320)
          logoImg.set({
            left: centerX,
            top: logoTop,
            originX: 'center',
            originY: 'center',
            scaleX: logoScale,
            scaleY: logoScale,
          })

          canvas.add(logoImg)
          canvas.renderAll()
        }).catch((err) => {
          console.error('Error loading logo:', err)
        })

        setIsLoading(false)
        canvas.renderAll()
      }).catch((err) => {
        console.error('Error loading fabric image:', err)
        setIsLoading(false)
      })
    }

    img.onerror = (err) => {
      console.error('Error loading image:', err)
      setIsLoading(false)
    }

    img.src = proxyUrl
  }, [imageUrl, initialTitle, initialSubtitle, isInitialized])

  // Toggle degradado superior
  const toggleTopGradient = () => {
    if (!fabricCanvasRef.current || !topGradientRef.current) return
    const newValue = !showTopGradient
    setShowTopGradient(newValue)
    topGradientRef.current.set('visible', newValue)
    fabricCanvasRef.current.renderAll()
  }

  // Toggle degradado inferior
  const toggleBottomGradient = () => {
    if (!fabricCanvasRef.current || !bottomGradientRef.current) return
    const newValue = !showBottomGradient
    setShowBottomGradient(newValue)
    bottomGradientRef.current.set('visible', newValue)
    fabricCanvasRef.current.renderAll()
  }

  const handleDeleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return
    fabricCanvasRef.current.remove(selectedObject)
    setSelectedObject(null)
    fabricCanvasRef.current.renderAll()
  }

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return

    setIsSaving(true)

    try {
      fabricCanvasRef.current.discardActiveObject()
      fabricCanvasRef.current.renderAll()

      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      })

      const response = await fetch(`/api/v2/campaigns/${campaignId}/editor/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          imageData: dataUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la imagen')
      }

      const result = await response.json()
      onSave(result.finalImageUrl)
    } catch (error) {
      console.error('[InlineEditor] Error al guardar:', error)
      alert('Error al guardar la imagen. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 800
  const scale = Math.min(1, maxHeight / canvasSize.height, 600 / canvasSize.width)

  // Calcular dimensiones escaladas para el contenedor
  const scaledWidth = canvasSize.width * scale
  const scaledHeight = canvasSize.height * scale

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      {/* Contenedor principal */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Controles arriba del marco */}
        <div className="flex items-center gap-3">
          {selectedObject && (
            <button
              onClick={handleDeleteSelected}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl transition-all"
              title="Eliminar elemento"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar
              </>
            )}
          </button>
        </div>

        {/* Contenedor de imagen + ojitos */}
        <div className="flex items-stretch gap-3">
          {/* Marco degradado ajustado */}
          <div
            className="relative rounded-xl p-[4px]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 25%, #7c3aed 50%, #6366f1 75%, #7c3aed 100%)',
            }}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                width: scaledWidth + 8,
                height: scaledHeight + 8,
                padding: 4,
                backgroundColor: '#020617',
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10 rounded-lg">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                </div>
              )}

              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          {/* Ojitos a la derecha */}
          <div className="flex flex-col justify-between py-4">
            {/* Ojito degradado superior (arriba) */}
            <button
              onClick={toggleTopGradient}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                showTopGradient
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={showTopGradient ? 'Ocultar degradado superior' : 'Mostrar degradado superior'}
            >
              {showTopGradient ? (
                <Eye className="w-6 h-6 text-white" />
              ) : (
                <EyeOff className="w-6 h-6 text-slate-400" />
              )}
            </button>

            {/* Ojito degradado inferior (abajo) */}
            <button
              onClick={toggleBottomGradient}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                showBottomGradient
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={showBottomGradient ? 'Ocultar degradado inferior' : 'Mostrar degradado inferior'}
            >
              {showBottomGradient ? (
                <Eye className="w-6 h-6 text-white" />
              ) : (
                <EyeOff className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
