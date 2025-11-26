import React from 'react';
import { Users, UserPlus, Mail, Building2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Manage team members and access controls</p>
        </div>
        <Button disabled>
          <UserPlus className="w-5 h-5 mr-2" />
          Create Team
          <Badge variant="info" className="ml-2">Coming Soon</Badge>
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Teams Feature Coming Soon!</h2>
            <p className="text-purple-100 max-w-2xl">
              We're building powerful team management features to help you collaborate more effectively. 
              Create teams, assign roles, and manage access across multiple projects with ease.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Workspaces</h3>
          <p className="text-gray-500 text-sm">
            Create dedicated workspaces for your teams with shared projects and secrets.
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Role-Based Access</h3>
          <p className="text-gray-500 text-sm">
            Assign team-wide roles that automatically apply to all team projects.
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Invitations</h3>
          <p className="text-gray-500 text-sm">
            Invite multiple team members at once with customizable access levels.
          </p>
        </Card>
      </div>

      {/* Current User Info */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            In the meantime, you can manage project members directly from each project's settings.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || user.email}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.displayName || user?.email?.split('@')[0]}
              </h3>
              <p className="text-gray-500 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user?.platformRole === 'PLATFORM_ADMIN' ? 'danger' : 'default'}>
                  {user?.platformRole || 'USER'}
                </Badge>
                {user?.createdAt && (
                  <span className="text-xs text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-1">💡 Pro Tip</h4>
        <p className="text-sm text-blue-700">
          While Teams is in development, you can still collaborate by inviting members directly to your projects. 
          Go to any project → Members tab → Invite Member.
        </p>
      </div>
    </div>
  );
};
