import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiRecommendations } from "@/data/mockMetaAdsData";
import { Sparkles, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const AIRecommendations = () => {
  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="h-4 w-4" />;
    if (priority === 'medium') return <Sparkles className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const getPriorityVariant = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle>Recomendaciones IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aiRecommendations.map((rec, index) => (
            <div 
              key={index}
              className={cn(
                "p-4 rounded-lg border transition-all hover:shadow-md",
                rec.priority === 'high' && "border-destructive/30 bg-destructive/5",
                rec.priority === 'medium' && "border-primary/30 bg-primary/5",
                rec.priority === 'low' && "border-border bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-1",
                  rec.priority === 'high' && "text-destructive",
                  rec.priority === 'medium' && "text-primary",
                  rec.priority === 'low' && "text-muted-foreground"
                )}>
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{rec.title}</h4>
                    <Badge variant={getPriorityVariant(rec.priority)} className="text-xs">
                      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs font-medium text-foreground">{rec.action}</span>
                    <span className="text-xs text-success font-semibold">{rec.impact}</span>
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
