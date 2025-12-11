import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { benchmarkData, competitorTrends } from "@/data/mockMetaAdsData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export const BenchmarkingComparison = () => {
  const calculateDiff = (myValue: number, avgValue: number) => {
    const diff = ((myValue - avgValue) / avgValue) * 100;
    return diff;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Benchmark Comparison Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Comparativa vs Competencia</CardTitle>
          <CardDescription>Posicionamiento frente a benchmarks del sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Métrica</th>
                  <th className="text-right py-3 px-4 font-medium">Mi Valor</th>
                  <th className="text-right py-3 px-4 font-medium">Promedio Sector</th>
                  <th className="text-right py-3 px-4 font-medium">Competidor A</th>
                  <th className="text-right py-3 px-4 font-medium">Competidor B</th>
                  <th className="text-right py-3 px-4 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkData.map((row) => {
                  const diff = calculateDiff(row.myValue, row.industryAvg);
                  const isPositive = (row.metric === 'CPA' || row.metric === 'CPM' || row.metric === 'Frecuencia') ? diff < 0 : diff > 0;
                  
                  return (
                    <tr key={row.metric} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{row.metric}</td>
                      <td className="py-3 px-4 text-right font-semibold text-primary">
                        {row.myValue}{row.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {row.industryAvg}{row.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {row.competitor1}{row.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {row.competitor2}{row.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isPositive ? 'text-success' : 'text-destructive'
                        }`}>
                          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {Math.abs(diff).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Posición por Métrica</CardTitle>
          <CardDescription>Comparación visual de KPIs principales</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="metric" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="myValue" fill="hsl(var(--primary))" name="Mi Rendimiento" />
              <Bar dataKey="industryAvg" fill="hsl(var(--chart-2))" name="Promedio Sector" />
              <Bar dataKey="competitor1" fill="hsl(var(--chart-3))" name="Competidor A" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROAS Trend Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución ROAS vs Competencia</CardTitle>
          <CardDescription>Tendencia de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={competitorTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              />
              <YAxis className="text-xs" />
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
                dataKey="myRoas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Mi ROAS"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="industryAvg" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Promedio Sector"
              />
              <Line 
                type="monotone" 
                dataKey="competitor1" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Competidor A"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
