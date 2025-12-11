'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { DateRange as DateRangeType } from 'react-day-picker'
import { TrendingUp, DollarSign, Eye, MousePointer, Target, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: string
  cpc: string
  cpa: string
  roas: string
}

export default function MetaCampaignsPage() {
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return { from: start, to: end }
  })

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('')

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    setLoading(true)
    const days = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    )

    fetch(`/api/meta/campaigns?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.campaigns || [])
        setPeriod(data.period || '')
      })
      .catch((err) => {
        console.error('Error fetching campaigns:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dateRange])

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)

  const getROASColor = (roas: number) => {
    if (roas >= 4) return 'text-green-500'
    if (roas >= 2) return 'text-emerald-500'
    if (roas >= 1) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getCPAColor = (cpa: number) => {
    if (cpa === 0) return 'text-gray-500'
    if (cpa < 20) return 'text-green-500'
    if (cpa < 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meta Ads Campaigns</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Performance overview from your Meta advertising account
              </p>
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                Total Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {campaigns.length} campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalImpressions / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(totalImpressions / campaigns.length).toFixed(0)} avg per campaign
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-cyan-500" />
                Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((totalClicks / totalImpressions) * 100).toFixed(2)}% CTR
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(totalSpend / totalConversions).toFixed(2)}€ CPA average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className={cn('text-xs font-semibold mt-1', getROASColor(totalRevenue / totalSpend))}>
                {(totalRevenue / totalSpend).toFixed(2)}x ROAS
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Campaigns Details</CardTitle>
            <CardDescription>{period}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns found for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Campaign Name
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Spend
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Impressions
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Clicks
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        CTR
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        CPC
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Conversions
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        CPA
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Revenue
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        ROAS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{campaign.name}</td>
                        <td className="py-3 px-4 text-right">${campaign.spend.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          {(campaign.impressions / 1000).toFixed(1)}K
                        </td>
                        <td className="py-3 px-4 text-right">
                          {campaign.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">{campaign.ctr}%</td>
                        <td className="py-3 px-4 text-right">${campaign.cpc}</td>
                        <td className="py-3 px-4 text-right">
                          {campaign.conversions.toLocaleString()}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-semibold',
                            getCPAColor(parseFloat(campaign.cpa))
                          )}
                        >
                          ${campaign.cpa}
                        </td>
                        <td className="py-3 px-4 text-right">${campaign.revenue.toFixed(2)}</td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-bold',
                            getROASColor(parseFloat(campaign.roas))
                          )}
                        >
                          {campaign.roas}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
