export interface UploadResult {
  success: boolean;
  key?: string;
  downloadUrl?: string;
  error?: string;
  originalName?: string;
  isZip?: boolean;
  fileCount?: number;
}

export async function uploadToS3(
  files: File | FileList,
  folderPath?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> {
  try {
    // Convert single file to array for consistent handling
    const fileArray = files instanceof FileList ? Array.from(files) : [files];
    const results: UploadResult[] = [];
    const totalFiles = fileArray.length;

    console.log(`Starting upload of ${totalFiles} files`, { folderPath });

    for (let i = 0; i < totalFiles; i++) {
      const file = fileArray[i];
      const progress = ((i + 1) / totalFiles) * 100;
      
      console.log(`Uploading file ${i + 1}/${totalFiles}: ${file.name} (${file.size} bytes)`);
      
      if (onProgress) {
        onProgress(progress);
      }

      // Step 1: Get presigned URL from our API
      console.log('Step 1: Getting presigned URL...');
      console.log('Making request to:', '/api/aws');
      console.log('Request body:', {
        fileName: file.name,
        fileType: file.type,
        folderPath,
      });
      
      let response;
      try {
        response = await fetch(`${window.location.origin}/api/aws`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            folderPath,
          }),
        });
      } catch (fetchError) {
        console.error('Fetch error details:', {
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        results.push({
          success: false,
          error: `Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        });
        continue;
      }

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        console.error('API Error:', errorData);
        results.push({
          success: false,
          error: errorData.error || 'Failed to get upload URL',
        });
        continue;
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        console.error('Failed to parse API response');
        results.push({
          success: false,
          error: 'Invalid API response format',
        });
        continue;
      }

      const { uploadUrl, key } = responseData;
      console.log('Got presigned URL:', { key, uploadUrl: uploadUrl.substring(0, 50) + '...' });

      // Step 2: Upload file directly to S3 using presigned URL
      console.log('Step 2: Uploading to S3...');
      console.log('S3 Upload URL:', uploadUrl.substring(0, 100) + '...');
      
      let uploadResponse;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
      } catch (uploadFetchError) {
        console.error('S3 Upload fetch error:', uploadFetchError);
        results.push({
          success: false,
          error: `S3 upload network error: ${uploadFetchError instanceof Error ? uploadFetchError.message : String(uploadFetchError)}`,
        });
        continue;
      }

      console.log('S3 Upload Response status:', uploadResponse.status);
      console.log('S3 Upload Response ok:', uploadResponse.ok);

      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        console.error('S3 Upload Error:', uploadErrorText);
        results.push({
          success: false,
          error: `Failed to upload file to S3: ${uploadResponse.status} ${uploadResponse.statusText}`,
        });
        continue;
      }

      // Step 3: Get download URL
      console.log('Step 3: Getting download URL...');
      const downloadUrlPath = `/api/aws?key=${encodeURIComponent(key)}`;
      console.log('Download URL request path:', downloadUrlPath);
      
      let downloadResponse;
      try {
        downloadResponse = await fetch(`${window.location.origin}${downloadUrlPath}`);
      } catch (downloadFetchError) {
        console.error('Download URL fetch error:', downloadFetchError);
        results.push({
          success: false,
          error: `Download URL network error: ${downloadFetchError instanceof Error ? downloadFetchError.message : String(downloadFetchError)}`,
        });
        continue;
      }
      
      console.log('Download URL Response status:', downloadResponse.status);
      console.log('Download URL Response ok:', downloadResponse.ok);

      if (!downloadResponse.ok) {
        let downloadErrorData;
        try {
          downloadErrorData = await downloadResponse.json();
        } catch {
          const errorText = await downloadResponse.text();
          downloadErrorData = { error: `HTTP ${downloadResponse.status}: ${errorText}` };
        }
        console.error('Download URL Error:', downloadErrorData);
        results.push({
          success: false,
          error: 'Failed to get download URL',
        });
        continue;
      }

      let downloadData;
      try {
        downloadData = await downloadResponse.json();
      } catch {
        console.error('Failed to parse download response');
        results.push({
          success: false,
          error: 'Invalid download response format',
        });
        continue;
      }

      const { downloadUrl } = downloadData;
      console.log('Got download URL:', downloadUrl.substring(0, 50) + '...');

      results.push({
        success: true,
        key,
        downloadUrl,
      });

      console.log(`File ${file.name} uploaded successfully!`);

      // Add a small delay to avoid overwhelming the API (only for multiple files)
      if (fileArray.length > 1 && i < totalFiles - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('Upload process completed. Results:', results);
    return results;
  } catch (error) {
    console.error('Upload error:', error);
    return [{
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }];
  }
} 

export async function uploadToS3Server(
  files: File | FileList,
  folderPath?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> {
  try {
    // Convert single file to array for consistent handling
    const fileArray = files instanceof FileList ? Array.from(files) : [files];
    const results: UploadResult[] = [];
    const totalFiles = fileArray.length;

    console.log(`Starting server upload of ${totalFiles} files`, { folderPath });

    // Upload all files first
    for (let i = 0; i < totalFiles; i++) {
      const file = fileArray[i];
      const progress = ((i + 1) / totalFiles) * 100;
      
      console.log(`Uploading file ${i + 1}/${totalFiles}: ${file.name} (${file.size} bytes)`);
      
      if (onProgress) {
        onProgress(progress);
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      if (folderPath) {
        formData.append('folderPath', folderPath);
      }

      // Upload through server
      const response = await fetch(`${window.location.origin}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('Server upload response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        console.error('Server upload error:', errorData);
        results.push({
          success: false,
          error: errorData.error || 'Failed to upload file',
        });
        continue;
      }

      const responseData = await response.json();
      console.log('Server upload success:', responseData);

      results.push({
        success: true,
        key: responseData.key,
        downloadUrl: responseData.downloadUrl,
        originalName: responseData.originalName,
      });

      // Add a small delay to avoid overwhelming the server (only for multiple files)
      if (fileArray.length > 1 && i < totalFiles - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // If multiple files were uploaded successfully, create a single download URL
    if (totalFiles > 1 && results.every(r => r.success)) {
      console.log('Creating single download URL for multiple files');
      
      const keys = results.map(r => r.key).filter(Boolean);
      const folderName = folderPath || `files-${Date.now()}`;
      
      const zipResponse = await fetch(`${window.location.origin}/api/download-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys,
          folderName,
        }),
      });

      if (zipResponse.ok) {
        const zipData = await zipResponse.json();
        console.log('Zip download created:', zipData);
        
        // Return single result with zip download URL
        return [{
          success: true,
          key: zipData.zipKey,
          downloadUrl: zipData.downloadUrl,
          originalName: `${folderName}.zip`,
          isZip: true,
          fileCount: zipData.fileCount,
        }];
      } else {
        console.error('Failed to create zip download');
        // Fall back to individual download URLs
        return results;
      }
    }

    console.log('Upload process completed. Results:', results);
    return results;
  } catch (error) {
    console.error('Server upload error:', error);
    return [{
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }];
  }
} 