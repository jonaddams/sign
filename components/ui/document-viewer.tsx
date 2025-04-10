'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DocumentViewerProps {
  documentUrl: string;
  documentId: string;
  isOpen: boolean;
  preview?: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    NutrientViewer?: {
      load: (options: { container: HTMLElement; document: string; toolbarItems?: any[] }) => void;
      unload: (container: HTMLElement | null) => void;
      defaultToolbarItems?: any[];
    };
  }
}

export default function DocumentViewer({ documentUrl, documentId, isOpen, onClose, preview }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for the portal - called on every render
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Effect to create proxy URL when dialog is visible - called on every render
  useEffect(() => {
    if (isOpen) {
      try {
        setIsLoading(true);
        setError(null);

        // Extract key from URL
        let docKey: string;
        try {
          const urlObj = new URL(documentUrl);
          docKey = urlObj.pathname.substring(1);
        } catch (error) {
          console.error('Error parsing document URL:', error);
          throw new Error('Invalid document URL');
        }

        // Create proxy URL
        const proxyEndpoint = `/api/documents/proxy?key=${encodeURIComponent(docKey)}&proxy=true`;
        setProxyUrl(proxyEndpoint);

        // Update body to prevent scrolling while viewer is open
        document.body.style.overflow = 'hidden';

        // Setup cleanup
        return () => {
          // Re-enable scrolling when component unmounts
          document.body.style.overflow = '';

          // Unload viewer if it was loaded
          if (containerRef.current && window.NutrientViewer && isViewerLoaded) {
            console.log('Unloading NutrientViewer');
            window.NutrientViewer.unload(containerRef.current);
            setIsViewerLoaded(false);
          }
        };
      } catch (error) {
        console.error('Error preparing document URL:', error);
        setError('Failed to prepare document for viewing');
      } finally {
        setIsLoading(false);
      }
    }
    // This effect is always called regardless of isOpen
    return () => {}; // Empty cleanup function when not open
  }, [isOpen, documentUrl, isViewerLoaded]);

  // Effect to load viewer once we have a proxy URL - called on every render
  useEffect(() => {
    if (isOpen && mounted && containerRef.current && proxyUrl) {
      const container = containerRef.current;
      console.log('Loading viewer with proxy URL:', proxyUrl);

      let toolBarItems = preview
        ? [
            { type: 'sidebar-thumbnails' },
            { type: 'sidebar-document-outline' },
            { type: 'sidebar-annotations' },
            { type: 'sidebar-bookmarks' },
            { type: 'sidebar-signatures' },
            { type: 'sidebar-attachments' },
            { type: 'sidebar-layers' },
            { type: 'pager' },
            { type: 'pan' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'zoom-mode' },
            { type: 'spacer' },
          ]
        : (window.NutrientViewer?.defaultToolbarItems ?? []);

      // Check if NutrientViewer is available
      if (window.NutrientViewer) {
        try {
          window.NutrientViewer.load({
            container,
            document: proxyUrl,
            // toolbarItems: window.NutrientViewer.defaultToolbarItems,
            toolbarItems: toolBarItems,
          });
          setIsViewerLoaded(true);
          console.log('NutrientViewer loaded successfully');
        } catch (error) {
          console.error('Error loading document viewer:', error);
          setError('Failed to load document viewer');
        }
      } else {
        console.error('NutrientViewer SDK not loaded');
        setError('Document viewer not available');
      }
    }
    // This effect is always called regardless of conditions
    return () => {}; // Empty cleanup function when conditions aren't met
  }, [isOpen, proxyUrl, mounted]);

  // Only render portal content when mounted
  if (!mounted) return null;

  // Create portal content
  const viewerContent = isOpen ? (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70'
      onClick={() => onClose()} // Close when clicking background
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <div
        className='relative bg-white dark:bg-zinc-900 w-[95%] h-[95%] rounded-lg overflow-hidden shadow-2xl'
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        {/* More visible close button with contrasting background */}
        <div className='absolute right-4 top-4 z-[10000]'>
          <Button variant='default' size='icon' className='rounded-full h-10 w-10 bg-zinc-800 hover:bg-zinc-700 text-white shadow-lg' onClick={onClose}>
            <X className='h-5 w-5' />
          </Button>
        </div>

        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80 z-[9999]'>
            <div className='text-zinc-700 dark:text-zinc-300 text-lg font-medium'>Loading document...</div>
          </div>
        )}

        {error && (
          <div className='absolute inset-0 flex items-center justify-center bg-red-100/10 dark:bg-red-900/10 z-[9999]'>
            <div className='text-red-700 dark:text-red-300 p-6 rounded-md bg-white dark:bg-zinc-800 shadow-lg'>
              {error}
              <Button className='mt-4 w-full' variant='outline' onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        <div id='nutrient-viewer-container' ref={containerRef} className='absolute inset-0 p-2' style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  ) : null;

  // Use createPortal to mount the viewer to the document body
  return createPortal(viewerContent, document.body);
}
