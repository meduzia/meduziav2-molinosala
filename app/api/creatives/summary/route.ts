import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Try to fetch from Prisma
    try {
      const assets = await prisma.asset.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      });

      // Group by status
      const byStatus = {
        draft: assets.filter((a) => a.status === "draft"),
        approved: assets.filter((a) => a.status === "approved"),
        live: assets.filter((a) => a.status === "active" || a.status === "live"),
      };

      // Calculate metrics
      const totalSpend = assets.reduce((sum, asset) => {
        // Assuming spend is calculated from CPA * conversions or stored separately
        // For now, we'll estimate based on available data
        return sum + (asset.cpa ? asset.cpa * 10 : 0); // Placeholder calculation
      }, 0);

      const avgCTR = assets.length > 0
        ? assets.reduce((sum, asset) => sum + (asset.ctr || 0), 0) / assets.length
        : 0;

      const avgROAS = assets.length > 0
        ? assets.reduce((sum, asset) => sum + (asset.roas || 0), 0) / assets.length
        : 0;

      // Group by angle for chart
      const byAngle: Record<string, { count: number; avgROAS: number; avgCTR: number }> = {};
      assets.forEach((asset) => {
        const angle = asset.angle || "Unknown";
        if (!byAngle[angle]) {
          byAngle[angle] = { count: 0, avgROAS: 0, avgCTR: 0, totalROAS: 0, totalCTR: 0 } as any;
        }
        byAngle[angle].count++;
        if (asset.roas) {
          (byAngle[angle] as any).totalROAS += asset.roas;
        }
        if (asset.ctr) {
          (byAngle[angle] as any).totalCTR += asset.ctr;
        }
      });

      // Calculate averages
      const angleData = Object.entries(byAngle).map(([angle, data]) => ({
        angle,
        count: data.count,
        avgROAS: (data as any).totalROAS / data.count || 0,
        avgCTR: (data as any).totalCTR / data.count || 0,
      }));

      return NextResponse.json({
        totalAssets: assets.length,
        byStatus: {
          draft: byStatus.draft.length,
          approved: byStatus.approved.length,
          live: byStatus.live.length,
        },
        metrics: {
          totalSpend,
          avgCTR,
          avgROAS,
        },
        byAngle: angleData,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Fallback to mock data if Prisma is not configured
      if (!process.env.DATABASE_URL) {
        return NextResponse.json({
          totalAssets: 12,
          byStatus: {
            draft: 5,
            approved: 4,
            live: 3,
          },
          metrics: {
            totalSpend: 45000,
            avgCTR: 3.2,
            avgROAS: 4.1,
          },
          byAngle: [
            { angle: "Adventure", count: 4, avgROAS: 4.5, avgCTR: 3.8 },
            { angle: "Relaxation", count: 3, avgROAS: 3.8, avgCTR: 2.9 },
            { angle: "Urban", count: 2, avgROAS: 3.2, avgCTR: 2.5 },
            { angle: "Cultural", count: 3, avgROAS: 5.2, avgCTR: 4.1 },
          ],
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching creatives summary:", error);
    return NextResponse.json(
      {
        totalAssets: 0,
        byStatus: { draft: 0, approved: 0, live: 0 },
        metrics: { totalSpend: 0, avgCTR: 0, avgROAS: 0 },
        byAngle: [],
      },
      { status: 500 }
    );
  }
}

