# Cloud Secrets Manager - Architecture Specification v3

> **Version**: 3.0  
> **Date**: November 2024  
> **Status**: Approved for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concepts](#2-core-concepts)
3. [Data Model](#3-data-model)
4. [Permission Matrix](#4-permission-matrix)
5. [User Flows](#5-user-flows)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Structure](#7-frontend-structure)

---

## 1. Overview

### 1.1 Architecture Philosophy

Cloud Secrets Manager uses **Resource-Scoped RBAC** instead of Global RBAC. This means:

- Users don't have global permissions like "can read all secrets"
- Permissions are scoped to **Projects**
- Users organize projects into personal **Workflows** (folders)
- Collaboration happens at the Project level, not the Workflow level

### 1.2 Key Principles

| Principle | Description |
|-----------|-------------|
| **Least Privilege** | Users only access what they need, scoped to specific projects |
| **Self-Service** | Users can create projects and invite collaborators without global admin |
| **Personal Organization** | Workflows let users organize projects their own way |
| **Collaboration-First** | Projects are the unit of sharing, not individual secrets |

### 1.3 Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLATFORM LAYER                           │
│  (Platform Admins - system-wide management, audit, compliance)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                               │
│  (Individual users with their own workflows)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WORKFLOW LAYER                             │
│  (Personal organization - like folders, NOT shared)             │
│  Example: "Work", "Personal", "Side Projects"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PROJECT LAYER                             │
│  (Collaborative - this is where sharing/permissions happen)     │
│  Example: "Backend Services", "Mobile App Config"               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SECRET LAYER                             │
│  (Individual secrets within a project)                          │
│  Example: "API_KEY", "DB_PASSWORD", "JWT_SECRET"                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Concepts

### 2.1 Workflows (Personal Organization)

Workflows are **personal containers** for organizing projects. They are:

- **Per-user**: Each user has their own workflows
- **Not shared**: When you invite someone to a project, they don't see your workflow
- **Flexible**: Users can create, rename, reorder, and delete workflows
- **Auto-created**: Every user gets "My Workflow" on signup

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW VISUALIZATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    User A's View                         │    │
│  │                                                          │    │
│  │  📁 My Workflow (auto-created, default)                  │    │
│  │      └── 📦 Personal API Keys                            │    │
│  │                                                          │    │
│  │  📁 Work                                                 │    │
│  │      ├── 📦 Backend Services (Owner)                     │    │
│  │      └── 📦 Frontend Config (Admin)                      │    │
│  │                                                          │    │
│  │  📁 Side Projects                                        │    │
│  │      └── 📦 Startup MVP (Owner)                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    User B's View                         │    │
│  │         (invited to "Backend Services" by User A)        │    │
│  │                                                          │    │
│  │  📁 My Workflow                                          │    │
│  │      └── 📦 My Personal Stuff                            │    │
│  │                                                          │    │
│  │  📁 Team Work                                            │    │
│  │      └── 📦 Backend Services (Member) ← Same project!    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  KEY: Same project, different personal organization              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Projects (Collaboration Unit)

Projects are the **core unit of collaboration**:

- **Shared**: Multiple users can access the same project
- **Role-based**: Each member has a role (Owner/Admin/Member/Viewer)
- **Container**: All secrets belong to exactly one project
- **Deletable**: Owners can archive or permanently delete

### 2.3 Project Roles

| Role | Description |
|------|-------------|
| **Owner** | Full control. Can delete project, manage all members, transfer ownership. |
| **Admin** | Can manage secrets and invite Members/Viewers. Cannot delete project or manage Owners/Admins. |
| **Member** | Can create, read, update secrets. Cannot delete secrets or manage members. |
| **Viewer** | Read-only access to secrets. |

### 2.4 Platform Admin (Global)

Separate from project roles, Platform Admins handle system-wide operations:

- View all audit logs (compliance)
- Disable/suspend users
- Force-delete abandoned projects
- View platform analytics
- **Cannot** read secrets in projects they're not a member of

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Workflow  │       │   Project   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │       │ id (PK)     │
│ firebaseUid │  │    │ userId (FK) │───────│ name        │
│ email       │  │    │ name        │       │ description │
│ displayName │  │    │ isDefault   │       │ createdBy   │
│ platformRole│  │    │ displayOrder│       │ deletedAt   │
│ createdAt   │  │    └─────────────┘       │ isArchived  │
└─────────────┘  │           │              └─────────────┘
                 │           │                     │
                 │           ▼                     │
                 │    ┌─────────────────┐          │
                 │    │ WorkflowProject │          │
                 │    ├─────────────────┤          │
                 │    │ workflowId (FK) │──────────┘
                 │    │ projectId (FK)  │
                 │    │ displayOrder    │
                 │    └─────────────────┘
                 │
                 │    ┌───────────────────┐
                 │    │ ProjectMembership │
                 │    ├───────────────────┤
                 └───▶│ userId (FK)       │
                      │ projectId (FK)    │───────┐
                      │ role              │       │
                      │ invitedBy         │       │
                      └───────────────────┘       │
                                                  │
                 ┌───────────────────┐            │
                 │ ProjectInvitation │            │
                 ├───────────────────┤            │
                 │ projectId (FK)    │────────────┤
                 │ email             │            │
                 │ role              │            │
                 │ token             │            │
                 │ status            │            │
                 └───────────────────┘            │
                                                  │
                      ┌─────────────┐             │
                      │   Secret    │             │
                      ├─────────────┤             │
                      │ id (PK)     │             │
                      │ projectId   │─────────────┘
                      │ secretKey   │
                      │ encryptedVal│───────┐
                      │ createdBy   │       │
                      │ expiresAt   │       │
                      └─────────────┘       │
                                            │
                      ┌───────────────┐     │
                      │ SecretVersion │     │
                      ├───────────────┤     │
                      │ secretId (FK) │─────┘
                      │ versionNumber │
                      │ encryptedValue│
                      │ changeNote    │
                      └───────────────┘
```

### 3.2 Table Definitions

#### Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    platform_role VARCHAR(20) DEFAULT 'USER' CHECK (platform_role IN ('USER', 'PLATFORM_ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_email (email)
);
```

#### Workflows

```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name),
    INDEX idx_workflows_user_id (user_id)
);
```

#### Projects

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),
    scheduled_permanent_delete_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    INDEX idx_projects_created_by (created_by),
    INDEX idx_projects_is_archived (is_archived)
);
```

#### Workflow-Project Mapping

```sql
CREATE TABLE workflow_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(workflow_id, project_id),
    INDEX idx_workflow_projects_workflow (workflow_id),
    INDEX idx_workflow_projects_project (project_id)
);
```

#### Project Memberships

```sql
CREATE TABLE project_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, user_id),
    INDEX idx_memberships_project (project_id),
    INDEX idx_memberships_user (user_id)
);
```

#### Project Invitations

```sql
CREATE TABLE project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    
    INDEX idx_invitations_email (email),
    INDEX idx_invitations_token (token),
    INDEX idx_invitations_project (project_id)
);
```

#### Secrets

```sql
CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(project_id, secret_key),
    INDEX idx_secrets_project (project_id),
    INDEX idx_secrets_key (secret_key)
);
```

#### Secret Versions

```sql
CREATE TABLE secret_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id UUID NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_note TEXT,
    
    UNIQUE(secret_id, version_number),
    INDEX idx_versions_secret (secret_id)
);
```

#### Audit Logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_project (project_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at)
);

-- Audit action types:
-- SECRET_CREATE, SECRET_READ, SECRET_UPDATE, SECRET_DELETE, SECRET_ROTATE, SECRET_MOVE, SECRET_COPY
-- PROJECT_CREATE, PROJECT_UPDATE, PROJECT_ARCHIVE, PROJECT_RESTORE, PROJECT_DELETE
-- MEMBER_INVITE, MEMBER_JOIN, MEMBER_REMOVE, MEMBER_ROLE_CHANGE
-- WORKFLOW_CREATE, WORKFLOW_UPDATE, WORKFLOW_DELETE
```

