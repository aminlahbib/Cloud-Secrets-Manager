# Teams Feature Analysis & Implementation Plan

## Current State

### ✅ What Exists (Project-Level Collaboration)

**Backend:**
- ✅ Project membership system (`ProjectMembership` entity)
- ✅ Project invitations (`ProjectInvitation` entity)
- ✅ Member management endpoints (`/api/projects/{projectId}/members`)
- ✅ Role-based access control (OWNER, ADMIN, MEMBER, VIEWER)
- ✅ Permission system (`ProjectPermissionService`)
- ✅ Email invitation system (`InvitationService`, `EmailService`)

**Frontend:**
- ✅ Project member management UI (in `ProjectDetail` → Members tab)
- ✅ Invite member functionality
- ✅ Role management
- ✅ Member removal
- ✅ Transfer ownership

**Current Workflow:**
- Users create projects individually
- Project owners/admins invite members to specific projects
- Each project has its own member list
- Members are added to user's default workflow when invited

### ❌ What's Missing (Team-Level Features)

## Missing Features Analysis

### 1. **Team Entity & Database Schema** ❌

**Missing:**
- No `Team` entity in the database
- No `TeamMembership` entity
- No `TeamProject` relationship entity
- No team-related database migrations

**Required:**
```sql
-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Team memberships
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL, -- TEAM_OWNER, TEAM_ADMIN, TEAM_MEMBER
    joined_at TIMESTAMP NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Team projects (many-to-many)
CREATE TABLE team_projects (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    added_by UUID NOT NULL REFERENCES users(id),
    added_at TIMESTAMP NOT NULL,
    UNIQUE(team_id, project_id)
);
```

### 2. **Backend API Endpoints** ❌

**Missing Endpoints:**
- `GET /api/teams` - List all teams user is a member of
- `GET /api/teams/{teamId}` - Get team details
- `POST /api/teams` - Create a new team
- `PUT /api/teams/{teamId}` - Update team (name, description)
- `DELETE /api/teams/{teamId}` - Delete/archive team
- `GET /api/teams/{teamId}/members` - List team members
- `POST /api/teams/{teamId}/members` - Add/invite team member
- `PUT /api/teams/{teamId}/members/{userId}` - Update team member role
- `DELETE /api/teams/{teamId}/members/{userId}` - Remove team member
- `GET /api/teams/{teamId}/projects` - List team projects
- `POST /api/teams/{teamId}/projects` - Add project to team
- `DELETE /api/teams/{teamId}/projects/{projectId}` - Remove project from team
- `POST /api/teams/{teamId}/invitations` - Bulk invite team members
- `GET /api/teams/{teamId}/analytics` - Team activity analytics

**Required Backend Components:**
- `Team` entity (JPA)
- `TeamMembership` entity (JPA)
- `TeamProject` entity (JPA)
- `TeamRepository` (Spring Data JPA)
- `TeamMembershipRepository` (Spring Data JPA)
- `TeamProjectRepository` (Spring Data JPA)
- `TeamService` (Business logic)
- `TeamController` (REST API)
- `TeamPermissionService` (Authorization)

### 3. **Team Roles & Permissions** ❌

**Missing:**
- Team-level roles (TEAM_OWNER, TEAM_ADMIN, TEAM_MEMBER)
- Team permission system
- Default role inheritance for team projects
- Team role → Project role mapping

**Required:**
```java
public enum TeamRole {
    TEAM_OWNER,   // Full control, can delete team
    TEAM_ADMIN,   // Can manage members and projects
    TEAM_MEMBER   // Can view and work on team projects
}
```

### 4. **Frontend Components** ❌

**Missing UI Components:**
- Team list view (grid/card layout)
- Team detail page
- Team creation modal/form
- Team settings page
- Team member management UI
- Team project management UI
- Bulk member invitation UI
- Team analytics dashboard
- Team activity feed

**Current Teams Page:**
- Only shows "Coming Soon" placeholder
- No actual functionality
- No data fetching
- No team management UI

