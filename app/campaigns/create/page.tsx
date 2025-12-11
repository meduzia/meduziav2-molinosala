'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { AlertCircle, Sparkles, ArrowRight, CheckCircle2, Zap, DollarSign } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/ThemeToggle'

interface CostEstimate {
  agents: {
    research: number
    angles: number
    scriptwriting: number
    imageGeneration: number
    variations: number
  }
  summary: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputCost: number
    outputCost: number
    totalCost: number
  }
}

export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [isCalculatingCost, setIsCalculatingCost] = useState(false)

  const [campaignData, setCampaignData] = useState({
    type: 'producto' as const,
    brief_text: '',
    target_audience: '',
    info_extra: '',
    num_videos_initial: 50,
    num_images: 5,
    idioma: 'español',
    executeResearch: true,
    executeAngles: true,
    executeScriptwriting: false,
    executeImageGeneration: false,
    executeVariations: false,
  })

  // Calculate cost estimate whenever execution options change
  useEffect(() => {
    const calculateCost = async () => {
      setIsCalculatingCost(true)
      try {
        const params = new URLSearchParams({
          research: campaignData.executeResearch.toString(),
          angles: campaignData.executeAngles.toString(),
          scriptwriting: campaignData.executeScriptwriting.toString(),
          imageGeneration: campaignData.executeImageGeneration.toString(),
          variations: campaignData.executeVariations.toString(),
        })

        const response = await fetch(`/api/campaigns/cost-estimate?${params}`)
        const data = await response.json()

        if (data.success) {
          setCostEstimate(data.estimatedCost)
        }
      } catch (error) {
        console.error('Error calculating cost:', error)
      } finally {
        setIsCalculatingCost(false)
      }
    }

    calculateCost()
  }, [
    campaignData.executeResearch,
    campaignData.executeAngles,
    campaignData.executeScriptwriting,
    campaignData.executeImageGeneration,
    campaignData.executeVariations,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Guard: Only proceed if we're on the final step (step 4)
    if (currentStep !== 4) {
      console.warn('Submit attempted from non-final step:', currentStep)
      e.stopPropagation()
      return
    }

    setIsLoading(true)

    try {
      console.log('Iniciando creación de campaña...')

      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: campaignData.type,
          brief_text: campaignData.brief_text,
          target_audience: campaignData.target_audience,
          info_extra: campaignData.info_extra,
          num_videos_initial: campaignData.num_videos_initial,
          num_images: campaignData.num_images,
          idioma: campaignData.idioma,
          executeOptions: {
            executeResearch: campaignData.executeResearch,
            executeAngles: campaignData.executeAngles,
            executeScriptwriting: campaignData.executeScriptwriting,
            executeImageGeneration: campaignData.executeImageGeneration,
            executeVariations: campaignData.executeVariations,
          },
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Error al crear campaña'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          console.error('Could not parse error response:', e)
          const text = await response.text()
          console.error('Raw response:', text)
          errorMessage = `Error ${response.status}: ${text.slice(0, 100)}`
        }
        console.error('API error response:', errorMessage)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Campaign created successfully:', result)

      toast.success(`Campaña creada: ${result.campaign.id}`)

      // Redirigir a página de resultados
      if (result.campaign?.id) {
        setTimeout(() => {
          window.location.href = `/campaigns/${result.campaign.id}`
        }, 1000)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
      console.error('Campaign creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isStep1Complete = campaignData.brief_text.trim() !== ''
  const isStep2Complete = campaignData.executeResearch || campaignData.executeAngles

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Prevent form submission on Enter key unless on final step
    if (e.key === 'Enter' && currentStep !== 4) {
      e.preventDefault()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,var(--primary),transparent_50%)] pointer-events-none opacity-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,var(--primary),transparent_50%)] pointer-events-none opacity-5" />

      <div className="relative z-10 container max-w-4xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-gradient-primary">
                Crear Nueva Campaña UGC
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-foreground/80">
            Flujo automatizado para generar conceptos creativos y scripts virales
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => step < currentStep && setCurrentStep(step)}
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all ${
                    step < currentStep
                      ? 'bg-success/20 border-2 border-success text-success cursor-pointer'
                      : step === currentStep
                      ? 'bg-primary/20 border-2 border-primary text-primary'
                      : 'bg-card/50 border-2 border-border text-foreground/60'
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="h-6 w-6" /> : step}
                </button>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-colors ${
                      step < currentStep ? 'bg-success' : 'bg-card/50'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-foreground/60">
            <span>Product Info</span>
            <span>Execution Options</span>
            <span>Content Quantities</span>
            <span>Review & Launch</span>
          </div>
        </div>

        <Card className="card-premium backdrop-blur-sm">
          <CardHeader>
            <CardTitle>
              {currentStep === 1
                ? 'Detalles del Producto/Servicio'
                : currentStep === 2
                ? 'Opciones de Generación'
                : currentStep === 3
                ? 'Cantidades de Contenido'
                : 'Revisión y Lanzamiento'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? 'Proporciona información detallada sobre lo que quieres promocionar'
                : currentStep === 2
                ? 'Selecciona qué etapas del proceso quieres ejecutar'
                : currentStep === 3
                ? 'Define cuántos videos e imágenes deseas generar'
                : 'Revisa tu configuración antes de lanzar'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
              {/* STEP 1: Product Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <Alert className="bg-primary/10 border-primary/30">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground/80">
                      Proporciona detalles completos para que nuestros agentes entiendan exactamente qué promocionar.
                    </AlertDescription>
                  </Alert>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de oferta *</Label>
                    <Select
                      value={campaignData.type}
                      onValueChange={(value) =>
                        setCampaignData({ ...campaignData, type: value as 'producto' | 'servicio' })
                      }
                    >
                      <SelectTrigger id="type" className="bg-card border-primary/30">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/30">
                        <SelectItem value="producto">Producto</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brief */}
                  <div className="space-y-2">
                    <Label htmlFor="brief">Brief del Producto/Servicio *</Label>
                    <Textarea
                      id="brief"
                      placeholder="Describe tu producto o servicio: características principales, beneficios, precio, público objetivo..."
                      value={campaignData.brief_text}
                      onChange={(e) =>
                        setCampaignData({ ...campaignData, brief_text: e.target.value })
                      }
                      required
                      className="min-h-[120px] bg-card border-primary/30 text-foreground placeholder:text-foreground/50"
                    />
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label htmlFor="audience">Público Objetivo</Label>
                    <Input
                      id="audience"
                      placeholder="Ej: Mujeres 25-45 años, conscientes de su salud, nivel socioeconómico medio-alto"
                      value={campaignData.target_audience}
                      onChange={(e) =>
                        setCampaignData({ ...campaignData, target_audience: e.target.value })
                      }
                      className="bg-card border-primary/30 text-foreground placeholder:text-foreground/50"
                    />
                  </div>

                  {/* Extra Info */}
                  <div className="space-y-2">
                    <Label htmlFor="extra">Información Adicional</Label>
                    <Textarea
                      id="extra"
                      placeholder="Cualquier información extra relevante para los agentes (competidores, puntos diferenciales, etc.)"
                      value={campaignData.info_extra}
                      onChange={(e) =>
                        setCampaignData({ ...campaignData, info_extra: e.target.value })
                      }
                      className="min-h-[80px] bg-card border-primary/20 text-foreground placeholder:text-foreground/60"
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma *</Label>
                    <Select
                      value={campaignData.idioma}
                      onValueChange={(value) =>
                        setCampaignData({ ...campaignData, idioma: value })
                      }
                    >
                      <SelectTrigger id="language" className="bg-card border-primary/30">
                        <SelectValue placeholder="Selecciona idioma" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/30">
                        <SelectItem value="español">Español</SelectItem>
                        <SelectItem value="portugués">Portugués</SelectItem>
                        <SelectItem value="inglés">Inglés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 2: Execution Options */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Alert className="bg-success/10 border-success/30">
                    <Sparkles className="h-4 w-4 text-success" />
                    <AlertDescription className="text-foreground/80">
                      Selecciona las etapas de generación que deseas ejecutar. Te recomendamos activar al menos Research y Angles.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 bg-card/30 p-6 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-4">Opciones de Ejecución</h3>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="research"
                          checked={campaignData.executeResearch}
                          onCheckedChange={(checked) =>
                            setCampaignData({
                              ...campaignData,
                              executeResearch: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="research" className="cursor-pointer font-medium text-foreground">
                            Research - Análisis de Pain Points & Benefits
                          </Label>
                          <p className="text-xs text-foreground/60 mt-1">
                            Analiza los problemas de tu audiencia y cómo tu producto los resuelve.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="angles"
                          checked={campaignData.executeAngles}
                          onCheckedChange={(checked) =>
                            setCampaignData({
                              ...campaignData,
                              executeAngles: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="angles" className="cursor-pointer font-medium text-foreground">
                            Angles - Conceptos Creativos Virales
                          </Label>
                          <p className="text-xs text-foreground/60 mt-1">
                            Genera ángulos únicos y hooks que atraigan atención inmediatamente.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="scriptwriting"
                          checked={campaignData.executeScriptwriting}
                          onCheckedChange={(checked) =>
                            setCampaignData({
                              ...campaignData,
                              executeScriptwriting: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="scriptwriting" className="cursor-pointer font-medium text-foreground">
                            Scriptwriting - Prompts para Videos
                          </Label>
                          <p className="text-xs text-foreground/60 mt-1">
                            Crea scripts completos y detalles para grabar videos UGC profesionales.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="imageGeneration"
                          checked={campaignData.executeImageGeneration}
                          onCheckedChange={(checked) =>
                            setCampaignData({
                              ...campaignData,
                              executeImageGeneration: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="imageGeneration" className="cursor-pointer font-medium text-foreground">
                            Image Generation - Prompts para Imágenes
                          </Label>
                          <p className="text-xs text-foreground/60 mt-1">
                            Crea prompts optimizados para generar imágenes UGC con AI.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="variations"
                          checked={campaignData.executeVariations}
                          onCheckedChange={(checked) =>
                            setCampaignData({
                              ...campaignData,
                              executeVariations: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="variations" className="cursor-pointer font-medium text-foreground">
                            Variations - A/B Testing Variants
                          </Label>
                          <p className="text-xs text-foreground/60 mt-1">
                            Genera múltiples variaciones para probar diferentes enfoques.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Estimation Card */}
                  {costEstimate && (
                    <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/30 mt-6">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-emerald-400" />
                          <CardTitle className="text-lg text-emerald-200">Costo Estimado de la Campaña</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {costEstimate.agents.research > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/60">Research</p>
                              <p className="text-sm font-semibold text-emerald-200">${costEstimate.agents.research.toFixed(4)}</p>
                            </div>
                          )}
                          {costEstimate.agents.angles > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/60">Angles</p>
                              <p className="text-sm font-semibold text-emerald-200">${costEstimate.agents.angles.toFixed(4)}</p>
                            </div>
                          )}
                          {costEstimate.agents.scriptwriting > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/60">Scriptwriting</p>
                              <p className="text-sm font-semibold text-emerald-200">${costEstimate.agents.scriptwriting.toFixed(4)}</p>
                            </div>
                          )}
                          {costEstimate.agents.imageGeneration > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/60">Image Gen</p>
                              <p className="text-sm font-semibold text-emerald-200">${costEstimate.agents.imageGeneration.toFixed(4)}</p>
                            </div>
                          )}
                          {costEstimate.agents.variations > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/60">Variations</p>
                              <p className="text-sm font-semibold text-emerald-200">${costEstimate.agents.variations.toFixed(4)}</p>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-emerald-500/20 pt-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-foreground/60 mb-1">Tokens Totales: {costEstimate.summary.totalTokens.toLocaleString()}</p>
                              <p className="text-xs text-foreground/60">Input: {costEstimate.summary.inputTokens.toLocaleString()} | Output: {costEstimate.summary.outputTokens.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-foreground/60 mb-1">Subtotales</p>
                              <p className="text-xs text-foreground/70">Input: ${costEstimate.summary.inputCost.toFixed(4)}</p>
                              <p className="text-xs text-foreground/70">Output: ${costEstimate.summary.outputCost.toFixed(4)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-emerald-500/30 pt-3 flex justify-between items-center">
                          <span className="text-sm text-foreground">💰 Total a gastar:</span>
                          <span className="text-2xl font-bold text-emerald-300">${costEstimate.summary.totalCost.toFixed(4)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>
              )}

              {/* STEP 3: Content Quantities */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Alert className="bg-indigo-500/10 border-indigo-500/30">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <AlertDescription className="text-indigo-200/80">
                      Define cuántos videos e imágenes deseas generar para esta campaña. Los prompts se crearán basados en estos números.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Number of Videos */}
                    <div className="space-y-2">
                      <Label htmlFor="videos">Cantidad de Videos</Label>
                      <Input
                        id="videos"
                        type="number"
                        min="1"
                        max="100"
                        value={campaignData.num_videos_initial}
                        onChange={(e) =>
                          setCampaignData({
                            ...campaignData,
                            num_videos_initial: parseInt(e.target.value),
                          })
                        }
                        className="bg-card border-primary/20 text-foreground"
                      />
                      <p className="text-xs text-foreground/60">
                        Recomendado: 3-10 videos por ángulo (típico: 3-15 videos)
                      </p>
                    </div>

                    {/* Number of Images */}
                    <div className="space-y-2">
                      <Label htmlFor="images">Cantidad de Imágenes</Label>
                      <Input
                        id="images"
                        type="number"
                        min="1"
                        max="100"
                        value={campaignData.num_images}
                        onChange={(e) =>
                          setCampaignData({
                            ...campaignData,
                            num_images: parseInt(e.target.value),
                          })
                        }
                        className="bg-card border-primary/20 text-foreground"
                      />
                      <p className="text-xs text-foreground/60">
                        Recomendado: 5-10 imágenes para variedad visual
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card/30 border border-primary/20">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumen</h4>
                    <div className="text-sm text-foreground/70 space-y-1">
                      <p>Videos a generar: <span className="font-semibold text-primary">{campaignData.num_videos_initial}</span></p>
                      <p>Imágenes a generar: <span className="font-semibold text-indigo-400">{campaignData.num_images}</span></p>
                      <p className="text-xs text-foreground/60 mt-2">
                        Se generarán prompts optimizados para Sora (videos) y Nano Banana (imágenes)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Launch */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Alert className="bg-primary/10 border-primary/30">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground/80">
                      Revisa tu configuración. Una vez que inicies, nuestros agentes comenzarán a generar contenido automáticamente.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 bg-card/30 p-6 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-4">Resumen de Configuración</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Tipo:</span>
                        <span className="font-medium text-foreground capitalize">{campaignData.type}</span>
                      </div>
                      <div className="flex justify-between border-t border-primary/20 pt-3">
                        <span className="text-foreground/60">Idioma:</span>
                        <span className="font-medium text-foreground capitalize">{campaignData.idioma}</span>
                      </div>
                      <div className="flex justify-between border-t border-primary/20 pt-3">
                        <span className="text-foreground/60">Videos:</span>
                        <span className="font-medium text-foreground">{campaignData.num_videos_initial}</span>
                      </div>
                      <div className="flex justify-between border-t border-primary/20 pt-3">
                        <span className="text-foreground/60">Imágenes:</span>
                        <span className="font-medium text-foreground">{campaignData.num_images}</span>
                      </div>
                      <div className="border-t border-primary/20 pt-3">
                        <p className="text-foreground/60 mb-2">Etapas a Ejecutar:</p>
                        <div className="flex gap-2 flex-wrap">
                          {campaignData.executeResearch && (
                            <span className="px-2 py-1 bg-success/20 text-success rounded text-xs font-medium">
                              Research
                            </span>
                          )}
                          {campaignData.executeAngles && (
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                              Angles
                            </span>
                          )}
                          {campaignData.executeScriptwriting && (
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                              Scriptwriting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t border-primary/20">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    className="flex-1 border-primary/20 text-foreground/70 hover:bg-card"
                  >
                    Atrás
                  </Button>
                )}
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={(currentStep === 1 && !isStep1Complete) || (currentStep === 2 && !isStep2Complete)}
                    className="flex-1 gradient-primary hover:opacity-90 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSubmit(e as unknown as React.FormEvent)
                    }}
                    disabled={isLoading || !isStep2Complete}
                    className="flex-1 bg-gradient-to-r from-success to-success hover:opacity-90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block mr-2">⚙️</span>
                        Creando campaña...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Lanzar Campaña
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
