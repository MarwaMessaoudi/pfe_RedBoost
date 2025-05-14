import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ProgramService } from '../../service/program.service';
import { ActivityService } from '../../service/activity.service';
import { EventService } from '../../service/event.service';

@Component({
    selector: 'app-program-detail',
    standalone: true,
    imports: [CommonModule, FullCalendarModule, ReactiveFormsModule, FormsModule],
    templateUrl: './program-details.component.html',
    styleUrls: ['./program-details.component.scss']
})
export class ProgramDetailComponent implements OnInit {
    program: any;
    selectedStatus: string = 'all'; // 'all', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
    selectedDateFilter: string = 'all'; // 'all', 'upcoming', 'recent', 'distant'

    activities: any[] = [];
    filteredActivities: any[] = [];
    activityForm: FormGroup;
    showAddActivityModal = false;
    activityFilter: string = '';
    editingActivity: any = null;

    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        plugins: [dayGridPlugin],
        events: [],
        height: 'auto'
    };

    constructor(
        private route: ActivatedRoute,
        private programService: ProgramService,
        private activityService: ActivityService,
        private eventService: EventService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.activityForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            color: ['#C8223A', Validators.required]
        });
    }

    ngOnInit(): void {
        const programId = Number(this.route.snapshot.paramMap.get('id'));
        if (programId) {
            this.loadProgram(programId);
            this.loadActivities(programId);
        }
    }

    loadProgram(programId: number): void {
        this.programService.getProgramById(programId).subscribe({
            next: (data) => (this.program = data),
            error: (err) => console.error('Erreur programme:', err)
        });
    }

    loadActivities(programId: number): void {
        this.activityService.getActivitiesByProgram(programId).subscribe({
            next: (data) => {
                this.activities = data;
                this.filteredActivities = [...this.activities];
                this.calendarOptions.events = this.activities.map((act: any) => ({
                    title: act.name,
                    start: act.startDate,
                    end: act.endDate,
                    color: act.color
                }));
            },
            error: (err) => console.error('Erreur activités:', err)
        });
    }
    translateStatus(status: string): string {
        switch (status) {
            case 'NOT_STARTED':
                return 'Pas commencé';
            case 'IN_PROGRESS':
                return 'En cours';
            case 'COMPLETED':
                return 'Terminé';
            default:
                return 'Inconnu';
        }
    }

    toggleActivityModal(): void {
        this.showAddActivityModal = !this.showAddActivityModal;
        if (!this.showAddActivityModal) {
            this.activityForm.reset({ color: '#C8223A' });
        }
    }

    addActivity(): void {
        if (this.activityForm.invalid || !this.program?.id) return;

        const newActivity = {
            ...this.activityForm.value,
            program: { id: this.program.id },
            status: 'NOT_STARTED'
        };

        this.activityService.createActivity(newActivity, this.program.id).subscribe({
            next: () => {
                this.activityForm.reset({ color: '#C8223A' });
                this.showAddActivityModal = false;
                this.loadActivities(this.program.id);
            },
            error: (err) => console.error('Erreur ajout activité:', err)
        });
    }

    goToKanban(activityId: number): void {
        this.router.navigate(['/Activities', activityId]);
    }

    filterActivities(): void {
        const today = new Date();
        this.filteredActivities = this.activities.filter((act) => {
            const matchesName = !this.activityFilter || act.name.toLowerCase().includes(this.activityFilter.toLowerCase());

            const matchesStatus = this.selectedStatus === 'all' || act.status === this.selectedStatus;

            const activityStartDate = new Date(act.startDate);
            let matchesDate = true;

            if (this.selectedDateFilter === 'upcoming') {
                matchesDate = activityStartDate > today;
            } else if (this.selectedDateFilter === 'recent') {
                const recentDate = new Date();
                recentDate.setDate(today.getDate() - 7); // Moins de 7 jours
                matchesDate = activityStartDate >= recentDate && activityStartDate <= today;
            } else if (this.selectedDateFilter === 'distant') {
                const distantDate = new Date();
                distantDate.setDate(today.getDate() + 30); // Plus de 30 jours
                matchesDate = activityStartDate > distantDate;
            }

            return matchesName && matchesStatus && matchesDate;
        });
    }

    editActivity(activity: any): void {
        this.editingActivity = activity;
        this.showAddActivityModal = true;

        this.activityForm.patchValue({
            name: activity.name,
            description: activity.description,
            startDate: activity.startDate,
            endDate: activity.endDate,
            color: activity.color
        });
    }

    addOrUpdateActivity(): void {
        if (this.activityForm.invalid || !this.program?.id) return;

        const activityData = {
            ...this.activityForm.value,
            program: { id: this.program.id }
        };

        if (this.editingActivity) {
            // ➡️ Mode édition
            this.activityService.updateActivity(this.editingActivity.id, activityData).subscribe({
                next: () => {
                    this.resetActivityModal();
                    this.loadActivities(this.program.id);
                },
                error: (err) => console.error('Erreur mise à jour activité:', err)
            });
        } else {
            // ➡️ Mode création
            this.activityService.createActivity(activityData, this.program.id).subscribe({
                next: () => {
                    this.resetActivityModal();
                    this.loadActivities(this.program.id);
                },
                error: (err) => console.error('Erreur création activité:', err)
            });
        }
    }

    // Reset modal
    resetActivityModal(): void {
        this.activityForm.reset({ color: '#C8223A' });
        this.showAddActivityModal = false;
        this.editingActivity = null;
    }

    deleteActivity(activityId: number): void {
        if (confirm('Supprimer cette activité ?')) {
            this.activityService.deleteActivity(activityId).subscribe({
                next: () => this.loadActivities(this.program.id),
                error: (err) => console.error('Erreur suppression activité:', err)
            });
        }
    }

    private calculateActivityStatus(tasks: any[]): string {
        if (!tasks.length) return 'pas_commence';
        const allCompleted = tasks.every((t) => t.status === 'Terminé');
        const someInProgress = tasks.some((t) => t.status === 'En cours');
        if (allCompleted) return 'termine';
        if (someInProgress) return 'en_cours';
        return 'pas_commence';
    }
}
