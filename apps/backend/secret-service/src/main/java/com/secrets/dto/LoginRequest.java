package com.secrets.dto;

/**
 * Login payload depends on {@code google.cloud.identity.enabled}:
 * <ul>
 *   <li>When enabled: {@code idToken} (Firebase) is required.</li>
 *   <li>When disabled: {@code email} and {@code password} are required (local dev / self-hosted).</li>
 * </ul>
 */
public class LoginRequest {

    private String idToken;
    private String email;
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
