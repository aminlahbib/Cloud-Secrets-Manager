package com.secrets.notification.repository;

import com.secrets.notification.entity.EmailDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery, UUID> {

    List<EmailDelivery> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    List<EmailDelivery> findByStatus(EmailDelivery.DeliveryStatus status);
}
