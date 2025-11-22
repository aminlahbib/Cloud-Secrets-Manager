package com.secrets.repository;

import com.secrets.entity.SecretVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecretVersionRepository extends JpaRepository<SecretVersion, Long> {

    List<SecretVersion> findBySecretKeyOrderByVersionNumberDesc(String secretKey);

    Optional<SecretVersion> findBySecretKeyAndVersionNumber(String secretKey, Integer versionNumber);

    @Query("SELECT MAX(sv.versionNumber) FROM SecretVersion sv WHERE sv.secretKey = :secretKey")
    Optional<Integer> findMaxVersionNumberBySecretKey(String secretKey);

    @Query("SELECT COUNT(sv) FROM SecretVersion sv WHERE sv.secretKey = :secretKey")
    Long countBySecretKey(String secretKey);

    void deleteBySecretKey(String secretKey);
}

