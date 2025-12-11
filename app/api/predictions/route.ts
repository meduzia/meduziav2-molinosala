import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Simple linear regression function
function linearRegression(data: { x: number; y: number }[]) {
  if (data.length < 2) {
    return { slope: 0, intercept: 0 };
  }
  
  const n = data.length;
  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 0.0001) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const monthlyBudget = searchParams.get("budget") ? parseFloat(searchParams.get("budget")!) : null;

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing date parameters", hasData: false },
        { status: 400 }
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    // Obtener datos de los últimos 14 días (o rango disponible)
    const daysBack = 14;
    const historicalFrom = new Date(from);
    historicalFrom.setDate(historicalFrom.getDate() - daysBack);

    const { data, error } = await supabase
      .from("ads_performance")
      .select("date, spend, conversions")
      .gte("date", historicalFrom.toISOString().split("T")[0])
      .lte("date", to.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: 'Failed to fetch predictions data', details: error.message, hasData: false },
        { status: 500 }
      );
    }

    // Agrupar por fecha
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const date = row.date;
      if (!acc[date]) {
        acc[date] = { date, spend: 0, conversions: 0 };
      }
      acc[date].spend += row.spend || 0;
      acc[date].conversions += row.conversions || 0;
      return acc;
    }, {});

    const dailyData = Object.values(grouped)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Últimos 14 días

    return calculatePredictions(dailyData, monthlyBudget);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", hasData: false },
      { status: 500 }
    );
  }
}

function calculatePredictions(dailyData: any[], monthlyBudget: number | null) {
  // Edge case: insufficient data
  if (dailyData.length < 3) {
    return NextResponse.json({
      error: "Insufficient data",
      hasData: false,
      message: "Se necesitan al menos 3 días de datos para generar predicciones",
    });
  }

  // Calcular promedio diario
  const totalSpend = dailyData.reduce((sum, d) => sum + (d.spend || 0), 0);
  const avgDailySpend = totalSpend / dailyData.length;
  const totalConversions = dailyData.reduce((sum, d) => sum + (d.conversions || 0), 0);
  const avgDailyConversions = totalConversions / dailyData.length;
  const avgCPA = avgDailyConversions > 0 ? avgDailySpend / avgDailyConversions : 0;

  // Regresión lineal para proyección de spend
  const regressionData = dailyData.map((d, index) => ({
    x: index,
    y: d.spend || 0,
  }));

  const { slope, intercept } = linearRegression(regressionData);

  // Proyección 30 días
  const daysAhead = 30;
  const projectedSpend30Days = slope * (dailyData.length + daysAhead - 1) + intercept;

  // Proyección próxima semana (7 días)
  const projectedSpend7Days = slope * (dailyData.length + 6) + intercept;
  const projectedConversions7Days = avgDailyConversions * 7;
  const projectedCPA7Days = projectedConversions7Days > 0
    ? projectedSpend7Days / projectedConversions7Days
    : avgCPA;

  // Calcular tendencia CPA usando datos históricos de CPA diarios
  const cpaDailyData = dailyData
    .map((d, index) => {
      const cpa = d.conversions > 0 ? d.spend / d.conversions : null;
      return cpa !== null ? { date: d.date, cpa, index } : null;
    })
    .filter((item): item is { date: string; cpa: number; index: number } => item !== null);

  let cpaTrend = 0;
  let projectedCPAWeek = avgCPA;
  let cpaProjectionData: any[] = [];

  if (cpaDailyData.length >= 3) {
    const cpaRegressionData = cpaDailyData.map((d) => ({
      x: d.index,
      y: d.cpa,
    }));

    const cpaRegression = linearRegression(cpaRegressionData);
    
    // Proyección para los próximos 7 días
    const lastIndex = dailyData.length - 1;
    cpaProjectionData = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = lastIndex + i + 1;
      const projectedCPA = cpaRegression.slope * dayIndex + cpaRegression.intercept;
      const projectedSpend = slope * dayIndex + intercept;
      const projectedConversions = avgDailyConversions;
      
      // Calcular CPA proyectado basado en spend y conversiones esperadas
      const projectedCPAValue = projectedConversions > 0 
        ? projectedSpend / projectedConversions 
        : Math.max(0, projectedCPA);
      
      return {
        date: new Date(new Date(dailyData[dailyData.length - 1].date).getTime() + (i + 1) * 24 * 60 * 60 * 1000)
          .toISOString().split("T")[0],
        cpa: Math.max(0, projectedCPAValue),
        isProjected: true,
      };
    });

    projectedCPAWeek = cpaProjectionData[cpaProjectionData.length - 1]?.cpa || avgCPA;
    cpaTrend = cpaRegression.slope > 0.5 ? 1 : cpaRegression.slope < -0.5 ? -1 : 0;
  } else {
    // Si no hay suficientes datos de CPA, usar el promedio
    projectedCPAWeek = avgCPA;
    cpaTrend = 0;
  }

  // Calcular confianza
  const variance = regressionData.reduce((sum, d) => {
    const predicted = slope * d.x + intercept;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0) / regressionData.length;

  const stdDev = Math.sqrt(variance);
  const confidence = stdDev < 100 ? "high" : stdDev < 300 ? "medium" : "low";

  // Budget calculations
  let budgetUsed = null;
  let daysUntilBudgetExhausted = null;
  if (monthlyBudget) {
    const currentMonthSpend = dailyData.reduce((sum, d) => sum + (d.spend || 0), 0);
    budgetUsed = (currentMonthSpend / monthlyBudget) * 100;
    
    if (avgDailySpend > 0) {
      const remainingBudget = monthlyBudget - currentMonthSpend;
      daysUntilBudgetExhausted = Math.floor(remainingBudget / avgDailySpend);
    }
  }

  // Proyección para gráfico de spend (próximos 14 días)
  const projectionData = Array.from({ length: 14 }, (_, i) => {
    const dayIndex = dailyData.length + i;
    const projectedSpend = slope * dayIndex + intercept;
    return {
      day: dayIndex,
      projectedSpend: Math.max(0, projectedSpend),
      confidenceUpper: Math.max(0, projectedSpend + stdDev * 1.96),
      confidenceLower: Math.max(0, projectedSpend - stdDev * 1.96),
    };
  });

  return NextResponse.json({
    hasData: true,
    avgDailySpend,
    projectedSpend30Days: Math.max(0, projectedSpend30Days),
    confidence,
    projectedCPAWeek: Math.round(projectedCPAWeek * 100) / 100,
    cpaTrend,
    budgetUsed: budgetUsed ? Math.round(budgetUsed * 10) / 10 : null,
    daysUntilBudgetExhausted,
    projectionData,
    cpaProjectionData, // Datos de proyección CPA para el gráfico
    variance: stdDev,
  });
}

