package com.secrets.dto.team;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class BulkInviteRequest {
    
    @NotEmpty(message = "At least one member is required")
    @Size(max = 50, message = "Cannot invite more than 50 members at once")
    @Valid
    private List<TeamMemberRequest> members;

    public BulkInviteRequest() {
    }

    public List<TeamMemberRequest> getMembers() {
        return members;
    }

    public void setMembers(List<TeamMemberRequest> members) {
        this.members = members;
    }
}

