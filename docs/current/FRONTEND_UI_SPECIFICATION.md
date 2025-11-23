# Frontend UI Specification - Cloud Secrets Manager

**Epic 5: Frontend & UX**  
**Version:** 1.0  
**Last Updated:** November 23, 2025  
**Scope:** Minimal MVP SPA

---

## Table of Contents

1. [Overview](#overview)
2. [UI/UX Wireframes](#uiux-wireframes)
3. [MVP Scope](#mvp-scope)
4. [Screen Specifications](#screen-specifications)
5. [Component Library](#component-library)
6. [User Flows](#user-flows)
7. [Technical Stack](#technical-stack)

---

## Overview

### Product Vision

A clean, intuitive web interface for managing secrets securely. Focus on:
- **Simplicity** - Easy to understand and use
- **Security** - Token management, auto-logout, secure storage
- **Productivity** - Fast CRUD operations, bulk actions, search/filter
- **Visibility** - Clear status, errors, and audit trails

### Design Philosophy

- **Minimalist** - No unnecessary UI elements
- **Tab-based navigation** - Clear separation of concerns
- **Consistent patterns** - Reusable components
- **Mobile-friendly** - Responsive design
- **Accessible** - WCAG 2.1 AA compliance

---

## UI/UX Wireframes

### Overall Layout

```
┌────────────────────────────────────────────────────────────┐
│  🔐 Cloud Secrets Manager          👤 User Menu     Logout │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Secrets  │  Audit Logs  │  Admin  (if admin)       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │                                                       │ │
│  │               TAB CONTENT AREA                        │ │
│  │                                                       │ │
│  │                                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 1. Login Screen

```
┌────────────────────────────────────────┐
│                                         │
│         🔐 Cloud Secrets Manager        │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  Email                          │  │
│   │  ┌───────────────────────────┐  │  │
│   │  │ user@example.com          │  │  │
│   │  └───────────────────────────┘  │  │
│   │                                 │  │
│   │  Password                       │  │
│   │  ┌───────────────────────────┐  │  │
│   │  │ ••••••••••                │  │  │
│   │  └───────────────────────────┘  │  │
│   │                                 │  │
│   │   [ Sign In with Google ]       │  │
│   │   [ Sign In with Email ]        │  │
│   │                                 │  │
│   │   Forgot password?              │  │
│   └─────────────────────────────────┘  │
│                                         │
└────────────────────────────────────────┘
```

### 2. Secrets Tab - List View

```
┌────────────────────────────────────────────────────────────┐
│  Secrets  │  Audit Logs  │  Admin                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ New Secret]              [🔍 Search...]    [Filter ▼]  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Key              │ Created     │ Modified │ Actions  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ api-key-prod     │ Nov 1       │ Nov 20   │ [👁️][✏️][🗑️] │ │
│  │ database-url     │ Oct 15      │ Oct 15   │ [👁️][✏️][🗑️] │ │
│  │ jwt-secret       │ Sep 30      │ Nov 18   │ [👁️][✏️][🗑️] │ │
│  │ stripe-api-key   │ Nov 10      │ Nov 10   │ [👁️][✏️][🗑️] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 1-4 of 42        [<] [1] [2] [3] [>]             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 3. Secret Detail Modal

```
┌────────────────────────────────────────┐
│  Secret Details              [✕]       │
├────────────────────────────────────────┤
│                                         │
│  Key: api-key-prod                      │
│                                         │
│  Value: [Show] •••••••••••••••••        │
│                                         │
│  Created: Nov 1, 2025 by user@ex.com   │
│  Modified: Nov 20, 2025 by admin@ex.com│
│                                         │
│  Tags: [production] [api]               │
│                                         │
│  ┌─ Sharing ────────────────────────┐  │
│  │ Shared with:                     │  │
│  │ • dev@example.com (read)         │  │
│  │ • ops@example.com (write)        │  │
│  │                                   │  │
│  │ [+ Share with user]              │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Edit]  [Rotate]  [Delete]  [Close]  │
│                                         │
└────────────────────────────────────────┘
```

### 4. Create/Edit Secret Form

```
┌────────────────────────────────────────┐
│  Create Secret               [✕]       │
├────────────────────────────────────────┤
│                                         │
│  Key *                                  │
│  ┌───────────────────────────────────┐ │
│  │ api-key-staging                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Value *                                │
│  ┌───────────────────────────────────┐ │
│  │ sk_test_abc123...                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐ │
│  │ Staging API key for external API  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Tags (comma-separated)                 │
│  ┌───────────────────────────────────┐ │
│  │ staging, api, external            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Expiration (optional)                  │
│  ┌───────────────────────────────────┐ │
│  │ [Date Picker] 2026-01-01          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Cancel]              [Create Secret] │
│                                         │
└────────────────────────────────────────┘
```

### 5. Audit Logs Tab

```
┌────────────────────────────────────────────────────────────┐
│  Secrets  │  Audit Logs  │  Admin                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  [Filter by Action ▼]  [Filter by User ▼]  [Date Range ▼] │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Time       │ Action │ Key          │ User   │ IP     │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 10:23 AM   │ CREATE │ api-key-prod │ admin  │ 10.0.1 │ │
│  │ 10:15 AM   │ READ   │ database-url │ user1  │ 10.0.2 │ │
│  │ 09:45 AM   │ UPDATE │ jwt-secret   │ admin  │ 10.0.1 │ │
│  │ 09:12 AM   │ DELETE │ old-api-key  │ user2  │ 10.0.3 │ │
│  │ 08:30 AM   │ ROTATE │ stripe-key   │ admin  │ 10.0.1 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  [Export CSV]                  [<] [1] [2] [3] [>]        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6. Admin Tab - User Management

```
┌────────────────────────────────────────────────────────────┐
│  Secrets  │  Audit Logs  │  Admin                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Users  │  Roles  │  Permissions                           │
│                                                             │
│  [+ Add User]                    [🔍 Search users...]      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Email           │ Role    │ Permissions  │ Actions   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ admin@ex.com    │ ADMIN   │ All          │ [Edit]    │ │
│  │ user1@ex.com    │ USER    │ Read,Write   │ [Edit]    │ │
│  │ user2@ex.com    │ USER    │ Read         │ [Edit]    │ │
│  │ readonly@ex.com │ VIEWER  │ Read         │ [Edit]    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 1-4 of 12        [<] [1] [2] [3] [>]             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## MVP Scope

### In Scope (MVP)

**Authentication:**
- ✅ Login with email/password
- ✅ Login with Google (OAuth 2.0)
- ✅ Token refresh (transparent)
- ✅ Logout
- ✅ Session management

**Secret Management:**
- ✅ List secrets (paginated)
- ✅ Search/filter secrets
- ✅ View secret details
- ✅ Create secret
- ✅ Edit secret
- ✅ Delete secret
- ✅ Rotate secret
- ✅ Share secret with users
- ✅ Unshare secret

**Audit Logs:**
- ✅ View audit logs (paginated)
- ✅ Filter by action, user, date
- ✅ Export to CSV

**Admin (Admin-only):**
- ✅ List users
- ✅ View user roles
- ✅ Update user roles
- ✅ Update user permissions
- ✅ View admin audit trail

### Out of Scope (Post-MVP)

- ❌ User registration (admin creates accounts)
- ❌ Password reset flow
- ❌ Two-factor authentication (2FA)
- ❌ Bulk secret operations UI
- ❌ Secret versioning UI
- ❌ Advanced analytics/dashboard
- ❌ Dark mode toggle
- ❌ Custom themes
- ❌ Mobile app
- ❌ Offline support

---

## Screen Specifications

### 1. Login Screen

**Route:** `/login`  
**Auth Required:** No  
**Access:** Public

**Elements:**
- Logo and app name
- Email input field
- Password input field
- "Sign In with Email" button
- "Sign In with Google" button (OAuth)
- "Forgot password?" link (disabled in MVP)
- Error message display

**Validation:**
- Email: Required, valid email format
- Password: Required, min 8 characters

**States:**
- Idle
- Loading (during authentication)
- Error (invalid credentials, network error)
- Success (redirect to `/secrets`)

---

### 2. Secrets Tab

**Route:** `/secrets`  
**Auth Required:** Yes  
**Access:** All authenticated users

**Features:**
- **List View:**
  - Paginated table (20 per page)
  - Columns: Key, Created Date, Modified Date, Actions
  - Actions: View, Edit, Delete
  - Search bar (filter by key)
  - Filter dropdown (by tags, expiration)
  
- **Create Button:**
  - Opens create secret modal
  
- **Row Actions:**
  - 👁️ View - Opens detail modal
  - ✏️ Edit - Opens edit modal (if user has permission)
  - 🗑️ Delete - Confirmation dialog, then delete (if user has permission)

**Permissions:**
- READ: View secrets
- WRITE: Create, edit secrets
- DELETE: Delete secrets
- Admins: All actions

---

### 3. Secret Detail Modal

**Trigger:** Click secret row or "View" icon  
**Auth Required:** Yes  
**Access:** Users with READ permission on secret

**Elements:**
- Secret key (read-only)
- Secret value (masked, with "Show" button)
- Created by and date
- Modified by and date
- Tags (read-only)
- Expiration date (if set)
- **Sharing section:**
  - List of users secret is shared with
  - "Share with user" button (if user has SHARE permission)
- **Actions:**
  - Edit button (if user has WRITE permission)
  - Rotate button (if user has ROTATE permission)
  - Delete button (if user has DELETE permission)
  - Close button

---

### 4. Create/Edit Secret Form

**Trigger:** "New Secret" button or "Edit" action  
**Auth Required:** Yes  
**Access:** Users with WRITE permission

**Fields:**
- **Key*** (text input)
  - Required
  - Unique
  - Pattern: alphanumeric, hyphens, underscores
  - Max length: 255 characters
  
- **Value*** (textarea)
  - Required
  - Encrypted on save
  - Max length: 10KB
  
- **Description** (textarea)
  - Optional
  - Max length: 500 characters
  
- **Tags** (text input)
  - Optional
  - Comma-separated
  
- **Expiration Date** (date picker)
  - Optional
  - Must be future date

**Validation:**
- Client-side validation
- Server-side validation
- Error messages displayed inline

**Actions:**
- Cancel - Closes modal, discards changes
- Create/Update - Saves secret, shows success/error message

---

### 5. Audit Logs Tab

**Route:** `/audit`  
**Auth Required:** Yes  
**Access:** All authenticated users (see own actions + actions on shared secrets)

**Features:**
- Paginated table (50 per page)
- Columns: Timestamp, Action, Secret Key, User, IP Address
- Filters:
  - Action type (CREATE, READ, UPDATE, DELETE, ROTATE, SHARE)
  - User (dropdown)
  - Date range (date picker)
- Export CSV button
- Real-time updates (optional, WebSocket)

**Permissions:**
- Regular users: See audits for secrets they have access to
- Admins: See all audit logs

---

### 6. Admin Tab

**Route:** `/admin`  
**Auth Required:** Yes  
**Access:** ADMIN role only

**Sub-tabs:**
- **Users** - User management
- **Roles** - Role management (future)
- **Permissions** - Permission templates (future)

**Users Sub-tab:**
- Paginated table (20 per page)
- Columns: Email, Role, Permissions, Status, Actions
- Search bar (filter by email)
- Add user button
- Row actions:
  - Edit - Opens edit user modal
  - Deactivate/Activate (future)

**Edit User Modal:**
- Email (read-only)
- Role dropdown (ADMIN, USER, VIEWER)
- Permissions checklist (READ, WRITE, DELETE, LIST, ROTATE, SHARE)
- Save button
- Cancel button

**Audit Trail:**
- Display admin actions in separate section
- Who changed what, when

---

## Component Library

### Core Components

1. **Button**
   - Variants: primary, secondary, danger, ghost
   - Sizes: sm, md, lg
   - States: default, hover, active, disabled, loading

2. **Input**
   - Types: text, password, email, number, date
   - States: default, focus, error, disabled
   - With label, help text, error message

3. **Table**
   - Header, body, footer
   - Sortable columns
   - Row actions
   - Empty state
   - Loading state

4. **Modal**
   - Header with close button
   - Body (scrollable)
   - Footer with actions
   - Backdrop overlay
   - Close on Esc or backdrop click

5. **Tabs**
   - Horizontal tabs
   - Active state
   - Disabled state

6. **Card**
   - Header, body, footer
   - Elevated shadow
   - Border variant

7. **Alert**
   - Types: success, error, warning, info
   - Dismissible
   - With icon

8. **Spinner**
   - Sizes: sm, md, lg
   - Colors: primary, white

9. **Badge**
   - Colors: blue, green, red, yellow, gray
   - Sizes: sm, md, lg

10. **Dropdown**
    - Menu items
    - Dividers
    - Checkable items

---

## User Flows

### Flow 1: Login

```
User → Login Page
  ↓
Enter credentials
  ↓
Click "Sign In"
  ↓
[Loading spinner]
  ↓
Success → Redirect to /secrets
Error → Show error message
```

### Flow 2: Create Secret

```
User → Secrets Tab
  ↓
Click "+ New Secret"
  ↓
Modal opens with form
  ↓
Fill in Key, Value, etc.
  ↓
Click "Create"
  ↓
[Loading spinner on button]
  ↓
Success → Modal closes, table refreshes, success toast
Error → Show error inline, keep modal open
```

### Flow 3: Share Secret

```
User → Secret Detail Modal
  ↓
Click "+ Share with user"
  ↓
Share modal opens
  ↓
Enter user email
Select permission level (read/write)
  ↓
Click "Share"
  ↓
Success → User added to shared list
Error → Show error message
```

### Flow 4: Admin - Update User Role

```
Admin → Admin Tab → Users
  ↓
Click "Edit" on user row
  ↓
Edit user modal opens
  ↓
Change role in dropdown
Update permissions checklist
  ↓
Click "Save"
  ↓
Success → Modal closes, user notified
Error → Show error message
```

---

## Technical Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR)

### State Management
- **React Context API** - Auth state, user state
- **TanStack Query (React Query)** - Server state, caching
- **Zustand** - UI state (optional)

### Routing
- **React Router v6** - Client-side routing
- Route guards for authentication
- Protected routes for admin

### Styling
- **Tailwind CSS** - Utility-first CSS
- **HeadlessUI** - Accessible components
- **Heroicons** - Icon library

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- Client-side + server-side validation

### HTTP Client
- **Axios** - HTTP requests
- Interceptors for auth tokens
- Request/response error handling

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing (optional)

### Build & Deploy
- **Vite** - Development & production builds
- **Docker** - Containerization
- **Nginx** - Serving static files

---

## Responsive Design

### Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Mobile Adaptations

- Stack form fields vertically
- Hamburger menu for navigation
- Swipe gestures for modals
- Touch-friendly button sizes (min 44x44px)
- Simplified tables (card view)

---

## Accessibility

### WCAG 2.1 AA Compliance

- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus indicators
- ✅ Screen reader support (ARIA labels)
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Form field labels and error messages
- ✅ Skip to main content link
- ✅ Semantic HTML

---

## Performance

### Targets

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Bundle Size:** < 300KB gzipped

### Optimizations

- Code splitting by route
- Lazy loading components
- Image optimization
- Caching with TanStack Query
- Debounced search inputs
- Virtual scrolling for large lists (future)

---

## Security Considerations

### Frontend Security

- ✅ No secrets in localStorage (use memory or sessionStorage)
- ✅ HttpOnly cookies for refresh tokens (server-side)
- ✅ HTTPS only
- ✅ Content Security Policy (CSP)
- ✅ XSS protection (React escapes by default)
- ✅ CSRF protection (CORS + tokens)
- ✅ Auto-logout on token expiration
- ✅ Secure password input (no autocomplete)

---

## Summary

**MVP UI Scope Agreed:**
- ✅ 6 main screens (Login, Secrets, Detail, Create/Edit, Audit, Admin)
- ✅ Tab-based navigation
- ✅ Modern React/TypeScript stack
- ✅ Focus on core functionality
- ✅ Clean, minimal design
- ✅ Mobile-responsive
- ✅ Accessible (WCAG 2.1 AA)

**Development Timeline:**
- Week 1: Setup + Auth
- Week 2: Secret Management UI
- Week 3: Audit Logs + Admin UI
- Week 4: Polish + Testing

---

**Approved By:** Product Owner / Solo Developer  
**Date:** November 23, 2025  
**Status:** ✅ Ready for Implementation

