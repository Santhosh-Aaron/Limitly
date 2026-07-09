package com.limitly.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
@Data
@NoArgsConstructor
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(nullable = false, length = 50)
    private String purpose; // EMAIL_VERIFICATION or PASSWORD_RESET

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    @Column(name = "used_flag", nullable = false)
    private Boolean usedFlag = false;

    @Column(name = "raw_otp", length = 10)
    private String rawOtp;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime = LocalDateTime.now();
}
