package com.limitly.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private Boolean requiresOtp = false;
    private String email;
    private String message;

    public AuthResponse(String token, Long userId, String name) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.requiresOtp = false;
    }

    public static AuthResponse requireOtp(String email, String message) {
        AuthResponse resp = new AuthResponse();
        resp.setRequiresOtp(true);
        resp.setEmail(email);
        resp.setMessage(message);
        return resp;
    }
}