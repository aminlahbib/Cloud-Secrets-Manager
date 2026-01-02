package com.secrets.invite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.secrets.invite.repository")
@EntityScan(basePackages = {"com.secrets.invite.entity", "com.secrets.entity"})
public class SimpleNotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SimpleNotificationServiceApplication.class, args);
    }
}

