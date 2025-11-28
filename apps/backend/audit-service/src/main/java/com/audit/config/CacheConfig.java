package com.audit.config;

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

    @Value("${audit.cache.project-logs.ttl:PT5M}")
    private Duration projectLogsTtl;

    @Value("${audit.cache.project-logs.maximum-size:1000}")
    private long projectLogsMaxSize;

    @Value("${audit.cache.analytics.ttl:PT1M}")
    private Duration analyticsTtl;

    @Value("${audit.cache.analytics.maximum-size:500}")
    private long analyticsMaxSize;

    @Bean
    public CacheManager cacheManager(MeterRegistry meterRegistry) {
        SimpleCacheManager manager = new SimpleCacheManager();
        
        CaffeineCache projectAuditLogs = buildCache(
            "projectAuditLogs", 
            projectLogsTtl, 
            projectLogsMaxSize, 
            meterRegistry
        );
        
        CaffeineCache analytics = buildCache(
            "analytics", 
            analyticsTtl, 
            analyticsMaxSize, 
            meterRegistry
        );
        
        manager.setCaches(List.of(projectAuditLogs, analytics));
        return manager;
    }

    private CaffeineCache buildCache(
            String name, 
            Duration ttl, 
            long maxSize, 
            MeterRegistry meterRegistry) {
        Cache<Object, Object> cache = Caffeine.newBuilder()
            .expireAfterWrite(ttl)
            .maximumSize(maxSize)
            .recordStats()
            .build();
        
        // Register metrics
        CaffeineCacheMetrics.monitor(meterRegistry, cache, name);
        
        return new CaffeineCache(name, cache);
    }
}

