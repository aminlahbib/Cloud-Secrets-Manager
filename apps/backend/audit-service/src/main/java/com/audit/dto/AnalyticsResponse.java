package com.audit.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {
    private long totalActions;
    private Map<String, Long> actionsByType;
    private Map<String, Long> actionsByUser;
    private Map<String, Long> actionsByDay;
    private List<TopItem> topActions;
    private List<TopUser> topUsers;

    public AnalyticsResponse() {
    }

    public AnalyticsResponse(long totalActions, Map<String, Long> actionsByType, 
                           Map<String, Long> actionsByUser, Map<String, Long> actionsByDay,
                           List<TopItem> topActions, List<TopUser> topUsers) {
        this.totalActions = totalActions;
        this.actionsByType = actionsByType;
        this.actionsByUser = actionsByUser;
        this.actionsByDay = actionsByDay;
        this.topActions = topActions;
        this.topUsers = topUsers;
    }

    // Getters and Setters
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

    public static class TopItem {
        private String action;
        private long count;

        public TopItem() {
        }

        public TopItem(String action, long count) {
            this.action = action;
            this.count = count;
        }

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

    public static class TopUser {
        private String userId;
        private String email;
        private long count;

        public TopUser() {
        }

        public TopUser(String userId, String email, long count) {
            this.userId = userId;
            this.email = email;
            this.count = count;
        }

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

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}

