// src/app/models/user.model.ts
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string; // Assuming your Role enum maps to a string
    profilePictureUrl: string; // Added to match the backend data
}
