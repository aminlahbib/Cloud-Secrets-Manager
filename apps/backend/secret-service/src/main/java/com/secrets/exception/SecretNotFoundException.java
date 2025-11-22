package com.secrets.exception;

public class SecretNotFoundException extends RuntimeException {
    
    public SecretNotFoundException(String message) {
        super(message);
    }
}

