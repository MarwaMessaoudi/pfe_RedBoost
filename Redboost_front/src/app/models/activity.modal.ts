export enum ActivityStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}
export interface Activity {
    ActivityStatus: ActivityStatus;
    id?: number;
    name: string;
    description?: string;
    startDate: string; // format ISO
    endDate: string;
    color: string; // 💥 couleur hexadécimale (#FF0000, #00AEEF etc.)
    status?: ActivityStatus;
    program: {
        id: number;
    };
}
