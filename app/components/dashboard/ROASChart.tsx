"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from "date-fns";

interface ROASChartProps {
  dateRange?: DateRangeType;
}

export const ROASChart = ({ dateRange }: ROASChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/charts/roas?${params}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.error) {
          console.error("API error fetching ROAS data:", data.error);
          setChartData([]);
        } else if (Array.isArray(data)) {
          setChartData(data);
        } else {
          setChartData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching ROAS data:", err);
        setChartData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución ROAS</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Cargando...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm mb-2">Sin datos disponibles</p>
            <p className="text-xs text-muted-foreground/70">Los datos aparecerán aquí cuando haya campañas activas</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
                tickFormatter={(value) => format(new Date(value), "MMM dd")}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelFormatter={(value) => format(new Date(value), "PPP")}
              formatter={(value: any) => {
                const roas = value ?? 0;
                return `${roas.toFixed(2)}x`;
              }}
            />
            <ReferenceLine y={3} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Objetivo" />
            <Line 
              type="monotone" 
              dataKey="roas" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
              name="ROAS"
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
