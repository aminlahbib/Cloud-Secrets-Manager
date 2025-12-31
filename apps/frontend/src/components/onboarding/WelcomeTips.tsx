import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface WelcomeTipsProps {
  onDismiss: () => void;
}

const tips = [
  {
    title: 'Create Your First Project',
    description: 'Start by creating a project to organize your secrets. Projects help you group related secrets together.',
  },
  {
    title: 'Add Secrets Securely',
    description: 'Store API keys, passwords, and tokens securely. All secrets are encrypted and only accessible to authorized team members.',
  },
  {
    title: 'Invite Team Members',
    description: 'Collaborate with your team by inviting members to projects. Control access with roles: Owner, Admin, Member, or Viewer.',
  },
  {
    title: 'Set Expiration Dates',
    description: 'Keep your secrets up to date by setting expiration dates. You\'ll get notified before secrets expire.',
  },
];

export const WelcomeTips: React.FC<WelcomeTipsProps> = ({ onDismiss }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const handlePrevious = () => {
    setCurrentTip((prev) => (prev > 0 ? prev - 1 : tips.length - 1));
  };

  const handleNext = () => {
    setCurrentTip((prev) => (prev < tips.length - 1 ? prev + 1 : 0));
  };

  const tip = tips[currentTip];

  return (
    <div
      className="mb-6 p-4 rounded-lg relative"
      style={{
        backgroundColor: 'var(--elevation-1)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded transition-colors"
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
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'var(--elevation-2)' }}
        >
          <Lightbulb className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            {tip.title}
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {tip.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentTip ? 'w-6' : 'w-1.5'
              }`}
              style={{
                backgroundColor: index === currentTip
                  ? 'var(--accent-primary)'
                  : 'var(--border-subtle)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-1 rounded transition-colors"
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
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded transition-colors"
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
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

