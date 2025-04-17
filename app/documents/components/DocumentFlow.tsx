"use client";

import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  DocumentFlowProvider,
  useDocumentFlow,
} from "../context/DocumentFlowContext";
import NavigationControls from "./NavigationControls";
import StepIndicator from "./StepIndicator";

// This will be a wrapper component that includes both the provider and the flow UI
export default function DocumentFlow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocumentFlowProvider>
      <DocumentFlowContent>{children}</DocumentFlowContent>
    </DocumentFlowProvider>
  );
}

// Separate component to use the context inside the provider
function DocumentFlowContent({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useDocumentFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Get file type and size from the URL
      const fileType = fileUrl.split(".").pop() || "";

      // Call the templates API to save the template
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: documentTitle,
          file_url: fileUrl,
          file_type: fileType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      // Display success message
      toast({
        title: "Template Saved",
        description: "Your document has been saved as a template.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle moving to the next step
  const handleNext = async () => {
    if (state.currentStep === state.totalSteps) {
      // This is the final step, handle submission
      try {
        setIsSubmitting(true);
        // Logic to submit the document - will implement in a later step
        console.log("Document submission would happen here");
        // For now, just log the state
        console.log("Document flow state:", state);
      } catch (error) {
        console.error("Error submitting document:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (canMoveForward()) {
      // If moving from step 1 and user wants to save as template
      if (state.currentStep === 1 && state.document.saveAsTemplate) {
        await saveAsTemplate();
      }

      // Move to the next step
      dispatch({ type: "SET_STEP", payload: state.currentStep + 1 });
    }
  };

  // Function to handle moving to the previous step
  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: "SET_STEP", payload: state.currentStep - 1 });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <StepIndicator
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
      />

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        {children}
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
