import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing date parameters" },
        { status: 400 }
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    // Calcular período anterior para comparación
    const periodLength = to.getTime() - from.getTime();
    const previousTo = new Date(from);
    previousTo.setTime(previousTo.getTime() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setTime(previousFrom.getTime() - periodLength);

    // Consultar período actual
    const { data: currentData, error: currentError } = await supabase
      .from("ads_performance")
      .select("angle, ad_name, spend, revenue, conversions")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0]);

    // If table doesn't exist or no data, return empty array
    if (currentError) {
      console.warn("Supabase warning (current):", currentError?.message);
      // Return empty array instead of error - analytics table may not be set up
      return NextResponse.json([]);
    }

    // Consultar período anterior
    const { data: previousData, error: previousError } = await supabase
      .from("ads_performance")
      .select("angle, spend, revenue, conversions")
      .gte("date", previousFrom.toISOString().split("T")[0])
      .lte("date", previousTo.toISOString().split("T")[0]);

    if (previousError) {
      console.warn("Supabase warning (previous):", previousError?.message);
      // Continue without previous data for comparison
    }

    // Agrupar datos actuales por ángulo
    const currentGrouped = (currentData || []).reduce((acc: any, row: any) => {
      const angle = row.angle || "Sin Ángulo";
      if (!acc[angle]) {
        acc[angle] = {
          angle,
          totalSpend: 0,
          totalRevenue: 0,
          totalConversions: 0,
          uniqueAds: new Set<string>(),
        };
      }
      acc[angle].totalSpend += row.spend || 0;
      acc[angle].totalRevenue += row.revenue || 0;
      acc[angle].totalConversions += row.conversions || 0;
      // Contar anuncios únicos por ángulo
      if (row.ad_name) {
        acc[angle].uniqueAds.add(row.ad_name);
      }
      return acc;
    }, {});

    // Agrupar datos período anterior por ángulo
    const previousGrouped = (previousData || []).reduce((acc: any, row: any) => {
      const angle = row.angle || "Sin Ángulo";
      if (!acc[angle]) {
        acc[angle] = {
          totalSpend: 0,
          totalConversions: 0,
        };
      }
      acc[angle].totalSpend += row.spend || 0;
      acc[angle].totalConversions += row.conversions || 0;
      return acc;
    }, {});

    // Calcular métricas y tendencias
    const result = Object.values(currentGrouped)
      .map((item: any) => {
        const adsCount = item.uniqueAds.size || 1;
        const avgCPA = item.totalConversions > 0
          ? item.totalSpend / item.totalConversions
          : 0;
        const avgROAS = item.totalSpend > 0
          ? item.totalRevenue / item.totalSpend
          : 0;

        // Calcular tendencia comparando con período anterior
        const previous = previousGrouped[item.angle] || { totalSpend: 0, totalConversions: 0 };
        const previousCPA = previous.totalConversions > 0
          ? previous.totalSpend / previous.totalConversions
          : 0;

        let trend = 0;
        if (previousCPA > 0 && avgCPA > 0) {
          // Para CPA, menor es mejor, así que invertimos la tendencia
          trend = ((previousCPA - avgCPA) / previousCPA) * 100;
        }

        return {
          angle: item.angle,
          adsCount,
          avgCPA,
          totalConversions: item.totalConversions,
          avgROAS,
          trend: Math.round(trend * 10) / 10,
        };
      })
      .sort((a: any, b: any) => a.avgCPA - b.avgCPA) // Ordenar por CPA ascendente (menor primero)
      .slice(0, 5); // Top 5

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

