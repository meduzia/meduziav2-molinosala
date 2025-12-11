import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fallback insights when API fails
function getFallbackInsights() {
  return [
    {
      type: "info",
      priority: "medium",
      icon: "📊",
      title: "Análisis en progreso",
      description: "Los datos están siendo procesados. Revisa las métricas principales mientras tanto.",
      action: "Revisa el dashboard de KPIs para ver el rendimiento actual."
    }
  ];
}

function generateCacheKey(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

async function collectDashboardData(from: string, to: string) {
  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Fetch KPIs data directly from Supabase
    const { data: adsData, error: adsError } = await supabase
      .from("ads_performance")
      .select("*")
      .gte("date", fromDate.toISOString().split("T")[0])
      .lte("date", toDate.toISOString().split("T")[0]);

    if (adsError) {
      console.error("Error fetching ads data:", adsError);
      return null;
    }

    // Calculate KPIs
    const totalSpend = (adsData || []).reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const totalConversions = (adsData || []).reduce((sum, ad) => sum + (ad.conversions || 0), 0);
    const totalImpressions = (adsData || []).reduce((sum, ad) => sum + (ad.impressions || 0), 0);
    const totalClicks = (adsData || []).reduce((sum, ad) => sum + (ad.clicks || 0), 0);

    const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgROAS = totalSpend > 0 ? (totalConversions * 200) / totalSpend : 0; // Assuming avg revenue per conversion

    // Calculate trends (compare with previous period)
    const periodDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(fromDate);
    previousFrom.setDate(previousFrom.getDate() - periodDays);
    const previousTo = fromDate;

    const { data: previousAdsData } = await supabase
      .from("ads_performance")
      .select("*")
      .gte("date", previousFrom.toISOString().split("T")[0])
      .lt("date", previousTo.toISOString().split("T")[0]);

    const prevTotalSpend = (previousAdsData || []).reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const prevTotalConversions = (previousAdsData || []).reduce((sum, ad) => sum + (ad.conversions || 0), 0);
    const prevTotalClicks = (previousAdsData || []).reduce((sum, ad) => sum + (ad.clicks || 0), 0);
    const prevTotalImpressions = (previousAdsData || []).reduce((sum, ad) => sum + (ad.impressions || 0), 0);

    const prevCPA = prevTotalConversions > 0 ? prevTotalSpend / prevTotalConversions : 0;
    const prevCTR = prevTotalImpressions > 0 ? (prevTotalClicks / prevTotalImpressions) * 100 : 0;

    const cpaTrend = prevCPA > 0 ? ((avgCPA - prevCPA) / prevCPA) * 100 : 0;
    const ctrTrend = prevCTR > 0 ? ((avgCTR - prevCTR) / prevCTR) * 100 : 0;
    const spendTrend = prevTotalSpend > 0 ? ((totalSpend - prevTotalSpend) / prevTotalSpend) * 100 : 0;
    const conversionsTrend = prevTotalConversions > 0 ? ((totalConversions - prevTotalConversions) / prevTotalConversions) * 100 : 0;

    // Get top performers (by ROAS or conversions)
    const adPerformance = (adsData || []).reduce((acc: any, ad: any) => {
      const key = ad.name || ad.id;
      if (!acc[key]) {
        acc[key] = {
          name: ad.name || `Ad ${ad.id}`,
          spend: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
          cpa: 0,
          roas: 0,
          ctr: 0,
        };
      }
      acc[key].spend += ad.spend || 0;
      acc[key].conversions += ad.conversions || 0;
      acc[key].clicks += ad.clicks || 0;
      acc[key].impressions += ad.impressions || 0;
      return acc;
    }, {});

    const topPerformers = Object.values(adPerformance)
      .map((ad: any) => {
        ad.cpa = ad.conversions > 0 ? ad.spend / ad.conversions : 0;
        ad.roas = ad.spend > 0 ? (ad.conversions * 200) / ad.spend : 0;
        ad.ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
        return ad;
      })
      .sort((a: any, b: any) => (b.roas || 0) - (a.roas || 0))
      .slice(0, 10);

    // Get angles performance
    const anglePerformance = (adsData || []).reduce((acc: any, ad: any) => {
      const angle = ad.angle || "Sin ángulo";
      if (!acc[angle]) {
        acc[angle] = {
          angle,
          spend: 0,
          conversions: 0,
          ads: new Set(),
        };
      }
      acc[angle].spend += ad.spend || 0;
      acc[angle].conversions += ad.conversions || 0;
      if (ad.name) acc[angle].ads.add(ad.name);
      return acc;
    }, {});

    const angles = Object.values(anglePerformance)
      .map((angle: any) => {
        angle.totalConversions = angle.conversions;
        angle.avgCPA = angle.conversions > 0 ? angle.spend / angle.conversions : 0;
        angle.avgROAS = angle.spend > 0 ? (angle.conversions * 200) / angle.spend : 0;
        angle.adsCount = angle.ads.size;
        delete angle.ads;
        return angle;
      })
      .sort((a: any, b: any) => (a.avgCPA || 0) - (b.avgCPA || 0))
      .slice(0, 5);

    // Get formats performance
    const formatPerformance = (adsData || []).reduce((acc: any, ad: any) => {
      const format = ad.format || "Unknown";
      if (!acc[format]) {
        acc[format] = {
          format,
          spend: 0,
          conversions: 0,
          clicks: 0,
        };
      }
      acc[format].spend += ad.spend || 0;
      acc[format].conversions += ad.conversions || 0;
      acc[format].clicks += ad.clicks || 0;
      return acc;
    }, {});

    const formats = Object.values(formatPerformance).map((fmt: any) => {
      fmt.cpa = fmt.conversions > 0 ? fmt.spend / fmt.conversions : 0;
      fmt.roas = fmt.spend > 0 ? (fmt.conversions * 200) / fmt.spend : 0;
      return fmt;
    });

    // Get predictions data (simplified calculation)
    const dailyData = (adsData || []).reduce((acc: any, ad: any) => {
      const date = ad.date;
      if (!acc[date]) {
        acc[date] = { date, spend: 0, conversions: 0 };
      }
      acc[date].spend += ad.spend || 0;
      acc[date].conversions += ad.conversions || 0;
      return acc;
    }, {});

    const dailyArray = Object.values(dailyData).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const avgDailySpend = dailyArray.length > 0
      ? dailyArray.reduce((sum: number, d: any) => sum + (d.spend || 0), 0) / dailyArray.length
      : 0;

    const projectedSpend30Days = avgDailySpend * 30;
    const projectedCPAWeek = avgCPA;

    return {
      kpis: {
        spend: totalSpend,
        cpa: avgCPA,
        conversions: totalConversions,
        ctr: avgCTR,
        roas: avgROAS,
        spendTrend,
        cpaTrend,
        conversionsTrend,
        ctrTrend,
      },
      topPerformers,
      angles,
      formats,
      predictions: {
        projectedSpend30Days,
        projectedCPAWeek,
      },
    };
  } catch (error) {
    console.error("Error collecting dashboard data:", error);
    return null;
  }
}

