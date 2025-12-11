'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
  FileText,
  Lightbulb,
  Video,
} from 'lucide-react'

interface CampaignProgressProps {
  campaignId: string
  isRunning: boolean
}

interface FlowStep {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
  error?: string
}

export function CampaignProgress({ campaignId, isRunning }: CampaignProgressProps) {
  const [flows, setFlows] = useState<FlowStep[]>([])
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    // Simular polling de progreso
    const interval = setInterval(async () => {
      try {
        // TODO: Implementar polling real desde /api/campaigns/[id]/progress
        // const response = await fetch(`/api/campaigns/${campaignId}/progress`)
        // const data = await response.json()
        // setFlows(data.flows)
        // setOverallProgress(data.progress)
      } catch (error) {
        console.error('Error fetching progress:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [campaignId, isRunning])

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'research':
        return <FileText className="w-4 h-4" />
      case 'angles':
        return <Lightbulb className="w-4 h-4" />
      case 'scriptwriting':
        return <Video className="w-4 h-4" />
      case 'variations':
        return <Zap className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
          <CardDescription>
            {overallProgress}% completado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-gray-600">
            {isRunning
              ? 'Los agentes están trabajando en tu campaña...'
              : 'Campaña completada'}
          </p>
        </CardContent>
      </Card>

      {/* Step-by-Step Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pasos de Ejecución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {flows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
              <p>Iniciando agentes...</p>
            </div>
          ) : (
            flows.map((flow, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {flow.status === 'pending' && (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    {flow.status === 'running' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {flow.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {flow.status === 'failed' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-semibold capitalize">{flow.step}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {flow.duration && (
                      <span className="text-xs text-gray-500">
                        {(flow.duration / 1000).toFixed(2)}s
                      </span>
                    )}
                    <Badge
                      variant={
                        flow.status === 'completed'
                          ? 'default'
                          : flow.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {flow.status === 'running' ? 'En progreso' : flow.status}
                    </Badge>
                  </div>
                </div>

                {flow.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {flow.error}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Research', icon: FileText, color: 'text-purple-600' },
          { label: 'Ángulos', icon: Lightbulb, color: 'text-yellow-600' },
          { label: 'Prompts', icon: Video, color: 'text-blue-600' },
          { label: 'Variaciones', icon: Zap, color: 'text-green-600' },
        ].map((stat, index) => {
          const Icon = stat.icon
          const flow = flows.find((f) => f.step === stat.label.toLowerCase())

          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Icon className={`w-6 h-6 mx-auto ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  {flow?.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 mx-auto text-green-600" />
                  ) : flow?.status === 'running' ? (
                    <Loader2 className="w-4 h-4 mx-auto text-blue-600 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 mx-auto text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
