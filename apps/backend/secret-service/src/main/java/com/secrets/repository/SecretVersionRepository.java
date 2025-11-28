package com.secrets.repository;

import com.secrets.entity.SecretVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecretVersionRepository extends JpaRepository<SecretVersion, UUID> {

    // v3 queries
    List<SecretVersion> findBySecretIdOrderByVersionNumberDesc(UUID secretId);

    Optional<SecretVersion> findBySecretIdAndVersionNumber(UUID secretId, Integer versionNumber);

    @Query("SELECT MAX(sv.versionNumber) FROM SecretVersion sv WHERE sv.secretId = :secretId")
    Optional<Integer> findMaxVersionNumberBySecretId(@Param("secretId") UUID secretId);

    @Query("SELECT COUNT(sv) FROM SecretVersion sv WHERE sv.secretId = :secretId")
    Long countBySecretId(@Param("secretId") UUID secretId);

    void deleteBySecretId(UUID secretId);
}
