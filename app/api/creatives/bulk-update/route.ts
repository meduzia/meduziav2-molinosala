import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    if (!status || !["draft", "review", "approved", "live"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (draft, review, approved, live)" },
        { status: 400 }
      );
    }

    // Get existing creatives to update status_history
    const { data: existingCreatives, error: fetchError } = await supabase
      .from("creatives")
      .select("id, status_history")
      .in("id", ids);

    if (fetchError) {
      console.error("Error fetching creatives:", fetchError);
      return NextResponse.json(
        { error: "Error fetching creatives" },
        { status: 500 }
      );
    }

    // Update each creative with status and status_history
    const updates = existingCreatives.map((creative: any) => {
      const currentHistory = creative.status_history || [];
      const newHistoryEntry = {
        status,
        timestamp: new Date().toISOString(),
        user: "Current User", // TODO: Get from auth context
        note: `Status changed to ${status}`,
      };

      return {
        id: creative.id,
        status,
        status_history: [...currentHistory, newHistoryEntry],
        updated_at: new Date().toISOString(),
      };
    });

    // Update all creatives
    const updatePromises = updates.map((update) =>
      supabase
        .from("creatives")
        .update({
          status: update.status,
          status_history: update.status_history,
          updated_at: update.updated_at,
        })
        .eq("id", update.id)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Errors updating creatives:", errors);
      return NextResponse.json(
        { error: "Error updating some creatives" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: ids.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
