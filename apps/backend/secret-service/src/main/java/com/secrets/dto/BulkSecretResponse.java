package com.secrets.dto;

import java.util.List;
import java.util.Objects;

public class BulkSecretResponse {
    private int total;
    private int successful;
    private int failed;
    private List<SecretResponse> created;
    private List<BulkError> errors;

    public BulkSecretResponse() {
    }

    public BulkSecretResponse(int total, int successful, int failed, List<SecretResponse> created, List<BulkError> errors) {
        this.total = total;
        this.successful = successful;
        this.failed = failed;
        this.created = created;
        this.errors = errors;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getSuccessful() {
        return successful;
    }

    public void setSuccessful(int successful) {
        this.successful = successful;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public List<SecretResponse> getCreated() {
        return created;
    }

    public void setCreated(List<SecretResponse> created) {
        this.created = created;
    }

    public List<BulkError> getErrors() {
        return errors;
    }

    public void setErrors(List<BulkError> errors) {
        this.errors = errors;
    }

    public static BulkSecretResponseBuilder builder() {
        return new BulkSecretResponseBuilder();
    }

    public static class BulkSecretResponseBuilder {
        private int total;
        private int successful;
        private int failed;
        private List<SecretResponse> created;
        private List<BulkError> errors;

        // Getters for direct field access
        public List<SecretResponse> getCreated() {
            return created;
        }

        public List<BulkError> getErrors() {
            return errors;
        }

        public int getSuccessful() {
            return successful;
        }

        public int getFailed() {
            return failed;
        }

        // Helper methods for incrementing counters
        public void incrementSuccessful() {
            this.successful++;
        }

        public void incrementFailed() {
            this.failed++;
        }

        public BulkSecretResponseBuilder total(int total) {
            this.total = total;
            return this;
        }

        public BulkSecretResponseBuilder successful(int successful) {
            this.successful = successful;
            return this;
        }

        public BulkSecretResponseBuilder failed(int failed) {
            this.failed = failed;
            return this;
        }

        public BulkSecretResponseBuilder created(List<SecretResponse> created) {
            this.created = created;
            return this;
        }

        public BulkSecretResponseBuilder errors(List<BulkError> errors) {
            this.errors = errors;
            return this;
        }

        public BulkSecretResponse build() {
            return new BulkSecretResponse(total, successful, failed, created, errors);
        }
    }

    public static class BulkError {
        private String secretKey;
        private String error;
        private String message;

        public BulkError() {
        }

        public BulkError(String secretKey, String error, String message) {
            this.secretKey = secretKey;
            this.error = error;
            this.message = message;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public static BulkErrorBuilder builder() {
            return new BulkErrorBuilder();
        }

        public static class BulkErrorBuilder {
            private String secretKey;
            private String error;
            private String message;

            public BulkErrorBuilder secretKey(String secretKey) {
                this.secretKey = secretKey;
                return this;
            }

            public BulkErrorBuilder error(String error) {
                this.error = error;
                return this;
            }

            public BulkErrorBuilder message(String message) {
                this.message = message;
                return this;
            }

            public BulkError build() {
                return new BulkError(secretKey, error, message);
            }
        }
    }
}