### 5. **Team Features** ❌

**Missing Functionality:**

#### 5.1 Team Workspaces
- ❌ Create team workspaces
- ❌ Organize projects by team
- ❌ Team-specific project views
- ❌ Team dashboard

#### 5.2 Bulk Member Management
- ❌ Add multiple members to team at once
- ❌ CSV import for bulk invitations
- ❌ Bulk role assignment
- ❌ Bulk project access assignment

#### 5.3 Team-Level Permissions
- ❌ Set default roles for team projects
- ❌ Inherit team role to project role
- ❌ Team-wide permission templates
- ❌ Permission inheritance rules

#### 5.4 Team Analytics
- ❌ Team activity tracking
- ❌ Team usage statistics
- ❌ Member activity reports
- ❌ Project activity aggregation
- ❌ Team performance metrics

#### 5.5 Cross-Project Collaboration
- ❌ Manage access to multiple projects from team view
- ❌ Team project list view
- ❌ Add/remove projects from team
- ❌ Team project permissions

### 6. **Integration Points** ❌

**Missing Integrations:**
- Team → Project relationship
- Team → Workflow integration
- Team invitations → Email notifications
- Team activity → Audit logs
- Team analytics → Activity service

## Implementation Priority

### Phase 1: Core Team Infrastructure (High Priority)
1. **Database Schema**
   - Create `teams` table
   - Create `team_memberships` table
   - Create `team_projects` table
   - Add indexes and constraints

2. **Backend Entities & Repositories**
   - `Team` entity
   - `TeamMembership` entity
   - `TeamProject` entity
   - Repositories for all entities

3. **Basic Team Service**
   - Create team
   - List teams
   - Get team details
   - Update team
   - Delete team

4. **Basic Team Controller**
   - CRUD endpoints for teams
   - Basic member management

### Phase 2: Team Member Management (High Priority)
1. **Team Member Service**
   - Add team members
   - Remove team members
   - Update team member roles
   - List team members

2. **Team Member Controller**
   - Member management endpoints
   - Role update endpoints

3. **Frontend Team Member UI**
   - Team member list
   - Add member modal
   - Role management
   - Remove member

### Phase 3: Team-Project Integration (Medium Priority)
1. **Team Project Service**
   - Add project to team
   - Remove project from team
   - List team projects
   - Apply team permissions to projects

2. **Team Project Controller**
   - Project management endpoints

3. **Frontend Team Project UI**
   - Team project list
   - Add/remove projects
   - Project permissions

### Phase 4: Advanced Features (Medium Priority)
1. **Bulk Operations**
   - Bulk member invitations
   - CSV import
   - Bulk role assignment

2. **Team Analytics**
   - Activity tracking
   - Usage statistics
   - Member reports

3. **Team Permissions**
   - Default role templates
   - Permission inheritance
   - Role mapping

### Phase 5: Polish & Optimization (Low Priority)
1. **UI/UX Enhancements**
   - Team dashboard
   - Activity feed
   - Advanced filtering
   - Search functionality

2. **Performance**
   - Caching
   - Query optimization
   - Pagination

3. **Notifications**
   - Team invitation emails
   - Team activity notifications
   - Member join/leave notifications

## Technical Considerations

### Database Design Decisions

**Option 1: Separate Team Entity (Recommended)**
- Teams are independent entities
- Projects can belong to multiple teams (many-to-many)
- More flexible, allows for future features
- More complex queries

**Option 2: Team as Project Group**
- Teams are just project collections
- Simpler implementation
- Less flexible
- Easier to implement initially

**Recommendation:** Option 1 (Separate Team Entity)

### Permission Model

**Team Roles:**
- `TEAM_OWNER`: Full control, can delete team, manage all members
- `TEAM_ADMIN`: Can manage members (except owners), add/remove projects
- `TEAM_MEMBER`: Can view team, work on team projects

**Role Inheritance:**
- Team owners → Project OWNER role (for team projects)
- Team admins → Project ADMIN role (for team projects)
- Team members → Project MEMBER role (for team projects)

