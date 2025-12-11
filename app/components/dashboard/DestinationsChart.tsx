"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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

interface DestinationData {
  destination: string;
  conversions: number;
  percentage: number;
  cpa: number;
  roas: number;
}

interface DestinationsChartProps {
  dateRange?: DateRangeType;
}

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

export function DestinationsChart({ dateRange }: DestinationsChartProps) {
  const [chartData, setChartData] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/charts/destinations?${params}`)
      .then((res) => res.json())
      .then((data: DestinationData[]) => {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = data.percentage ?? 0;
      const cpa = data.cpa ?? 0;
      const roas = data.roas ?? 0;
      const conversions = data.conversions ?? 0;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.destination || 'Sin destino'}</p>
          <p className="text-sm">
            Conversions: <span className="font-semibold">{conversions.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            Percentage: <span className="font-semibold">{percentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm">
            CPA: <span className="font-semibold">${cpa.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            ROAS: <span className="font-semibold">{roas.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    // Aquí puedes implementar el filtrado del dashboard
    console.log("Filter by destination:", data.destination);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🌎 Conversiones por Destino
          </CardTitle>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Haz clic en un segmento para filtrar el dashboard por destino</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
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
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => {
                  const pct = percentage ?? 0;
                  return `${name}: ${pct.toFixed(1)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="conversions"
                onClick={handleClick}
                style={{ cursor: "pointer" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

