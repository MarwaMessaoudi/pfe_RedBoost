import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ProjetService } from '../../service/projet-service.service';
import { Objectives, Projet, Statut } from '../../../../models/Projet';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-projet',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, RippleModule],
    templateUrl: './addprojet.component.html',
    styleUrls: ['./addprojet.component.scss']
})
export class AddProjetComponent implements OnInit {
    stepForm!: FormGroup;
    step: number = 1;
    isSaving: boolean = false;
    updateMessage: string = '';
    logoFile: File | null = null;
    objectives = Object.values(Objectives);
    statuses = Object.values(Statut);
    projectCount: number = 0;
    limitReached: boolean = false;
    warningMessage: string = '';

    objectiveDisplayMap: { [key: string]: string } = {
        [Objectives.COURT_TERME]: 'Court Terme',
        [Objectives.MOYEN_TERME]: 'Moyen Terme',
        [Objectives.LONG_TERME]: 'Long Terme'
    };

    statusDisplayMap: { [key: string]: string } = {
        [Statut.EN_DEVELOPPEMENT]: 'En Développement',
        [Statut.OPERATIONNELLE]: 'Opérationnelle',
        [Statut.EN_RECHERCHE_FINANCEMENT]: 'En Recherche de Financement',
        [Statut.TERMINE]: 'Terminé'
    };

    constructor(
        private fb: FormBuilder,
        private projetService: ProjetService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initializeForm();
        this.checkAuthentication();
        this.checkProjectCount();
    }

