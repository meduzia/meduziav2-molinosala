import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adsData } from "@/data/mockMetaAdsData";
import { PlayCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdsTable = () => {
  const getStatusBadge = (status: string) => {
    const variants = {
      winning: 'default',
      scaling: 'secondary',
      testing: 'outline',
      paused: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]} className={cn(
        status === 'winning' && "bg-success text-success-foreground",
        status === 'scaling' && "bg-primary text-primary-foreground"
      )}>
        {status === 'winning' ? '🏆 Ganador' : 
         status === 'scaling' ? '📈 Escalando' :
         status === 'testing' ? '🧪 Probando' :
         '⏸️ Pausado'}
      </Badge>
    );
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Análisis Detallado de Anuncios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm">Anuncio</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Tipo</th>
                <th className="text-right py-3 px-4 font-medium text-sm">ROAS</th>
                <th className="text-right py-3 px-4 font-medium text-sm">CTR</th>
                <th className="text-right py-3 px-4 font-medium text-sm">CPA</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Inversión</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Recomendación IA</th>
              </tr>
            </thead>
            <tbody>
              {adsData.map((ad) => (
                <tr key={ad.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={ad.thumbnailUrl} 
                        alt={ad.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">{ad.name}</div>
                        <div className="text-xs text-muted-foreground">{ad.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {ad.type === 'video' ? (
                        <PlayCircle className="h-4 w-4 text-accent" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm capitalize">{ad.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn(
                      "font-semibold text-sm",
                      ad.roas >= 4 ? "text-success" : ad.roas >= 3 ? "text-primary" : "text-destructive"
                    )}>
                      {ad.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-sm">{ad.ctr.toFixed(1)}%</td>
                  <td className="py-4 px-4 text-right text-sm">${ad.cpa.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-sm font-medium">${ad.spend.toLocaleString()}</td>
                  <td className="py-4 px-4">{getStatusBadge(ad.status)}</td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-muted-foreground max-w-xs">{ad.recommendation}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
