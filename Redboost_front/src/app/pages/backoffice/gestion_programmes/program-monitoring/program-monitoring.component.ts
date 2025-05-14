import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../../models/user';
import { ProgramService } from '../../service/program.service';
import { UserService } from '../../../frontoffice/service/UserService';
import { Program } from '../../../../models/program.modal';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-program-monitoring',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
    templateUrl: './program-monitoring.component.html',
    styleUrls: ['./program-monitoring.component.scss']
})
export class ProgramMonitoringComponent implements OnInit {
    programs: Program[] = [];
    filteredPrograms: Program[] = [];
    users: User[] = [];

    programForm: FormGroup;
    editProgramForm: FormGroup;

    searchTerm: string = '';
    selectedStatus: string = 'all';
    selectedDate: string = 'all';

    showAddProgramForm: boolean = false;
    showEditProgramForm: boolean = false;
    showRequiredAlert: boolean = false;
    loading: boolean = true;

    selectedFile: File | null = null;
    selectedEditFile: File | null = null;

    minEndDate: string = '';
    editProgramId: number | null = null;
    today: string = new Date().toISOString().split('T')[0]; // Added for min start date

    constructor(
        private programService: ProgramService,
        private userService: UserService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.programForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            budget: ['', [Validators.required, Validators.min(0)]],
            programLeadId: ['', Validators.required],
            logo: [null, Validators.required]
        });

        this.editProgramForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            budget: ['', [Validators.required, Validators.min(0)]],
            status: ['', Validators.required],
            programLeadId: ['', Validators.required],
            logoUrl: [''],
            logo: [null]
        });
    }

    ngOnInit(): void {
        this.loadPrograms();
        this.loadUsers();

        this.programForm.get('startDate')?.valueChanges.subscribe((value) => {
            if (value) {
                this.minEndDate = value;
                this.programForm.get('endDate')?.updateValueAndValidity();
            }
        });

        this.editProgramForm.get('startDate')?.valueChanges.subscribe((value) => {
            if (value) {
                this.minEndDate = value;
                this.editProgramForm.get('endDate')?.updateValueAndValidity();
            }
        });
    }

    loadPrograms(): void {
        this.loading = true;
        this.programService.getPrograms().subscribe(
            (data) => {
                this.programs = data;
                this.filteredPrograms = [...this.programs];
                this.loading = false;
            },
            (error) => {
                console.error('Erreur chargement programmes:', error);
                this.loading = false;
            }
        );
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe(
            (data) => {
                this.users = data;
            },
            (error) => {
                console.error('Erreur chargement users:', error);
            }
        );
    }

    searchPrograms(term: string): void {
        const searchTerm = term.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredPrograms = [...this.programs];
            this.applyFilters();
            return;
        }

        this.filteredPrograms = this.programs.filter((program) => program.name.toLowerCase().includes(searchTerm) || program.description.toLowerCase().includes(searchTerm));
        this.applyFilters();
    }

    filterByStatus(event: any): void {
        const status = event.target.value;
        this.selectedStatus = status;
        this.applyFilters();
    }

    filterByDate(event: any): void {
        const dateFilter = event.target.value;
        this.selectedDate = dateFilter;
        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.programs];

        // Filtrage par statut
        if (this.selectedStatus !== 'all') {
            filtered = filtered.filter((program) => program.status === this.selectedStatus);
        }

        // Filtrage par date
        const today = new Date();
        if (this.selectedDate !== 'all') {
            filtered = filtered.filter((program) => {
                const startDate = new Date(program.startDate);
                const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (this.selectedDate === 'upcoming') {
                    return diffDays >= 0 && diffDays <= 30;
                } else if (this.selectedDate === 'recent') {
                    return diffDays < 0 && Math.abs(diffDays) <= 30;
                } else if (this.selectedDate === 'distant') {
                    return diffDays > 30;
                }
                return true;
            });
        }

        // Apply search term filter if present
        if (this.searchTerm) {
            const searchTerm = this.searchTerm.toLowerCase().trim();
            filtered = filtered.filter((program) => program.name.toLowerCase().includes(searchTerm) || program.description.toLowerCase().includes(searchTerm));
        }

        this.filteredPrograms = filtered;
    }

    openAddProgramForm(): void {
        this.showAddProgramForm = true;
        this.resetForm();
    }

    openEditProgramForm(program: Program): void {
        this.editProgramId = program.id;
        this.showEditProgramForm = true;
        this.editProgramForm.patchValue({
            name: program.name,
            description: program.description,
            startDate: program.startDate,
            endDate: program.endDate,
            budget: program.budget,
            status: program.status,
            programLeadId: program.programLead?.id || '',
            logoUrl: program.logoUrl
        });
        this.selectedEditFile = null;
        this.minEndDate = program.startDate; // Set minEndDate for edit form
    }

    closeForm(event?: Event): void {
        if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
            this.closeAddProgramForm();
            this.closeEditProgramForm();
        } else if (!event) {
            this.closeAddProgramForm();
            this.closeEditProgramForm();
        }
    }

    closeAddProgramForm(): void {
        this.showAddProgramForm = false;
        this.showRequiredAlert = false;
        this.resetForm();
    }

    closeEditProgramForm(): void {
        this.showEditProgramForm = false;
        this.showRequiredAlert = false;
        this.editProgramForm.reset();
        this.selectedEditFile = null;
        this.editProgramId = null;
    }

    resetForm(): void {
        this.programForm.reset();
        this.selectedFile = null;
        this.minEndDate = this.today; // Reset minEndDate
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.programForm.patchValue({ logo: file.name });
            this.programForm.get('logo')?.markAsDirty();
        }
    }

    onEditFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedEditFile = file;
            this.editProgramForm.patchValue({ logo: file.name });
            this.editProgramForm.get('logo')?.markAsDirty();
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.programForm.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }

    isEditFieldInvalid(fieldName: string): boolean {
        const field = this.editProgramForm.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'Actif';
            case 'ENATTENTE':
                return 'En attente';
            case 'TERMINE':
                return 'Terminé';
            default:
                return status;
        }
    }

    addProgram(): void {
        if (this.programForm.invalid) {
            this.showRequiredAlert = true;
            Object.keys(this.programForm.controls).forEach((key) => {
                this.programForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.showRequiredAlert = false;
        const formData = new FormData();

        Object.keys(this.programForm.value).forEach((key) => {
            if (key !== 'logo') {
                formData.append(key, this.programForm.value[key]);
            }
        });

        if (this.selectedFile) {
            formData.append('logo', this.selectedFile, this.selectedFile.name);
        }

        this.programService.addProgram(formData).subscribe(
            () => {
                this.closeAddProgramForm();
                this.loadPrograms();
            },
            (error) => {
                console.error('Erreur ajout programme:', error);
            }
        );
    }
    getStatusIcon(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'play_circle'; // 🟢 En cours
            case 'ENATTENTE':
                return 'pending_actions'; // 🟡 En file d'attente
            case 'TERMINE':
                return 'task_alt'; // 🔵 Terminé avec succès
            default:
                return 'help'; // En cas de problème
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'active';
            case 'ENATTENTE':
                return 'waiting';
            case 'TERMINE':
                return 'completed';
            default:
                return '';
        }
    }

    updateProgram(): void {
        if (this.editProgramForm.invalid) {
            this.showRequiredAlert = true;
            Object.keys(this.editProgramForm.controls).forEach((key) => {
                this.editProgramForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.showRequiredAlert = false;
        const formData = new FormData();

        Object.keys(this.editProgramForm.value).forEach((key) => {
            if (key !== 'logo' && key !== 'logoUrl') {
                formData.append(key, this.editProgramForm.value[key]);
            }
        });

        if (this.selectedEditFile) {
            formData.append('logo', this.selectedEditFile, this.selectedEditFile.name);
        }

        if (this.editProgramId !== null) {
            this.programService.updateProgram(this.editProgramId, formData).subscribe(
                () => {
                    this.closeEditProgramForm();
                    this.loadPrograms();
                },
                (error) => {
                    console.error('Erreur mise à jour programme:', error);
                }
            );
        }
    }

    deleteProgram(programId: number): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
            this.programService.deleteProgram(programId).subscribe(
                () => {
                    this.loadPrograms();
                },
                (error) => {
                    console.error('Erreur suppression programme:', error);
                }
            );
        }
    }

    viewProgram(programId: number): void {
        this.router.navigate(['/programs', programId]);
    }
}
