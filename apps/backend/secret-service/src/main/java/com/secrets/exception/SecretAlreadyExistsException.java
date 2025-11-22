package com.secrets.exception;

public class SecretAlreadyExistsException extends RuntimeException {
    
    public SecretAlreadyExistsException(String message) {
        super(message);
    }
}

