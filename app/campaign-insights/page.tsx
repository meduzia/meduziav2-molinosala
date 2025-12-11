'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Search, Lightbulb, ChevronRight, Loader2 } from 'lucide-react'

interface CampaignSummary {
  id: string
  brief_text: string
  type: string
  status: string
  created_at: string
  painsCount?: number
  gainsCount?: number
  anglesCount?: number
  ugcCount?: number
}

export default function CampaignInsightsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const filtered = campaigns.filter(
      (campaign) =>
        campaign.brief_text.toLowerCase().includes(query) ||
        campaign.type.toLowerCase().includes(query)
    )
    setFilteredCampaigns(filtered)
  }, [searchQuery, campaigns])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/campaigns/list?limit=100')
      if (!response.ok) throw new Error('Error loading campaigns')
      const data = await response.json()

      // Enriquecer con datos de insights
      const enrichedCampaigns = await Promise.all(
        (data.campaigns || []).map(async (campaign: any) => {
          try {
            const detailResponse = await fetch(`/api/campaigns/${campaign.id}`)
            const detailData = await detailResponse.json()

            return {
              ...campaign,
              painsCount: detailData.research?.pain_points?.length || 0,
              gainsCount: detailData.research?.benefits?.length || 0,
              anglesCount: detailData.angles?.length || 0,
              ugcCount: detailData.assets?.filter((a: any) => a.type === 'image' || a.type === 'video').length || 0,
            }
          } catch (err) {
            return campaign
          }
        })
      )

      setCampaigns(enrichedCampaigns)
      setFilteredCampaigns(enrichedCampaigns)
    } catch (err) {
      console.error('Error loading campaigns:', err)
      setError('Error al cargar las campañas')
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
      case 'failed':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
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
      archived: '📦 Archivada',
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Campaign Insights
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Análisis de Pains, Gains, Ángulos y UGC por campaña
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="container mx-auto px-6 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campaña por descripción o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-6 pb-12">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Cargando campañas...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive text-lg mb-2">{error}</p>
              <Button onClick={loadCampaigns} variant="outline">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No hay campañas para mostrar</p>
              <p className="text-sm text-muted-foreground mb-4">Crea tu primera campaña para ver sus insights</p>
              <Link href="/campaigns/create">
                <Button>Crear campaña</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredCampaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaign-insights/${campaign.id}`}>
                <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 line-clamp-2">
                          {campaign.brief_text || 'Campaña sin descripción'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {campaign.type === 'producto' ? '📦 Producto' : '🔧 Servicio'}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(campaign.status)}>
                            {getStatusLabel(campaign.status)}
                          </Badge>
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-primary">
                          {campaign.painsCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Pains</div>
                      </div>
                      <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-success">
                          {campaign.gainsCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Gains</div>
                      </div>
                      <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-warning">
                          {campaign.anglesCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Ángulos</div>
                      </div>
                      <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-accent">
                          {campaign.ugcCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">UGC</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Creada el {new Date(campaign.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
