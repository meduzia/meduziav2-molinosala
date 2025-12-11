'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Upload, X, Image as ImageIcon, FileText, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ReferenceImage } from '@/lib/types/campaign-types'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    brief: '',
    coreMessage: '',
  })

  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    )

    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string

        // Create image to get dimensions
        const img = new window.Image()
        img.onload = () => {
          const newImage: ReferenceImage = {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId: '', // Will be set when campaign is created
            filename: file.name,
            url: url,
            width: img.width,
            height: img.height,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }
          setReferenceImages(prev => [...prev, newImage])
        }
        img.src = url
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Remove image
  const handleRemoveImage = useCallback((imageId: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== imageId))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.brief.trim()) {
      setError('El brief es requerido')
      return
    }

    setLoading(true)

    try {
      // Update campaign IDs in reference images
      const campaignId = `campaign_${Date.now()}`
      const imagesWithCampaignId = referenceImages.map(img => ({
        ...img,
        campaignId
      }))

      const res = await fetch('/api/v2/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referenceImages: imagesWithCampaignId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/studio/${data.data.id}`)
      } else {
        setError(data.error || 'Error creando campaña')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container max-w-4xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Studio
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                Nueva Campaña
              </h1>
              <p className="text-slate-400 mt-1">
                Define el brief y carga imágenes de referencia
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Info Card */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Información de la Campaña</CardTitle>
                  <CardDescription className="text-slate-400">
                    El brief será usado por la IA para generar arquetipos estratégicos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 font-medium">
                  Nombre de la Campaña <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Lanzamiento Producto X Q1 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>

              {/* Brief */}
              <div className="space-y-2">
                <Label htmlFor="brief" className="text-slate-300 font-medium">
                  Brief Completo <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="brief"
                  placeholder="Describe tu producto/servicio, propuesta de valor, diferenciadores, público objetivo, competencia, etc. Mientras más detalle, mejores serán los arquetipos generados."
                  className="min-h-[180px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200/80">
                    <span className="font-medium">Tip:</span> Incluye qué vendes, a quién, por qué es mejor, qué problemas resuelve, competencia directa
                  </p>
                </div>
              </div>

              {/* Core Message */}
              <div className="space-y-2">
                <Label htmlFor="coreMessage" className="text-slate-300 font-medium">
                  Mensaje principal de la campaña
                </Label>
                <Textarea
                  id="coreMessage"
                  placeholder="Ej: 'Promoción 50% OFF', 'Financiación en 12 cuotas', 'Confianza al viajar'... La IA adaptará este mensaje según cada ángulo creativo."
                  className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                  value={formData.coreMessage}
                  onChange={(e) => setFormData({ ...formData, coreMessage: e.target.value })}
                />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-violet-200/80">
                    <span className="font-medium">Esta es la idea central</span> que querés comunicar. Cada ángulo la expresará a su manera en los textos de las imágenes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference Images Card */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Imágenes de Referencia</CardTitle>
                  <CardDescription className="text-slate-400">
                    Carga imágenes de tu producto para usar como referencia en la generación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  isDragging ? 'bg-violet-500/20' : 'bg-slate-800'
                }`}>
                  <Upload className={`w-7 h-7 ${isDragging ? 'text-violet-400' : 'text-slate-500'}`} />
                </div>
                <p className="text-slate-300 font-medium">
                  {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz click para seleccionar'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  PNG, JPG, WEBP hasta 10MB cada una
                </p>
              </div>

              {/* Uploaded Images Grid */}
              {referenceImages.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-400 mb-3">
                    {referenceImages.length} imagen{referenceImages.length !== 1 ? 'es' : ''} cargada{referenceImages.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {referenceImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800"
                      >
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(image.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Filename */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white/80 truncate">{image.filename}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/studio">
              <Button
                variant="outline"
                type="button"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Crear Campaña
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
