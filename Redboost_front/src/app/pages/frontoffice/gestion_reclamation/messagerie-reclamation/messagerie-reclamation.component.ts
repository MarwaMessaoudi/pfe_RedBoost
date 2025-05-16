import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReclamationService, Reclamation, ReponseReclamation } from '../../service/reclamation.service';
import { StatutReclamation } from '../../../../models/statut-reclamation.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-messagerie-reclamation',
    templateUrl: './messagerie-reclamation.component.html',
    styleUrls: ['./messagerie-reclamation.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule],
    providers: [ReclamationService, MessageService]
})
export class MessagerieReclamationComponent implements OnInit {
    public StatutReclamation = StatutReclamation;
    reclamations: Reclamation[] = [];
    reclamationSelectionnee: Reclamation | null = null;
    nouveauMessage: string = '';
    chargement: boolean = false;
    erreur: string | null = null;
    statutOptions: StatutReclamation[] = [StatutReclamation.NOUVELLE, StatutReclamation.EN_ATTENTE, StatutReclamation.TRAITE, StatutReclamation.FERMEE];
    retourListeReclamations: boolean = false;
    reponses: ReponseReclamation[] = [];

    constructor(
        public reclamationService: ReclamationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.chargerReclamations();
    }

    chargerReclamations(): void {
        this.chargement = true;
        this.reclamationService.getReclamationsUtilisateur().subscribe({
            next: (data: Reclamation[]) => {
                console.log('Données récupérées des réclamations:', data);
                this.reclamations = data;
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
        this.reclamationSelectionnee = reclamation;
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
}