'use client';

import { FileUpload } from '@/components/file-upload';
import Layout from '@/components/layout';
import PageContent from '@/components/page-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DocumentViewer from '@/components/ui/document-viewer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { extractFileExtension, getFileTypeDisplay, getFileTypeIcon } from '@/lib/file-utils';
import { Download, Eye, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Type for document
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  url?: string;
  key?: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; id: string; isOpen: boolean } | null>(null);

  // Fetch documents on page load
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/documents');

        if (!response.ok) {
          console.error('Failed to fetch documents:', response.status, response.statusText);

          // Try to get the error details from the response
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
            throw new Error(`Failed to fetch documents: ${errorData.error || response.statusText}`);
          } catch (jsonError) {
            throw new Error(`Failed to fetch documents: ${response.statusText}`);
          }
        }

        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
          // Transform DB documents to our display format
          const formattedDocs = data.documents.map((doc: any) => {
            // Extract file extension properly
            const fileExt = extractFileExtension(doc.documentFilePath);

            return {
              id: doc.id,
              name: doc.title,
              // Get user-friendly file type display
              type: getFileTypeDisplay(fileExt),
              // Format file size if available
              size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
              modified: new Date(doc.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              url: doc.documentFilePath,
            };
          });

          setDocs(formattedDocs);
        } else {
          // Set empty array if no documents
          setDocs([]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load documents');
        setDocs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  // Add a new document to the list and save to database
  const handleUploadComplete = async (fileData: any) => {
    try {
      // Calculate file size in bytes
      const fileSizeBytes = fileData.size;
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

      console.log('File size before sending to API:', {
        rawSize: fileData.size,
        fileSizeBytes,
        fileSizeMB,
      });

      // Get file extension from MIME type or filename
      let fileExt = '';
      if (fileData.type && fileData.type.includes('/')) {
        fileExt = fileData.type.split('/')[1]; // From MIME type
      } else {
        fileExt = extractFileExtension(fileData.fileName); // From filename
      }

      // First create a new document object for the UI
      const newDocument: Document = {
        id: Date.now().toString(), // Temporary ID until we get the real one
        name: fileData.fileName,
        // Use the file type helper function with properly extracted extension
        type: getFileTypeDisplay(fileExt),
        size: `${fileSizeMB} MB`,
        modified: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        url: fileData.url,
        key: fileData.key,
      };

      // Add to UI immediately for better UX
      setDocs([newDocument, ...docs]);

      // Now save to database
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: fileData.fileName,
          description: `Uploaded on ${new Date().toLocaleString()}`,
          documentFilePath: fileData.url,
          documentFileHash: fileData.etag, // S3 ETag can be used as a file hash
          size: fileSizeBytes, // Send the raw size in bytes to the server
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document to database');
      }

      // Get the actual document with DB ID
      const savedDoc = await response.json();

      // Update the document in our list with the real ID
      setDocs((prevDocs) => prevDocs.map((doc) => (doc.id === newDocument.id ? { ...doc, id: savedDoc.document.id } : doc)));

      setErrorMessage(null);
    } catch (error) {
      console.error('Error saving document:', error);
      setErrorMessage('Document uploaded but failed to save to database. Please try again.');
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    // Clear error message after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handlePreview = async (doc: Document) => {
    try {
      // Open the document viewer passing both URL and ID
      setPreviewDoc({
        url: doc.url || '',
        id: doc.id,
        isOpen: true,
      });

      // Clear any error messages
      setErrorMessage(null);
    } catch (error) {
      console.error('Preview error:', error);
      setErrorMessage('Failed to preview document. Please try again later.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
  };

  // Function to trigger file download
  const downloadFile = (url: string, fileName: string) => {
    // We'll use our server as a proxy to bypass CORS restrictions
    setErrorMessage('Starting download...');

    // Extract document key from URL for the proxy request
    const docKey = extractDocumentKeyFromUrl(url);

    if (!docKey) {
      setErrorMessage('Invalid document URL');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Create a link to our proxy endpoint
    const proxyUrl = `/api/documents/download/stream?key=${encodeURIComponent(docKey)}`;

    // Create and trigger the download link
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = fileName;
    a.target = '_blank'; // Fallback to new tab if download doesn't work
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clear the message after a brief period
    setTimeout(() => setErrorMessage(null), 2000);
  };

  // Helper function to extract document key from S3 URL
  const extractDocumentKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Get the path without leading slash
      const path = urlObj.pathname.substring(1);
      return path;
    } catch (error) {
      console.error('Error extracting document key:', error);
      return null;
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      // Show loading state
      setErrorMessage('Preparing download...');

      // Get a fresh download URL from our API
      const response = await fetch(`/api/documents/download?id=${doc.id}`);

      if (!response.ok) {
        throw new Error(`Failed to prepare download: ${response.statusText}`);
      }

      // Get the document data with fresh URL
      const data = await response.json();

      if (!data.url) {
        throw new Error('No download URL returned');
      }

      // Trigger download using our helper function
      downloadFile(data.url, doc.name);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage('Failed to download document. Please try again later.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <Layout>
      <PageContent title='Documents' description='Manage your documents and files'>
        {previewDoc && <DocumentViewer documentUrl={previewDoc.url} documentId={previewDoc.id} isOpen={previewDoc.isOpen} onClose={handleClosePreview} />}

        <div className='mb-4 flex items-center justify-between'>
          <FileUpload onUploadComplete={handleUploadComplete} onError={handleError} />
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
                <p className='text-zinc-500'>Loading documents...</p>
              </div>
            ) : docs.length === 0 ? (
              <div className='flex justify-center items-center p-8'>
                <p className='text-zinc-500'>No documents found. Upload a document to get started.</p>
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
                  {docs.map((doc) => (
                    <TableRow key={doc.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
                      <TableCell className='font-medium'>{doc.name}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {(() => {
                            const iconData = getFileTypeIcon(doc.type);
                            return iconData.image ? (
                              <Image src={iconData.image} alt={doc.type} width={16} height={16} className={iconData.className} />
                            ) : iconData.icon ? (
                              <iconData.icon className={iconData.className} />
                            ) : null;
                          })()}
                          {doc.type}
                        </div>
                      </TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>{doc.modified}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            onClick={() => handlePreview(doc)}
                          >
                            <Eye className='h-4 w-4' />
                            <span className='sr-only'>View</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className='h-4 w-4' />
                            <span className='sr-only'>Download</span>
                          </Button>
                          <Button variant='ghost' size='sm' className='h-8 w-8 p-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'>
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>More</span>
                          </Button>
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
    </Layout>
  );
}
