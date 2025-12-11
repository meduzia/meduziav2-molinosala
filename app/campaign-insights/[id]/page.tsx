'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ArrowLeft, Loader2, AlertCircle, FileImage, Film } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PainPoint {
  id: string
  description: string
}

interface Benefit {
  id: string
  description: string
}

interface Insight {
  id: string
  description: string
}

interface CreativeAngle {
  angle_id: string
  angle_name: string
  big_idea: string
  hook_type: string
  pain_point_target: string
  key_benefit_target: string
  suggested_creator: string
  context: string
}

interface GeneratedAsset {
  id: string
  type: 'image' | 'video'
  url: string
  prompt_id?: string
}

interface CampaignDetail {
  id: string
  brief_text: string
  type: string
  status: string
  created_at: string
  research?: {
    pain_points?: PainPoint[]
    benefits?: Benefit[]
    objections?: Insight[]
    promises?: Insight[]
  }
  angles?: CreativeAngle[]
  assets?: GeneratedAsset[]
}

export default function CampaignInsightDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (!response.ok) throw new Error('Campaña no encontrada')
      const data = await response.json()
      setCampaign(data)
    } catch (err) {
      console.error('Error loading campaign:', err)
      setError('Error al cargar los detalles de la campaña')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-600 border-slate-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: '✓ Completada',
      in_progress: '⟳ En progreso',
      paused: '⏸ Pausada',
      failed: '✗ Error',
      draft: '📝 Borrador',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <h1 className="text-3xl font-bold">Cargando...</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Cargando insights de la campaña...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <h1 className="text-3xl font-bold">Error</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive mb-4" />
              <p className="text-destructive text-lg mb-4">{error || 'Campaña no encontrada'}</p>
              <Button onClick={() => router.back()} variant="outline">
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const painPoints = campaign.research?.pain_points || []
  const benefits = campaign.research?.benefits || []
  const objections = campaign.research?.objections || []
  const promises = campaign.research?.promises || []
  const angles = campaign.angles || []
  const images = campaign.assets?.filter((a) => a.type === 'image') || []
  const videos = campaign.assets?.filter((a) => a.type === 'video') || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent line-clamp-2">
                  {campaign.brief_text || 'Campaña sin descripción'}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {campaign.type === 'producto' ? '📦 Producto' : '🔧 Servicio'}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(campaign.status)}>
                    {getStatusLabel(campaign.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/30 backdrop-blur-sm border border-primary/20 rounded-xl p-1 shadow-lg">
            <TabsTrigger value="research" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Research
            </TabsTrigger>
            <TabsTrigger value="angles" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Ángulos
            </TabsTrigger>
            <TabsTrigger value="ugc" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              UGC
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Resumen
            </TabsTrigger>
          </TabsList>

          {/* RESEARCH TAB */}
          <TabsContent value="research" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* PAINS */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    🚨 Pains - Dolores del cliente ({painPoints.length})
                  </CardTitle>
                  <CardDescription>Problemas y frustraciones identificados</CardDescription>
                </CardHeader>
                <CardContent>
                  {painPoints.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay pains identificados aún</p>
                  ) : (
                    <div className="space-y-3">
                      {painPoints.map((pain) => (
                        <div
                          key={pain.id}
                          className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm"
                        >
                          {pain.description}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* GAINS */}
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    ✨ Gains - Beneficios ({benefits.length})
                  </CardTitle>
                  <CardDescription>Resultados y beneficios esperados</CardDescription>
                </CardHeader>
                <CardContent>
                  {benefits.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay gains identificados aún</p>
                  ) : (
                    <div className="space-y-3">
                      {benefits.map((benefit) => (
                        <div
                          key={benefit.id}
                          className="p-3 bg-success/10 border border-success/20 rounded-lg text-sm"
                        >
                          {benefit.description}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OBJECTIONS */}
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    ⚠️ Objeciones ({objections.length})
                  </CardTitle>
                  <CardDescription>Limitaciones y barreras de compra</CardDescription>
                </CardHeader>
                <CardContent>
                  {objections.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay objeciones identificadas aún</p>
                  ) : (
                    <div className="space-y-3">
                      {objections.map((objection) => (
                        <div
                          key={objection.id}
                          className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm"
                        >
                          {objection.description}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PROMISES */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    💎 Promesas ({promises.length})
                  </CardTitle>
                  <CardDescription>Propuestas de valor clave</CardDescription>
                </CardHeader>
                <CardContent>
                  {promises.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay promesas identificadas aún</p>
                  ) : (
                    <div className="space-y-3">
                      {promises.map((promise) => (
                        <div
                          key={promise.id}
                          className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm"
                        >
                          {promise.description}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ANGLES TAB */}
          <TabsContent value="angles" className="space-y-6">
            {angles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg mb-2">No hay ángulos generados aún</p>
                  <p className="text-sm text-muted-foreground">
                    Los ángulos creados aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {angles.map((angle) => (
                  <Card key={angle.angle_id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl mb-2">{angle.angle_name}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-primary/10">
                              {angle.hook_type}
                            </Badge>
                            <Badge variant="outline" className="bg-accent/10">
                              Idea: {angle.big_idea}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Creador Sugerido
                          </p>
                          <p className="text-sm bg-card/50 p-3 rounded-lg border border-border/50">
                            {angle.suggested_creator}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Contexto de Filmación
                          </p>
                          <p className="text-sm bg-card/50 p-3 rounded-lg border border-border/50">
                            {angle.context}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Pain Point Target
                          </p>
                          <p className="text-sm text-muted-foreground">{angle.pain_point_target}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Key Benefit Target
                          </p>
                          <p className="text-sm text-muted-foreground">{angle.key_benefit_target}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* UGC TAB */}
          <TabsContent value="ugc" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* IMAGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <FileImage className="w-5 h-5 inline mr-2" />
                    Imágenes UGC ({images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {images.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay imágenes generadas aún</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((image) => (
                        <a key={image.id} href={image.url} target="_blank" rel="noopener noreferrer">
                          <div className="aspect-square bg-card/50 rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 transition-colors">
                            <img
                              src={image.url}
                              alt="Generated UGC"
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* VIDEOS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Film className="w-5 h-5 inline mr-2" />
                    Videos UGC ({videos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay videos generados aún</p>
                  ) : (
                    <div className="space-y-3">
                      {videos.map((video) => (
                        <a
                          key={video.id}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="aspect-video bg-card/50 rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 transition-colors">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-destructive mb-2">{painPoints.length}</div>
                    <p className="text-sm text-muted-foreground">Pains identificados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success mb-2">{benefits.length}</div>
                    <p className="text-sm text-muted-foreground">Gains identificados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-warning mb-2">{angles.length}</div>
                    <p className="text-sm text-muted-foreground">Ángulos generados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {images.length + videos.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Assets UGC</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información de la Campaña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      ID de Campaña
                    </p>
                    <p className="text-sm font-mono bg-card/50 p-2 rounded border border-border/50">
                      {campaign.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Creada
                    </p>
                    <p className="text-sm">
                      {new Date(campaign.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
