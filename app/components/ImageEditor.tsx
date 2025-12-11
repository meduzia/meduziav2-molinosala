'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

// Tipos
interface TextOverlay {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  fill: string
  top: number
  left: number
  textAlign: 'left' | 'center' | 'right'
  shadow?: string
}

interface EditorState {
  title: TextOverlay
  subtitle: TextOverlay
  logoVisible: boolean
  logoPosition: { top: number; left: number }
  logoScale: number
}

interface ImageEditorProps {
  imageUrl: string
  initialTitle?: string
  initialSubtitle?: string
  onSave: (finalImageUrl: string, editorState: EditorState) => void
  onCancel: () => void
  campaignId: string
  promptId: string
}

// Constantes de fuentes
const TITLE_FONT = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif'
const SUBTITLE_FONT = '"Quicksand", "Segoe UI", Tahoma, sans-serif'

export default function ImageEditor({
  imageUrl,
  initialTitle = 'HASTA 50% OFF',
  initialSubtitle = 'Tu próxima aventura te espera',
  onSave,
  onCancel,
  campaignId,
  promptId,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1920 })
  const [displayScale, setDisplayScale] = useState(0.5)

  // Estado del editor
  const [editorState, setEditorState] = useState<EditorState>({
    title: {
      id: 'title',
      text: initialTitle,
      fontFamily: TITLE_FONT,
      fontSize: 72,
      fill: '#FFFFFF',
      top: 100,
      left: 540,
      textAlign: 'center',
      shadow: '3px 3px 6px rgba(0,0,0,0.8)',
    },
    subtitle: {
      id: 'subtitle',
      text: initialSubtitle,
      fontFamily: SUBTITLE_FONT,
      fontSize: 36,
      fill: '#FFFFFF',
      top: 190,
      left: 540,
      textAlign: 'center',
      shadow: '2px 2px 4px rgba(0,0,0,0.6)',
    },
    logoVisible: true,
    logoPosition: { top: 1800, left: 540 },
    logoScale: 1,
  })

  // Referencias a objetos de Fabric
  const titleRef = useRef<fabric.IText | null>(null)
  const subtitleRef = useRef<fabric.IText | null>(null)

  // Calcular escala de visualización
  const calculateDisplayScale = useCallback((imgWidth: number, imgHeight: number) => {
    if (!containerRef.current) return 0.5

    const containerRect = containerRef.current.getBoundingClientRect()
    const availableWidth = containerRect.width - 40 // padding
    const availableHeight = containerRect.height - 40

    const scaleX = availableWidth / imgWidth
    const scaleY = availableHeight / imgHeight

    return Math.min(scaleX, scaleY, 1) // No escalar más de 1x
  }, [])

  // Inicializar canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return

    // Precargar fuentes
    const preloadFonts = async () => {
      try {
        await document.fonts.load('72px Impact')
        await document.fonts.load('36px Quicksand')
      } catch (e) {
        console.log('Font preload warning:', e)
      }
    }

    preloadFonts().then(() => {
      // Crear canvas temporal para obtener dimensiones de imagen
      const proxyUrl = imageUrl.startsWith('/')
        ? imageUrl
        : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`

      // Cargar imagen para obtener dimensiones
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const imgWidth = img.width
        const imgHeight = img.height

        console.log(`[ImageEditor] Imagen cargada: ${imgWidth}x${imgHeight}`)

        // Actualizar tamaño del canvas
        setCanvasSize({ width: imgWidth, height: imgHeight })

        // Calcular escala de visualización
        const scale = calculateDisplayScale(imgWidth, imgHeight)
        setDisplayScale(scale)

        // Crear canvas de Fabric con el tamaño de la imagen
        const canvas = new fabric.Canvas(canvasRef.current!, {
          width: imgWidth,
          height: imgHeight,
          backgroundColor: '#000000',
          selection: true,
        })

        fabricCanvasRef.current = canvas

        // Cargar imagen como fondo
        fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: 'anonymous' }).then((fabricImg) => {
          if (!fabricImg || !fabricCanvasRef.current) return

          // La imagen ocupa todo el canvas
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

          // Posiciones relativas al tamaño de imagen
          const titleTop = imgHeight * 0.05
          const subtitleTop = imgHeight * 0.12
          const logoTop = imgHeight * 0.92
          const centerX = imgWidth / 2

          // Agregar título con Impact
          const titleText = new fabric.IText(editorState.title.text, {
            fontFamily: TITLE_FONT,
            fontSize: Math.round(imgHeight * 0.045), // Proporcional
            fill: '#FFFFFF',
            top: titleTop,
            left: centerX,
            originX: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            shadow: new fabric.Shadow({
              color: 'rgba(0,0,0,0.8)',
              blur: 8,
              offsetX: 3,
              offsetY: 3,
            }),
            stroke: '#000000',
            strokeWidth: 1,
          })
          titleRef.current = titleText
          canvas.add(titleText)

          // Agregar subtítulo con Quicksand
          const subtitleText = new fabric.IText(editorState.subtitle.text, {
            fontFamily: SUBTITLE_FONT,
            fontSize: Math.round(imgHeight * 0.025),
            fill: '#FFFFFF',
            top: subtitleTop,
            left: centerX,
            originX: 'center',
            textAlign: 'center',
            fontWeight: '500',
            shadow: new fabric.Shadow({
              color: 'rgba(0,0,0,0.6)',
              blur: 4,
              offsetX: 2,
              offsetY: 2,
            }),
          })
          subtitleRef.current = subtitleText
          canvas.add(subtitleText)

          // Agregar logo PAX
          const logoText = new fabric.IText('pax assistance', {
            fontFamily: 'Arial, sans-serif',
            fontSize: Math.round(imgHeight * 0.018),
            fill: '#FFFFFF',
            top: logoTop,
            left: centerX,
            originX: 'center',
            fontWeight: 'bold',
            shadow: new fabric.Shadow({
              color: 'rgba(0,0,0,0.5)',
              blur: 4,
              offsetX: 1,
              offsetY: 1,
            }),
          })
          canvas.add(logoText)

          // Actualizar estado con posiciones
          setEditorState(prev => ({
            ...prev,
            title: { ...prev.title, top: titleTop, left: centerX, fontSize: Math.round(imgHeight * 0.045) },
            subtitle: { ...prev.subtitle, top: subtitleTop, left: centerX, fontSize: Math.round(imgHeight * 0.025) },
            logoPosition: { top: logoTop, left: centerX },
          }))

          setIsLoading(false)
          canvas.renderAll()
        }).catch((err) => {
          console.error('Error loading fabric image:', err)
          setIsLoading(false)
        })

        // Event listeners
        canvas.on('selection:created', (e) => {
          if (e.selected && e.selected[0]) {
            setSelectedObject(e.selected[0])
          }
        })

        canvas.on('selection:updated', (e) => {
          if (e.selected && e.selected[0]) {
            setSelectedObject(e.selected[0])
          }
        })

        canvas.on('selection:cleared', () => {
          setSelectedObject(null)
        })
      }

      img.onerror = (err) => {
        console.error('Error loading image:', err)
        setIsLoading(false)
      }

      img.src = proxyUrl
    })

    // Cleanup
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [imageUrl, calculateDisplayScale])

  // Recalcular escala cuando cambia el tamaño del contenedor
  useEffect(() => {
    const handleResize = () => {
      if (canvasSize.width && canvasSize.height) {
        const scale = calculateDisplayScale(canvasSize.width, canvasSize.height)
        setDisplayScale(scale)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [canvasSize, calculateDisplayScale])

  // Actualizar título
  const updateTitle = useCallback((text: string) => {
    if (titleRef.current && fabricCanvasRef.current) {
      titleRef.current.set('text', text)
      setEditorState((prev) => ({
        ...prev,
        title: { ...prev.title, text },
      }))
      fabricCanvasRef.current.renderAll()
    }
  }, [])

  // Actualizar subtítulo
  const updateSubtitle = useCallback((text: string) => {
    if (subtitleRef.current && fabricCanvasRef.current) {
      subtitleRef.current.set('text', text)
      setEditorState((prev) => ({
        ...prev,
        subtitle: { ...prev.subtitle, text },
      }))
      fabricCanvasRef.current.renderAll()
    }
  }, [])

  // Cambiar tamaño de fuente
  const changeFontSize = useCallback((type: 'title' | 'subtitle', size: number) => {
    const ref = type === 'title' ? titleRef : subtitleRef
    if (ref.current && fabricCanvasRef.current) {
      ref.current.set('fontSize', size)
      setEditorState((prev) => ({
        ...prev,
        [type]: { ...prev[type], fontSize: size },
      }))
      fabricCanvasRef.current.renderAll()
    }
  }, [])

  // Centrar objeto seleccionado
  const centerSelected = useCallback(() => {
    if (selectedObject && fabricCanvasRef.current) {
      const centerX = canvasSize.width / 2
      selectedObject.set({
        left: centerX,
        originX: 'center',
      })
      fabricCanvasRef.current.renderAll()
    }
  }, [selectedObject, canvasSize.width])

  // Guardar imagen
  const handleSave = async () => {
    if (!fabricCanvasRef.current) return

    setIsSaving(true)

    try {
      // Deseleccionar todo antes de exportar
      fabricCanvasRef.current.discardActiveObject()
      fabricCanvasRef.current.renderAll()

      // Exportar como PNG
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      })

      // Enviar al servidor
      const response = await fetch(`/api/v2/campaigns/${campaignId}/editor/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          imageData: dataUrl,
          editorState,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la imagen')
      }

      const result = await response.json()
      console.log('[ImageEditor] Guardado exitoso:', result)

      onSave(result.finalImageUrl, editorState)
    } catch (error) {
      console.error('[ImageEditor] Error al guardar:', error)
      alert('Error al guardar la imagen. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <h2 className="text-xl font-bold text-white">Editor de Imagen</h2>
          <span className="text-sm text-gray-400">
            {canvasSize.width} x {canvasSize.height}px
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Guardando...' : 'Guardar y Aprobar'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel de controles */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
          <div className="space-y-6">
            {/* Título */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Título <span className="text-gray-500">(Impact)</span>
              </label>
              <input
                type="text"
                value={editorState.title.text}
                onChange={(e) => updateTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: TITLE_FONT }}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-16">Tamaño:</label>
                <input
                  type="range"
                  min="24"
                  max="200"
                  value={editorState.title.fontSize}
                  onChange={(e) => changeFontSize('title', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-10 text-right">
                  {editorState.title.fontSize}px
                </span>
              </div>
            </div>

            {/* Subtítulo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Subtítulo <span className="text-gray-500">(Quicksand)</span>
              </label>
              <input
                type="text"
                value={editorState.subtitle.text}
                onChange={(e) => updateSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: SUBTITLE_FONT }}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-16">Tamaño:</label>
                <input
                  type="range"
                  min="16"
                  max="100"
                  value={editorState.subtitle.fontSize}
                  onChange={(e) => changeFontSize('subtitle', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-10 text-right">
                  {editorState.subtitle.fontSize}px
                </span>
              </div>
            </div>

            {/* Herramientas */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Herramientas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={centerSelected}
                  disabled={!selectedObject}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Centrar
                </button>
              </div>
            </div>

            {/* Escala de visualización */}
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-400">
                Vista: {Math.round(displayScale * 100)}%
              </div>
            </div>

            {/* Instrucciones */}
            <div className="p-3 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-200 mb-2">
                Instrucciones
              </h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Arrastra los textos para posicionarlos</li>
                <li>• Doble clic para editar texto directamente</li>
                <li>• Usa los controles para ajustar tamaños</li>
                <li>• Guarda cuando estés satisfecho</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-gray-950 overflow-auto p-4"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-white text-lg">Cargando imagen...</div>
              </div>
            </div>
          )}
          <div
            className="relative shadow-2xl border border-gray-700"
            style={{
              transform: `scale(${displayScale})`,
              transformOrigin: 'center center',
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
