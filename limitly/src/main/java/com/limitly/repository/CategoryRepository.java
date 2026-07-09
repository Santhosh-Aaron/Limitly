package com.limitly.repository;

import com.limitly.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Finds custom categories for a specific user OR the global defaults
    List<Category> findByUserIdOrIsDefaultTrue(Long userId);
}