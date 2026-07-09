package com.limitly.config;

import com.limitly.entity.Category;
import com.limitly.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        log.info("Checking if database seeding is required...");
        
        // Seed default categories if none exist globally (where userId is null)
        long defaultCategoryCount = categoryRepository.findByUserIdOrIsDefaultTrue(null).stream()
                .filter(Category::getIsDefault)
                .count();

        if (defaultCategoryCount == 0) {
            log.info("No default categories found. Seeding initial categories into database...");
            
            List<String> defaultCategories = Arrays.asList(
                    "Food", "Transport", "Shopping", "Entertainment", "Health", "Bills", "Others"
            );

            for (String catName : defaultCategories) {
                Category category = new Category();
                category.setName(catName);
                category.setIsDefault(true);
                categoryRepository.save(category);
            }
            
            log.info("Successfully seeded {} default categories.", defaultCategories.size());
        } else {
            log.info("Database already contains {} default categories. Skipping seed.", defaultCategoryCount);
        }
    }
}
