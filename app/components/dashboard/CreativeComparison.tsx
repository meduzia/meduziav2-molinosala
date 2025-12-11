'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PlayCircle, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const CreativeComparison = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCreativeData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener datos de campaña de los últimos 7 días
        const response = await fetch('/api/meta/campaigns?days=7')
        const result = await response.json()

        if (!result.campaigns || result.campaigns.length === 0) {
          setError('No campaign data available to analyze creative performance')
          setLoading(false)
          return
        }

        // Aquí iría el análisis de creativos reales
        // Por ahora, mostramos que los datos provendrían del análisis de creativos
        // Esta sección debería expandirse cuando tengamos datos de creativos de Meta API

        setData({
          available: false,
          message: 'Creative performance analysis requires creative-level data from Meta API',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creative comparison data')
      } finally {
        setLoading(false)
      }
    }

    fetchCreativeData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Creativos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading creative data...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Creativos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Creative-level data requires additional Meta API permissions. Currently showing campaign-level data only.
              <br />
              <br />
              <strong>To enable creative analysis:</strong> Request creative object data from Meta Ads Insights API with fields like video format, image resolution, etc.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Creativos por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Creative performance data is coming from Meta Ads API insights. Check back when creative-level breakdowns are available.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
