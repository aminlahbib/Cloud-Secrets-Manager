// ============================================================================
// Cloud Secrets Manager - Type Definitions (v3 Architecture)
// ============================================================================

// ----------------------------------------------------------------------------
// User & Authentication
// ----------------------------------------------------------------------------

export type PlatformRole = 'USER' | 'PLATFORM_ADMIN';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'LIST' | 'ROTATE' | 'SHARE';

export interface User {
  id: string;
  firebaseUid?: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  platformRole: PlatformRole;
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  twoFactorType?: 'TOTP' | 'EMAIL' | 'SMS';
}

export interface LoginRequest {
  email?: string;
  password?: string;
  idToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
  intermediateToken?: string;
  twoFactorType?: string;
}

export interface UserPreferencesResponse {
  notifications: {
    email: boolean;
    secretExpiration: boolean;
    secretExpirationInApp?: boolean;
    secretExpirationEmail?: boolean;
    projectInvitations: boolean;
    projectInvitationsInApp?: boolean;
    projectInvitationsEmail?: boolean;
    securityAlerts: boolean;
    securityAlertsInApp?: boolean;
    securityAlertsEmail?: boolean;
    roleChangedInApp?: boolean;
    roleChangedEmail?: boolean;
  };
  timezone: string;
  dateFormat: string;
}

// ----------------------------------------------------------------------------
// Workflows (Personal Organization)
// ----------------------------------------------------------------------------

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  projects?: WorkflowProject[];
}

export interface WorkflowProject {
  id: string;
  workflowId: string;
  projectId: string;
  displayOrder: number;
  addedAt: string;
  project?: Project;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
}

export interface ReorderWorkflowsRequest {
  workflowIds: string[];
}

// ----------------------------------------------------------------------------
// Projects (Collaboration Unit)
// ----------------------------------------------------------------------------

export interface ProjectTeamInfo {
  teamId: string;
  teamName: string;
}

export type ProjectAccessSource = 'DIRECT' | 'TEAM' | 'BOTH';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  scheduledPermanentDeleteAt?: string;
  isArchived: boolean;
  memberCount?: number;
  secretCount?: number;
  currentUserRole?: ProjectRole;
  workflowId?: string; // Optional: ID of the workflow this project belongs to (computed on frontend)
  workflowName?: string; // Optional: Name of the workflow (computed on frontend)
  teams?: ProjectTeamInfo[]; // Teams this project belongs to (where user is a member)
  accessSource?: ProjectAccessSource; // How user accesses this project: DIRECT, TEAM, or BOTH
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  workflowId?: string; // Optional: which workflow to add it to
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// ----------------------------------------------------------------------------
// Project Memberships
// ----------------------------------------------------------------------------

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  invitedBy?: string;
  joinedAt: string;
  user?: User;
}

export interface InviteMemberRequest {
  email: string;
  role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
  role: ProjectRole;
}

export interface TransferOwnershipRequest {
  newOwnerUserId: string;
}

// ----------------------------------------------------------------------------
// Project Invitations
// ----------------------------------------------------------------------------

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: ProjectRole;
  invitedBy: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  status: InvitationStatus;
  project?: Project;
  inviter?: User;
}

// ----------------------------------------------------------------------------
// Secrets (within Projects)
// ----------------------------------------------------------------------------

export interface Secret {
  id: string;
  projectId?: string; // Optional for legacy API compatibility
  secretKey: string;
  key?: string; // Legacy alias for secretKey
  value?: string; // Only returned when decrypted
  encryptedValue?: string;
  description?: string;
  tags?: string[];
  version?: number;
  secretVersions?: SecretVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  expired?: boolean;
  creator?: User;
}

export interface CreateSecretRequest {
  secretKey: string;
  value: string;
  description?: string;
  expiresAt?: string;
}

export interface UpdateSecretRequest {
  value?: string;
  description?: string;
  expiresAt?: string;
}

export interface MoveSecretRequest {
  targetProjectId: string;
}

export interface CopySecretRequest {
  targetProjectId: string;
  newKey?: string; // Optional: rename when copying
}

// ----------------------------------------------------------------------------
// Secret Versions
// ----------------------------------------------------------------------------

export interface SecretVersion {
  id: string | number;
  secretId?: string;
  secretKey?: string; // Legacy field
  versionNumber: number;
  createdBy?: string;
  changedBy?: string; // Legacy alias for createdBy
  createdAt: string;
  changeNote?: string;
  changeDescription?: string; // Legacy alias for changeNote
  creator?: User;
}

export interface SecretVersionDetail extends SecretVersion {
  value: string;
}

// ----------------------------------------------------------------------------
// Audit Logs
// ----------------------------------------------------------------------------

export type AuditAction = 
  | 'SECRET_CREATE' | 'SECRET_READ' | 'SECRET_UPDATE' | 'SECRET_DELETE' 
  | 'SECRET_ROTATE' | 'SECRET_MOVE' | 'SECRET_COPY'
  | 'PROJECT_CREATE' | 'PROJECT_UPDATE' | 'PROJECT_ARCHIVE' | 'PROJECT_RESTORE' | 'PROJECT_DELETE'
  | 'MEMBER_INVITE' | 'MEMBER_JOIN' | 'MEMBER_REMOVE' | 'MEMBER_ROLE_CHANGE'
  | 'WORKFLOW_CREATE' | 'WORKFLOW_UPDATE' | 'WORKFLOW_DELETE'
  // Legacy actions for backwards compatibility
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ROTATE' | 'SHARE' | 'UNSHARE';

export type ResourceType = 'SECRET' | 'PROJECT' | 'MEMBER' | 'WORKFLOW' | 'INVITATION';

export interface AuditLog {
  id: string;
  projectId?: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  // Human-readable description (generated by audit service)
  description?: string;
  // Enriched user data (added by proxy service)
  userEmail?: string;
  userDisplayName?: string;
  // Computed/joined fields (for backward compatibility)
  user?: User;
  project?: Project;
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------

export interface SecretsListParams {
  page?: number;
  size?: number;
  keyword?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface SecretsListResponse extends PaginatedResponse<Secret> {}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: string;
  errors?: Record<string, string[]>;
}

// ----------------------------------------------------------------------------
// Dashboard & Stats
// ----------------------------------------------------------------------------

export interface DashboardStats {
  totalProjects: number;
  totalSecrets: number;
  recentActivity: AuditLog[];
  expiringSecrets: Secret[];
}

export interface ProjectStats {
  secretCount: number;
  memberCount: number;
  recentActivity: AuditLog[];
}

// ----------------------------------------------------------------------------
// Form Types
// ----------------------------------------------------------------------------

export interface SecretFormValues {
  key: string;
  value: string;
  description?: string;
  expiresAt?: Date;
}

export interface SecretFormData {
  key: string;
  value: string;
  description?: string;
  tags?: string;
  expiresAt?: Date;
}

// ----------------------------------------------------------------------------
// Teams (Team Collaboration)
// ----------------------------------------------------------------------------

export type TeamRole = 'TEAM_OWNER' | 'TEAM_ADMIN' | 'TEAM_MEMBER';

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  creatorName?: string;
  creatorEmail?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  memberCount?: number;
  projectCount?: number;
  currentUserRole?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  role: TeamRole;
  joinedAt: string;
}

export interface TeamMemberRequest {
  email: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRoleRequest {
  role: TeamRole;
}

export interface BulkInviteRequest {
  members: TeamMemberRequest[];
}

export interface TeamProject {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  addedBy: string;
  addedByName?: string;
  addedAt: string;
}
