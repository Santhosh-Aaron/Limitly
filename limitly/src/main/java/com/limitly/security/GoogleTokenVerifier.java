package com.limitly.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.limitly.exception.AuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.client-id:}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(clientId != null && !clientId.isBlank()
                        ? Collections.singletonList(clientId)
                        : Collections.emptyList())
                .build();
    }

    public GoogleUserInfo verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new AuthException("Google ID token is required", HttpStatus.BAD_REQUEST, "INVALID_GOOGLE_TOKEN");
        }

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new AuthException("Invalid or expired Google token", HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN");
            }

            GoogleIdToken.Payload payload = token.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new AuthException("Google account email not available", HttpStatus.BAD_REQUEST, "GOOGLE_EMAIL_MISSING");
            }

            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified != null && !emailVerified) {
                throw new AuthException("Google email is not verified", HttpStatus.BAD_REQUEST, "GOOGLE_EMAIL_UNVERIFIED");
            }

            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                name = (String) payload.get("given_name");
            }
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }

            return new GoogleUserInfo(
                    email.toLowerCase().trim(),
                    name.trim(),
                    payload.getSubject(),
                    (String) payload.get("picture")
            );
        } catch (AuthException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Google token verification failed: {}", ex.getMessage());
            throw new AuthException("Failed to verify Google token", HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN");
        }
    }

    public record GoogleUserInfo(String email, String name, String googleId, String picture) {}
}
