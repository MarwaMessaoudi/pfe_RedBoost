import { Task } from './task';

export enum PhaseStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

export interface Phase {
    phaseId?: number;
    phaseName: string;
    status: PhaseStatus;
    startDate: string;
    endDate: string;
    description?: string;
    totalXpPoints?: number;
    tasks?: Task[];
    createdAt?: string;
    updatedAt?: string;
    projetId?: number; // Added projetId
}
