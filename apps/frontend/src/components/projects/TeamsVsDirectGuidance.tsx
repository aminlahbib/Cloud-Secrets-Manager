import React, { useState } from 'react';
import { Info, X, Building2, User, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const TeamsVsDirectGuidance: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 text-body-sm"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--elevation-1)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-accent)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <Info className="h-4 w-4" />
        <span>When to use Teams vs Direct Invitations?</span>
      </button>
    );
  }

  return (
    <div 
      className="rounded-xl border p-4 space-y-4"
      style={{
        borderColor: 'var(--border-accent)',
        backgroundColor: 'var(--elevation-1)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
          Teams vs Direct Invitations
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teams */}
        <div 
          className="rounded-lg border p-4"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-primary-glow)' }}
            >
              <Building2 className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h4 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
              Use Teams For
            </h4>
          </div>
          <ul className="space-y-2 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Multiple people need access to multiple projects</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Department or group organization</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Bulk access management (add once, access many)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Team members automatically get VIEWER access</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              <strong>Example:</strong> Engineering Team → All engineering projects
            </p>
          </div>
        </div>

        {/* Direct Invitations */}
        <div 
          className="rounded-lg border p-4"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-primary-glow)' }}
            >
              <User className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h4 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
              Use Direct Invitations For
            </h4>
          </div>
          <ul className="space-y-2 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Specific roles (ADMIN, MEMBER) on individual projects</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Project-specific collaborators</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Temporary or contractor access</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span>Fine-grained permission control</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              <strong>Example:</strong> Invite a contractor as MEMBER to one project
            </p>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg p-3"
        style={{ backgroundColor: 'var(--accent-primary-glow)' }}
      >
        <p className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
          <strong>💡 Tip:</strong> You can use both! Add projects to teams for bulk VIEWER access, 
          then use direct invitations for specific roles (ADMIN, MEMBER) on individual projects.
        </p>
      </div>
    </div>
  );
};

