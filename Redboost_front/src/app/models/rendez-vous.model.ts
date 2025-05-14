export interface RendezVous {
  id?: number; // Optionnel, généré par le backend
  coachId?: number; // ID du coach (optionnel si géré par le backend)
  date: string; // Date au format "YYYY-MM-DD"
  heure: string; // Heure au format "HH:MM"
  duration?: string; // Optionnel, pour une durée future
  description?: string; // Optionnel
  email?: string; // Optionnel
  title: string; // Requis
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'; // Requis
  coach?: { id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    linkedin?: string | null;
    profilePictureUrl?: string | null;
  }; // Optionnel, pour compatibilité avec le frontend
  entrepreneur?: { id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    linkedin?: string | null;
    profilePictureUrl?: string | null;
   }; // Optionnel, pour compatibilité avec le frontend
  }