---

## 4. Permission Matrix

### 4.1 Project-Level Permissions

| Action | Owner | Admin | Member | Viewer |
|--------|:-----:|:-----:|:------:|:------:|
| **View project** | ✅ | ✅ | ✅ | ✅ |
| **View secrets** | ✅ | ✅ | ✅ | ✅ |
| **Create secrets** | ✅ | ✅ | ✅ | ❌ |
| **Update secrets** | ✅ | ✅ | ✅ | ❌ |
| **Delete secrets** | ✅ | ✅ | ❌ | ❌ |
| **Move/Copy secrets OUT** | ✅ | ✅ | ❌ | ❌ |
| **Rotate secrets** | ✅ | ✅ | ❌ | ❌ |
| **Invite Viewers** | ✅ | ✅ | ❌ | ❌ |
| **Invite Members** | ✅ | ✅ | ❌ | ❌ |
| **Invite Admins** | ✅ | ❌ | ❌ | ❌ |
| **Invite Owners** | ✅ | ❌ | ❌ | ❌ |
| **Remove Viewers** | ✅ | ✅ | ❌ | ❌ |
| **Remove Members** | ✅ | ✅ | ❌ | ❌ |
| **Remove Admins** | ✅ | ❌ | ❌ | ❌ |
| **Remove Owners** | ✅ | ❌ | ❌ | ❌ |
| **Edit project settings** | ✅ | ✅ | ❌ | ❌ |
| **Archive project** | ✅ | ❌ | ❌ | ❌ |
| **Delete project** | ✅ | ❌ | ❌ | ❌ |
| **Leave project** | ✅* | ✅ | ✅ | ✅ |

