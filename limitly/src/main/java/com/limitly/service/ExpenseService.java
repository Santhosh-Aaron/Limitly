package com.limitly.service;

import com.limitly.entity.Expense;
import com.limitly.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public Expense addExpense(Expense expense) {
        // We ensure the date is recorded if the user forgot to send it
        if (expense.getDate() == null) {
            expense.setDate(LocalDate.now());
        }
        return expenseRepository.save(expense);
    }

    public List<Expense> getAllUserExpenses(Long userId) {
        return expenseRepository.findByUserIdOrderByDateDesc(userId);
    }

    public void deleteExpense(Long expenseId) {
        expenseRepository.deleteById(expenseId);
    }
    
    // This will be used by our Analytics and Limits features
    public List<Expense> getExpensesForMonth(Long userId, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserIdAndDateBetween(userId, startDate, endDate);
    }
}