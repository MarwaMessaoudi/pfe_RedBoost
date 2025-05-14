package team.project.redboost.services;

import org.springframework.stereotype.Service;

import team.project.redboost.entities.TaskCategoryActivity;
import team.project.redboost.repositories.TaskCategoryActivityRepository;
import java.util.List;
import java.util.Optional;

@Service
public class TaskCategoryActivityService {
    private final TaskCategoryActivityRepository taskCategoryActivityRepository;

    public TaskCategoryActivityService(TaskCategoryActivityRepository taskCategoryActivityRepository) {
        this.taskCategoryActivityRepository = taskCategoryActivityRepository;
    }

    // Create a new TaskCategoryActivity
    public TaskCategoryActivity createTaskCategoryActivity(TaskCategoryActivity taskCategoryActivity) {
        return taskCategoryActivityRepository.save(taskCategoryActivity);
    }

    // Get all TaskCategoryActivities
    public List<TaskCategoryActivity> getAllTaskCategoryActivities() {
        return taskCategoryActivityRepository.findAll();
    }

    // Get a single TaskCategoryActivity by ID
    public Optional<TaskCategoryActivity> getTaskCategoryActivityById(Long id) {
        return taskCategoryActivityRepository.findById(id);
    }

    // Update a TaskCategoryActivity
    public TaskCategoryActivity updateTaskCategoryActivity(Long id, TaskCategoryActivity updatedTaskCategoryActivity) {
        return taskCategoryActivityRepository.findById(id).map(existingCategory -> {
            existingCategory.setName(updatedTaskCategoryActivity.getName());
            return taskCategoryActivityRepository.save(existingCategory);
        }).orElseThrow(() -> new RuntimeException("TaskCategoryActivity not found with ID: " + id));
    }

    // Delete a TaskCategoryActivity
    public void deleteTaskCategoryActivity(Long id) {
        taskCategoryActivityRepository.deleteById(id);
    }
}
