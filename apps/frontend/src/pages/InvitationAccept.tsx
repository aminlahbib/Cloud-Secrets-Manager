import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { invitationsService } from '../services/invitations';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const InvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const acceptMutation = useMutation({
    mutationFn: () => invitationsService.acceptInvitation(token!),
    onSuccess: () => {
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="h-12 w-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, prompt to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-neutral-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <Mail className="h-8 w-8 text-neutral-700" />
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            You've Been Invited!
          </h1>
          <p className="text-neutral-600 mb-8">
            Sign in or create an account to accept this project invitation.
          </p>
          
          <Link to="/login">
            <Button className="w-full">
              Continue to Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          <p className="mt-6 text-sm text-neutral-500">
            After signing in, you'll automatically join the project.
          </p>
        </div>
      </div>
    );
  }

  // Processing state
  if (acceptMutation.isPending || status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="h-12 w-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Accepting Invitation...
          </h2>
          <p className="text-neutral-600">
            Please wait while we add you to the project.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-neutral-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-neutral-700" />
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome to the Project!
          </h1>
          <p className="text-neutral-600 mb-8">
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="bg-neutral-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-neutral-700" />
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Invitation Failed
        </h1>
        <p className="text-neutral-600 mb-8">
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

