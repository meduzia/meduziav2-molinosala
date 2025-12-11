import { MetricCardsSkeleton } from '@/components/dashboard/MetricCardSkeleton'
import { ChartsSkeleton } from '@/components/dashboard/ChartSkeleton'
import { TableSkeleton } from '@/components/dashboard/TableSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCardsSkeleton count={4} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartsSkeleton count={4} />
        </div>

        {/* Table */}
        <TableSkeleton rows={10} />
      </div>
    </div>
  )
}
