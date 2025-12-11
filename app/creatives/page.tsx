"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image, Video, Sparkles, Send, CheckCircle2, Play, Pause, Edit, Clock, User, TrendingUp, TrendingDown, X, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadCreativeModal } from "@/components/creatives/UploadCreativeModal";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  user?: string;
  note?: string;
}

interface CreativeMetrics {
  cpa: number;
  roas: number;
  conversions: number;
  spend: number;
  revenue: number;
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
  roas?: number;
  ctr?: number;
  cpa?: number;
  status_history?: StatusHistoryEntry[];
  created_at?: string;
  metrics?: CreativeMetrics | null;
}

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState<Record<string, boolean>>({});
  const [expandedCreative, setExpandedCreative] = useState<string | null>(null);
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState<string>("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const getPerformanceBorderColor = (creative: Creative) => {
    if (selectedCreatives.has(creative.id)) {
      return "border-2 glow-primary";
    }
    if (creative.status !== "live" || !creative.metrics) {
      return "border-primary/20";
    }

    const cpa = creative.metrics.cpa;
    if (cpa < 100) return "border-success/60";
    if (cpa <= 150) return "border-warning/60";
    return "border-destructive/60";
  };

  const toggleSelectCreative = (creativeId: string) => {
    setSelectedCreatives((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(creativeId)) {
        newSet.delete(creativeId);
      } else {
        newSet.add(creativeId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCreatives.size === filteredCreatives.length) {
      setSelectedCreatives(new Set());
    } else {
      setSelectedCreatives(new Set(filteredCreatives.map((c) => c.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!newBulkStatus || selectedCreatives.size === 0) return;

    // Validate status transitions
    const selectedItems = creatives.filter((c) => selectedCreatives.has(c.id));
    const mixedStates = new Set(selectedItems.map((c) => c.status));
    
    if (mixedStates.size > 1 && newBulkStatus === "live") {
      toast({
        title: "Error",
        description: "No puedes establecer 'Live' en creativos con estados diferentes. Cambia el estado de cada uno individualmente.",
        variant: "destructive",
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await fetch("/api/creatives/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedCreatives),
          status: newBulkStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar creativos");
      }

      const updatedCount = selectedCreatives.size;
      setSelectedCreatives(new Set());
      setBulkStatusDialogOpen(false);
      setNewBulkStatus("");

      toast({
        title: "Éxito",
        description: `${updatedCount} creative${updatedCount > 1 ? "s" : ""} actualizado${updatedCount > 1 ? "s" : ""}`,
      });

      loadCreatives();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los creativos",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCreatives.size === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch("/api/creatives/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedCreatives),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar creativos");
      }

      const deletedCount = selectedCreatives.size;
      setSelectedCreatives(new Set());
      setDeleteDialogOpen(false);

      toast({
        title: "Éxito",
        description: `${deletedCount} creative${deletedCount > 1 ? "s" : ""} eliminado${deletedCount > 1 ? "s" : ""}`,
      });

      loadCreatives();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los creativos",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  useEffect(() => {
    loadCreatives();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A or Ctrl+A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        const currentFiltered = creatives.filter((c) => {
          if (selectedWeek !== "all") return false;
          if (selectedCampaign !== "all" && c.campaign !== selectedCampaign) return false;
          return true;
        });
        if (currentFiltered.length > 0) {
          setSelectedCreatives(new Set(currentFiltered.map((c) => c.id)));
        }
      }
      // Escape to deselect all
      if (e.key === "Escape") {
        setSelectedCreatives(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [creatives, selectedWeek, selectedCampaign]);

  const loadCreatives = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/creatives");
      const data = await response.json();
      setCreatives(data);
    } catch (error) {
      console.error("Error loading creatives:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los creativos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (creativeId: string, newStatus: string) => {
    setChangingStatus((prev) => ({ ...prev, [creativeId]: true }));
    try {
      const response = await fetch(`/api/creatives/${creativeId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          user: "Current User", // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar el estado");
      }

      const data = await response.json();
      
      // Update local state
      setCreatives((prev) =>
        prev.map((c) =>
          c.id === creativeId
            ? { ...c, status: data.status as any, status_history: data.status_history }
            : c
        )
      );

      // Show success toast
      const messages: Record<string, string> = {
        review: "Creative enviado para revisión ✓",
        approved: "Creative aprobado ✓",
        live: "Creative está ahora en vivo 🎉",
        draft: "Creative devuelto a borrador",
      };

      toast({
        title: "Estado actualizado",
        description: messages[newStatus] || "Estado actualizado correctamente",
      });
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
        variant: "destructive",
      });
    } finally {
      setChangingStatus((prev) => ({ ...prev, [creativeId]: false }));
    }
  };

  // Get unique campaigns for filter
  const campaigns = Array.from(
    new Set(creatives.map((c) => c.campaign).filter(Boolean))
  ) as string[];

  // Filter creatives
  const filteredCreatives = creatives.filter((creative) => {
    if (selectedCampaign !== "all" && creative.campaign !== selectedCampaign) {
      return false;
    }
    // Week filter would need date calculation - simplified for now
    return true;
  });

  // Get AI generated creatives
  const aiCreatives = filteredCreatives.filter((c) => c.source === "AI");

  // Get approved/live creatives
  const approvedCreatives = filteredCreatives.filter(
    (c) => c.status === "approved" || c.status === "live"
  );

  const formatCurrency = (value?: number) => {
    if (!value) return "N/A";
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value?: number) => {
    if (!value) return "N/A";
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
      draft: {
        bg: "bg-gray-500/20",
        text: "text-gray-400",
        border: "border-gray-500/50 border-dashed",
        shadow: "shadow-lg shadow-gray-500/20",
      },
      review: {
        bg: "bg-warning/20",
        text: "text-warning",
        border: "border-warning/50 border-solid",
        shadow: "shadow-lg shadow-warning/20",
      },
      approved: {
        bg: "bg-success/20",
        text: "text-success",
        border: "border-success/50 border-solid",
        shadow: "shadow-lg shadow-success/20",
      },
      live: {
        bg: "bg-primary/20",
        text: "text-primary",
        border: "border-primary/70 border-solid border-2",
        shadow: "shadow-lg shadow-primary/30",
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
          "text-xs font-medium backdrop-blur-sm relative",
          style.bg,
          style.text,
          style.border,
          style.shadow,
          status === "live" && "animate-pulse"
        )}
      >
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const renderStatusButtons = (creative: Creative) => {
    const isChanging = changingStatus[creative.id];
    const isSelectionMode = selectedCreatives.size > 0;

    switch (creative.status) {
      case "draft":
        return (
          <Button
            size="sm"
            onClick={() => changeStatus(creative.id, "review")}
            disabled={isChanging || isSelectionMode}
            className="bg-gradient-to-r from-warning to-warning hover:opacity-90 text-white"
          >
            {isChanging ? (
              <>
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Enviar para Revisión
              </>
            )}
          </Button>
        );
      case "review":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => changeStatus(creative.id, "approved")}
              disabled={isChanging || isSelectionMode}
              className="bg-gradient-to-r from-success to-success hover:opacity-90 text-white"
            >
              {isChanging ? (
                <Clock className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprobar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeStatus(creative.id, "draft")}
              disabled={isChanging || isSelectionMode}
              className="border-warning/50 text-warning hover:bg-warning/10"
            >
              {isChanging ? (
                <Clock className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Edit className="h-3 w-3 mr-1" />
                  Solicitar Cambios
                </>
              )}
            </Button>
          </div>
        );
      case "approved":
        return (
          <Button
            size="sm"
            onClick={() => changeStatus(creative.id, "live")}
            disabled={isChanging || isSelectionMode}
            className="bg-gradient-to-r from-primary to-primary hover:opacity-90 text-white"
          >
            {isChanging ? (
              <>
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Publicar
              </>
            )}
          </Button>
        );
      case "live":
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeStatus(creative.id, "approved")}
              disabled={isChanging || isSelectionMode}
              className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
            >
              {isChanging ? (
                <Clock className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pausar
                </>
              )}
            </Button>
            <Badge className="bg-success/20 text-success border-success/50">
              Activo
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStatusHistory = (creative: Creative) => {
    let history: StatusHistoryEntry[] = creative.status_history || [];
    
    // Add initial entry if created_at exists and no history
    if (creative.created_at) {
      const hasInitialEntry = history.some(
        (entry) => entry.status === "draft" && entry.note === "Creative creado"
      );
      if (!hasInitialEntry && history.length === 0) {
        history = [
          {
            status: creative.status || "draft",
            timestamp: creative.created_at,
            user: "System",
            note: "Creative creado",
          },
        ];
      }
    }

    if (history.length === 0) {
      return (
        <div className="text-xs text-foreground/60 text-center py-2">
          No hay historial disponible
        </div>
      );
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "draft":
          return <Edit className="h-4 w-4 text-foreground/60" />;
        case "review":
          return <Clock className="h-4 w-4 text-warning" />;
        case "approved":
          return <CheckCircle2 className="h-4 w-4 text-success" />;
        case "live":
          return <Play className="h-4 w-4 text-primary" />;
        default:
          return <Clock className="h-4 w-4 text-foreground/60" />;
      }
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        draft: "Creado como Borrador",
        review: "Enviado para Revisión",
        approved: "Aprobado",
        live: "Publicado",
      };
      return labels[status] || status;
    };

    return (
      <div className="mt-4 pt-4 border-t border-primary/20">
        <h4 className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">
          Historial de Estados
        </h4>
        <div className="space-y-3">
          {history.map((entry, index) => (
            <div key={index} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5">{getStatusIcon(entry.status)}</div>
              <div className="flex-1">
                <div className="text-foreground font-medium">
                  {getStatusLabel(entry.status)}
                </div>
                <div className="text-foreground/60 mt-0.5 flex items-center gap-2">
                  <span>
                    {format(new Date(entry.timestamp), "d MMM, h:mm a", { locale: es })}
                  </span>
                  {entry.user && (
                    <>
                      <span className="text-foreground/40">•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.user}
                      </span>
                    </>
                  )}
                </div>
                {entry.note && (
                  <div className="text-foreground/50 mt-1 italic">{entry.note}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with glowing gradient */}
      <header className="relative border-b border-primary/20 bg-gradient-to-r from-background via-background-light to-card backdrop-blur-sm sticky top-0 z-40 overflow-hidden">
        {/* Glowing gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary),transparent_50%)]" />
        
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg glow-primary">
                  <span className="relative z-10">C</span>
                </div>
                <div className="absolute inset-0 rounded-xl gradient-primary blur-xl opacity-50 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gradient-primary">
                    Weekly Creatives
                  </h1>
                  {filteredCreatives.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCreatives.size === filteredCreatives.length && filteredCreatives.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <span className="text-sm text-foreground/80">
                        Select All
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-foreground/70">
                    Manage and review ad creatives
                  </p>
                  {selectedCreatives.size > 0 && (
                    <span className="text-sm font-medium text-primary bg-primary/20 px-2 py-1 rounded border border-primary/50">
                      {selectedCreatives.size} creative{selectedCreatives.size !== 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <ThemeToggle />
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="gradient-primary text-white glow-subtle hover:opacity-90 transition-all duration-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Creative
              </Button>
            </div>
          </div>

          {/* Filters with enhanced styling */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground/80 font-medium">Week:</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-[180px] bg-card border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30 backdrop-blur-md">
                  <SelectItem value="all">All Weeks</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground/80 font-medium">Campaign:</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-[180px] bg-card border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30 backdrop-blur-md">
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 backdrop-blur-sm border border-primary/20 rounded-xl p-1 shadow-lg glow-subtle">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:glow-subtle transition-all duration-300 rounded-lg text-foreground/70 hover:text-foreground"
            >
              All ({filteredCreatives.length})
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:glow-subtle transition-all duration-300 rounded-lg text-foreground/70 hover:text-foreground"
            >
              AI Generated ({aiCreatives.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:glow-subtle transition-all duration-300 rounded-lg text-foreground/70 hover:text-foreground"
            >
              Approved / Live ({approvedCreatives.length})
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12 text-foreground/70">
                Loading creatives...
              </div>
            ) : filteredCreatives.length === 0 ? (
              <div className="text-center py-12 text-foreground/70">
                No creatives found
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCreatives.map((creative) => (
                  <Card
                    key={creative.id}
                    className={cn(
                      "relative card-premium hover:border-opacity-60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group backdrop-blur-sm overflow-hidden",
                      selectedCreatives.size > 0 ? "cursor-default" : "cursor-pointer",
                      getPerformanceBorderColor(creative)
                    )}
                    onClick={(e) => {
                      // Don't navigate if clicking on checkbox or in selection mode
                      if (selectedCreatives.size > 0 || (e.target as HTMLElement).closest('[role="checkbox"]')) {
                        return;
                      }
                      router.push(`/pax/dashboard/creatives/${creative.id}`);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-0 relative z-10">
                      {/* Preview */}
                      <div className="aspect-video bg-card rounded-t-xl flex items-center justify-center relative overflow-hidden border-b border-primary/10">
                        {/* Checkbox - Top Left */}
                        <div
                          className="absolute top-2 left-2 z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectCreative(creative.id);
                          }}
                        >
                          <div className="bg-black/60 backdrop-blur-sm rounded p-1 border border-primary/50 hover:border-primary transition-colors">
                            <Checkbox
                              checked={selectedCreatives.has(creative.id)}
                              onCheckedChange={() => toggleSelectCreative(creative.id)}
                              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {creative.url ? (
                          creative.type === "video" ? (
                            <Video className="h-16 w-16 text-primary/30" />
                          ) : (
                            <Image className="h-16 w-16 text-primary/30" />
                          )
                        ) : (
                          <Image className="h-16 w-16 text-primary/30" />
                        )}
                        {creative.source === "AI" && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-primary/20 backdrop-blur-sm border border-primary/50 rounded-lg px-2 py-1 glow-subtle">
                              <Sparkles className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3 relative z-10">
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                          {creative.name}
                        </h3>
                        <div className="text-xs text-foreground/70 space-y-1">
                          {creative.angle && (
                            <p>
                              <span className="font-medium text-foreground">Angle:</span> {creative.angle}
                            </p>
                          )}
                          {creative.campaign && (
                            <p>
                              <span className="font-medium text-foreground">Campaign:</span> {creative.campaign}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          {getStatusBadge(creative.status)}
                          {creative.type === "video" ? (
                            <Video className="h-4 w-4 text-primary/50" />
                          ) : (
                            <Image className="h-4 w-4 text-primary/50" />
                          )}
                        </div>

                        {/* Performance Metrics (only for live creatives) */}
                        {creative.status === "live" && (
                          <div className="pt-2 border-t border-primary/10">
                            {creative.metrics ? (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <div className="text-foreground/70">CPA</div>
                                  <div className={cn(
                                    "font-semibold",
                                    creative.metrics.cpa < 100 ? "text-success" :
                                    creative.metrics.cpa <= 150 ? "text-warning" :
                                    "text-destructive"
                                  )}>
                                    ${creative.metrics.cpa.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">ROAS</div>
                                  <div className="font-semibold text-foreground">
                                    {creative.metrics.roas.toFixed(2)}x
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">Conversions</div>
                                  <div className="font-semibold text-foreground">
                                    {creative.metrics.conversions}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">Spend</div>
                                  <div className="font-semibold text-foreground">
                                    ${creative.metrics.spend.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-foreground/60 text-center py-1">
                                No data yet
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status Action Buttons */}
                        <div className="pt-2 border-t border-primary/10" onClick={(e) => e.stopPropagation()}>
                          {renderStatusButtons(creative)}
                        </div>

                        {/* Expandable History */}
                        {expandedCreative === creative.id && (
                          <div className="pt-2">
                            {renderStatusHistory(creative)}
                          </div>
                        )}

                        {/* Toggle History Button */}
                        {((creative.status_history && creative.status_history.length > 0) || creative.created_at) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCreative(
                                expandedCreative === creative.id ? null : creative.id
                              );
                            }}
                            className="w-full text-xs text-primary/70 hover:text-primary hover:bg-primary/10"
                          >
                            {expandedCreative === creative.id ? "Ocultar historial" : "Ver historial"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Generated Tab */}
          <TabsContent value="ai">
            {loading ? (
              <div className="text-center py-12 text-foreground/70">
                Loading AI creatives...
              </div>
            ) : aiCreatives.length === 0 ? (
              <div className="text-center py-12 text-foreground/70">
                No AI-generated creatives found
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {aiCreatives.map((creative) => (
                  <Card
                    key={creative.id}
                    className={cn(
                      "relative card-premium hover:border-opacity-60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group backdrop-blur-sm overflow-hidden",
                      selectedCreatives.size > 0 ? "cursor-default" : "cursor-pointer",
                      getPerformanceBorderColor(creative)
                    )}
                    onClick={(e) => {
                      if (selectedCreatives.size > 0 || (e.target as HTMLElement).closest('[role="checkbox"]')) {
                        return;
                      }
                      router.push(`/pax/dashboard/creatives/${creative.id}`);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-0 relative z-10">
                      {/* Preview */}
                      <div className="aspect-video bg-card rounded-t-xl flex items-center justify-center relative overflow-hidden border-b border-primary/10">
                        {/* Checkbox - Top Left */}
                        <div
                          className="absolute top-2 left-2 z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectCreative(creative.id);
                          }}
                        >
                          <div className="bg-black/60 backdrop-blur-sm rounded p-1 border border-primary/50 hover:border-primary transition-colors">
                            <Checkbox
                              checked={selectedCreatives.has(creative.id)}
                              onCheckedChange={() => toggleSelectCreative(creative.id)}
                              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {creative.url ? (
                          creative.type === "video" ? (
                            <Video className="h-16 w-16 text-primary/30" />
                          ) : (
                            <Image className="h-16 w-16 text-primary/30" />
                          )
                        ) : (
                          <Image className="h-16 w-16 text-primary/30" />
                        )}
                        <div className="absolute top-2 right-2">
                          <div className="bg-primary/20 backdrop-blur-sm border border-primary/50 rounded-lg px-2 py-1 flex items-center gap-1 glow-subtle">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary font-medium">AI</span>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3 relative z-10">
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                          {creative.name}
                        </h3>
                        <div className="text-xs text-foreground/70 space-y-1">
                          {creative.angle && (
                            <p>
                              <span className="font-medium text-foreground">Angle:</span> {creative.angle}
                            </p>
                          )}
                          {creative.campaign && (
                            <p>
                              <span className="font-medium text-foreground">Campaign:</span> {creative.campaign}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          {getStatusBadge(creative.status)}
                          {creative.type === "video" ? (
                            <Video className="h-4 w-4 text-primary/50" />
                          ) : (
                            <Image className="h-4 w-4 text-primary/50" />
                          )}
                        </div>

                        {/* Performance Metrics (only for live creatives) */}
                        {creative.status === "live" && (
                          <div className="pt-2 border-t border-primary/10">
                            {creative.metrics ? (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <div className="text-foreground/70">CPA</div>
                                  <div className={cn(
                                    "font-semibold",
                                    creative.metrics.cpa < 100 ? "text-success" :
                                    creative.metrics.cpa <= 150 ? "text-warning" :
                                    "text-destructive"
                                  )}>
                                    ${creative.metrics.cpa.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">ROAS</div>
                                  <div className="font-semibold text-foreground">
                                    {creative.metrics.roas.toFixed(2)}x
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">Conversions</div>
                                  <div className="font-semibold text-foreground">
                                    {creative.metrics.conversions}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-foreground/70">Spend</div>
                                  <div className="font-semibold text-foreground">
                                    ${creative.metrics.spend.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-foreground/60 text-center py-1">
                                No data yet
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status Action Buttons */}
                        <div className="pt-2 border-t border-primary/10" onClick={(e) => e.stopPropagation()}>
                          {renderStatusButtons(creative)}
                        </div>

                        {/* Expandable History */}
                        {expandedCreative === creative.id && (
                          <div className="pt-2">
                            {renderStatusHistory(creative)}
                          </div>
                        )}

                        {/* Toggle History Button */}
                        {((creative.status_history && creative.status_history.length > 0) || creative.created_at) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCreative(
                                expandedCreative === creative.id ? null : creative.id
                              );
                            }}
                            className="w-full text-xs text-primary/70 hover:text-primary hover:bg-primary/10"
                          >
                            {expandedCreative === creative.id ? "Ocultar historial" : "Ver historial"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Approved / Live Tab */}
          <TabsContent value="approved">
            {loading ? (
              <div className="text-center py-12 text-foreground/70">
                Loading approved creatives...
              </div>
            ) : approvedCreatives.length === 0 ? (
              <div className="text-center py-12 text-foreground/70">
                No approved or live creatives found
              </div>
            ) : (
              <Card className="card-premium border-primary/20 glow-card backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="rounded-lg border border-primary/20 overflow-hidden bg-card/20">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-primary/20 bg-card/30">
                          <TableHead className="text-foreground font-semibold">Creative Name</TableHead>
                          <TableHead className="text-foreground font-semibold">Angle</TableHead>
                          <TableHead className="text-foreground font-semibold">Campaign</TableHead>
                          <TableHead className="text-foreground font-semibold">ROAS</TableHead>
                          <TableHead className="text-foreground font-semibold">CTR</TableHead>
                          <TableHead className="text-foreground font-semibold">CPA</TableHead>
                          <TableHead className="text-foreground font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedCreatives.map((creative) => (
                          <TableRow
                            key={creative.id}
                            className="border-primary/10 hover:bg-card/40 transition-colors"
                          >
                            <TableCell className="font-medium text-foreground">
                              {creative.name}
                            </TableCell>
                            <TableCell className="text-foreground/70">
                              {creative.angle || "N/A"}
                            </TableCell>
                            <TableCell className="text-foreground/70">
                              {creative.campaign || "N/A"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-semibold",
                                  creative.roas && creative.roas > 3
                                    ? "text-success"
                                    : creative.roas && creative.roas > 2
                                    ? "text-warning"
                                    : "text-destructive"
                                )}
                              >
                                {creative.roas ? creative.roas.toFixed(2) : "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-foreground">
                                {formatPercentage(creative.ctr)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-semibold",
                                  creative.cpa && creative.cpa < 100
                                    ? "text-success"
                                    : creative.cpa && creative.cpa < 150
                                    ? "text-warning"
                                    : "text-destructive"
                                )}
                              >
                                {formatCurrency(creative.cpa)}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(creative.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Modal */}
      <UploadCreativeModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={() => {
          loadCreatives();
        }}
      />

      {/* Bulk Actions Bar */}
      {selectedCreatives.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 gradient-primary backdrop-blur-xl border-t border-primary/30 shadow-2xl glow-subtle animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">
                  {selectedCreatives.size} creative{selectedCreatives.size !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Select value={newBulkStatus} onValueChange={setNewBulkStatus}>
                  <SelectTrigger className="w-[180px] bg-card/50 border-primary/50 text-foreground">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/50">
                    <SelectItem value="draft" className="text-foreground focus:bg-card/50">Draft</SelectItem>
                    <SelectItem value="review" className="text-foreground focus:bg-card/50">Review</SelectItem>
                    <SelectItem value="approved" className="text-foreground focus:bg-card/50">Approved</SelectItem>
                    <SelectItem value="live" className="text-foreground focus:bg-card/50">Live</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (newBulkStatus) {
                      setBulkStatusDialogOpen(true);
                    }
                  }}
                  disabled={!newBulkStatus || bulkActionLoading}
                  className="gradient-primary text-white hover:opacity-90"
                >
                  Change Status
                </Button>
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={bulkActionLoading}
                  className="bg-destructive/90 hover:bg-destructive text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => setSelectedCreatives(new Set())}
                  variant="outline"
                  className="border-primary/50 text-foreground hover:bg-primary/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-primary/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Creatives?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70">
              Are you sure you want to delete {selectedCreatives.size} creative{selectedCreatives.size !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/50 text-foreground hover:bg-primary/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {bulkActionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change Confirmation Dialog */}
      <AlertDialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <AlertDialogContent className="bg-card border-primary/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Change Status</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70">
              Change status of {selectedCreatives.size} creative{selectedCreatives.size !== 1 ? "s" : ""} to{" "}
              <span className="font-semibold text-foreground capitalize">{newBulkStatus}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/50 text-foreground hover:bg-primary/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={bulkActionLoading}
              className="gradient-primary text-white hover:opacity-90"
            >
              {bulkActionLoading ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
