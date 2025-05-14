package team.project.redboost.controllers;

import team.project.redboost.entities.CategorieLanding;
import team.project.redboost.services.CategorieLandingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategorieLandingController {

    @Autowired
    private CategorieLandingService categoryService;

    @GetMapping
    public List<CategorieLanding> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategorieLanding> getCategoryById(@PathVariable Long id) {
        Optional<CategorieLanding> category = categoryService.getCategoryById(id);
        return category.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/add") // Changed to POST /api/categories
    public CategorieLanding createCategory(@RequestBody CategorieLanding category) {
        return categoryService.createCategory(category.getTitle());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategorieLanding> updateCategory(@PathVariable Long id, @RequestBody CategorieLanding category) {
        Optional<CategorieLanding> updatedCategory = categoryService.updateCategory(id, category.getTitle());
        return updatedCategory.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        boolean deleted = categoryService.deleteCategory(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}