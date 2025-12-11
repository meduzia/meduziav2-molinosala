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

    // Consultar datos en el rango
    const { data, error } = await supabase
      .from("ads_performance")
      .select("format, spend, revenue, conversions")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0]);

    if (error) {
      console.error("Supabase error:", error);
      // Fallback a datos mock
      return NextResponse.json([
        { format: "Video", cpa: 85.50, roas: 4.2, conversions: 450 },
        { format: "UGC", cpa: 92.30, roas: 3.9, conversions: 380 },
        { format: "Carousel", cpa: 105.20, roas: 3.6, conversions: 320 },
        { format: "Image", cpa: 118.50, roas: 3.2, conversions: 280 },
        { format: "Stories", cpa: 125.80, roas: 2.9, conversions: 195 },
      ]);
    }

    // Agrupar por formato
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const format = row.format || "Otro";
      if (!acc[format]) {
        acc[format] = { format, spend: 0, revenue: 0, conversions: 0 };
      }
      acc[format].spend += row.spend || 0;
      acc[format].revenue += row.revenue || 0;
      acc[format].conversions += row.conversions || 0;
      return acc;
    }, {});

    // Calcular métricas
    const result = Object.values(grouped).map((item: any) => {
      const cpa = item.conversions > 0 ? item.spend / item.conversions : 0;
      const roas = item.spend > 0 ? item.revenue / item.spend : 0;
      return {
        format: item.format,
        cpa,
        roas,
        conversions: item.conversions,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