*\*Owner can leave only if other owners exist, or must transfer ownership first*

### 4.2 Platform Admin Permissions

| Action | Platform Admin |
|--------|:--------------:|
| View all projects (metadata only) | ✅ |
| View all audit logs | ✅ |
| Disable/suspend users | ✅ |
| Force-delete abandoned projects | ✅ |
| View platform analytics | ✅ |
| Read secrets (without membership) | ❌ |
| Modify secrets (without membership) | ❌ |

---

## 5. User Flows

### 5.1 User Signup Flow

```
New user signs up via Firebase
           │
           ▼
┌──────────────────────────────────────┐
│ 1. Create User record                │
│    - firebaseUid, email, etc.        │
│    - platformRole = USER             │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. Create default Workflow           │
│    - name = "My Workflow"            │
│    - isDefault = true                │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Check for pending invitations     │
│    by email                          │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Auto-accept valid invitations     │
│    - Create ProjectMembership        │
│    - Add project to "My Workflow"    │
│    - Mark invitation as ACCEPTED     │
└──────────────────────────────────────┘
           │
           ▼
    User lands on dashboard
```

### 5.2 Project Invitation Flow

```
Owner/Admin invites "john@example.com" as Member
           │
           ▼
           ┌──────────────────────────────┐
           │     Does user exist in       │
           │     system (by email)?       │
           └──────────────────────────────┘
                          │
               ┌──────────┴──────────┐
              YES                    NO
               │                     │
               ▼                     ▼
┌────────────────────────┐  ┌──────────────────────────────┐
│ DIRECT ADD             │  │ PENDING INVITATION           │
│                        │  │                              │
│                        │  │ - Create Invitation record   │
│ - Create membership    │  │ - Send email with link       │
│ - Add to their         │  │ - Link contains invite token │
│   default workflow     │  │ - Expires in 7 days          │
│ - Notify  in-app       │  │ When user signs up:          │
│                        │  │ - Auto-accept pending invite │
│                        │  │ - Create membership          │
│                        │  │ - Add to their workflow      │
└────────────────────────┘  └──────────────────────────────┘
```

### 5.3 Leaving a Project Flow

```
User wants to leave Project X
           │
           ▼
    ┌──────────────┐
    │ Is user the  │───── NO ────▶ Remove membership ✓
    │ ONLY member? │               Remove from workflows ✓
    └──────────────┘
           │
          YES
           ▼
    ┌──────────────────────────────────┐
    │ "Leave" option DISABLED          │
    │ Show: "Delete Project" instead   │
    └──────────────────────────────────┘

───────────────────────────────────────────

User wants to leave (has other members)
           │
           ▼
    ┌──────────────┐
    │ Is user an   │───── NO ────▶ Remove membership ✓
    │    OWNER?    │
    └──────────────┘
           │
          YES
           ▼
    ┌───────────────────┐
    │ Are there OTHER   │───── YES ────▶ Remove membership ✓
    │     owners?       │
    └───────────────────┘
           │
          NO
           ▼
    ┌───────────────────────────────────────┐
    │ BLOCK: Must transfer ownership first  │
    │                                       │
    │ UI: "Transfer Ownership"              │
    │ - Suggest Admins first                │
    │ - Then show other members             │
    │ - Select at least 1 new owner         │
    └───────────────────────────────────────┘
           │
           ▼
    After transfer ──▶ Remove membership ✓
```

