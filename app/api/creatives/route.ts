import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const status = searchParams.get("status");

    let query = supabase.from("creatives").select("*").order("created_at", { ascending: false });

    // Always exclude deleted creatives unless specifically requested
    if (!status || status.toLowerCase() !== "deleted") {
      query = query.neq("status", "deleted");
    }

    // Filter by source if provided
    if (source) {
      // For now, 'AI' source doesn't exist in the creatives table
      // This is handled separately if needed
      if (source.toLowerCase() === "ai") {
        // Return empty for AI source as it's not in this table
        return NextResponse.json([]);
      }
    }

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      // Fallback to empty array if Supabase fails
      return NextResponse.json([], { status: 200 });
    }

    // Get performance metrics for live creatives
    // Match creative.name with ads_performance.ad_name
    const liveCreatives = (data || []).filter((item: any) => item.status === "live");
    const creativeNames = liveCreatives.map((item: any) => item.name);

    let performanceData: Record<string, any> = {};

    if (creativeNames.length > 0) {
      // Get last 30 days of performance data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Query all ads_performance data for the date range, then filter in memory
      // This avoids issues with very large IN() clauses
      const { data: adsData, error: adsError } = await supabase
        .from("ads_performance")
        .select("ad_name, spend, revenue, conversions")
        .gte("date", dateStr);

      if (!adsError && adsData) {
        // Filter to only creative names and aggregate
        const relevantData = adsData.filter((row: any) =>
          creativeNames.includes(row.ad_name)
        );

        performanceData = relevantData.reduce((acc: any, row: any) => {
          const adName = row.ad_name;
          if (!acc[adName]) {
            acc[adName] = {
              spend: 0,
              revenue: 0,
              conversions: 0,
            };
          }
          acc[adName].spend += row.spend || 0;
          acc[adName].revenue += row.revenue || 0;
          acc[adName].conversions += row.conversions || 0;
          return acc;
        }, {});

        // Calculate CPA and ROAS for each ad
        Object.keys(performanceData).forEach((adName) => {
          const metrics = performanceData[adName];
          metrics.cpa = metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0;
          metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
        });
      }
    }

    // Transform data to match expected interface
    const creatives = (data || []).map((item: any) => {
      const metrics = performanceData[item.name] || null;
      return {
        id: item.id,
        name: item.name,
        angle: item.angle,
        campaign: item.campaign,
        type: item.file_type === "video" ? ("video" as const) : ("image" as const),
        status: (item.status || "draft") as "draft" | "review" | "approved" | "live",
        url: item.file_url,
        source: "Human" as const, // All uploads are human-created
        format: item.format,
        destination: item.destination,
        notes: item.notes,
        status_history: item.status_history || [],
        created_at: item.created_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Performance metrics (only for live creatives with data)
        metrics: metrics ? {
          cpa: metrics.cpa,
          roas: metrics.roas,
          conversions: metrics.conversions,
          spend: metrics.spend,
          revenue: metrics.revenue,
        } : null,
      };
    });

    return NextResponse.json(creatives);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const angle = formData.get("angle") as string | null;
    const destination = formData.get("destination") as string | null;
    const campaign = formData.get("campaign") as string | null;
    const file = formData.get("file") as File | null;

    if (!name || !file) {
      return NextResponse.json(
        { error: "Name and file are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type.startsWith("video/") ? "video" : "image";
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be an image or video" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    let fileUrl: string;
    try {
      // TODO: Implementar uploadToS3 function
      // fileUrl = await uploadToS3(buffer, file.name, file.type);
      fileUrl = `/uploads/${file.name}`; // Fallback path
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      // Fallback: if S3 is not configured, use a placeholder
      if (!process.env.AWS_S3_BUCKET_NAME) {
        fileUrl = `/uploads/${file.name}`;
      } else {
        return NextResponse.json(
          { error: "Failed to upload file to S3" },
          { status: 500 }
        );
      }
    }

    // Save to database using Prisma
    let asset;
    try {
      // TODO: Implementar Prisma database storage
      // asset = await prisma.asset.create({
      //   data: {
      //     name,
      //     angle: angle || null,
      //     destination: destination || null,
      //     campaign: campaign || null,
      //     source: "upload",
      //     status: "draft",
      //     fileUrl,
      //     fileType,
      //     fileSize: file.size,
      //     mimeType: file.type,
      //   },
      // });
      asset = { id: "draft", fileUrl, name, fileType, status: "draft", createdAt: new Date() }; // Mock asset
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If Prisma is not configured, return mock response
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          {
            id: Date.now().toString(),
            url: fileUrl,
            status: "draft",
            createdAt: new Date().toISOString(),
          },
          { status: 201 }
        );
      }
      return NextResponse.json(
        { error: "Failed to save to database" },
        { status: 500 }
      );
    }

    // Return response in the requested format
    return NextResponse.json(
      {
        id: asset.id,
        url: asset.fileUrl,
        status: asset.status || "draft",
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating creative:", error);
    return NextResponse.json(
      { error: "Failed to create creative" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    // Try to update in Prisma
    try {
      // TODO: Implementar Prisma update
      // await prisma.asset.update({
      //   where: { id },
      //   data: { status },
      // });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If Prisma is not configured, still return success for mock
      if (!process.env.DATABASE_URL) {
        return NextResponse.json({ success: true });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating creative:", error);
    return NextResponse.json(
      { error: "Failed to update creative" },
      { status: 500 }
    );
  }
}

