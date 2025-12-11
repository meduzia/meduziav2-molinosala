import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  user?: string;
  note?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note, user } = body;

    // Validate status
    const validStatuses = ["draft", "review", "approved", "live"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: draft, review, approved, live" },
        { status: 400 }
      );
    }

    // Get current creative data
    const { data: currentData, error: fetchError } = await supabase
      .from("creatives")
      .select("status, status_history")
      .eq("id", id)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json(
        { error: "Creative not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    const currentStatus = currentData.status;
    const validTransitions: Record<string, string[]> = {
      draft: ["review"],
      review: ["approved", "draft"], // approved or request changes back to draft
      approved: ["live"],
      live: ["approved"], // pause back to approved
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid transition from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Get existing status history
    const existingHistory: StatusHistoryEntry[] = currentData.status_history || [];

    // Create new status history entry
    const newEntry: StatusHistoryEntry = {
      status,
      timestamp: new Date().toISOString(),
      user: user || "System",
      note: note || null,
    };

    const updatedHistory = [...existingHistory, newEntry];

    // Update creative with new status and history
    const { data, error } = await supabase
      .from("creatives")
      .update({
        status,
        status_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        status: data.status,
        status_history: data.status_history,
        updated_at: data.updated_at,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
