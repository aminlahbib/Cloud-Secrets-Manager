package com.secrets.repository;

import com.secrets.entity.SharedSecret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedSecretRepository extends JpaRepository<SharedSecret, Long> {
    
    List<SharedSecret> findBySecretKey(String secretKey);
    
    List<SharedSecret> findBySharedWith(String sharedWith);
    
    Optional<SharedSecret> findBySecretKeyAndSharedWith(String secretKey, String sharedWith);
    
    boolean existsBySecretKeyAndSharedWith(String secretKey, String sharedWith);
    
    void deleteBySecretKey(String secretKey);
    
    void deleteBySecretKeyAndSharedWith(String secretKey, String sharedWith);
}

