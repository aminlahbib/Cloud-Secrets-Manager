package com.secrets.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.cache.CaffeineCacheMetrics;
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
    public CacheManager cacheManager(MeterRegistry meterRegistry) {
        SimpleCacheManager manager = new SimpleCacheManager();
        CaffeineCache projectMemberships = buildCache("projectMemberships", projectMembershipTtl, projectMembershipMaxSize, meterRegistry);
        CaffeineCache userIdsByEmail = buildCache("userIdsByEmail", userIdTtl, userIdMaxSize, meterRegistry);
        manager.setCaches(List.of(projectMemberships, userIdsByEmail));
        return manager;
    }

    private CaffeineCache buildCache(String name, Duration ttl, long maxSize, MeterRegistry meterRegistry) {
        Cache<Object, Object> nativeCache = Caffeine.newBuilder()
            .maximumSize(maxSize)
            .expireAfterWrite(ttl)
            .recordStats()
            .build();

        CaffeineCache cache = new CaffeineCache(name, nativeCache);
        CaffeineCacheMetrics.monitor(meterRegistry, nativeCache, "cache." + name);
        return cache;
    }
}

