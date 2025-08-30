import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

async function getPresignedUrl(key: string, contentType: string) {
  console.log('Generating presigned URL for:', { key, contentType });
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiry
    console.log('Generated presigned URL successfully');
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

async function getSignedDownloadUrl(key: string) {
  console.log('Generating download URL for:', { key });
  
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });
  
  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiry
    console.log('Generated download URL successfully');
    return url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/aws - Starting request');
    
    // Log environment variables (without exposing sensitive data)
    console.log('Environment check:', {
      hasRegion: !!process.env.AWS_REGION,
      hasBucket: !!process.env.S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET,
    });

    const { fileName, fileType, folderPath } = await request.json();
    
    console.log('Request body:', { fileName, fileType, folderPath });
    
    if (!fileName || !fileType) {
      console.error('Missing required fields:', { fileName, fileType });
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    // Generate a unique key for the file
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const key = folderPath ? `${folderPath}/${uniqueFileName}` : uniqueFileName;

    console.log('Generated key:', key);

    // Get presigned URL for upload
    const uploadUrl = await getPresignedUrl(key, fileType);

    console.log('Successfully generated upload URL');

    return NextResponse.json({
      uploadUrl,
      key,
      fileName: uniqueFileName,
    });
  } catch (error) {
    console.error("Error in POST /api/aws:", error);
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/aws - Starting request');
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    console.log('Request params:', { key });
    
    if (!key) {
      console.error('Missing key parameter');
      return NextResponse.json(
        { error: "key parameter is required" },
        { status: 400 }
      );
    }

    // Get presigned URL for download
    const downloadUrl = await getSignedDownloadUrl(key);

    console.log('Successfully generated download URL');

    return NextResponse.json({
      downloadUrl,
      key,
    });
  } catch (error) {
    console.error("Error in GET /api/aws:", error);
    return NextResponse.json(
      { error: `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}