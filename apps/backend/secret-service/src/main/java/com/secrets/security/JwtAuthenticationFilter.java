package com.secrets.security;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.secrets.service.UserService;
import com.secrets.service.WorkflowService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    
    @Autowired(required = false)
    private GoogleIdentityTokenValidator firebaseTokenValidator;
    
    @Autowired(required = false)
    private UserService userService;
    
    @Autowired(required = false)
    private WorkflowService workflowService;
    
    @Value("${google.cloud.identity.enabled:false}")
    private boolean firebaseEnabled;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt)) {
                Authentication authentication = null;
                
                // Try Firebase validation first if enabled
                if (firebaseEnabled && firebaseTokenValidator != null) {
                    try {
                        authentication = firebaseTokenValidator.validateToken(jwt);
                        log.debug("Successfully validated Firebase ID token");
                        
                        // Auto-create user in local database if they don't exist
                        if (authentication != null && authentication.getDetails() instanceof FirebaseToken && userService != null) {
                            try {
                                FirebaseToken firebaseToken = (FirebaseToken) authentication.getDetails();
                                String uid = firebaseToken.getUid();
                                String email = firebaseToken.getEmail();
                                String displayName = firebaseToken.getName();
                                String photoUrl = firebaseToken.getPicture();
                                
                                // Ensure user exists in local database
                                com.secrets.entity.User user = userService.getOrCreateUser(uid, email, displayName, photoUrl);
                                log.debug("Ensured user exists in local database: {}", email);
                                
                                // Ensure default workflow exists for the user
                                if (workflowService != null) {
                                    try {
                                        workflowService.ensureDefaultWorkflow(user.getId());
                                        log.debug("Ensured default workflow exists for user: {}", email);
                                    } catch (Exception e) {
                                        log.warn("Failed to create default workflow for user, continuing: {}", e.getMessage());
                                        // Don't fail authentication if workflow creation fails
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Failed to create/update user in local database, continuing with authentication: {}", e.getMessage());
                                // Don't fail authentication if user creation fails
                            }
                        }
                    } catch (FirebaseAuthException e) {
                        log.debug("Token is not a valid Firebase token, trying local JWT: {}", e.getMessage());
                        // Fall through to local JWT validation
                    } catch (IllegalStateException e) {
                        log.debug("Firebase not initialized, using local JWT validation: {}", e.getMessage());
                        // Fall through to local JWT validation
                    }
                }
                
                // Fall back to local JWT validation if Firebase validation failed or disabled
                if (authentication == null && tokenProvider.validateToken(jwt)) {
                    String username = tokenProvider.getUsername(jwt);
                    Collection<? extends GrantedAuthority> authorities = tokenProvider.getAuthorities(jwt);
                    
                    // Create UserDetails from JWT token (no database lookup needed)
                    User userDetails = new User(username, "", authorities);
                    
                    authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities
                    );
                    ((UsernamePasswordAuthenticationToken) authentication).setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    
                    log.debug("Successfully validated local JWT token");
                }
                
                // Set authentication in context if validation succeeded
                if (authentication != null) {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }
        
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

