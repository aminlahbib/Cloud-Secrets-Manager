package com.secrets.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${app.cache.project-memberships.ttl:PT2M}")
    private Duration projectMembershipTtl;

    @Value("${app.cache.project-memberships.maximum-size:10000}")
    private long projectMembershipMaxSize;

    @Value("${app.cache.user-ids.ttl:PT5M}")
    private Duration userIdTtl;

    @Value("${app.cache.user-ids.maximum-size:20000}")
    private long userIdMaxSize;

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
            buildCache("projectMemberships", projectMembershipTtl, projectMembershipMaxSize),
            buildCache("userIdsByEmail", userIdTtl, userIdMaxSize)
        ));
        return manager;
    }

    private CaffeineCache buildCache(String name, Duration ttl, long maxSize) {
        return new CaffeineCache(
            name,
            Caffeine.newBuilder()
                .maximumSize(maxSize)
                .expireAfterWrite(ttl)
                .recordStats()
                .build()
        );
    }
}