    initializeForm(): void {
        this.stepForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            sector: ['', Validators.required],
            type: ['', Validators.required],
            description: ['', Validators.required],
            objectives: [Objectives.COURT_TERME, Validators.required],
            status: [Statut.EN_DEVELOPPEMENT, Validators.required],
            creationDate: [new Date().toISOString().split('T')[0], Validators.required],
            location: ['', Validators.required],
            revenue: [0, [Validators.min(0)]],
            fundingGoal: [0, [Validators.min(0)]],
            numberOfEmployees: [0, [Validators.min(0)]],
            nbFemaleEmployees: [0, [Validators.min(0)]],
            globalScore: [0, [Validators.min(0), Validators.max(100)]],
            websiteUrl: ['', [Validators.pattern('https?://.+')]],
            associatedSectors: [''],
            technologiesUsed: [''],
            lastEvaluationDate: ['']
        });
    }

    checkAuthentication(): void {
        this.projetService.getUserProjects().subscribe({
            next: () => {
                console.log('User is authenticated');
            },
            error: (error) => {
                console.error('Authentication check failed:', error);
                if (error.status === 401) {
                    this.router.navigate(['/login']);
                }
            }
        });
    }

    checkProjectCount(): void {
        this.projetService.getProjectCount().subscribe({
            next: (count) => {
                this.projectCount = count;
                if (count === 2) {
                    this.warningMessage = 'Il vous reste 1 projet gratuit.';
                } else if (count >= 3) {
                    this.limitReached = true;
                    this.warningMessage = 'Veuillez accéder au paiement pour mettre à jour votre compte.';
                }
            },
            error: (error) => {
                console.error('Error fetching project count:', error);
                if (error.status === 401) {
                    this.router.navigate(['/login']);
                }
            }
        });
    }

    get progressOffset(): number {
        const circumference = 226; // 2 * π * radius (radius = 36)
        const progress = this.step / 4;
        return circumference * (1 - progress);
    }

    isStepValid(): boolean {
        if (this.step === 1) {
            return this.stepForm.controls['name'].valid && this.stepForm.controls['sector'].valid && this.stepForm.controls['type'].valid && this.stepForm.controls['description'].valid;
        } else if (this.step === 2) {
            return this.stepForm.controls['objectives'].valid && this.stepForm.controls['status'].valid && this.stepForm.controls['creationDate'].valid && this.stepForm.controls['location'].valid;
        } else if (this.step === 3 || this.step === 4) {
            return true;
        }
        return false;
    }

    goToNextStep(): void {
        if (this.isStepValid()) {
            this.step++;
            this.updateMessage = '';
        } else {
            this.updateMessage = 'Veuillez remplir tous les champs requis de cette étape.';
            setTimeout(() => (this.updateMessage = ''), 3000);
        }
    }

    goToPreviousStep(): void {
        if (this.step > 1) {
            this.step--;
            this.updateMessage = '';
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.logoFile = input.files[0];
            console.log('Fichier sélectionné:', this.logoFile?.name);
        }
    }

    showLimitReachedAlert(message: string): void {
        Swal.fire({
            icon: 'warning',
            title: 'Limite atteinte !',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#DB1E37'
        });
    }

    previewProject(): void {
        const formValues = this.stepForm.value;
        const previewHtml = `
            <h3>Aperçu du Projet</h3>
            <p><strong>Nom :</strong> ${formValues.name || 'Non spécifié'}</p>
            <p><strong>Secteur :</strong> ${formValues.sector || 'Non spécifié'}</p>
            <p><strong>Type :</strong> ${formValues.type || 'Non spécifié'}</p>
            <p><strong>Description :</strong> ${formValues.description || 'Non spécifié'}</p>
            <p><strong>Objectifs :</strong> ${this.objectiveDisplayMap[formValues.objectives] || formValues.objectives || 'Non spécifié'}</p>
            <p><strong>Statut :</strong> ${this.statusDisplayMap[formValues.status] || formValues.status || 'Non spécifié'}</p>
            <p><strong>Date de création :</strong> ${formValues.creationDate || 'Non spécifié'}</p>
            <p><strong>Localisation :</strong> ${formValues.location || 'Non spécifié'}</p>
            <p><strong>Revenus :</strong> ${formValues.revenue || 0} €</p>
            <p><strong>Objectif de financement :</strong> ${formValues.fundingGoal || 0} €</p>
            <p><strong>Nombre d'employés :</strong> ${formValues.numberOfEmployees || 0}</p>
            <p><strong>Nombre d'employées femmes :</strong> ${formValues.nbFemaleEmployees || 0}</p>
            <p><strong>Score global :</strong> ${formValues.globalScore || 0}</p>
            <p><strong>URL du site web :</strong> ${formValues.websiteUrl || 'Non spécifié'}</p>
            <p><strong>Secteurs associés :</strong> ${formValues.associatedSectors || 'Non spécifié'}</p>
            <p><strong>Technologies utilisées :</strong> ${formValues.technologiesUsed || 'Non spécifié'}</p>
            <p><strong>Date de la dernière évaluation :</strong> ${formValues.lastEvaluationDate || 'Non spécifié'}</p>
        `;

        Swal.fire({
            title: 'Aperçu de votre projet',
            html: previewHtml,
            icon: 'info',
            confirmButtonText: 'Fermer',
            confirmButtonColor: '#0A4955',
            showCancelButton: true,
            cancelButtonText: 'Modifier',
            cancelButtonColor: '#6c757d'
        });
    }

    onSubmit(): void {
        if (this.limitReached) {
            this.showLimitReachedAlert(this.warningMessage);
            return;
        }

        if (this.stepForm.valid) {
            Swal.fire({
                title: 'Confirmer la soumission',
                text: 'Êtes-vous sûr de vouloir soumettre ce projet ?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Oui, soumettre',
                cancelButtonText: 'Non, annuler',
                confirmButtonColor: '#DB1E37',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.isSaving = true;
                    this.updateMessage = '';

                    const projet = new Projet(
                        this.stepForm.value.name,
                        this.stepForm.value.sector,
                        this.stepForm.value.type,
                        this.stepForm.value.creationDate,
                        this.stepForm.value.description,
                        this.stepForm.value.objectives,
                        this.stepForm.value.status,
                        this.stepForm.value.globalScore,
                        this.stepForm.value.location,
                        '',
                        this.stepForm.value.websiteUrl,
                        this.stepForm.value.revenue,
                        this.stepForm.value.numberOfEmployees,
                        this.stepForm.value.nbFemaleEmployees,
                        '',
                        this.stepForm.value.associatedSectors,
                        this.stepForm.value.technologiesUsed,
                        this.stepForm.value.fundingGoal,
                        this.stepForm.value.lastEvaluationDate
                    );

                    this.projetService.createProjet(projet, this.logoFile).subscribe({
                        next: (response) => {
                            console.log('Projet créé:', response);
                            this.isSaving = false;
                            Swal.fire({
                                icon: 'success',
                                title: 'Succès !',
                                text: 'Projet créé avec succès !',
                                timer: 2000,
                                showConfirmButton: false
                            }).then(() => {
                                this.updateMessage = '';
                                this.checkProjectCount();
                                this.router.navigate(['/GetProjet']);
                            });
                        },
                        error: (error) => {
                            console.error('Erreur lors de la création du projet:', error);
                            this.isSaving = false;

                            const status = error.status;
                            let message = error.error?.message || 'Une erreur est survenue.';

                            console.log('Erreur complète :', error); // Pour déboguer
                            console.log('Message extrait :', message); // Pour déboguer

                            if (status === 402) {
                                this.limitReached = true;
                                message = 'Veuillez accéder au paiement pour mettre à jour votre compte.';
                                this.warningMessage = message;
                                this.showLimitReachedAlert(message);
                            } else if (status === 400) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Projet existant',
                                    text: 'Désolé, ce projet existe déjà, vérifiez vos invitations.',
                                    timer: 3000,
                                    showConfirmButton: false
                                });
                            } else if (status === 401) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur !',
                                    text: 'Non autorisé. Veuillez vous connecter.',
                                    timer: 3000,
                                    showConfirmButton: false
                                }).then(() => {
                                    this.router.navigate(['/login']);
                                });
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur !',
                                    text: message,
                                    timer: 3000,
                                    showConfirmButton: false
                                });
                            }
                        }
                    });
                }
            });
        } else {
            this.updateMessage = 'Veuillez remplir tous les champs requis.';
            setTimeout(() => (this.updateMessage = ''), 3000);
        }
    }

    cancel(): void {
        this.router.navigate(['/GetProjet']);
    }
}