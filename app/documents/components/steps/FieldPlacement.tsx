'use client';

import React, { useEffect, useRef, useState, useContext, createContext } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';
import { Card, CardContent } from '@/components/ui/card';
import { Signature, CalendarDays, Edit, ScrollText, Trash, Info, ZoomIn, Tag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import * as NutrientViewerSDK from '@nutrient-sdk/viewer';
import { getNutrientViewerRuntime, getNutrientViewer, safeUnloadViewer, safeLoadViewer, closestByClass, NutrientViewerRuntime } from '@/lib/nutrient-viewer';
import { Label } from '@/components/ui/label';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Create context for sharing form placement mode
interface FormPlacementContextType {
  formPlacementMode: boolean;
}

const FormPlacementContext = createContext<FormPlacementContextType>({
  formPlacementMode: true,
});

// Define the instance type for local use
type NutrientViewerInstance = NutrientViewerSDK.Instance;

interface FieldOptionProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  compact?: boolean;
}

// Enhanced field placement interface to store annotation name
interface FieldPlacement {
  type: string;
  position: string;
  name: string; // Store the field name to find it in the DOM
}

const FieldOption = ({ icon, label, type, compact = false }: FieldOptionProps) => {
  const { formPlacementMode } = useContext(FormPlacementContext);
  // Reference to track touch position
  const touchStartRef = useRef({ x: 0, y: 0 });
  // Ref to store the element for adding non-passive event listeners
  const elementRef = useRef<HTMLDivElement>(null);

  // For logging in Vercel deployments
  const logDragEvent = (message: string, data?: any) => {
    console.log(`[Mobile Drag] ${message}`, data ? data : '');
  };

  // Set up non-passive touch events
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Manual event listeners with { passive: false } to properly handle preventDefault
    const handleTouchMove = (e: TouchEvent) => {
      if (!formPlacementMode) return;
      e.preventDefault(); // This will work now with passive: false
      e.stopPropagation();
    };

    // Add event listener with { passive: false }
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Clean up
    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [formPlacementMode]);

  // Handle drag start to set the field type data
  const handleDragStart = (e: React.DragEvent) => {
    // Prevent dragging if not in edit mode
    if (!formPlacementMode) {
      e.preventDefault();
      return;
    }

    logDragEvent(`Started dragging field: ${type}`);
    e.dataTransfer.setData('fieldType', type);

    // Store the position where the user grabbed the element
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Calculate the percentage offset within the draggable element
    // This is more reliable across different sized elements
    const offsetXPercent = offsetX / rect.width;
    const offsetYPercent = offsetY / rect.height;

    // Store both the raw offsets and the percentage offsets
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
    e.dataTransfer.setData('offsetXPercent', offsetXPercent.toString());
    e.dataTransfer.setData('offsetYPercent', offsetYPercent.toString());
    e.dataTransfer.setData('elementWidth', rect.width.toString());
    e.dataTransfer.setData('elementHeight', rect.height.toString());
  };

  // React handlers for touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!formPlacementMode) return;

    // Record the starting touch position
    if (e.touches && e.touches[0]) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      logDragEvent('Touch started', touchStartRef.current);
    }
  };

  // This is kept but won't call preventDefault() since we handle that in the useEffect
  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't call preventDefault here as it will trigger the warning
    // It's handled by the non-passive event listener in useEffect
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!formPlacementMode) return;

    if (e.changedTouches && e.changedTouches[0]) {
      const touchX = e.changedTouches[0].clientX;
      const touchY = e.changedTouches[0].clientY;

      logDragEvent(`Touch ended on field type: ${type}`, { touchX, touchY });

      // On mobile devices, use simpler direct field creation approach
      if (window.innerWidth < 768) {
        // Mobile breakpoint
        // Find viewer instance
        if (window.NutrientViewer) {
          const instance = viewerInstanceRef.current;
          const runtime = getNutrientViewerRuntime();

          if (instance && runtime) {
            // Use direct fixed-coordinate placement for mobile
            createMobileField(type, instance, runtime);
          }
        }
      } else {
        // For larger screens, use the existing event dispatch method
        const customEvent = new CustomEvent('nutrient:fieldDragStart', {
          detail: {
            fieldType: type,
            touchX,
            touchY,
          },
          bubbles: true,
        });

        // Dispatch the event
        window.dispatchEvent(customEvent);
      }
    }
  };

  if (compact) {
    return (
      <div
        ref={elementRef}
        className='flex flex-col items-center p-2 rounded-md bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 cursor-move'
        draggable
        onDragStart={handleDragStart}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className='text-blue-500 mb-1'>{icon}</div>
        <span className='text-xs font-medium'>{label}</span>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className='flex items-center p-3 mb-3 rounded-md bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 cursor-move'
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className='mr-3 text-blue-500'>{icon}</div>
      <span className='text-sm font-medium'>{label}</span>
    </div>
  );
};

