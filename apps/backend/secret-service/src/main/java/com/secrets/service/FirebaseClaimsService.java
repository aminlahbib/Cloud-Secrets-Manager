package com.secrets.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FirebaseClaimsService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseClaimsService.class);

    public void assignCustomClaims(String email, List<String> roles, List<String> permissions) throws FirebaseAuthException {
        FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();

        UserRecord userRecord = firebaseAuth.getUserByEmail(email);

        Map<String, Object> claims = new HashMap<>();
        Optional.ofNullable(roles)
            .filter(list -> !list.isEmpty())
            .ifPresent(list -> claims.put("roles", list));

        Optional.ofNullable(permissions)
            .filter(list -> !list.isEmpty())
            .ifPresent(list -> claims.put("permissions", list));

        firebaseAuth.setCustomUserClaims(userRecord.getUid(), claims);

        log.info("Assigned custom claims to {} -> roles={}, permissions={}", email, roles, permissions);
    }
}

