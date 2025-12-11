import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const angle = formData.get("angle") as string | null;
    const destination = formData.get("destination") as string | null;
    const format = formData.get("format") as string | null;
    const campaign = formData.get("campaign") as string | null;
    const notes = formData.get("notes") as string | null;
    const status = formData.get("status") as string || "draft";
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

    // Validate file size (50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "creatives");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/creatives/${uniqueFilename}`;

    // Save metadata to Supabase
    try {
      // Initialize status_history with initial draft entry
      const initialHistory = [
        {
          status: status || "draft",
          timestamp: new Date().toISOString(),
          user: "System",
          note: "Creative creado",
        },
      ];

      const { data, error } = await supabase
        .from("creatives")
        .insert({
          name,
          file_url: fileUrl,
          file_type: fileType,
          angle: angle || null,
          destination: destination || null,
          format: format || null,
          campaign: campaign || null,
          notes: notes || null,
          status: status || "draft",
          status_history: initialHistory,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        // If Supabase fails, still return success with file URL
        // In production, you might want to rollback the file upload
        return NextResponse.json(
          {
            id: uuidv4(),
            url: fileUrl,
            status: status,
            createdAt: new Date().toISOString(),
            error: "File uploaded but metadata save failed",
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        {
          id: data.id,
          url: data.file_url,
          status: data.status,
          createdAt: data.created_at,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      // Return success with file URL even if DB fails
      return NextResponse.json(
        {
          id: uuidv4(),
          url: fileUrl,
          status: status,
          createdAt: new Date().toISOString(),
          warning: "File uploaded but metadata may not be saved",
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
