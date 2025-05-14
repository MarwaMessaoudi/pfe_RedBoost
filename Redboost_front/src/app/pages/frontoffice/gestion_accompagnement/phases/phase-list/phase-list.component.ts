import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PhaseService } from '../../../service/phase.service';
import { TaskService } from '../../../service/task.service';
import { Phase, PhaseStatus } from '../../../../../models/phase';
import { Task, Status } from '../../../../../models/task';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EvaluationService } from '../../../service/evaluation.service';
import { UserService } from '../../../service/UserService';
import { ProjetService } from '../../../service/projet-service.service';
import { User } from '../../../../../models/user';
import { Projet } from '../../../../../models/Projet';
import { EvaluationFormComponent } from '../../../evaluation-form/evaluation-form.component';
import { filter, switchMap, take, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
    selector: 'phase-description-dialog',
    template: `
        <div class="content-card">
            <h2>{{ data.phaseName }}</h2>
            <p class="description">{{ data.description }}</p>
            <div class="deadline-info">
                <span class="deadline-label">Date limite :</span>
                <span class="deadline-value">{{ data.deadline }}</span>
            </div>
            <div class="dialog-actions">
                <button mat-button mat-dialog-close class="close-button">Fermer</button>
            </div>
        </div>
    `,
    styles: [
        `
            .content-card {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                padding: 20px;
                border: 1px solid #e0e0e0;
            }
            .content-card h2 {
                margin-top: 0;
                margin-bottom: 16px;
                font-size: 18px;
                color: #333;
            }
            .description {
                margin-bottom: 20px;
                line-height: 1.6;
                color: #555;
            }
            .deadline-info {
                display: flex;
                align-items: center;
                padding-top: 12px;
                border-top: 1px solid #eee;
            }
            .deadline-label {
                font-weight: 500;
                margin-right: 8px;
                color: #666;
            }
            .deadline-value {
                color: #333;
                font-weight: 500;
            }
            .dialog-actions {
                display: flex;
                justify-content: flex-end;
            }
            .close-button {
                background-color: #f0f0f0;
                color: #333;
                padding: 8px 16px;
                border-radius: 4px;
            }
        `
    ],
    standalone: true,
    imports: [MatButtonModule, MatDialogModule, CommonModule]
})
export class PhaseDescriptionDialogComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: { phaseName: string; description: string; deadline: string }) {}
}

@Component({
    selector: 'app-phase-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatTableModule, MatIconModule, MatButtonModule, DatePipe, MatDialogModule, MatTooltipModule],
    templateUrl: './phase-list.component.html',
    styleUrls: ['./phase-list.component.scss'],
    providers: [DatePipe]
})
export class PhaseListComponent implements OnInit {
    phases: Phase[] = [];
    loading = true;
    error = '';
    PhaseStatus = PhaseStatus;
    inProgressCount: number = 0;
    upcomingCount: number = 0;
    currentDate: Date = new Date();
    phaseTasks: { [phaseId: number]: Task[] } = {};
    projectId: number | null = null;
    currentUser: User | null = null;
    isEntrepreneur = false;
    currentProjectName: string | null = null;

