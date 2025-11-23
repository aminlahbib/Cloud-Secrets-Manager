# Epic 5: Frontend UI Implementation Plan

**Status:** 🚧 In Progress (40% Complete)  
**Started:** November 2025  
**Target Completion:** December 2025

---

## 📋 Overview

Build the actual React UI components based on the completed UX specification. This epic focuses on implementing the secrets management, audit logs, and admin interfaces.

**Design Complete:** See [`FRONTEND_UI_SPECIFICATION.md`](./FRONTEND_UI_SPECIFICATION.md)

---

## ✅ What's Already Done

### Phase 1: Project Setup ✅
- [x] React 18 + TypeScript + Vite project initialized
- [x] Tailwind CSS configured
- [x] React Router for navigation
- [x] TanStack Query for data fetching
- [x] Axios API client with interceptors
- [x] React Hook Form + Zod for form validation

### Phase 2: Authentication & Core Layout ✅
- [x] Firebase SDK integration
- [x] Google OAuth sign-in working end-to-end
- [x] AuthContext for session management
- [x] Login page with Google Sign-In button
- [x] Protected routes (ProtectedRoute component)
- [x] Auto-token refresh before expiration
- [x] Logout functionality

### Phase 3: UI Components Library ✅
- [x] Button component (variants: primary, secondary, danger, ghost)
- [x] Input component (with label, error, validation)
- [x] Basic layout structure (header with user email)

---

## 🚧 What Needs To Be Built

### Story 1: Build Secret Management UI (list, view, CRUD, sharing)

#### 1.1 Secrets List Page ✅ Layout / 🚧 Implementation
**Route:** `/secrets`

**Components to Build:**
- [ ] `SecretsList.tsx` - Main list page component
- [ ] `SecretListItem.tsx` - Individual secret card/row
- [ ] `SecretFilters.tsx` - Filter bar (search, tags, date)
- [ ] `Pagination.tsx` - Reusable pagination component
- [ ] `EmptyState.tsx` - Empty state when no secrets

**Features:**
- [ ] Fetch secrets from `/api/secrets` with pagination
- [ ] Search by key name
- [ ] Filter by tags
- [ ] Sort by created date, updated date, name
- [ ] Display: key name, tags, created date, last accessed
- [ ] Click to view details
- [ ] "Create New Secret" button

**API Integration:**
```typescript
// GET /api/secrets?page=0&size=20&search=db&sort=createdAt,desc
const { data, isLoading, error } = useQuery({
  queryKey: ['secrets', page, search, sort],
  queryFn: () => api.get('/api/secrets', { params: { page, size: 20, search, sort } })
});
```

---

#### 1.2 Secret Detail View 🚧 To Build
**Route:** `/secrets/:id`

**Components to Build:**
- [ ] `SecretDetail.tsx` - Main detail page
- [ ] `SecretMetadata.tsx` - Display metadata (created, updated, version)
- [ ] `SecretValue.tsx` - Display encrypted value with show/hide toggle
- [ ] `SecretVersionHistory.tsx` - Version history list
- [ ] `SecretSharing.tsx` - List of users with access
- [ ] `ConfirmDialog.tsx` - Reusable confirmation dialog

**Features:**
- [ ] Display secret key, description, tags, metadata
- [ ] Show/hide secret value (masked by default)
- [ ] Copy secret value to clipboard
- [ ] Version history with rollback
- [ ] Edit button → navigate to edit form
- [ ] Delete button → confirmation dialog
- [ ] Share button → open share dialog
- [ ] View who has access (if shared)

**API Integration:**
```typescript
// GET /api/secrets/:id
const { data: secret } = useQuery({
  queryKey: ['secret', id],
  queryFn: () => api.get(`/api/secrets/${id}`)
});

// GET /api/secrets/:id/versions
const { data: versions } = useQuery({
  queryKey: ['secret-versions', id],
  queryFn: () => api.get(`/api/secrets/${id}/versions`)
});
```

---

#### 1.3 Create/Edit Secret Form 🚧 To Build
**Route:** `/secrets/new` and `/secrets/:id/edit`

**Components to Build:**
- [ ] `SecretForm.tsx` - Main form component (create/edit modes)
- [ ] `SecretFormBasicTab.tsx` - Basic info (key, value, description)
- [ ] `SecretFormAdvancedTab.tsx` - Advanced options (tags, expiration)
- [ ] `SecretFormSharingTab.tsx` - Sharing settings
- [ ] `TabNavigation.tsx` - Reusable tabs component
- [ ] `TagInput.tsx` - Tag input with add/remove

**Features:**
- [ ] Tabbed interface: Basic, Advanced, Sharing
- [ ] **Basic Tab:**
  - Key name (required, unique validation)
  - Secret value (required, textarea, show/hide toggle)
  - Description (optional)
