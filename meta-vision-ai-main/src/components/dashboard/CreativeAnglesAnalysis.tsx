import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creativeAngles, angleTrends } from "@/data/mockMetaAdsData";
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from "recharts";
import { TrendingUp, Target, DollarSign } from "lucide-react";

export const CreativeAnglesAnalysis = () => {
  // Prepare scatter data for angle performance
  const scatterData = creativeAngles.map(angle => ({
    name: angle.name,
    ctr: angle.ctr,
    conversionRate: angle.conversionRate,
    roas: angle.roas,
    spend: angle.spend,
    objective: angle.objective
  }));

  const getObjectiveBadge = (objective: string) => {
    const variants = {
      alcance: 'default',
      tráfico: 'secondary',
      ventas: 'default'
    } as const;
    
    return (
      <Badge variant={variants[objective as keyof typeof variants] || 'default'} className="text-xs">
        {objective.charAt(0).toUpperCase() + objective.slice(1)}
      </Badge>
    );
  };

  const getPerformanceColor = (roas: number) => {
    if (roas >= 4.5) return 'text-success';
    if (roas >= 3.5) return 'text-chart-2';
    return 'text-warning';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Angles Performance Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Rendimiento por Ángulo Creativo</CardTitle>
          <CardDescription>Análisis de respuesta a diferentes propuestas de comunicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Ángulo</th>
                  <th className="text-center py-3 px-4 font-medium">Objetivo</th>
                  <th className="text-right py-3 px-4 font-medium">CTR</th>
                  <th className="text-right py-3 px-4 font-medium">Conv. Rate</th>
                  <th className="text-right py-3 px-4 font-medium">CPA</th>
                  <th className="text-right py-3 px-4 font-medium">ROAS</th>
                  <th className="text-right py-3 px-4 font-medium">Engagement</th>
                  <th className="text-right py-3 px-4 font-medium">Inversión</th>
                </tr>
              </thead>
              <tbody>
                {creativeAngles.map((angle) => (
                  <tr key={angle.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{angle.name}</td>
                    <td className="py-3 px-4 text-center">
                      {getObjectiveBadge(angle.objective)}
                    </td>
                    <td className="py-3 px-4 text-right">{angle.ctr}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{angle.conversionRate}%</td>
                    <td className="py-3 px-4 text-right">${angle.cpa}</td>
                    <td className={`py-3 px-4 text-right font-bold ${getPerformanceColor(angle.roas)}`}>
                      {angle.roas}x
                    </td>
                    <td className="py-3 px-4 text-right">{angle.engagement}%</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">${angle.spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Chart - CTR vs Conversion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Performance</CardTitle>
          <CardDescription>CTR vs Tasa de Conversión (tamaño = inversión)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                dataKey="ctr" 
                name="CTR" 
                unit="%" 
                className="text-xs"
                label={{ value: 'CTR (%)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="conversionRate" 
                name="Conv. Rate" 
                unit="%" 
                className="text-xs"
                label={{ value: 'Conversión (%)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="spend" range={[100, 1000]} name="Inversión" unit="$" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Inversión') return `$${value}`;
                  return `${value}%`;
                }}
              />
              <Legend />
              <Scatter 
                name="Ángulos Creativos" 
                data={scatterData} 
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Mayor tamaño de burbuja = mayor inversión
          </div>
        </CardContent>
      </Card>

      {/* Angle Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Ángulos Top</CardTitle>
          <CardDescription>ROAS de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={angleTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              />
              <YAxis className="text-xs" label={{ value: 'ROAS', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sostenible" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Sostenible"
                dot={{ fill: 'hsl(var(--success))' }}
              />
              <Line 
                type="monotone" 
                dataKey="romantico" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Romántico"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="familiar" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Familiar"
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
              <Line 
                type="monotone" 
                dataKey="aventura" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Aventura"
                dot={{ fill: 'hsl(var(--chart-3))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 3 Angles */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Decisiones Estratégicas</CardTitle>
          <CardDescription>Recomendaciones basadas en performance de ángulos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creativeAngles
              .sort((a, b) => b.roas - a.roas)
              .slice(0, 3)
              .map((angle, index) => (
                <div 
                  key={angle.id} 
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="text-xs">
                      #{index + 1} Top Performer
                    </Badge>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{angle.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROAS:</span>
                      <span className="font-bold text-success">{angle.roas}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conversión:</span>
                      <span className="font-semibold">{angle.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-semibold">${angle.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-success font-medium flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      ESCALAR: Aumentar presupuesto en 40%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
