'use client';

import { toast } from 'sonner';
import { FileUpload } from '@/components/file-upload';
import AppShell from '@/components/app-shell';
import PageContent from '@/components/page-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DocumentViewer from '@/components/ui/document-viewer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { extractFileExtension, getFileTypeDisplay, getFileTypeIcon } from '@/lib/file-utils';
import { Download, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Template {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  url?: string;
  key?: string;
}

interface FileData {
  url: string;
  name: string;
  file_type: string;
  size?: number;
}

const isValidFileType = (fileType: string): boolean => {
  const validMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/tiff',
  ];

  const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];

  // Check both MIME type and file extension
  return validMimeTypes.includes(fileType.toLowerCase()) || validExtensions.includes(fileType.toLowerCase());
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; id: string; isOpen: boolean } | null>(null);

  // Fetch templates on page load
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/templates');

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.templates && data.templates.length > 0) {
        const formattedTemplates = data.templates.map((template: any) => {
          const fileExt = extractFileExtension(template.templateFilePath);
          const displayType = getFileTypeDisplay(fileExt);

          return {
            id: template.id,
            name: template.name,
            type: displayType,
            size: 'N/A',
            modified: new Date(template.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            url: template.templateFilePath,
          };
        });

        setTemplates(formattedTemplates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template upload
  const handleUploadComplete = async (fileData: FileData) => {
    try {
      // Get both MIME type and extension
      const mimeType = fileData.file_type;
      const fileExt = extractFileExtension(fileData.name);

      if (!isValidFileType(mimeType) && !isValidFileType(fileExt)) {
        throw new Error('Unsupported file type. Please upload Word, Excel, PowerPoint, PDF, TIFF, JPG, or PNG files only.');
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileData.name,
          file_url: fileData.url,
          file_type: mimeType || fileExt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template to database');
      }

      await fetchTemplates();
      toast.success('Template uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload template');
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handlePreview = async (template: Template) => {
    try {
      setPreviewDoc({
        url: template.url || '',
        id: template.id,
        isOpen: true,
      });
      setErrorMessage(null);
    } catch (error) {
      console.error('Preview error:', error);
      setErrorMessage('Failed to preview template. Please try again later.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
  };

  // Helper function to extract template key from URL
  const extractTemplateKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1);
      return path;
    } catch (error) {
      console.error('Error extracting template key:', error);
      return null;
    }
  };

  // Function to trigger file download
  const downloadFile = (url: string, fileName: string) => {
    setErrorMessage('Starting download...');

    const templateKey = extractTemplateKeyFromUrl(url);

    if (!templateKey) {
      setErrorMessage('Invalid template URL');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const proxyUrl = `/api/templates/download/stream?key=${encodeURIComponent(templateKey)}`;

    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setErrorMessage(null), 2000);
  };

  const handleDownload = async (template: Template) => {
    try {
      setErrorMessage('Preparing download...');

      const response = await fetch(`/api/templates/download?id=${template.id}`);

      if (!response.ok) {
        throw new Error(`Failed to prepare download: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No download URL returned');
      }

      downloadFile(data.url, template.name);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage('Failed to download template. Please try again later.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleDelete = async (template: Template) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this template?');

      if (!confirmed) {
        return;
      }

      setErrorMessage('Deleting template...');

      const response = await fetch(`/api/templates/delete?id=${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Remove template from state
      setTemplates(templates.filter((t) => t.id !== template.id));
      setErrorMessage('Template deleted successfully');
      setTimeout(() => setErrorMessage(null), 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('Failed to delete template. Please try again later.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <AppShell>
      <PageContent title='Templates' description='Manage your document templates'>
        {previewDoc && (
          <DocumentViewer documentUrl={previewDoc.url} documentId={previewDoc.id} isOpen={previewDoc.isOpen} onClose={handleClosePreview} preview={true} />
        )}

        <div className='mb-4 flex items-center justify-between'>
          <FileUpload onUploadComplete={handleUploadComplete} onError={setErrorMessage} />
        </div>

        {errorMessage && (
          <div className='mb-4 rounded-md bg-red-50 py-4 dark:bg-red-900/30'>
            <div className='flex'>
              <div className='text-sm text-red-700 dark:text-red-200'>{errorMessage}</div>
            </div>
          </div>
        )}

        <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex justify-center items-center p-8'>
                <p className='text-zinc-500'>Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className='flex justify-center items-center p-8'>
                <p className='text-zinc-500'>No templates found. Upload a template to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
                      <TableCell className='font-medium'>{template.name}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {(() => {
                            const iconData = getFileTypeIcon(template.type);
                            return iconData.image ? (
                              <Image src={iconData.image} alt={template.type} width={16} height={16} className={iconData.className} />
                            ) : iconData.icon ? (
                              <iconData.icon className={iconData.className} />
                            ) : null;
                          })()}
                          {template.type}
                        </div>
                      </TableCell>
                      <TableCell>{template.size}</TableCell>
                      <TableCell>{template.modified}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className='h-4 w-4' />
                            <span className='sr-only'>View</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            onClick={() => handleDownload(template)}
                          >
                            <Download className='h-4 w-4' />
                            <span className='sr-only'>Download</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'>
                                <MoreHorizontal className='h-4 w-4' />
                                <span className='sr-only'>More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='z-50 bg-white border border-zinc-200 shadow-lg dark:bg-zinc-800 dark:border-zinc-700'>
                              <DropdownMenuItem
                                onClick={() => handleDelete(template)}
                                className='text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex justify-end'
                              >
                                <Trash2 className='h-4 w-4 mr-2' />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </AppShell>
  );
}
