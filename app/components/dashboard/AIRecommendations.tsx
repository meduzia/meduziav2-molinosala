"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, Info, RefreshCw, Lightbulb, TrendingUp, DollarSign, Palette, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Insight {
  type: "performance_alert" | "opportunity" | "budget" | "creative" | "prediction";
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  description: string;
  action: string;
}

interface AIRecommendationsProps {
  dateRange?: DateRangeType;
}

export const AIRecommendations = ({ dateRange }: AIRecommendationsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (forceRefresh = false) => {
    if (!dateRange?.from || !dateRange?.to) return;

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        ...(forceRefresh && { refresh: "true" }),
      });

      const response = await fetch(`/api/insights/generate?${params}`);
      const data = await response.json();

      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        setLastUpdated(data.timestamp ? new Date(data.timestamp) : new Date());
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching insights:", err);
      setError("Error al generar insights. Mostrando recomendaciones de respaldo.");
      // Set fallback insights
      setInsights([
        {
          type: "performance_alert",
          priority: "high",
          icon: "⚠️",
          title: "CPA elevado detectado",
          description: "Revisa los anuncios con CPA superior a $150 en las últimas 48 horas",
          action: "Revisar segmentación de audiencias",
        },
        {
          type: "opportunity",
          priority: "medium",
          icon: "💡",
          title: "Optimización de budget",
          description: "Considera redistribuir el presupuesto hacia los ángulos con mejor ROAS",
          action: "Aumentar inversión en top performers",
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange?.from, dateRange?.to]);

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") return <AlertCircle className="h-4 w-4" />;
    if (priority === "medium") return <Sparkles className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const getPriorityVariant = (priority: string) => {
    if (priority === "high") return "destructive";
    if (priority === "medium") return "default";
    return "secondary";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "performance_alert":
        return <AlertCircle className="h-4 w-4" />;
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />;
      case "budget":
        return <DollarSign className="h-4 w-4" />;
      case "creative":
        return <Palette className="h-4 w-4" />;
      case "prediction":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string, type: string) => {
    if (priority === "high") {
      return {
        border: "border-red-500/30",
        bg: "bg-red-500/10",
        text: "text-red-400",
        icon: "text-red-500",
      };
    }
    if (priority === "medium") {
      return {
        border: type === "opportunity" ? "border-yellow-500/30" : "border-primary/30",
        bg: type === "opportunity" ? "bg-yellow-500/10" : "bg-primary/10",
        text: type === "opportunity" ? "text-yellow-400" : "text-primary",
        icon: type === "opportunity" ? "text-yellow-500" : "text-primary",
      };
    }
    if (type === "opportunity") {
      return {
        border: "border-green-500/30",
        bg: "bg-green-500/10",
        text: "text-green-400",
        icon: "text-green-500",
      };
    }
    return {
      border: "border-border/50",
      bg: "bg-muted/30",
      text: "text-muted-foreground",
      icon: "text-muted-foreground",
    };
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm rounded-xl"
    )}>
      {/* Gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🤖 Recomendaciones IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchInsights(true)}
              disabled={refreshing || loading}
              className="h-8 px-2 text-xs"
            >
              <RefreshCw className={cn(
                "h-3.5 w-3.5 mr-1.5",
                (refreshing || loading) && "animate-spin"
              )} />
              {refreshing ? "Regenerando..." : "Actualizar"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-yellow-400 mt-2 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/30">
            {error}
          </p>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border/50 bg-muted/20 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-muted-foreground/20 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay insights disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const colors = getPriorityColor(insight.priority, insight.type);
              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-all hover:shadow-lg hover:scale-[1.01]",
                    colors.border,
                    colors.bg
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1 flex items-center gap-1", colors.icon)}>
                      <span className="text-lg">{insight.icon}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground">{insight.title}</h4>
                        <Badge
                          variant={getPriorityVariant(insight.priority)}
                          className="text-xs"
                        >
                          {getPriorityLabel(insight.priority)}
                        </Badge>
                      </div>
                      <p className={cn("text-sm", colors.text)}>{insight.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <span className="text-xs font-medium text-foreground/80">
                          {insight.action}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
