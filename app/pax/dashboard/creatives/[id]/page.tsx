"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Image, Video, Edit, TrendingUp, TrendingDown, DollarSign, Target, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

interface CreativeMetrics {
  cpa: number;
  roas: number;
  conversions: number;
  spend: number;
  revenue: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  user?: string;
  note?: string;
}

interface Creative {
  id: string;
  name: string;
  angle?: string;
  campaign?: string;
  type: "image" | "video";
  status: "draft" | "review" | "approved" | "live";
  url: string;
  source: "AI" | "Human";
  format?: string;
  destination?: string;
  notes?: string;
  status_history?: StatusHistoryEntry[];
  created_at?: string;
  metrics?: CreativeMetrics | null;
}

interface DailyMetrics {
  date: string;
  spend: number;
  revenue: number;
  conversions: number;
  cpa: number;
  roas: number;
}

export default function CreativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [creative, setCreative] = useState<Creative | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadCreative();
    }
  }, [params.id]);

  useEffect(() => {
    if (creative && creative.status === "live") {
      loadDailyMetrics();
    }
  }, [creative]);

  const loadCreative = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/creatives`);
      if (response.ok) {
        const data = await response.json();
        const found = data.find((c: Creative) => c.id === params.id);
        setCreative(found || null);
      }
    } catch (error) {
      console.error("Error loading creative:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyMetrics = async () => {
    if (!creative?.name) return;
    
    setLoadingMetrics(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

      const response = await fetch(
        `/api/creatives/metrics?name=${encodeURIComponent(creative.name)}&from=${dateStr}`
      );
      if (response.ok) {
        const data = await response.json();
        setDailyMetrics(data);
      }
    } catch (error) {
      console.error("Error loading daily metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; border: string }> = {
      draft: {
        bg: "bg-gray-500/20",
        text: "text-gray-400",
        border: "border-gray-500/50 border-dashed",
      },
      review: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/50 border-solid",
      },
      approved: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/50 border-solid",
      },
      live: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/70 border-solid border-2",
      },
    };

    const style = variants[status] || variants.draft;
    const statusLabels: Record<string, string> = {
      draft: "Borrador",
      review: "En Revisión",
      approved: "Aprobado",
      live: "En Vivo",
    };

    return (
      <Badge
        variant="outline"
        className={cn(
          "text-sm font-medium backdrop-blur-sm",
          style.bg,
          style.text,
          style.border,
          status === "live" && "animate-pulse"
        )}
      >
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center py-12 text-purple-300/70">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!creative) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-purple-200 mb-4">Creative no encontrado</h2>
                          <Button onClick={() => router.push("/creatives")} variant="outline">
                Volver
              </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 via-purple-900/30 to-blue-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-purple-300 hover:text-purple-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-purple-100">{creative.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {getStatusBadge(creative.status)}
                {creative.type === "video" ? (
                  <Video className="h-4 w-4 text-purple-400/50" />
                ) : (
                  <Image className="h-4 w-4 text-purple-400/50" />
                )}
                <span className="text-sm text-purple-300/70">{creative.type}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Preview and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-blue-950/40 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-100">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-purple-950/60 to-blue-950/60 rounded-xl flex items-center justify-center">
                {creative.type === "video" ? (
                  <Video className="h-24 w-24 text-purple-400/30" />
                ) : (
                  <Image className="h-24 w-24 text-purple-400/30" />
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {creative.angle && (
                  <div className="flex justify-between">
                    <span className="text-purple-300/70">Ángulo:</span>
                    <span className="text-purple-200">{creative.angle}</span>
                  </div>
                )}
                {creative.campaign && (
                  <div className="flex justify-between">
                    <span className="text-purple-300/70">Campaña:</span>
                    <span className="text-purple-200">{creative.campaign}</span>
                  </div>
                )}
                {creative.destination && (
                  <div className="flex justify-between">
                    <span className="text-purple-300/70">Destino:</span>
                    <span className="text-purple-200">{creative.destination}</span>
                  </div>
                )}
                {creative.format && (
                  <div className="flex justify-between">
                    <span className="text-purple-300/70">Formato:</span>
                    <span className="text-purple-200">{creative.format}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Summary */}
          <Card className="bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-blue-950/40 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-100">Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              {creative.status === "live" && creative.metrics ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-purple-400/70 mb-1">CPA</div>
                    <div className={cn(
                      "text-2xl font-bold",
                      creative.metrics.cpa < 100 ? "text-green-400" :
                      creative.metrics.cpa <= 150 ? "text-yellow-400" :
                      "text-red-400"
                    )}>
                      ${creative.metrics.cpa.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-400/70 mb-1">ROAS</div>
                    <div className="text-2xl font-bold text-purple-200">
                      {creative.metrics.roas.toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-400/70 mb-1">Conversiones</div>
                    <div className="text-2xl font-bold text-purple-200">
                      {creative.metrics.conversions}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-400/70 mb-1">Gasto</div>
                    <div className="text-2xl font-bold text-purple-200">
                      ${creative.metrics.spend.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-400/70 mb-1">Ingresos</div>
                    <div className="text-2xl font-bold text-purple-200">
                      ${creative.metrics.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : creative.status === "live" ? (
                <div className="text-center py-8 text-purple-400/60">
                  <p>No hay datos aún</p>
                  <p className="text-xs mt-2">Las métricas aparecerán dentro de 24h</p>
                </div>
              ) : (
                <div className="text-center py-8 text-purple-400/60">
                  <p>Lanza el creative para ver métricas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts (only for live creatives with data) */}
        {creative.status === "live" && dailyMetrics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-blue-950/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-100">Evolución CPA (Últimos 7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyMetrics.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf650" />
                    <XAxis
                      dataKey="date"
                      stroke="#a78bfa"
                      tick={{ fill: "#a78bfa", fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                    />
                    <YAxis stroke="#a78bfa" tick={{ fill: "#a78bfa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(30, 27, 75, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpa"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-blue-950/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-100">Conversiones Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyMetrics.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf650" />
                    <XAxis
                      dataKey="date"
                      stroke="#a78bfa"
                      tick={{ fill: "#a78bfa", fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                    />
                    <YAxis stroke="#a78bfa" tick={{ fill: "#a78bfa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(30, 27, 75, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="conversions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notes */}
        {creative.notes && (
          <Card className="bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-blue-950/40 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-100">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">{creative.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