### 5.4 Project Deletion Flow

```
User clicks "Delete Project"
           │
           ▼
    ┌──────────────────────┐
    │ Is user an OWNER?    │───── NO ────▶ ❌ DENIED
    └──────────────────────┘
           │
          YES
           ▼
┌──────────────────────────────────────────┐
│ Confirmation Dialog:                     │
│                                          │
│ "Delete Project: Backend Services"       │
│                                          │
│ ⚠️ This project contains 12 secrets      │
│    and has 3 members.                    │
│                                          │
│ Choose deletion type:                    │
│                                          │
│ ○ Archive (Soft Delete) [DEFAULT]        │
│   - Project hidden for 30 days           │
│   - Can be restored during this period   │
│   - Auto-deleted after 30 days           │
│                                          │
│ ○ Delete Permanently                     │
│   - Immediate & irreversible             │
│   - Type project name to confirm:        │
│   - [ Backend Services          ]        │
│                                          │
│        [Cancel]  [Confirm Delete]        │
└──────────────────────────────────────────┘
```

### 5.5 Moving Secrets Flow

```
Move Secret from Project A → Project B
           │
           ▼
    ┌─────────────────────────┐
    │ Is user OWNER or ADMIN  │───── NO ────▶ ❌ DENIED
    │ of Project A (source)?  │
    └─────────────────────────┘
           │
          YES
           ▼
    ┌─────────────────────────┐
    │ Is user at least MEMBER │───── NO ────▶ ❌ DENIED
    │ of Project B (target)?  │
    └─────────────────────────┘
           │
          YES
           ▼
    ┌─────────────────────────────────────┐
    │ Options:                            │
    │  • MOVE (removes from A, adds to B) │
    │  • COPY (keeps in A, copies to B)   │
    └─────────────────────────────────────┘
           │
           ▼
    Execute & Audit Log ✓
```

---

## 6. API Endpoints

### 6.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with Firebase token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### 6.2 Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List user's workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/{id}` | Get workflow details |
| PUT | `/api/workflows/{id}` | Update workflow |
| DELETE | `/api/workflows/{id}` | Delete workflow |
| PUT | `/api/workflows/reorder` | Reorder workflows |
| POST | `/api/workflows/{id}/projects/{projectId}` | Add project to workflow |
| DELETE | `/api/workflows/{id}/projects/{projectId}` | Remove project from workflow |

### 6.3 Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's accessible projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}` | Get project details |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Archive project (soft delete) |
| DELETE | `/api/projects/{id}?permanent=true` | Permanently delete |
| POST | `/api/projects/{id}/restore` | Restore archived project |
| GET | `/api/projects/archived` | List archived projects |

### 6.4 Project Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/members` | List project members |
| POST | `/api/projects/{id}/members` | Invite member (direct or email) |
| PUT | `/api/projects/{id}/members/{userId}` | Update member role |
| DELETE | `/api/projects/{id}/members/{userId}` | Remove member |
| POST | `/api/projects/{id}/leave` | Leave project |
| POST | `/api/projects/{id}/transfer-ownership` | Transfer ownership |

### 6.5 Invitations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invitations` | List pending invitations for user |
| POST | `/api/invitations/{token}/accept` | Accept invitation |
| POST | `/api/invitations/{token}/decline` | Decline invitation |
| DELETE | `/api/projects/{id}/invitations/{inviteId}` | Revoke invitation |

### 6.6 Secrets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{projectId}/secrets` | List secrets in project |
| POST | `/api/projects/{projectId}/secrets` | Create secret |
| GET | `/api/projects/{projectId}/secrets/{key}` | Get secret |
| PUT | `/api/projects/{projectId}/secrets/{key}` | Update secret |
| DELETE | `/api/projects/{projectId}/secrets/{key}` | Delete secret |
| POST | `/api/projects/{projectId}/secrets/{key}/rotate` | Rotate secret |
| POST | `/api/projects/{projectId}/secrets/{key}/move` | Move secret to another project |
| POST | `/api/projects/{projectId}/secrets/{key}/copy` | Copy secret to another project |
| GET | `/api/projects/{projectId}/secrets/{key}/versions` | Get version history |

