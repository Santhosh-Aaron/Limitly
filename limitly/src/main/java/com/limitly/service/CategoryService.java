package com.limitly.service;

import com.limitly.entity.Category;
import com.limitly.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    // Lombok's @RequiredArgsConstructor automatically injects this repository for us
    private final CategoryRepository categoryRepository;

    public List<Category> getUserCategories(Long userId) {
        // Fetches custom categories for this user AND the global defaults
        return categoryRepository.findByUserIdOrIsDefaultTrue(userId);
    }

    public Category createCustomCategory(Category category) {
        return categoryRepository.save(category);
    }
}