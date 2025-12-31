import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProductTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    title: 'Projects',
    description: 'Organize your secrets into projects. Each project can have multiple secrets and team members.',
    icon: '📁',
  },
  {
    title: 'Secrets',
    description: 'Store and manage your API keys, passwords, and other sensitive data securely.',
    icon: '🔐',
  },
  {
    title: 'Teams',
    description: 'Collaborate with your team members and manage access to shared projects.',
    icon: '👥',
  },
  {
    title: 'Activity Log',
    description: 'Track all changes and access to your secrets for security and compliance.',
    icon: '📊',
  },
];

export const ProductTour: React.FC<ProductTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleSkip}
    >
      <div
        className="relative max-w-md w-full rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{step.icon}</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {step.title}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {step.description}
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep ? 'w-8' : 'w-2'
              }`}
              style={{
                backgroundColor: index === currentStep
                  ? 'var(--accent-primary)'
                  : index < currentStep
                  ? 'var(--status-success)'
                  : 'var(--border-subtle)',
              }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep === tourSteps.length - 1 ? 'Complete' : 'Next'}
            {currentStep === tourSteps.length - 1 ? (
              <CheckCircle className="h-4 w-4 ml-2" />
            ) : (
              <ArrowRight className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

