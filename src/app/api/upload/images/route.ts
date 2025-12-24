import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3Service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const type = formData.get("type") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Validate file count (max 10 images)
    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    // Process each file
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        );
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      try {
        const folder = type || "rooms";
        const url = await uploadToS3(buffer, originalName, file.type, folder);
        uploadedUrls.push(url);
      } catch (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        // Continue or abort? Let's abort to be safe/consistent
        return NextResponse.json(
          { error: "Failed to upload to S3" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `${uploadedUrls.length} file(s) uploaded successfully`,
        data: {
          urls: uploadedUrls,
          count: uploadedUrls.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload files",
      },
      { status: 500 }
    );
  }
}
