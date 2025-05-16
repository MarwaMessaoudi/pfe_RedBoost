import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReclamationService, Reclamation, ReponseReclamation, Role } from '../../service/reclamation.service';
import { StatutReclamation } from '../../../../models/statut-reclamation.model';
import { CategorieReclamation } from '../../../../models/categorie-reclamation.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type CategorieLibelles = {
    [key in CategorieReclamation]: string;
};

@Component({
    selector: 'app-all-reclamations',
    templateUrl: './all-reclamations.component.html',
    styleUrls: ['./all-reclamations.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule],
    providers: [ReclamationService, MessageService]
})
export class AllReclamationsComponent implements OnInit {
    public StatutReclamation = StatutReclamation;
    public CategorieReclamation = CategorieReclamation;
    reclamations: Reclamation[] = [];
    reclamationSelectionnee: Reclamation | null = null;
    nouveauMessage: string = '';
    chargement: boolean = false;
    erreur: string | null = null;
    statutOptions: StatutReclamation[] = [StatutReclamation.NOUVELLE, StatutReclamation.EN_ATTENTE, StatutReclamation.TRAITE, StatutReclamation.FERMEE];
    categorieOptions: CategorieReclamation[] = [CategorieReclamation.SUPPORT_ET_ACCOMPAGNEMENT, CategorieReclamation.FINANCEMENT_ET_OPPORTUNITES, CategorieReclamation.RELATIONS_ET_PARTENARIATS, CategorieReclamation.ADMINISTRATION_ET_SERVICE_CLIENT];
    retourListeReclamations: boolean = false;
    reponses: ReponseReclamation[] = [];
    selectedCategorie: CategorieReclamation | null = null;
    searchTerm: string = '';
    selectedStatut: StatutReclamation | null = null;
    filteredReclamations: Reclamation[] = [];
    role: Role | null = null;

    constructor(
        public reclamationService: ReclamationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.role = this.reclamationService.getCurrentRole();
        this.chargerReclamations();
    }

  chargerReclamations(): void {
    this.chargement = true;
    this.reclamationService.getAllReclamations().subscribe({
        next: (data: Reclamation[]) => {
            console.log('Données récupérées des réclamations:', data);
            // Map backend data to frontend Reclamation interface
            this.reclamations = data.map(reclamation => ({
                ...reclamation,
                fichierReclamation: reclamation.fichierReclamation, // Ensure fichierReclamation is included
                fichiers: reclamation.fichierReclamation ? [{ url: reclamation.fichierReclamation }] : [] // Optional: map to fichiers for compatibility
            }));
            this.filteredReclamations = [...this.reclamations];
            this.chargement = false;
        },
        error: (err: any) => {
            this.erreur = 'Une erreur est survenue lors du chargement des réclamations.';
            this.chargement = false;
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
            console.error('Erreur:', err);
            console.error('Error details:', err.error);
            console.error('Status:', err.status);
        }
    });
}

   selectionnerReclamation(reclamation: Reclamation) {
    this.reclamationSelectionnee = {
        ...reclamation,
        fichiers: reclamation.fichierReclamation ? [{ url: reclamation.fichierReclamation, nom: 'Pièce jointe' }] : []
    };
    console.log('Selected reclamation ID:', reclamation.idReclamation);

    if (reclamation.idReclamation && typeof reclamation.idReclamation === 'number' && !isNaN(reclamation.idReclamation)) {
        this.reclamationService.getReponses(reclamation.idReclamation).subscribe({
            next: (reponses: ReponseReclamation[]) => {
                this.reclamationSelectionnee!.reponses = reponses;
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des réponses:', err);
                this.erreur = 'Erreur lors du chargement des réponses.';
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
            }
        });
    } else {
        console.error('ID de réclamation invalide.');
        this.erreur = 'Impossible de charger les réponses : ID de réclamation invalide.';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
    }
}

    retourListe(): void {
        this.reclamationSelectionnee = null;
    }

    getStatutClass(statut: StatutReclamation): string {
        return `statut-${statut.toLowerCase()}`;
    }

    getStatutLibelle(statut: StatutReclamation): string {
        const libelles: { [key in StatutReclamation]: string } = {
            [StatutReclamation.NOUVELLE]: 'Nouvelle',
            [StatutReclamation.EN_ATTENTE]: 'En Attente',
            [StatutReclamation.TRAITE]: 'Traitée',
            [StatutReclamation.FERMEE]: 'Fermée'
        };
        return libelles[statut] || statut;
    }

    getCategorieLibelle(categorie: CategorieReclamation): string {
        const libelles: CategorieLibelles = {
            [CategorieReclamation.SUPPORT_ET_ACCOMPAGNEMENT]: 'Support et accompagnement',
            [CategorieReclamation.FINANCEMENT_ET_OPPORTUNITES]: 'Financement et opportunités',
            [CategorieReclamation.RELATIONS_ET_PARTENARIATS]: 'Relations et partenariats',
            [CategorieReclamation.ADMINISTRATION_ET_SERVICE_CLIENT]: 'Administration et service client'
        };
        return libelles[categorie] || categorie.toString();
    }

    onCategorieChange(): void {
        this.filterReclamations();
    }

    envoyerMessage(): void {
        if (!this.nouveauMessage.trim()) {
            console.warn('Aucun message à envoyer.');
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Aucun message à envoyer.' });
            return;
        }

        if (!this.reclamationSelectionnee || !this.reclamationSelectionnee.idReclamation) {
            console.error('Aucune réclamation sélectionnée ou ID manquant.');
            this.erreur = "Impossible d'envoyer le message : réclamation invalide.";
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
            return;
        }

        const idReclamation = this.reclamationSelectionnee.idReclamation;
        const contenu = this.nouveauMessage.trim();
        const roleEnvoyeur = this.reclamationService.getCurrentRole();

        console.log("Envoi du message avec l'ID de la réclamation :", idReclamation);
        if (!roleEnvoyeur) {
            console.error("Impossible de déterminer le rôle de l'utilisateur.");
            this.erreur = "Erreur lors de l'envoi du message : rôle invalide.";
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
            return;
        }

        this.reclamationService.createReponse(idReclamation, contenu, roleEnvoyeur).subscribe({
            next: (nouvelleReponse: ReponseReclamation) => {
                console.log('Réponse envoyée avec succès :', nouvelleReponse);
                if (!this.reclamationSelectionnee!.reponses) {
                    this.reclamationSelectionnee!.reponses = [];
                }
                this.reclamationSelectionnee!.reponses.push(nouvelleReponse);
                this.nouveauMessage = '';
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Message envoyé avec succès !' });
            },
            error: (err: HttpErrorResponse) => {
                console.error("Erreur lors de l'envoi du message :", err);
                if (err.error && typeof err.error === 'string') {
                    this.erreur = `Erreur lors de l'envoi du message : ${err.error}`;
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
                } else {
                    this.erreur = "Erreur lors de l'envoi du message.";
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.erreur });
                }
            }
        });
    }

    onSearchChange(): void {
        this.filterReclamations();
    }

    onStatutChange(): void {
        this.filterReclamations();
    }

    filterReclamations(): void {
        this.filteredReclamations = this.reclamations.filter((reclamation) => {
            const searchMatch = !this.searchTerm || reclamation.sujet.toLowerCase().includes(this.searchTerm.toLowerCase()) || reclamation.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            const statutMatch = !this.selectedStatut || reclamation.statut === this.selectedStatut;
            const categorieMatch = !this.selectedCategorie || reclamation.categorie === this.selectedCategorie;
            return searchMatch && statutMatch && categorieMatch;
        });
    }

    updateStatut(reclamation: Reclamation, newStatut: StatutReclamation): void {
        this.reclamationService.updateReclamationStatut(reclamation.idReclamation, newStatut).subscribe({
            next: () => {
                reclamation.statut = newStatut;
                this.filterReclamations();
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Statut mis à jour avec succès' });
            },
            error: (error) => {
                console.error('Erreur lors de la mise à jour du statut:', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour du statut' });
            }
        });
    }
}