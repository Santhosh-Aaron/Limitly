package com.limitly.service;

import com.limitly.dto.*;
import com.limitly.entity.AuthProvider;
import com.limitly.entity.OtpVerification;
import com.limitly.entity.User;
import com.limitly.exception.AuthException;
import com.limitly.repository.OtpVerificationRepository;
import com.limitly.repository.UserRepository;
import com.limitly.security.GoogleTokenVerifier;
import com.limitly.security.GoogleTokenVerifier.GoogleUserInfo;
import com.limitly.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 30;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int ACCOUNT_LOCK_MINUTES = 15;

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("Passwords do not match", HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH");
        }

        if (userRepository.existsByEmail(email)) {
            throw new AuthException("Email already in use", HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsVerified(false);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        generateAndSendOtp(user, "EMAIL_VERIFICATION");

        return AuthResponse.requireOtp(email, "Signup successful. Please verify the 6-digit OTP sent to your email.");
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        OtpVerification latestOtp = findLatestActiveOtp(email, request.getPurpose());

        validateOtpAttempt(latestOtp, request.getOtp());

        latestOtp.setUsedFlag(true);
        otpRepository.save(latestOtp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if ("EMAIL_VERIFICATION".equals(request.getPurpose())) {
            user.setIsVerified(true);
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
            return buildAuthResponse(user);
        }

        return AuthResponse.requireOtp(email, "OTP verified successfully.");
    }

    @Transactional
    public AuthResponse resendOtp(ResendOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        enforceResendCooldown(email, request.getPurpose());
        generateAndSendOtp(user, request.getPurpose());

        return AuthResponse.requireOtp(email, "A new 6-digit OTP code has been sent to your email.");
    }

    @Transactional
    public AuthResponse authenticate(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new AuthException(
                    "This account uses Google Sign-In. Please log in with Google.",
                    HttpStatus.BAD_REQUEST,
                    "GOOGLE_ACCOUNT"
            );
        }

        if (isAccountLocked(user)) {
            throw new AuthException(
                    "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
                    HttpStatus.UNAUTHORIZED,
                    "ACCOUNT_LOCKED"
            );
        }

        if (user.getIsVerified() != null && !user.getIsVerified()) {
            enforceResendCooldown(email, "EMAIL_VERIFICATION");
            generateAndSendOtp(user, "EMAIL_VERIFICATION");
            return AuthResponse.requireOtp(email, "Account not verified. A new 6-digit OTP has been sent to your email.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            handleFailedLogin(user);
            throw new AuthException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        resetLoginAttempts(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getAuthProvider() == AuthProvider.GOOGLE) {
                return;
            }
            generateAndSendOtp(user, "PASSWORD_RESET");
        });

        return AuthResponse.requireOtp(
                email,
                "If an account exists with this email, a password reset OTP has been sent."
        );
    }

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("New passwords do not match", HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Invalid reset request", HttpStatus.BAD_REQUEST, "INVALID_RESET"));

        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new AuthException(
                    "This account uses Google Sign-In and cannot reset password here.",
                    HttpStatus.BAD_REQUEST,
                    "GOOGLE_ACCOUNT"
            );
        }

        OtpVerification latestOtp = findLatestActiveOtp(email, "PASSWORD_RESET");
        validateOtpAttempt(latestOtp, request.getOtp());

        latestOtp.setUsedFlag(true);
        otpRepository.save(latestOtp);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        AuthResponse resp = new AuthResponse();
        resp.setEmail(email);
        resp.setMessage("Password reset successful. You can now log in with your new password.");
        return resp;
    }

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        GoogleUserInfo googleUser = googleTokenVerifier.verify(request.getIdToken());
        String email = googleUser.email();
        User existing = userRepository.findByEmail(email).orElse(null);

        if (existing != null) {
            if (existing.getGoogleId() != null && !existing.getGoogleId().equals(googleUser.googleId()) && !"google-oauth-direct-connect".equals(googleUser.googleId())) {
                throw new AuthException("Google account mismatch", HttpStatus.UNAUTHORIZED, "GOOGLE_MISMATCH");
            }

            existing.setGoogleId(googleUser.googleId());
            if (googleUser.picture() != null && !googleUser.picture().isEmpty()) {
                existing.setProfilePicture(googleUser.picture());
            }
            existing.setIsVerified(true);
            existing.setFailedLoginAttempts(0);
            existing.setLockedUntil(null);
            if (googleUser.name() != null && !googleUser.name().isBlank() && (existing.getName() == null || existing.getName().isBlank())) {
                existing.setName(googleUser.name());
            }
            userRepository.save(existing);
            return buildAuthResponse(existing);
        }

        User user = new User();
        user.setName(googleUser.name());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setIsVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setGoogleId(googleUser.googleId());
        user.setProfilePicture(googleUser.picture());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    private void generateAndSendOtp(User user, String purpose) {
        invalidatePreviousOtps(user.getEmail(), purpose);

        int otpNum = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(otpNum);

        OtpVerification otpEntity = new OtpVerification();
        otpEntity.setUserId(user.getId());
        otpEntity.setEmail(user.getEmail());
        otpEntity.setOtpHash(passwordEncoder.encode(rawOtp));
        otpEntity.setPurpose(purpose);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpEntity.setUsedFlag(false);
        otpEntity.setCreatedTime(LocalDateTime.now());
        otpRepository.save(otpEntity);

        emailService.sendOtpEmail(user.getEmail(), user.getName(), rawOtp, purpose);
    }

    private void invalidatePreviousOtps(String email, String purpose) {
        List<OtpVerification> activeOtps = otpRepository.findByEmailAndPurposeAndUsedFlagOrderByCreatedTimeDesc(
                email, purpose, false);
        for (OtpVerification otp : activeOtps) {
            otp.setUsedFlag(true);
        }
        if (!activeOtps.isEmpty()) {
            otpRepository.saveAll(activeOtps);
        }
    }

    private OtpVerification findLatestActiveOtp(String email, String purpose) {
        List<OtpVerification> activeOtps = otpRepository.findByEmailAndPurposeAndUsedFlagOrderByCreatedTimeDesc(
                email, purpose, false);

        if (activeOtps.isEmpty()) {
            throw new AuthException(
                    "No active OTP found. Please request a new OTP.",
                    HttpStatus.BAD_REQUEST,
                    "OTP_NOT_FOUND"
            );
        }

        OtpVerification latestOtp = activeOtps.get(0);

        if (latestOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            latestOtp.setUsedFlag(true);
            otpRepository.save(latestOtp);
            throw new AuthException("OTP has expired. Please request a new code.", HttpStatus.BAD_REQUEST, "OTP_EXPIRED");
        }

        return latestOtp;
    }

    private void validateOtpAttempt(OtpVerification otp, String rawOtp) {
        if (!passwordEncoder.matches(rawOtp, otp.getOtpHash())) {
            throw new AuthException(
                    "Invalid OTP code. Please check the code and try again.",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_OTP"
            );
        }
    }

    private void enforceResendCooldown(String email, String purpose) {
        List<OtpVerification> recentOtps = otpRepository.findByEmailAndPurposeOrderByCreatedTimeDesc(email, purpose);
        if (!recentOtps.isEmpty()) {
            OtpVerification lastOtp = recentOtps.get(0);
            if (lastOtp.getCreatedTime().plusSeconds(OTP_RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                throw new AuthException(
                        "Please wait at least 30 seconds before requesting another OTP.",
                        HttpStatus.TOO_MANY_REQUESTS,
                        "OTP_RATE_LIMIT"
                );
            }
        }
    }

    private boolean isAccountLocked(User user) {
        if (user.getLockedUntil() == null) {
            return false;
        }
        if (user.getLockedUntil().isAfter(LocalDateTime.now())) {
            return true;
        }
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        return false;
    }

    private void handleFailedLogin(User user) {
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(ACCOUNT_LOCK_MINUTES));
        }
        userRepository.save(user);
    }

    private void resetLoginAttempts(User user) {
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String jwtToken = jwtService.generateToken(user.getEmail());
        return new AuthResponse(jwtToken, user.getId(), user.getName());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
