package com.secrets.notification.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.notification.dto.NotificationDto;
import com.secrets.notification.entity.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

/**
 * Mapper for converting between Notification entity and DTO.
 * Centralizes mapping logic to avoid code duplication.
 */
@Component
public class NotificationMapper {

    private static final Logger log = LoggerFactory.getLogger(NotificationMapper.class);
    
    private final ObjectMapper objectMapper;

    public NotificationMapper(ObjectMapper objectMapper) {
        if (objectMapper == null) {
            throw new IllegalArgumentException("ObjectMapper cannot be null");
        }
        this.objectMapper = objectMapper;
    }

    /**
     * Convert Notification entity to DTO.
     * 
     * @param notification Notification entity
     * @return NotificationDto
     */
    public NotificationDto toDto(Notification notification) {
        if (notification == null) {
            return null;
        }
        
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType() != null ? notification.getType() : "");
        dto.setTitle(notification.getTitle() != null ? notification.getTitle() : "");
        dto.setBody(notification.getBody());
        dto.setCreatedAt(notification.getCreatedAt() != null ? notification.getCreatedAt() : java.time.Instant.now());
        dto.setReadAt(notification.getReadAt());

        if (notification.getMetadata() != null) {
            try {
                Map<String, Object> metadata = objectMapper.readValue(
                        notification.getMetadata(),
                        new TypeReference<Map<String, Object>>() {});
                dto.setMetadata(metadata);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse notification metadata for {}: {}", 
                        notification.getId(), e.getMessage());
                dto.setMetadata(Collections.emptyMap());
            }
        } else {
            dto.setMetadata(Collections.emptyMap());
        }

        return dto;
    }
}

