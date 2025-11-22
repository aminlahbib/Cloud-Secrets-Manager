package com.secrets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SecretServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecretServiceApplication.class, args);
    }
}

