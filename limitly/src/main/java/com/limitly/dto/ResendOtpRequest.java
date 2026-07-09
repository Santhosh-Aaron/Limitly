package com.limitly.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResendOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Purpose is required")
    @Pattern(regexp = "^(EMAIL_VERIFICATION|PASSWORD_RESET)$", message = "Invalid OTP purpose")
    private String purpose;
}
