'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Lightbulb,
  Zap,
  Video,
  Pause,
  Play,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { GenerateImagesTab } from '@/components/campaigns/GenerateImagesTab'
import { ImageGallery } from '@/components/campaigns/ImageGallery'

interface ResearchData {
  pain_points: Array<{ id: string; description: string }>
  benefits: Array<{ id: string; description: string }>
  objections: Array<{ id: string; description: string }>
  promises: Array<{ id: string; description: string }>
}

interface AngleData {
  angle_id: string
  angle_name: string
  big_idea: string
  hook_type: string
  pain_point_target: string
  key_benefit_target: string
  suggested_creator: string
  context: string
}

interface PromptData {
  angle_id: string
  angle_name?: string
  prompt_text: string
}

interface ImagePromptData {
  angle_id: string
  angle_name: string
  prompt_text: string
  style?: string
}

interface GeneratedImage {
  id: string
  type: string
  url: string
  prompt_id: string
  status: 'processing' | 'completed' | 'failed'
  kieTaskId?: string
  errorMessage?: string
  createdAt?: string
  metadata?: {
    angleName?: string
    kieImageUrl?: string
    costTime?: number
    consumeCredits?: number
  }
}

interface CampaignDetail {
  id: string
  status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
  pausedAt?: string
  deletedAt?: string
  input: {
    brief_text: string
    type: string
    target_audience?: string
    num_videos_initial?: number
    num_images?: number
  }
  research?: ResearchData
  angles?: { angles: AngleData[] }
  prompts?: PromptData[]
  image_prompts?: ImagePromptData[]
  images?: GeneratedImage[]
  variations?: any[]
  flows: Array<{
    step: string
    status: string
    duration: number
    error?: string
  }>
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [campaignId, setCampaignId] = useState<string>('')

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setCampaignId(id)
      await fetchCampaign(id)
    }
    unwrapParams()
  }, [params])

  // Auto-refresh when campaign is in_progress
  useEffect(() => {
    if (!campaign || campaign.status !== 'in_progress') return

    const interval = setInterval(() => {
      fetchCampaign(campaignId)
    }, 2000) // Refresh every 2 seconds

    return () => clearInterval(interval)
  }, [campaign, campaignId])

  const fetchCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch campaign')
      }
      const data = await response.json()
      setCampaign(data.campaign)
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePauseCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Campaña pausada. Los gastos se han detenido.')
        setCampaign({ ...campaign!, status: 'paused' })
      } else {
        toast.error(data.error || 'Error al pausar')
      }
    } catch (error) {
      toast.error('Error al pausar campaña')
      console.error(error)
    }
  }

  const handleResumeCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/resume`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Campaña reanudada')
        setCampaign({ ...campaign!, status: 'in_progress' })
      } else {
        toast.error(data.error || 'Error al reanudar')
      }
    } catch (error) {
      toast.error('Error al reanudar campaña')
      console.error(error)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta campaña? Será archivada pero recuperable.')) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent: false }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Campaña eliminada (archivada - puede recuperarse)')
        setCampaign({ ...campaign!, status: 'archived' })
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar campaña')
      console.error(error)
    }
  }

  const handleRecoverCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/recover`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Campaña recuperada')
        setCampaign({ ...campaign!, status: data.campaign.status })
      } else {
        toast.error(data.error || 'Error al recuperar')
      }
    } catch (error) {
      toast.error('Error al recuperar campaña')
      console.error(error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  const downloadAsJSON = () => {
    if (!campaign) return

    const dataStr = JSON.stringify(campaign, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `campaign-${campaignId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>No se encontró la campaña {campaignId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* In Progress Alert */}
      {campaign.status === 'in_progress' && (
        <Card className="border-blue-500/50 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-blue-800">
              <div className="animate-spin">⚙️</div>
              <div>
                <p className="font-semibold">Procesando campaña...</p>
                <p className="text-sm text-blue-600">
                  Nuestros agentes están generando Research, Angles y Scripts. Esta página se actualizará automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Campaña {campaignId.slice(0, 8)}</h1>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status === 'paused' && '⏸️ '}
              {campaign.status === 'archived' && '🗑️ '}
              {campaign.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {campaign.input.brief_text}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadAsJSON} className="gap-2">
            <Download className="w-4 h-4" />
            Descargar
          </Button>

          {/* Pause/Resume buttons */}
          {campaign.status === 'in_progress' && (
            <Button
              variant="outline"
              onClick={handlePauseCampaign}
              className="gap-2 text-yellow-600 border-yellow-300"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </Button>
          )}

          {campaign.status === 'paused' && (
            <Button
              variant="outline"
              onClick={handleResumeCampaign}
              className="gap-2 text-blue-600 border-blue-300"
            >
              <Play className="w-4 h-4" />
              Reanudar
            </Button>
          )}

          {/* Delete button */}
          {campaign.status !== 'archived' && (
            <Button
              variant="outline"
              onClick={handleDeleteCampaign}
              className="gap-2 text-red-600 border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}

          {/* Recover button */}
          {campaign.status === 'archived' && (
            <Button
              variant="outline"
              onClick={handleRecoverCampaign}
              className="gap-2 text-blue-600 border-blue-300"
            >
              <RotateCcw className="w-4 h-4" />
              Recuperar
            </Button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Progreso de Ejecución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.flows.map((flow, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="font-medium capitalize">{flow.step}</p>
                  <p className="text-sm text-gray-600">
                    {flow.duration ? `${(flow.duration / 1000).toFixed(2)}s` : '-'}
                  </p>
                </div>
                <div className="flex-1">
                  <div
                    className="h-2 bg-gray-200 rounded-full overflow-hidden"
                    style={{ maxWidth: '200px' }}
                  >
                    {flow.status === 'completed' && (
                      <div className="h-full bg-green-500 w-full" />
                    )}
                    {flow.status === 'running' && (
                      <div className="h-full bg-blue-500 w-3/4 animate-pulse" />
                    )}
                    {flow.status === 'failed' && (
                      <div className="h-full bg-red-500 w-full" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 w-40">
                  {flow.status === 'completed' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Completado</span>
                    </>
                  )}
                  {flow.status === 'running' && (
                    <>
                      <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-600">En progreso</span>
                    </>
                  )}
                  {flow.status === 'failed' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Error</span>
                    </>
                  )}
                  {flow.status === 'pending' && (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Pendiente</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="research" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="research" className="gap-2">
            <FileText className="w-4 h-4" />
            Research
          </TabsTrigger>
          <TabsTrigger value="angles" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Ángulos
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Video className="w-4 h-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <Download className="w-4 h-4" />
            Imágenes
          </TabsTrigger>
          <TabsTrigger value="variations" className="gap-2">
            <Zap className="w-4 h-4" />
            Variaciones
          </TabsTrigger>
        </TabsList>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          {campaign.research ? (
            <>
              {/* Pain Points */}
              <Card>
                <CardHeader>
                  <CardTitle>Puntos de Dolor ({campaign.research.pain_points.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaign.research.pain_points.map((pain) => (
                    <div
                      key={pain.id}
                      className="p-3 bg-rose-100/50 dark:bg-rose-900/20 rounded-lg border border-rose-200/60 dark:border-rose-700/30 flex justify-between items-start gap-2"
                    >
                      <p className="text-sm text-foreground/80">{pain.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(pain.description)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Beneficios ({campaign.research.benefits.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaign.research.benefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30 flex justify-between items-start gap-2"
                    >
                      <p className="text-sm text-foreground/80">{benefit.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(benefit.description)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Objections & Promises */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Objeciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {campaign.research.objections.map((obj) => (
                      <div key={obj.id} className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200/60 dark:border-amber-700/30 text-sm text-foreground/80">
                        {obj.description}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Promesas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {campaign.research.promises.map((promise) => (
                      <div key={promise.id} className="p-3 bg-sky-100/50 dark:bg-sky-900/20 rounded-lg border border-sky-200/60 dark:border-sky-700/30 text-sm text-foreground/80">
                        {promise.description}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Research no disponible aún</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Angles Tab */}
        <TabsContent value="angles" className="space-y-4">
          {campaign.angles && campaign.angles.angles.length > 0 ? (
            campaign.angles.angles.map((angle) => (
              <Card key={angle.angle_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{angle.angle_name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{angle.big_idea}</p>
                    </div>
                    <Badge variant="outline">{angle.hook_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Creador Sugerido</p>
                      <p className="text-gray-600">{angle.suggested_creator}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Contexto</p>
                      <p className="text-gray-600">{angle.context}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Pain: {angle.pain_point_target}</Badge>
                    <Badge variant="secondary">Benefit: {angle.key_benefit_target}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Ángulos no disponibles aún</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          {/* Quantity Metrics */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Solicitados:</span> {campaign.input.num_videos_initial || 0} videos
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Generados:</span> {campaign.prompts?.length || 0} prompts
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaign.prompts?.length || 0}
                  </div>
                  <p className="text-xs text-gray-600">de {campaign.input.num_videos_initial || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.prompts && campaign.prompts.length > 0 ? (
            campaign.prompts.map((prompt, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{prompt.angle_name || `Prompt ${index + 1}`}</CardTitle>
                      <CardDescription className="mt-2 text-xs text-gray-500">
                        {prompt.prompt_text.substring(0, 100).replace(/\n/g, ' ')}...
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(prompt.prompt_text)}
                      className="shrink-0"
                      title="Copiar prompt completo"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-slate-200 leading-relaxed">
                      {prompt.prompt_text}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    📋 {prompt.prompt_text.length} caracteres • Usa el botón "Copiar" para duplicar este prompt
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Prompts no disponibles aún</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {/* Generation & Gallery Section */}
          {campaign.image_prompts && campaign.image_prompts.length > 0 && (
            <>
              {/* Generate Images Tab */}
              <GenerateImagesTab
                campaignId={campaignId}
                imagePrompts={campaign.image_prompts}
                existingImages={campaign.images}
                onImagesGenerated={() => {
                  // Refrescar la campaña para ver las nuevas imágenes
                  fetchCampaign(campaignId)
                }}
              />

              {/* Image Gallery */}
              {campaign.images && campaign.images.length > 0 && (
                <ImageGallery images={campaign.images} campaignId={campaignId} />
              )}
            </>
          )}

          {/* Quantity Metrics */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Solicitados:</span> {campaign.input.num_images || 0} imágenes
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Generados:</span> {campaign.image_prompts?.length || 0} prompts
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {campaign.image_prompts?.length || 0}
                  </div>
                  <p className="text-xs text-gray-600">de {campaign.input.num_images || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.image_prompts && campaign.image_prompts.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total: {campaign.image_prompts.length} prompts de imagen optimizados para generadores como Nano Banana
                </p>
              </div>
              {campaign.image_prompts.map((imagePrompt: ImagePromptData, index: number) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{imagePrompt.angle_name || `Imagen ${index + 1}`}</CardTitle>
                        <CardDescription className="mt-2 text-xs text-gray-500">
                          {imagePrompt.prompt_text.substring(0, 100).replace(/\n/g, ' ')}...
                        </CardDescription>
                      </div>
                      {imagePrompt.style && (
                        <Badge variant="outline" className="ml-2 whitespace-nowrap">
                          {imagePrompt.style}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(imagePrompt.prompt_text)}
                      className="w-full sm:w-auto"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Prompt
                    </Button>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono text-slate-200 leading-relaxed">
                        {imagePrompt.prompt_text}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      📷 {imagePrompt.prompt_text.length} caracteres • Optimizado para generadores de imágenes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Prompts de imagen no disponibles aún</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations" className="space-y-4">
          {campaign.variations && campaign.variations.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total: {campaign.variations.length} variaciones generadas para A/B testing
                </p>
              </div>
              {campaign.variations.map((variation: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Variación {index + 1}
                        </CardTitle>
                        <CardDescription>
                          ID: {variation.variation_id || 'N/A'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {variation.target_metric && (
                          <Badge variant="secondary">
                            Target: {variation.target_metric.toUpperCase()}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(variation.prompt_text)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {variation.hypothesis && (
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-2">
                          Hipótesis
                        </p>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {variation.hypothesis}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-700 mb-2">
                        Prompt
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                          {variation.prompt_text.substring(0, 800)}
                          {variation.prompt_text.length > 800 && '...'}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Variaciones no disponibles aún. Ejecuta la campaña con la opción de
                  "executeVariations" habilitada para generar variaciones.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
