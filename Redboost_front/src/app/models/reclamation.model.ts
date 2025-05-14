export interface Reclamation {
  idReclamation?: number;
  idUtilisateur: number;
  nom: string;
  email: string;
  sujet: string;
  date: string;
  statut: string;
  description: string;
  categorie: string;
  reponses?: ReponseReclamation[]; // Assuming responses are optional or can be empty
}

export interface ReponseReclamation {
  idReponse?: number; // Optional ID
  contenu: string;
  dateReponse: string;
  isAdmin: boolean;
  reclamationId: number;
}