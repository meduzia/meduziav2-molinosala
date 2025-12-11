"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, FileText, CheckCircle, PlayCircle, DollarSign, MousePointer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryData {
  totalAssets: number;
  byStatus: {
    draft: number;
    approved: number;
    live: number;
  };
  metrics: {
    totalSpend: number;
    avgCTR: number;
    avgROAS: number;
  };
  byAngle: Array<{
    angle: string;
    count: number;
    avgROAS: number;
    avgCTR: number;
  }>;
}

export function CreativesSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/creatives/summary");
      const summaryData = await response.json();
      setData(summaryData);
    } catch (error) {
      console.error("Error loading creatives summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className="gradient-neon border-border/50">
        <CardHeader>
          <CardTitle>Creatives Summary (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const statusData = [
    {
      status: "Draft",
      count: data.byStatus.draft,
      icon: FileText,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/50",
    },
    {
      status: "Approved",
      count: data.byStatus.approved,
      icon: CheckCircle,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/50",
    },
    {
      status: "Live",
      count: data.byStatus.live,
      icon: PlayCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statusData.map((status) => {
          const Icon = status.icon;
          return (
            <Card
              key={status.status}
              className={cn(
                "gradient-purple border-border/50 transition-all duration-300 hover:scale-[1.02] hover:glow-soft",
                "relative overflow-hidden"
              )}
            >
              <div className={cn("absolute top-0 left-0 right-0 h-1", status.bgColor)} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground/80 mb-1">{status.status}</p>
                    <p className="text-3xl font-bold">{status.count}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">creatives</p>
                  </div>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", status.bgColor, status.borderColor, "border")}>
                    <Icon className={cn("h-6 w-6", status.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gradient-blue border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground/80 mb-1">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(data.metrics.totalSpend)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-blue border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground/80 mb-1">Avg CTR</p>
                <p className="text-2xl font-bold">{formatPercentage(data.metrics.avgCTR)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
                <MousePointer className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-blue border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground/80 mb-1">Avg ROAS</p>
                <p className="text-2xl font-bold">{data.metrics.avgROAS.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Angle Chart */}
      <Card className="gradient-neon border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Performance by Angle</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byAngle.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No angle data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.byAngle}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="angle"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="avgROAS"
                  fill="hsl(262 83% 58%)"
                  name="Avg ROAS"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="avgCTR"
                  fill="hsl(221 83% 53%)"
                  name="Avg CTR (%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Total Assets Summary */}
      <Card className="gradient-purple border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground/80 mb-1">Total Assets (Last 7 Days)</p>
              <p className="text-3xl font-bold">{data.totalAssets}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground/80">
                {data.byStatus.draft + data.byStatus.approved + data.byStatus.live} active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

