'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';
import { Card, CardContent } from '@/components/ui/card';
import { Signature, CalendarDays, Edit } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

function closestByClass(el: any, className: string): any {
  return el && el.classList && el.classList.contains(className) ? el : el ? closestByClass(el.parentNode, className) : null;
}

interface FieldOptionProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  compact?: boolean;
}

const FieldOption = ({ icon, label, type, compact = false }: FieldOptionProps) => {
  // Handle drag start to set the field type data
  const handleDragStart = (e: React.DragEvent) => {
    console.log('Started dragging field:', type);
    e.dataTransfer.setData('fieldType', type);
  };

  if (compact) {
    return (
      <div
        className='flex flex-col items-center p-2 rounded-md bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 cursor-move'
        draggable
        onDragStart={handleDragStart}
      >
        <div className='text-blue-500 mb-1'>{icon}</div>
        <span className='text-xs font-medium'>{label}</span>
      </div>
    );
  }

  return (
    <div
      className='flex items-center p-3 mb-3 rounded-md bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 cursor-move'
      draggable
      onDragStart={handleDragStart}
    >
      <div className='mr-3 text-blue-500'>{icon}</div>
      <span className='text-sm font-medium'>{label}</span>
    </div>
  );
};

export default function FieldPlacement() {
  const { state } = useDocumentFlow();
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const viewerInstanceRef = useRef<any>(null);

  // Debug state to track field placements
  const [fieldPlacements, setFieldPlacements] = useState<{ type: string; position: string }[]>([]);

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

      // Extract key from URL
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
      if (typeof window !== 'undefined' && window.NutrientViewer && isViewerLoaded) {
        console.log('Unloading NutrientViewer');
        if (desktopContainerRef.current) {
          window.NutrientViewer.unload(desktopContainerRef.current);
        }
        if (mobileContainerRef.current) {
          window.NutrientViewer.unload(mobileContainerRef.current);
        }
        setIsViewerLoaded(false);
      }
    };
  }, [state.document.url, isViewerLoaded]);

  // Load the Nutrient Viewer SDK with the document
  useEffect(() => {
    // Skip if no proxy URL or not mounted
    if (!mounted || !proxyUrl) return;

    // Get the appropriate container based on view mode
    const container = isMobile ? mobileContainerRef.current : desktopContainerRef.current;

    if (container && typeof window !== 'undefined' && window.NutrientViewer) {
      console.log(`Loading viewer in ${isMobile ? 'mobile' : 'desktop'} mode with proxy URL:`, proxyUrl);
      setIsLoading(true);

      // First, clean up any existing viewer instance
      if (isViewerLoaded) {
        console.log(`Unloading existing viewer before loading in ${isMobile ? 'mobile' : 'desktop'} mode`);
        if (desktopContainerRef.current) {
          window.NutrientViewer.unload(desktopContainerRef.current);
        }
        if (mobileContainerRef.current) {
          window.NutrientViewer.unload(mobileContainerRef.current);
        }
        setIsViewerLoaded(false);
      }

      // Define toolbar items - use a more minimal toolbar for mobile
      const toolBarItems = isMobile
        ? [{ type: 'pager' }, { type: 'pan' }, { type: 'zoom-out' }, { type: 'zoom-in' }, { type: 'spacer' }]
        : [
            { type: 'sidebar-thumbnails' },
            { type: 'sidebar-document-outline' },
            { type: 'pager' },
            { type: 'pan' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'zoom-mode' },
            { type: 'spacer' },
          ];

      try {
        console.log('Creating NutrientViewer instance');

        // Load the viewer using the same pattern as in pdf-viewer.jsx
        window.NutrientViewer.load({
          container,
          document: proxyUrl,
          toolbarItems: toolBarItems,
          licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
        })
          .then((instance: any) => {
            console.log('NutrientViewer instance loaded successfully');
            viewerInstanceRef.current = instance;

            // Setup drag and drop on content document
            console.log('Setting up drag and drop handlers');

            // Drag and drop event listeners debugging:
            instance.contentDocument.addEventListener('dragover', (event: any) => {
              // Prevent default to allow drop
              event.preventDefault();
              console.log('addEventListener dragover event detected');

              // Set the dropEffect to show it's a copy operation
              if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
              }

              // Find the page element under the cursor
              const pageElement = closestByClass(event.target, 'PSPDFKit-Page');
              if (pageElement) {
                console.log('Dragging over page element:', pageElement);
              }
            });

            instance.contentDocument.addEventListener('dragenter', (event: any) => {
              // Prevent default to allow the drag
              event.preventDefault();
              console.log('addEventListener dragenter event detected');
            });

            instance.contentDocument.addEventListener('dragleave', (event: any) => {
              console.log('addEventListener dragleave event detected');
            });

            instance.contentDocument.addEventListener('dragend', (event: any) => {
              console.log('addEventListener dragend event detected');
            });

            instance.contentDocument.addEventListener('drop', (event: any) => {
              // These are critical to make drop work
              event.preventDefault();
              event.stopPropagation();

              console.log('addEventListener drop event detected');

              // Get the field type from the dataTransfer
              const fieldType = event.dataTransfer.getData('fieldType');
              console.log('Field type from drop event:', fieldType);

              if (!fieldType) {
                console.log('No field type found in drag data');
                return;
              }

              // Find the page element
              const pageElement = closestByClass(event.target, 'PSPDFKit-Page');
              console.log('Page element at drop position:', pageElement);

              if (pageElement && window.NutrientViewer) {
                const pageIndex = parseInt(pageElement.dataset.pageIndex, 10);
                console.log('Drop on page:', pageIndex);

                try {
                  // Create a client rect at the drop position
                  const clientRect = new window.NutrientViewer.Geometry.Rect({
                    left: event.clientX,
                    top: event.clientY,
                    width: fieldType === 'initials' ? 100 : 200,
                    height: 50,
                  });

                  console.log('Client rect:', clientRect);

                  // Transform to page coordinates
                  const pageRect = instance.transformContentClientToPageSpace(clientRect, pageIndex);
                  console.log('Page rect:', pageRect);

                  // Create a unique field name
                  const fieldName = `${fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                  // Create widget annotation
                  const widget = new window.NutrientViewer.Annotations.WidgetAnnotation({
                    boundingBox: pageRect,
                    formFieldName: fieldName,
                    id: window.NutrientViewer.generateInstantId(),
                    pageIndex,
                    name: fieldName,
                  });

                  // Create the form field based on type
                  let formField;

                  if (fieldType === 'signature') {
                    formField = new window.NutrientViewer.FormFields.SignatureFormField({
                      annotationIds: new window.NutrientViewer.Immutable.List([widget.id]),
                      name: fieldName,
                    });
                  } else if (fieldType === 'initials') {
                    formField = new window.NutrientViewer.FormFields.SignatureFormField({
                      annotationIds: new window.NutrientViewer.Immutable.List([widget.id]),
                      name: fieldName,
                      type: 'INITIALS',
                    });
                  } else if (fieldType === 'date') {
                    formField = new window.NutrientViewer.FormFields.TextFormField({
                      annotationIds: new window.NutrientViewer.Immutable.List([widget.id]),
                      name: fieldName,
                      defaultValue: new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }),
                    });
                  }

                  // Set form creator mode
                  instance.setViewState((viewState: any) => viewState.set('interactionMode', window.NutrientViewer.InteractionMode.FORM_CREATOR));

                  // Create the annotations
                  if (formField) {
                    instance
                      .create([widget, formField])
                      .then(() => {
                        console.log(`Created ${fieldType} field at position (${Math.round(pageRect.left)}, ${Math.round(pageRect.top)})`);

                        // Add to our debug state for tracking
                        setFieldPlacements((prev) => [
                          ...prev,
                          {
                            type: fieldType,
                            position: `(${Math.round(pageRect.left)}, ${Math.round(pageRect.top)})`,
                          },
                        ]);
                      })
                      .catch((error: any) => {
                        console.error('Error creating form field:', error);
                      });
                  }
                } catch (error) {
                  console.error('Error in form field creation:', error);
                }
              } else {
                console.log('No page element found at drop position');
              }
            });

            setIsViewerLoaded(true);
            setIsLoading(false);

            setIsViewerLoaded(true);
            setIsLoading(false);
          })
          .catch((error: any) => {
            console.error('Error loading NutrientViewer:', error);
            setError('Failed to load document viewer');
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error loading document viewer:', error);
        setError('Failed to load document viewer');
        setIsLoading(false);
      }
    } else {
      console.error('NutrientViewer SDK not loaded or container not available');
      if (!window.NutrientViewer) {
        setError('Document viewer not available');
      }
      setIsLoading(false);
    }
  }, [proxyUrl, mounted, isMobile]);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold tracking-tight'>Field Placement</h2>
        <p className='text-muted-foreground mt-2 text-sm'>Drag fields onto the document where you want recipients to sign.</p>
      </div>

      {isMobile ? (
        // Mobile Layout - Vertical with fields at top
        <div className='flex flex-col space-y-4'>
          {/* Horizontal field selector for mobile - sticky */}
          <div className='sticky top-0 z-10'>
            <Card className='border border-gray-200 dark:border-gray-700'>
              <CardContent className='py-4'>
                <h3 className='font-medium mb-3 text-sm'>Available Fields</h3>
                <div className='grid grid-cols-3 gap-2'>
                  <FieldOption icon={<Signature className='h-4 w-4' />} label='Signature' type='signature' compact={true} />
                  <FieldOption icon={<Edit className='h-4 w-4' />} label='Initials' type='initials' compact={true} />
                  <FieldOption icon={<CalendarDays className='h-4 w-4' />} label='Date' type='date' compact={true} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document viewer for mobile - takes remaining height */}
          <Card className='border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <CardContent className='p-0 relative' style={{ height: '70vh' }}>
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

              <div id='nutrient-viewer-container-mobile' ref={mobileContainerRef} className='w-full h-full' />
            </CardContent>
          </Card>
        </div>
      ) : (
        // Desktop Layout - Horizontal with sidebar
        <div className='flex gap-6 h-[calc(100vh-250px)] min-h-[500px]'>
          {/* Left sidebar with field options */}
          <div className='w-64 shrink-0'>
            <Card>
              <CardContent className='pt-6'>
                <h3 className='font-medium mb-4'>Available Fields</h3>
                <div className='space-y-2'>
                  <FieldOption icon={<Signature className='h-5 w-5' />} label='Signature' type='signature' />
                  <FieldOption icon={<Edit className='h-5 w-5' />} label='Initials' type='initials' />
                  <FieldOption icon={<CalendarDays className='h-5 w-5' />} label='Date Signed' type='date' />
                </div>

                {/* Debug info */}
                {fieldPlacements.length > 0 && (
                  <div className='mt-6 border-t pt-4'>
                    <h4 className='text-sm font-medium mb-2'>Field Placements:</h4>
                    <div className='text-xs space-y-1'>
                      {fieldPlacements.map((field, i) => (
                        <div key={i}>
                          {field.type}: {field.position}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document viewer */}
          <div className='flex-1 relative border border-gray-200 dark:border-gray-700'>
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

                <div id='nutrient-viewer-container' ref={desktopContainerRef} className='h-full w-full' style={{ minHeight: '500px' }} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
