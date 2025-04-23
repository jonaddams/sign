'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';
import { Card, CardContent } from '@/components/ui/card';
import { Signature, CalendarDays, Edit } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DraggableFieldProps {
  icon: React.ReactNode;
  label: string;
  type: string;
}

const DraggableField = ({ icon, label, type }: DraggableFieldProps) => {
  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('fieldType', type);
  };

  return (
    <div
      className='flex items-center p-3 mb-3 rounded-md bg-white border border-gray-200 cursor-move hover:border-blue-500 hover:shadow-sm dark:bg-zinc-800 dark:border-zinc-700'
      draggable
      onDragStart={handleDragStart}
    >
      <div className='mr-3 text-blue-500'>{icon}</div>
      <span className='text-sm font-medium'>{label}</span>
    </div>
  );
};

export default function FieldPlacement() {
  const { state, dispatch } = useDocumentFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Set up document viewer when component mounts
  useEffect(() => {
    if (!state.document.url) {
      setError('No document selected. Please go back and select a document.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Extract key from URL - similar to document-viewer.tsx
      let docKey: string;
      try {
        if (state.document.url.startsWith('http')) {
          const urlObj = new URL(state.document.url);
          docKey = urlObj.pathname.substring(1);
        } else {
          docKey = state.document.url;
        }
        console.log('Extracted document key:', docKey);
      } catch (error) {
        console.error('Error parsing document URL:', error);
        throw new Error('Invalid document URL');
      }

      // Create proxy URL
      const proxyEndpoint = `/api/documents/proxy?key=${encodeURIComponent(docKey)}&proxy=true`;
      console.log('Proxy endpoint created:', proxyEndpoint);
      setProxyUrl(proxyEndpoint);
    } catch (error) {
      console.error('Error preparing document URL:', error);
      setError('Failed to prepare document for viewing');
    } finally {
      setIsLoading(false);
    }

    return () => {
      // Cleanup viewer when component unmounts
      if (containerRef.current && window.NutrientViewer && isViewerLoaded) {
        console.log('Unloading NutrientViewer');
        window.NutrientViewer.unload(containerRef.current);
        setIsViewerLoaded(false);
      }
    };
  }, [state.document.url]);

  // Load the Nutrient Viewer SDK with the document
  useEffect(() => {
    if (mounted && containerRef.current && proxyUrl) {
      const container = containerRef.current;
      console.log('Loading viewer with proxy URL:', proxyUrl);

      // Define toolbar items
      const toolBarItems = [
        { type: 'sidebar-thumbnails' },
        { type: 'sidebar-document-outline' },
        { type: 'pager' },
        { type: 'pan' },
        { type: 'zoom-out' },
        { type: 'zoom-in' },
        { type: 'zoom-mode' },
        { type: 'spacer' },
      ];

      // Check if NutrientViewer is available
      if (window.NutrientViewer) {
        try {
          window.NutrientViewer.load({
            container,
            document: proxyUrl,
            toolbarItems: toolBarItems,
            licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
          });
          setIsViewerLoaded(true);
          setIsLoading(false);
          console.log('NutrientViewer loaded successfully');
        } catch (error) {
          console.error('Error loading document viewer:', error);
          setError('Failed to load document viewer');
          setIsLoading(false);
        }
      } else {
        console.error('NutrientViewer SDK not loaded');
        setError('Document viewer not available');
        setIsLoading(false);
      }
    }
  }, [proxyUrl, mounted]);

  // Handle drop on the viewer
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType');

    // Get coordinates relative to the viewer
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log(`Dropped field type: ${fieldType} at position: x=${x}, y=${y}`);

    // Here you would normally call the Nutrient SDK API to place an annotation
    // For now, we'll just log it
    alert(`Added ${fieldType} field at x=${Math.round(x)}, y=${Math.round(y)}`);
  };

  // Allow dropping
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold tracking-tight'>Field Placement</h2>
        <p className='text-muted-foreground mt-2 text-sm'>Drag and drop fields onto the document where you want recipients to sign.</p>
      </div>

      <div className='flex gap-6 h-[calc(100vh-250px)] min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden'>
        {/* Left sidebar with draggable fields */}
        <div className='w-64 shrink-0'>
          <Card>
            <CardContent className='pt-6'>
              <h3 className='font-medium mb-4'>Available Fields</h3>
              <div className='space-y-2'>
                <DraggableField icon={<Signature className='h-5 w-5' />} label='Signature' type='signature' />
                <DraggableField icon={<Edit className='h-5 w-5' />} label='Initials' type='initials' />
                <DraggableField icon={<CalendarDays className='h-5 w-5' />} label='Date Signed' type='date' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document viewer */}
        <div className='flex-1 relative border-l border-gray-200 dark:border-gray-700'>
          <Card className='h-full'>
            <CardContent className='p-0 h-full'>
              {isLoading && (
                <div className='absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80 z-10'>
                  <div className='text-zinc-700 dark:text-zinc-300 text-lg font-medium'>Loading document...</div>
                </div>
              )}

              {error && (
                <div className='absolute inset-0 flex items-center justify-center bg-red-100/10 dark:bg-red-900/10 z-10'>
                  <div className='text-red-700 dark:text-red-300 p-6 rounded-md bg-white dark:bg-zinc-800 shadow-lg'>{error}</div>
                </div>
              )}

              <div
                id='nutrient-viewer-container'
                ref={containerRef}
                className='h-full w-full'
                style={{ minHeight: '500px' }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