// Helper function to create a field on a page
const createFieldOnPage = (
  fieldType: string,
  clientX: number,
  clientY: number,
  pageElement: HTMLElement,
  pageIndex: number,
  instance: NutrientViewerInstance,
  nutrientRuntime: any,
) => {
  try {
    console.log('[Mobile Debug] Creating field on page', { fieldType, clientX, clientY, pageIndex });

    if (!nutrientRuntime) {
      console.error('[Mobile Debug] NutrientRuntime not available');
      return;
    }

    // Define field dimensions
    const fieldWidth = fieldType === 'initials' ? 100 : 200;
    const fieldHeight = 50;

    // Get page coordinates
    const pageBoundingRect = pageElement.getBoundingClientRect();
    console.log('[Mobile Debug] Page bounds:', pageBoundingRect);

    // Center the field at touch coordinates
    const clientRect = new nutrientRuntime.Geometry.Rect({
      left: clientX - fieldWidth / 2,
      top: clientY - fieldHeight / 2,
      width: fieldWidth,
      height: fieldHeight,
    });

    console.log('[Mobile Debug] Client rect:', clientRect);

    // Convert to page coordinates
    const transformedPageRect = instance.transformContentClientToPageSpace(clientRect, pageIndex);
    console.log('[Mobile Debug] Transformed page rect:', transformedPageRect);

    // Create unique field name
    const fieldName = `${fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create widget annotation
    const widget = new nutrientRuntime.Annotations.WidgetAnnotation({
      boundingBox: transformedPageRect,
      formFieldName: fieldName,
      id: nutrientRuntime.generateInstantId(),
      pageIndex,
      name: fieldName,
    });

    // Create form field based on type
    let formField;

    if (fieldType === 'signature') {
      console.log('[Mobile Debug] Creating signature field');
      formField = new nutrientRuntime.FormFields.SignatureFormField({
        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
        name: fieldName,
      });
    } else if (fieldType === 'initials') {
      console.log('[Mobile Debug] Creating initials field');
      formField = new nutrientRuntime.FormFields.SignatureFormField({
        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
        name: fieldName,
        type: 'INITIALS',
      });
    } else if (fieldType === 'date') {
      console.log('[Mobile Debug] Creating date field');
      formField = new nutrientRuntime.FormFields.TextFormField({
        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
        name: fieldName,
        defaultValue: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });
    }

    // Ensure form creator mode is active
    instance.setViewState((viewState: any) => viewState.set('interactionMode', nutrientRuntime?.InteractionMode.FORM_CREATOR));

    // Create annotations
    if (formField) {
      return instance
        .create([widget, formField])
        .then(() => {
          console.log('[Mobile Debug] Successfully created field:', fieldName);
          return fieldName;
        })
        .catch((error: any) => {
          console.error('[Mobile Debug] Error creating field:', error);
          return null;
        });
    }

    return null;
  } catch (error) {
    console.error('[Mobile Debug] Exception in createFieldOnPage:', error);
    return null;
  }
};

// Helper function to create a field with fixed and reliable positioning
// Uses hardware-independent positioning to work on all mobile devices
const createMobileField = (fieldType: string, instance: NutrientViewerInstance, runtime: any) => {
  try {
    console.log('[Mobile] Creating field using fixed positioning approach');

    // Find the first page to place the field on
    const pages = instance.contentDocument.querySelectorAll('.PSPDFKit-Page');
    if (!pages || pages.length === 0) {
      console.error('[Mobile] No pages found in document');
      return null;
    }

    const firstPage = pages[0] as HTMLElement;
    const pageIndex = parseInt(firstPage.dataset.pageIndex || '0', 10);

    // Create a unique field name
    const fieldName = `${fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Directly use PDF coordinates for reliable placement
    // These values are in PDF coordinate space which is more reliable than screen coordinates
    const pdfWidth = fieldType === 'initials' ? 75 : 150;
    const pdfHeight = 40;

    // Place at fixed position 100 units from left and top
    // This ensures consistent placement regardless of screen size or zoom level
    const pdfRect = new runtime.Geometry.Rect({
      left: 100,
      top: 100,
      width: pdfWidth,
      height: pdfHeight,
    });

    console.log('[Mobile] Creating field with fixed PDF coordinates:', pdfRect);

    // Create widget annotation
    const widget = new runtime.Annotations.WidgetAnnotation({
      boundingBox: pdfRect,
      formFieldName: fieldName,
      id: runtime.generateInstantId(),
      pageIndex,
      name: fieldName,
    });

    // Create form field based on type
    let formField;
    if (fieldType === 'signature') {
      formField = new runtime.FormFields.SignatureFormField({
        annotationIds: new runtime.Immutable.List([widget.id]),
        name: fieldName,
      });
    } else if (fieldType === 'initials') {
      formField = new runtime.FormFields.SignatureFormField({
        annotationIds: new runtime.Immutable.List([widget.id]),
        name: fieldName,
        type: 'INITIALS',
      });
    } else if (fieldType === 'date') {
      formField = new runtime.FormFields.TextFormField({
        annotationIds: new runtime.Immutable.List([widget.id]),
        name: fieldName,
        defaultValue: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });
    }

    // Set form creator mode
    instance.setViewState((viewState: any) => viewState.set('interactionMode', runtime.InteractionMode.FORM_CREATOR));

    // Create the annotations
    if (formField) {
      return instance
        .create([widget, formField])
        .then(() => {
          console.log('[Mobile] Successfully created field at fixed position');

          // Visual feedback
          const toast = document.createElement('div');
          toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md z-50';
          toast.textContent = `${fieldType} field added`;
          document.body.appendChild(toast);

          // Remove toast after 2 seconds
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 2000);

          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          return fieldName;
        })
        .catch((err) => {
          console.error('[Mobile] Error creating field:', err);
          return null;
        });
    }

    return null;
  } catch (error) {
    console.error('[Mobile] Error in createMobileField:', error);
    return null;
  }
};

