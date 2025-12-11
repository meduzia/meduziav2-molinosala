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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PerformanceChartProps {
  dateRange?: DateRangeType;
}

export function PerformanceChart({ dateRange }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/charts/performance?${params}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.error) {
          console.error("API error fetching performance data:", data.error);
          setChartData([]);
        } else if (Array.isArray(data)) {
          setChartData(data);
        } else {
          setChartData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching chart data:", err);
        setChartData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance (Spend vs Revenue)</CardTitle>
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
            <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
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
              <Tooltip
                labelFormatter={(value) => format(new Date(value), "PPP")}
                formatter={(value: any, name: string) => {
                  const numValue = value ?? 0;
                  return [`$${numValue.toLocaleString()}`, name];
                }}
              />
            <Line type="monotone" dataKey="spend" stroke="#60a5fa" strokeWidth={2} dot={false} name="Spend" />
            <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} dot={false} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


