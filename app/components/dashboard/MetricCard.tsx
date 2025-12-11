import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
  lowerIsBetter?: boolean; // Para métricas como CPA donde menor es mejor
  alertStatus?: 'high' | 'warning' | 'healthy'; // Estado de alerta para CPA
}

export const MetricCard = ({ title, value, subtitle, trend, icon, format, lowerIsBetter = false, alertStatus }: MetricCardProps) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${typeof val === 'number' ? val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val}`;
    }
    if (format === 'percentage') {
      return `${typeof val === 'number' ? val.toFixed(1) : val}%`;
    }
    return typeof val === 'number' ? val.toLocaleString('es-ES') : val;
  };

  // Determinar si la tendencia es positiva o negativa según la métrica
  const getTrendDisplay = () => {
    if (trend === undefined || trend === 0) return null;
    
    const isPositive = lowerIsBetter ? trend < 0 : trend > 0;
    const trendValue = Math.abs(trend);
    
    return {
      isPositive,
      value: trendValue,
      color: isPositive ? "text-green-500" : "text-red-500",
      icon: isPositive ? ArrowUpIcon : ArrowDownIcon,
    };
  };

  // Obtener estilos de alerta según el estado
  const getAlertStyles = () => {
    if (!alertStatus) return { border: "", badge: "", badgeText: "" };
    
    switch (alertStatus) {
      case 'high':
        return {
          border: "border-2 border-red-500",
          badge: "bg-red-500/20 text-red-500 border-red-500",
          badgeText: "⚠️ HIGH CPA"
        };
      case 'warning':
        return {
          border: "border-2 border-yellow-500",
          badge: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
          badgeText: "⚠ Watch CPA"
        };
      case 'healthy':
        return {
          border: "border-2 border-green-500",
          badge: "bg-green-500/20 text-green-500 border-green-500",
          badgeText: "✓ Healthy"
        };
      default:
        return { border: "", badge: "", badgeText: "" };
    }
  };

  const trendDisplay = getTrendDisplay();
  const alertStyles = getAlertStyles();

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "border border-border/50 rounded-xl",
      "gradient-purple",
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/50",
      alertStyles.border
    )}
    style={{ animation: 'fade-in 0.5s ease-out' }}>
      {/* Gradiente superior con efecto glow animado */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50" />
      
      {/* Fondo decorativo con blur */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground/80 group hover:text-purple-400 transition-colors">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {alertStatus && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-semibold rounded-md border backdrop-blur-sm transition-all duration-300 animate-scale-in",
                alertStyles.badge
              )}>
                {alertStyles.badgeText}
              </span>
            )}
            {icon && <div className="text-primary/70 hover:text-primary transition-colors duration-300 hover:animate-float">{icon}</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-foreground group-hover:text-gradient-purple transition-all duration-300">{formatValue(value)}</div>
            {subtitle && <p className="text-xs text-muted-foreground/70 mt-1 hover:text-muted-foreground transition-colors duration-300">{subtitle}</p>}
          </div>
          {trendDisplay && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-300",
              "hover:scale-110 hover:shadow-lg",
              trendDisplay.isPositive 
                ? "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50" 
                : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
            )}>
              <trendDisplay.icon className="h-4 w-4 animate-bounce" />
              {trendDisplay.value.toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
