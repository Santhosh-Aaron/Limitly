package com.limitly.controller;

import com.limitly.entity.Category;
import com.limitly.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows your React app to talk to this API
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Category>> getUserCategories(@PathVariable Long userId) {
        return ResponseEntity.ok(categoryService.getUserCategories(userId));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.createCustomCategory(category));
    }
}