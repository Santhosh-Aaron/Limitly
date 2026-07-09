package com.limitly.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "expense_limits")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExpenseLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    // If null, this represents the Global Monthly Limit
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "limit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal limitAmount;

    @Column(name = "alert_threshold")
    private Integer alertThreshold = 80;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;
}
