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

    // Consultar datos de anuncios en el rango de fechas
    const { data, error } = await supabase
      .from("ads_performance")
      .select("ad_name, spend, revenue, conversions, date")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts data', details: error.message },
        { status: 500 }
      );
    }

    // Agrupar por nombre de anuncio y calcular CPA
    const aggregated = (data || []).reduce((acc: any, row: any) => {
      const adName = row.ad_name || "Sin nombre";
      if (!acc[adName]) {
        acc[adName] = {
          adName,
          spend: 0,
          revenue: 0,
          conversions: 0,
          lastSeen: row.date,
        };
      }
      acc[adName].spend += row.spend || 0;
      acc[adName].revenue += row.revenue || 0;
      acc[adName].conversions += row.conversions || 0;
      // Mantener la fecha más reciente
      if (new Date(row.date) > new Date(acc[adName].lastSeen)) {
        acc[adName].lastSeen = row.date;
      }
      return acc;
    }, {});

    // Calcular CPA y filtrar solo los que tienen CPA > $150
    const result = Object.values(aggregated)
      .map((item: any) => {
        const cpa = item.conversions > 0 ? item.spend / item.conversions : 0;
        return {
          adName: item.adName,
          cpa,
          spend: item.spend,
          conversions: item.conversions,
          lastSeen: item.lastSeen,
        };
      })
      .filter((item: any) => item.cpa > 150)
      .sort((a: any, b: any) => b.cpa - a.cpa); // Ordenar por CPA descendente

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

