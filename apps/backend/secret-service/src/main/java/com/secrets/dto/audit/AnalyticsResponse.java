package com.secrets.dto.audit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalyticsResponse {
    
    @JsonProperty("totalActions")
    private long totalActions;
    
    @JsonProperty("actionsByType")
    private Map<String, Long> actionsByType;
    
    @JsonProperty("actionsByUser")
    private Map<String, Long> actionsByUser;
    
    @JsonProperty("actionsByDay")
    private Map<String, Long> actionsByDay;
    
    @JsonProperty("topActions")
    private List<TopItem> topActions;
    
    @JsonProperty("topUsers")
    private List<TopUser> topUsers;

    public long getTotalActions() {
        return totalActions;
    }

    public void setTotalActions(long totalActions) {
        this.totalActions = totalActions;
    }

    public Map<String, Long> getActionsByType() {
        return actionsByType;
    }

    public void setActionsByType(Map<String, Long> actionsByType) {
        this.actionsByType = actionsByType;
    }

    public Map<String, Long> getActionsByUser() {
        return actionsByUser;
    }

    public void setActionsByUser(Map<String, Long> actionsByUser) {
        this.actionsByUser = actionsByUser;
    }

    public Map<String, Long> getActionsByDay() {
        return actionsByDay;
    }

    public void setActionsByDay(Map<String, Long> actionsByDay) {
        this.actionsByDay = actionsByDay;
    }

    public List<TopItem> getTopActions() {
        return topActions;
    }

    public void setTopActions(List<TopItem> topActions) {
        this.topActions = topActions;
    }

    public List<TopUser> getTopUsers() {
        return topUsers;
    }

    public void setTopUsers(List<TopUser> topUsers) {
        this.topUsers = topUsers;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TopItem {
        @JsonProperty("action")
        private String action;
        
        @JsonProperty("count")
        private long count;

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TopUser {
        @JsonProperty("userId")
        private String userId;
        
        @JsonProperty("email")
        private String email;
        
        @JsonProperty("displayName")
        private String displayName;
        
        @JsonProperty("count")
        private long count;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}

