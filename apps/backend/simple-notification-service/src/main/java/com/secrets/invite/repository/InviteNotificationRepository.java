package com.secrets.invite.repository;

import com.secrets.invite.entity.InviteNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InviteNotificationRepository extends JpaRepository<InviteNotification, UUID> {

    Page<InviteNotification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT n FROM InviteNotification n WHERE n.userId = :userId AND n.readAt IS NULL ORDER BY n.createdAt DESC")
    List<InviteNotification> findUnreadByUserId(@Param("userId") UUID userId);

    long countByUserIdAndReadAtIsNull(UUID userId);
}

