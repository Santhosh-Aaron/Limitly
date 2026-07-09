package com.limitly.dto;

import com.limitly.validation.PasswordValidator;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits")
    private String otp;

    @NotBlank(message = "New password is required")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=\\[\\]{}|:;,.<>]).{8,128}$",
            message = PasswordValidator.PASSWORD_MESSAGE)
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
