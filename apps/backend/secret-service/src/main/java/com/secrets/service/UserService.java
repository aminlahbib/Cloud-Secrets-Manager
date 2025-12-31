package com.secrets.service;

import com.secrets.entity.User;
import com.secrets.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
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
     * Handles race conditions where multiple requests try to create the same user simultaneously
     */
    @CacheEvict(cacheNames = "userIdsByEmail", key = "#email", condition = "#email != null")
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
        
        // Create new user - handle race condition where another thread might have created it
        try {
            User newUser = new User();
            newUser.setFirebaseUid(firebaseUid);
            newUser.setEmail(email);
            newUser.setDisplayName(displayName);
            newUser.setAvatarUrl(avatarUrl);
            newUser.setPlatformRole(User.PlatformRole.USER);
            newUser.setIsActive(true);
            newUser.setLastLoginAt(LocalDateTime.now());
            newUser.setOnboardingCompleted(false); // New users need to complete onboarding
            
            User saved = userRepository.save(newUser);
            log.info("Created new user: {} ({})", email, firebaseUid);
            return saved;
        } catch (DataIntegrityViolationException e) {
            // Race condition: another thread created the user between our check and save
            // Fetch the existing user and return it
            log.debug("User already exists (race condition), fetching existing user: {} ({})", email, firebaseUid);
            Optional<User> raceConditionUser = userRepository.findByFirebaseUid(firebaseUid);
            if (raceConditionUser.isPresent()) {
                User user = raceConditionUser.get();
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
            // If still not found, rethrow the exception
            throw e;
        }
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
    @CacheEvict(cacheNames = "userIdsByEmail", key = "#user.email", condition = "#user != null && #user.email != null")
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Get current user UUID from email (used in controllers)
     * This is a helper method to extract user ID from authentication
     */
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "userIdsByEmail", key = "#email")
    public UUID getCurrentUserId(String email) {
        return findByEmail(email)
            .map(User::getId)
            .orElseThrow(() -> new IllegalStateException("User not found: " + email));
    }

    /**
     * Check if a user is a platform admin
     * @param email User's email address
     * @return true if user is a platform admin, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isPlatformAdmin(String email) {
        return findByEmail(email)
            .map(user -> user.getPlatformRole() == User.PlatformRole.PLATFORM_ADMIN)
            .orElse(false);
    }

    /**
     * Check if a user is a platform admin by user ID
     * @param userId User's UUID
     * @return true if user is a platform admin, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isPlatformAdmin(UUID userId) {
        return findById(userId)
            .map(user -> user.getPlatformRole() == User.PlatformRole.PLATFORM_ADMIN)
            .orElse(false);
    }
}

