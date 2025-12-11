import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Extract allowed fields to update
    const {
      name,
      angle,
      destination,
      format,
      campaign,
      notes,
      status,
    } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (angle !== undefined) updateData.angle = angle;
    if (destination !== undefined) updateData.destination = destination;
    if (format !== undefined) updateData.format = format;
    if (campaign !== undefined) updateData.campaign = campaign;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("creatives")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update creative" },
        { status: 500 }
      );
    }

    // Transform response to match expected interface
    const creative = {
      id: data.id,
      name: data.name,
      angle: data.angle,
      campaign: data.campaign,
      type: data.file_type === "video" ? ("video" as const) : ("image" as const),
      status: (data.status || "draft") as "draft" | "review" | "approved" | "live",
      url: data.file_url,
      source: "Human" as const,
      format: data.format,
      destination: data.destination,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(creative);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update creative" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete by setting status to 'deleted' or actually delete
    // For now, we'll do a hard delete. You can change to soft delete if needed.
    const { error } = await supabase
      .from("creatives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete creative" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete creative" },
      { status: 500 }
    );
  }
}
