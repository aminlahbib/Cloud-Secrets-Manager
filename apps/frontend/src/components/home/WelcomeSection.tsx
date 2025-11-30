import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const WelcomeSection: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="card rounded-3xl padding-section gradient-hero ambient-glow">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-label text-theme-tertiary mb-2">Dashboard</p>
          <h1 className="text-hero text-theme-primary mt-2">
            Welcome back, {user?.displayName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-body text-theme-secondary mt-3 max-w-2xl">
            Organize secrets, collaborate with teams, and manage workflows in one unified platform.
          </p>
          {isPlatformAdmin && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption font-medium badge-primary">
              <Shield className="h-3.5 w-3.5" />
              Platform administrator
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <Button onClick={() => navigate('/projects')} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button variant="secondary" onClick={() => navigate('/projects')} className="w-full md:w-auto">
            Browse Projects
          </Button>
        </div>
      </div>
    </div>
  );
};

