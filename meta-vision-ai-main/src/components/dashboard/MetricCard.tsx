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
}

export const MetricCard = ({ title, value, subtitle, trend, icon, format }: MetricCardProps) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${typeof val === 'number' ? val.toLocaleString('es-ES') : val}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return val;
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">{formatValue(value)}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend > 0 ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : trend < 0 ? (
                <ArrowDownIcon className="h-4 w-4" />
              ) : (
                <TrendingUpIcon className="h-4 w-4" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
