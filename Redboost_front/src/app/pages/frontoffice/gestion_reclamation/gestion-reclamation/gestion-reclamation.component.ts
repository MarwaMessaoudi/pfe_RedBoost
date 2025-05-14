import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReclamationService } from '../../service/reclamation.service';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-gestion-reclamation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [DatePipe, ReclamationService],
    templateUrl: './gestion-reclamation.component.html',
    styleUrls: ['./gestion-reclamation.component.scss']
})
export class GestionReclamationComponent implements OnInit {
    myDate: Date = new Date();
    reclamationForm: FormGroup;
    selectedFiles: File[] = [];
    fileError: string | null = null;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    isSubmitting = false;

    public f: any; // Public property to access form controls

    constructor(
        private fb: FormBuilder,
        private reclamationService: ReclamationService,
        private datePipe: DatePipe,
        private http: HttpClient
    ) {
        this.reclamationForm = this.fb.group({
            nom: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            date: this.datePipe.transform(this.myDate, 'yyyy-MM-ddTHH:mm:ss.SSSZ'), // Initialize with formatted date
            sujet: ['', Validators.required],
            description: ['', Validators.required],
            categorie: ['', Validators.required],
            fichierReclamation: [null]
        });
        this.f = this.reclamationForm.controls; // Assign form controls to 'f'
    }

    ngOnInit(): void {
        // Attendre un court instant pour s'assurer que tout est prêt
        setTimeout(() => {
            this.loadUserInfo();
        }, 100);
    }

    loadUserInfo() {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decodedToken: any = jwtDecode(token);
                console.log('Structure complète du token:', JSON.stringify(decodedToken, null, 2));

                // Extraire l'email à partir du champ "sub"
                const email = decodedToken.sub || '';

                // Pour le nom, vous pourriez utiliser l'email ou demander à l'API
                // Pour l'instant, utilisez l'email sans le domaine comme nom
                const nomUtilisateur = email.split('@')[0] || '';

                console.log('Valeurs extraites:', { email, nomUtilisateur });

                // Définir les valeurs dans le formulaire
                this.reclamationForm.controls['email'].setValue(email);
                this.reclamationForm.controls['email'].markAsDirty();

                this.reclamationForm.controls['nom'].setValue(nomUtilisateur);
                this.reclamationForm.controls['nom'].markAsDirty();
            } catch (error) {
                console.error('Error decoding token:', error);
                this.errorMessage = "Impossible de charger les informations de l'utilisateur.";
            }
        } else {
            console.error('Token non trouvé dans localStorage');
        }
    }

    formatDate(date: Date): string {
        // Keep this formatting function
        return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss.SSSZ') || '';
    }

    get accessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    onFilesChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = [];
        this.fileError = null;

        if (input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                const maxSize = 5 * 1024 * 1024;

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
        if (this.reclamationForm.invalid) {
            return;
        }

        if (!this.accessToken) {
            this.errorMessage = 'Vous devez être connecté pour soumettre une réclamation.';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = null;
        this.successMessage = null;

        const reclamationData = {
            sujet: this.reclamationForm.get('sujet')?.value,
            description: this.reclamationForm.get('description')?.value,
            categorie: this.reclamationForm.get('categorie')?.value,
            nom: this.reclamationForm.get('nom')?.value,
            email: this.reclamationForm.get('email')?.value
            // No need to send date, the server will set it
        };

        console.log('Sending reclamation data:', reclamationData);

        this.http
            .post<any>('http://localhost:8085/api/reclamations/add', reclamationData, {
                headers: new HttpHeaders({
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    this.successMessage = 'Votre réclamation a été soumise avec succès!';
                    this.resetForm();
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.errorMessage = 'Une erreur est survenue lors de la soumission de votre réclamation. Veuillez réessayer.';
                    console.error('Erreur lors de la création de la réclamation:', error);
                    console.error('Status:', error.status);
                    console.error('Message:', error.message);
                    if (error.error) {
                        console.error('Error details:', error.error);
                    }
                }
            });
    }
    resetForm(): void {
        this.reclamationForm.reset();
        this.selectedFiles = [];
        this.fileError = null;
        //reload the form
        this.reclamationForm.controls['date'].setValue(this.formatDate(new Date()));
    }
}
