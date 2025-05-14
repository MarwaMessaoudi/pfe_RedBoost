package team.project.redboost.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StatisticsDTOs {

    public static class ProjectStatisticsDTO {
        private int totalProjects;
        private double averageProgress;
        private int reviewReadyProjects;
        private int activeProjects;

        public int getTotalProjects() { return totalProjects; }
        public void setTotalProjects(int totalProjects) { this.totalProjects = totalProjects; }
        public double getAverageProgress() { return averageProgress; }
        public void setAverageProgress(double averageProgress) { this.averageProgress = averageProgress; }
        public int getReviewReadyProjects() { return reviewReadyProjects; }
        public void setReviewReadyProjects(int reviewReadyProjects) { this.reviewReadyProjects = reviewReadyProjects; }
        public int getActiveProjects() { return activeProjects; }
        public void setActiveProjects(int activeProjects) { this.activeProjects = activeProjects; }
    }

    public static class PhaseStatisticsDTO {
        private Long projectId;
        private String projectName;
        private Long phaseId;
        private String phaseName;
        private String status;
        private double completionPercentage;
        private boolean isReviewReady;
        private int overdueTasks;

        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getProjectName() { return projectName; }
        public void setProjectName(String projectName) { this.projectName = projectName; }
        public Long getPhaseId() { return phaseId; }
        public void setPhaseId(Long phaseId) { this.phaseId = phaseId; }
        public String getPhaseName() { return phaseName; }
        public void setPhaseName(String phaseName) { this.phaseName = phaseName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public double getCompletionPercentage() { return completionPercentage; }
        public void setCompletionPercentage(double completionPercentage) { this.completionPercentage = completionPercentage; }
        public boolean isReviewReady() { return isReviewReady; }
        public void setReviewReady(boolean reviewReady) { isReviewReady = reviewReady; }
        public int getOverdueTasks() { return overdueTasks; }
        public void setOverdueTasks(int overdueTasks) { this.overdueTasks = overdueTasks; }
    }

    public static class TaskStatisticsDTO {
        private int pendingValidations;
        private int overdueTasks;

        public int getPendingValidations() { return pendingValidations; }
        public void setPendingValidations(int pendingValidations) { this.pendingValidations = pendingValidations; }
        public int getOverdueTasks() { return overdueTasks; }
        public void setOverdueTasks(int overdueTasks) { this.overdueTasks = overdueTasks; }
    }

    public static class PendingActionDTO {
        private String type; // "phase", "task"
        private Long projectId;
        private String projectName;
        private Long phaseId;
        private String phaseName;
        private Long taskId;
        private String taskTitle;
        private String details;
        private LocalDateTime updatedAt;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getProjectName() { return projectName; }
        public void setProjectName(String projectName) { this.projectName = projectName; }
        public Long getPhaseId() { return phaseId; }
        public void setPhaseId(Long phaseId) { this.phaseId = phaseId; }
        public String getPhaseName() { return phaseName; }
        public void setPhaseName(String phaseName) { this.phaseName = phaseName; }
        public Long getTaskId() { return taskId; }
        public void setTaskId(Long taskId) { this.taskId = taskId; }
        public String getTaskTitle() { return taskTitle; }
        public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class EngagementStatisticsDTO {
        private int commentsCount;
        private int phasesValidated;
        private int meetingsScheduled;

        public int getCommentsCount() { return commentsCount; }
        public void setCommentsCount(int commentsCount) { this.commentsCount = commentsCount; }
        public int getPhasesValidated() { return phasesValidated; }
        public void setPhasesValidated(int phasesValidated) { this.phasesValidated = phasesValidated; }
        public int getMeetingsScheduled() { return meetingsScheduled; }
        public void setMeetingsScheduled(int meetingsScheduled) { this.meetingsScheduled = meetingsScheduled; }
    }

    public static class DashboardStatisticsDTO {
        private ProjectStatisticsDTO projects;
        private List<PhaseStatisticsDTO> phases;
        private TaskStatisticsDTO tasks;
        private List<PendingActionDTO> pendingActions;
        private EngagementStatisticsDTO engagement;

        public ProjectStatisticsDTO getProjects() { return projects; }
        public void setProjects(ProjectStatisticsDTO projects) { this.projects = projects; }
        public List<PhaseStatisticsDTO> getPhases() { return phases; }
        public void setPhases(List<PhaseStatisticsDTO> phases) { this.phases = phases; }
        public TaskStatisticsDTO getTasks() { return tasks; }
        public void setTasks(TaskStatisticsDTO tasks) { this.tasks = tasks; }
        public List<PendingActionDTO> getPendingActions() { return pendingActions; }
        public void setPendingActions(List<PendingActionDTO> pendingActions) { this.pendingActions = pendingActions; }
        public EngagementStatisticsDTO getEngagement() { return engagement; }
        public void setEngagement(EngagementStatisticsDTO engagement) { this.engagement = engagement; }
    }
}