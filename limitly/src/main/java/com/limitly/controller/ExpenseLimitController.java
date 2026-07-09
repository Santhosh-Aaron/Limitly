package com.limitly.controller;

import com.limitly.entity.ExpenseLimit;
import com.limitly.service.ExpenseLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/limits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExpenseLimitController {

    private final ExpenseLimitService expenseLimitService;

    @PostMapping
    public ResponseEntity<ExpenseLimit> setLimit(@RequestBody ExpenseLimit limit) {
        return ResponseEntity.ok(expenseLimitService.setMonthlyLimit(limit));
    }

    @GetMapping("/current/user/{userId}")
    public ResponseEntity<ExpenseLimit> getCurrentLimit(
            @PathVariable Long userId,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        ExpenseLimit limit = expenseLimitService.getCurrentLimit(userId, month, year);
        if (limit == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(limit);
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<ExpenseLimit> updateLimit(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        return ResponseEntity.ok(expenseLimitService.updateLimitAmount(userId, amount, month, year));
    }

    @GetMapping("/progress/user/{userId}")
    public ResponseEntity<String> getLimitProgress(
            @PathVariable Long userId,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        String progressAlert = expenseLimitService.checkLimitProgress(userId, month, year);
        return ResponseEntity.ok(progressAlert);
    }
}