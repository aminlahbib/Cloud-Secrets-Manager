package com.audit.controller;

import com.audit.dto.AuditLogRequest;
import com.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class AuditControllerIntegrationTest {

    private static final String API_KEY_HEADER = "X-Service-API-Key";
    private static final String VALID_API_KEY = "test-api-key-12345";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("audit_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private final UUID testProjectId = UUID.randomUUID();
    private final UUID testUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
    }

    private AuditLogRequest createRequest(String action, String resourceType, String resourceName) {
        return new AuditLogRequest(
                testUserId, testProjectId, action, resourceType,
                UUID.randomUUID().toString(), resourceName,
                null, null,
                Map.of("userName", "Test User", "userEmail", "test@example.com")
        );
    }

    private void ingestEvent(String action, String resourceType, String resourceName) throws Exception {
        AuditLogRequest request = createRequest(action, resourceType, resourceName);
        mockMvc.perform(post("/api/audit/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Nested
    @DisplayName("POST /api/audit/log - Event Ingestion")
    class EventIngestion {

        @Test
        @DisplayName("Should create audit log entry and return 201")
        void shouldCreateAuditLogEntry() throws Exception {
            AuditLogRequest request = createRequest("SECRET_CREATE", "SECRET", "DB_PASSWORD");

            mockMvc.perform(post("/api/audit/log")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.action").value("SECRET_CREATE"))
                    .andExpect(jsonPath("$.resourceType").value("SECRET"))
                    .andExpect(jsonPath("$.resourceName").value("DB_PASSWORD"))
                    .andExpect(jsonPath("$.userId").value(testUserId.toString()))
                    .andExpect(jsonPath("$.projectId").value(testProjectId.toString()))
                    .andExpect(jsonPath("$.createdAt").exists())
                    .andExpect(jsonPath("$.description").exists());
        }

        @Test
        @DisplayName("Should reject request without required fields")
        void shouldRejectInvalidRequest() throws Exception {
            AuditLogRequest request = new AuditLogRequest();

            mockMvc.perform(post("/api/audit/log")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should not require API key for POST /log endpoint")
        void shouldNotRequireApiKeyForIngestion() throws Exception {
            AuditLogRequest request = createRequest("SECRET_READ", "SECRET", "API_KEY");

            mockMvc.perform(post("/api/audit/log")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("Should capture IP address from request")
        void shouldCaptureIpAddress() throws Exception {
            AuditLogRequest request = createRequest("SECRET_READ", "SECRET", "TOKEN");

            mockMvc.perform(post("/api/audit/log")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-Forwarded-For", "192.168.1.100")
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.ipAddress").value("192.168.1.100"));
        }
    }

    @Nested
    @DisplayName("GET /api/audit/project/{id} - Project Query")
    class ProjectQuery {

        @Test
        @DisplayName("Should return logs for a project with API key")
        void shouldReturnProjectLogs() throws Exception {
            ingestEvent("SECRET_CREATE", "SECRET", "DB_PASSWORD");
            ingestEvent("SECRET_READ", "SECRET", "API_KEY");

            mockMvc.perform(get("/api/audit/project/" + testProjectId)
                            .header(API_KEY_HEADER, VALID_API_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.content[0].projectId").value(testProjectId.toString()));
        }

        @Test
        @DisplayName("Should reject request without API key")
        void shouldRejectWithoutApiKey() throws Exception {
            mockMvc.perform(get("/api/audit/project/" + testProjectId))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should reject request with invalid API key")
        void shouldRejectInvalidApiKey() throws Exception {
            mockMvc.perform(get("/api/audit/project/" + testProjectId)
                            .header(API_KEY_HEADER, "wrong-key"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return empty page for project with no logs")
        void shouldReturnEmptyForNoLogs() throws Exception {
            mockMvc.perform(get("/api/audit/project/" + UUID.randomUUID())
                            .header(API_KEY_HEADER, VALID_API_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)));
        }

        @Test
        @DisplayName("Should filter by action within a project")
        void shouldFilterByAction() throws Exception {
            ingestEvent("SECRET_CREATE", "SECRET", "DB_PASSWORD");
            ingestEvent("SECRET_READ", "SECRET", "API_KEY");
            ingestEvent("SECRET_DELETE", "SECRET", "OLD_TOKEN");

            mockMvc.perform(get("/api/audit/project/" + testProjectId + "/action/SECRET_CREATE")
                            .header(API_KEY_HEADER, VALID_API_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].action").value("SECRET_CREATE"));
        }

        @Test
        @DisplayName("Should filter by resource type within a project")
        void shouldFilterByResourceType() throws Exception {
            ingestEvent("SECRET_CREATE", "SECRET", "DB_PASSWORD");
            ingestEvent("MEMBER_ADD", "MEMBER", "john@example.com");

            mockMvc.perform(get("/api/audit/project/" + testProjectId + "/resource-type/MEMBER")
                            .header(API_KEY_HEADER, VALID_API_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].resourceType").value("MEMBER"));
        }
    }

    @Nested
    @DisplayName("GET /api/audit/user/{id} - User Query")
    class UserQuery {

        @Test
        @DisplayName("Should return logs for a user")
        void shouldReturnUserLogs() throws Exception {
            ingestEvent("SECRET_CREATE", "SECRET", "DB_PASSWORD");

            mockMvc.perform(get("/api/audit/user/" + testUserId)
                            .header(API_KEY_HEADER, VALID_API_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].userId").value(testUserId.toString()));
        }
    }

    @Nested
    @DisplayName("GET /api/audit - Paginated Global Query")
    class GlobalQuery {

        @Test
        @DisplayName("Should paginate results")
        void shouldPaginateResults() throws Exception {
            for (int i = 0; i < 5; i++) {
                ingestEvent("SECRET_CREATE", "SECRET", "secret_" + i);
            }

            mockMvc.perform(get("/api/audit")
                            .header(API_KEY_HEADER, VALID_API_KEY)
                            .param("page", "0")
                            .param("size", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.totalElements").value(5))
                    .andExpect(jsonPath("$.totalPages").value(3));
        }
    }

    @Nested
    @DisplayName("Immutability Guarantee")
    class Immutability {

        @Test
        @DisplayName("Should persist audit logs without allowing modification")
        void shouldPersistImmutableLogs() throws Exception {
            ingestEvent("SECRET_CREATE", "SECRET", "SENSITIVE_KEY");

            long count = auditLogRepository.count();
            org.assertj.core.api.Assertions.assertThat(count).isEqualTo(1);

            var log = auditLogRepository.findAll().get(0);
            org.assertj.core.api.Assertions.assertThat(log.getAction()).isEqualTo("SECRET_CREATE");
            org.assertj.core.api.Assertions.assertThat(log.getCreatedAt()).isNotNull();
            org.assertj.core.api.Assertions.assertThat(log.getId()).isNotNull();
        }
    }
}