### API Design

**RESTful Endpoints:**
```
GET    /api/teams                    # List teams
POST   /api/teams                    # Create team
GET    /api/teams/{id}               # Get team
PUT    /api/teams/{id}               # Update team
DELETE /api/teams/{id}               # Delete team

GET    /api/teams/{id}/members       # List members
POST   /api/teams/{id}/members       # Add member
PUT    /api/teams/{id}/members/{userId}  # Update role
DELETE /api/teams/{id}/members/{userId}  # Remove member

GET    /api/teams/{id}/projects      # List projects
POST   /api/teams/{id}/projects      # Add project
DELETE /api/teams/{id}/projects/{projectId}  # Remove project
```

## Frontend Implementation Plan

### Components to Create

1. **TeamsPage** (enhance existing)
   - Team list view
   - Create team button
   - Team cards/grid

2. **TeamDetailPage** (new)
   - Team overview
   - Members tab
   - Projects tab
   - Settings tab
   - Analytics tab

3. **TeamCard** (new)
   - Team name, description
   - Member count
   - Project count
   - Quick actions

4. **TeamMemberList** (new)
   - Member table/cards
   - Add member button
   - Role management
   - Remove member

5. **TeamProjectList** (new)
   - Project cards
   - Add project button
   - Remove project
   - Project permissions

6. **CreateTeamModal** (new)
   - Team name input
   - Description textarea
   - Initial members (optional)

7. **BulkInviteModal** (new)
   - Email list input
   - CSV upload
   - Role selection
   - Bulk invite

### Services to Create

1. **teams.ts** (new)
   - `listTeams()`
   - `getTeam(id)`
   - `createTeam(data)`
   - `updateTeam(id, data)`
   - `deleteTeam(id)`

2. **teamMembers.ts** (new)
   - `listTeamMembers(teamId)`
   - `addTeamMember(teamId, data)`
   - `updateTeamMemberRole(teamId, userId, role)`
   - `removeTeamMember(teamId, userId)`
   - `bulkInviteMembers(teamId, emails, role)`

3. **teamProjects.ts** (new)
   - `listTeamProjects(teamId)`
   - `addProjectToTeam(teamId, projectId)`
   - `removeProjectFromTeam(teamId, projectId)`

## Estimated Effort

### Backend
- Database migrations: 2-3 hours
- Entities & Repositories: 3-4 hours
- Services: 6-8 hours
- Controllers: 3-4 hours
- Testing: 4-6 hours
- **Total: 18-25 hours**

### Frontend
- Services: 2-3 hours
- Components: 12-16 hours
- Integration: 4-6 hours
- Testing: 4-6 hours
- **Total: 22-31 hours**

### Total Estimated: 40-56 hours

## Dependencies

### Required Before Implementation
- ✅ Project membership system (exists)
- ✅ Permission system (exists)
- ✅ Email service (exists)
- ✅ Audit logging (exists)

### Nice to Have
- Activity aggregation service
- Analytics service enhancements
- Notification preferences

## Risks & Considerations

1. **Data Migration**
   - Existing projects don't have teams
   - Need migration strategy for existing data
   - Consider "Personal" team for existing users

2. **Permission Complexity**
   - Team roles vs Project roles
   - Permission inheritance rules
   - Edge cases (user in team but also direct project member)

3. **Performance**
   - Team queries may be complex
   - Need proper indexing
   - Consider caching for team lists

4. **User Experience**
   - Teams vs Projects confusion
   - Need clear navigation
   - Migration path for existing users

## Recommendations

1. **Start with Phase 1** - Core infrastructure
2. **Implement incrementally** - One phase at a time
3. **Test thoroughly** - Permission edge cases
4. **Document well** - Team concepts and workflows
5. **Consider migration** - How to handle existing projects

## Next Steps

1. Review and approve this analysis
2. Create database migration for teams
3. Implement backend entities and repositories
4. Build basic team service and controller
5. Create frontend services
6. Build UI components incrementally
7. Test and iterate

