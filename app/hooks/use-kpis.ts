import { useQuery } from '@tanstack/react-query'

interface KPIParams {
  from?: string
  to?: string
}

interface KPIData {
  totalSpend: number
  totalRevenue: number
  avgCPA: number
  avgROAS: number
  avgCTR: number
  totalConversions: number
  totalImpressions: number
  totalClicks: number
  trends: {
    spend: number
    revenue: number
    cpa: number
    roas: number
    ctr: number
  }
}

async function fetchKPIs(params: KPIParams): Promise<KPIData> {
  const searchParams = new URLSearchParams()
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)

  const response = await fetch(`/api/kpis?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Error fetching KPIs')
  }

  return response.json()
}

export function useKPIs(params: KPIParams = {}) {
  return useQuery({
    queryKey: ['kpis', params],
    queryFn: () => fetchKPIs(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}
