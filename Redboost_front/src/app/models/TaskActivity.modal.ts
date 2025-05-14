import { Activity } from './activity.modal';

// Renamed from TaskCategory to TaskCategoryActivity
export interface TaskCategoryActivity {
    id?: number;
    name: string;
}

// Renamed from Priority to PriorityActivity with modified enum values
export enum PriorityActivity {
    ACTIVITY_LOW = 'ACTIVITY_LOW',
    ACTIVITY_MEDIUM = 'ACTIVITY_MEDIUM',
    ACTIVITY_HIGH = 'ACTIVITY_HIGH'
}

// Renamed from Status to StatusActivity
export enum StatusActivity {
    TO_DO = 'TO_DO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE'
}

export interface AttachmentActivity {
    name: string;
    url: string;
}

// Renamed from SubTask to SubTaskActivity
export interface SubTaskActivity {
    subTaskActivityId?: number;
    title: string;
    description?: string;
}

export interface CommentActivity {
    commentId?: number;
    content: string;
    profilePictureUrl?: string;
    firstName: string;
    lastName: string;
    userId: number;
    createdAt?: string; // ISO string
}

// Renamed from Task to TaskActivity
export interface TaskActivity {
    taskActivityId?: number;
    title: string;
    xpPoint: number;
    description?: string;
    assigneeId?: number;
    startDate?: string;
    endDate?: string;
    priorityActivity: PriorityActivity; // Updated to use PriorityActivity
    statusActivity: StatusActivity; // Updated to use StatusActivity
    activity: Activity; // Replaced phase with activity
    taskCategoryActivity: TaskCategoryActivity; // Updated to use TaskCategoryActivity
    createdAt?: string;
    updatedAt?: string;
    attachments?: AttachmentActivity[];
    taskCategoryActivityId?: number; // Updated to taskCategoryActivityId
    subTasks?: SubTaskActivity[]; // Updated to subTaskActivitys
    comments?: CommentActivity[]; // Kept as is since it's unrelated to task/activity naming
}
