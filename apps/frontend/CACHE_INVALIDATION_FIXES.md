# Cache Invalidation Fixes - Frontend

## Problem Diagnosis

Many actions in the frontend only displayed after refreshing the whole page. This was caused by **missing React Query cache invalidations** after mutations.

## Root Causes

1. **Secret Operations** - When creating/updating/deleting secrets, the following queries were not invalidated:
   - Activity tab queries (`project-activity`, `project-activity-analytics`)
   - Home page queries (`projects`, `activity`, `recent`)
   - Projects list (for secret count updates)

2. **Project Operations** - When creating/updating/archiving/restoring projects:
   - Home page recent projects query
   - Home page recent activity query
   - Activity page queries

3. **Member Operations** - When inviting/removing/updating members:
   - Home page queries (for member count updates)
   - Activity queries

4. **Workflow Operations** - When creating workflows:
   - Home page workflows query

## Files Fixed

### 1. `hooks/useSecrets.ts`
- **Fixed**: `useSaveSecret` hook now invalidates:
  - `project-activity` and `project-activity-analytics` (Activity tab)
  - `projects` (recent) and `activity` (recent) for home page
  - `projects` list (for secret count updates)

### 2. `pages/SecretDetail.tsx`
- **Fixed**: `deleteMutation`, `rotateMutation`, `restoreVersionMutation` now invalidate:
  - Activity and analytics queries
  - Home page queries
  - Projects list

### 3. `pages/ProjectDetail.tsx`
- **Fixed**: All mutations now invalidate home page queries:
  - `deleteSecretMutation`
  - `inviteMutation`
  - `removeMemberMutation`
  - `updateMemberRoleMutation`
  - `transferOwnershipMutation`
  - `updateProjectMutation`
  - `archiveProjectMutation`
  - `deleteProjectMutation`
  - `restoreProjectMutation`

### 4. `hooks/useProjects.ts`
- **Fixed**: `useCreateProject` now invalidates:
  - Home page recent projects query
  - Home page recent activity query

### 5. `hooks/useWorkflows.ts`
- **Fixed**: `useCreateWorkflow` now invalidates workflows query (already done, but documented)

## Query Keys Pattern

The following query keys are now properly invalidated:

- **Project-specific**: `['project', projectId]`, `['project-secrets', projectId]`, `['project-activity', projectId]`
- **Home page**: `['projects', 'recent', userId]`, `['activity', 'recent']`, `['workflows', userId]`
- **List pages**: `['projects']`, `['activity']`, `['workflows']`

## Testing Checklist

After these fixes, verify that the following actions update immediately without page refresh:

- [ ] Create a new secret → appears in Activity tab and Home page
- [ ] Update a secret → Activity tab updates
- [ ] Delete a secret → removed from list, Activity tab updates
- [ ] Rotate a secret → Activity tab updates
- [ ] Create a new project → appears in Home page recent projects
- [ ] Update project details → Home page updates
- [ ] Archive/restore project → Home page updates
- [ ] Invite a member → Activity tab and Home page update
- [ ] Remove/update member role → Activity tab and Home page update
- [ ] Create a workflow → appears in Home page

## Notes

- All invalidations now include user ID checks where needed to avoid unnecessary invalidations
- Activity queries are invalidated with partial matching to catch all related queries
- Projects list is invalidated to update counts (secrets, members) across the app

