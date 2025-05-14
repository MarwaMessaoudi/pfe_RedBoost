package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;
import team.project.redboost.entities.TaskActivity;
import team.project.redboost.entities.Activity;
import team.project.redboost.entities.TaskCategoryActivity;
import team.project.redboost.entities.SubTaskActivity;
import team.project.redboost.entities.CommentActivity;
import team.project.redboost.repositories.TaskActivityRepository;
import team.project.redboost.repositories.ActivityRepository;
import team.project.redboost.repositories.TaskCategoryActivityRepository;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TaskActivityService {
    private static final Logger logger = LoggerFactory.getLogger(TaskActivityService.class);

    @Autowired
    private TaskActivityRepository taskActivityRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private TaskCategoryActivityRepository taskCategoryActivityRepository;

    // Create a new task activity
    public TaskActivity createTaskActivity(TaskActivity taskActivity) {
        if (taskActivity.getActivity() == null || taskActivity.getActivity().getId() == null) {
            throw new RuntimeException("Activity ID is required for task activity creation");
        }

        Activity activity = activityRepository.findById(taskActivity.getActivity().getId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        taskActivity.setActivity(activity);
        taskActivity.setCreatedAt(LocalDateTime.now());
        taskActivity.setUpdatedAt(LocalDateTime.now());

        if (taskActivity.getTaskCategoryActivity() != null && taskActivity.getTaskCategoryActivity().getId() != null) {
            TaskCategoryActivity category = taskCategoryActivityRepository.findById(taskActivity.getTaskCategoryActivity().getId())
                    .orElseThrow(() -> new RuntimeException("TaskCategoryActivity not found"));
            taskActivity.setTaskCategoryActivity(category);
        }

        if (taskActivity.getSubTasks() != null) {
            for (SubTaskActivity subTask : taskActivity.getSubTasks()) {
                taskActivity.addSubTask(subTask);
            }
        }


        TaskActivity savedTaskActivity = taskActivityRepository.save(taskActivity);
        updateActivityTotalXpPoints(activity);

        logger.info("Creating task activity: {}", taskActivity);
        return savedTaskActivity;
    }

    // Get all task activities
    public List<TaskActivity> getAllTaskActivities() {
        List<TaskActivity> taskActivities = taskActivityRepository.findAll();
        taskActivities.forEach(taskActivity -> {
            Hibernate.initialize(taskActivity.getSubTasks());
            Hibernate.initialize(taskActivity.getComments());
        });
        return taskActivities;
    }

    // Get a task activity by ID
    public TaskActivity getTaskActivityById(Long taskActivityId) {
        TaskActivity taskActivity = taskActivityRepository.findById(taskActivityId)
                .orElseThrow(() -> new RuntimeException("TaskActivity not found"));
        Hibernate.initialize(taskActivity.getSubTasks());
        Hibernate.initialize(taskActivity.getComments());
        return taskActivity;
    }

    // Update a task activity
    public TaskActivity updateTaskActivity(Long taskActivityId, TaskActivity updatedTaskActivity) {
        logger.info("Received updatedTaskActivity: {}", updatedTaskActivity);

        TaskActivity taskActivity = taskActivityRepository.findById(taskActivityId)
                .orElseThrow(() -> new RuntimeException("TaskActivity not found"));

        taskActivity.setTitle(updatedTaskActivity.getTitle());
        taskActivity.setXpPoint(updatedTaskActivity.getXpPoint());
        taskActivity.setDescription(updatedTaskActivity.getDescription());
        taskActivity.setAssigneeId(updatedTaskActivity.getAssigneeId());
        taskActivity.setStartDate(updatedTaskActivity.getStartDate());
        taskActivity.setEndDate(updatedTaskActivity.getEndDate());
        taskActivity.setPriorityActivity(updatedTaskActivity.getPriorityActivity());
        taskActivity.setStatusActivity(updatedTaskActivity.getStatusActivity());
        taskActivity.setAttachments(updatedTaskActivity.getAttachments());

        if (updatedTaskActivity.getActivity() != null && updatedTaskActivity.getActivity().getId() != null) {
            Activity activity = activityRepository.findById(updatedTaskActivity.getActivity().getId())
                    .orElseThrow(() -> new RuntimeException("Activity not found"));
            taskActivity.setActivity(activity);
        }

        if (updatedTaskActivity.getTaskCategoryActivity() != null && updatedTaskActivity.getTaskCategoryActivity().getId() != null) {
            TaskCategoryActivity category = taskCategoryActivityRepository.findById(updatedTaskActivity.getTaskCategoryActivity().getId())
                    .orElseThrow(() -> new RuntimeException("TaskCategoryActivity not found"));
            taskActivity.setTaskCategoryActivity(category);
        }

        if (updatedTaskActivity.getSubTasks() != null) {
            taskActivity.getSubTasks().clear();
            for (SubTaskActivity subTask : updatedTaskActivity.getSubTasks()) {
                taskActivity.addSubTask(subTask);
            }
        }

        if (updatedTaskActivity.getComments() != null) {
            taskActivity.getComments().clear();
            for (CommentActivity comment : updatedTaskActivity.getComments()) {
                taskActivity.addComment(comment);
            }
        }

        taskActivity.setUpdatedAt(LocalDateTime.now());
        TaskActivity savedTaskActivity = taskActivityRepository.save(taskActivity);
        updateActivityTotalXpPoints(taskActivity.getActivity());

        logger.info("Updating task activity: {}", taskActivity);
        return savedTaskActivity;
    }

    // Delete a task activity
    public void deleteTaskActivity(Long taskActivityId) {
        TaskActivity taskActivity = taskActivityRepository.findById(taskActivityId)
                .orElseThrow(() -> new RuntimeException("TaskActivity not found"));

        taskActivityRepository.deleteById(taskActivityId);
        updateActivityTotalXpPoints(taskActivity.getActivity());

        logger.info("Deleting task activity: {}", taskActivity);
    }

    // Get task activities by activity ID
    public List<TaskActivity> getTaskActivitiesByActivityId(Long activityId) {
        List<TaskActivity> taskActivities = taskActivityRepository.findByActivity_Id(activityId);
        taskActivities.forEach(taskActivity -> {
            Hibernate.initialize(taskActivity.getTaskCategoryActivity());
            Hibernate.initialize(taskActivity.getSubTasks());
            Hibernate.initialize(taskActivity.getComments());
        });
        return taskActivities;
    }

    // Get task activities by category ID
    public List<TaskActivity> getTaskActivitiesByCategoryId(Long categoryId) {
        List<TaskActivity> taskActivities = taskActivityRepository.findByTaskCategoryActivity_Id(categoryId);
        taskActivities.forEach(taskActivity -> {
            Hibernate.initialize(taskActivity.getTaskCategoryActivity());
            Hibernate.initialize(taskActivity.getSubTasks());
            Hibernate.initialize(taskActivity.getComments());
        });
        return taskActivities;
    }

    // Add a comment to a task activity
    public TaskActivity addCommentToTaskActivity(Long taskActivityId, CommentActivity comment) {
        TaskActivity taskActivity = taskActivityRepository.findById(taskActivityId)
                .orElseThrow(() -> new RuntimeException("TaskActivity not found"));

        taskActivity.addComment(comment);
        taskActivity.setUpdatedAt(LocalDateTime.now());

        TaskActivity savedTaskActivity = taskActivityRepository.save(taskActivity);
        logger.info("Added comment to task activity: {}", taskActivity);
        return savedTaskActivity;
    }

    // Update the total XP points in the activity
    private void updateActivityTotalXpPoints(Activity activity) {
        if (activity != null) {
            Hibernate.initialize(activity.getTaskActivities());
            int totalXpPoints = activity.getTaskActivities().stream().mapToInt(TaskActivity::getXpPoint).sum();
            activity.setTotalXpPoints(totalXpPoints);
            activityRepository.save(activity);
        }
    }
}