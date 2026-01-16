/**
 * Utility functions and types for working with Nutrient Viewer SDK
 */
import type * as NutrientViewerSDK from '@nutrient-sdk/viewer';

/**
 * Extended interface that includes the runtime properties not covered in the official type definitions
 */
export interface NutrientViewerRuntime {
  load: (options: any) => Promise<any>;
  unload: (container: HTMLElement | null) => void;
  Geometry: {
    Rect: new (options: { left: number; top: number; width: number; height: number }) => any;
  };
  Annotations: {
    WidgetAnnotation: new (options: {
      boundingBox: any;
      formFieldName: string;
      id: string;
      pageIndex: number;
      name: string;
    }) => any;
  };
  FormFields: {
    SignatureFormField: new (options: { annotationIds: any; name: string; type?: string }) => any;
    TextFormField: new (options: { annotationIds: any; name: string; defaultValue?: string }) => any;
  };
  Immutable: {
    List: new (items: any[]) => any;
  };
  InteractionMode: {
    FORM_CREATOR: string;
  };
  ElectronicSignatureCreationMode: {
    DRAW: string;
    IMAGE: string;
    TYPE: string;
  };
  generateInstantId: () => string;
}

/**
 * Safely gets the Nutrient Viewer SDK with proper TypeScript typing
 * @returns The Nutrient Viewer SDK instance with proper typing or null if not available
 */
export function getNutrientViewer(): typeof NutrientViewerSDK | null {
  if (typeof window === 'undefined' || !window.NutrientViewer) {
    return null;
  }

  return window.NutrientViewer as unknown as typeof NutrientViewerSDK;
}

/**
 * Safely gets the Nutrient Viewer SDK with complete runtime properties
 * @returns The Nutrient Viewer SDK instance with runtime properties or null if not available
 */
export function getNutrientViewerRuntime(): NutrientViewerRuntime | null {
  if (typeof window === 'undefined' || !window.NutrientViewer) {
    return null;
  }

  return window.NutrientViewer as unknown as NutrientViewerRuntime;
}

/**
 * Safely unloads the Nutrient Viewer
 * @param container The container element to unload the viewer from
 */
export function safeUnloadViewer(container: HTMLElement | null): void {
  if (typeof window === 'undefined' || !window.NutrientViewer || !container) {
    return;
  }

  try {
    if (typeof window.NutrientViewer.unload === 'function') {
      window.NutrientViewer.unload(container);
    }
  } catch (error) {
    // Suppress Nutrient Viewer internal errors during unload
    // These are often harmless and related to cleanup timing
    console.warn('Nutrient Viewer unload warning (safe to ignore):', error);
  }

  // Ensure container is completely empty after unload
  // This prevents "container is not empty" errors on reload
  try {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  } catch (error) {
    console.warn('Container cleanup warning:', error);
  }
}

/**
 * Safely loads the Nutrient Viewer
 * @param options Configuration options for loading the viewer
 * @returns Promise resolving to the viewer instance
 */
export function safeLoadViewer(options: {
  container: HTMLElement;
  document: string;
  toolbarItems?: any[];
  licenseKey?: string;
  [key: string]: any;
}): Promise<any> {
  if (typeof window === 'undefined' || !window.NutrientViewer) {
    return Promise.reject(new Error('Nutrient Viewer not available'));
  }

  // Ensure container is completely empty before loading
  // This prevents "container is not empty" errors
  const container = options.container;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (typeof window.NutrientViewer.load === 'function') {
    return Promise.resolve().then(() => window.NutrientViewer?.load(options));
  }

  return Promise.reject(new Error('Nutrient Viewer load method not available'));
}

/**
 * Helper function to find the closest element with a specific class
 * Used for finding PSPDFKit-Page elements in the viewer
 */
export function closestByClass(el: any, className: string): any {
  return el?.classList?.contains(className) ? el : el ? closestByClass(el.parentNode, className) : null;
}
