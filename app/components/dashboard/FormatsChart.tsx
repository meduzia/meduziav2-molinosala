"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormatData {
  format: string;
  cpa: number;
  roas: number;
  conversions: number;
}

interface FormatsChartProps {
  dateRange?: DateRangeType;
}

export function FormatsChart({ dateRange }: FormatsChartProps) {
  const [chartData, setChartData] = useState<FormatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"cpa" | "roas" | "conversions">("cpa");

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/charts/formats?${params}`)
      .then((res) => res.json())
      .then((data: FormatData[]) => {
        setChartData(data);
      })
      .catch((err) => {
        console.error("Error fetching chart data:", err);
        setChartData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  // Ordenar y colorear según la métrica seleccionada
  const sortedData = [...chartData].sort((a, b) => {
    if (metric === "cpa") {
      // Para CPA, menor es mejor
      return a.cpa - b.cpa;
    } else if (metric === "roas") {
      // Para ROAS, mayor es mejor
      return b.roas - a.roas;
    } else {
      // Para conversions, mayor es mejor
      return b.conversions - a.conversions;
    }
  });

  const getBarColor = (value: number, format: string) => {
    if (metric === "cpa") {
      if (value > 150) return "#ef4444"; // Red
      if (value >= 100 && value <= 150) return "#fbbf24"; // Yellow
      return "#34d399"; // Green
    } else if (metric === "roas") {
      if (value < 2) return "#ef4444"; // Red
      if (value >= 2 && value < 3) return "#fbbf24"; // Yellow
      return "#34d399"; // Green
    } else {
      // Para conversions, usar colores por orden
      const index = sortedData.findIndex((d) => d.format === format);
      if (index === 0) return "#34d399"; // Green (best)
      if (index === sortedData.length - 1) return "#ef4444"; // Red (worst)
      return "#fbbf24"; // Yellow (middle)
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cpa = data.cpa ?? 0;
      const roas = data.roas ?? 0;
      const conversions = data.conversions ?? 0;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.format || 'Sin formato'}</p>
          <p className="text-sm">
            CPA: <span className="font-semibold">${cpa.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            ROAS: <span className="font-semibold">{roas.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Conversions: <span className="font-semibold">{conversions.toLocaleString()}</span>
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
            📱 Performance por Formato
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpa">CPA</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="conversions">Conversions</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cambia la métrica para ver diferentes perspectivas. Colores: Verde (mejor), Amarillo (medio), Rojo (peor)</p>
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
            <BarChart data={sortedData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis
                dataKey="format"
                stroke="currentColor"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry[metric], entry.format)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

