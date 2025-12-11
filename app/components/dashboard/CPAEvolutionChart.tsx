"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface CPAEvolutionChartProps {
  dateRange?: DateRangeType;
}

export function CPAEvolutionChart({ dateRange }: CPAEvolutionChartProps) {
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
      fetch(`/api/charts/cpa-evolution?${params}`).then((res) => res.json()),
      fetch(`/api/predictions?${params}`).then((res) => res.json()),
    ])
      .then(([evolutionData, predictions]) => {
        setChartData(evolutionData);
        
        // Generar datos de proyección
        if (predictions.hasData && predictions.cpaProjectionData && evolutionData.length > 0) {
          setProjectionData(predictions.cpaProjectionData);
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
      const cpa = data.cpa ?? 0;
      const changePercent = data.changePercent ?? 0;
      
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="font-semibold mb-2 text-foreground">{format(new Date(label), "PPP")}</p>
          <p className="text-sm">
            CPA: <span className="font-semibold text-primary">${cpa.toFixed(2)}</span>
            {data.isProjected && (
              <span className="ml-2 text-xs text-muted-foreground">(Proyectado)</span>
            )}
          </p>
          {changePercent !== undefined && changePercent !== 0 && (
            <p className={cn(
              "text-sm mt-1",
              changePercent > 0 ? "text-red-400" : "text-green-400"
            )}>
              {changePercent > 0 ? "↑" : "↓"} {Math.abs(changePercent).toFixed(1)}% vs día anterior
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Preparar datos combinados (históricos + proyección)
  const combinedData = [
    ...chartData.map((item) => ({
      ...item,
      isProjected: false,
    })),
    ...(showProjection ? projectionData : []),
  ];

  // Preparar datos para área sombreada (solo cuando CPA > 150)
  const chartDataWithArea = chartData.map((item) => ({
    ...item,
    areaValue: item.isAboveThreshold ? item.cpa : null,
  }));

  // Calcular intervalo de confianza para proyección (simple aproximación)
  const projectionWithConfidence = projectionData.map((item) => {
    const variance = 5; // Aproximación simple
    return {
      ...item,
      confidenceUpper: item.cpa + variance,
      confidenceLower: Math.max(0, item.cpa - variance),
    };
  });

  return (
    <Card className="gradient-purple border-border/50 rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            📉 CPA Evolution
          </CardTitle>
          <div className="flex items-center gap-2">
            {projectionData.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProjection(!showProjection)}
                className={cn(
                  "h-8 px-2 text-xs",
                  showProjection 
                    ? "text-primary hover:text-primary/80" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {showProjection ? (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Ocultar proyección
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Mostrar proyección
                  </>
                )}
              </Button>
            )}
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Línea roja punteada en $150 (umbral de alerta). 
                    {showProjection && projectionData.length > 0 && (
                      <> Línea discontinua: proyección próximos 7 días.</>
                    )}
                  </p>
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
            <AreaChart data={combinedData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="colorAlertArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
                {showProjection && (
                  <>
                    <linearGradient id="colorProjectionArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.05} />
                    </linearGradient>
                  </>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
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
              <ReferenceLine
                y={150}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{ 
                  value: "Alert Threshold", 
                  position: "right", 
                  fill: "#ef4444",
                  fontSize: 10,
                }}
              />
              
              {/* Área sombreada para CPA > 150 (solo datos históricos) */}
              <Area
                type="monotone"
                dataKey="areaValue"
                data={chartDataWithArea}
                stroke="none"
                fill="url(#colorAlertArea)"
                fillOpacity={0.3}
              />
              
              {/* Intervalo de confianza para proyección */}
              {showProjection && projectionData.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  data={projectionWithConfidence}
                  stroke="none"
                  fill="url(#colorProjectionArea)"
                  fillOpacity={0.2}
                  stackId="confidence"
                />
              )}
              
              {/* Línea principal de CPA histórica */}
              <Line
                type="monotone"
                dataKey="cpa"
                data={chartData}
                stroke="#60a5fa"
                strokeWidth={3}
                dot={{ fill: "#60a5fa", r: 4 }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
                name="CPA"
              />
              
              {/* Línea de proyección (discontinua) */}
              {showProjection && projectionData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="cpa"
                  data={projectionData}
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  dot={{ fill: "#a78bfa", r: 3, strokeWidth: 2, stroke: "#a78bfa" }}
                  activeDot={{ r: 5, fill: "#a78bfa" }}
                  name="CPA Proyectado"
                  strokeOpacity={0.8}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

