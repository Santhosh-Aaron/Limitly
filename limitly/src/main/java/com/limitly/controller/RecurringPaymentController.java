package com.limitly.controller;

import com.limitly.entity.RecurringPayment;
import com.limitly.service.RecurringPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recurring")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecurringPaymentController {

    private final RecurringPaymentService recurringPaymentService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RecurringPayment>> getUserRecurringPayments(@PathVariable Long userId) {
        return ResponseEntity.ok(recurringPaymentService.getByUserId(userId));
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<RecurringPayment> createRecurringPayment(@PathVariable Long userId, @RequestBody RecurringPayment recurringPayment) {
        return ResponseEntity.ok(recurringPaymentService.create(userId, recurringPayment));
    }

    @PutMapping("/{id}/user/{userId}")
    public ResponseEntity<RecurringPayment> updateRecurringPayment(@PathVariable Long userId, @PathVariable Long id, @RequestBody RecurringPayment recurringPayment) {
        return ResponseEntity.ok(recurringPaymentService.update(userId, id, recurringPayment));
    }

    @DeleteMapping("/{id}/user/{userId}")
    public ResponseEntity<Void> deleteRecurringPayment(@PathVariable Long userId, @PathVariable Long id) {
        recurringPaymentService.delete(userId, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processDuePayments() {
        int processed = recurringPaymentService.processDuePayments();
        return ResponseEntity.ok(Map.of("message", "Processed due recurring payments", "processedCount", processed));
    }
}
