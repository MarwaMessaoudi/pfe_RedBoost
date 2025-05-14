package team.project.redboost.controllers;

import team.project.redboost.entities.TaskActivity;

import team.project.redboost.entities.Comment;
import team.project.redboost.entities.CommentActivity;
import team.project.redboost.services.TaskActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/task-activities")
@CrossOrigin(origins = "http://localhost:4200")
public class TaskActivityController {
    @Autowired
    private TaskActivityService taskActivityService;
    @PostMapping
    public TaskActivity createTaskActivity(@RequestBody TaskActivity taskActivity) {
        return taskActivityService.createTaskActivity(taskActivity);
    }

    @GetMapping
    public List<TaskActivity> getAllTaskActivities() {
        return taskActivityService.getAllTaskActivities();
    }

    @GetMapping("/{taskActivityId}")
    public TaskActivity getTaskActivityById(@PathVariable Long taskActivityId) {
        return taskActivityService.getTaskActivityById(taskActivityId);
    }

    @PutMapping("/{taskActivityId}")
    public TaskActivity updateTaskActivity(@PathVariable Long taskActivityId, @RequestBody TaskActivity updatedTaskActivity) {
        return taskActivityService.updateTaskActivity(taskActivityId, updatedTaskActivity);
    }

    @DeleteMapping("/{taskActivityId}")
    public void deleteTaskActivity(@PathVariable Long taskActivityId) {
        taskActivityService.deleteTaskActivity(taskActivityId);
    }

    @GetMapping("/activity/{activityId}")
    public List<TaskActivity> getTaskActivitiesByActivityId(@PathVariable Long activityId) {
        return taskActivityService.getTaskActivitiesByActivityId(activityId);
    }

    @GetMapping("/category/{categoryId}")
    public List<TaskActivity> getTaskActivitiesByCategoryId(@PathVariable Long categoryId) {
        return taskActivityService.getTaskActivitiesByCategoryId(categoryId);
    }

    @GetMapping("/{taskActivityId}/attachments/{fileName}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long taskActivityId,
            @PathVariable String fileName) {
        try {
            TaskActivity taskActivity = taskActivityService.getTaskActivityById(taskActivityId);
            if (taskActivity.getAttachments() == null || !taskActivity.getAttachments().contains(fileName)) {
                return ResponseEntity.notFound().build();
            }

            String uploadDir = "uploads/";
            Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{taskActivityId}/comments")
    public TaskActivity addCommentToTaskActivity(@PathVariable Long taskActivityId, @RequestBody CommentActivity comment) {
        return taskActivityService.addCommentToTaskActivity(taskActivityId, comment);
    }
}