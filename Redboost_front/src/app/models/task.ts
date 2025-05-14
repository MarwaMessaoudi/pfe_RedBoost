import { Phase } from './phase';

export interface TaskCategory {
    id?: number;
    name: string;
}

export enum Priority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

export const PriorityTranslation: Record<Priority, string> = {
    [Priority.LOW]: 'Faible',
    [Priority.MEDIUM]: 'Moyenne',
    [Priority.HIGH]: 'Élevée'
};

export enum Status {
    TO_DO = 'TO_DO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    VALIDATED = 'VALIDATED'
}

export const StatusTranslation: Record<Status, string> = {
    [Status.TO_DO]: 'À faire',
    [Status.IN_PROGRESS]: 'En cours',
    [Status.DONE]: 'Terminé',
    [Status.VALIDATED]: 'Validé'
};

export interface Attachment {
    name: string;
    url?: string;
    fileId?: string;
}

export interface SubTask {
    subTaskId?: number;
    title: string;
    description?: string;
}

export interface Comment {
    commentId?: number;
    content: string;
    profilePictureUrl?: string;
    firstName: string;
    lastName: string;
    userId: number;
    createdAt?: string;
}

export interface Task {
    taskId?: number;
    title: string;
    xpPoint: number;
    description?: string;
    assigneeId?: number;
    startDate?: string;
    endDate?: string;
    priority: Priority;
    status: Status;
    phase: Phase;
    taskCategory: TaskCategory;
    createdAt?: string;
    updatedAt?: string;
    attachment: Attachment;
    taskCategoryId?: number;
    subTasks?: SubTask[];
    comments?: Comment[];
}
