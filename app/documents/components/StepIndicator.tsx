"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[]; // Optional custom step names
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  steps = ["Document", "Recipients", "Fields", "Message", "Review"], // Default step names
}: StepIndicatorProps) {
  const isMobile = useIsMobile();

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={stepNumber}
              className="z-10 flex w-full flex-col items-center"
            >
              {/* Blue progress line for completed steps */}
              {stepNumber !== 1 && isCompleted && (
                <div
                  className="h-1 bg-blue-500"
                  style={{ marginLeft: "-50%", width: "100%" }}
                />
              )}

              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-800",
                    isActive
                      ? "border-blue-500 bg-blue-500 text-white"
                      : isCompleted
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 text-gray-500 dark:border-gray-600",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{stepNumber}</span>
                  )}
                </div>

                {/* Only show step labels on desktop */}
                {!isMobile && (
                  <span
                    className={cn(
                      "mt-2 whitespace-nowrap text-center text-sm",
                      isActive
                        ? "font-medium text-blue-500"
                        : isCompleted
                          ? "text-blue-500"
                          : "text-gray-500",
                    )}
                  >
                    {steps[index]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
