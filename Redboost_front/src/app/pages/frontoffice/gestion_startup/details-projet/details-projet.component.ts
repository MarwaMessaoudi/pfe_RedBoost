import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProjetService } from '../../service/projet-service.service';
import { Objectives, Projet, Statut } from '../../../../models/Projet';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface ProductService {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-details-projet',
    standalone: true,
    templateUrl: './details-projet.component.html',
    styleUrls: ['./details-projet.component.scss'],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        CalendarModule,
        MessagesModule,
        ProgressSpinnerModule
    ]
})
export class DetailsProjetComponent implements OnInit {
    projet: Projet | null = null;
    editProjet: Projet | null = null;
    isEditing: boolean = false;
    isSaving: boolean = false;
    updateMessage: string = '';
    logoFile: File | null = null;
    objectives = Object.values(Objectives);
    statuses = Object.values(Statut);
    hoveredItem: number | null = null;
    currentSlide: number = 0;
    totalSlides: number = 3;

    @ViewChild('carouselTrack') carouselTrack!: ElementRef;

    productServices: ProductService[] = [
        {
            id: 1,
            title: 'Products',
            description: 'Explore our curated marketplace of innovative products.',
            icon: 'shopping_cart',
            color: '#245C67'
        },
        {
            id: 2,
            title: 'Services',
            description: 'Find expert services tailored to your needs.',
            icon: 'build',
            color: '#DB1E37'
        }
    ];

    constructor(
        private projetService: ProjetService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = parseInt(idParam, 10);
            if (!isNaN(id)) {
                this.loadProject(id);
            } else {
                console.error('Invalid project ID:', idParam);
                this.updateMessage = 'ID de projet invalide.';
                this.router.navigate(['/affiche-projet']);
            }
        } else {
            console.error('No project ID provided in URL');
            this.updateMessage = 'Aucun ID de projet fourni.';
            this.router.navigate(['/affiche-projet']);
        }
    }

    loadProject(id: number): void {
        this.projetService.getProjetById(id).subscribe({
            next: (data: Projet) => {
                if (data) {
                    this.projet = { ...data };
                    console.log('Project loaded successfully:', this.projet);
                } else {
                    console.warn('No project found for ID:', id);
                    this.updateMessage = 'Aucun projet trouvé.';
                    this.router.navigate(['/affiche-projet']);
                }
            },
            error: (error: any) => {
                console.error('Error loading project:', error);
                this.updateMessage = 'Erreur lors du chargement du projet.';
                setTimeout(() => this.router.navigate(['/affiche-projet']), 2000);
            }
        });
    }

    sanitizedImageUrl(url: string | undefined): SafeUrl {
        if (!url || url === 'null' || url === '') {
            return this.sanitizer.bypassSecurityTrustUrl('/assets/default-logo.png');
        }
        const baseUrl = 'http://localhost:8085';
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        return this.sanitizer.bypassSecurityTrustUrl(fullUrl);
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = '/assets/default-logo.png';
        img.onerror = null;
    }

    openEditPopup(): void {
        if (this.projet) {
            this.editProjet = { ...this.projet };
            this.isEditing = true;
            this.updateMessage = '';
            this.logoFile = null;
        }
    }

    closeEditPopup(): void {
        this.isEditing = false;
        this.editProjet = null;
        this.updateMessage = '';
        this.logoFile = null;
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.logoFile = input.files[0];
            console.log('Logo file selected:', this.logoFile.name);
        }
    }

    saveChanges(): void {
        if (!this.editProjet || !this.projet?.id) {
            this.updateMessage = 'Aucun projet à sauvegarder.';
            return;
        }

        this.isSaving = true;
        this.updateMessage = '';

        const updatedProjet = new Projet(
            this.editProjet.name,
            this.editProjet.sector,
            this.editProjet.type,
            this.editProjet.creationDate,
            this.editProjet.description,
            this.editProjet.objectives,
            this.editProjet.status,
            this.editProjet.globalScore,
            this.editProjet.location,
            this.editProjet.logoUrl,
            this.editProjet.websiteUrl,
            this.editProjet.revenue,
            this.editProjet.numberOfEmployees,
            this.editProjet.nbFemaleEmployees,
            this.editProjet.lastUpdated,
            this.editProjet.associatedSectors,
            this.editProjet.technologiesUsed,
            this.editProjet.fundingGoal,
            this.editProjet.lastEvaluationDate
        );

        this.projetService.updateProjet(this.projet.id, updatedProjet, this.logoFile).subscribe({
            next: (response: Projet) => {
                this.isSaving = false;
                this.isEditing = false;
                this.logoFile = null;
                this.projet = { ...response };
                this.editProjet = null;
                this.updateMessage = 'Projet mis à jour avec succès !';
                setTimeout(() => {
                    this.updateMessage = '';
                }, 3000);
            },
            error: (error: any) => {
                this.isSaving = false;
                console.error('Error updating project:', error);
                this.updateMessage = 'Erreur lors de la mise à jour du projet.';
                setTimeout(() => {
                    this.updateMessage = '';
                }, 3000);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/affiche-projet']);
    }

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }

    prevSlide(): void {
        if (this.currentSlide > 0) {
            this.currentSlide--;
        } else {
            this.currentSlide = this.totalSlides - 1;
        }
        this.updateCarousel();
    }

    nextSlide(): void {
        if (this.currentSlide < this.totalSlides - 1) {
            this.currentSlide++;
        } else {
            this.currentSlide = 0;
        }
        this.updateCarousel();
    }

    goToSlide(index: number): void {
        if (index >= 0 && index < this.totalSlides) {
            this.currentSlide = index;
            this.updateCarousel();
        }
    }

    updateCarousel(): void {
        const track = this.carouselTrack.nativeElement;
        const slideWidth = track.querySelector('.carousel-slide').offsetWidth;
        track.style.transform = `translateX(-${this.currentSlide * slideWidth}px)`;
    }
}