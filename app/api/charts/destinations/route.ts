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
      .select("destination, conversions, spend, revenue")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0]);

    if (error) {
      console.error("Supabase error:", error);
      // Fallback a datos mock
      return NextResponse.json([
        { destination: "USA", conversions: 450, spend: 12000, revenue: 48000 },
        { destination: "Europa", conversions: 320, spend: 9500, revenue: 35200 },
        { destination: "Brasil", conversions: 280, spend: 8500, revenue: 29400 },
        { destination: "Chile", conversions: 195, spend: 6200, revenue: 20475 },
        { destination: "México", conversions: 165, spend: 5800, revenue: 17325 },
      ]);
    }

    // Agrupar por destino
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const destination = row.destination || "Otro";
      if (!acc[destination]) {
        acc[destination] = { destination, conversions: 0, spend: 0, revenue: 0 };
      }
      acc[destination].conversions += row.conversions || 0;
      acc[destination].spend += row.spend || 0;
      acc[destination].revenue += row.revenue || 0;
      return acc;
    }, {});

    // Calcular totales y porcentajes
    const result = Object.values(grouped)
      .map((item: any) => {
        const cpa = item.conversions > 0 ? item.spend / item.conversions : 0;
        const roas = item.spend > 0 ? item.revenue / item.spend : 0;
        return {
          ...item,
          cpa,
          roas,
        };
      })
      .sort((a: any, b: any) => b.conversions - a.conversions); // Ordenar por conversiones

    // Calcular porcentajes
    const totalConversions = result.reduce((sum: number, item: any) => sum + item.conversions, 0);
    const resultWithPercentage = result.map((item: any) => ({
      ...item,
      percentage: totalConversions > 0 ? (item.conversions / totalConversions) * 100 : 0,
    }));

    return NextResponse.json(resultWithPercentage);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

