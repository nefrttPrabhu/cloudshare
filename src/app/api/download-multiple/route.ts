import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import JSZip from 'jszip';

const s3 = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/download-multiple - Starting request');
    
    const { keys, folderName } = await request.json();
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    }

    console.log('Creating zip for keys:', keys);

    // Create a zip file
    const zip = new JSZip();
    
    // Download each file from S3 and add to zip
    for (const key of keys) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
        });

        const response = await s3.send(getCommand);
        const fileBuffer = await response.Body?.transformToByteArray();
        
        if (fileBuffer) {
          // Extract original filename from key (remove timestamp prefix)
          const keyParts = key.split('/');
          const fileNameWithTimestamp = keyParts[keyParts.length - 1];
          const originalName = fileNameWithTimestamp.substring(fileNameWithTimestamp.indexOf('-') + 1);
          
          zip.file(originalName, fileBuffer);
        }
      } catch (error) {
        console.error(`Error downloading file ${key}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Upload zip to S3
    const timestamp = Date.now();
    const zipKey = `downloads/${folderName || 'files'}-${timestamp}.zip`;
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: zipKey,
      Body: zipBuffer,
      ContentType: 'application/zip',
    });

    await s3.send(putCommand);
    console.log('Zip file uploaded successfully:', zipKey);

    // Generate clean download URL (no credentials exposed)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/api/download/${encodeURIComponent(zipKey)}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      zipKey,
      fileCount: keys.length,
    });

  } catch (error) {
    console.error("Error in POST /api/download-multiple:", error);
    return NextResponse.json(
      { error: `Failed to create download: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 