"use client";

import { useState, useEffect } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ROASChart } from "@/components/dashboard/ROASChart";
import { AdsTable } from "@/components/dashboard/AdsTable";
import { CreativeComparison } from "@/components/dashboard/CreativeComparison";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { ActiveAlerts } from "@/components/dashboard/ActiveAlerts";
import { WinningAngles } from "@/components/dashboard/WinningAngles";
import { SpendRevenueChart } from "@/components/dashboard/SpendRevenueChart";
import { CPAEvolutionChart } from "@/components/dashboard/CPAEvolutionChart";
import { DestinationsChart } from "@/components/dashboard/DestinationsChart";
import { FormatsChart } from "@/components/dashboard/FormatsChart";
import { SpendingPredictions } from "@/components/dashboard/SpendingPredictions";
import { MetaAdsAgentAnalysis } from "@/components/dashboard/MetaAdsAgentAnalysis";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DollarSign, TrendingUp, Target, MousePointer, Zap, AlertCircle, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { from: start, to: end };
  });

  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/kpis?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setKpiData(data);
      })
      .catch((err) => {
        console.error("Error fetching KPIs:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Obtener conteo de alertas
    fetch(`/api/alerts?${params}`)
      .then((res) => res.json())
      .then((alerts: any[]) => {
        setAlertCount(alerts.length);
      })
      .catch((err) => {
        console.error("Error fetching alerts:", err);
      });
  }, [dateRange]);

  // Determinar estado de alerta para CPA
  const getCPAAlertStatus = (cpa?: number): 'high' | 'warning' | 'healthy' | undefined => {
    if (!cpa) return undefined;
    if (cpa > 150) return 'high';
    if (cpa >= 100 && cpa <= 150) return 'warning';
    return 'healthy';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Header con estilo neón mejorado */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/50 group-hover:shadow-xl group-hover:shadow-purple-500/70 transition-all duration-300 group-hover:scale-110 hover:animate-float">
                R
              </div>
            <div>
                <h1 className="text-2xl font-bold text-gradient-primary group-hover:brightness-125 transition-all duration-300">
                  Retrofish Digital
              </h1>
                <p className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-300">Meta Ads Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/creatives"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 text-sm font-medium hover:text-primary hover:shadow-lg hover:shadow-primary/20 group"
              >
                <Palette className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform duration-300" />
                <span>Creatives</span>
              </Link>
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              {alertCount > 0 && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive border border-destructive/50",
                  "animate-pulse backdrop-blur-sm shadow-lg shadow-destructive/20 hover:bg-destructive/30 hover:border-destructive/70 transition-all duration-300 hover:scale-105"
                )}>
                  <AlertCircle className="h-4 w-4 animate-bounce" />
                  <span className="text-sm font-semibold">🚨 {alertCount} Alert{alertCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground/70 px-3 py-1.5 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/50 hover:bg-success/10 hover:border-success/50 hover:text-success transition-all duration-300 hover:shadow-lg hover:shadow-success/20">
                <Zap className="h-4 w-4 text-primary hover:animate-pulse" />
                <span>Live</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ACTIVE ALERTS SECTION */}
      <section className="mx-auto p-6 w-full">
        <ActiveAlerts dateRange={dateRange} />
      </section>

      {/* KPI CARDS + PREDICTIONS */}
      <section className="mx-auto grid gap-6 p-6 md:grid-cols-4 lg:grid-cols-5 w-full">
        <div className="md:col-span-4 lg:col-span-4 grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Ad Spend"
            value={kpiData?.spend ?? 0}
            format="currency"
            trend={kpiData?.spendTrend}
          />
          <MetricCard
            title="CPA"
            value={kpiData?.cpa ?? 0}
            format="currency"
            trend={kpiData?.cpaTrend}
            lowerIsBetter={true}
            alertStatus={getCPAAlertStatus(kpiData?.cpa)}
          />
          <MetricCard
            title="Conversiones"
            value={kpiData?.conversions ?? 0}
            trend={kpiData?.conversionsTrend}
          />
          <MetricCard
            title="CTR"
            value={kpiData?.ctr ?? 0}
            format="percentage"
            trend={kpiData?.ctrTrend}
          />
        </div>
        <div className="md:col-span-4 lg:col-span-1">
          <SpendingPredictions dateRange={dateRange} />
        </div>
      </section>

      {/* AI RECOMMENDATIONS - Prominent section below predictions */}
      <section className="container mx-auto p-6">
        <AIRecommendations dateRange={dateRange} />
      </section>

      {/* META ADS EXPERT AGENT ANALYSIS */}
      <section className="container mx-auto p-6">
        <MetaAdsAgentAnalysis dateRange={dateRange} />
      </section>

      {/* GOAL BAR con estilo neón */}
      <section className="container mx-auto p-6">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 gradient-purple">
          <p className="text-sm text-muted-foreground/80 mb-2">
            Objetivo mes: <strong className="text-foreground">800 conversiones</strong> → <span className="text-primary">199/800</span> (25%)
        </p>
          <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 w-1/4 rounded-full shadow-lg shadow-purple-500/50 transition-all duration-500"></div>
          </div>
        </div>
      </section>

      {/* WINNING ANGLES */}
      <section className="container mx-auto p-6">
        <WinningAngles dateRange={dateRange} />
      </section>

      {/* ADVANCED CHARTS - 2x2 Grid */}
      <section className="container mx-auto grid gap-6 p-6 md:grid-cols-2">
        <SpendRevenueChart dateRange={dateRange} />
        <CPAEvolutionChart dateRange={dateRange} />
        <DestinationsChart dateRange={dateRange} />
        <FormatsChart dateRange={dateRange} />
      </section>

      {/* CHARTS */}
      <section className="container mx-auto grid gap-6 p-6 md:grid-cols-2">
        <ROASChart dateRange={dateRange} />
        <PerformanceChart dateRange={dateRange} />
      </section>

      {/* TABLE */}
      <section className="container mx-auto p-6">
        <AdsTable dateRange={dateRange} />
      </section>

      {/* Extra: análisis creativo (opcional) */}
      <section className="container mx-auto grid gap-6 p-6 md:grid-cols-2">
        <CreativeComparison />
      </section>
    </div>
  );
}


