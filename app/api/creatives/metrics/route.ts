import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const from = searchParams.get("from");

    if (!name) {
      return NextResponse.json(
        { error: "Creative name is required" },
        { status: 400 }
      );
    }

    if (!from) {
      return NextResponse.json(
        { error: "From date is required" },
        { status: 400 }
      );
    }

    // Get performance data for this creative
    const { data, error } = await supabase
      .from("ads_performance")
      .select("date, spend, revenue, conversions")
      .eq("ad_name", name)
      .gte("date", from)
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json([], { status: 200 });
    }

    // Group by date and calculate metrics
    const dailyData = (data || []).reduce((acc: any, row: any) => {
      const date = row.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          spend: 0,
          revenue: 0,
          conversions: 0,
        };
      }
      acc[date].spend += row.spend || 0;
      acc[date].revenue += row.revenue || 0;
      acc[date].conversions += row.conversions || 0;
      return acc;
    }, {});

    // Calculate CPA and ROAS for each day
    const result = Object.values(dailyData).map((item: any) => ({
      date: item.date,
      spend: item.spend,
      revenue: item.revenue,
      conversions: item.conversions,
      cpa: item.conversions > 0 ? item.spend / item.conversions : 0,
      roas: item.spend > 0 ? item.revenue / item.spend : 0,
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
