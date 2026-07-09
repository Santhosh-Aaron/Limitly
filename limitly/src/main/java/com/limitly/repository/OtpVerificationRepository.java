package com.limitly.repository;

import com.limitly.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    List<OtpVerification> findByEmailAndPurposeAndUsedFlagOrderByCreatedTimeDesc(String email, String purpose, Boolean usedFlag);
    List<OtpVerification> findByEmailAndPurposeOrderByCreatedTimeDesc(String email, String purpose);
    List<OtpVerification> findByEmailOrderByCreatedTimeDesc(String email);
}
