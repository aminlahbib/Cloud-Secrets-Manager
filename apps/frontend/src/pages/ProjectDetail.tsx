import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Key,
  Users,
  Settings as SettingsIcon,
  Activity,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  Crown,
  UserPlus,
  Mail,
} from 'lucide-react';
import { projectsService } from '../services/projects';
import { secretsService } from '../services/secrets';
import { membersService } from '../services/members';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Secret, ProjectMember, ProjectRole } from '../types';

const ROLE_COLORS: Record<ProjectRole, 'danger' | 'warning' | 'info' | 'default'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

const ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3 mr-1" />,
  ADMIN: <Shield className="h-3 w-3 mr-1" />,
  MEMBER: null,
  VIEWER: null,
};

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('secrets');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('MEMBER');

  // Fetch project details
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
  });

  // Fetch secrets
  const { data: secretsData, isLoading: isSecretsLoading } = useQuery({
    queryKey: ['project-secrets', projectId, searchTerm],
    queryFn: () => secretsService.listProjectSecrets(projectId!, { keyword: searchTerm || undefined }),
    enabled: !!projectId && activeTab === 'secrets',
  });

  // Fetch members
  const { data: members, isLoading: isMembersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['project-members', projectId],
    queryFn: () => membersService.listMembers(projectId!),
    enabled: !!projectId && activeTab === 'members',
  });

  // Delete secret mutation
  const deleteSecretMutation = useMutation({
    mutationFn: (key: string) => secretsService.deleteProjectSecret(projectId!, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-secrets', projectId] });
      setShowDeleteSecretModal(null);
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: () => membersService.inviteMember(projectId!, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => membersService.removeMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  const currentUserRole = project?.currentUserRole;
  const canManageSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' || currentUserRole === 'MEMBER';
  const canDeleteSecrets = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canManageProject = currentUserRole === 'OWNER';

  const secrets = secretsData?.content ?? [];

  if (isProjectLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Project Not Found</h2>
          <p className="text-sm text-red-700 mb-4">
            This project may have been deleted or you don't have access to it.
          </p>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'secrets', label: 'Secrets', icon: Key, count: project.secretCount },
    { id: 'members', label: 'Members', icon: Users, count: project.memberCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {currentUserRole && (
                <Badge variant={ROLE_COLORS[currentUserRole]}>
                  {ROLE_ICONS[currentUserRole]}
                  {currentUserRole}
                </Badge>
              )}
              {project.isArchived && (
                <Badge variant="warning">Archived</Badge>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-gray-500">{project.description}</p>
            )}
          </div>
          
          {activeTab === 'secrets' && canManageSecrets && (
            <Button onClick={() => navigate(`/projects/${projectId}/secrets/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Secret
            </Button>
          )}
          
          {activeTab === 'members' && canManageMembers && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'secrets' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search secrets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {isSecretsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : secrets.length === 0 ? (
            <EmptyState
              icon={<Key className="h-16 w-16 text-gray-400" />}
              title={searchTerm ? 'No secrets match your search' : 'No secrets yet'}
              description={
                searchTerm
                  ? 'Try a different search term'
                  : 'Add your first secret to this project'
              }
              action={
                canManageSecrets
                  ? {
                      label: 'Add Secret',
                      onClick: () => navigate(`/projects/${projectId}/secrets/new`),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {secrets.map((secret: Secret) => {
                    const isExpired = secret.expired || 
                      (secret.expiresAt && new Date(secret.expiresAt) < new Date());
                    
                    return (
                      <tr key={secret.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`}
                            className="text-sm font-medium text-purple-700 hover:underline"
                          >
                            {secret.secretKey}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(secret.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(secret.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isExpired ? (
                            <Badge variant="danger">Expired</Badge>
                          ) : secret.expiresAt ? (
                            <Badge variant="warning">
                              Expires {new Date(secret.expiresAt).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageSecrets && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/projects/${projectId}/secrets/${encodeURIComponent(secret.secretKey)}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteSecrets && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteSecretModal(secret.secretKey)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {isMembersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !members || members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-16 w-16 text-gray-400" />}
              title="No members"
              description="Invite team members to collaborate on this project"
              action={
                canManageMembers
                  ? {
                      label: 'Invite Member',
                      onClick: () => setShowInviteModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-medium">
                        {(member.user?.displayName || member.user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.displayName || member.user?.email}
                        {member.userId === user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={ROLE_COLORS[member.role]}>
                      {ROLE_ICONS[member.role]}
                      {member.role}
                    </Badge>
                    {canManageMembers && member.userId !== user?.id && member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                        isLoading={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="p-6">
          <EmptyState
            icon={<Activity className="h-16 w-16 text-gray-400" />}
            title="Activity Log"
            description="Recent activity for this project will appear here"
          />
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Settings</h2>
          
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <Input value={project.name} disabled={!canManageProject} readOnly />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                defaultValue={project.description || ''}
                disabled={!canManageProject}
              />
            </div>

            {canManageProject && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-red-600 mb-4">Danger Zone</h3>
                <div className="space-y-3">
                  <Button variant="secondary" className="mr-3">
                    Archive Project
                  </Button>
                  <Button variant="danger">
                    Delete Project
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Delete Secret Modal */}
      <Modal
        isOpen={!!showDeleteSecretModal}
        onClose={() => setShowDeleteSecretModal(null)}
        title="Delete Secret"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{showDeleteSecretModal}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteSecretModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteSecretModal && deleteSecretMutation.mutate(showDeleteSecretModal)}
              isLoading={deleteSecretMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="VIEWER">Viewer - Read-only access</option>
              <option value="MEMBER">Member - Can create and update secrets</option>
              <option value="ADMIN">Admin - Can manage secrets and members</option>
              {currentUserRole === 'OWNER' && (
                <option value="OWNER">Owner - Full control</option>
              )}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              isLoading={inviteMutation.isPending}
              disabled={!inviteEmail}
            >
              Send Invitation
            </Button>
          </div>

          {inviteMutation.isError && (
            <p className="text-sm text-red-600">
              Failed to send invitation. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

