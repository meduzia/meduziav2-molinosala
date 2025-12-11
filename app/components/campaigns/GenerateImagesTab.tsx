'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import type { ImagePrompt, GeneratedAsset } from '@/lib/agents/types'

interface GenerateImagesTabProps {
  campaignId: string
  imagePrompts?: ImagePrompt[]
  existingImages?: GeneratedAsset[]
  onImagesGenerated?: () => void
}

export const GenerateImagesTab = ({
  campaignId,
  imagePrompts = [],
  existingImages = [],
  onImagesGenerated,
}: GenerateImagesTabProps) => {
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState('9:16')
  const [localImages, setLocalImages] = useState<GeneratedAsset[]>(existingImages)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar con existingImages cuando cambien
  useEffect(() => {
    setLocalImages(existingImages)
  }, [existingImages])

  // Función para verificar el estado de las imágenes
  const checkImageStatus = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/generate-images/check-status`)
      const data = await response.json()

      if (data.success && data.images) {
        setLocalImages(data.images)

        // Si no hay más imágenes procesando, detener polling
        if (data.summary?.processing === 0) {
          stopPolling()
          if (onImagesGenerated) {
            onImagesGenerated()
          }
        }
      }
    } catch (err) {
      console.error('Error checking image status:', err)
    }
  }

  // Iniciar polling
  const startPolling = () => {
    setIsPolling(true)
    // Verificar inmediatamente
    checkImageStatus()
    // Luego cada 5 segundos
    pollingIntervalRef.current = setInterval(checkImageStatus, 5000)
  }

  // Detener polling
  const stopPolling = () => {
    setIsPolling(false)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const handlePromptToggle = (promptId: string) => {
    const newSelected = new Set(selectedPrompts)
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId)
    } else {
      newSelected.add(promptId)
    }
    setSelectedPrompts(newSelected)
    setError(null)
  }

  const handleGenerateImages = async () => {
    if (selectedPrompts.size === 0) {
      setError('Selecciona al menos un prompt para generar')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptIds: Array.from(selectedPrompts),
          imageSize,
          outputFormat: 'png',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error generating images')
      }

      // Limpiar selección
      setSelectedPrompts(new Set())

      // Iniciar polling para verificar el estado
      startPolling()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating images')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!imagePrompts || imagePrompts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8">
          <div className="text-center text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>No hay prompts de imagen disponibles</p>
            <p className="text-sm">Completa el agente de Image Generation primero</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Generación</CardTitle>
          <CardDescription>Tamaño y formato de las imágenes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tamaño de Imagen</label>
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="1:1">Cuadrado (1:1)</option>
              <option value="9:16">Vertical TikTok (9:16)</option>
              <option value="16:9">Horizontal (16:9)</option>
              <option value="3:4">Vertical Foto (3:4)</option>
              <option value="4:3">Horizontal Clásico (4:3)</option>
              <option value="2:3">Vertical (2:3)</option>
              <option value="4:5">Vertical Insta Stories (4:5)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Prompts de Imagen</CardTitle>
          <CardDescription>
            Selecciona cuáles generar ({selectedPrompts.size} seleccionados)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {imagePrompts.map((prompt) => {
              const promptId = prompt.id || prompt.angle_id
              const isSelected = selectedPrompts.has(promptId)
              const existingImage = localImages.find((img) => img.prompt_id === promptId)

              return (
                <div
                  key={promptId}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handlePromptToggle(promptId)}
                    disabled={isGenerating || isPolling || (!!existingImage?.status && existingImage.status !== 'failed')}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">
                      {prompt.angle_name || `Ángulo ${prompt.angle_id}`}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {prompt.prompt_text.slice(0, 150)}...
                    </p>
                    {existingImage && (
                      <div className="mt-2 text-xs">
                        {existingImage.status === 'completed' && (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700">
                              ✓ Generada
                            </span>
                            {existingImage.url && (
                              <img
                                src={existingImage.url}
                                alt={prompt.angle_name}
                                className="w-24 h-24 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        )}
                        {existingImage.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            En proceso...
                          </span>
                        )}
                        {existingImage.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700">
                            ✗ Error: {existingImage.errorMessage || 'Desconocido'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {isPolling && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">
                Verificando estado de las imágenes...
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopPolling}
                className="ml-auto text-blue-600 hover:text-blue-800"
              >
                Detener
              </Button>
            </div>
          )}

          <Button
            onClick={handleGenerateImages}
            disabled={selectedPrompts.size === 0 || isGenerating || isPolling}
            className="w-full gap-2 mt-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando a Nano Banana...
              </>
            ) : isPolling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar {selectedPrompts.size} Imagen{selectedPrompts.size !== 1 ? 'es' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
