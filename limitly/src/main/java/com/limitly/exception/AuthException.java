package com.limitly.exception;

import org.springframework.http.HttpStatus;

public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AuthException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public AuthException(String message) {
        this(message, HttpStatus.BAD_REQUEST, "AUTH_ERROR");
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
