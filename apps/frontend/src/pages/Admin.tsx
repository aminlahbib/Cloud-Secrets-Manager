import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Clock, Edit2 } from 'lucide-react';
import { adminService } from '../services/admin';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const ROLES = ['USER', 'MANAGER', 'ADMIN'];

const ROLE_COLORS: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  USER: 'default',
  MANAGER: 'info',
  ADMIN: 'danger',
};

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.listUsers(),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
      setNewRole('');
    },
  });

  const handleEditRole = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.primaryRole ?? 'USER');
  };

  const handleSaveRole = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage user roles and permissions
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Admin Access Required
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Only administrators can view and modify user roles. Changes take
              effect immediately.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-red-800 mb-2">
            Failed to load users
          </p>
          <p className="text-sm text-red-700 mb-2">
            {error instanceof Error ? error.message : 'You may not have admin permissions or the service account may lack required permissions.'}
          </p>
          {(() => {
            if (!error || typeof error !== 'object' || !('response' in error)) {
              return null;
            }
            
            const errorWithResponse = error as { response?: { data?: unknown } };
            
            if (!errorWithResponse.response || 
                typeof errorWithResponse.response !== 'object' || 
                !('data' in errorWithResponse.response) ||
                typeof errorWithResponse.response.data !== 'object' ||
                errorWithResponse.response.data === null) {
              return null;
            }
            
            const responseData = errorWithResponse.response.data as Record<string, unknown>;
            
            return (
              <div className="mt-2 text-xs text-red-600 space-y-1">
                {('details' in responseData) && (
                  <p className="font-medium">Details: {String(responseData.details)}</p>
                )}
                {('message' in responseData) && (
                  <p>Message: {String(responseData.message)}</p>
                )}
                {('code' in responseData) && (
                  <p>Error Code: {String(responseData.code)}</p>
                )}
                {('error' in responseData) && (
                  <p>Error: {String(responseData.error)}</p>
                )}
              </div>
            );
          })()}
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-600 font-medium">Troubleshooting:</p>
            <ul className="text-xs text-red-600 mt-1 list-disc list-inside space-y-1">
              <li>Ensure your Firebase service account has "Firebase Admin" role</li>
              <li>Check backend logs for detailed error information</li>
              <li>Verify Firebase Admin SDK is properly initialized</li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!users || users.length === 0) && (
        <EmptyState
          icon={<Users className="h-16 w-16 text-gray-400" />}
          title="No users found"
          description="No users are registered in the system yet."
        />
      )}

      {/* Users List */}
      {!isLoading && !error && users && users.length > 0 && (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.email}
                    </h3>
                    <Badge variant={ROLE_COLORS[user.primaryRole] || 'default'}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.primaryRole}
                    </Badge>
                  </div>

                  {/* Permissions */}
                  {user.permissions && user.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {user.permissions.map((permission: string) => (
                        <Badge key={permission} variant="info">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {user.lastLoginAt && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Last login: {new Date(user.lastLoginAt).toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Joined:{' '}
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 sm:ml-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditRole(user)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Role
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Update User Role"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <p className="text-sm text-gray-900">{selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Role Descriptions
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  <strong>USER:</strong> Can create and manage their own secrets
                </li>
                <li>
                  <strong>MANAGER:</strong> Can manage secrets and view audit
                  logs
                </li>
                <li>
                  <strong>ADMIN:</strong> Full access including user management
                </li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
                isLoading={updateRoleMutation.isPending}
                disabled={newRole === (selectedUser?.primaryRole ?? 'USER')}
              >
                Update Role
              </Button>
            </div>

            {updateRoleMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Failed to update role. Please try again.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

