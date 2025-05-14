// src/app/models/statistics.model.ts
export interface ProjectStatistics {
    totalProjects: number;
    averageProgress: number;
    reviewReadyProjects: number;
    activeProjects: number;
}

export interface PhaseStatistics {
    projectId: number;
    projectName: string;
    phaseId: number;
    phaseName: string;
    status: string;
    completionPercentage: number;
    isReviewReady: boolean;
    overdueTasks: number;
}

export interface TaskStatistics {
    pendingValidations: number;
    overdueTasks: number;
}

export interface PendingAction {
    type: string;
    projectId: number;
    projectName: string;
    phaseId: number;
    phaseName: string;
    taskId?: number;
    taskTitle?: string;
    details: string;
    updatedAt: string;
}

export interface EngagementStatistics {
    commentsCount: number;
    phasesValidated: number;
    meetingsScheduled: number;
}

export interface DashboardStatistics {
    projects: ProjectStatistics;
    phases: PhaseStatistics[];
    tasks: TaskStatistics;
    pendingActions: PendingAction[];
    engagement: EngagementStatistics;
}
