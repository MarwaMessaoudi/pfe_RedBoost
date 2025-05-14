import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleDriveService } from '../service/GoogleDriveService';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../service/auth.service';
import { trigger, state, style, animate, transition, stagger, query, keyframes } from '@angular/animations';

@Component({
    selector: 'app-google-drive',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.scss'],
    animations: [
        trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(10px)' }), animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])]),
        trigger('hoverScale', [state('default', style({ transform: 'scale(1)' })), state('hovered', style({ transform: 'scale(1.02)' })), transition('default <=> hovered', animate('200ms ease-in-out'))]),
        trigger('buttonClick', [transition('* => clicked', [animate('200ms', keyframes([style({ transform: 'scale(1)', offset: 0 }), style({ transform: 'scale(0.95)', offset: 0.5 }), style({ transform: 'scale(1)', offset: 1 })]))])]),
        trigger('inputFocus', [
            state('blurred', style({ borderColor: '#d1d5db' })),
            state('focused', style({ borderColor: '#3b82f6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)' })),
            transition('blurred <=> focused', animate('200ms ease-in-out'))
        ]),
        trigger('staggerIn', [transition('* => *', [query(':enter', [style({ opacity: 0, transform: 'translateY(10px)' }), stagger(100, [animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])], { optional: true })])])
    ]
})
export class DocumentsComponent implements OnInit {
    folderName: string = '';
    subFolderName: string = '';
    selectedFolder: any = null;
    selectedFile: File | null = null;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    fileName: string = '';
    subFolders: any[] = [];
    files: any[] = [];
    isCreatingSubFolder: boolean = false;
    isUploadingFile: boolean = false;
    subFolderInputFocused: boolean = false;
    projectId: number | null = null;
    driveFolderId: string | null = null;
    folderHistory: any[] = [];

    constructor(
        private googleDriveService: GoogleDriveService,
        private route: ActivatedRoute,
        private http: HttpClient,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (!this.authService.getToken()) {
            this.router.navigate(['/login']);
            return;
        }

        this.projectId = +this.route.snapshot.paramMap.get('projectId')!;
        if (this.projectId) {
            this.loadProjectFolder();
        } else {
            this.showError('Project ID not found. Please try again.');
        }
    }

    loadProjectFolder() {
        this.http.get<any>(`http://localhost:8085/api/projets/${this.projectId}/contacts`).subscribe({
            next: (contacts) => {
                this.driveFolderId = contacts.driveFolderId;
                if (this.driveFolderId) {
                    this.selectedFolder = { id: this.driveFolderId, name: 'Project Folder' };
                    this.folderHistory = [this.selectedFolder];
                    this.loadFolderContents(this.driveFolderId);
                } else {
                    this.showError('No drive folder found for this project.');
                }
            },
            error: (error) => {
                this.showError('Failed to load project folder. Please try again.');
                console.error('Failed to load project contacts:', error);
            }
        });
    }

    loadFolderContents(folderId: string) {
        this.googleDriveService.getSubFolders(folderId).subscribe({
            next: (subFolders) => {
                this.subFolders = subFolders.map((subFolder) => ({ ...subFolder, isHovered: false }));
            },
            error: (error) => {
                this.showError(error.message);
                this.subFolders = [];
            }
        });

        this.googleDriveService.getFiles(folderId).subscribe({
            next: (files) => {
                this.files = files.map((file) => ({ ...file, isHovered: false }));
            },
            error: (error) => {
                this.showError(error.message);
                this.files = [];
            }
        });
    }

    selectFolder(folder: any) {
        this.selectedFolder = folder;
        this.folderHistory.push(folder);
        this.loadFolderContents(folder.id);
    }

    goBack() {
        if (this.folderHistory.length > 1) {
            this.folderHistory.pop();
            this.selectedFolder = this.folderHistory[this.folderHistory.length - 1];
            this.loadFolderContents(this.selectedFolder.id);
        }
    }

    createSubFolder() {
        if (!this.selectedFolder || !this.subFolderName) {
            this.showError('Please enter a subfolder name.');
            return;
        }
        this.isCreatingSubFolder = true;

        this.googleDriveService.createSubFolder(this.selectedFolder.id, this.subFolderName).subscribe({
            next: (response) => {
                console.log('Subfolder created:', response);
                this.subFolderName = '';
                this.showSuccess('Subfolder created successfully!');
                this.loadFolderContents(this.selectedFolder.id);
                this.isCreatingSubFolder = false;
            },
            error: (error) => {
                console.error('Subfolder creation error:', error);
                this.showError(error.message || 'Failed to create subfolder. Please try again.');
                this.isCreatingSubFolder = false;
            }
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.fileName = this.selectedFile?.name || '';
        }
    }

    handleFileDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files) {
            this.selectedFile = event.dataTransfer.files[0];
            this.fileName = this.selectedFile?.name || '';
        }
    }

    uploadFile() {
        if (!this.selectedFile || !this.selectedFolder) {
            this.showError('Please select a file and folder.');
            return;
        }
        this.isUploadingFile = true;

        this.googleDriveService.uploadFile(this.selectedFolder.id, this.selectedFile).subscribe({
            next: (response) => {
                console.log('File uploaded:', response);
                this.selectedFile = null;
                this.fileName = '';
                this.showSuccess('File uploaded successfully!');
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                this.loadFolderContents(this.selectedFolder.id);
                this.isUploadingFile = false;
            },
            error: (error) => {
                console.error('File upload error:', error);
                this.showError(error.message || 'Failed to upload file. Please try again.');
                this.isUploadingFile = false;
            }
        });
    }

    openFile(file: any) {
        const fileUrl = `https://drive.google.com/file/d/${file.id}/view`;
        window.open(fileUrl, '_blank');
    }

    onHover(item: any) {
        item.isHovered = true;
    }

    onLeave(item: any) {
        item.isHovered = false;
    }

    private showSuccess(message: string) {
        this.successMessage = message;
        this.errorMessage = null;
        setTimeout(() => {
            this.successMessage = null;
        }, 3000);
    }

    private showError(message: string) {
        this.errorMessage = message;
        this.successMessage = null;
        setTimeout(() => {
            this.errorMessage = null;
        }, 5000);
    }

    goBackToProjects(): void {
        // Assuming the route to AfficheProjetComponent is '/projets'
        // Adjust this path if your routing configuration is different
        this.router.navigate(['/GetProjet']);
    }
}
