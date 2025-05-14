package team.project.redboost.dto;

import lombok.Data;

@Data
public class TaskStatsDTO {
    private double completedTasks;
    private double pendingTasks;
    private double averageProgress;
    private double overdueTasks;

    public TaskStatsDTO(double completedTasks, double pendingTasks,
                        double averageProgress, double overdueTasks) {
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.averageProgress = averageProgress;
        this.overdueTasks = overdueTasks;
    }
}