"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AngleData {
  angle: string;
  adsCount: number;
  avgCPA: number;
  totalConversions: number;
  avgROAS: number;
  trend: number;
}

interface WinningAnglesProps {
  dateRange?: DateRangeType;
}

export const WinningAngles = ({ dateRange }: WinningAnglesProps) => {
  const [angles, setAngles] = useState<AngleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/angles?${params}`)
      .then((res) => res.json())
      .then((data: any) => {
        // Verificar si es un error
        if (data.error) {
          console.error("API error fetching angles:", data.error);
          setAngles([]);
        } else if (Array.isArray(data)) {
          setAngles(data);
        } else {
          setAngles([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching angles:", err);
        setAngles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  const getTrendDisplay = (trend: number) => {
    if (trend === 0) return null;
    const isPositive = trend > 0; // Para CPA, positivo significa mejor (menor CPA)
    return {
      isPositive,
      value: Math.abs(trend),
      color: isPositive ? "text-green-500" : "text-red-500",
      icon: isPositive ? ArrowUpIcon : ArrowDownIcon,
    };
  };

  const bestAngle = angles.length > 0 ? angles[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Ángulos Ganadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Cargando...
          </div>
        ) : angles.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Sin datos disponibles
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm">Ángulo</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Ads Count</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Avg CPA</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Total Conversions</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Avg ROAS</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Trend</th>
                </tr>
              </thead>
              <tbody>
                {angles.map((angle, index) => {
                  const isBest = index === 0;
                  const hasHighCPA = angle.avgCPA > 150;
                  const trendDisplay = getTrendDisplay(angle.trend);

                  return (
                    <tr
                      key={index}
                      className={cn(
                        "border-b border-border hover:bg-muted/50 transition-colors",
                        isBest && "bg-green-500/10"
                      )}
                    >
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {angle.angle}
                          {isBest && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-green-500/20 text-green-500 border border-green-500/50">
                              🏆 BEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {angle.adsCount}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-right text-sm font-semibold",
                          hasHighCPA && "text-red-500"
                        )}
                      >
                        ${angle.avgCPA.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {angle.totalConversions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {angle.avgROAS.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {trendDisplay ? (
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1",
                              trendDisplay.color
                            )}
                          >
                            <trendDisplay.icon className="h-4 w-4" />
                            <span>{trendDisplay.value.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

