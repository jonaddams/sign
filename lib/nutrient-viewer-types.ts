/**
 * Type definitions for Nutrient Viewer SDK from CDN
 *
 * This file re-exports types from the official @nutrient-sdk/viewer package
 * for use with the CDN-loaded version of the SDK.
 */

// Import all types from the official SDK package
import type * as NutrientViewerTypes from '@nutrient-sdk/viewer';

// Re-export all types for use throughout the application
export * from '@nutrient-sdk/viewer';

/**
 * Safely gets the Nutrient Viewer SDK with proper TypeScript typing
 */
export function getNutrientViewer(): typeof NutrientViewerTypes | null {
  if (typeof window === 'undefined' || !window.NutrientViewer) {
    return null;
  }

  return window.NutrientViewer as unknown as typeof NutrientViewerTypes;
}

// Don't redeclare Window interface here - instead, augment the existing one in your app
// This avoids the TypeScript error about conflicting declarations
