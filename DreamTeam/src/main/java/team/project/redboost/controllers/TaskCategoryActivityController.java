package team.project.redboost.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.TaskCategoryActivity;
import team.project.redboost.services.TaskCategoryActivityService;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/task-category-activities")
public class TaskCategoryActivityController {
    private final TaskCategoryActivityService taskCategoryActivityService;

    public TaskCategoryActivityController(TaskCategoryActivityService taskCategoryActivityService) {
        this.taskCategoryActivityService = taskCategoryActivityService;
    }

    // Create a new TaskCategoryActivity
    @PostMapping
    public ResponseEntity<TaskCategoryActivity> createTaskCategoryActivity(@RequestBody TaskCategoryActivity taskCategoryActivity) {
        TaskCategoryActivity savedCategory = taskCategoryActivityService.createTaskCategoryActivity(taskCategoryActivity);
        return ResponseEntity.ok(savedCategory);
    }

    // Get all TaskCategoryActivities
    @GetMapping
    public ResponseEntity<List<TaskCategoryActivity>> getAllTaskCategoryActivities() {
        return ResponseEntity.ok(taskCategoryActivityService.getAllTaskCategoryActivities());
    }

    // Get a single TaskCategoryActivity by ID
    @GetMapping("/{id}")
    public ResponseEntity<TaskCategoryActivity> getTaskCategoryActivityById(@PathVariable Long id) {
        Optional<TaskCategoryActivity> category = taskCategoryActivityService.getTaskCategoryActivityById(id);
        return category.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update a TaskCategoryActivity
    @PutMapping("/{id}")
    public ResponseEntity<TaskCategoryActivity> updateTaskCategoryActivity(@PathVariable Long id, @RequestBody TaskCategoryActivity updatedTaskCategoryActivity) {
        try {
            return ResponseEntity.ok(taskCategoryActivityService.updateTaskCategoryActivity(id, updatedTaskCategoryActivity));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete a TaskCategoryActivity
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaskCategoryActivity(@PathVariable Long id) {
        taskCategoryActivityService.deleteTaskCategoryActivity(id);
        return ResponseEntity.noContent().build();
    }
}