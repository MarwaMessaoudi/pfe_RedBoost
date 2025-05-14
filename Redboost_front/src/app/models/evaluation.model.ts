import { User } from './user';
import { Phase } from './phase';

export interface EvaluationForm {
    nomPrenom: string;
    projetName: string;

    satisfactionGlobale: 'TRES_SATISFAIT' | 'SATISFAIT' | 'INSATISFAIT' | null;
    attentesReponse: 'MOYEN' | 'ELEVE' | 'TRES_ELEVE' | null;
    redStartCoachQualite: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE' | null;
    ambianceGenerale: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE' | null;
    coachCompetence: 'TRES_COMPETENT' | 'COMPETENT' | 'MOYENNEMENT_COMPETENT' | null;
    coachComprehension: 'TRES_BIEN' | 'BIEN' | 'PAS_TRES_BIEN' | null;
    communicationQualite: 'EXCELLENTE' | 'ELEVE' | 'TRES_ELEVE' | null;

    pointsForts?: string | null;
    pointsFaibles?: string | null;
    autreCommentaire?: string | null;

    user: { id: number };
    phase: { phaseId: number };
}
