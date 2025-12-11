'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Plus, Zap, FileText, Video, Image as ImageIcon } from 'lucide-react'

interface CampaignListItem {
  id: string
  type: string
  brief_text: string
  status: 'draft' | 'in_progress' | 'completed' | 'failed'
  createdAt: string
  summary?: {
    research?: { painPoints: number; benefits: number }
    angles?: { total: number }
    prompts?: { total: number }
    variations?: { total: number }
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Auto-refresh every 5 seconds if there are campaigns in progress
  useEffect(() => {
    if (!autoRefresh) return

    const hasActivecampaigns = campaigns.some(c => c.status === 'in_progress')
    if (!hasActivecampaigns) return

    const interval = setInterval(() => {
      fetchCampaigns()
    }, 5000)

    return () => clearInterval(interval)
  }, [campaigns, autoRefresh])

  const fetchCampaigns = async () => {
    try {
      // Don't show loading state on refresh, just update silently
      if (campaigns.length === 0) {
        setIsLoading(true)
      }

      const response = await fetch('/api/campaigns/list')
      const data = await response.json()

      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns || [])
      } else {
        // If response indicates failure, still show empty array
        setCampaigns([])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      // On error, show empty array instead of breaking
      setCampaigns([])
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'En progreso'
      case 'completed':
        return 'Completada'
      case 'failed':
        return 'Falló'
      default:
        return 'Borrador'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campañas UGC</h1>
              <p className="text-foreground-muted mt-1">
                Crea y gestiona tus campañas de contenido UGC automáticamente
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/campaigns/create">
                <Button size="lg" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Campaña
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-10 space-y-8">

      {/* Empty State */}
      {campaigns.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <Zap className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold">Sin campañas aún</h3>
              <p className="text-gray-600 mt-2">
                Crea tu primera campaña UGC y deja que los agentes hagan la magia
              </p>
            </div>
            <Link href="/campaigns/create">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Crear primera campaña
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active Campaigns Section */}
      {campaigns.some(c => c.status === 'in_progress') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">En Progreso</h2>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div className="grid gap-4">
            {campaigns
              .filter(c => c.status === 'in_progress')
              .map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {campaign.brief_text.substring(0, 50)}...
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-medium text-gray-700">{campaign.type}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Research Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.research
                        ? campaign.summary.research.painPoints
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-600">Pains</p>
                  </div>

                  {/* Angles Summary */}
                  <div className="text-center">
                    <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.angles?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Ángulos</p>
                  </div>

                  {/* Prompts Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.prompts?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Prompts</p>
                  </div>

                  {/* Variations Summary */}
                  <div className="text-center">
                    <Video className="w-5 h-5 mx-auto text-green-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.variations?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Variaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
              ))}
          </div>
        </div>
      )}

      {/* Paused Campaigns Section */}
      {campaigns.some(c => c.status === 'paused') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Pausadas</h2>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⏸️ No generan gastos</span>
          </div>
          <div className="grid gap-4">
            {campaigns
              .filter(c => c.status === 'paused')
              .map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {campaign.brief_text.substring(0, 50)}...
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-medium text-gray-700">{campaign.type}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Research Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.research
                        ? campaign.summary.research.painPoints
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-600">Pains</p>
                  </div>

                  {/* Angles Summary */}
                  <div className="text-center">
                    <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.angles?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Ángulos</p>
                  </div>

                  {/* Prompts Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.prompts?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Prompts</p>
                  </div>

                  {/* Variations Summary */}
                  <div className="text-center">
                    <Video className="w-5 h-5 mx-auto text-green-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.variations?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Variaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
              ))}
          </div>
        </div>
      )}

      {/* Completed Campaigns Section */}
      {campaigns.some(c => c.status === 'completed') && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Completadas</h2>
          <div className="grid gap-4">
            {campaigns
              .filter(c => c.status === 'completed')
              .map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {campaign.brief_text.substring(0, 50)}...
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-medium text-gray-700">{campaign.type}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Research Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.research
                        ? campaign.summary.research.painPoints
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-600">Pains</p>
                  </div>

                  {/* Angles Summary */}
                  <div className="text-center">
                    <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.angles?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Ángulos</p>
                  </div>

                  {/* Prompts Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.prompts?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Prompts</p>
                  </div>

                  {/* Variations Summary */}
                  <div className="text-center">
                    <Video className="w-5 h-5 mx-auto text-green-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.variations?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Variaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
              ))}
          </div>
        </div>
      )}

      {/* Failed/Draft Campaigns Section */}
      {campaigns.some(c => ['failed', 'draft'].includes(c.status)) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Otros</h2>
          <div className="grid gap-4">
            {campaigns
              .filter(c => ['failed', 'draft'].includes(c.status))
              .map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-75">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {campaign.brief_text.substring(0, 50)}...
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-medium text-gray-700">{campaign.type}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Research Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.research
                        ? campaign.summary.research.painPoints
                        : '-'}
                    </div>
                    <p className="text-xs text-gray-600">Pains</p>
                  </div>

                  {/* Angles Summary */}
                  <div className="text-center">
                    <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.angles?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Ángulos</p>
                  </div>

                  {/* Prompts Summary */}
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.prompts?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Prompts</p>
                  </div>

                  {/* Variations Summary */}
                  <div className="text-center">
                    <Video className="w-5 h-5 mx-auto text-green-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {campaign.summary?.variations?.total || '-'}
                    </div>
                    <p className="text-xs text-gray-600">Variaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
              ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