- [ ] **Advanced Tab:**
  - Tags (multiple, autocomplete from existing)
  - Expiration date (optional date picker)
  - Auto-rotation (checkbox + interval)
- [ ] **Sharing Tab:**
  - User search and select
  - Permission level (read/write)
  - Add/remove shared users
- [ ] Form validation with Zod
- [ ] Loading states during submission
- [ ] Success/error toast notifications
- [ ] Cancel button (discard changes warning)

**API Integration:**
```typescript
// POST /api/secrets (create)
const createMutation = useMutation({
  mutationFn: (data: SecretRequest) => api.post('/api/secrets', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['secrets']);
    navigate('/secrets');
  }
});

// PUT /api/secrets/:id (update)
const updateMutation = useMutation({
  mutationFn: (data: SecretRequest) => api.put(`/api/secrets/${id}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['secret', id]);
    navigate(`/secrets/${id}`);
  }
});
```

---

#### 1.4 Secret Sharing Dialog 🚧 To Build

**Components to Build:**
- [ ] `ShareSecretDialog.tsx` - Modal dialog for sharing
- [ ] `UserSearch.tsx` - Search users by email
- [ ] `SharedUsersList.tsx` - List of users with access
- [ ] `Modal.tsx` - Reusable modal component

**Features:**
- [ ] Modal overlay (click outside to close)
- [ ] Search users by email
- [ ] Select user to share with
- [ ] Choose permission level (READ/WRITE)
- [ ] View currently shared users
- [ ] Remove shared access
- [ ] Save button (batch share operations)

**API Integration:**
```typescript
// POST /api/secrets/:id/share
const shareMutation = useMutation({
  mutationFn: ({ userId, permission }: ShareRequest) => 
    api.post(`/api/secrets/${id}/share`, { userId, permission }),
  onSuccess: () => {
    queryClient.invalidateQueries(['secret', id]);
  }
});

// DELETE /api/secrets/:id/share/:userId
const unshareMutation = useMutation({
  mutationFn: (userId: string) => 
    api.delete(`/api/secrets/${id}/share/${userId}`),
  onSuccess: () => {
    queryClient.invalidateQueries(['secret', id]);
  }
});
```

---

### Story 2: Build Audit Logs UI 📅 Planned

#### 2.1 Audit Logs List Page 📅 To Build
**Route:** `/audit`

**Components to Build:**
- [ ] `AuditLogsList.tsx` - Main audit logs page
- [ ] `AuditLogItem.tsx` - Individual log entry
- [ ] `AuditFilters.tsx` - Filter by user, action, date range

**Features:**
- [ ] List all audit log entries with pagination
- [ ] Filter by:
  - User (email)
  - Action (CREATE, READ, UPDATE, DELETE, SHARE, ROTATE)
  - Secret key
  - Date range
- [ ] Display: timestamp, user, action, secret key, IP address
- [ ] Click to view full details
- [ ] Export logs (CSV/JSON)

**API Integration:**
```typescript
// GET /api/audit?page=0&size=50&user=&action=&startDate=&endDate=
const { data } = useQuery({
  queryKey: ['audit-logs', filters],
  queryFn: () => api.get('/api/audit', { params: filters })
});
```

---

#### 2.2 Audit Log Detail View 📅 To Build
**Route:** `/audit/:id`

**Components to Build:**
- [ ] `AuditLogDetail.tsx` - Full log entry details
- [ ] `MetadataTable.tsx` - Key-value table for metadata

**Features:**
- [ ] Display all audit log fields
- [ ] Show request metadata (IP, user agent, headers)
- [ ] Link to related secret (if still exists)
- [ ] Link to user profile
- [ ] Back to audit logs list

---

### Story 3: Build Minimal Admin UI 📅 Planned

#### 3.1 User Management Page 📅 To Build
**Route:** `/admin/users` (admin only)

**Components to Build:**
- [ ] `UsersList.tsx` - List all users
- [ ] `UserListItem.tsx` - User row with role badge
- [ ] `UpdateRoleDialog.tsx` - Modal to update user role

**Features:**
- [ ] Admin-only route (redirect non-admins)
- [ ] List all users with:
  - Email
  - Current role
  - Permissions
  - Last login
- [ ] Update user role (USER, MANAGER, ADMIN)
- [ ] View user permissions
- [ ] Confirmation dialog before role change

**API Integration:**
```typescript
// GET /api/admin/users
const { data: users } = useQuery({
  queryKey: ['admin-users'],
  queryFn: () => api.get('/api/admin/users')
});

