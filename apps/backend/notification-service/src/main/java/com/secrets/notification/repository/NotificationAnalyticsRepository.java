package com.secrets.notification.repository;

import com.secrets.notification.entity.NotificationAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface NotificationAnalyticsRepository extends JpaRepository<NotificationAnalytics, UUID> {

    List<NotificationAnalytics> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<NotificationAnalytics> findByNotificationId(UUID notificationId);

    @Query("SELECT COUNT(DISTINCT na.userId) FROM NotificationAnalytics na WHERE na.notificationId = :notificationId AND na.openedAt IS NOT NULL")
    Long countOpensByNotificationId(UUID notificationId);

    @Query("SELECT COUNT(na) FROM NotificationAnalytics na WHERE na.userId = :userId AND na.openedAt IS NOT NULL")
    Long countOpensByUserId(UUID userId);

    @Query("SELECT COUNT(na) FROM NotificationAnalytics na WHERE na.userId = :userId AND na.clickedAt IS NOT NULL")
    Long countClicksByUserId(UUID userId);
}
