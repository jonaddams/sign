'use client';

import React, { useEffect, useRef, useState, useContext, createContext, useCallback, useMemo } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';
import { Card, CardContent } from '@/components/ui/card';
import { Signature, CalendarDays, Edit, ScrollText, Trash, Info, ZoomIn, Tag, ChevronLeft, ChevronRight, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import * as NutrientViewerSDK from '@nutrient-sdk/viewer';
import { getNutrientViewerRuntime, getNutrientViewer, safeUnloadViewer, safeLoadViewer, closestByClass, NutrientViewerRuntime } from '@/lib/nutrient-viewer';
import { Label } from '@/components/ui/label';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormPlacementContext, useFormPlacement, FormPlacementProvider } from '../../context/FormPlacementContext';
import RecipientDropdown from './RecipientDropdown';

// Import the custom CSS for field styling
import '@/public/styles/custom-fields.css';

// Define the instance type for local use
type NutrientViewerInstance = NutrientViewerSDK.Instance;

// Create a shared context for the viewer reference
const ViewerContext = createContext<React.MutableRefObject<NutrientViewerInstance | null> | null>(null);

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
  recipient?: string;
}

// Define interfaces for document flow state
interface DocumentState {
  url?: string;
  // Add other document properties that might be needed
}

interface DocumentFlowState {
  document: DocumentState;
  // Add other state properties that might be needed
}

