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
          <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Teams</h1>
          <p className="mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>Manage team members and access controls</p>
        </div>
        <Button disabled title="Teams feature is coming soon. See details below.">
          <UserPlus className="w-5 h-5 mr-2" />
          Create Team
          <Badge variant="info" className="ml-2">Coming Soon</Badge>
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <div className="card rounded-3xl p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 border rounded-2xl transition-colors duration-300" style={{ borderColor: 'var(--tab-border)', color: 'var(--tab-text-muted)' }}>
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Teams Feature - Coming Soon</h2>
            <p className="max-w-2xl mb-4 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
              We're building powerful team management features to help you collaborate more effectively. 
              Create teams, assign roles, and manage access across multiple projects with ease.
            </p>
            <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: 'var(--elevation-1)', borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>What to expect:</h3>
              <ul className="space-y-1.5 text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                <li>• <strong>Team Workspaces:</strong> Organize projects by team with shared access controls</li>
                <li>• <strong>Bulk Member Management:</strong> Add multiple members to teams at once</li>
                <li>• <strong>Team-Level Permissions:</strong> Set default roles that apply across all team projects</li>
                <li>• <strong>Team Analytics:</strong> Track activity and usage across team projects</li>
                <li>• <strong>Cross-Project Collaboration:</strong> Manage access to multiple projects from a single team view</li>
              </ul>
              <p className="mt-3 text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                <strong>Current workaround:</strong> You can still collaborate by inviting members directly to individual projects. 
                Go to any project → Members tab → Invite Member.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="p-3 rounded-2xl w-fit mb-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)', color: 'var(--tab-text-muted)' }}>
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Team Workspaces</h3>
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
            Create dedicated workspaces for your teams with shared projects and secrets.
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 rounded-2xl w-fit mb-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)', color: 'var(--tab-text-muted)' }}>
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Role-Based Access</h3>
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
            Assign team-wide roles that automatically apply to all team projects.
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 rounded-2xl w-fit mb-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)', color: 'var(--tab-text-muted)' }}>
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Bulk Invitations</h3>
          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
            Invite multiple team members at once with customizable access levels.
          </p>
        </Card>
      </div>

      {/* Current User Info */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b transition-colors duration-300" style={{ borderColor: 'var(--tab-border)', backgroundColor: 'var(--tab-hover-bg)' }}>
          <h2 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>Your Profile</h2>
          <p className="text-sm mt-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)' }}>
                <span className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                {user?.displayName || user?.email?.split('@')[0]}
              </h3>
              <p className="flex items-center gap-1 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user?.platformRole === 'PLATFORM_ADMIN' ? 'owner-admin' : 'default'}>
                  {user?.platformRole || 'USER'}
                </Badge>
                {user?.createdAt && (
                  <span className="text-xs flex items-center transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
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
      <div className="rounded-2xl border p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--tab-hover-bg)', borderColor: 'var(--tab-border)' }}>
        <h4 className="font-medium mb-1 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>💡 Pro tip</h4>
        <p className="text-sm transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
          While Teams is in development, you can still collaborate by inviting members directly to your projects. 
          Go to any project → Members tab → Invite Member.
        </p>
      </div>
    </div>
  );
};
