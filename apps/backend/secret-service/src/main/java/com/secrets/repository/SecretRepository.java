package com.secrets.repository;

import com.secrets.entity.Secret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SecretRepository extends JpaRepository<Secret, Long> {
    
    Optional<Secret> findBySecretKey(String secretKey);
    
    boolean existsBySecretKey(String secretKey);
    
    void deleteBySecretKey(String secretKey);
}

