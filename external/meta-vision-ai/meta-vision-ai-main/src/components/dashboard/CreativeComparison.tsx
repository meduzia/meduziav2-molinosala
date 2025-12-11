import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { creativeTypeComparison } from "@/data/mockMetaAdsData";
import { PlayCircle, Image as ImageIcon } from "lucide-react";

export const CreativeComparison = () => {
  const comparisonData = [
    {
      name: 'ROAS',
      Video: creativeTypeComparison.video.avgRoas,
      Imagen: creativeTypeComparison.image.avgRoas
    },
    {
      name: 'CTR %',
      Video: creativeTypeComparison.video.avgCtr,
      Imagen: creativeTypeComparison.image.avgCtr
    },
    {
      name: 'Conversiones',
      Video: creativeTypeComparison.video.conversions / 10, // Scale for visibility
      Imagen: creativeTypeComparison.image.conversions / 10
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Tipo de Creatividad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col items-center p-4 rounded-lg bg-accent/10 border border-accent/20">
            <PlayCircle className="h-8 w-8 text-accent mb-2" />
            <div className="text-2xl font-bold text-accent">{creativeTypeComparison.video.avgRoas.toFixed(1)}x</div>
            <div className="text-sm text-muted-foreground">ROAS Promedio Video</div>
            <div className="text-xs text-success font-medium mt-1">+37% vs Imagen</div>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{creativeTypeComparison.image.avgRoas.toFixed(1)}x</div>
            <div className="text-sm text-muted-foreground">ROAS Promedio Imagen</div>
            <div className="text-xs text-muted-foreground mt-1">Estándar</div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Video" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Imagen" fill="hsl(var(--muted-foreground))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
