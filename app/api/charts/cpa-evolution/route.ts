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

    // Consultar datos diarios en el rango
    const { data, error } = await supabase
      .from("ads_performance")
      .select("date, spend, conversions")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json([]);
    }

    // Agrupar por fecha y calcular CPA diario
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const date = row.date;
      if (!acc[date]) {
        acc[date] = { date, spend: 0, conversions: 0 };
      }
      acc[date].spend += row.spend || 0;
      acc[date].conversions += row.conversions || 0;
      return acc;
    }, {});

    const result = Object.values(grouped)
      .map((item: any, index: number, array: any[]) => {
        const cpa = item.conversions > 0 ? item.spend / item.conversions : 0;
        
        // Calcular cambio porcentual vs día anterior
        let changePercent = 0;
        if (index > 0) {
          const prevItem = array[index - 1];
          const prevCPA = prevItem.conversions > 0 ? prevItem.spend / prevItem.conversions : 0;
          if (prevCPA > 0) {
            changePercent = ((cpa - prevCPA) / prevCPA) * 100;
          }
        }

        return {
          date: item.date,
          cpa,
          changePercent: Math.round(changePercent * 10) / 10,
          isAboveThreshold: cpa > 150,
        };
      })
      .filter((item: any) => item.cpa > 0); // Filtrar días sin datos

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

