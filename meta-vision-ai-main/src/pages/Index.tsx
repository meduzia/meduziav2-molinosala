import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ROASChart } from "@/components/dashboard/ROASChart";
import { AdsTable } from "@/components/dashboard/AdsTable";
import { CreativeComparison } from "@/components/dashboard/CreativeComparison";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { WinningAds } from "@/components/dashboard/WinningAds";
import { BenchmarkingComparison } from "@/components/dashboard/BenchmarkingComparison";
import { CreativeAnglesAnalysis } from "@/components/dashboard/CreativeAnglesAnalysis";
import { TravelerArchetypes } from "@/components/dashboard/TravelerArchetypes";
import { ArchetypeAngleMatrix } from "@/components/dashboard/ArchetypeAngleMatrix";
import { overallMetrics } from "@/data/mockMetaAdsData";
import { DollarSign, TrendingUp, Target, MousePointer, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Meta Ads Analytics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Panel de análisis y optimización de campañas publicitarias
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" />
              <span>Actualizado: Octubre 2024</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Métricas Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Inversión Total"
              value={overallMetrics.totalSpend}
              format="currency"
              icon={<DollarSign className="h-4 w-4" />}
              trend={12}
            />
            <MetricCard
              title="Ingresos Generados"
              value={overallMetrics.totalRevenue}
              format="currency"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={28}
            />
            <MetricCard
              title="ROAS Promedio"
              value={overallMetrics.totalRoas.toFixed(2)}
              subtitle="x inversión"
              icon={<Target className="h-4 w-4" />}
              trend={15}
            />
            <MetricCard
              title="CTR Promedio"
              value={overallMetrics.avgCtr}
              format="percentage"
              icon={<MousePointer className="h-4 w-4" />}
              trend={5}
            />
            <MetricCard
              title="Conversiones"
              value={overallMetrics.totalConversions}
              subtitle={`CPA: $${overallMetrics.avgCpa}`}
              trend={22}
            />
          </div>
        </section>

        {/* Performance Charts */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Rendimiento Temporal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PerformanceChart />
            <ROASChart />
          </div>
        </section>

        {/* Creative Analysis & Winning Ads */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Análisis de Creatividad</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreativeComparison />
            <WinningAds />
          </div>
        </section>

        {/* AI Recommendations */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Optimización Inteligente</h2>
          <AIRecommendations />
        </section>

        {/* Benchmarking Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Benchmarking de Competencia</h2>
          <BenchmarkingComparison />
        </section>

        {/* Creative Angles Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Análisis de Ángulos Creativos</h2>
          <CreativeAnglesAnalysis />
        </section>

        {/* Traveler Archetypes Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Arquetipos de Viajeros</h2>
          <TravelerArchetypes />
        </section>

        {/* Archetype-Angle Matrix Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Matriz Arquetipo × Ángulo</h2>
          <ArchetypeAngleMatrix />
        </section>

        {/* Detailed Ads Table */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Vista Detallada de Anuncios</h2>
          <AdsTable />
        </section>
      </main>
    </div>
  );
};

export default Index;
