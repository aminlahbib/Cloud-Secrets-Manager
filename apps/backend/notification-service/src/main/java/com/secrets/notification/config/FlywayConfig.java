package com.secrets.notification.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.Location;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Custom Flyway configuration to prevent conflicts when multiple services
 * share the same database.
 * 
 * The notification-service includes secret-service as a dependency, which
 * causes Flyway to find duplicate migration versions. This configuration
 * uses a service-specific Flyway table to track migrations separately.
 * 
 * Note: Flyway will still scan all classpath migrations, but using a
 * separate table prevents conflicts. The duplicate V9 issue in secret-service
 * itself needs to be fixed in that service.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    /**
     * Custom Flyway bean with service-specific table name.
     * This allows notification-service to track its own migrations separately
     * from other services sharing the same database.
     */
    @Bean
    @Primary
    public Flyway flyway(DataSource dataSource) {
        FluentConfiguration config = Flyway.configure()
                .dataSource(dataSource)
                .table("flyway_notification_schema_history")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(true)
                // Only scan notification-service migrations, not dependencies
                .locations(new Location("classpath:db/migration/notification"));
        
        Flyway flyway = config.load();
        log.info("Configured Flyway for notification-service with table: flyway_notification_schema_history");
        log.info("Scanning migrations from: classpath:db/migration/notification (excludes dependency migrations)");
        
        return flyway;
    }

    /**
     * Custom migration initializer that runs migrations.
     */
    @Bean
    public FlywayMigrationInitializer flywayInitializer(Flyway flyway) {
        return new FlywayMigrationInitializer(flyway, null);
    }
}

