'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[]; // Optional custom step names
}

export default function StepIndicator({ 
  currentStep, 
  totalSteps,
  steps = ["Document", "Recipients", "Fields", "Message", "Review"]  // Default step names
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center w-full">
              {/* Step connector line */}
              {stepNumber !== 1 && (
                <div 
                  className={cn(
                    "h-1 w-full mb-4", 
                    isCompleted ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
                  )}
                  style={{ marginLeft: "-50%", width: "100%" }}
                />
              )}
              
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center rounded-full w-8 h-8 mb-2",
                    isActive 
                      ? "bg-blue-500 text-white border-2 border-blue-500" 
                      : isCompleted 
                        ? "bg-blue-500 text-white" 
                        : "bg-white text-gray-500 border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{stepNumber}</span>
                  )}
                </div>
                <span 
                  className={cn(
                    "text-xs md:text-sm whitespace-nowrap",
                    isActive 
                      ? "text-blue-500 font-medium" 
                      : isCompleted 
                        ? "text-blue-500" 
                        : "text-gray-500"
                  )}
                >
                  {steps[index]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}