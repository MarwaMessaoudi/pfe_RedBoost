import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../frontoffice/service/UserService';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-binome-coach-request',
    standalone: true,
    imports: [FormsModule, CommonModule, RouterModule],
    template: `
        <div class="form-container">
            <h2 class="text-3xl font-bold text-[#034A55] mb-6">Apply as Binome Coach</h2>
            <form (ngSubmit)="submitRequest()" class="space-y-6" enctype="multipart/form-data">
                <div class="input-group">
                    <label for="firstName">First Name <span class="text-red-500">*</span></label>
                    <input id="firstName" type="text" [(ngModel)]="coachData.firstName" name="firstName" required class="input-field" />
                </div>
                <div class="input-group">
                    <label for="lastName">Last Name <span class="text-red-500">*</span></label>
                    <input id="lastName" type="text" [(ngModel)]="coachData.lastName" name="lastName" required class="input-field" />
                </div>
                <div class="input-group">
                    <label for="email">Email <span class="text-red-500">*</span></label>
                    <input id="email" type="email" [(ngModel)]="coachData.email" name="email" required class="input-field" />
                </div>
                <div class="input-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input id="phoneNumber" type="text" [(ngModel)]="coachData.phoneNumber" name="phoneNumber" class="input-field" />
                </div>
                <div class="input-group">
                    <label for="yearsOfExperience">Years of Experience <span class="text-red-500">*</span></label>
                    <input id="yearsOfExperience" type="number" [(ngModel)]="coachData.yearsOfExperience" name="yearsOfExperience" required class="input-field" min="0" />
                </div>
                <div class="input-group">
                    <label for="skills">Skills (comma-separated)</label>
                    <input id="skills" type="text" [(ngModel)]="coachData.skills" name="skills" class="input-field" placeholder="e.g., Strength Training, Yoga" />
                </div>
                <div class="input-group">
                    <label for="expertise">Expertise (comma-separated)</label>
                    <input id="expertise" type="text" [(ngModel)]="coachData.expertise" name="expertise" class="input-field" placeholder="e.g., Fitness, Nutrition" />
                </div>
                <div class="input-group">
                    <label for="isCertified">Certified?</label>
                    <input id="isCertified" type="checkbox" [(ngModel)]="coachData.isCertified" name="isCertified" />
                </div>
                <div class="input-group">
                    <label for="totalProposedFee">Total Proposed Fee ($)</label>
                    <input id="totalProposedFee" type="number" [(ngModel)]="coachData.totalProposedFee" name="totalProposedFee" class="input-field" min="0" step="0.01" />
                </div>
                <div class="input-group">
                    <label for="cvFile">CV</label>
                    <input id="cvFile" type="file" (change)="onFileChange($event, 'cvFile')" name="cvFile" class="input-field" accept=".pdf" />
                </div>
                <div class="input-group">
                    <label for="trainingProgramFile">Training Program</label>
                    <input id="trainingProgramFile" type="file" (change)="onFileChange($event, 'trainingProgramFile')" name="trainingProgramFile" class="input-field" accept=".pdf" />
                </div>
                <div class="input-group">
                    <label for="certificationFiles">Certification Documents</label>
                    <input id="certificationFiles" type="file" (change)="onFileChange($event, 'certificationFiles')" name="certificationFiles" class="input-field" accept=".pdf" multiple />
                </div>
                <div class="input-group">
                    <label for="certificationType">Certification Type</label>
                    <input id="certificationType" type="text" [(ngModel)]="coachData.certificationType" name="certificationType" class="input-field" placeholder="e.g., Personal Trainer Certification" />
                </div>
                <button type="submit" [disabled]="!isFormValid()" class="submit-button">Submit Binome Application</button>
            </form>
        </div>
    `,
    styles: [
        `
            .form-container {
                max-width: 600px;
                margin: 50px auto;
                padding: 30px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .input-group {
                display: flex;
                flex-direction: column;
            }

            label {
                font-weight: 600;
                color: #034a55;
                margin-bottom: 8px;
            }

            .input-field {
                padding: 12px;
                border: 1px solid #ccc;
                border-radius: 5px;
                font-size: 16px;
                transition: border-color 0.3s;
            }

            .input-field:focus {
                border-color: #c8223a;
                outline: none;
            }

            .submit-button {
                width: 100%;
                padding: 14px;
                background: linear-gradient(to right, #c8223a, #034a55);
                color: white;
                font-weight: 600;
                font-size: 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }

            .submit-button:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }

            .submit-button:hover:not(:disabled) {
                background: linear-gradient(to right, #034a55, #c8223a);
            }
        `
    ]
})
export class BinomeCoachRequestComponent implements OnInit {
    coachData: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        yearsOfExperience: number;
        skills: string;
        expertise: string;
        certificationType: string;
        isCertified: boolean;
        totalProposedFee: number;
    } = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        yearsOfExperience: 0,
        skills: '',
        expertise: '',
        certificationType: '',
        isCertified: false,
        totalProposedFee: 0
    };
    token: string = '';
    files: {
        cvFile?: File;
        trainingProgramFile?: File;
        certificationFiles?: File[];
    } = {};

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        const currentUser = this.userService.getUser();
        if (currentUser) {
            this.coachData.firstName = currentUser.firstName || '';
            this.coachData.lastName = currentUser.lastName || '';
            this.coachData.email = currentUser.email || '';
            this.coachData.phoneNumber = currentUser.phoneNumber || '';
        }
    }

    isFormValid(): boolean {
        const { firstName, lastName, email, yearsOfExperience } = this.coachData;
        return !!firstName && !!lastName && !!email && yearsOfExperience >= 0 && !!this.token;
    }

    onFileChange(event: Event, field: keyof typeof this.files) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            if (field === 'certificationFiles') {
                this.files.certificationFiles = Array.from(input.files);
            } else if (field === 'cvFile' || field === 'trainingProgramFile') {
                this.files[field] = input.files[0];
            }
        }
    }

    submitRequest() {
        const formData = new FormData();
        formData.append('token', this.token);
        const formDataJson = [
            { key: 'coachData', value: JSON.stringify(this.coachData) },
            { key: 'isBinome', value: 'true' }
        ];
        formData.append('formData', JSON.stringify(formDataJson));

        if (this.files.cvFile) {
            formData.append('cvFile', this.files.cvFile);
        }
        if (this.files.trainingProgramFile) {
            formData.append('trainingProgramFile', this.files.trainingProgramFile);
        }
        if (this.files.certificationFiles) {
            this.files.certificationFiles.forEach((file) => {
                formData.append(`certificationFiles`, file);
            });
        }

        this.userService.submitBinomeCoachRequest(formData).subscribe({
            next: (response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Your binome coach application has been submitted successfully. Awaiting approval.',
                    confirmButtonColor: '#034A55'
                }).then(() => {
                    this.router.navigate(['/landing']);
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to submit binome application'
                });
            }
        });
    }
}