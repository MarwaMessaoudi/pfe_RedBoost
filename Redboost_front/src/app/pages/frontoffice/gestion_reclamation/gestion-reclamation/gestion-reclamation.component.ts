import { Component, OnInit, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReclamationService } from '../../service/reclamation.service';
import { UserService } from '../../service/UserService';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

@Component({
    selector: 'app-gestion-reclamation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [DatePipe, ReclamationService, UserService],
    templateUrl: './gestion-reclamation.component.html',
    styleUrls: ['./gestion-reclamation.component.scss']
})
export class GestionReclamationComponent implements OnInit, AfterViewChecked {
    reclamationForm: FormGroup;
    selectedFiles: File[] = [];
    fileError: string | null = null;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    isSubmitting = false;
    validationErrors: string[] = [];
    viewChecked = false;

    public f: any;

    constructor(
        private fb: FormBuilder,
        private reclamationService: ReclamationService,
        private userService: UserService,
        private datePipe: DatePipe,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {
        this.reclamationForm = this.fb.group({
            nomComplet: [{ value: '', disabled: true }, Validators.required],
            date: [{ value: '', disabled: true }, Validators.required],
            email: [{ value: '', disabled: true }, Validators.required],
            sujet: ['', Validators.required],
            description: ['', Validators.required],
            categorie: ['', Validators.required]
        });
        this.f = this.reclamationForm.controls;
    }

    ngOnInit(): void {
        console.log('GestionReclamationComponent initialized');
        const token = this.accessToken;
        if (token) {
            try {
                const decodedToken: JwtPayload = jwtDecode(token);
                const userId = Number(decodedToken.userId);
                this.userService.getUserById(userId).subscribe({
                    next: (user) => {
                        if (user) {
                            const nomComplet = `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`.trim();
                            this.reclamationForm.patchValue({
                                nomComplet: nomComplet,
                                email: user.email || decodedToken.email,
                                date: this.datePipe.transform(new Date(), 'yyyy-MM-dd')
                            });
                        } else {
                            this.errorMessage = 'Impossible de charger les informations utilisateur.';
                            this.clearMessagesAfterTimeout();
                        }
                    },
                    error: (error) => {
                        console.error('Error fetching user details:', error);
                        this.errorMessage = 'Erreur lors du chargement des informations utilisateur.';
                        this.clearMessagesAfterTimeout();
                    }
                });
            } catch (error) {
                console.error('Error decoding JWT token:', error);
                this.errorMessage = 'Erreur lors de l\'authentification.';
                this.clearMessagesAfterTimeout();
            }
        } else {
            this.errorMessage = 'Vous devez être connecté pour soumettre une réclamation.';
            this.clearMessagesAfterTimeout();
        }
    }

    ngAfterViewChecked() {
        if (this.successMessage && !this.viewChecked) {
            setTimeout(() => {
                this.scrollToMessage('success-message');
            }, 100);
            this.viewChecked = true;
        }
    }

    onFilesChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = [];
        this.fileError = null;

        if (input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                const maxSize = 5 * 1024 * 1024; // 5MB

                if (allowedTypes.includes(file.type)) {
                    if (file.size <= maxSize) {
                        this.selectedFiles.push(file);
                    } else {
                        this.fileError = 'Un ou plusieurs fichiers sont trop volumineux (max 5 MB)';
                        this.selectedFiles = [];
                        break;
                    }
                } else {
                    this.fileError = 'Format de fichier non supporté. Veuillez sélectionner un PDF, JPG ou PNG';
                    this.selectedFiles = [];
                    break;
                }
            }
        }
    }

    onSubmit(): void {
        this.validationErrors = [];
        this.errorMessage = null;
        this.successMessage = null;
        this.viewChecked = false;

        if (!this.reclamationForm.get('categorie')?.value) {
            this.validationErrors.push('Catégorie requise');
        }
        if (!this.reclamationForm.get('description')?.value) {
            this.validationErrors.push('Description requise');
        }

        if (this.reclamationForm.invalid || this.validationErrors.length > 0) {
            this.reclamationForm.markAllAsTouched();
            this.cdr.detectChanges();
            return;
        }

        const token = this.accessToken;
        if (!token) {
            this.errorMessage = 'Vous devez être connecté pour soumettre une réclamation.';
            this.clearMessagesAfterTimeout();
            return;
        }

        this.isSubmitting = true;

        const reclamationData = {
            sujet: this.reclamationForm.get('sujet')?.value,
            description: this.reclamationForm.get('description')?.value,
            categorie: this.reclamationForm.get('categorie')?.value
        };

        const formData = new FormData();
        formData.append('reclamation', new Blob([JSON.stringify(reclamationData)], { type: 'application/json' }));
        if (this.selectedFiles.length > 0) {
            formData.append('file', this.selectedFiles[0]);
        }

        this.http
            .post<any>('http://localhost:8085/api/reclamations/add', formData, {
                headers: new HttpHeaders({
                    Authorization: `Bearer ${token}`
                })
            })
            .subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    this.successMessage = 'Votre réclamation a été soumise avec succès !';
                    console.log('Success message set:', this.successMessage, 'Timestamp:', Date.now());
                    
                    // Force rendering update
                    setTimeout(() => {
                        this.cdr.markForCheck();
                        this.cdr.detectChanges();
                        console.log('After detectChanges, success message status:', this.successMessage);
                        
                        // Check if success-message element exists in DOM
                        const messageElement = document.getElementById('success-message');
                        console.log('Success message element:', messageElement);
                        
                        if (messageElement) {
                            // Force show success message
                            messageElement.style.display = 'block';
                            messageElement.style.opacity = '1';
                            messageElement.style.visibility = 'visible';
                            this.scrollToMessage('success-message');
                        }
                        
                        // Reset form but maintain success message temporarily
                        this.resetFormKeepMessage();
                        this.clearMessagesAfterTimeout();
                    }, 100);
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.errorMessage = 'Échec de la soumission de la réclamation. Veuillez réessayer.';
                    console.error('Erreur lors de la création de la réclamation:', error);
                    this.cdr.detectChanges();
                    this.scrollToMessage('error-message');
                    this.clearMessagesAfterTimeout();
                }
            });
    }

    resetFormKeepMessage(): void {
        // Store current success message
        const currentSuccessMessage = this.successMessage;
        
        // Reset form fields but keep readonly fields
        const nomComplet = this.reclamationForm.get('nomComplet')?.value;
        const email = this.reclamationForm.get('email')?.value;
        const date = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        
        this.reclamationForm.reset();
        
        // Restore readonly fields
        this.reclamationForm.patchValue({
            nomComplet: nomComplet,
            email: email,
            date: date
        });
        
        // Reset file selection
        this.selectedFiles = [];
        this.fileError = null;
        this.validationErrors = [];
        
        // Restore success message
        this.successMessage = currentSuccessMessage;
        
        this.cdr.detectChanges();
    }

    resetForm(): void {
        // Only completely reset when manually clicked
        const nomComplet = this.reclamationForm.get('nomComplet')?.value;
        const email = this.reclamationForm.get('email')?.value;
        const date = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        
        this.reclamationForm.reset();
        
        this.reclamationForm.patchValue({
            nomComplet: nomComplet,
            email: email,
            date: date
        });
        
        this.selectedFiles = [];
        this.fileError = null;
        this.successMessage = null;
        this.errorMessage = null;
        this.validationErrors = [];
        this.cdr.detectChanges();
    }

    clearMessagesAfterTimeout(): void {
        setTimeout(() => {
            this.successMessage = null;
            this.errorMessage = null;
            this.validationErrors = [];
            this.cdr.detectChanges();
        }, 7000);
    }

    scrollToMessage(messageId: string): void {
        setTimeout(() => {
            const messageElement = document.getElementById(messageId);
            console.log(`Scrolling to: ${messageId}, Element:`, messageElement);
            
            if (messageElement) {
                // Force show the element
                messageElement.style.display = 'block';
                messageElement.style.visibility = 'visible';
                messageElement.style.opacity = '1';
                
                // Scroll to it
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                console.warn(`Element not found: ${messageId}`);
            }
        }, 200);
    }

    get accessToken(): string | null {
        return localStorage.getItem('accessToken');
    }
}