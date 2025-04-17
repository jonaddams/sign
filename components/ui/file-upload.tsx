"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

// Valid file types
const VALID_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/tiff",
  "image/jpeg",
];

const VALID_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".png",
  ".tiff",
  ".jpg",
  ".jpeg",
];

// Max file size (200MB in bytes)
const MAX_FILE_SIZE = 200 * 1024 * 1024;

interface FileUploadProps {
  onUploadComplete: (fileData: {
    url: string;
    name: string;
    file_type: string;
    size?: number;
  }) => void;
  onError?: (message: string) => void;
  saveAsTemplate?: boolean;
  onSaveAsTemplateChange?: (checked: boolean) => void;
}

export function FileUpload({
  onUploadComplete,
  onError,
  saveAsTemplate = false,
  onSaveAsTemplateChange,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    url: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension =
        "." + selectedFile.name.split(".").pop()?.toLowerCase();

      // Check both MIME type and file extension
      if (
        !VALID_FILE_TYPES.includes(selectedFile.type) &&
        !VALID_EXTENSIONS.includes(fileExtension)
      ) {
        onError?.("Invalid file type. Please select a valid document format.");
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        onError?.("File size exceeds the 200MB limit.");
        return;
      }

      // Reset uploaded file state if selecting a new file
      setUploadedFile(null);
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError?.("No file selected. Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setProgress(0);

    try {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (!response.url) {
              throw new Error("Upload successful but no URL returned");
            }
            // Normalize file type for consistency
            const fileType =
              file.type || `image/${file.name.split(".").pop()?.toLowerCase()}`;

            // Save the uploaded file info for display
            setUploadedFile({
              name: file.name,
              size: file.size,
              url: response.url,
            });

            onUploadComplete({
              url: response.url,
              name: file.name,
              file_type: fileType,
              size: file.size,
            });

            // Keep reference to uploaded file, but clear the input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            setFile(null);
          } catch (e) {
            console.error("Response parsing error:", e, xhr.responseText);
            onError?.(
              `Upload failed: ${e instanceof Error ? e.message : "Invalid server response"}`,
            );
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            onError?.(response.error || "Upload failed");
          } catch (e) {
            onError?.(`Upload failed: ${xhr.statusText}`);
          }
        }
        setUploading(false);
      };

      xhr.onerror = function () {
        onError?.("Network error occurred during upload.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading file:", error);
      onError?.("An unexpected error occurred.");
      setUploading(false);
    }
  };

  const resetFileState = () => {
    setFile(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    if (file) {
      handleUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  const selectNewFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={VALID_FILE_TYPES.join(",")}
      />

      <div
        className={`flex items-center gap-2 ${isMobile ? "w-full justify-center" : ""}`}
      >
        {!uploadedFile ? (
          <>
            <Button
              type="button"
              onClick={handleButtonClick}
              disabled={uploading}
              variant={file ? "default" : "outline"}
              className={`flex cursor-pointer items-center gap-2 ${isMobile && !file ? "w-full justify-center md:w-auto" : ""}`}
            >
              {file ? (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Now
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>

            {file && !uploading && (
              <Button
                type="button"
                onClick={resetFileState}
                variant="destructive"
                className="cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </>
        ) : (
          <Button
            type="button"
            onClick={selectNewFile}
            variant="outline"
            className="flex cursor-pointer items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Select Different Document
          </Button>
        )}
      </div>

      {file && !uploading && !uploadedFile && (
        <>
          <div className="mt-2 text-sm text-zinc-500">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>

          {/* Save as template checkbox shown as soon as file is selected */}
          {onSaveAsTemplateChange && (
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="save-template"
                checked={saveAsTemplate}
                onCheckedChange={onSaveAsTemplateChange}
              />
              <Label htmlFor="save-template">
                Save as template for future use
              </Label>
            </div>
          )}
        </>
      )}

      {uploadedFile && (
        <>
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">
                File successfully uploaded
              </span>
            </div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {uploadedFile.name} (
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
            {onSaveAsTemplateChange && (
              <div className="mt-3 flex items-center space-x-2">
                <Checkbox
                  id="save-template"
                  checked={saveAsTemplate}
                  onCheckedChange={onSaveAsTemplateChange}
                />
                <Label htmlFor="save-template">
                  Save as template for future use
                </Label>
              </div>
            )}
          </div>
        </>
      )}

      {uploading && (
        <div className="mt-2">
          <Progress value={progress} className="h-2 w-full" />
          <p className="mt-1 text-xs text-zinc-500">Uploading: {progress}%</p>
        </div>
      )}
    </div>
  );
}
