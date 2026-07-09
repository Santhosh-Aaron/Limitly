package com.limitly.service;

import com.limitly.entity.Category;
import com.limitly.entity.Expense;
import com.limitly.entity.RecurringPayment;
import com.limitly.entity.User;
import com.limitly.repository.CategoryRepository;
import com.limitly.repository.ExpenseRepository;
import com.limitly.repository.RecurringPaymentRepository;
import com.limitly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringPaymentService {

    private final RecurringPaymentRepository recurringPaymentRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public List<RecurringPayment> getByUserId(Long userId) {
        List<RecurringPayment> list = recurringPaymentRepository.findByUserId(userId);
        list.sort(Comparator.comparing(RecurringPayment::getNextPaymentDate));
        return list;
    }

    @Transactional
    public RecurringPayment create(Long userId, RecurringPayment rp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        rp.setUser(user);

        if (rp.getCategory() != null && rp.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(rp.getCategory().getId())
                    .orElse(null);
            rp.setCategory(cat);
        }

        if (rp.getNextPaymentDate() == null) {
            rp.setNextPaymentDate(LocalDate.now());
        }

        return recurringPaymentRepository.save(rp);
    }

    @Transactional
    public RecurringPayment update(Long userId, Long id, RecurringPayment updated) {
        RecurringPayment existing = recurringPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring payment not found with id: " + id));

        if (!existing.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this recurring payment");
        }

        existing.setName(updated.getName());
        existing.setAmount(updated.getAmount());
        existing.setFrequency(updated.getFrequency());
        existing.setNextPaymentDate(updated.getNextPaymentDate());

        if (updated.getCategory() != null && updated.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(updated.getCategory().getId()).orElse(null);
            existing.setCategory(cat);
        } else {
            existing.setCategory(null);
        }

        return recurringPaymentRepository.save(existing);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        RecurringPayment existing = recurringPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring payment not found with id: " + id));

        if (!existing.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this recurring payment");
        }

        recurringPaymentRepository.deleteById(id);
    }

    // Scheduled cron job runs daily at 1:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public int scheduledCheckAndProcess() {
        log.info("Running automatic due recurring payment check...");
        return processDuePayments();
    }

    @Transactional
    public int processDuePayments() {
        LocalDate today = LocalDate.now();
        List<RecurringPayment> duePayments = recurringPaymentRepository.findByNextPaymentDateLessThanEqual(today);

        int processedCount = 0;
        for (RecurringPayment rp : duePayments) {
            // Loop in case nextPaymentDate is in the past and needs to catch up until strictly future
            while (!rp.getNextPaymentDate().isAfter(today)) {
                // Create the expense
                Expense expense = new Expense();
                expense.setUser(rp.getUser());
                expense.setCategory(rp.getCategory());
                expense.setAmount(rp.getAmount());
                expense.setDescription(rp.getName() + " (" + rp.getFrequency() + " Recurring)");
                expense.setDate(rp.getNextPaymentDate());
                expenseRepository.save(expense);

                // Advance nextPaymentDate based on frequency
                LocalDate nextDate = rp.getNextPaymentDate();
                String freq = rp.getFrequency() != null ? rp.getFrequency().toLowerCase() : "monthly";
                switch (freq) {
                    case "daily":
                        nextDate = nextDate.plusDays(1);
                        break;
                    case "weekly":
                        nextDate = nextDate.plusWeeks(1);
                        break;
                    case "monthly":
                        nextDate = nextDate.plusMonths(1);
                        break;
                    case "yearly":
                        nextDate = nextDate.plusYears(1);
                        break;
                    default:
                        nextDate = nextDate.plusMonths(1);
                        break;
                }
                rp.setNextPaymentDate(nextDate);
                processedCount++;
            }
            recurringPaymentRepository.save(rp);
        }
        log.info("Processed {} recurring payment renewals into expenses.", processedCount);
        return processedCount;
    }
}
