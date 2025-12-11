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
      .select("date, spend, revenue")
      .gte("date", from.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json([]);
    }

    // Agrupar por fecha
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const date = row.date;
      if (!acc[date]) {
        acc[date] = { date, spend: 0, revenue: 0 };
      }
      acc[date].spend += row.spend || 0;
      acc[date].revenue += row.revenue || 0;
      return acc;
    }, {});

    const result = Object.values(grouped).map((item: any) => ({
      date: item.date,
      spend: item.spend,
      revenue: item.revenue,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

