package team.project.redboost.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.TaskCategory;
import team.project.redboost.services.TaskCategoryService;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/task-categories")
public class TaskCategoryController {
    private final TaskCategoryService taskCategoryService;

    public TaskCategoryController(TaskCategoryService taskCategoryService) {
        this.taskCategoryService = taskCategoryService;
    }

    @PostMapping
    public ResponseEntity<?> createTaskCategory(@RequestBody TaskCategory taskCategory, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            TaskCategory savedCategory = taskCategoryService.createTaskCategory(taskCategory, userEmail);
            return ResponseEntity.ok(savedCategory);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a task category");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTaskCategories(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<TaskCategory> categories = taskCategoryService.getAllTaskCategories(userEmail);
            return ResponseEntity.ok(categories);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access task categories");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskCategoryById(@PathVariable Long id, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<TaskCategory> category = taskCategoryService.getTaskCategoryById(id, userEmail);
            return category.<ResponseEntity<?>>map(cat -> ResponseEntity.ok(cat))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Task category not found with ID: " + id));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access task category ID: " + id);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTaskCategory(@PathVariable Long id, @RequestBody TaskCategory updatedTaskCategory,
                                                Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            TaskCategory category = taskCategoryService.updateTaskCategory(id, updatedTaskCategory, userEmail);
            return ResponseEntity.ok(category);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task category not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to update task category ID: " + id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTaskCategory(@PathVariable Long id, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            taskCategoryService.deleteTaskCategory(id, userEmail);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task category not found with ID: " + id);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete task category ID: " + id);
        }
    }
}