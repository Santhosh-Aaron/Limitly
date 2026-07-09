package com.limitly.repository;

import com.limitly.entity.ExpenseLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseLimitRepository extends JpaRepository<ExpenseLimit, Long> {
    List<ExpenseLimit> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);
    Optional<ExpenseLimit> findByUserIdAndCategoryIdAndMonthAndYear(Long userId, Long categoryId, Integer month, Integer year);
    List<ExpenseLimit> findByUserIdOrderByYearDescMonthDesc(Long userId);
}