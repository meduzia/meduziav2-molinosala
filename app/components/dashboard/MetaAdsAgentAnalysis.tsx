'use client'

import { useState, useEffect } from 'react'
import type { DateRange as DateRangeType } from 'react-day-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle, TrendingUp, TrendingDown, Zap, CheckCircle2, AlertTriangle,
  Lightbulb, Target, Rocket, BarChart3, Sparkles, ListChecks
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisData {
  analysis: string
  summary: {
    totalSpend: number
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalRevenue: number
    roas: number
  }
  period: string
}

interface MetaAdsAgentAnalysisProps {
  dateRange?: DateRangeType
}

interface ParsedAnalysis {
  performanceStatus: string
  executiveSummary: string[]
  problemsDetected: string[]
  trends: string[]
  recommendations: string[]
  creativeSuggestions: string[]
  actionChecklist: string[]
}

// Parse markdown analysis into structured data
function parseAnalysis(markdown: string): ParsedAnalysis {
  const sections: ParsedAnalysis = {
    performanceStatus: '🟡 Bueno - Optimizar y diversificar',
    executiveSummary: [],
    problemsDetected: [],
    trends: [],
    recommendations: [],
    creativeSuggestions: [],
    actionChecklist: [],
  }

  // Extract each section
  const extract = (sectionName: string, pattern: RegExp) => {
    const match = markdown.match(pattern)
    if (match) {
      const content = match[1]
      return content
        .split('\n')
        .filter(line => line.trim().length > 0 && line.startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
    }
    return []
  }

  sections.executiveSummary = extract('Executive Summary', /### Executive Summary([\s\S]*?)(?=###|$)/i)
  sections.problemsDetected = extract('Problems', /### Problems Detected([\s\S]*?)(?=###|$)/i)
  sections.trends = extract('Trends', /### Trends([\s\S]*?)(?=###|$)/i)
  sections.recommendations = extract('Recommendations', /### Recommendations([\s\S]*?)(?=###|$)/i)
  sections.creativeSuggestions = extract('Creative', /### Creative Suggestions([\s\S]*?)(?=###|$)/i)
  sections.actionChecklist = extract('Action', /### Action Checklist([\s\S]*?)(?=###|$)/i)

  // Extract performance status
  const statusMatch = markdown.match(/## Performance Status\s*:\s*([^\n]+)/)
  if (statusMatch) {
    sections.performanceStatus = statusMatch[1].trim()
  }

  return sections
}

export function MetaAdsAgentAnalysis({ dateRange }: MetaAdsAgentAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('summary')

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)

        let days = 7
        if (dateRange?.from && dateRange?.to) {
          days = Math.ceil(
            (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        const response = await fetch(`/api/meta/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch analysis')
        }

        const data = await response.json()
        setAnalysis(data)
        setParsedAnalysis(parseAnalysis(data.analysis))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching analysis:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [dateRange])

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            AI Expert Analysis
          </CardTitle>
          <CardDescription>Loading insights from your campaign data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading analysis: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!analysis || !parsedAnalysis) {
    return null
  }

  const roasHealth = analysis.summary.roas >= 2 ? 'healthy' : analysis.summary.roas >= 1.5 ? 'warning' : 'critical'

  const SectionCard = ({
    icon: Icon,
    title,
    items,
    color,
    sectionKey
  }: {
    icon: React.ReactNode
    title: string
    items: string[]
    color: string
    sectionKey: string
  }) => {
    const isExpanded = expandedSection === sectionKey
    const hasItems = items.length > 0

    return (
      <div
        className={cn(
          'rounded-lg border overflow-hidden transition-all',
          isExpanded && hasItems ? 'ring-2 ring-offset-2 ring-offset-background' : '',
          color === 'green' ? 'border-green-500/30 bg-green-500/5 ring-green-500/50' :
          color === 'red' ? 'border-red-500/30 bg-red-500/5 ring-red-500/50' :
          color === 'blue' ? 'border-blue-500/30 bg-blue-500/5 ring-blue-500/50' :
          color === 'purple' ? 'border-purple-500/30 bg-purple-500/5 ring-purple-500/50' :
          'border-yellow-500/30 bg-yellow-500/5 ring-yellow-500/50'
        )}
      >
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              color === 'green' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              color === 'red' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
              color === 'blue' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
              color === 'purple' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
              'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            )}>
              {Icon}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{title}</p>
              {hasItems && <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>}
            </div>
          </div>
          {hasItems && (
            <div className={cn(
              'transition-transform',
              isExpanded ? 'rotate-180' : ''
            )}>
              <TrendingDown className="h-4 w-4" />
            </div>
          )}
        </button>

        {isExpanded && hasItems && (
          <div className="border-t px-4 py-3 space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="text-sm flex gap-2">
                <span className="text-xs opacity-60 min-w-4">•</span>
                <span className="text-xs leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        )}

        {!hasItems && (
          <div className="px-4 py-3 text-xs text-muted-foreground italic">
            No items in this section
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-border/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-3xl -z-0" />

        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Expert Analysis
                </CardTitle>
                <CardDescription>
                  Powered by intelligent campaign performance recognition
                </CardDescription>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground text-xs">Analysis Period</p>
              <p className="font-semibold">{analysis.period}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Stats Grid */}
          <div className="grid gap-2 md:grid-cols-5">
            <div className="rounded-lg bg-muted/40 p-3 border border-border/50 hover:border-border transition-colors">
              <p className="text-xs text-muted-foreground mb-1">Total Spend</p>
              <p className="text-lg font-bold">${analysis.summary.totalSpend.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{(analysis.summary.totalSpend / analysis.summary.totalImpressions * 1000).toFixed(3)} CPM</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border/50 hover:border-border transition-colors">
              <p className="text-xs text-muted-foreground mb-1">Impressions</p>
              <p className="text-lg font-bold">{(analysis.summary.totalImpressions / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground mt-1">Reach</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border/50 hover:border-border transition-colors">
              <p className="text-xs text-muted-foreground mb-1">Conversions</p>
              <p className="text-lg font-bold">{analysis.summary.totalConversions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((analysis.summary.totalConversions / analysis.summary.totalImpressions) * 100).toFixed(2)}% CVR
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border/50 hover:border-border transition-colors">
              <p className="text-xs text-muted-foreground mb-1">Revenue</p>
              <p className="text-lg font-bold">${analysis.summary.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(analysis.summary.totalRevenue / analysis.summary.totalSpend - 1).toFixed(1)}% Profit
              </p>
            </div>
            <div className={cn(
              'rounded-lg p-3 border font-semibold',
              roasHealth === 'healthy' ? 'bg-green-500/10 border-green-500/30' :
              roasHealth === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-500/10 border-red-500/30'
            )}>
              <p className="text-xs text-muted-foreground mb-1">ROAS</p>
              <p className={cn(
                'text-lg font-bold',
                roasHealth === 'healthy' ? 'text-green-500' :
                roasHealth === 'warning' ? 'text-yellow-500' :
                'text-red-500'
              )}>
                {analysis.summary.roas.toFixed(2)}x
              </p>
              <p className={cn(
                'text-xs mt-1',
                roasHealth === 'healthy' ? 'text-green-600 dark:text-green-400' :
                roasHealth === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {roasHealth === 'healthy' ? '✓ Healthy' : roasHealth === 'warning' ? '⚠ Fair' : '✗ Poor'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Status */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'px-4 py-3 rounded-lg border-2 text-center',
            roasHealth === 'healthy' ? 'border-green-500/40 bg-green-500/5' :
            roasHealth === 'warning' ? 'border-yellow-500/40 bg-yellow-500/5' :
            'border-red-500/40 bg-red-500/5'
          )}>
            <p className="text-sm font-semibold">{parsedAnalysis.performanceStatus}</p>
          </div>
        </CardContent>
      </Card>

      {/* Insights Sections */}
      <div className="space-y-2">
        <SectionCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Executive Summary"
          items={parsedAnalysis.executiveSummary}
          color="green"
          sectionKey="summary"
        />

        <SectionCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Problems Detected"
          items={parsedAnalysis.problemsDetected}
          color="red"
          sectionKey="problems"
        />

        <SectionCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Positive Trends"
          items={parsedAnalysis.trends}
          color="green"
          sectionKey="trends"
        />

        <SectionCard
          icon={<Rocket className="h-4 w-4" />}
          title="Actionable Recommendations"
          items={parsedAnalysis.recommendations}
          color="purple"
          sectionKey="recommendations"
        />

        <SectionCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Creative Ideas & Hooks"
          items={parsedAnalysis.creativeSuggestions}
          color="blue"
          sectionKey="creative"
        />

        <SectionCard
          icon={<ListChecks className="h-4 w-4" />}
          title="Action Checklist (Priority)"
          items={parsedAnalysis.actionChecklist}
          color="yellow"
          sectionKey="checklist"
        />
      </div>

      {/* Footer CTA */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
        <div className="flex gap-2 items-start">
          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-blue-600 dark:text-blue-400">Next Steps</p>
            <p className="text-xs text-muted-foreground">
              Start with the highest priority items in your action checklist. Each recommendation can have a 10-30% impact on ROAS. Monitor results over 7-14 days before implementing additional changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
