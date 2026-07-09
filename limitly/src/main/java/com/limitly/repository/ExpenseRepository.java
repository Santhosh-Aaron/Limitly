package com.limitly.repository;

import com.limitly.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserIdOrderByDateDesc(Long userId);
    
    // Crucial for calculating "This Month's Expense" and Limits
    List<Expense> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}