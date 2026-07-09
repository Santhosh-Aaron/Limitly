package com.limitly.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseDTO {
    private Long id;
    private BigDecimal amount;
    private String description;
    private LocalDate date;
    private String categoryName; // Just the name, not the whole Category object
}