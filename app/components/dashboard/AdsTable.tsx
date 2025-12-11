"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type TopRow = { adName: string; roas: number; spend: number; revenue: number; cpa?: number; conversions?: number };

interface AdsTableProps {
  dateRange?: DateRangeType;
}

export const AdsTable = ({ dateRange }: AdsTableProps) => {
  const [rows, setRows] = useState<TopRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    let mounted = true;
    setLoading(true);
    
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/top?${params}`)
      .then((r) => r.json())
      .then((data: any) => {
        if (mounted) {
          if (data.error) {
            console.error("API error fetching top ads:", data.error);
            setRows([]);
          } else if (Array.isArray(data)) {
            setRows(data);
          } else {
            setRows([]);
          }
        }
      })
      .catch(() => {
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    
    return () => {
      mounted = false;
    };
  }, [dateRange]);

  const getDateRangeLabel = () => {
    if (!dateRange?.from || !dateRange?.to) return "";
    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} días`;
  };

  const getStatusColor = (cpa?: number) => {
    if (!cpa) return "";
    if (cpa > 150) return "text-red-500";
    if (cpa >= 100 && cpa <= 150) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusDot = (cpa?: number) => {
    if (!cpa) return null;
    if (cpa > 150) return "🔴";
    if (cpa >= 100 && cpa <= 150) return "🟡";
    return "🟢";
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Mejores Anuncios (CPA más bajo) {dateRange && `(${getDateRangeLabel()})`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm">Anuncio</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Status</th>
                <th className="text-right py-3 px-4 font-medium text-sm">CPA</th>
                <th className="text-right py-3 px-4 font-medium text-sm">ROAS</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Spend</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const statusColor = getStatusColor(row.cpa);
                const statusDot = getStatusDot(row.cpa);
                return (
                <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-sm">{row.adName}</td>
                    <td className="py-3 px-4 text-right text-sm">
                      <span className={statusColor}>{statusDot}</span>
                    </td>
                    <td className={cn("py-3 px-4 text-right text-sm font-semibold", statusColor)}>
                      {row.cpa ? `$${row.cpa.toFixed(2)}` : "N/A"}
                    </td>
                  <td className="py-3 px-4 text-right text-sm">{row.roas.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm">${row.spend.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-sm">${row.revenue.toLocaleString()}</td>
                </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td className="py-4 px-4 text-muted-foreground" colSpan={6}>
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
