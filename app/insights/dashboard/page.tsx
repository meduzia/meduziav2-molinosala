'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Insight {
  type: string
  title: string
  summary: string
  data: any
  recommendations: string[]
}

export default function InsightsDashboard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/insights/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()
      if (result.success) {
        setInsights(result.insights)
        setDateRange(result.dateRange)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analizando datos de Meta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm shadow-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard de Insights</h1>
              <p className="text-sm text-foreground-muted mt-1">
                Análisis de Meta Ads del {dateRange.from} al {dateRange.to}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchInsights}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Actualizar
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/pax/dashboard"
            className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver al Dashboard Principal
          </Link>
        </div>
      </main>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'creative_winners':
        return '🏆'
      case 'budget_optimization':
        return '💰'
      case 'alerts':
        return '⚠️'
      case 'summary':
        return '📊'
      default:
        return '📈'
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'creative_winners':
        return 'from-blue-50 to-blue-100 border-blue-200'
      case 'budget_optimization':
        return 'from-green-50 to-green-100 border-green-200'
      case 'alerts':
        return 'from-orange-50 to-orange-100 border-orange-200'
      case 'summary':
        return 'from-purple-50 to-purple-100 border-purple-200'
      default:
        return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <div className={`bg-gradient-to-br ${getBgColor(insight.type)} border rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{getIcon(insight.type)}</span>
            <h2 className="text-2xl font-bold text-gray-900">{insight.title}</h2>
          </div>
          <p className="text-gray-700">{insight.summary}</p>
        </div>
      </div>

      {/* Data Section */}
      <div className="mb-6">
        {Array.isArray(insight.data) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insight.data.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                {typeof item === 'object' ? (
                  <div className="space-y-2 text-sm">
                    {Object.entries(item).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-gray-900 font-semibold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900">{String(item)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(insight.data).map(([key, value]: [string, any]) => (
              <div key={key} className="text-center">
                <p className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold text-gray-900">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {insight.recommendations && insight.recommendations.length > 0 && (
        <div className="bg-white bg-opacity-70 rounded-lg p-4 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span> Recomendaciones
          </h3>
          <ul className="space-y-2">
            {insight.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
