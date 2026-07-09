package com.limitly.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private final Key signInKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secretKey,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.signInKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(String email) {
        return generateToken(new HashMap<>(), email);
    }

    public String generateToken(Map<String, Object> extraClaims, String email) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signInKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, String userEmail) {
        final String email = extractEmail(token);
        return email.equals(userEmail) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(signInKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
