import { User } from './user';

export interface Program {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: 'active' | 'Enattente' | 'Termine';
    programLead: User;
    programLeadId: number;
    createdAt?: string;
    updatedAt?: string;
}
