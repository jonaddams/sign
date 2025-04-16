'use client';

import { useState } from 'react';
import { DocumentFlowProvider, useDocumentFlow } from '../context/DocumentFlowContext';
import NavigationControls from './NavigationControls';
import StepIndicator from './StepIndicator';

// This will be a wrapper component that includes both the provider and the flow UI
export default function DocumentFlow({ children }: { children: React.ReactNode }) {
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
      case 1: return state.stepValidation.step1Valid;
      case 2: return state.stepValidation.step2Valid;
      case 3: return state.stepValidation.step3Valid;
      case 4: return state.stepValidation.step4Valid;
      default: return false;
    }
  };

  // Function to handle moving to the next step
  const handleNext = async () => {
    if (state.currentStep === state.totalSteps) {
      // This is the final step, handle submission
      try {
        setIsSubmitting(true);
        // Logic to submit the document - will implement in a later step
        console.log('Document submission would happen here');
        // For now, just log the state
        console.log('Document flow state:', state);
      } catch (error) {
        console.error('Error submitting document:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (canMoveForward()) {
      // Move to the next step
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  // Function to handle moving to the previous step
  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <StepIndicator 
        currentStep={state.currentStep} 
        totalSteps={state.totalSteps} 
      />
      
      <div className="mt-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
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