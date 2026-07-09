package com.limitly.service;

import com.limitly.exception.AuthException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.InternetAddress;

@Service
@Slf4j
public class EmailService {

    private static final String DEV_OTP_LOG_MARKER = "[DEV-ONLY OTP]";

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.dev-mode:false}")
    private boolean devMode;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendOtpEmail(String toEmail, String name, String otp, String purpose) {
        String subject = purpose.equals("EMAIL_VERIFICATION")
                ? "Verify your Limitly Account"
                : "Reset your Limitly Password";

        String titleText = purpose.equals("EMAIL_VERIFICATION")
                ? "Welcome to Limitly, " + name + "!"
                : "Password Reset Request";

        String bodyText = purpose.equals("EMAIL_VERIFICATION")
                ? "Use the verification code below to activate your Limitly account. This code expires in 10 minutes."
                : "Use the code below to reset your password. This code expires in 10 minutes.";

        String htmlContent = buildHtmlEmail(titleText, bodyText, otp);

        if (devMode) {
            log.info("{} To: {} | Purpose: {} | OTP sent (dev mode only)", DEV_OTP_LOG_MARKER, toEmail, purpose);
        }

        if (!hasSmtpCredentials()) {
            if (devMode) {
                log.warn("SMTP not configured. OTP email not sent to {}. Configure MAIL_USERNAME and MAIL_PASSWORD.",
                        toEmail);
                return;
            }
            throw new AuthException(
                    "Email service is not configured. Please contact support.",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "EMAIL_NOT_CONFIGURED");
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(mailUsername, "Limitly(Finance Tracker)"));
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            javaMailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new AuthException(
                    "Failed to send verification email. Please try again later.",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "EMAIL_SEND_FAILED");
        }
    }

    private boolean hasSmtpCredentials() {
        return javaMailSender != null
                && mailUsername != null && !mailUsername.trim().isEmpty()
                && mailPassword != null && !mailPassword.trim().isEmpty();
    }

    private String buildHtmlEmail(String title, String body, String otp) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;'>"
                + "<div style='text-align: center; margin-bottom: 24px;'>"
                + "<h2 style='color: #2563eb; margin: 0;'>Limitly</h2>"
                + "<p style='color: #6b7280; font-size: 14px;'>Smart Expense Tracking & Budgeting</p>"
                + "</div>"
                + "<h3 style='color: #1f2937;'>" + title + "</h3>"
                + "<p style='color: #4b5563; line-height: 1.5;'>" + body + "</p>"
                + "<div style='margin: 32px 0; text-align: center; background-color: #f3f4f6; padding: 20px; border-radius: 8px;'>"
                + "<span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937;'>" + otp
                + "</span>"
                + "</div>"
                + "<p style='color: #9ca3af; font-size: 12px; text-align: center;'>If you did not request this, please ignore this email.</p>"
                + "</div>";
    }
}
