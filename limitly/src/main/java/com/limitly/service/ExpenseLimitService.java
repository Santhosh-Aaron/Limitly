package com.limitly.service;

import com.limitly.entity.Expense;
import com.limitly.entity.ExpenseLimit;
import com.limitly.entity.User;
import com.limitly.repository.ExpenseLimitRepository;
import com.limitly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseLimitService {

    private final ExpenseLimitRepository expenseLimitRepository;
    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    @Transactional
    public ExpenseLimit setMonthlyLimit(ExpenseLimit limit) {
        if (limit.getUser() != null && limit.getUser().getId() != null) {
            List<ExpenseLimit> existing = expenseLimitRepository.findByUserIdAndMonthAndYear(
                    limit.getUser().getId(), limit.getMonth(), limit.getYear());
            if (!existing.isEmpty()) {
                ExpenseLimit current = existing.get(0);
                current.setLimitAmount(limit.getLimitAmount());
                if (limit.getAlertThreshold() != null) {
                    current.setAlertThreshold(limit.getAlertThreshold());
                }
                return expenseLimitRepository.save(current);
            }
        }
        return expenseLimitRepository.save(limit);
    }

    public ExpenseLimit getCurrentLimit(Long userId, Integer month, Integer year) {
        List<ExpenseLimit> limits = expenseLimitRepository.findByUserIdAndMonthAndYear(userId, month, year);
        if (!limits.isEmpty()) {
            return limits.get(0);
        }
        // If not found for exact month/year, check if they have any recent limit
        List<ExpenseLimit> allRecent = expenseLimitRepository.findByUserIdOrderByYearDescMonthDesc(userId);
        if (!allRecent.isEmpty()) {
            return allRecent.get(0);
        }
        return null;
    }

    @Transactional
    public ExpenseLimit updateLimitAmount(Long userId, BigDecimal newAmount, Integer month, Integer year) {
        List<ExpenseLimit> existing = expenseLimitRepository.findByUserIdAndMonthAndYear(userId, month, year);
        if (!existing.isEmpty()) {
            ExpenseLimit current = existing.get(0);
            current.setLimitAmount(newAmount);
            return expenseLimitRepository.save(current);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            ExpenseLimit limit = new ExpenseLimit();
            limit.setUser(user);
            limit.setLimitAmount(newAmount);
            limit.setMonth(month);
            limit.setYear(year);
            limit.setAlertThreshold(80);
            return expenseLimitRepository.save(limit);
        }
    }

    // Core Logic: Calculates progress and generates alerts
    public String checkLimitProgress(Long userId, Integer month, Integer year) {
        List<ExpenseLimit> limits = expenseLimitRepository.findByUserIdAndMonthAndYear(userId, month, year);
        if (limits.isEmpty()) {
            return "No limit set for this month.";
        }
        
        ExpenseLimit currentLimit = limits.get(0);

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Expense> monthlyExpenses = expenseService.getExpensesForMonth(userId, startDate, endDate);
        
        BigDecimal totalSpent = BigDecimal.ZERO;
        for (Expense expense : monthlyExpenses) {
            if (expense.getAmount() != null) {
                totalSpent = totalSpent.add(expense.getAmount());
            }
        }

        BigDecimal limitAmount = currentLimit.getLimitAmount();
        if (limitAmount == null || limitAmount.compareTo(BigDecimal.ZERO) == 0) {
            return "No valid limit set.";
        }

        double percentageUsed = (totalSpent.doubleValue() / limitAmount.doubleValue()) * 100;

        if (percentageUsed >= 100) {
            return "ALERT: You have exceeded your monthly limit! Spent: " + totalSpent + " / " + limitAmount;
        } else if (percentageUsed >= currentLimit.getAlertThreshold()) {
            return "WARNING: You have used " + String.format("%.1f", percentageUsed) + "% of your limit.";
        }

        return "Safe: " + String.format("%.1f", percentageUsed) + "% used. Remaining: " + (limitAmount.subtract(totalSpent));
    }
}