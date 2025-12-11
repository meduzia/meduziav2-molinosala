"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface PredictionsData {
  hasData: boolean;
  avgDailySpend?: number;
  projectedSpend30Days?: number;
  confidence?: "high" | "medium" | "low";
  projectedCPAWeek?: number;
  cpaTrend?: number;
  budgetUsed?: number | null;
  daysUntilBudgetExhausted?: number | null;
  monthlyBudget?: number;
}

interface SpendingPredictionsProps {
  dateRange?: DateRangeType;
  monthlyBudget?: number;
}

// Animated counter component
function AnimatedCounter({ value, format = "number" }: { value: number; format?: "number" | "currency" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(increment * currentStep);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  if (format === "currency") {
    return <span>${displayValue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>;
  }
  return <span>{displayValue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>;
}

export function SpendingPredictions({ dateRange, monthlyBudget }: SpendingPredictionsProps) {
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    if (monthlyBudget) {
      params.append('budget', monthlyBudget.toString());
    }

    fetch(`/api/predictions?${params}`)
      .then((res) => res.json())
      .then((data: PredictionsData) => {
        setPredictions({ ...data, monthlyBudget });
      })
      .catch((err) => {
        console.error("Error fetching predictions:", err);
        setPredictions({ hasData: false });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange, monthlyBudget]);

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getConfidenceLabel = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return "N/A";
    }
  };

  const getCPATrendIcon = (trend?: number) => {
    if (trend === undefined || trend === 0) return ArrowRight;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getCPATrendColor = (trend?: number) => {
    if (trend === undefined || trend === 0) return "text-blue-400";
    return trend > 0 ? "text-red-400" : "text-green-400";
  };

  const getCPATrendLabel = (trend?: number) => {
    if (trend === undefined || trend === 0) return "→ CPA estable";
    return trend > 0 ? "↑ CPA subiendo" : "↓ CPA bajando";
  };

  if (loading) {
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm rounded-xl"
      )}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Cargando predicciones...</div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions?.hasData) {
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm rounded-xl"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🔮 Predicciones de Gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Insuficientes datos para generar predicciones
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = getCPATrendIcon(predictions.cpaTrend);
  const cpaExceedsThreshold = (predictions.projectedCPAWeek || 0) > 150;
  const spendExceedsBudget = predictions.projectedSpend30Days && predictions.monthlyBudget
    ? predictions.projectedSpend30Days > predictions.monthlyBudget
    : false;
  const budgetWarning = predictions.budgetUsed && predictions.budgetUsed > 80;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm rounded-xl",
      budgetWarning && "border-purple-500/40"
    )}>
      {/* Gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🔮 Predicciones de Gasto
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  ℹ️ Predicciones basadas en tendencia de últimos 14 días usando regresión lineal.
                  Actualizado automáticamente con cada cambio de filtros.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {/* 30-Day Projection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground/80">A este ritmo:</span>
            <span className="font-bold text-foreground">
              <AnimatedCounter 
                value={predictions.projectedSpend30Days || 0} 
                format="currency" 
              />{" "}
              en 30 días
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground/70">Confianza:</span>
            <span className={cn("font-semibold", getConfidenceColor(predictions.confidence))}>
              {getConfidenceLabel(predictions.confidence)}
            </span>
          </div>
          {spendExceedsBudget && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/30 mt-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Proyección excede el budget mensual</span>
            </div>
          )}
        </div>

        {/* Budget Alert */}
        {predictions.budgetUsed !== null && (
          <div className={cn(
            "space-y-2 p-3 rounded-lg border",
            budgetWarning 
              ? "bg-red-500/10 border-red-500/30 animate-pulse" 
              : "bg-muted/30 border-border/50"
          )}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground/80">Budget mensual:</span>
              <span className={cn(
                "font-bold",
                budgetWarning ? "text-red-400" : "text-foreground"
              )}>
                {predictions.budgetUsed.toFixed(1)}% usado
              </span>
            </div>
            <Progress
              value={predictions.budgetUsed}
              className={cn(
                "h-2.5",
                budgetWarning && "animate-pulse"
              )}
            />
            {predictions.daysUntilBudgetExhausted !== null && (
              <p className="text-xs text-muted-foreground/80">
                {predictions.daysUntilBudgetExhausted > 0
                  ? `Te quedan ${predictions.daysUntilBudgetExhausted} días de budget al ritmo actual`
                  : "⚠️ Budget agotado"}
              </p>
            )}
          </div>
        )}

        {/* CPA Trend */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground/80">CPA proyectado próxima semana:</span>
            <div className="flex items-center gap-1.5">
              <TrendIcon className={cn("h-4 w-4", getCPATrendColor(predictions.cpaTrend))} />
              <span className={cn(
                "font-bold",
                cpaExceedsThreshold ? "text-red-400" : "text-foreground"
              )}>
                ${predictions.projectedCPAWeek?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-xs font-medium",
              getCPATrendColor(predictions.cpaTrend)
            )}>
              {getCPATrendLabel(predictions.cpaTrend)}
            </p>
            {cpaExceedsThreshold && (
              <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
                <AlertCircle className="h-3 w-3" />
                <span>Alto</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