async function generateInsightsWithGPT(data: any): Promise<any[]> {
  const { getOpenAIApiKey } = await import('@/lib/config/api-keys')
  const apiKey = getOpenAIApiKey()

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key not configured correctly');
  }

  const openai = new OpenAI({
    apiKey,
  });

  const prompt = `Eres un analista experto de Meta Ads para Retrofish Digital (agencia de marketing digital).

Analiza estos datos y proporciona 3-5 insights accionables en español:

Métricas Principales:
- Ad Spend: $${data.kpis?.spend?.toFixed(2) || 0} (Tendencia: ${data.kpis?.spendTrend?.toFixed(1) || 0}%)
- CPA: $${data.kpis?.cpa?.toFixed(2) || 0} (Tendencia: ${data.kpis?.cpaTrend?.toFixed(1) || 0}%)
- Conversiones: ${data.kpis?.conversions || 0} (Tendencia: ${data.kpis?.conversionsTrend?.toFixed(1) || 0}%)
- CTR: ${data.kpis?.ctr?.toFixed(2) || 0}% (Tendencia: ${data.kpis?.ctrTrend?.toFixed(1) || 0}%)
- ROAS: ${data.kpis?.roas?.toFixed(2) || 0}

Top Performers:
${(data.topPerformers || []).slice(0, 5).map((ad: any, i: number) => 
  `${i + 1}. ${ad.name}: CPA $${ad.cpa?.toFixed(2)}, ROAS ${ad.roas?.toFixed(2)}, ${ad.conversions} conversiones`
).join('\n')}

Ángulos Ganadores:
${(data.angles || []).map((angle: any, i: number) => 
  `${i + 1}. ${angle.angle || 'Sin ángulo'}: CPA $${angle.avgCPA?.toFixed(2)}, ROAS ${angle.avgROAS?.toFixed(2)}, ${angle.totalConversions} conversiones`
).join('\n')}

Predicciones:
- Proyección 30 días: $${data.predictions?.projectedSpend30Days?.toFixed(2) || 0}
- CPA proyectado próxima semana: $${data.predictions?.projectedCPAWeek?.toFixed(2) || 0}
- Budget usado: ${data.predictions?.budgetUsed?.toFixed(1) || 0}%

Responde SOLO con un JSON válido en este formato exacto:
{
  "insights": [
    {
      "type": "performance_alert",
      "priority": "high",
      "icon": "⚠️",
      "title": "Título breve",
      "description": "Descripción detallada con datos específicos",
      "action": "Acción recomendada específica"
    }
  ]
}

Enfócate en:
- Anomalías de performance (picos de CPA, caídas de ROAS)
- Oportunidades de optimización
- Sugerencias de asignación de budget
- Patrones de performance creativa
- Alertas basadas en predicciones

Formato: Breve, accionable, específico. Usa emojis. Español.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un analista experto de publicidad en Meta Ads. Proporcionas insights accionables y específicos basados en datos. Siempre respondes en formato JSON válido con la estructura { \"insights\": [...] }.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseText);
    
    // Handle response structure
    const insights = parsed.insights || parsed.recommendations || parsed.data || [];
    
    if (Array.isArray(insights) && insights.length > 0) {
      return insights.slice(0, 5); // Limit to 5 insights
    }
    
    return getFallbackInsights();
  } catch (error: any) {
    console.error("OpenAI API error:", error?.message);
    return getFallbackInsights();
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const forceRefresh = searchParams.get("refresh") === "true";

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing date parameters", insights: getFallbackInsights() },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = generateCacheKey({ from, to });
    const cached = cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        insights: cached.data,
        cached: true,
        timestamp: cached.timestamp,
      });
    }

    // Collect dashboard data
    const dashboardData = await collectDashboardData(from, to);

    if (!dashboardData) {
      return NextResponse.json({
        insights: getFallbackInsights(),
        cached: false,
        timestamp: Date.now(),
      });
    }

    // Generate insights with GPT if API key is available
    const insights = await generateInsightsWithGPT(dashboardData);

    // Cache results
    cache.set(cacheKey, {
      data: insights,
      timestamp: Date.now(),
    });

    // Clean old cache entries (keep only last 10)
    if (cache.size > 10) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.clear();
      entries.slice(0, 10).forEach(([key, value]) => cache.set(key, value));
    }

    return NextResponse.json({
      insights,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        insights: getFallbackInsights(),
        error: error?.message || "Internal server error",
        cached: false,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
