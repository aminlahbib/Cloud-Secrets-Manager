package com.secrets.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GoogleIdentityService {

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;

    /**
     * Set custom claims (roles) for a user in Google Identity Platform
     * Note: User must re-authenticate for claims to take effect
     */
    public void setUserRoles(String uid, List<String> roles) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        // Get existing claims to preserve permissions
        UserRecord user = firebaseAuth.getUser(uid);
        Map<String, Object> claims = new HashMap<>(user.getCustomClaims());
        claims.put("roles", roles);
        
        firebaseAuth.setCustomUserClaims(uid, claims);
        log.info("Set roles {} for user {}", roles, uid);
    }

    /**
     * Set custom claims (permissions) for a user in Google Identity Platform
     * Note: User must re-authenticate for claims to take effect
     */
    public void setUserPermissions(String uid, List<String> permissions) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        // Get existing claims to preserve roles
        UserRecord user = firebaseAuth.getUser(uid);
        Map<String, Object> claims = new HashMap<>(user.getCustomClaims());
        claims.put("permissions", permissions);
        
        firebaseAuth.setCustomUserClaims(uid, claims);
        log.info("Set permissions {} for user {}", permissions, uid);
    }

    /**
     * Set both roles and permissions for a user in Google Identity Platform
     * Note: User must re-authenticate for claims to take effect
     */
    public void setUserRolesAndPermissions(String uid, List<String> roles, List<String> permissions) 
            throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        claims.put("permissions", permissions);
        
        firebaseAuth.setCustomUserClaims(uid, claims);
        log.info("Set roles {} and permissions {} for user {}", roles, permissions, uid);
    }

    /**
     * Get user from Google Identity Platform by UID
     */
    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        return firebaseAuth.getUser(uid);
    }

    /**
     * Get user from Google Identity Platform by email
     */
    public UserRecord getUserByEmail(String email) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        return firebaseAuth.getUserByEmail(email);
    }

    /**
     * Create user in Google Identity Platform
     */
    public UserRecord createUser(String email, String password) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
            .setEmail(email)
            .setPassword(password)
            .setEmailVerified(false);

        UserRecord userRecord = firebaseAuth.createUser(request);
        log.info("Created user in Google Identity Platform: {}", email);
        return userRecord;
    }

    /**
     * Create user with initial roles
     */
    public UserRecord createUserWithRoles(String email, String password, List<String> roles) 
            throws FirebaseAuthException {
        UserRecord userRecord = createUser(email, password);
        setUserRoles(userRecord.getUid(), roles);
        return userRecord;
    }

    /**
     * Delete user from Google Identity Platform
     */
    public void deleteUser(String uid) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        firebaseAuth.deleteUser(uid);
        log.info("Deleted user from Google Identity Platform: {}", uid);
    }

    /**
     * Update user email
     */
    public UserRecord updateUserEmail(String uid, String newEmail) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
            .setEmail(newEmail);

        UserRecord userRecord = firebaseAuth.updateUser(request);
        log.info("Updated email for user {} to {}", uid, newEmail);
        return userRecord;
    }

    /**
     * Disable user account
     */
    public UserRecord disableUser(String uid) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
            .setDisabled(true);

        UserRecord userRecord = firebaseAuth.updateUser(request);
        log.info("Disabled user: {}", uid);
        return userRecord;
    }

    /**
     * Enable user account
     */
    public UserRecord enableUser(String uid) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
            .setDisabled(false);

        UserRecord userRecord = firebaseAuth.updateUser(request);
        log.info("Enabled user: {}", uid);
        return userRecord;
    }

    /**
     * Get user's custom claims (roles and permissions) from Google Identity Platform
     * Returns a map with "roles" and "permissions" keys
     */
    public Map<String, Object> getUserClaims(String email) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled");
        }

        UserRecord user = firebaseAuth.getUserByEmail(email);
        return user.getCustomClaims();
    }
}

