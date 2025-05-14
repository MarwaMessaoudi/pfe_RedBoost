package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Task;
import team.project.redboost.entities.Comment;
import team.project.redboost.services.GoogleDriveService;
import team.project.redboost.services.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:4200")
public class TaskController {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskService taskService;

    @Autowired
    private GoogleDriveService googleDriveService;

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> createTask(
            @RequestPart("task") Task task,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task createdTask = taskService.createTask(task, attachment, userEmail);
            return ResponseEntity.ok(createdTask);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to create a task for phase ID: " + (task.getPhase() != null ? task.getPhase().getPhaseId() : "unknown"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to create task: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create task");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTasks(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Task> tasks = taskService.getAllTasks(userEmail);
            return ResponseEntity.ok(tasks);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access tasks");
        }
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTaskById(@PathVariable Long taskId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task task = taskService.getTaskById(taskId, userEmail);
            return ResponseEntity.ok(task);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access task ID: " + taskId);
        }
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable Long taskId, @RequestBody Task updatedTask,
                                        Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task task = taskService.updateTask(taskId, updatedTask, userEmail);
            return ResponseEntity.ok(task);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to update task ID: " + taskId);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            taskService.deleteTask(taskId, userEmail);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to delete task ID: " + taskId);
        }
    }

    @GetMapping("/phase/{phaseId}")
    public ResponseEntity<?> getTasksByPhaseId(@PathVariable Long phaseId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Task> tasks = taskService.getTasksByPhaseId(phaseId, userEmail);
            return ResponseEntity.ok(tasks);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Phase not found with ID: " + phaseId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access tasks for phase ID: " + phaseId);
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<?> getTasksByCategoryId(@PathVariable Long categoryId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Task> tasks = taskService.getTasksByCategoryId(categoryId, userEmail);
            return ResponseEntity.ok(tasks);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task category not found with ID: " + categoryId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access tasks for task category ID: " + categoryId);
        }
    }

    @GetMapping("/{taskId}/attachment")
    public ResponseEntity<?> downloadAttachment(@PathVariable Long taskId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task task = taskService.getTaskById(taskId, userEmail);
            if (task.getAttachment() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No attachment found for task ID: " + taskId);
            }
            String fileId = task.getAttachment();
            InputStream fileStream = googleDriveService.downloadFile(fileId);
            String fileName = googleDriveService.getFileName(fileId);
            InputStreamResource resource = new InputStreamResource(fileStream);
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to access attachment for task ID: " + taskId);
        } catch (IOException e) {
            logger.error("Failed to download attachment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download attachment");
        }
    }

    @PostMapping("/{taskId}/comments")
    public ResponseEntity<?> addCommentToTask(@PathVariable Long taskId, @RequestBody Comment comment,
                                              Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task task = taskService.addCommentToTask(taskId, comment, userEmail);
            return ResponseEntity.ok(task);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to add comment to task ID: " + taskId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{taskId}/validate")
    public ResponseEntity<?> validateTask(@PathVariable Long taskId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task validatedTask = taskService.validateTask(taskId, userEmail);
            return ResponseEntity.ok(validatedTask);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to validate task ID: " + taskId);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to validate task: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to validate task");
        }
    }

    @PostMapping("/{taskId}/reject")
    public ResponseEntity<?> rejectTask(@PathVariable Long taskId, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Task rejectedTask = taskService.rejectTask(taskId, userEmail);
            return ResponseEntity.ok(rejectedTask);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Task not found with ID: " + taskId);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("User is not authorized to reject task ID: " + taskId);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to reject task: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to reject task");
        }
    }
}