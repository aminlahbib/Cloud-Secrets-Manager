# Teams Feature - Phase 2: Member & Project Management ✅

## Summary
Phase 2 implements team member management and team-project integration, including member invitations, role management, bulk operations, and project association.

## Completed Components

### 1. Member Management DTOs ✅
- **TeamMemberRequest.java**: Request DTO for adding members (email, role)
- **TeamMemberResponse.java**: Response DTO with member details
- **UpdateMemberRoleRequest.java**: Request DTO for role updates
- **BulkInviteRequest.java**: Request DTO for bulk member invitations (up to 50)

### 2. Member Management Service Methods ✅
Added to `TeamService.java`:
- `listTeamMembers()`: List all members of a team
- `addTeamMember()`: Add member by email (user must exist in system)
- `removeTeamMember()`: Remove member from team
- `updateMemberRole()`: Update member's role (TEAM_OWNER, TEAM_ADMIN, TEAM_MEMBER)
- `bulkInviteMembers()`: Invite multiple members at once

**Permission Rules:**
- Only TEAM_OWNER or TEAM_ADMIN can add/remove/update members
- Only TEAM_OWNER can assign TEAM_OWNER role
- Cannot remove last owner
- Cannot remove yourself if you're the only owner

### 3. Member Management REST Endpoints ✅
Added to `TeamController.java`:
- `GET /api/teams/{id}/members` - List team members
- `POST /api/teams/{id}/members` - Add team member
- `DELETE /api/teams/{id}/members/{memberId}` - Remove team member
- `PUT /api/teams/{id}/members/{memberId}/role` - Update member role
- `POST /api/teams/{id}/members/bulk-invite` - Bulk invite members

### 4. Project Management DTO ✅
- **TeamProjectResponse.java**: Response DTO with project details and metadata

### 5. Project Management Service Methods ✅
Added to `TeamService.java`:
- `listTeamProjects()`: List all projects in a team
- `addProjectToTeam()`: Add project to team (user must have access to project)
- `removeProjectFromTeam()`: Remove project from team

**Permission Rules:**
- Only TEAM_OWNER or TEAM_ADMIN can add/remove projects
- User must have access to the project (be a project member) to add it
- Projects must not be archived

### 6. Project Management REST Endpoints ✅
Added to `TeamController.java`:
- `GET /api/teams/{id}/projects` - List team projects
- `POST /api/teams/{id}/projects/{projectId}` - Add project to team
- `DELETE /api/teams/{id}/projects/{projectId}` - Remove project from team

## API Endpoints

### Member Management

#### List Team Members
```
GET /api/teams/{id}/members
Authorization: Bearer <token>
Response: List<TeamMemberResponse>
```

#### Add Team Member
```
POST /api/teams/{id}/members
Authorization: Bearer <token>
Body: { "email": "user@example.com", "role": "TEAM_MEMBER" }
Response: TeamMemberResponse (201 Created)
```

#### Remove Team Member
```
DELETE /api/teams/{id}/members/{memberId}
Authorization: Bearer <token>
Response: 204 No Content
```

#### Update Member Role
```
PUT /api/teams/{id}/members/{memberId}/role
Authorization: Bearer <token>
Body: { "role": "TEAM_ADMIN" }
Response: TeamMemberResponse
```

#### Bulk Invite Members
```
POST /api/teams/{id}/members/bulk-invite
Authorization: Bearer <token>
Body: { "members": [{ "email": "user1@example.com", "role": "TEAM_MEMBER" }, ...] }
Response: List<TeamMemberResponse> (201 Created)
```

### Project Management

#### List Team Projects
```
GET /api/teams/{id}/projects
Authorization: Bearer <token>
Response: List<TeamProjectResponse>
```

#### Add Project to Team
```
POST /api/teams/{id}/projects/{projectId}
Authorization: Bearer <token>
Response: TeamProjectResponse (201 Created)
```

#### Remove Project from Team
```
DELETE /api/teams/{id}/projects/{projectId}
Authorization: Bearer <token>
Response: 204 No Content
```

## Role-Based Access Control

### Member Management Permissions
- **TEAM_OWNER**: Can add/remove/update any member, can assign any role
- **TEAM_ADMIN**: Can add/remove/update members (except owners), cannot assign TEAM_OWNER role
- **TEAM_MEMBER**: Read-only access to member list

### Project Management Permissions
- **TEAM_OWNER**: Can add/remove any project (if they have access to it)
- **TEAM_ADMIN**: Can add/remove any project (if they have access to it)
- **TEAM_MEMBER**: Read-only access to project list

## Business Rules

### Member Management
1. Users must exist in the system (by email) to be added
2. Cannot add duplicate members
3. Cannot remove the last owner
4. Cannot remove yourself if you're the only owner
5. Bulk invite supports up to 50 members at once
6. Bulk invite returns partial results if some fail

### Project Management
1. Projects must exist and not be archived
2. User adding project must have access to it (be a project member)
3. Cannot add duplicate projects to a team
4. Removing project from team does not delete the project

## Files Created/Modified

### New Files
```
apps/backend/secret-service/src/main/java/com/secrets/dto/team/TeamMemberRequest.java
apps/backend/secret-service/src/main/java/com/secrets/dto/team/TeamMemberResponse.java
apps/backend/secret-service/src/main/java/com/secrets/dto/team/UpdateMemberRoleRequest.java
apps/backend/secret-service/src/main/java/com/secrets/dto/team/BulkInviteRequest.java
apps/backend/secret-service/src/main/java/com/secrets/dto/team/TeamProjectResponse.java
```

### Modified Files
```
apps/backend/secret-service/src/main/java/com/secrets/service/TeamService.java
apps/backend/secret-service/src/main/java/com/secrets/controller/TeamController.java
```

## Commit History

- `11ab8460` - Add member management DTOs
- `4f8ddc42` - Add member management methods to TeamService
- `62626730` - Add member management endpoints to TeamController
- `0b655037` - Add project management methods to TeamService
- `449fde7f` - Add project management endpoints to TeamController
- `[latest]` - Fix unused variable warnings

## Next Steps (Phase 3)

Phase 3 will implement:
- Frontend UI for team management
- Team member list and management UI
- Project management UI
- Bulk operations UI
- Team dashboard

## Testing Notes

To test Phase 2:
1. Start backend service
2. Use Swagger UI at `/swagger-ui/index.html` to test endpoints
3. Test member management:
   - Create a team
   - Add members by email
   - Update member roles
   - Remove members
   - Bulk invite members
4. Test project management:
   - Add projects to team
   - List team projects
   - Remove projects from team

