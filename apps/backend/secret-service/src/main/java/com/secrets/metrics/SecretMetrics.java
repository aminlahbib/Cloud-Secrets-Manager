package com.secrets.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.function.Supplier;

@Component
public class SecretMetrics {

    private final Map<SecretOperation, Counter> operationCounters = new EnumMap<>(SecretOperation.class);
    private final Timer rotationTimer;

    public SecretMetrics(MeterRegistry meterRegistry) {
        for (SecretOperation operation : SecretOperation.values()) {
            operationCounters.put(operation,
                Counter.builder("secrets.operations.count")
                    .description("Total secret operations grouped by type")
                    .tag("operation", operation.metricTag())
                    .register(meterRegistry)
            );
        }

        this.rotationTimer = Timer.builder("secrets.rotation.duration")
            .description("Duration of secret rotation operations")
            .publishPercentileHistogram()
            .register(meterRegistry);
    }

    public void recordOperation(SecretOperation operation) {
        operationCounters.get(operation).increment();
    }

    public <T> T recordRotation(Supplier<T> supplier) {
        return rotationTimer.record(supplier);
    }

    public enum SecretOperation {
        CREATE("create"),
        READ("read"),
        UPDATE("update"),
        DELETE("delete"),
        ROTATE("rotate");

        private final String metricTag;

        SecretOperation(String metricTag) {
            this.metricTag = metricTag;
        }

        public String metricTag() {
            return metricTag;
        }
    }
}