    constructor(
        private phaseService: PhaseService,
        private taskService: TaskService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar,
        private datePipe: DatePipe,
        private router: Router,
        private route: ActivatedRoute,
        private evaluationService: EvaluationService,
        private userService: UserService,
        private projectService: ProjetService
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.projectId = params['projectId'] ? parseInt(params['projectId'], 10) : null;

            this.userService.user$.subscribe((user) => {
                this.currentUser = user;
                this.isEntrepreneur = this.currentUser?.role === 'ENTREPRENEUR';
                console.log('PhaseList ngOnInit: User updated:', this.currentUser);
            });

            if (this.projectId != null) {
                this.projectService
                    .getProjetById(this.projectId)
                    .pipe(
                        take(1),
                        catchError((err) => {
                            console.error(`Failed to load project ${this.projectId} name:`, err);
                            return of(null);
                        })
                    )
                    .subscribe((project) => {
                        this.currentProjectName = project?.name || null;
                        console.log(`PhaseList ngOnInit: Project name fetched for ${this.projectId}: "${this.currentProjectName}"`);
                    });
            } else {
                this.currentProjectName = null;
            }

            this.loadPhases();
        });
    }

    loadPhases(): void {
        this.loading = true;
        this.phaseService.getAllPhases().subscribe({
            next: (data) => {
                this.phases = data.filter((phase) => !this.projectId || phase.projetId === this.projectId).sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

                this.loading = false;
                this.calculateMetrics();
                this.loadTasksForPhases();
                this.checkForPendingEvaluations();
            },
            error: (err) => {
                this.error = 'Impossible de charger les phases. Veuillez réessayer plus tard.';
                this.loading = false;
                console.error('Erreur lors du chargement des phases :', err);
            }
        });
    }

    loadTasksForPhases(): void {
        this.phases.forEach((phase) => {
            this.taskService.getTasksByPhaseId(phase.phaseId!).subscribe({
                next: (tasks) => {
                    this.phaseTasks[phase.phaseId!] = tasks;
                },
                error: (err) => {
                    console.error(`Impossible de charger les tâches pour la phase ${phase.phaseId} :`, err);
                }
            });
        });
    }

    calculateMetrics(): void {
        this.inProgressCount = this.phases.filter((phase) => phase.status === PhaseStatus.IN_PROGRESS).length;
        this.upcomingCount = this.phases.filter((phase) => phase.status === PhaseStatus.NOT_STARTED).length;
    }

    getPhasesByStatus(status: PhaseStatus): Phase[] {
        return this.phases.filter((phase) => phase.status === status);
    }

    deletePhase(id: number): void {
        this.phaseService.deletePhase(id).subscribe({
            next: () => {
                this.phases = this.phases.filter((phase) => phase.phaseId !== id);
                this.snackBar.open('Phase supprimée avec succès', 'Fermer', { duration: 3000 });
                this.loadPhases();
            },
            error: (err) => {
                this.error = 'Impossible de supprimer la phase. Veuillez réessayer plus tard.';
                console.error('Erreur lors de la suppression de la phase :', err);
                this.snackBar.open('Impossible de supprimer la phase', 'Fermer', { duration: 3000 });
            }
        });
    }

    openEditDialog(phase: Phase): void {
        const dialogRef = this.dialog.open(PhaseFormComponent, {
            maxWidth: 'none',
            data: { phase: { ...phase }, isEdit: true, projectId: this.projectId }
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.loadPhases();
                    this.snackBar.open('Phase mise à jour avec succès', 'Fermer', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Error updating the phase: ', err);
            }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(PhaseFormComponent, {
            maxWidth: 'none',
            data: { isEdit: false, projectId: this.projectId }
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.loadPhases();
                    this.snackBar.open('Phase créée avec succès', 'Fermer', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Error creating the phase: ', err);
            }
        });
    }

    calculateDoneXP(phaseId: number): number {
        const tasks = this.phaseTasks[phaseId];
        if (!tasks) return 0;
        return tasks.reduce((sum, task) => sum + (task.status === Status.VALIDATED ? task.xpPoint || 0 : 0), 0);
    }

    calculateXPProgress(phaseId: number): number {
        const tasks = this.phaseTasks[phaseId];
        if (!tasks || tasks.length === 0) return 0;
        const totalXP = this.phases.find((p) => p.phaseId === phaseId)?.totalXpPoints ?? tasks.reduce((sum, task) => sum + (task.xpPoint || 0), 0);
        const validatedXP = this.calculateDoneXP(phaseId);
        return totalXP === 0 ? 0 : Math.round((validatedXP / totalXP) * 100);
    }

    getDaysLeft(endDate: string): number {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    }

    openDescriptionDialog(phase: Phase): void {
        this.dialog.open(PhaseDescriptionDialogComponent, {
            width: '800px',
            panelClass: 'styled-dialog',
            data: {
                phaseName: phase.phaseName,
                description: phase.description,
                deadline: this.datePipe.transform(phase.endDate, 'MMMM d, y')
            }
        });
    }

    goToKanbanBoard(phaseId: number): void {
        this.router.navigate(['/phases', phaseId]);
    }

    goBackToProjects(): void {
        this.router.navigate(['/GetProjet']);
    }

    checkForPendingEvaluations(): void {
        if (!this.isEntrepreneur || !this.currentUser?.id || this.projectId == null || this.currentProjectName == null) {
            if (!this.isEntrepreneur || !this.currentUser?.id) {
                // console.log("Evaluation check skipped: User is not logged in or not an entrepreneur.");
            } else if (this.projectId == null) {
                console.log('Evaluation check skipped: projectId is null (not viewing a specific project).');
            } else if (this.currentProjectName == null) {
                console.log(`Evaluation check skipped: Project name for projectId ${this.projectId} is not loaded yet.`);
            }
            return;
        }

        console.log(`Checking for pending evaluations for user ${this.currentUser.id} in project "${this.currentProjectName}" (ID: ${this.projectId})...`);

        this.evaluationService.getPendingEvaluationPhaseIds(this.currentUser.id).subscribe({
            next: (pendingPhaseIds: number[]) => {
                if (pendingPhaseIds && pendingPhaseIds.length > 0) {
                    const phaseToEvaluate = this.phases.find((phase) => phase.phaseId != null && phase.projetId === this.projectId && pendingPhaseIds.includes(phase.phaseId));

                    if (phaseToEvaluate) {
                        console.log(`Pending evaluation found for phase "${phaseToEvaluate.phaseName}" (ID: ${phaseToEvaluate.phaseId}) within the current project. Opening form.`);

                        this.openEvaluationFormDialog(phaseToEvaluate.phaseId!, phaseToEvaluate.phaseName, this.projectId!, this.currentProjectName!, this.currentUser!.id, `${this.currentUser?.firstName} ${this.currentUser?.lastName}`);
                    } else {
                        console.log('No pending evaluations found in the currently displayed project list for this user.');
                    }
                } else {
                    console.log('No pending evaluations found for this user overall.');
                }
            },
            error: (err) => {
                console.error('Error checking for pending evaluations:', err);
                const errorMessage = err.message || "Erreur lors de la vérification des formulaires d'évaluation requis.";
                this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
            }
        });
    }

    openEvaluationFormDialog(phaseId: number, phaseName: string, projectId: number, projectName: string, userId: number, userName: string): void {
        const dialogRef: MatDialogRef<EvaluationFormComponent, any> = this.dialog.open(EvaluationFormComponent, {
            width: '700px',
            disableClose: true,
            data: {
                phaseId: phaseId,
                phaseName: phaseName,
                projectId: projectId,
                projectName: projectName,
                userId: userId,
                userName: userName
            },
            panelClass: 'evaluation-form-dialog'
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log('Evaluation Form dialog was closed with result:', result);
            if (result === 'submitted') {
                this.snackBar.open('Votre évaluation a été soumise avec succès!', 'Fermer', { duration: 5000 });
                this.loadPhases();
            } else if (result === 'cancel') {
                this.snackBar.open("Soumission de l'évaluation annulée. Vous pourrez être invité à le remplir plus tard.", 'Fermer', { duration: 5000 });
            }
        });
    }
}
