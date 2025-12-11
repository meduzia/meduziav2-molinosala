"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Eye, EyeOff } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface SpendRevenueChartProps {
  dateRange?: DateRangeType;
}

export function SpendRevenueChart({ dateRange }: SpendRevenueChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [showProjection, setShowProjection] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    Promise.all([
      fetch(`/api/charts/spend-revenue?${params}`).then((res) => res.json()),
      fetch(`/api/predictions?${params}`).then((res) => res.json()),
    ])
      .then(([spendData, predictions]) => {
        setChartData(spendData);
        
        // Generar datos de proyección
        if (predictions.hasData && predictions.projectionData && spendData.length > 0) {
          const lastDate = new Date(spendData[spendData.length - 1].date);
          const projected = predictions.projectionData.map((proj: any, index: number) => {
            const date = addDays(lastDate, index + 1);
            return {
              date: date.toISOString().split("T")[0],
              spend: proj.projectedSpend,
              revenue: null, // No proyectamos revenue
              isProjected: true,
              confidenceUpper: proj.confidenceUpper,
              confidenceLower: proj.confidenceLower,
            };
          });
          setProjectionData(projected);
        } else {
          setProjectionData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching chart data:", err);
        setChartData([]);
        setProjectionData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const spend = data.spend ?? 0;
      const revenue = data.revenue ?? 0;
      const profit = (revenue - spend) ?? 0;
      const profitMargin = spend > 0 ? ((profit / spend) * 100) : 0;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{format(new Date(label), "PPP")}</p>
          <p className="text-sm text-blue-400">
            Spend: ${spend.toLocaleString()}
          </p>
          <p className="text-sm text-green-400">
            Revenue: ${revenue.toLocaleString()}
          </p>
          <p className="text-sm mt-2">
            Profit:{" "}
            <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
              ${profit.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Margin: {profitMargin.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            💰 Spend vs Revenue
          </CardTitle>
          <div className="flex items-center gap-2">
            {projectionData.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProjection(!showProjection)}
                className="h-8"
              >
                {showProjection ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Áreas azul (Spend) y verde (Revenue). Días rentables cuando Revenue &gt; Spend</p>
                  {projectionData.length > 0 && (
                    <p className="mt-1">Línea punteada muestra proyección de próximos 14 días</p>
                  )}
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Cargando...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm mb-2">Sin datos disponibles</p>
            <p className="text-xs text-muted-foreground/70">Los datos aparecerán aquí cuando haya campañas activas</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[...chartData, ...(showProjection ? projectionData : [])]}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorProjectionArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="currentColor"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => format(new Date(value), "MMM dd")}
              />
              <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#a78bfa"
                fillOpacity={1}
                fill="url(#colorSpend)"
                name="Spend"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#60a5fa"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
                isAnimationActive={true}
                animationDuration={1000}
              />
              {showProjection && projectionData.length > 0 && (
                <>
                  <Area
                    type="monotone"
                    dataKey="confidenceUpper"
                    stroke="none"
                    fill="url(#colorProjectionArea)"
                    fillOpacity={0.3}
                    name="Confidence Interval"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Projected Spend"
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                </>
              )}
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

