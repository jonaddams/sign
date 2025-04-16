'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  canMoveForward: boolean;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function NavigationControls({
  currentStep,
  totalSteps,
  canMoveForward,
  onNext,
  onBack,
  isSubmitting = false
}: NavigationControlsProps) {
  const isLastStep = currentStep === totalSteps;
  
  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmitting}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <Button
        onClick={onNext}
        disabled={!canMoveForward || isSubmitting}
        className="flex items-center gap-2"
      >
        {isLastStep ? (
          isSubmitting ? 'Sending...' : 'Send Document'
        ) : (
          <>
            Next <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}