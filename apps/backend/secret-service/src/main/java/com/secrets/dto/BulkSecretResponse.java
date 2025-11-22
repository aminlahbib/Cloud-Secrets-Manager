package com.secrets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkSecretResponse {
    private int total;
    private int successful;
    private int failed;
    private List<SecretResponse> created;
    private List<BulkError> errors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BulkError {
        private String secretKey;
        private String error;
        private String message;
    }
}

