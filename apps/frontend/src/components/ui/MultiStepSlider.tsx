import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  isValid?: boolean; // Whether the step is valid and can proceed
}

interface MultiStepSliderProps {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  title?: string;
}

export const MultiStepSlider: React.FC<MultiStepSliderProps> = ({
  isOpen,
  onClose,
  steps,
  currentStep,
  onStepChange,
  onComplete,
  title,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStepData?.isValid !== false;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (!isFirstStep) {
      // Reset to first step when closing
      onStepChange(0);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 sm:top-16 sm:bottom-0 z-40 transition-opacity"
        style={{
          backgroundColor: 'var(--overlay-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={handleClose}
      />

      {/* Slider Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 top-0 sm:top-16 sm:bottom-4 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md md:max-w-lg lg:w-[640px] flex flex-col transition-transform duration-300 ease-out border-t sm:border-t-0 sm:border-l`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: 'color-mix(in srgb, var(--elevation-1) 82%, transparent)',
          boxShadow: '-18px 0 40px rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(26px) saturate(165%)',
          WebkitBackdropFilter: 'blur(26px) saturate(165%)',
          borderColor: 'var(--border-default)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b transition-colors flex-shrink-0"
          style={{
            borderBottomColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            {title && (
              <h2 className="text-lg font-semibold text-theme-primary">{title}</h2>
            )}
            <div className="flex items-center gap-2 text-sm text-theme-tertiary">
              <span>
                Step {currentStep + 1}/{steps.length}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors text-theme-tertiary hover:text-theme-primary hover:bg-elevation-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Title and Subtitle */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-transparent/0">
          <h3 className="text-xl font-semibold tracking-tight text-theme-primary mb-1">
            {currentStepData.title}
          </h3>
          {currentStepData.subtitle && (
            <p className="text-sm text-theme-secondary leading-relaxed">
              {currentStepData.subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-20">
          <div className="max-w-md mx-auto py-1 space-y-6">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t transition-colors flex-shrink-0"
          style={{
            borderTopColor: 'var(--border-subtle)',
            backgroundColor: 'var(--elevation-1)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {/* Step Indicators */}
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onStepChange(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8'
                      : index < currentStep
                      ? 'w-4'
                      : 'w-1.5'
                  }`}
                  style={{
                    backgroundColor:
                      index === currentStep
                        ? 'var(--accent-primary)'
                        : index < currentStep
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)',
                    opacity: index === currentStep ? 1 : index < currentStep ? 0.6 : 0.3,
                  }}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};