// PUT /api/admin/users/:id/role
const updateRoleMutation = useMutation({
  mutationFn: ({ userId, role }: { userId: string, role: string }) =>
    api.put(`/api/admin/users/${userId}/role`, { role }),
  onSuccess: () => {
    queryClient.invalidateQueries(['admin-users']);
  }
});
```

---

## 🎨 Design System Components to Build

### Core UI Components
- [ ] `Modal.tsx` - Reusable modal/dialog component
- [ ] `ConfirmDialog.tsx` - Confirmation dialog (delete, etc.)
- [ ] `Toast.tsx` - Toast notifications for success/error
- [ ] `Spinner.tsx` - Loading spinner
- [ ] `Tabs.tsx` - Tabbed interface component
- [ ] `Pagination.tsx` - Pagination controls
- [ ] `EmptyState.tsx` - Empty state placeholder
- [ ] `ErrorBoundary.tsx` - Error boundary for graceful failures

### Form Components
- [ ] `Textarea.tsx` - Multi-line text input
- [ ] `Select.tsx` - Dropdown select
- [ ] `Checkbox.tsx` - Checkbox input
- [ ] `DatePicker.tsx` - Date picker (or use library)
- [ ] `TagInput.tsx` - Tag management input
- [ ] `Toggle.tsx` - Toggle switch (show/hide secret)

### Display Components
- [ ] `Badge.tsx` - Colored badges for tags, status
- [ ] `Card.tsx` - Content card container
- [ ] `Table.tsx` - Data table component
- [ ] `Avatar.tsx` - User avatar (initials or image)

---

## 📦 Additional Libraries to Consider

```bash
# Date handling
npm install date-fns

# Toast notifications
npm install react-hot-toast

# Icons (if Lucide isn't enough)
# Already have lucide-react

# Date picker (if needed)
npm install react-datepicker @types/react-datepicker

# Clipboard
npm install react-copy-to-clipboard
```

---

## 🎯 Implementation Order

### Phase 1: Core Secret Management (Highest Priority)
1. **Secrets List Page** - Users need to see their secrets
2. **Secret Detail View** - View individual secret details
3. **Create Secret Form** - Add new secrets (Basic tab only)
4. **Delete Secret** - Remove secrets (with confirmation)

### Phase 2: Advanced Secret Management
5. **Edit Secret Form** - Update existing secrets
6. **Advanced Form Tabs** - Tags, expiration, advanced options
7. **Secret Sharing** - Share secrets with other users
8. **Version History** - View and rollback versions

### Phase 3: Audit & Admin
9. **Audit Logs List** - View audit trail
10. **Audit Log Details** - Full audit entry details
11. **Admin User Management** - Manage user roles (admin only)

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering tests (Vitest + Testing Library)
- Form validation tests
- User interaction tests (clicks, inputs)

### Integration Tests
- Full user flows (login → create secret → view → edit → delete)
- API integration tests (mock API responses)

### E2E Tests (Optional)
- Critical user journeys with Playwright or Cypress

---

## 📊 Success Criteria

### Functionality
- [ ] Users can create, read, update, delete secrets
- [ ] Users can search and filter secrets
- [ ] Users can share secrets with permissions
- [ ] Users can view audit logs
- [ ] Admins can manage user roles
- [ ] All forms have proper validation
- [ ] Loading and error states handled gracefully

### UX
- [ ] Responsive design (works on mobile, tablet, desktop)
- [ ] Fast page loads (< 2s)
- [ ] Smooth transitions and animations
- [ ] Clear error messages
- [ ] Confirmation dialogs for destructive actions
- [ ] Toast notifications for actions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

---

## 🚀 Getting Started

### 1. Review the Design Specification
Read [`FRONTEND_UI_SPECIFICATION.md`](./FRONTEND_UI_SPECIFICATION.md) for detailed wireframes and design decisions.

### 2. Set Up Development Environment
```bash
# Frontend
cd apps/frontend
npm install
npm run dev  # http://localhost:5173

# Backend (in another terminal)
cd apps/backend/secret-service
./mvnw spring-boot:run  # http://localhost:8080
```

### 3. Start with Secrets List
Begin by implementing the secrets list page as it's the main landing page after login.

### 4. Build Components Iteratively
- Build one component at a time
- Test as you go (manual + unit tests)
- Integrate with real backend API
- Handle loading and error states

---

## 📚 Resources

### Backend API Documentation
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI Spec: `http://localhost:8080/v3/api-docs`

### Design Reference
- [Frontend UI Specification](./FRONTEND_UI_SPECIFICATION.md)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/en/main)
- [TanStack Query Docs](https://tanstack.com/query/latest)

### Testing
- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)

---

**Last Updated:** November 23, 2025  
**Status:** Ready to begin implementation  
**Next Step:** Build Secrets List Page