const FieldOption = ({ icon, label, type, compact = false }: FieldOptionProps) => {
  const { formPlacementMode, currentRecipient, recipientColors } = useContext(FormPlacementContext);
  const viewerInstanceRef = useContext(ViewerContext);

  // Function to create icon background colors with good contrast in both modes
  const getIconBackgroundColor = (color: string | undefined): string => {
    // If no color is provided, use a default high-contrast color
    if (!color) return 'cornflowerblue';

    // For existing colors, we need to ensure they have enough saturation and brightness
    // Extract RGB components if it's an rgba or rgb color
    if (color.startsWith('rgb')) {
      // For rgb/rgba colors, transform to solid versions
      const matches = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (matches) {
        // Get the RGB values
        const r = parseInt(matches[1], 10);
        const g = parseInt(matches[2], 10);
        const b = parseInt(matches[3], 10);

        // Identify specific color types to handle them appropriately
        const isLightGreen = g > Math.max(r, b) && g > 180;
        const isLightPink = r > Math.max(g, b) && r > 180 && b > 100;
        const isPastel = (r > 160 && g > 160 && b > 160) || Math.max(r, g, b) - Math.min(r, g, b) < 60;

        // For the icon background, we want a slightly darker version of the color for better contrast
        // Apply moderate saturation boost and brightness adjustment for better visibility
        const saturationBoost = isPastel ? 1.2 : 1.0;
        const brightnessAdjust = isPastel ? 0.85 : 1.0;

        let rNew = r;
        let gNew = g;
        let bNew = b;

        // Apply saturation boost if needed (for pastel colors)
        if (isPastel) {
          const avg = (r + g + b) / 3;
          rNew = Math.min(255, Math.max(0, r > avg ? r + (r - avg) * saturationBoost : r));
          gNew = Math.min(255, Math.max(0, g > avg ? g + (g - avg) * saturationBoost : g));
          bNew = Math.min(255, Math.max(0, b > avg ? b + (b - avg) * saturationBoost : b));
        }

        // Apply brightness adjustment for pastel colors
        if (isPastel) {
          rNew *= brightnessAdjust;
          gNew *= brightnessAdjust;
          bNew *= brightnessAdjust;
        }

        // Special handling for problematic colors
        if (isLightGreen) {
          // Make light greens more visible
          gNew = Math.min(255, g);
          rNew = Math.max(0, r * 0.8);
          bNew = Math.max(0, b * 0.8);
        }

        if (isLightPink) {
          // Make light pinks more visible
          rNew = Math.min(255, r);
          gNew = Math.max(0, g * 0.8);
        }

        return `rgb(${Math.round(rNew)}, ${Math.round(gNew)}, ${Math.round(bNew)})`;
      }
    }

    // Handle named colors or hex values - use as is but with fallback
    // Remove any transparency if present
    return color.split(',').length > 3 ? `${color.split(')')[0].replace(/rgba/i, 'rgb')})` : color || 'cornflowerblue';
  };
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
        if (window.NutrientViewer && viewerInstanceRef) {
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
        <div
          className='mb-2 p-1.5 rounded-md flex items-center justify-center'
          style={{
            backgroundColor: getIconBackgroundColor(recipientColors && currentRecipient ? recipientColors[currentRecipient.email] : undefined),
          }}
        >
          <div className='text-gray-950'>{icon}</div>
        </div>
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
      <div
        className='mr-3 p-1.5 rounded-md flex items-center justify-center'
        style={{
          backgroundColor: getIconBackgroundColor(recipientColors && currentRecipient ? recipientColors[currentRecipient.email] : undefined),
        }}
      >
        <div className='text-gray-950'>{icon}</div>
      </div>
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
  currentRecipient?: any,
  setFieldPlacements?: any,
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
    const fieldName = `${fieldType}_${currentRecipient ? currentRecipient.email.split('@')[0] : 'unknown'}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
    instance.setViewState((viewState: any) => {
      if (nutrientRuntime?.InteractionMode?.FORM_CREATOR) {
        return viewState.set('interactionMode', nutrientRuntime.InteractionMode.FORM_CREATOR);
      }
      return viewState;
    });

    // Create annotations
    if (formField) {
      return instance
        .create([widget, formField])
        .then(() => {
          console.log('[Mobile Debug] Successfully created field:', fieldName);

          // Add to field placements with recipient info
          setFieldPlacements((prev: FieldPlacement[]) => [
            ...prev,
            {
              type: fieldType,
              position: `Page ${pageIndex + 1} at y=${transformedPageRect.top}`,
              name: fieldName,
              recipient: currentRecipient?.email,
            } as FieldPlacement,
          ]);

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
    const pageIndex = parseInt((firstPage as HTMLElement).dataset.pageIndex || '0', 10);

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
    instance.setViewState((viewState: any) => {
      if (runtime?.InteractionMode?.FORM_CREATOR) {
        return viewState.set('interactionMode', runtime.InteractionMode.FORM_CREATOR);
      }
      return viewState;
    });

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

// Create custom renderer for fields with recipient names and improved visual differentiation
const getAnnotationRenderers =
  (runtime: any, currentRecipient: any, recipientColors: { [email: string]: string }) =>
  ({ annotation }: any) => {
    // Skip if no annotation name or it's not one of our fields
    if (!annotation.name || !['signature', 'initials', 'date'].some((type) => annotation.name.startsWith(type))) {
      return null;
    }

    // Extract recipient from field name or use current recipient
    let recipientName = currentRecipient?.name || 'Unknown';
    let recipientEmail = currentRecipient?.email || '';

    // Try to extract recipient from field name (for fields created by other recipients)
    const nameParts = annotation.name.split('_');
    if (nameParts.length >= 2) {
      const fieldRecipient = nameParts[1];
      // This is an optional enhancement to show the actual owner of a field
      // even when viewing as a different recipient
    }

    // Create a div to hold our custom field
    const div = document.createElement('div');
    div.className = 'custom-field-container';

    // Add background color based on recipient's color
    const fieldColor = recipientEmail && recipientColors[recipientEmail] ? recipientColors[recipientEmail] : 'hsl(210, 65%, 85%)'; // Default color if none assigned

    // Apply color with better visual differentiation
    // Use solid colors for better visibility
    div.style.borderColor = fieldColor;
    div.style.backgroundColor = fieldColor;

    // Determine if this is the current recipient's field
    const isCurrentRecipientField = currentRecipient && recipientEmail === currentRecipient.email;

    // Add a highlight effect for the current recipient's fields
    if (isCurrentRecipientField) {
      div.classList.add('current-recipient-field');
    }

    // Field type icon and label
    let icon = '/signature.svg';
    let fieldTypeLabel = 'Signature';

    if (annotation.name.startsWith('initials')) {
      icon = '/file-icons/initials-icon.svg';
      fieldTypeLabel = 'Initials';
    } else if (annotation.name.startsWith('date')) {
      icon = '/file-icons/date-icon.svg';
      fieldTypeLabel = 'Date';
    }

    // Add recipient label and icon with optional badge
    div.innerHTML = `
      <div class="custom-field-recipient">
        ${recipientName}
      </div>
      ${isCurrentRecipientField ? '<div class="current-badge">C</div>' : ''}
      <div class="custom-field-type">
        <img class="custom-field-icon" src="${icon}" alt="${fieldTypeLabel}" />
      </div>
    `;

    // Return the custom renderer configuration
    return {
      node: div,
      append: true,
    };
  };

// Create an enhanced RecipientNavigation component with dropdown and navigation controls
const RecipientNavigation = () => {
  const {
    currentRecipientIndex,
    setCurrentRecipientIndex,
    signerRecipients,
    goToPreviousRecipient,
    goToNextRecipient,
    recipientColors,
    recipientHasSignature,
  } = useContext(FormPlacementContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (signerRecipients.length <= 1) {
    return null; // Don't show navigation if there's only one recipient
  }

  const currentRecipient = signerRecipients[currentRecipientIndex];

  // Function to handle direct recipient selection
  const selectRecipient = (index: number) => {
    // Close dropdown
    setIsDropdownOpen(false);

    // Set the recipient index directly
    if (index !== currentRecipientIndex) {
      setCurrentRecipientIndex(index);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Dropdown for selecting recipients */}
      <div className='relative'>
        {/* Dropdown header/trigger */}
        <div
          className='flex items-center justify-between bg-white dark:bg-zinc-800 p-3 rounded-md border border-gray-200 dark:border-zinc-700 cursor-pointer'
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className='flex items-center space-x-2 flex-1'>
            <div className='h-4 w-4 rounded-full mr-2' style={{ backgroundColor: recipientColors[currentRecipient.email] }} />
            <User className='h-4 w-4 text-blue-500 mr-1' />
            <span className='text-sm font-medium'>
              {currentRecipient.name} ({currentRecipientIndex + 1}/{signerRecipients.length})
            </span>
          </div>

          {/* Status indicator */}
          <div className='flex items-center space-x-2'>
            {recipientHasSignature(currentRecipient.email) ? (
              <Badge variant='outline' className='bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 flex items-center gap-1'>
                <CheckCircle className='h-3 w-3' /> Ready
              </Badge>
            ) : (
              <Badge variant='outline' className='bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-1'>
                <AlertTriangle className='h-3 w-3' /> Needs signature
              </Badge>
            )}
            <div className='text-gray-400'>
              {isDropdownOpen ? <ChevronRight className='h-4 w-4 rotate-90' /> : <ChevronRight className='h-4 w-4 -rotate-90' />}
            </div>
          </div>
        </div>

        {/* Dropdown content */}
        {isDropdownOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-64 overflow-y-auto'>
            {signerRecipients.map((recipient, index) => {
              const hasSignature = recipientHasSignature(recipient.email);
              return (
                <div
                  key={recipient.email}
                  className={`flex items-center justify-between p-3 cursor-pointer
                    ${
                      index === currentRecipientIndex
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-700'
                    }`}
                  onClick={() => selectRecipient(index)}
                >
                  <div className='flex items-center space-x-2'>
                    <div className='h-3 w-3 rounded-full' style={{ backgroundColor: recipientColors[recipient.email] }} />
                    <span className='text-sm font-medium truncate'>{recipient.name}</span>
                  </div>

                  {/* Status indicator */}
                  <div className='flex items-center space-x-2'>
                    {hasSignature ? (
                      <Badge variant='outline' className='bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 flex items-center gap-1 text-xs'>
                        <CheckCircle className='h-3 w-3' /> Ready
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-1 text-xs'>
                        <AlertTriangle className='h-3 w-3' /> Needs signature
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            goToPreviousRecipient();
            setIsDropdownOpen(false);
          }}
          disabled={currentRecipientIndex === 0}
          className='h-8 px-2 flex-1'
        >
          <ChevronLeft className='h-4 w-4 mr-1' />
          Previous Signer
        </Button>
        <div className='w-4'></div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            goToNextRecipient();
            setIsDropdownOpen(false);
          }}
          disabled={currentRecipientIndex === signerRecipients.length - 1}
          className='h-8 px-2 flex-1'
        >
          Next Signer
          <ChevronRight className='h-4 w-4 ml-1' />
        </Button>
      </div>
    </div>
  );
};

// Moved inside the component
export default function FieldPlacement() {
  // Instead of directly using useDocumentFlow, we'll use a pattern that's safe
  // by accessing the DocumentFlow context through the existing hook
  const documentFlowState = useDocumentFlow();
  const { state, dispatch } = documentFlowState || {
    state: { document: { url: undefined } } as DocumentFlowState,
    dispatch: () => {},
  };

  // Define a local useState for form placement mode to ensure it's always functional
  const [localFormPlacementMode, setLocalFormPlacementMode] = useState(false);

  // Extract recipients from the document flow state
  const recipients = state.recipients || [];

  // Wrap the component content with the FormPlacementProvider to ensure context is available
  return (
    <FormPlacementProvider recipients={recipients}>
      <FieldPlacementContent localMode={localFormPlacementMode} setLocalMode={setLocalFormPlacementMode} documentState={state} documentDispatch={dispatch} />
    </FormPlacementProvider>
  );
}

// Separate content component that uses the FormPlacementContext
function FieldPlacementContent({
  localMode,
  setLocalMode,
  documentState,
  documentDispatch,
}: {
  localMode: boolean;
  setLocalMode: React.Dispatch<React.SetStateAction<boolean>>;
  documentState: any;
  documentDispatch: any;
}) {
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const viewerInstanceRef = useRef<NutrientViewerInstance | null>(null);

  // Use FormPlacementContext for field tracking
  const {
    formPlacementMode,
    setFormPlacementMode,
    currentRecipient,
    currentRecipientIndex,
    signerRecipients,
    goToNextRecipient,
    goToPreviousRecipient,
    recipientColors,
    updateFieldCount,
    allSignersHaveSignatures,
    signersWithoutSignatures,
    recipientHasSignature,
  } = useContext(FormPlacementContext);

  // Synchronize local mode state with context - always in edit mode
  useEffect(() => {
    // Always set edit mode to true
    setFormPlacementMode(true);
    setLocalMode(true);
  }, [setFormPlacementMode, setLocalMode]);

  // Local state for UI-specific features
  const nutrientSDK = useRef<ReturnType<typeof getNutrientViewer>>(null);
  const [fieldPlacements, setFieldPlacements] = useState<{ type: string; position: string; name: string; recipient?: string }[]>([]);
  const [fieldPositions, setFieldPositions] = useState<{ [pageIndex: number]: number }>({});
  const [debugLogs, setDebugLogs] = useState<{ time: string; message: string }[]>([]);

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
    // Create a safe document URL check with proper fallbacks
    const documentUrl = documentState?.document?.url;
    if (!documentUrl) {
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
        if (documentUrl.startsWith('http')) {
          const urlObj = new URL(documentUrl);
          docKey = urlObj.pathname.substring(1);
        } else {
          docKey = documentUrl;
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
  }, [documentState?.document?.url, isViewerLoaded]);

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
          customRenderers: {
            Annotation: getAnnotationRenderers(getNutrientViewerRuntime(), currentRecipient, recipientColors),
          },
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

              // Convert to numbers
              const offsetX = parseFloat(offsetXStr);
              const offsetY = parseFloat(offsetYStr);
              const offsetXPercent = parseFloat(offsetXPercentStr);
              const offsetYPercent = parseFloat(offsetYPercentStr);
              const elementWidth = parseFloat(elementWidthStr);
              const elementHeight = parseFloat(elementHeightStr);

              console.log('Drop offsets:', { offsetX, offsetY, offsetXPercent, offsetYPercent });

              // Find the page element under the drop
              const pageElement = closestByClass(event.target, 'PSPDFKit-Page');
              if (pageElement) {
                const pageIndex = parseInt(pageElement.dataset.pageIndex || '0', 10);
                console.log('Dropped on page element:', pageElement, 'Page index:', pageIndex);

                // Get runtime
                const nutrientRuntime = getNutrientViewerRuntime();
                if (!nutrientRuntime) {
                  console.error('NutrientRuntime not available');
                  return;
                }

                try {
                  // Get dimensions for the field based on type
                  const fieldWidth = fieldType === 'initials' ? 100 : 200;
                  const fieldHeight = 50;

                  // Adjust drop position based on the offset where the user grabbed the element
                  // This is where we use the more reliable percentage approach
                  // Calculate the correct drop position by accounting for the grab offset
                  const adjustedDropX = event.clientX - offsetXPercent * fieldWidth;
                  const adjustedDropY = event.clientY - offsetYPercent * fieldHeight;

                  console.log('Adjusted drop position:', { adjustedDropX, adjustedDropY });

                  // Create a client rect for where we want to place the field
                  const clientRect = new nutrientRuntime.Geometry.Rect({
                    left: adjustedDropX,
                    top: adjustedDropY,
                    width: fieldWidth,
                    height: fieldHeight,
                  });

                  console.log('Client rect:', clientRect);

                  // Convert client coordinates to PDF coordinates
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
                  instance.setViewState((viewState: any) => {
                    if (nutrientRuntime?.InteractionMode.FORM_CREATOR) {
                      return viewState.set('interactionMode', nutrientRuntime.InteractionMode.FORM_CREATOR);
                    }
                    return viewState;
                  });

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
                            recipient: currentRecipient?.email,
                          },
                        ]);

                        // Update the recipient field count in context
                        if (currentRecipient?.email) {
                          updateFieldCount(currentRecipient.email, fieldType, true);
                        }
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
            instance.contentDocument.addEventListener('click', (event: Event) => {
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
              instance.contentDocument.addEventListener('touchstart', (event: Event) => {
                console.log('[Mobile] Touch start event in document viewer');
              });

              // Handle touch move in the document
              instance.contentDocument.addEventListener('touchmove', (event: Event) => {
                if (mobileFieldDragActive && (event as TouchEvent).touches && (event as TouchEvent).touches[0]) {
                  console.log('[Mobile] Touch move with active field:', activeTouchFieldType);
                  event.preventDefault(); // Prevent scrolling during field placement
                }
              });

              // Handle touch end in the document
              instance.contentDocument.addEventListener('touchend', (event: Event) => {
                if (mobileFieldDragActive) {
                  console.log('[Mobile] Touch end with active field:', activeTouchFieldType);

                  // Get touch end position
                  const touchEvent = event as TouchEvent;
                  const touchEndX = touchEvent.changedTouches[0].clientX;
                  const touchEndY = touchEvent.changedTouches[0].clientY;

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
                    const pageIndex = parseInt((pageElement as HTMLElement).dataset?.pageIndex || '0', 10);
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
                    instance.setViewState((viewState: any) => {
                      if (nutrientRuntime?.InteractionMode.FORM_CREATOR) {
                        return viewState.set('interactionMode', nutrientRuntime.InteractionMode.FORM_CREATOR);
                      }
                      return viewState;
                    });

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
              window.addEventListener('nutrient:fieldDragStart', ((event: Event) => {
                const customEvent = event as CustomEvent;
                if (customEvent.detail && customEvent.detail.fieldType) {
                  console.log('[Mobile] Custom field drag start event captured:', customEvent.detail);
                  mobileFieldDragActive = true;
                  activeTouchFieldType = customEvent.detail.fieldType;
                  touchStartX = customEvent.detail.touchX || 0;
                  touchStartY = customEvent.detail.touchY || 0;

                  // IMMEDIATE TEST: Try to create field right away based on event coordinates
                  try {
                    console.log('[Mobile Debug] Testing immediate field creation with:', customEvent.detail);
                    const touchX = customEvent.detail.touchX;
                    const touchY = customEvent.detail.touchY;

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
                      const pageIndex = parseInt((docContainer as HTMLElement).dataset.pageIndex || '0', 10);
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
                        const fieldName = `${customEvent.detail.fieldType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
                        const pdfWidth = customEvent.detail.fieldType === 'initials' ? 75 : 150;
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

                        if (customEvent.detail.fieldType === 'signature') {
                          console.log('[Mobile Debug] Creating signature field');
                          formField = new mobileRuntime.FormFields.SignatureFormField({
                            annotationIds: new mobileRuntime.Immutable.List([widget.id]),
                            name: fieldName,
                          });
                        } else if (customEvent.detail.fieldType === 'initials') {
                          console.log('[Mobile Debug] Creating initials field');
                          formField = new mobileRuntime.FormFields.SignatureFormField({
                            annotationIds: new mobileRuntime.Immutable.List([widget.id]),
                            name: fieldName,
                            type: 'INITIALS',
                          });
                        } else if (customEvent.detail.fieldType === 'date') {
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
                        instance.setViewState((viewState: any) => {
                          if (mobileRuntime?.InteractionMode?.FORM_CREATOR) {
                            return viewState.set('interactionMode', mobileRuntime.InteractionMode.FORM_CREATOR);
                          }
                          return viewState;
                        });

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
                              successMessage.textContent = `${customEvent.detail.fieldType} field added`;
                              document.body.appendChild(successMessage);

                              // Remove the message after a short delay
                              setTimeout(() => {
                                document.body.removeChild(successMessage);
                              }, 1500);

                              // Update field placement list
                              setFieldPlacements((prev) => [
                                ...prev,
                                {
                                  type: customEvent.detail.fieldType,
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

                          const pageIndex = parseInt((firstPage as HTMLElement).dataset.pageIndex || '0', 10);
                          const rect = firstPage.getBoundingClientRect();

                          // Center position
                          const centerX = rect.left + rect.width / 2;
                          const centerY = rect.top + rect.height / 3;

                          setTimeout(() => {
                            createFieldOnPage(
                              customEvent.detail.fieldType,
                              centerX,
                              centerY,
                              firstPage,
                              pageIndex,
                              instance,
                              mobileRuntime,
                              currentRecipient,
                              setFieldPlacements,
                            );
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

            // Set up additional event listeners once the viewer is loaded
            // Add event listener for annotation deletion to update field counts
            instance.addEventListener('annotations.delete', (event: any) => {
              const deletedAnnotations = event.annotations || [];

              console.log('Annotation deletion detected:', deletedAnnotations);

              deletedAnnotations.forEach((annotation: any) => {
                // Check if this is one of our field annotations
                const fieldName = annotation.name;
                if (!fieldName) return;

                // Extract field type from the name
                const fieldType = fieldName.split('_')[0];
                if (!['signature', 'initials', 'date'].includes(fieldType)) return;

                // Try to determine which recipient this field belonged to
                let recipientEmail = null;

                // First check our tracked field placements
                const fieldPlacement = fieldPlacements.find((f) => f.name === fieldName);
                if (fieldPlacement && fieldPlacement.recipient) {
                  recipientEmail = fieldPlacement.recipient;
                } else {
                  // Try to extract from field name (if format includes recipient)
                  const nameParts = fieldName.split('_');
                  if (nameParts.length >= 2) {
                    // Check if any recipient email contains this identifier
                    const identifier = nameParts[1];
                    const matchingRecipient = signerRecipients.find((r) => r.email.includes(identifier) || r.email.split('@')[0] === identifier);

                    if (matchingRecipient) {
                      recipientEmail = matchingRecipient.email;
                    }
                  }
                }

                // If we found a recipient, update their field count
                if (recipientEmail) {
                  console.log(`Decreasing ${fieldType} count for recipient: ${recipientEmail}`);
                  updateFieldCount(recipientEmail, fieldType, false);

                  // Also update our field placements list
                  setFieldPlacements((prev) => prev.filter((field) => field.name !== fieldName));
                }
              });
            });

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
        console.log(`Setting form placement mode: ${localMode ? 'ON' : 'OFF'}`);

        // Get viewer instance
        const instance = viewerInstanceRef.current;

        if (localMode) {
          // Enable form creator mode - explicitly set the mode
          instance.setViewState((viewState: any) => {
            return viewState.set('interactionMode', nutrientRuntime.InteractionMode.FORM_CREATOR);
          });
        } else {
          // Disable form creator mode - reset to default interaction mode
          // Since CONTENT_INTERACTION doesn't exist, use null to reset to default mode
          instance.setViewState((viewState: any) => {
            return viewState.set('interactionMode', null);
          });
        }

        // Add debug message to check if the toggle effect is being called
        console.log(`FormPlacementMode toggled to: ${localMode ? 'ON' : 'OFF'}`);
      }
    }
  }, [localMode, mounted]);

  // Create a complete context value to pass to children
  const formPlacementContextValue = {
    formPlacementMode,
    setFormPlacementMode,
    currentRecipient,
    currentRecipientIndex,
    signerRecipients,
    goToNextRecipient,
    goToPreviousRecipient,
    recipientColors,
    recipientFieldCounts: {}, // Add the missing property
    updateFieldCount,
    allSignersHaveSignatures,
    signersWithoutSignatures,
    recipientHasSignature,
  };

  // Add an effect to update custom renderers when the current recipient changes
  useEffect(() => {
    if (!isViewerLoaded || !viewerInstanceRef.current) return;

    // Get the viewer instance and runtime
    const instance = viewerInstanceRef.current;
    const runtime = getNutrientViewerRuntime();

    if (instance && runtime) {
      // Update the custom renderers with the current recipient
      const newRenderers = {
        Annotation: getAnnotationRenderers(runtime, currentRecipient, recipientColors),
      };

      // Apply the new renderers
      instance.setCustomRenderers(newRenderers);
    }
  }, [currentRecipientIndex, isViewerLoaded, recipientColors]);

  // Update DocumentFlowContext validation state based on field validation status
  useEffect(() => {
    if (mounted && documentDispatch) {
      // If we have a dispatch function available, use it to update validation state
      documentDispatch({
        type: 'VALIDATE_STEP',
        payload: {
          step: 'step3Valid',
          isValid: allSignersHaveSignatures,
        },
      });
    }
  }, [allSignersHaveSignatures, mounted, documentDispatch]);

  // Function to directly create a field at a fixed position for mobile
  const createDirectMobileField = (fieldType: string) => {
    console.log('[Mobile Direct] Creating field of type:', fieldType);
    if (!viewerInstanceRef.current) {
      console.error('[Mobile Direct] Viewer instance not available');
      return;
    }

    const instance = viewerInstanceRef.current;
    const runtime = getNutrientViewerRuntime();

    if (!runtime) {
      console.error('[Mobile Direct] NutrientRuntime not available');
      return;
    }

    // Use the helper function to create the field
    createMobileField(fieldType, instance, runtime);
  };

  return (
    <ViewerContext.Provider value={viewerInstanceRef}>
      <div className='space-y-6'>
        <div>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold tracking-tight'>Field Placement</h2>
            <Badge variant='outline' className='ml-2 flex items-center gap-1'>
              <Tag className='h-3 w-3' />
              <span>v1.3.1</span>
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
                <CardContent className='pt-6 space-y-6'>
                  {/* Signer Dropdown */}
                  {signerRecipients.length > 1 && (
                    <div className='space-y-2'>
                      <h3 className='font-medium mb-1'>Select Signer</h3>
                      <RecipientDropdown />
                    </div>
                  )}

                  {/* Available Fields */}
                  <div className='space-y-2'>
                    <h3 className='font-medium mb-1'>Available Fields</h3>
                    <div className='space-y-2'>
                      <FieldOption icon={<Signature className='h-5 w-5' />} label='Signature' type='signature' />
                      <FieldOption icon={<Edit className='h-5 w-5' />} label='Initials' type='initials' />
                      <FieldOption icon={<CalendarDays className='h-5 w-5' />} label='Date Signed' type='date' />
                    </div>
                  </div>

                  {/* Field Placements */}
                  {fieldPlacements.length > 0 && (
                    <div className='space-y-2'>
                      <h3 className='font-medium mb-1'>Field Placements</h3>
                      <div className='text-xs space-y-1 max-h-[250px] overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded-md p-2'>
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
                                    (annotationElement as HTMLElement).focus();
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

        {/* Validation message for signature fields */}
        {!allSignersHaveSignatures && signerRecipients.length > 0 && (
          <div className='mt-4 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 rounded-md'>
            <div className='flex gap-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' />
              <div>
                <h4 className='font-medium text-amber-800 dark:text-amber-300'>Required Signature Fields</h4>
                <p className='text-sm text-amber-700 dark:text-amber-400 mt-1'>
                  {signersWithoutSignatures.length === 1 ? (
                    <>{signerRecipients.find((r) => r.email === signersWithoutSignatures[0])?.name || 'One recipient'} needs at least one signature field</>
                  ) : (
                    <>
                      {signersWithoutSignatures.length} recipients still need signature fields. Switch between recipients using the controls above to add fields
                      for each signer.
                    </>
                  )}
                </p>
                <div className='mt-2 text-xs text-amber-600 dark:text-amber-500'>
                  <ul className='list-disc pl-4 space-y-1'>
                    {signersWithoutSignatures.map((email) => (
                      <li key={email}>{signerRecipients.find((r) => r.email === email)?.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ViewerContext.Provider>
  );
}
