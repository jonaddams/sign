'use client';

import { CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import PageContent from '@/components/layout/page-content';
import PageLayout from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { getNutrientViewerRuntime, safeLoadViewer, safeUnloadViewer } from '@/lib/nutrient-viewer';
import { createSignatureFieldRenderer } from '@/lib/signature-field-renderer';

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

// Storage keys for signatures
const STORAGE_KEY = 'nutrient_signatures_storage';
const ATTACHMENTS_KEY = 'nutrient_attachments_storage';

// Helper function to convert File/Blob to data URL
const fileToDataURL = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Setup signature storage for the viewer instance
const setupSignatureStorage = async (instance: any, PSPDFKit: any) => {
  console.log('Setting up signature storage...');

  // Load existing stored signatures from localStorage
  try {
    const signaturesString = localStorage.getItem(STORAGE_KEY);
    if (signaturesString) {
      const storedSignatures = JSON.parse(signaturesString);
      const list = PSPDFKit.Immutable.List(storedSignatures.map(PSPDFKit.Annotations.fromSerializableObject));
      instance.setStoredSignatures(list);
      console.log(`Loaded ${storedSignatures.length} stored signatures`);
    }

    // Retrieve and load attachments
    const attachmentsString = localStorage.getItem(ATTACHMENTS_KEY);
    if (attachmentsString) {
      const attachmentsArray = JSON.parse(attachmentsString);
      const blobs = await Promise.all(
        attachmentsArray.map(({ url }: { url: string }) => fetch(url).then((res) => res.blob())),
      );
      for (const blob of blobs) {
        instance.createAttachment(blob);
      }
      console.log(`Loaded ${blobs.length} signature attachments`);
    }
  } catch (err) {
    console.error('Error loading stored signatures:', err);
  }

  // Listen for new signatures being stored
  instance.addEventListener('storedSignatures.create', async (annotation: any) => {
    try {
      const signaturesString = localStorage.getItem(STORAGE_KEY);
      const storedSignatures = signaturesString ? JSON.parse(signaturesString) : [];

      const serializedAnnotation = PSPDFKit.Annotations.toSerializableObject(annotation);

      // Handle image attachments if present
      if (annotation.imageAttachmentId) {
        const attachment = await instance.getAttachment(annotation.imageAttachmentId);
        const url = await fileToDataURL(attachment);

        const attachmentsString = localStorage.getItem(ATTACHMENTS_KEY);
        const attachmentsArray = attachmentsString ? JSON.parse(attachmentsString) : [];
        attachmentsArray.push({ url, id: annotation.imageAttachmentId });
        localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(attachmentsArray));
      }

      storedSignatures.push(serializedAnnotation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSignatures));

      // Update the instance to show the signature in the UI
      instance.setStoredSignatures((signatures: any) => signatures.push(annotation));

      console.log('Signature saved to storage');
    } catch (err) {
      console.error('Error saving signature to storage:', err);
    }
  });

  // Listen for signatures being deleted
  instance.addEventListener('storedSignatures.delete', (annotation: any) => {
    try {
      const signaturesString = localStorage.getItem(STORAGE_KEY);
      const storedSignatures = signaturesString ? JSON.parse(signaturesString) : [];
      const annotations = storedSignatures.map(PSPDFKit.Annotations.fromSerializableObject);
      const updatedAnnotations = annotations.filter((currentAnnotation: any) => !currentAnnotation.equals(annotation));

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedAnnotations.map(PSPDFKit.Annotations.toSerializableObject)),
      );

      // Update the instance UI
      instance.setStoredSignatures((signatures: any) =>
        signatures.filter((signature: any) => !signature.equals(annotation)),
      );

      // Handle attachment deletion if present
      if (annotation.imageAttachmentId) {
        const attachmentsString = localStorage.getItem(ATTACHMENTS_KEY);
        if (attachmentsString) {
          let attachmentsArray = JSON.parse(attachmentsString);
          attachmentsArray = attachmentsArray.filter(
            (attachment: any) => attachment.id !== annotation.imageAttachmentId,
          );
          localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(attachmentsArray));
        }
      }

      console.log('Signature deleted from storage');
    } catch (err) {
      console.error('Error deleting signature from storage:', err);
    }
  });
};

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingData, setSigningData] = useState<SigningData | null>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const viewerInstanceRef = useRef<any>(null);
  const isLoadingRef = useRef(false);

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

        console.log('=== SIGNING DATA LOADED ===');
        console.log('Document ID:', data.document.id);
        console.log('Document name:', data.document.name);
        console.log('Document file path:', data.document.filePath);
        console.log('Recipient ID (participant):', data.recipient.id);
        console.log('Recipient name:', data.recipient.name);
        console.log('Recipient email:', data.recipient.email);
        console.log('Signature Request ID:', data.signatureRequest.id);
        console.log('Signature Status:', data.signatureRequest.status);
        console.log('Total participants:', data.participants?.length || 0);
        if (data.annotations?.fields) {
          console.log('Field annotations:', data.annotations.fields.length, 'fields');
          console.log('Field details:', data.annotations.fields);
        }
        console.log('===========================');

        setSigningData(data);

        // Check if already signed
        if (data.signatureRequest.status === 'SIGNED') {
          setIsSigned(true);
          setError('This document has already been signed.');
        }

        // Check if cancelled
        if (data.signatureRequest.status === 'CANCELLED') {
          setError('This document has been cancelled by the sender.');
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
  // Uses containerEl state (set via callback ref) to ensure DOM is ready
  useEffect(() => {
    if (!signingData || !containerEl || isViewerLoaded || isSigned || isLoadingRef.current) {
      return;
    }

    let isMounted = true;
    isLoadingRef.current = true;

    const loadViewer = async () => {
      try {
        console.log('Starting viewer load...');

        // Create proxy URL for the document
        const docKey = signingData.document.filePath.startsWith('http')
          ? new URL(signingData.document.filePath).pathname.substring(1)
          : signingData.document.filePath;

        const proxyUrl = `/api/documents/proxy?key=${encodeURIComponent(docKey)}&proxy=true`;
        console.log('Proxy URL:', proxyUrl);

        const PSPDFKit = getNutrientViewerRuntime();
        if (!PSPDFKit) {
          throw new Error('Nutrient Viewer SDK not loaded');
        }

        // Only load if component is still mounted
        if (!isMounted || !containerEl) {
          console.log('Component unmounted or container lost, aborting load');
          return;
        }

        console.log('Starting Nutrient Viewer load...');

        // Load InstantJSON if available (new approach)
        const instantJSON = signingData.annotations;

        if (instantJSON) {
          console.log('=== LOADING INSTANT JSON ===');
          console.log('Annotations count:', instantJSON?.annotations?.length || 0);
          console.log('Form fields count:', instantJSON?.formFields?.length || 0);
          console.log('============================');
        }

        // Load viewer with signing tools enabled and custom field renderer
        const instance = await safeLoadViewer({
          container: containerEl,
          document: proxyUrl,
          licenseKey: process.env.NEXT_PUBLIC_NUTRIENT_VIEWER_LICENSE_KEY,
          useCDN: true,
          instantJSON: instantJSON, // Load annotations automatically from InstantJSON
          toolbarItems: [
            { type: 'sidebar-thumbnails' },
            { type: 'pager' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'spacer' },
          ],
          styleSheets: ['/styles/viewer.css'],
          customRenderers: {
            Annotation: createSignatureFieldRenderer({
              currentRecipientId: signingData.recipient.id,
              participants: signingData.participants,
            }),
          },
        });

        if (!isMounted) {
          console.log('Component unmounted after viewer load');
          return;
        }

        console.log('Viewer instance created successfully');
        viewerInstanceRef.current = instance;

        // Fields are now loaded automatically from InstantJSON!
        // No manual field creation needed

        // Setup signature storage
        setupSignatureStorage(instance, PSPDFKit);

        if (isMounted) {
          console.log('Setting viewer loaded state');
          setIsViewerLoaded(true);
          isLoadingRef.current = false;
          console.log('Nutrient Viewer loaded for signing successfully with InstantJSON');
        }
      } catch (err) {
        console.error('Error loading viewer:', err);
        if (isMounted) {
          setError('Failed to load document viewer');
          isLoadingRef.current = false;
        }
      }
    };

    loadViewer();

    return () => {
      isMounted = false;
      isLoadingRef.current = false;
      // Always try to unload viewer on cleanup
      if (containerEl) {
        safeUnloadViewer(containerEl);
        viewerInstanceRef.current = null;
      }
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: isViewerLoaded intentionally excluded to prevent cleanup loop that unloads viewer
  }, [signingData, isSigned, containerEl]);

  // Update form field permissions based on current recipient
  // This runs after fields are created to set proper readOnly status
  useEffect(() => {
    const instance = viewerInstanceRef.current;
    const PSPDFKit = getNutrientViewerRuntime();
    if (!instance || !PSPDFKit || !isViewerLoaded || !signingData) return;

    const updateFieldPermissions = async () => {
      try {
        console.log('Updating field permissions for recipient:', signingData.recipient.id);

        const formFields = await instance.getFormFields();
        if (formFields.size === 0) {
          console.log('No form fields to update');
          return;
        }

        // Get all annotations from all pages to find widget customData
        const totalPages = await instance.totalPageCount;
        let allAnnotations: any[] = [];
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const pageAnnotations = await instance.getAnnotations(pageIndex);
          allAnnotations = allAnnotations.concat(pageAnnotations.toArray());
        }

        console.log(`Found ${formFields.size} form fields and ${allAnnotations.length} annotations`);

        for (const field of formFields) {
          // Find the widget annotation associated with this form field
          const widget = allAnnotations.find((ann) => ann.formFieldName === field.name);

          if (widget?.customData) {
            const signerID = widget.customData.signerID;

            // Determine if current recipient can edit this field
            // Use field name to determine ownership (more reliable than signerID which may be empty/wrong)
            // Extract email slug from field name for exact matching
            const parts = field.name.split('_');
            const fieldEmailSlug = parts.length >= 2 ? parts[1].toLowerCase() : '';
            const currentRecipientEmailSlug = signingData.recipient.email
              .split('@')[0]
              .toLowerCase()
              .replace(/\./g, '');
            const fieldBelongsToCurrentRecipient = fieldEmailSlug === currentRecipientEmailSlug;

            const isUserField =
              fieldBelongsToCurrentRecipient || (signerID && signerID !== '' && signerID === signingData.recipient.id);

            const currentReadOnly = field.readOnly || false;
            const newReadOnly = !isUserField;

            // Only update if the value needs to change
            if (currentReadOnly !== newReadOnly) {
              const updatedField = field.set('readOnly', newReadOnly);
              await instance.update(updatedField);
            }
          }
        }

        console.log('Field permissions updated successfully');
      } catch (error) {
        console.error('Error updating field permissions:', error);
      }
    };

    // Small delay to ensure annotations are fully created
    const timeoutId = setTimeout(() => {
      updateFieldPermissions();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [signingData, isViewerLoaded]);

  // Check if all current recipient's fields are filled
  useEffect(() => {
    const instance = viewerInstanceRef.current;
    const PSPDFKit = getNutrientViewerRuntime();
    if (!instance || !PSPDFKit || !isViewerLoaded || !signingData) return;

    const checkFieldCompletion = async () => {
      try {
        console.log('=== FIELD COMPLETION CHECK ===');
        console.log('Recipient email:', signingData.recipient.email);

        const formFields = await instance.getFormFields();
        console.log('Total form fields:', formFields.size);

        if (formFields.size === 0) {
          console.log('No form fields found - setting to false');
          setAllFieldsFilled(false);
          return;
        }

        // Find current recipient's email slug for matching
        const currentEmailSlug = signingData.recipient.email.split('@')[0].toLowerCase().replace(/\./g, '_');
        console.log('Current recipient email slug:', currentEmailSlug);

        // Filter fields that belong to current recipient
        const myFields = [];
        const allFieldNames = [];

        for (const field of formFields.toArray()) {
          const fieldName = field.name;
          allFieldNames.push(fieldName);
          const parts = fieldName.split('_');
          const fieldEmailSlug = parts.length >= 2 ? parts[1].toLowerCase() : '';

          console.log(`Field: ${fieldName}, slug: ${fieldEmailSlug}, matches: ${fieldEmailSlug === currentEmailSlug}`);

          if (fieldEmailSlug === currentEmailSlug) {
            myFields.push(field);
          }
        }

        console.log('All field names:', allFieldNames);
        console.log(`Found ${myFields.length} fields for current recipient`);

        if (myFields.length === 0) {
          // No fields for this recipient - this shouldn't happen but be safe
          console.log('WARNING: No fields found for current recipient, disabling button');
          setAllFieldsFilled(false);
          return;
        }

        // Check each field
        let allFilled = true;
        for (const field of myFields) {
          const fieldType = field.constructor.name;
          const isSignatureField = field instanceof PSPDFKit.FormFields.SignatureFormField;
          const isTextField = field instanceof PSPDFKit.FormFields.TextFormField;

          console.log(
            `Checking field: ${field.name}, type: ${fieldType}, isSignature: ${isSignatureField}, isText: ${isTextField}`,
          );

          if (isSignatureField) {
            // Check if signature field has overlapping annotations (is signed)
            const overlapping = await instance.getOverlappingAnnotations(field);
            console.log(`  Signature field ${field.name}: ${overlapping.size} overlapping annotations`);
            if (overlapping.size === 0) {
              console.log(`  ❌ Signature field ${field.name} is NOT signed`);
              allFilled = false;
              break;
            } else {
              console.log(`  ✓ Signature field ${field.name} is signed`);
            }
          } else if (isTextField) {
            // Check if text/date field has a value
            const value = field.value || '';
            console.log(`  Text field ${field.name}: value = "${value}"`);

            if (!value.trim()) {
              console.log(`  ❌ Text field ${field.name} is empty`);
              allFilled = false;
              break;
            }

            // For date fields, optionally validate format (basic check)
            const fieldName = field.name;
            if (fieldName.startsWith('date_')) {
              // Check if value matches date format (mm/dd/yyyy)
              const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
              if (!datePattern.test(value)) {
                console.log(`  ❌ Date field ${field.name} has invalid format: ${value}`);
                allFilled = false;
                break;
              } else {
                console.log(`  ✓ Date field ${field.name} has valid date`);
              }
            } else {
              console.log(`  ✓ Text field ${field.name} is filled`);
            }
          }
        }

        console.log('=== RESULT: All fields filled:', allFilled, '===');
        setAllFieldsFilled(allFilled);
      } catch (err) {
        console.error('Error checking field completion:', err);
        setAllFieldsFilled(false);
      }
    };

    // Check immediately
    checkFieldCompletion();

    // Listen for form field value changes and annotation changes
    const handleFormFieldUpdate = () => {
      checkFieldCompletion();
    };

    const handleAnnotationCreate = () => {
      checkFieldCompletion();
    };

    const handleAnnotationDelete = () => {
      checkFieldCompletion();
    };

    instance.addEventListener('formFields.update', handleFormFieldUpdate);
    instance.addEventListener('annotations.create', handleAnnotationCreate);
    instance.addEventListener('annotations.delete', handleAnnotationDelete);

    return () => {
      instance.removeEventListener('formFields.update', handleFormFieldUpdate);
      instance.removeEventListener('annotations.create', handleAnnotationCreate);
      instance.removeEventListener('annotations.delete', handleAnnotationDelete);
    };
  }, [signingData, isViewerLoaded]);

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

  // Handle declining to sign
  const handleDecline = useCallback(async () => {
    if (!signingData) return;

    if (!confirm('Are you sure you want to decline signing this document? The sender will be notified.')) {
      return;
    }

    try {
      setIsSigning(true);

      const response = await fetch('/api/sign/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signatureRequestId: signingData.signatureRequest.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline signature');
      }

      toast({
        title: 'Signature Declined',
        description: 'You have declined to sign this document. The sender has been notified.',
      });

      setIsDeclined(true);

      // Redirect after brief delay
      setTimeout(() => {
        router.push('/inbox');
      }, 2000);
    } catch (err) {
      console.error('Error declining signature:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to decline signature',
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
    <PageLayout>
      <PageContent
        title={signingData?.document.name || 'Sign Document'}
        description={
          signingData
            ? `Sent by ${signingData.participants[0]?.name || 'Sender'}${
                signingData.document.expiresAt
                  ? ` • Expires ${new Date(signingData.document.expiresAt).toLocaleDateString()}`
                  : ''
              }`
            : undefined
        }
      >
        {/* Action Buttons */}
        {signingData && !isSigned && !isDeclined && (
          <div className="mb-4 flex justify-between items-start">
            <Button
              onClick={handleDecline}
              disabled={isSigning}
              size="lg"
              variant="destructive"
              className="cursor-pointer"
            >
              Decline to Sign
            </Button>
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={handleSign}
                disabled={isSigning || !allFieldsFilled}
                size="lg"
                className={allFieldsFilled && !isSigning ? 'cursor-pointer' : ''}
              >
                {isSigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Sign Document'
                )}
              </Button>
              {!allFieldsFilled && !isSigning && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Please fill all required fields</p>
              )}
            </div>
          </div>
        )}

        {/* Document Viewer */}
        <div className="h-[calc(100vh-280px)]">
          <Card className="h-full">
            <CardContent className="h-full p-0">
              <div ref={setContainerEl} className="h-full w-full" id="nutrient-signing-container" />
            </CardContent>
          </Card>
        </div>

        {/* Footer with signing info */}
        {signingData && !isSigned && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Signing as:</span> {signingData.recipient.name} (
              {signingData.recipient.email})
            </div>
            <div className="text-sm text-gray-500">
              {signingData.participants.length > 1 && <span>{signingData.participants.length} total signers</span>}
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
