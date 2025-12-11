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
      .select("ad_name, spend, revenue, conversions")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0]);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: 'Failed to fetch ads performance data', details: error.message },
        { status: 500 }
      );
    }

    // Agrupar por nombre de anuncio y calcular totales
    const aggregated = (data || []).reduce((acc: any, row: any) => {
      const adName = row.ad_name || "Sin nombre";
      if (!acc[adName]) {
        acc[adName] = { adName, spend: 0, revenue: 0, conversions: 0 };
      }
      acc[adName].spend += row.spend || 0;
      acc[adName].revenue += row.revenue || 0;
      acc[adName].conversions += row.conversions || 0;
      return acc;
    }, {});

    // Convertir a array y calcular ROAS y CPA
    const result = Object.values(aggregated)
      .map((item: any) => {
        const roas = item.spend > 0 ? item.revenue / item.spend : 0;
        const cpa = item.conversions > 0 ? item.spend / item.conversions : 0;
        return {
          adName: item.adName,
          roas,
          cpa,
          spend: item.spend,
          revenue: item.revenue,
          conversions: item.conversions,
        };
      })
      .sort((a: any, b: any) => a.cpa - b.cpa) // Ordenar por CPA ascendente (más bajo primero - mejor)
      .slice(0, 5);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


