import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { archetypeAngleMatrix } from "@/data/mockMetaAdsData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Target, TrendingUp, AlertCircle } from "lucide-react";

export const ArchetypeAngleMatrix = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<string>("all");
  
  const archetypes = Array.from(new Set(archetypeAngleMatrix.map(item => item.archetypeName)));
  
  const filteredData = selectedArchetype === "all" 
    ? archetypeAngleMatrix 
    : archetypeAngleMatrix.filter(item => item.archetypeName === selectedArchetype);

  const getPerformanceBadge = (performance: string) => {
    const config = {
      excelente: { variant: 'default' as const, color: 'bg-success text-success-foreground', icon: TrendingUp },
      bueno: { variant: 'secondary' as const, color: 'bg-chart-2/20 text-chart-2', icon: Target },
      regular: { variant: 'outline' as const, color: 'bg-warning/20 text-warning', icon: AlertCircle },
      bajo: { variant: 'destructive' as const, color: 'bg-destructive/20 text-destructive', icon: AlertCircle }
    };
    
    const config_item = config[performance as keyof typeof config] || config.regular;
    const Icon = config_item.icon;
    
    return (
      <Badge variant={config_item.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {performance.charAt(0).toUpperCase() + performance.slice(1)}
      </Badge>
    );
  };

  const getROASColor = (roas: number) => {
    if (roas >= 5.5) return 'text-success font-bold';
    if (roas >= 4.5) return 'text-success';
    if (roas >= 3.5) return 'text-chart-2';
    return 'text-warning';
  };

  // Group by archetype for heatmap
  const archetypeGroups = archetypes.reduce((acc, archetype) => {
    acc[archetype] = archetypeAngleMatrix.filter(item => item.archetypeName === archetype);
    return acc;
  }, {} as Record<string, typeof archetypeAngleMatrix>);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Filter and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matriz Arquetipo × Ángulo</CardTitle>
              <CardDescription>Combinaciones de audiencia y creatividad con mejor desempeño</CardDescription>
            </div>
            <Select value={selectedArchetype} onValueChange={setSelectedArchetype}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por arquetipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los arquetipos</SelectItem>
                {archetypes.map(arch => (
                  <SelectItem key={arch} value={arch}>{arch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Arquetipo</th>
                  <th className="text-left py-3 px-4 font-medium">Ángulo Creativo</th>
                  <th className="text-right py-3 px-4 font-medium">ROAS</th>
                  <th className="text-right py-3 px-4 font-medium">CTR</th>
                  <th className="text-right py-3 px-4 font-medium">Conv. Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Inversión</th>
                  <th className="text-center py-3 px-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .sort((a, b) => b.roas - a.roas)
                  .map((combo, idx) => (
                  <tr 
                    key={`${combo.archetypeId}-${combo.angleName}-${idx}`} 
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{combo.archetypeName}</td>
                    <td className="py-3 px-4">{combo.angleName}</td>
                    <td className={`py-3 px-4 text-right ${getROASColor(combo.roas)}`}>
                      {combo.roas}x
                    </td>
                    <td className="py-3 px-4 text-right">{combo.ctr}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{combo.conversionRate}%</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      ${combo.spend.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getPerformanceBadge(combo.performance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Combinations */}
      <Card>
        <CardHeader>
          <CardTitle>Top 6 Combinaciones</CardTitle>
          <CardDescription>Las combinaciones más rentables de arquetipo + ángulo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archetypeAngleMatrix
              .sort((a, b) => b.roas - a.roas)
              .slice(0, 6)
              .map((combo, idx) => (
                <div 
                  key={`${combo.archetypeId}-${combo.angleName}-top-${idx}`}
                  className="relative p-4 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all"
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs font-bold">
                      #{idx + 1}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Arquetipo</div>
                      <div className="font-semibold text-primary">{combo.archetypeName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Ángulo</div>
                      <div className="font-medium">{combo.angleName}</div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">ROAS</div>
                          <div className={`font-bold ${getROASColor(combo.roas)}`}>
                            {combo.roas}x
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Conv.</div>
                          <div className="font-semibold">{combo.conversionRate}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      {getPerformanceBadge(combo.performance)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap-style view */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Rápida por Arquetipo</CardTitle>
          <CardDescription>Mejor ángulo y ROAS promedio por cada perfil de viajero</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(archetypeGroups).map(([archetype, combos]) => {
              const bestCombo = combos.sort((a, b) => b.roas - a.roas)[0];
              const avgRoas = (combos.reduce((sum, c) => sum + c.roas, 0) / combos.length).toFixed(2);
              
              return (
                <div 
                  key={archetype}
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <h4 className="font-semibold mb-3 text-primary">{archetype}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Mejor ángulo</div>
                      <div className="font-medium">{bestCombo.angleName}</div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Max ROAS</span>
                      <span className={`font-bold ${getROASColor(bestCombo.roas)}`}>
                        {bestCombo.roas}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">ROAS Prom.</span>
                      <span className="font-semibold">{avgRoas}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
