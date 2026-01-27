'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getNutrientViewerRuntime, safeLoadViewer, safeUnloadViewer } from '@/lib/nutrient-viewer';
import { createPreviewFieldRenderer } from '@/lib/preview-field-renderer';

interface SignatureStatus {
  participantId: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'CANCELLED';
  participantName: string;
  participantEmail: string;
}

interface DocumentViewerProps {
  documentFilePath: string;
  annotations: any;
  signatureStatuses: SignatureStatus[];
  height?: string;
}

export function DocumentViewer({
  documentFilePath,
  annotations,
  signatureStatuses,
  height = '600px',
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize JSON stringification to prevent unnecessary re-renders
  const signatureStatusesJson = useMemo(() => JSON.stringify(signatureStatuses), [signatureStatuses]);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    const loadViewer = async () => {
      if (isLoadingRef.current || !container || !isMounted) {
        return;
      }

      isLoadingRef.current = true;

      try {
        setError(null);

        const PSPDFKit = getNutrientViewerRuntime();
        if (!PSPDFKit) {
          throw new Error('Nutrient Viewer SDK not loaded');
        }

        // Ensure any existing instance is unloaded first
        safeUnloadViewer(container);

        const docKey = documentFilePath.startsWith('http')
          ? new URL(documentFilePath).pathname.substring(1)
          : documentFilePath;

        const proxyUrl = `/api/documents/proxy?key=${encodeURIComponent(docKey)}&proxy=true`;

        if (!isMounted) {
          isLoadingRef.current = false;
          return;
        }

        const parsedStatuses = JSON.parse(signatureStatusesJson) as SignatureStatus[];

        const instance = await safeLoadViewer({
          container,
          document: proxyUrl,
          licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
          useCDN: true,
          instantJSON: annotations,
          isEditableAnnotation: () => false,
          toolbarItems: [
            { type: 'sidebar-thumbnails' },
            { type: 'pager' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'zoom-mode' },
            { type: 'spacer' },
            { type: 'print' },
          ],
          styleSheets: ['/styles/viewer.css'],
          customRenderers: {
            Annotation: createPreviewFieldRenderer({ signatureStatuses: parsedStatuses }),
          },
        });

        if (isMounted) {
          viewerInstanceRef.current = instance;
        }
      } catch (err) {
        console.error('Error loading document viewer:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load document');
        }
      } finally {
        if (isMounted) {
          isLoadingRef.current = false;
        }
      }
    };

    loadViewer();

    return () => {
      isMounted = false;
      isLoadingRef.current = false;
      if (container) {
        safeUnloadViewer(container);
      }
      viewerInstanceRef.current = null;
    };
  }, [documentFilePath, annotations, signatureStatusesJson]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg border"
        style={{ width: '100%', height }}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // For percentage heights, we need the container to fill its parent
  const isPercentageHeight = height.includes('%');

  return (
    <div
      ref={containerRef}
      className={isPercentageHeight ? 'w-full h-full' : 'rounded-lg overflow-hidden border'}
      style={isPercentageHeight ? undefined : { width: '100%', height }}
    />
  );
}
