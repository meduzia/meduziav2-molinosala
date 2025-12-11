import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { performanceOverTime } from "@/data/mockMetaAdsData";

export const ROASChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución ROAS</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceOverTime}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
            />
            <ReferenceLine y={3} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Objetivo" />
            <Line 
              type="monotone" 
              dataKey="roas" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
              name="ROAS"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
