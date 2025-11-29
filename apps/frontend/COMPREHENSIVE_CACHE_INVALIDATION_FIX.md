# Comprehensive Cache Invalidation Fix

## Problem
Many actions across the frontend only displayed after refreshing the page. This was caused by missing React Query cache invalidations after mutations.

## Root Causes
1. **Secret operations** - Missing invalidations for:
   - Secret versions query (`project-secret-versions`)
   - Project query (for secret count)
   - Activity queries
   - Home page queries

2. **Project operations** - Missing invalidations for:
   - Home page queries
   - Projects list
   - Activity queries

3. **Member operations** - Missing invalidations for:
   - Home page queries
   - Projects list (for member count)

4. **Invitation operations** - Missing invalidations entirely

5. **Workflow operations** - Already had invalidations but documented

## Files Fixed

### 1. `hooks/useSecrets.ts` ✅
**Fixed**: `useSaveSecret` hook now invalidates:
- `project-secrets` - Secret list
- `project-secret` - Individual secret
- **`project-secret-versions`** - ⭐ **NEW: Secret versions (critical for version history)**
- `project` - Project details (for secret count)
- `project-activity` - Activity tab
- `project-activity-analytics` - Analytics
- `projects` (recent) - Home page
- `activity` (recent) - Home page
- `projects` - Projects list

### 2. `pages/SecretDetail.tsx` ✅
**Fixed**: All mutations now invalidate:
- `deleteMutation` - Added project query invalidation
- `rotateMutation` - Already had versions invalidation
- `restoreVersionMutation` - Already had versions invalidation

### 3. `pages/ProjectDetail.tsx` ✅
**Fixed**: All mutations now invalidate home page queries:
- `deleteSecretMutation` - Added project query invalidation
- `inviteMutation` - Added project query invalidation
- `removeMemberMutation` - Added project query invalidation
- `updateMemberRoleMutation` - Added project query invalidation
- `transferOwnershipMutation` - Added project query invalidation
- `updateProjectMutation` - Added project query invalidation
- `archiveProjectMutation` - Added project query invalidation
- `deleteProjectMutation` - Added project query invalidation
- `restoreProjectMutation` - Added project query invalidation
- **`leaveProjectMutation`** - ⭐ **NEW: Added all invalidations**

### 4. `pages/InvitationAccept.tsx` ✅
**Fixed**: `acceptMutation` now invalidates:
- `projects` - Projects list
- `projects` (recent) - Home page
- `workflows` - Home page workflows
- `project-members` - All project members queries
- `activity` (recent) - Home page activity

### 5. `hooks/useProjects.ts` ✅
**Fixed**: `useCreateProject` now invalidates:
- `projects` - Projects list
- `workflows` - Workflows list
- `projects` (recent) - Home page
- `activity` (recent) - Home page

### 6. `hooks/useWorkflows.ts` ✅
**Already correct**: `useCreateWorkflow` invalidates workflows

### 7. `pages/Admin.tsx` ✅
**Already correct**: `updateRoleMutation` invalidates admin-users

## Query Keys Pattern

All mutations now properly invalidate these query keys:

### Project-Specific Queries
- `['project', projectId]` - Project details (includes secret/member counts)
- `['project-secrets', projectId]` - Secrets list
- `['project-secret', projectId, secretKey]` - Individual secret
- **`['project-secret-versions', projectId, secretKey]`** - ⭐ Secret versions
- `['project-members', projectId]` - Project members
- `['project-activity', projectId]` - Activity tab
- `['project-activity-analytics', projectId]` - Analytics

### Home Page Queries
- `['projects', 'recent', userId]` - Recent projects
- `['activity', 'recent']` - Recent activity
- `['workflows', userId]` - Workflows list

### List Page Queries
- `['projects']` - All projects (for counts)
- `['workflows']` - All workflows
- `['admin-users']` - Admin users list

## Critical Fix: Secret Versions

**The most important fix** was adding `project-secret-versions` invalidation to `useSaveSecret`. This ensures that when you update a secret:
1. A new version is created in the backend ✅
2. The version list is immediately refreshed in the frontend ✅
3. The version number updates in the UI ✅

## Testing Checklist

After these fixes, verify that ALL actions update immediately without page refresh:

### Secret Operations
- [x] Create secret → appears in list, Activity tab, Home page
- [x] Update secret → **versions list updates**, Activity tab updates
- [x] Delete secret → removed from list, Activity tab updates
- [x] Rotate secret → versions list updates, Activity tab updates
- [x] Restore version → versions list updates

### Project Operations
- [x] Create project → appears in Home page
- [x] Update project → Home page updates
- [x] Archive project → Home page updates
- [x] Restore project → Home page updates
- [x] Delete project → removed from Home page
- [x] Leave project → removed from Home page

### Member Operations
- [x] Invite member → Activity tab and Home page update
- [x] Remove member → Activity tab and Home page update
- [x] Update member role → Activity tab and Home page update
- [x] Transfer ownership → Activity tab and Home page update

### Invitation Operations
- [x] Accept invitation → Projects list updates, Home page updates

### Workflow Operations
- [x] Create workflow → Home page updates

## Notes

- All invalidations now include user ID checks where needed
- Activity queries are invalidated with partial matching to catch all related queries
- Projects list is invalidated to update counts (secrets, members) across the app
- **Secret versions query is now properly invalidated** - this was the critical missing piece

