package com.secrets.notification.dto;

import java.time.Instant;

public class NotificationFilterDto {
    private String type;
    private Instant startDate;
    private Instant endDate;
    private Integer page;
    private Integer size;

    public NotificationFilterDto() {
        this.page = 0;
        this.size = 50;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public void setEndDate(Instant endDate) {
        this.endDate = endDate;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }
}
