'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { DocumentFlowProvider, useDocumentFlow } from '../context/DocumentFlowContext';
import { useViewerInstance } from '../context/ViewerInstanceContext';
import NavigationControls from './NavigationControls';
import StepIndicator from './StepIndicator';

// This will be a wrapper component that includes both the provider and the flow UI
export default function DocumentFlow({ children }: { children: (state: any) => React.ReactNode }) {
  return (
    <DocumentFlowProvider>
      <DocumentFlowContent>{children}</DocumentFlowContent>
    </DocumentFlowProvider>
  );
}

// Separate component to use the context inside the provider
function DocumentFlowContent({ children }: { children: (state: any) => React.ReactNode }) {
  const { state, dispatch } = useDocumentFlow();
  const { viewerInstanceRef } = useViewerInstance();
  const [isSubmitting, _setIsSubmitting] = useState(false);

  // Function to check if we can proceed to the next step
  const canMoveForward = () => {
    switch (state.currentStep) {
      case 1:
        return state.stepValidation.step1Valid;
      case 2:
        return state.stepValidation.step2Valid;
      case 3:
        return state.stepValidation.step3Valid;
      case 4:
        return state.stepValidation.step4Valid;
      default:
        return false;
    }
  };

  // Function to save document as template
  const saveAsTemplate = async () => {
    if (!state.document.url) return;

    try {
      // Get document details from state
      const documentTitle = state.document.templateName || state.document.title;
      const fileUrl = state.document.url;

      // Get file type from the URL
      const fileType = fileUrl.split('.').pop() || '';

      // Get file size from state if available or use 0 as fallback
      const fileSize = state.document.fileSize || 0;

      // Call the templates API to save the template
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: documentTitle,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      // Display success message
      toast({
        title: 'Template Saved',
        description: 'Your document has been saved as a template.',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Function to create document in database
  const createDocument = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.document.title,
          documentFilePath: state.document.url,
          templateId: state.document.templateId,
          expiresAt: state.document.expiresAt?.toISOString(),
          size: state.document.fileSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const { document } = await response.json();

      // Save document ID to state
      dispatch({ type: 'SET_DOCUMENT_ID', payload: document.id });

      return document.id;
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Function to save recipients to database
  const saveRecipients = async () => {
    if (!state.document.id) {
      console.error('Cannot save recipients: document ID is missing');
      return;
    }

    try {
      // Build recipients list
      let recipientsList = state.recipients.map((r) => ({
        name: r.name,
        email: r.email,
        accessLevel: r.role.toUpperCase(),
        signingOrder: state.signingOrder === 'sequential' ? r.signingOrder : 0,
        isRequired: r.role === 'signer',
      }));

      // If user will sign and there are no other recipients (they're the only signer),
      // add them as a recipient. The backend will use the session user's ID.
      if (state.userWillSign && state.recipients.length === 0 && state.userDisplayName) {
        recipientsList = [
          {
            name: state.userDisplayName,
            email: '', // Empty email signals backend to use session user
            accessLevel: 'SIGNER',
            signingOrder: 0,
            isRequired: true,
          },
        ];
      }

      const response = await fetch(`/api/documents/${state.document.id}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientsList,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipients');
      }
    } catch (error) {
      console.error('Error saving recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipients. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Function to save field annotations to database
  const saveFieldAnnotations = async () => {
    if (!state.document.id) {
      console.error('Cannot save fields: document ID is missing');
      return;
    }

    try {
      // Get viewer instance from context
      const viewerInstance = viewerInstanceRef.current;

      if (!viewerInstance) {
        console.error('Viewer instance not available');
        toast({
          title: 'Error',
          description: 'Viewer not ready. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Export InstantJSON from viewer
      console.log('=== EXPORTING INSTANT JSON ===');
      const instantJSON = await viewerInstance.exportInstantJSON();

      console.log('Document ID:', state.document.id);
      console.log('Annotations count:', instantJSON?.annotations?.length || 0);
      console.log('Form fields count:', instantJSON?.formFields?.length || 0);
      console.log('============================');

      const response = await fetch(`/api/documents/${state.document.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationData: instantJSON,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save field annotations');
      }

      console.log('InstantJSON saved successfully');
    } catch (error) {
      console.error('Error saving field annotations:', error);
      toast({
        title: 'Error',
        description: 'Failed to save field placements. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Function to handle moving to the next step
  const handleNext = async () => {
    if (state.currentStep === state.totalSteps) {
      // Document submission is now handled in the ReviewAndSend component
      // No need to do anything special here, just let the UI component handle it
      return;
    } else if (canMoveForward()) {
      // If moving from step 1, create the document in the database
      if (state.currentStep === 1 && !state.document.id) {
        try {
          await createDocument();

          // If user wants to save as template, do that too
          if (state.document.saveAsTemplate) {
            await saveAsTemplate();
          }
        } catch {
          // Don't proceed if document creation failed
          return;
        }
      }

      // If moving from step 2, save recipients to the database
      if (state.currentStep === 2) {
        try {
          await saveRecipients();
        } catch {
          // Don't proceed if recipient saving failed
          return;
        }
      }

      // If moving from step 3, save field annotations to the database
      if (state.currentStep === 3) {
        try {
          await saveFieldAnnotations();
        } catch {
          // Don't proceed if field annotation saving failed
          return;
        }
      }

      // Move to the next step
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    } else {
      // If we can't move forward, dispatch a custom event to trigger validation in the current step
      window.dispatchEvent(new Event('beforeDocumentFlowNext'));
    }
  };

  // Function to handle moving to the previous step
  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  return (
    <div className="mx-auto w-full px-0 py-8 sm:px-4">
      <StepIndicator currentStep={state.currentStep} totalSteps={state.totalSteps} />

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        {typeof children === 'function' ? children(state) : children}
      </div>

      <NavigationControls
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
        canMoveForward={canMoveForward()}
        onNext={handleNext}
        onBack={handleBack}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
