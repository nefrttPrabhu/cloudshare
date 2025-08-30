"use client";

import { useCallback, useRef, useState } from "react";
import { TiPlus } from "react-icons/ti";
import { uploadToS3Server } from "@/utils/upload";
import { useToast } from "./ToastContainer";

export default function Hero() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<
        Array<{
            name: string;
            url: string;
            isZip?: boolean;
            fileCount?: number;
        }>
    >([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { showToast } = useToast();

    const handleUpload = async (files: FileList, folderPath?: string) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            console.log("Starting upload process...");
            const results = await uploadToS3Server(
                files,
                folderPath,
                (progress) => {
                    setUploadProgress(progress);
                },
            );

            console.log("Upload results:", results);

            const successfulUploads = results
                .filter((result) => result.success && result.downloadUrl)
                .map((result, index) => ({
                    name: result.isZip
                        ? `${result.originalName} (${result.fileCount} files)`
                        : files[index].name,
                    url: result.downloadUrl!,
                    isZip: result.isZip || false,
                    fileCount: result.fileCount,
                }));

            const failedUploads = results.filter((result) => !result.success);

            setUploadedFiles((prev) => [...prev, ...successfulUploads]);

            // Show success toast for successful uploads
            if (successfulUploads.length > 0) {
                showToast({
                    message: `Successfully uploaded ${successfulUploads.length} file${successfulUploads.length > 1 ? 's' : ''}`,
                    type: "success"
                });
            }

            if (failedUploads.length > 0) {
                const errorMessages = failedUploads.map((result) =>
                    result.error
                ).join(", ");
                setError(`Upload failed: ${errorMessages}`);
                console.error("Failed uploads:", failedUploads);
                
                // Show error toast for failed uploads
                showToast({
                    message: `Failed to upload ${failedUploads.length} file${failedUploads.length > 1 ? 's' : ''}`,
                    type: "error"
                });
            }
        } catch (err) {
            console.error("Upload error:", err);
            const errorMessage = `Upload failed: ${
                err instanceof Error ? err.message : "Unknown error"
            }`;
            setError(errorMessage);
            
            // Show error toast for general upload errors
            showToast({
                message: errorMessage,
                type: "error"
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setSelectedFiles(null);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setSelectedFiles(e.target.files);
        setError(null);
    };

    const handleStartUpload = () => {
        if (!selectedFiles) return;

        const folderPath = selectedFiles.length > 1
            ? `folder-${Date.now()}`
            : undefined;
        handleUpload(selectedFiles, folderPath);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        setSelectedFiles(e.dataTransfer.files);
        setError(null);
    }, []);

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url)
            .then(() => {
                showToast({
                    message: "Link copied to clipboard",
                    type: "success"
                });
            })
            .catch(() => {
                showToast({
                    message: "Failed to copy link",
                    type: "error"
                });
            });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const clearSelection = () => {
        setSelectedFiles(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="mt-20 flex flex-col items-center justify-center px-4">
            <div className="max-w-4xl w-full">
                {/* Upload Area */}
                <div
                    className={`h-[40vh] w-full border-3 border-dashed rounded-lg flex flex-col items-center justify-center p-8 transition-all duration-200 ${
                        isDragOver ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isUploading
                        ? (
                            <div className="text-center">
                                <div className="mb-4">
                                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto">
                                    </div>
                                </div>
                                <p className="text-lg mb-2">Uploading...</p>
                                <div className="w-64 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                    </div>
                                </div>
                                <p className="text-sm mt-2">
                                    {Math.round(uploadProgress)}%
                                </p>
                            </div>
                        )
                        : selectedFiles
                        ? (
                            <div className="text-center w-full">
                                <h3 className="text-lg font-semibold mb-4">
                                    {selectedFiles.length === 1
                                        ? "Selected File"
                                        : `Selected Files (${selectedFiles.length})`}
                                </h3>
                                <div className="max-h-32 overflow-y-auto mb-4">
                                    {Array.from(selectedFiles).map((
                                        file,
                                        index,
                                    ) => (
                                        <div
                                            key={index}
                                            className="text-sm text-gray-600 mb-1"
                                        >
                                            {file.name}{" "}
                                            ({formatFileSize(file.size)})
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleStartUpload}
                                        className="px-6 py-2 border border-dashed text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Upload Files
                                    </button>
                                    <button
                                        onClick={clearSelection}
                                        className="px-6 py-2 text-white rounded-lg hover:bg-red-500 hover:border hover:border-dashed transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )
                        : (
                            <>
                                <div className="text-center mb-6">
                                    <div
                                        onClick={() =>
                                            fileInputRef.current?.click()}
                                        className="border rounded-full p-10 cursor-pointer hover:bg-gray-200 hover:text-black inline-block mb-4"
                                    >
                                        <TiPlus size={35} />
                                    </div>
                                    <p className="text-lg mb-2">
                                        Drop files here or click to upload
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Select single or multiple files
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        fileInputRef.current?.click()}
                                    className="px-6 py-2 border border-dashed cursor-pointer text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Choose Files
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                            </>
                        )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">
                            Uploaded Files
                        </h3>
                        <div className="space-y-2">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border border-dashed rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {file.isZip
                                                ? `Zip file containing ${file.fileCount} files`
                                                : "Click download to save file"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={file.url}
                                            download
                                            className="px-4 py-2 border border-dashed text-white rounded-lg hover:bg-green-600 transition-colors"
                                        >
                                            Download
                                        </a>
                                        <button
                                            onClick={() =>
                                                handleCopyLink(file.url)}
                                            className="px-4 py-2 border border-dashed cursor-pointer text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
