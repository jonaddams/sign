'use client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

// Valid file types
const VALID_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/tiff',
  'image/jpeg',
];

const VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.tiff', '.jpg', '.jpeg'];

// Max file size (200MB in bytes)
const MAX_FILE_SIZE = 200 * 1024 * 1024;

interface FileUploadProps {
  onUploadComplete: (fileData: { url: string; name: string; file_type: string; size?: number }) => void;
  onError?: (message: string) => void;
}

export function FileUpload({ onUploadComplete, onError }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

      // Check both MIME type and file extension
      if (!VALID_FILE_TYPES.includes(selectedFile.type) && !VALID_EXTENSIONS.includes(fileExtension)) {
        onError?.('Invalid file type. Please select a valid document format.');
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        onError?.('File size exceeds the 200MB limit.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError?.('No file selected. Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProgress(0);

    try {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (!response.url) {
              throw new Error('Upload successful but no URL returned');
            }
            // Normalize file type for consistency
            const fileType = file.type || `image/${file.name.split('.').pop()?.toLowerCase()}`;
            onUploadComplete({
              url: response.url,
              name: file.name,
              file_type: fileType,
            });
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (e) {
            console.error('Response parsing error:', e, xhr.responseText);
            onError?.(`Upload failed: ${e instanceof Error ? e.message : 'Invalid server response'}`);
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            onError?.(response.error || 'Upload failed');
          } catch (e) {
            onError?.(`Upload failed: ${xhr.statusText}`);
          }
        }
        setUploading(false);
      };

      xhr.onerror = function () {
        onError?.('Network error occurred during upload.');
        setUploading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading file:', error);
      onError?.('An unexpected error occurred.');
      setUploading(false);
    }
  };

  const resetFileState = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (file) {
      handleUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className='flex flex-col'>
      <input type='file' ref={fileInputRef} onChange={handleFileChange} className='hidden' accept={VALID_FILE_TYPES.join(',')} />

      <div className='flex items-center gap-2'>
        <Button
          type='button'
          onClick={handleButtonClick}
          disabled={uploading}
          variant={file ? 'default' : 'outline'}
          className='cursor-pointer flex items-center gap-2'
        >
          {file ? (
            <>
              <Upload className='h-4 w-4' />
              Upload Now
            </>
          ) : (
            <>
              <FileText className='h-4 w-4' />
              Upload Document
            </>
          )}
        </Button>

        {file && !uploading && (
          <Button type='button' onClick={resetFileState} variant='destructive' className='cursor-pointer'>
            Cancel
          </Button>
        )}
      </div>

      {file && !uploading && (
        <div className='mt-2 text-sm text-zinc-500'>
          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}

      {uploading && (
        <div className='mt-2'>
          <Progress value={progress} className='h-2 w-full' />
          <p className='mt-1 text-xs text-zinc-500'>Uploading: {progress}%</p>
        </div>
      )}
    </div>
  );
}
