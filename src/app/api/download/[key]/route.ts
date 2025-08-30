import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

const s3 = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    console.log('Downloading file with key:', decodedKey);
    
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: decodedKey,
    });

    const response = await s3.send(command);
    
    if (!response.Body) {
      console.error('File not found:', decodedKey);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Extract original filename from key
    const keyParts = decodedKey.split('/');
    const fileNameWithTimestamp = keyParts[keyParts.length - 1];
    const originalName = fileNameWithTimestamp.substring(fileNameWithTimestamp.indexOf('-') + 1);

    console.log('Serving file:', originalName);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Content-Length': response.ContentLength?.toString() || buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
} 