import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { travelerArchetypes } from "@/data/mockMetaAdsData";
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Users, Globe, Smartphone, Monitor, TrendingUp } from "lucide-react";

export const TravelerArchetypes = () => {
  // Prepare radar chart data
  const radarData = travelerArchetypes.map(arch => ({
    archetype: arch.name,
    conversionRate: arch.conversionRate,
    avgSpend: arch.avgSpend / 10, // Scale down for better visualization
  }));

  // Prepare bar chart data for reach
  const reachData = travelerArchetypes.map(arch => ({
    name: arch.name,
    reach: arch.totalReach / 1000, // Convert to thousands
    conversion: arch.conversionRate
  }));

  const getDeviceIcon = (device: string) => {
    return device === 'Mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Archetypes Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Arquetipos de Viajeros</CardTitle>
          <CardDescription>Segmentación de audiencias por perfil de viajero</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Arquetipo</th>
                  <th className="text-left py-3 px-4 font-medium">Descripción</th>
                  <th className="text-center py-3 px-4 font-medium">Edad</th>
                  <th className="text-center py-3 px-4 font-medium">Dispositivo</th>
                  <th className="text-right py-3 px-4 font-medium">Conv. Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Gasto Prom.</th>
                  <th className="text-right py-3 px-4 font-medium">Alcance</th>
                </tr>
              </thead>
              <tbody>
                {travelerArchetypes.map((arch) => (
                  <tr key={arch.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{arch.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs">
                      {arch.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {arch.avgAge}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getDeviceIcon(arch.preferredDevice)}
                        <span className="text-xs">{arch.preferredDevice}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-success">
                      {arch.conversionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ${arch.avgSpend.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {(arch.totalReach / 1000).toFixed(0)}k
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart - Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa Multi-Dimensional</CardTitle>
          <CardDescription>Conversión y gasto promedio por arquetipo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis dataKey="archetype" className="text-xs" />
              <PolarRadiusAxis className="text-xs" />
              <Radar 
                name="Tasa de Conversión" 
                dataKey="conversionRate" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Gasto Promedio (x10)" 
                dataKey="avgSpend" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.6} 
              />
              <Legend />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart - Reach and Conversion */}
      <Card>
        <CardHeader>
          <CardTitle>Alcance vs Conversión</CardTitle>
          <CardDescription>Volumen de audiencia y efectividad</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reachData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" label={{ value: 'Alcance (miles)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" className="text-xs" label={{ value: 'Conversión (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="reach" fill="hsl(var(--chart-3))" name="Alcance (miles)" />
              <Bar yAxisId="right" dataKey="conversion" fill="hsl(var(--success))" name="Conversión (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Archetype Cards - Top Countries */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Distribución Geográfica</CardTitle>
          <CardDescription>Principales países por arquetipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {travelerArchetypes.map((arch) => (
              <div 
                key={arch.id}
                className="p-4 rounded-lg border border-border bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{arch.name}</h4>
                </div>
                <div className="space-y-2">
                  {arch.topCountries.map((country, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{country}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversión</span>
                    <span className="font-bold text-success">{arch.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
