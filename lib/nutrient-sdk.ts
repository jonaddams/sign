/**
 * Utility functions for working with Nutrient Viewer SDK
 */
import type * as NutrientViewerSDK from '@nutrient-sdk/viewer';

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
 * Type-safe wrapper for creating a Nutrient Viewer instance
 * @param options Configuration options for the Nutrient Viewer instance
 * @returns Promise resolving to the Nutrient Viewer instance
 */
export function createNutrientViewerInstance(options: {
  container: HTMLElement;
  document: string;
  toolbarItems?: any[];
  licenseKey?: string;
  [key: string]: any;
}): Promise<any> {
  if (typeof window === 'undefined' || !window.NutrientViewer) {
    return Promise.reject(new Error('Nutrient Viewer SDK not loaded'));
  }

  // Access the load method directly from window.NutrientViewer
  // This bypasses the TypeScript definitions that don't include the load method
  if (typeof window.NutrientViewer.load === 'function') {
    // Explicitly wrap in a Promise to ensure proper type
    return Promise.resolve(window.NutrientViewer.load(options));
  }

  return Promise.reject(new Error('Nutrient Viewer load method not available'));
}
