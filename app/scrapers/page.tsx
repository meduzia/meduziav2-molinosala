"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2 } from "lucide-react";
import { getScraperData } from "@/lib/scrapers";
import type { ScraperItem } from "@/data/scrapers";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";

const categories = ["todas", "noticias", "competencia", "tendencias"] as const;

export default function ScrapersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [scraperData, setScraperData] = useState<ScraperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de scrapers
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getScraperData();
        setScraperData(data);
      } catch (err) {
        console.error("Error loading scraper data:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...scraperData];

    // Filtrar por categoría
    if (selectedCategory !== "todas") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
      );
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [scraperData, searchQuery, selectedCategory]);

  const getCategoryColor = (category: ScraperItem["category"]) => {
    switch (category) {
      case "noticias":
        return "bg-primary/20 text-primary border-primary/50";
      case "competencia":
        return "bg-warning/20 text-warning border-warning/50";
      case "tendencias":
        return "bg-success/20 text-success border-success/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: ScraperItem["category"]) => {
    switch (category) {
      case "noticias":
        return "📰 Noticias";
      case "competencia":
        return "🎯 Competencia";
      case "tendencias":
        return "📈 Tendencias";
      default:
        return category;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Scrapers — Información y Análisis
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Monitoreo de noticias, competencia y tendencias del mercado
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <section className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, resumen o fuente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                <SelectItem value="noticias">📰 Noticias</SelectItem>
                <SelectItem value="competencia">🎯 Competencia</SelectItem>
                <SelectItem value="tendencias">📈 Tendencias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredData.length === 0 ? (
              <span>No se encontraron resultados</span>
            ) : (
              <span>
                Mostrando {filteredData.length} resultado{filteredData.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Cards Grid */}
      <section className="container mx-auto px-6 pb-6">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Cargando datos de scrapers...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive text-lg mb-2">{error}</p>
              <p className="text-sm text-muted-foreground">
                Por favor, intenta recargar la página
              </p>
            </CardContent>
          </Card>
        ) : filteredData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No hay resultados</p>
              <p className="text-sm text-muted-foreground">
                Intenta ajustar tus filtros o búsqueda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={getCategoryColor(item.category)}
                    >
                      {getCategoryLabel(item.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.date), "HH:mm", { locale: es })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

