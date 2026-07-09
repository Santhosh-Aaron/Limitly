package com.limitly.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 10)
    private String currency = "INR";

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", length = 20)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
