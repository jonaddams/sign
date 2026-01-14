'use client';

import { CheckCircle, FileText, Loader2, ShieldAlert } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { getNutrientViewer, safeLoadViewer, safeUnloadViewer } from '@/lib/nutrient-viewer';

interface DocumentData {
  id: string;
  name: string;
  filePath: string;
  expiresAt?: string;
}

interface RecipientData {
  id: string;
  name: string;
  email: string;
  accessLevel: string;
  signingOrder: number;
}

interface SignatureRequestData {
  id: string;
  status: string;
  requestedAt: string;
}

interface SigningData {
  document: DocumentData;
  recipient: RecipientData;
  signatureRequest: SignatureRequestData;
  annotations: any;
  participants: any[];
}

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingData, setSigningData] = useState<SigningData | null>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  // Verify token and load document data
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        const response = await fetch('/api/sign/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid or expired link');
        }

        const data = await response.json();
        setSigningData(data);

        // Check if already signed
        if (data.signatureRequest.status === 'SIGNED') {
          setIsSigned(true);
          setError('This document has already been signed.');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  // Load document in Nutrient Viewer
  useEffect(() => {
    if (!signingData || !containerRef.current || isViewerLoaded || isSigned) {
      return;
    }

    const loadViewer = async () => {
      try {
        setIsLoading(true);

        // Create proxy URL for the document
        const docKey = signingData.document.filePath.startsWith('http')
          ? new URL(signingData.document.filePath).pathname.substring(1)
          : signingData.document.filePath;

        const proxyUrl = `/api/documents/proxy?key=${encodeURIComponent(docKey)}&proxy=true`;

        const PSPDFKit = getNutrientViewer();
        if (!PSPDFKit) {
          throw new Error('Nutrient Viewer SDK not loaded');
        }

        // Load viewer with signing tools enabled
        const instance = await safeLoadViewer({
          container: containerRef.current!,
          document: proxyUrl,
          licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
          useCDN: true,
          toolbarItems: [
            { type: 'sidebar-thumbnails' },
            { type: 'pager' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'spacer' },
          ],
          styleSheets: ['/styles/viewer.css'],
        });

        viewerInstanceRef.current = instance;
        setIsViewerLoaded(true);
        setIsLoading(false);

        console.log('Nutrient Viewer loaded for signing');
      } catch (err) {
        console.error('Error loading viewer:', err);
        setError('Failed to load document viewer');
        setIsLoading(false);
      }
    };

    loadViewer();

    return () => {
      if (containerRef.current && window.NutrientViewer) {
        safeUnloadViewer(containerRef.current);
      }
    };
  }, [signingData, isViewerLoaded, isSigned]);

  // Handle signature submission
  const handleSign = useCallback(async () => {
    if (!signingData) return;

    try {
      setIsSigning(true);

      const response = await fetch('/api/sign/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signatureRequestId: signingData.signatureRequest.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signature');
      }

      const result = await response.json();

      toast({
        title: 'Document Signed!',
        description: result.allSigned
          ? 'All signatures complete. Document is now finalized.'
          : 'Your signature has been recorded.',
      });

      setIsSigned(true);

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push(`/sign/${token}/success`);
      }, 2000);
    } catch (err) {
      console.error('Error signing document:', err);
      toast({
        title: 'Signature Failed',
        description: err instanceof Error ? err.message : 'Failed to submit signature',
        variant: 'destructive',
      });
    } finally {
      setIsSigning(false);
    }
  }, [signingData, token, router]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !isSigned) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardContent className="flex flex-col items-center py-12">
            <ShieldAlert className="h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already signed state
  if (isSigned && signingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Document Signed</h2>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
              You have successfully signed "{signingData.document.name}"
            </p>
            <p className="mt-4 text-sm text-gray-500">Thank you for completing this signature request.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main signing interface
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {signingData?.document.name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sent by {signingData?.participants[0]?.name || 'Sender'}
                </p>
              </div>
            </div>
            {signingData && !isSigned && (
              <Button onClick={handleSign} disabled={isSigning} size="lg">
                {isSigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Sign Document'
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Document Viewer */}
      <main className="flex-1">
        <div className="mx-auto h-[calc(100vh-80px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Card className="h-full">
            <CardContent className="relative h-full p-0">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading document...</p>
                  </div>
                </div>
              )}

              {signingData && signingData.document.expiresAt && (
                <div className="absolute right-4 top-4 z-20 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  Expires: {new Date(signingData.document.expiresAt).toLocaleDateString()}
                </div>
              )}

              <div ref={containerRef} className="h-full w-full" id="nutrient-signing-container" />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer with signing info */}
      {signingData && !isSigned && (
        <footer className="border-t border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Signing as:</span> {signingData.recipient.name} (
                {signingData.recipient.email})
              </div>
              <div className="text-sm text-gray-500">
                {signingData.participants.length > 1 && (
                  <span>{signingData.participants.length} total signers</span>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
