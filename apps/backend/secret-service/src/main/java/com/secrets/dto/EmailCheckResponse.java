package com.secrets.dto;

import com.secrets.dto.invitation.InvitationResponse;
import java.util.List;

public class EmailCheckResponse {
    
    private boolean exists;
    private boolean hasPendingInvitations;
    private List<InvitationResponse> invitations;

    public EmailCheckResponse() {
    }

    public EmailCheckResponse(boolean exists, boolean hasPendingInvitations, List<InvitationResponse> invitations) {
        this.exists = exists;
        this.hasPendingInvitations = hasPendingInvitations;
        this.invitations = invitations;
    }

    public boolean isExists() {
        return exists;
    }

    public void setExists(boolean exists) {
        this.exists = exists;
    }

    public boolean isHasPendingInvitations() {
        return hasPendingInvitations;
    }

    public void setHasPendingInvitations(boolean hasPendingInvitations) {
        this.hasPendingInvitations = hasPendingInvitations;
    }

    public List<InvitationResponse> getInvitations() {
        return invitations;
    }

    public void setInvitations(List<InvitationResponse> invitations) {
        this.invitations = invitations;
    }
}