// Moved inside the component
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
  const viewerInstanceRef = useRef<NutrientViewerInstance | null>(null);
  const [formPlacementMode, setFormPlacementMode] = useState(true); // State for form placement mode

  // Get a reference to the SDK
  const nutrientSDK = useRef<ReturnType<typeof getNutrientViewer>>(null);

  // Debug state to track field placements
  const [fieldPlacements, setFieldPlacements] = useState<{ type: string; position: string; name: string }[]>([]);

  // State to track debug logs for the mobile view
  const [debugLogs, setDebugLogs] = useState<{ time: string; message: string }[]>([]);

  // This function uses a direct, simplified approach for creating fields on mobile
  // Moved inside the component to access refs and state
  const createDirectMobileField = (fieldType: string) => {
    try {
      console.log('[Mobile Direct] Attempting direct field creation for type:', fieldType);

      // Get the viewer instance
      const instance = viewerInstanceRef.current;
      if (!instance) {
        console.error('[Mobile Direct] Viewer instance not available');
        return false;
      }

      // Get the runtime
      const runtime = getNutrientViewerRuntime();
      if (!runtime) {
        console.error('[Mobile Direct] Runtime not available');
        return false;
      }

      // Get the current page index
      let pageIndex = 0;
      try {
        // First approach - using view state
        const viewState = instance.getViewState();
        if (viewState && typeof viewState.get === 'function') {
          const currentPage = viewState.get('currentPageIndex');
          if (currentPage !== undefined) {
            pageIndex = currentPage;
            console.log('[Mobile Direct] Found current page in view state:', pageIndex);
          }
        }
      } catch (error) {
        console.error('[Mobile Direct] Error getting page from view state:', error);
      }

      console.log('[Mobile Direct] Creating field on page:', pageIndex);

      // Use hardcoded PDF coordinates that work reliably
      const pdfWidth = fieldType === 'initials' ? 75 : 150;
      const pdfHeight = 50;

      // Create a reliable field name
      const fieldName = `${fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create reliable PDF coordinates (no transformation)
      const pdfRect = new runtime.Geometry.Rect({
        left: 100,
        top: 100,
        width: pdfWidth,
        height: pdfHeight,
      });

      console.log('[Mobile Direct] Creating field with rect:', pdfRect);

      // Create the widget annotation
      const widget = new runtime.Annotations.WidgetAnnotation({
        boundingBox: pdfRect,
        formFieldName: fieldName,
        id: runtime.generateInstantId(),
        pageIndex,
        name: fieldName,
      });

      // Create the appropriate form field
      let formField;
      if (fieldType === 'signature') {
        formField = new runtime.FormFields.SignatureFormField({
          annotationIds: new runtime.Immutable.List([widget.id]),
          name: fieldName,
        });
      } else if (fieldType === 'initials') {
        formField = new runtime.FormFields.SignatureFormField({
          annotationIds: new runtime.Immutable.List([widget.id]),
          name: fieldName,
          type: 'INITIALS',
        });
      } else if (fieldType === 'date') {
        formField = new runtime.FormFields.TextFormField({
          annotationIds: new runtime.Immutable.List([widget.id]),
          name: fieldName,
          defaultValue: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        });
      }

      // Set interaction mode
      instance.setViewState((viewState) => viewState.set('interactionMode', runtime.InteractionMode.FORM_CREATOR));

      // Create the field directly
      if (formField) {
        return instance
          .create([widget, formField])
          .then(() => {
            console.log('[Mobile Direct] Successfully created field!');

            // Add to our list
            setFieldPlacements((prev) => [
              ...prev,
              {
                type: fieldType,
                position: `Page ${pageIndex + 1}`,
                name: fieldName,
              },
            ]);

            // Show toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md z-50 shadow-lg';
            toast.innerText = `Added ${fieldType} field to page ${pageIndex + 1}`;
            document.body.appendChild(toast);

            setTimeout(() => {
              document.body.removeChild(toast);
            }, 2000);

            return true;
          })
          .catch((error) => {
            console.error('[Mobile Direct] Field creation failed:', error);
            return false;
          });
      }

      return false;
    } catch (error) {
      console.error('[Mobile Direct] Top-level error in field creation:', error);
      return false;
    }
  };

  // Function to add a log entry
  const addLogEntry = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    setDebugLogs((prev) => [
      { time: timeString, message },
      ...prev.slice(0, 99), // Keep latest 100 logs
    ]);
  };

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Override console logging methods to add to our debug logs for mobile view
  useEffect(() => {
    if (isMobile && mounted) {
      // Store original console methods
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      // Override console.log
      console.log = (...args) => {
        // Call original method
        originalConsoleLog(...args);

        // Add to our log if it's a mobile-related log
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

        if (message.includes('[Mobile]') || message.includes('[Mobile Debug]')) {
          addLogEntry(message);
        }
      };

      // Override console.error for mobile debugging
      console.error = (...args) => {
        // Call original method
        originalConsoleError(...args);

        // Add to our log if it's a mobile-related error
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

        if (message.includes('[Mobile]') || message.includes('[Mobile Debug]')) {
          addLogEntry(`ERROR: ${message}`);
        }
      };

      // Restore original methods on cleanup
      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      };
    }
  }, [isMobile, mounted, addLogEntry]);

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
          safeUnloadViewer(desktopContainerRef.current);
        }
        if (mobileContainerRef.current) {
          safeUnloadViewer(mobileContainerRef.current);
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

    // Get the SDK with type safety
    nutrientSDK.current = getNutrientViewer();

    if (container && nutrientSDK.current) {
      console.log(`Loading viewer in ${isMobile ? 'mobile' : 'desktop'} mode with proxy URL:`, proxyUrl);
      setIsLoading(true);

      // First, clean up any existing viewer instance
      if (isViewerLoaded) {
        console.log(`Unloading existing viewer before loading in ${isMobile ? 'mobile' : 'desktop'} mode`);
        if (desktopContainerRef.current) {
          safeUnloadViewer(desktopContainerRef.current);
        }
        if (mobileContainerRef.current) {
          safeUnloadViewer(mobileContainerRef.current);
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
        safeLoadViewer({
          container,
          document: proxyUrl,
          toolbarItems: toolBarItems,
          licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
          styleSheets: ['/styles/viewer.css'],
        })
          .then((instance: NutrientViewerInstance) => {
            console.log('NutrientViewer instance loaded successfully');
            viewerInstanceRef.current = instance;

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

              // Get the drag offsets to adjust placement
              const offsetXStr = event.dataTransfer.getData('offsetX') || '0';
              const offsetYStr = event.dataTransfer.getData('offsetY') || '0';
              const offsetXPercentStr = event.dataTransfer.getData('offsetXPercent') || '0.5';
              const offsetYPercentStr = event.dataTransfer.getData('offsetYPercent') || '0.5';
              const elementWidthStr = event.dataTransfer.getData('elementWidth') || '0';
              const elementHeightStr = event.dataTransfer.getData('elementHeight') || '0';

              const offsetX = parseInt(offsetXStr, 10);
              const offsetY = parseInt(offsetYStr, 10);
              const offsetXPercent = parseFloat(offsetXPercentStr);
              const offsetYPercent = parseFloat(offsetYPercentStr);
              const elementWidth = parseInt(elementWidthStr, 10);
              const elementHeight = parseInt(elementHeightStr, 10);

              console.log(`Using drag offsets: X=${offsetX}px (${(offsetXPercent * 100).toFixed(1)}%), Y=${offsetY}px (${(offsetYPercent * 100).toFixed(1)}%)`);

              // Find the page element
              const pageElement = closestByClass(event.target, 'PSPDFKit-Page');
              console.log('Page element at drop position:', pageElement);

              if (pageElement) {
                const pageIndex = parseInt(pageElement.dataset.pageIndex, 10);
                console.log('Drop on page:', pageIndex);

                try {
                  // Get the runtime SDK with all properties
                  const nutrientRuntime = getNutrientViewerRuntime();

                  if (!nutrientRuntime) {
                    console.error('NutrientViewer runtime not available');
                    return;
                  }

                  // Get the page element's bounding rectangle
                  const pageBoundingRect = pageElement.getBoundingClientRect();

                  console.log('Drop coordinates - clientX:', event.clientX, 'clientY:', event.clientY);
                  console.log('Page coordinates - left:', pageBoundingRect.left, 'top:', pageBoundingRect.top);

                  // Define field dimensions
                  const fieldWidth = fieldType === 'initials' ? 100 : 200;
                  const fieldHeight = 50;

                  // Calculate offset position for more accurate placement
                  // Adjust coordinates to place field relative to where it was grabbed
                  const clientRect = new nutrientRuntime.Geometry.Rect({
                    left: event.clientX - offsetX,
                    top: event.clientY - offsetY,
                    width: fieldWidth,
                    height: fieldHeight,
                  });

                  console.log('Using drag offsets - X:', offsetX, 'Y:', offsetY);
                  console.log('Adjusted client rect position - left:', event.clientX - offsetX, 'top:', event.clientY - offsetY);
                  console.log('Client rect:', clientRect);

                  // Transform to page coordinates
                  const transformedPageRect = instance.transformContentClientToPageSpace(clientRect, pageIndex);
                  console.log('Transformed page rect:', transformedPageRect);

                  // Create a unique field name
                  const fieldName = `${fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                  // Create widget annotation with typed SDK
                  const widget = new nutrientRuntime.Annotations.WidgetAnnotation({
                    boundingBox: transformedPageRect,
                    formFieldName: fieldName,
                    id: nutrientRuntime.generateInstantId(),
                    pageIndex,
                    name: fieldName,
                  });

                  // Create the form field based on type
                  let formField;

                  if (fieldType === 'signature') {
                    formField = new nutrientRuntime.FormFields.SignatureFormField({
                      annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                      name: fieldName,
                    });
                  } else if (fieldType === 'initials') {
                    formField = new nutrientRuntime.FormFields.SignatureFormField({
                      annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                      name: fieldName,
                      type: 'INITIALS',
                    });
                  } else if (fieldType === 'date') {
                    formField = new nutrientRuntime.FormFields.TextFormField({
                      annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                      name: fieldName,
                      defaultValue: new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }),
                    });
                  }

                  // Set form creator mode
                  instance.setViewState((viewState: any) => viewState.set('interactionMode', nutrientRuntime?.InteractionMode.FORM_CREATOR));

                  // Create the annotations
                  if (formField) {
                    instance
                      .create([widget, formField])
                      .then(() => {
                        console.log(`Created ${fieldType} field at position (${Math.round(transformedPageRect.left)}, ${Math.round(transformedPageRect.top)})`);

                        // Add to our debug state for tracking
                        setFieldPlacements((prev) => [
                          ...prev,
                          {
                            type: fieldType,
                            position: `(${Math.round(transformedPageRect.left)}, ${Math.round(transformedPageRect.top)})`,
                            name: fieldName,
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

            // Add event listener for clicking on form field annotations
            instance.contentDocument.addEventListener('click', (event: MouseEvent) => {
              const target = event.target as Element;

              // Check if clicked element is a form field annotation widget
              const annotationWidget = closestByClass(target, 'PSPDFKit-Annotation-Widget');
              if (annotationWidget) {
                // Get the field name
                const fieldName = annotationWidget.getAttribute('name');
                if (fieldName) {
                  console.log(`Clicked on annotation field: ${fieldName}`);

                  // Find the corresponding field in our placements list and highlight it
                  const fieldIndex = fieldPlacements.findIndex((field) => field.name === fieldName);
                  if (fieldIndex >= 0) {
                    // Highlight the field in the list
                    const fieldElement = document.getElementById(`field-placement-${fieldIndex}`);
                    if (fieldElement) {
                      // Add a highlight class
                      fieldElement.classList.add('bg-blue-100', 'dark:bg-blue-900/30');

                      // Remove the highlight after a delay
                      setTimeout(() => {
                        fieldElement.classList.remove('bg-blue-100', 'dark:bg-blue-900/30');
                      }, 1500);

                      // Scroll the field into view in the list if needed
                      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }
                }
              }
            });

            // Add specific touch event listeners for mobile
            if (isMobile) {
              // Track if we're in the process of a mobile field dragging operation
              let mobileFieldDragActive = false;
              let activeTouchFieldType = '';
              let touchStartX = 0;
              let touchStartY = 0;

              // Add touch handling to the document
              instance.contentDocument.addEventListener('touchstart', (event) => {
                console.log('[Mobile] Touch start event in document viewer');
              });

              // Handle touch move in the document
              instance.contentDocument.addEventListener('touchmove', (event) => {
                if (mobileFieldDragActive && event.touches && event.touches[0]) {
                  console.log('[Mobile] Touch move with active field:', activeTouchFieldType);
                  event.preventDefault(); // Prevent scrolling during field placement
                }
              });

              // Handle touch end in the document
              instance.contentDocument.addEventListener('touchend', (event) => {
                if (mobileFieldDragActive) {
                  console.log('[Mobile] Touch end with active field:', activeTouchFieldType);

                  // Get touch end position
                  const touchEndX = event.changedTouches[0].clientX;
                  const touchEndY = event.changedTouches[0].clientY;

                  // Get element under the touch point
                  const elementAtPoint = document.elementFromPoint(touchEndX, touchEndY);
                  if (!elementAtPoint) return;

                  // Find the page element
                  const pageElement = closestByClass(elementAtPoint, 'PSPDFKit-Page');
                  if (!pageElement) {
                    console.log('[Mobile] No page element found at touch end');
                    mobileFieldDragActive = false;
                    return;
                  }

                  try {
                    const pageIndex = parseInt(pageElement.dataset.pageIndex, 10);
                    const nutrientRuntime = getNutrientViewerRuntime();

                    if (!nutrientRuntime) {
                      console.error('[Mobile] NutrientViewer runtime not available');
                      mobileFieldDragActive = false;
                      return;
                    }

                    // Define field dimensions
                    const fieldWidth = activeTouchFieldType === 'initials' ? 100 : 200;
                    const fieldHeight = 50;

                    // Calculate placement position for mobile
                    // Adding better positioning logic specifically for touch devices
                    const pageBoundingRect = pageElement.getBoundingClientRect();
                    console.log('[Mobile] Page element bounds:', {
                      left: pageBoundingRect.left,
                      top: pageBoundingRect.top,
                      width: pageBoundingRect.width,
                      height: pageBoundingRect.height,
                    });

                    // Calculate relative position within the page
                    const relativeX = touchEndX - pageBoundingRect.left;
                    const relativeY = touchEndY - pageBoundingRect.top;
                    console.log('[Mobile] Touch relative position:', { relativeX, relativeY });

                    // Create the rect in client space relative to where the user touched
                    const clientRect = new nutrientRuntime.Geometry.Rect({
                      left: touchEndX - fieldWidth / 2, // Center horizontally at touch point
                      top: touchEndY - fieldHeight / 2, // Center vertically at touch point
                      width: fieldWidth,
                      height: fieldHeight,
                    });

                    console.log('[Mobile] Placing field at:', {
                      touchEndX,
                      touchEndY,
                      fieldWidth,
                      fieldHeight,
                      pageIndex,
                    });

                    // Transform to page coordinates
                    const transformedPageRect = instance.transformContentClientToPageSpace(clientRect, pageIndex);

                    // Create a unique field name
                    const fieldName = `${activeTouchFieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                    // Create widget annotation
                    const widget = new nutrientRuntime.Annotations.WidgetAnnotation({
                      boundingBox: transformedPageRect,
                      formFieldName: fieldName,
                      id: nutrientRuntime.generateInstantId(),
                      pageIndex,
                      name: fieldName,
                    });

                    // Create form field based on type
                    let formField;

                    if (activeTouchFieldType === 'signature') {
                      console.log('[Mobile] Creating signature field');
                      formField = new nutrientRuntime.FormFields.SignatureFormField({
                        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                        name: fieldName,
                      });
                    } else if (activeTouchFieldType === 'initials') {
                      console.log('[Mobile] Creating initials field');
                      formField = new nutrientRuntime.FormFields.SignatureFormField({
                        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                        name: fieldName,
                        type: 'INITIALS',
                      });
                    } else if (activeTouchFieldType === 'date') {
                      console.log('[Mobile] Creating date field');
                      formField = new nutrientRuntime.FormFields.TextFormField({
                        annotationIds: new nutrientRuntime.Immutable.List([widget.id]),
                        name: fieldName,
                        defaultValue: new Date().toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }),
                      });
                    }

                    // Set form creator mode
                    instance.setViewState((viewState: any) => viewState.set('interactionMode', nutrientRuntime?.InteractionMode.FORM_CREATOR));

                    // Create the annotations
                    if (formField) {
                      instance
                        .create([widget, formField])
                        .then(() => {
                          console.log(
                            `[Mobile] Created ${activeTouchFieldType} field at position (${Math.round(transformedPageRect.left)}, ${Math.round(transformedPageRect.top)})`,
                          );

                          // Add to our debug state for tracking
                          setFieldPlacements((prev) => [
                            ...prev,
                            {
                              type: activeTouchFieldType,
                              position: `(${Math.round(transformedPageRect.left)}, ${Math.round(transformedPageRect.top)})`,
                              name: fieldName,
                            },
                          ]);
                        })
                        .catch((error: any) => {
                          console.error('[Mobile] Error creating form field:', error);
                        });
                    }
                  } catch (error) {
                    console.error('[Mobile] Error in touch-based form field creation:', error);
                  }

                  // Reset mobile drag state
                  mobileFieldDragActive = false;
                  activeTouchFieldType = '';
                }
              });

              // Add a global listener to track field type for mobile drag operations
              window.addEventListener('nutrient:fieldDragStart', ((event: CustomEvent) => {
                if (event.detail && event.detail.fieldType) {
                  console.log('[Mobile] Custom field drag start event captured:', event.detail);
                  mobileFieldDragActive = true;
                  activeTouchFieldType = event.detail.fieldType;
                  touchStartX = event.detail.touchX || 0;
                  touchStartY = event.detail.touchY || 0;

                  // IMMEDIATE TEST: Try to create field right away based on event coordinates
                  try {
                    console.log('[Mobile Debug] Testing immediate field creation with:', event.detail);
                    const touchX = event.detail.touchX;
                    const touchY = event.detail.touchY;

                    // Make sure the runtime is available before proceeding
                    const mobileRuntime = getNutrientViewerRuntime();
                    if (!mobileRuntime) {
                      console.error('[Mobile Debug] NutrientRuntime is not available for immediate field creation');
                      return;
                    }

                    console.log('[Mobile Debug] Looking for document container');
                    // Instead of trying to place at the touch point, find the document container and place in the visible area
                    const docContainer = instance.contentDocument.querySelector('.PSPDFKit-Page');

                    if (docContainer) {
                      console.log('[Mobile Debug] Found document container:', docContainer.tagName, docContainer.className);

                      // Get the page index from the container
                      const pageIndex = parseInt(docContainer.dataset.pageIndex, 10);
                      console.log('[Mobile Debug] Target page index:', pageIndex);

                      // Get the container's position
                      const rect = docContainer.getBoundingClientRect();
                      console.log('[Mobile Debug] Document container bounds:', rect);

                      // Document space coordinates may be inverted compared to screen coordinates
                      // Place the field in a more consistently visible location
                      const centerX = rect.left + rect.width / 2;
                      const centerY = rect.top + rect.height / 2; // Center of page for better visibility

                      console.log('[Mobile Debug] Will place field at center point:', { centerX, centerY });

                      // Create the field with a completely different approach for mobile:
                      // Using PDF coordinates directly instead of screen coordinates
                      try {
                        // Create a unique field name
                        const fieldName = `${event.detail.fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                        // For reliable placement, create a temporary widget to get proper transform values
                        const tempRect = new mobileRuntime.Geometry.Rect({
                          left: centerX,
                          top: centerY,
                          width: 5, // Tiny test point
                          height: 5,
                        });

                        // Find where this point maps to in PDF space
                        const tempTransformed = instance.transformContentClientToPageSpace(tempRect, pageIndex);
                        console.log('[Mobile Debug] Test point transformed to:', tempTransformed);

                        // Now create a properly sized field at those PDF coordinates
                        const pdfWidth = event.detail.fieldType === 'initials' ? 75 : 150;
                        const pdfHeight = 50;

                        const pdfRect = new mobileRuntime.Geometry.Rect({
                          // Center the field at the test point's position
                          left: tempTransformed.left - pdfWidth / 2,
                          top: tempTransformed.top - pdfHeight / 2,
                          width: pdfWidth,
                          height: pdfHeight,
                        });

                        console.log('[Mobile Debug] Creating PDF-space field with rect:', pdfRect);

                        // Create widget annotation directly in PDF space
                        const widget = new mobileRuntime.Annotations.WidgetAnnotation({
                          boundingBox: pdfRect,
                          formFieldName: fieldName,
                          id: mobileRuntime.generateInstantId(),
                          pageIndex,
                          name: fieldName,
                        });

                        // Create the form field based on type
                        let formField;

                        if (event.detail.fieldType === 'signature') {
                          console.log('[Mobile Debug] Creating signature field');
                          formField = new mobileRuntime.FormFields.SignatureFormField({
                            annotationIds: new mobileRuntime.Immutable.List([widget.id]),
                            name: fieldName,
                          });
                        } else if (event.detail.fieldType === 'initials') {
                          console.log('[Mobile Debug] Creating initials field');
                          formField = new mobileRuntime.FormFields.SignatureFormField({
                            annotationIds: new mobileRuntime.Immutable.List([widget.id]),
                            name: fieldName,
                            type: 'INITIALS',
                          });
                        } else if (event.detail.fieldType === 'date') {
                          console.log('[Mobile Debug] Creating date field');
                          formField = new mobileRuntime.FormFields.TextFormField({
                            annotationIds: new mobileRuntime.Immutable.List([widget.id]),
                            name: fieldName,
                            defaultValue: new Date().toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }),
                          });
                        }

                        // Ensure form creator mode is active
                        instance.setViewState((viewState: any) => viewState.set('interactionMode', mobileRuntime?.InteractionMode.FORM_CREATOR));

                        // Create annotations
                        if (formField) {
                          instance
                            .create([widget, formField])
                            .then(() => {
                              console.log('[Mobile Debug] Successfully created field:', fieldName);

                              // Add haptic feedback if supported
                              if (navigator.vibrate) {
                                navigator.vibrate(50); // Short vibration to indicate success
                              }

                              // Add visual feedback by briefly flashing a success message
                              const successMessage = document.createElement('div');
                              successMessage.className =
                                'fixed top-1/4 left-1/2 transform -translate-x-1/2 py-2 px-4 bg-green-500 text-white rounded-md z-50 shadow-lg';
                              successMessage.textContent = `${event.detail.fieldType} field added`;
                              document.body.appendChild(successMessage);

                              // Remove the message after a short delay
                              setTimeout(() => {
                                document.body.removeChild(successMessage);
                              }, 1500);

                              // Update field placement list
                              setFieldPlacements((prev) => [
                                ...prev,
                                {
                                  type: event.detail.fieldType,
                                  position: `Center of page ${pageIndex + 1}`,
                                  name: fieldName,
                                },
                              ]);
                            })
                            .catch((err) => {
                              console.error('[Mobile Debug] Error in createFieldOnPage execution:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
                            });
                        }
                      } catch (error) {
                        console.error('[Mobile Debug] Error in immediate field creation:', error);
                      }
                    } else {
                      console.error('[Mobile Debug] No document pages found. Trying to find any viewport element.');

                      // Fallback: try to find any viewport element
                      const viewport = instance.contentDocument.querySelector('.PSPDFKit-Viewport');
                      if (viewport) {
                        console.log('[Mobile Debug] Found viewport:', viewport);

                        // Look for pages within the viewport
                        const pages = viewport.querySelectorAll('.PSPDFKit-Page');
                        if (pages && pages.length > 0) {
                          const firstPage = pages[0] as HTMLElement;
                          console.log('[Mobile Debug] Using first page in viewport:', firstPage);

                          const pageIndex = parseInt(firstPage.dataset.pageIndex, 10);
                          const rect = firstPage.getBoundingClientRect();

                          // Center position
                          const centerX = rect.left + rect.width / 2;
                          const centerY = rect.top + rect.height / 3;

                          setTimeout(() => {
                            createFieldOnPage(event.detail.fieldType, centerX, centerY, firstPage, pageIndex, mobileRuntime);
                          }, 100);
                        } else {
                          console.error('[Mobile Debug] No pages found in viewport');
                        }
                      } else {
                        console.error('[Mobile Debug] No viewport found');
                      }
                    }
                  } catch (error) {
                    console.error('[Mobile Debug] Error in immediate field creation:', error);
                  }
                }
              }) as EventListener);
            }

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

  // Toggle form placement mode when the switch changes
  useEffect(() => {
    if (viewerInstanceRef.current && mounted) {
      const nutrientRuntime = getNutrientViewerRuntime();

      if (nutrientRuntime) {
        console.log(`Setting form placement mode: ${formPlacementMode ? 'ON' : 'OFF'}`);

        if (formPlacementMode) {
          // Enable form creator mode
          viewerInstanceRef.current.setViewState((viewState) => viewState.set('interactionMode', nutrientRuntime.InteractionMode.FORM_CREATOR));
        } else {
          // Disable form creator mode
          viewerInstanceRef.current.setViewState((viewState) => viewState.set('formDesignMode', false));
        }
      }
    }
  }, [formPlacementMode, mounted]);

  return (
    <FormPlacementContext.Provider value={{ formPlacementMode }}>
      <div className='space-y-6'>
        <div>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold tracking-tight'>Field Placement</h2>
            <Badge variant='outline' className='ml-2 flex items-center gap-1'>
              <Tag className='h-3 w-3' />
              <span>v1.3.0</span>
            </Badge>
          </div>
          <p className='text-muted-foreground mt-2 text-sm'>Drag fields onto the document where you want recipients to sign.</p>
        </div>

        {isMobile ? (
          // Mobile Layout - Vertical with fields at top
          <div className='flex flex-col space-y-4'>
            {/* Horizontal field selector for mobile - sticky */}
            <div className='sticky top-0 z-50'>
              <Card className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 shadow-md'>
                <CardContent className='py-4'>
                  <h3 className='font-medium mb-3'>Click to add fields</h3>

                  <div className='flex items-center justify-between mb-6 bg-gray-50 dark:bg-zinc-800 p-3 rounded-md border border-gray-200 dark:border-zinc-700'>
                    <div className='flex items-center gap-2'>
                      <div className={`w-2 h-2 rounded-full ${formPlacementMode ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <Label htmlFor='form-placement-mode' className='text-sm font-medium'>
                        Edit Mode
                      </Label>
                    </div>
                    <CustomSwitch id='form-placement-mode' checked={formPlacementMode} onCheckedChange={setFormPlacementMode} />
                  </div>

                  {/* Direct buttons for mobile - simplified approach */}
                  <div className='grid grid-cols-2 gap-2'>
                    <Button
                      variant='outline'
                      className='h-auto py-3 flex flex-col items-center justify-center col-span-2'
                      onClick={() => {
                        console.log('[Mobile Direct] Add Signature button clicked');
                        createDirectMobileField('signature');
                      }}
                    >
                      <Signature className='h-5 w-5 mb-1' />
                      <span>Add Signature</span>
                    </Button>
                    <Button
                      variant='outline'
                      className='h-auto py-2'
                      onClick={() => {
                        console.log('[Mobile Direct] Add Initials button clicked');
                        createDirectMobileField('initials');
                      }}
                    >
                      <Edit className='h-4 w-4 mr-2' />
                      <span>Add Initials</span>
                    </Button>
                    <Button
                      variant='outline'
                      className='h-auto py-2'
                      onClick={() => {
                        console.log('[Mobile Direct] Add Date button clicked');
                        createDirectMobileField('date');
                      }}
                    >
                      <CalendarDays className='h-4 w-4 mr-2' />
                      <span>Add Date</span>
                    </Button>
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

            {/* Mobile Event Log for Debugging */}
            <Card className='border border-gray-200 dark:border-gray-700'>
              <CardContent className='py-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <ScrollText className='h-4 w-4 text-blue-500' />
                    <h3 className='font-medium'>Debug Event Log</h3>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => setDebugLogs([])}>
                    <Trash className='h-4 w-4' />
                  </Button>
                </div>

                <div className='border rounded-md p-2 bg-gray-50 dark:bg-zinc-800 text-xs font-mono'>
                  {debugLogs.length === 0 ? (
                    <div className='text-center text-muted-foreground py-4'>No events logged yet</div>
                  ) : (
                    debugLogs.map((log, i) => (
                      <div key={i} className={`mb-1 ${log.message.includes('ERROR') ? 'text-red-500' : ''}`}>
                        <span className='text-gray-500 dark:text-gray-400 mr-2'>{log.time}</span>
                        <span>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
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
                  <h3 className='font-medium mb-3'>Available Fields</h3>

                  <div className='flex items-center justify-between mb-6 bg-gray-50 dark:bg-zinc-800 p-3 rounded-md border border-gray-200 dark:border-zinc-700'>
                    <div className='flex items-center gap-2'>
                      <div className={`w-2 h-2 rounded-full ${formPlacementMode ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <Label htmlFor='form-placement-mode' className='text-sm font-medium'>
                        Edit Mode
                      </Label>
                    </div>
                    <CustomSwitch id='form-placement-mode' checked={formPlacementMode} onCheckedChange={setFormPlacementMode} />
                  </div>

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
                          <div
                            id={`field-placement-${i}`}
                            key={i}
                            className='p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded cursor-pointer flex items-center'
                            onClick={() => {
                              if (viewerInstanceRef.current) {
                                console.log(`Focusing field: ${field.name}`);
                                try {
                                  // Focus the annotation in the viewer
                                  const annotationElement = viewerInstanceRef.current.contentDocument.querySelector(
                                    `.PSPDFKit-Annotation-Widget[name='${field.name}']`,
                                  );

                                  if (annotationElement) {
                                    // Focus the element
                                    annotationElement.focus();
                                    // Scroll to it
                                    annotationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    console.log('Annotation element focused:', annotationElement);
                                  } else {
                                    console.log(`Annotation element with name '${field.name}' not found`);
                                  }
                                } catch (error) {
                                  console.error('Error focusing annotation:', error);
                                }
                              }
                            }}
                          >
                            <div className='flex-1'>
                              <span className='font-medium'>{field.type}</span>: {field.position}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document viewer */}
            <div className='flex-1'>
              <Card className='h-full'>
                <CardContent className='p-0 h-full relative'>
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
    </FormPlacementContext.Provider>
  );
}
