import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/upload - Starting request');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('Uploading file:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      folderPath 
    });

    // Generate unique key
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${file.name}`;
    const key = folderPath ? `${folderPath}/${uniqueFileName}` : uniqueFileName;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);
    console.log('File uploaded successfully to S3:', key);

    // Generate clean download URL (no credentials exposed)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/api/download/${encodeURIComponent(key)}`;

    return NextResponse.json({
      success: true,
      key,
      fileName: uniqueFileName,
      originalName: file.name,
      downloadUrl,
    });

  } catch (error) {
    console.error("Error in POST /api/upload:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 