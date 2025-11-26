package com.secrets.service;

import com.secrets.entity.User;
import com.secrets.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing users in the v3 architecture.
 * Syncs Firebase users to local database.
 */
@Service
@Transactional
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get or create user from Firebase UID
     * This is called during login to ensure user exists in our database
     */
    public User getOrCreateUser(String firebaseUid, String email, String displayName, String avatarUrl) {
        Optional<User> existing = userRepository.findByFirebaseUid(firebaseUid);
        
        if (existing.isPresent()) {
            User user = existing.get();
            // Update last login
            user.setLastLoginAt(LocalDateTime.now());
            // Update profile info if changed
            if (displayName != null && !displayName.equals(user.getDisplayName())) {
                user.setDisplayName(displayName);
            }
            if (avatarUrl != null && !avatarUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(avatarUrl);
            }
            return userRepository.save(user);
        }
        
        // Create new user
        User newUser = new User();
        newUser.setFirebaseUid(firebaseUid);
        newUser.setEmail(email);
        newUser.setDisplayName(displayName);
        newUser.setAvatarUrl(avatarUrl);
        newUser.setPlatformRole(User.PlatformRole.USER);
        newUser.setIsActive(true);
        newUser.setLastLoginAt(LocalDateTime.now());
        
        User saved = userRepository.save(newUser);
        log.info("Created new user: {} ({})", email, firebaseUid);
        
        return saved;
    }

    /**
     * Get user by Firebase UID
     */
    @Transactional(readOnly = true)
    public Optional<User> findByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }

    /**
     * Get user by email
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Update user
     */
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Get current user UUID from email (used in controllers)
     * This is a helper method to extract user ID from authentication
     */
    @Transactional(readOnly = true)
    public UUID getCurrentUserId(String email) {
        return findByEmail(email)
            .map(User::getId)
            .orElseThrow(() -> new IllegalStateException("User not found: " + email));
    }
}

