import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adsData } from "@/data/mockMetaAdsData";
import { Trophy, PlayCircle, Image as ImageIcon, TrendingUp } from "lucide-react";

export const WinningAds = () => {
  const winningAds = adsData
    .filter(ad => ad.status === 'winning')
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          <CardTitle>Top 3 Anuncios Ganadores</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {winningAds.map((ad, index) => (
            <div 
              key={ad.id}
              className="relative p-4 rounded-lg border border-success/30 bg-success/5 hover:bg-success/10 transition-all"
            >
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm">
                #{index + 1}
              </div>
              <div className="flex gap-4">
                <img 
                  src={ad.thumbnailUrl} 
                  alt={ad.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {ad.type === 'video' ? (
                      <PlayCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h4 className="font-semibold text-sm">{ad.name}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">ROAS</div>
                      <div className="font-bold text-success text-lg">{ad.roas.toFixed(1)}x</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CTR</div>
                      <div className="font-semibold">{ad.ctr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-semibold">${ad.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-success font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {ad.conversions} conversiones
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
