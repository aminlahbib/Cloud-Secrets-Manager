package com.secrets.notification.repository;

import com.secrets.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);
}


