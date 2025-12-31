import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { invitationsService } from '../services/invitations';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const InvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const acceptMutation = useMutation({
    mutationFn: () => invitationsService.acceptInvitation(token!),
    onSuccess: () => {
      // Invalidate all project-related queries since we don't know which project was joined
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', 'recent', user.id] });
        queryClient.invalidateQueries({ queryKey: ['workflows', user.id] });
      }
      // Invalidate all project members queries (will refetch when needed)
      queryClient.invalidateQueries({ queryKey: ['project-members'] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      setStatus('success');
    },
    onError: (error: any) => {
      setStatus('error');
      setErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to accept invitation. It may have expired or already been used.'
      );
    },
  });

  useEffect(() => {
    // If user is authenticated and we have a token, try to accept
    if (isAuthenticated && token && status === 'pending' && !acceptMutation.isPending) {
      acceptMutation.mutate();
    }
  }, [isAuthenticated, token, status]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center" style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-xl)' }}>
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to signup with invitation token
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading && token) {
      navigate(`/signup?invite=${token}`);
    }
  }, [isAuthenticated, isAuthLoading, token, navigate]);

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center" style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-xl)' }}>
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Redirecting to signup...</p>
        </div>
      </div>
    );
  }

  // Processing state
  if (acceptMutation.isPending || status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center" style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-xl)' }}>
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Accepting Invitation...
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please wait while we add you to the project.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--elevation-1)' }}>
            <CheckCircle className="h-8 w-8" style={{ color: 'var(--status-success)' }} />
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome to the Project!
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            You've successfully joined the project. You can now access its secrets and collaborate with your team.
          </p>
          
          <Button onClick={() => navigate('/projects')} className="w-full">
            Go to Projects
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--elevation-1)' }}>
          <XCircle className="h-8 w-8" style={{ color: 'var(--status-danger)' }} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Invitation Failed
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          {errorMessage}
        </p>
        
        <div className="space-y-3">
          <Button onClick={() => navigate('/projects')} className="w-full">
            Go to Projects
          </Button>
          <Button variant="secondary" onClick={() => navigate('/home')} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

