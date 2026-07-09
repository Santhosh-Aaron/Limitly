package com.limitly.repository;

import com.limitly.entity.RecurringPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface RecurringPaymentRepository extends JpaRepository<RecurringPayment, Long> {
    List<RecurringPayment> findByUserId(Long userId);
    
    // Finds all payments where the due date is today or has passed
    List<RecurringPayment> findByNextPaymentDateLessThanEqual(LocalDate date);
}