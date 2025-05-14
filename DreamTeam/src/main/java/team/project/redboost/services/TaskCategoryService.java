package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.TaskCategory;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.TaskCategoryRepository;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;

@Service
public class TaskCategoryService {
    private final TaskCategoryRepository taskCategoryRepository;

    @Autowired
    private UserService userService;

    public TaskCategoryService(TaskCategoryRepository taskCategoryRepository) {
        this.taskCategoryRepository = taskCategoryRepository;
    }

    public TaskCategory createTaskCategory(TaskCategory taskCategory, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to create a task category");
        }
        return taskCategoryRepository.save(taskCategory);
    }

    public List<TaskCategory> getAllTaskCategories(String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to access task categories");
        }
        return taskCategoryRepository.findAll();
    }

    public Optional<TaskCategory> getTaskCategoryById(Long id, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to access task categories");
        }
        return taskCategoryRepository.findById(id);
    }

    public TaskCategory updateTaskCategory(Long id, TaskCategory updatedTaskCategory, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to update task categories");
        }
        return taskCategoryRepository.findById(id).map(existingCategory -> {
            existingCategory.setName(updatedTaskCategory.getName());
            return taskCategoryRepository.save(existingCategory);
        }).orElseThrow(() -> new EntityNotFoundException("Task category not found with ID: " + id));
    }

    public void deleteTaskCategory(Long id, String userEmail) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found with email: " + userEmail);
        }
        if (user.getRole() != Role.ENTREPRENEUR && user.getRole() != Role.COACH) {
            throw new SecurityException("User is not authorized to delete task categories");
        }
        taskCategoryRepository.deleteById(id);
    }
}