### 6.7 Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{projectId}/audit-logs` | Project audit logs |
| GET | `/api/audit-logs` | All accessible audit logs |
| GET | `/api/admin/audit-logs` | Platform-wide logs (admin only) |

---

## 7. Frontend Structure

### 7.1 Navigation Structure

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                        ┌───┐ ┌───┐ ┌─────────┐   │
│  │ CSM │  Cloud Secrets Manager                                 │   │ │   │ │ Profile │   │
│  └─────┘                                                        └───┘ └───┘ └─────────┘   │
├─────────────────────┬─────────────────────────────────────────────────────────────────────┤
│                     │                                                                     │
│  📁 My Workflow     │   Project: Backend Services                                         │
│     └── Project A   │   ───────────────────────────────────────                           │
│                     │                                                                     │
│  📁 Work            │   Secrets (12)     Members (3)    Audit                             │
│     ├── Project B ◀─│   ────────────────────────────────────────────────────────────────  │
│     └── Project C   │                                                                     │
│                     │   🔑 API_KEY          ●●●●●●●    [Copy]                             │
│  📁 Personal        │   🔑 DB_PASSWORD      ●●●●●●●    [Copy]                             │
│     └── Project D   │   🔑 JWT_SECRET       ●●●●●●●    [Copy]                             │
│                     │                                                                     │
│  ──────────────     │                                                                     │
│                     │                                                                     │
│  + New Workflow     │                    [+ Add Secret]                                   │
│  + New Project      │                                                                     │
│                     │                                                                     │
│  ──────────────     │                                                                     │
│                     │                                                                     │
│  Projects           │                                                                     │
│  Activity           │                                                                     │
│  Teams              │                                                                     │
│                     │                                                                     │
│  ──────────────     │                                                                     │
│  Analytics Secrets  │                                                                     │
│  -health            │                                                                     │
│  ──────────────     │                                                                     │
│                     │                                                                     │
│  Settings           │                                                                     │ 
│                     │                                                                     │
├─────────────────────┴─────────────────────────────────────────────────────────────────────┤
│  Settings  │    │  Teams (future)                                                         │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Page Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | Authentication |
| `/home` | HomePage | Dashboard/Welcome |
| `/projects` | ProjectsPage | All accessible projects |
| `/projects/:id` | ProjectDetailPage | Project secrets & settings |
| `/projects/:id/members` | ProjectMembersPage | Member management |
| `/projects/:id/settings` | ProjectSettingsPage | Project settings |
| `/projects/:id/audit` | ProjectAuditPage | Project audit logs |
| `/workflows` | WorkflowsPage | Manage workflows |
| `/activity` | ActivityPage | User's activity feed |
| `/settings` | SettingsPage | User settings |
| `/admin` | AdminPage | Platform admin (if admin) |

---

## Appendix A: Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Workflows are personal, not shared | Allows users to organize without affecting collaborators |
| 2 | Projects can have multiple owners | Redundancy, prevents orphaned projects |
| 3 | Admins can move secrets (not just owners) | Practical for team leads managing secrets |
| 4 | 30-day soft delete grace period | Industry standard, allows recovery |
| 5 | Secret keys unique per project | Allows same key name in different projects |
| 6 | Platform Admin cannot read secrets | Separation of concerns: system vs data |

---

## Appendix B: Future Considerations

### Teams/Groups (Next Sprint)

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE team_memberships (
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id)
);

CREATE TABLE project_team_access (
    project_id UUID REFERENCES projects(id),
    team_id UUID REFERENCES teams(id),
    role VARCHAR(20) -- ADMIN, MEMBER, VIEWER (not OWNER)
);
```

### Environments (Future)

```sql
CREATE TABLE environments (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(50), -- dev, staging, prod
    restricted BOOLEAN DEFAULT FALSE
);

-- Secrets would then have environment_id
```

---

*Document Version: 3.0*  
*Last Updated: November 2024*

