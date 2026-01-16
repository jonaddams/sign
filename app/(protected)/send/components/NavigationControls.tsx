'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  isSubmitting = false,
}: NavigationControlsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="mt-6 flex items-center justify-between pt-4">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmitting}
        className="flex cursor-pointer items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {!isLastStep && (
        <Button
          onClick={onNext}
          disabled={!canMoveForward || isSubmitting}
          className="flex cursor-pointer items-center gap-2"
        >
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
