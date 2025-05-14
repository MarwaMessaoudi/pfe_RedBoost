export interface Coach {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    experience: string;
    isAvailable: boolean;
    avatar?: string;
    availability?: string;
    name?: string; // Computed name for display (firstName + lastName)
    specialty?: string; // Alias for specialization for compatibility
}
