import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Sparkles, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductTour } from '@/components/onboarding/ProductTour';
import { WelcomeTips } from '@/components/onboarding/WelcomeTips';

interface OnboardingStepProps {
  email?: string;
  pendingInvitations: any[];
  onComplete: () => void;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  pendingInvitations,
  onComplete,
}) => {
  const [showTour, setShowTour] = useState(false);
  const [showTips, setShowTips] = useState(true);

  return (
    <div>
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary-glow)' }}
        >
          <Sparkles className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome to Cloud Secrets Manager!
        </h2>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          You're all set. Let's get you started.
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--elevation-1)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            Pending Invitations
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: 'var(--elevation-2)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {invitation.project?.name || 'Unknown Project'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {invitation.role ? `Invited as ${invitation.role}` : 'Project invitation'}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5" style={{ color: 'var(--status-success)' }} />
              </div>
            ))}
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              These invitations have been automatically accepted. You can now access these projects.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setShowTour(true)}
          className="w-full p-4 rounded-lg border transition-all text-left flex items-center gap-3"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--elevation-1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
          }}
        >
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--elevation-2)' }}
          >
            <BookOpen className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Take a Product Tour
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Learn the basics in 2 minutes
            </p>
          </div>
          <ArrowRight className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
        </button>
      </div>

      {/* Welcome Tips */}
      {showTips && (
        <WelcomeTips onDismiss={() => setShowTips(false)} />
      )}

      {/* Complete Button */}
      <Button
        variant="primary"
        className="w-full mt-6"
        onClick={onComplete}
      >
        Get Started
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {/* Product Tour Modal */}
      {showTour && (
        <ProductTour onComplete={() => setShowTour(false)} />
      )}
    </div>
  );
};

