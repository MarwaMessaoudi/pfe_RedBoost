import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Importation des décorateurs et services Angular
import { CommonModule } from '@angular/common'; // Module pour les directives de base comme *ngIf
import { FormsModule } from '@angular/forms'; // Module pour les formulaires (ngModel)
import { CoachService } from '../coach.service'; // Service pour récupérer les données des coachs
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component'; // Composant pour afficher la liste des rendez-vous
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Service pour ouvrir des modals Bootstrap
import { CreateAppointmentModalComponent } from '../Formulaire/simple-appointment-modal.component'; // Composant du modal pour créer un rendez-vous
import { Router } from '@angular/router'; // Service pour la navigation
import { NgxPaginationModule } from 'ngx-pagination'; // Module pour la pagination
import { UserService } from '../../service/UserService'; // Service pour récupérer les informations des utilisateurs

// Interface définissant la structure d'un coach
interface Coach {
    id: number;
    name: string;
    specialty: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    status?: string; // Optionnel
    profile_pictureurl?: string; // Optionnel
    firstName?: string; // Optionnel
    lastName?: string; // Optionnel
}

@Component({
    selector: 'app-appointments-appointment-list', // Sélecteur pour utiliser ce composant dans d'autres templates
    standalone: true, // Indique que le composant est autonome
    imports: [CommonModule, FormsModule, AppointmentsListComponent, NgxPaginationModule], // Modules importés pour ce composant
    templateUrl: './Coach-list.component.html', // Chemin du template HTML
    styleUrls: ['./Coach-list.component.scss'] // Chemin des styles SCSS
})
export class AppointmentListComponent implements OnInit, OnDestroy {
    coaches: Coach[] = []; // Liste complète des coachs récupérés depuis le service
    filteredCoaches: Coach[] = []; // Liste filtrée des coachs (après recherche ou filtre)
    searchTerm: string = ''; // Terme de recherche saisi par l'utilisateur
    selectedSpecialization: string = ''; // Spécialité sélectionnée pour le filtre
    specializations: string[] = []; // Liste unique des spécialités disponibles

    page: number = 1; // Page actuelle de la pagination
    itemsPerPage: number = 4; // Nombre d'éléments par page
    totalPages: number = 0; // Nombre total de pages calculé

    constructor(
        private coachService: CoachService, // Injection du service pour les coachs
        private modalService: NgbModal, // Injection du service pour les modals
        private router: Router, // Injection du service de navigation
        private userService: UserService, // Injection du service pour les utilisateurs
        private cdr: ChangeDetectorRef // Injection pour détecter les changements manuellement
    ) {}

    ngOnInit() {
        // Méthode appelée au chargement initial du composant
        this.loadCoaches(); // Charge les données des coachs
    }

    loadCoaches() {
        // Récupère la liste des coachs via le service
        this.coachService.getCoaches().subscribe({
            next: (data) => {
                // Une fois les données reçues, récupère les avatars pour chaque coach
                Promise.all(data.map((coach) => this.fetchCoachWithAvatar(coach))).then((coaches) => {
                    this.coaches = coaches; // Stocke les coachs avec leurs avatars
                    this.filteredCoaches = [...this.coaches]; // Initialise la liste filtrée
                    this.specializations = [...new Set(this.coaches.map((coach) => coach.specialization))]; // Extrait les spécialités uniques
                    this.calculateTotalPages(); // Calcule le nombre total de pages
                    this.cdr.detectChanges(); // Détecte les changements pour mettre à jour la vue
                });
            }
        });
    }

    private async fetchCoachWithAvatar(coach: any): Promise<Coach> {
        // Récupère les informations du coach avec son avatar
        return new Promise((resolve) => {
            this.userService.getUserById(coach.id).subscribe({
                next: (user) => {
                    // Construit l'objet coach avec les données de l'utilisateur
                    const coachData: Coach = {
                        id: coach.id,
                        name: `${coach.firstName} ${coach.lastName}`, // Combine prénom et nom
                        firstName: coach.firstName,
                        lastName: coach.lastName,
                        specialty: coach.specialization || 'Non spécifié', // Valeur par défaut
                        specialization: coach.specialization || 'Non spécifié',
                        email: coach.email,
                        phoneNumber: coach.phoneNumber,
                        status: coach.status || 'active', // Valeur par défaut
                        profile_pictureurl: user?.profile_pictureurl // URL de l'avatar si disponible
                    };
                    resolve(coachData); // Résout la promesse avec les données
                },
           
            });
        });
    }

    getFirstLetter(name: string): string {
        // Retourne la première lettre du nom en majuscule pour l'avatar textuel
        return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'N/A';
    }

    handleImageError(coach: Coach): void {
        // Gère l'erreur de chargement d'image en supprimant l'URL pour afficher l'avatar textuel
        coach.profile_pictureurl = undefined;
    }

    isCoachActive(coach: Coach): boolean {
        // Vérifie si le statut du coach est "active"
        return coach.status === 'active';
    }

    filterCoaches() {
        // Filtre les coachs selon la spécialité et le terme de recherche
        let tempCoaches = [...this.coaches];

        if (this.selectedSpecialization) {
            // Filtre par spécialité si une valeur est sélectionnée
            tempCoaches = tempCoaches.filter((coach) => 
                coach.specialization.toLowerCase() === this.selectedSpecialization.toLowerCase()
            );
        }

        if (this.searchTerm) {
            // Filtre par recherche (nom ou spécialité)
            const searchTermLower = this.searchTerm.toLowerCase();
            tempCoaches = tempCoaches.filter((coach) => 
                (coach.name || '').toLowerCase().includes(searchTermLower) || 
                (coach.specialization || '').toLowerCase().includes(searchTermLower)
            );
        }

        this.filteredCoaches = tempCoaches; // Met à jour la liste filtrée
        this.calculateTotalPages(); // Recalcule les pages
        this.page = 1; // Réinitialise à la première page
    }

    calculateTotalPages() {
        // Calcule le nombre total de pages en fonction du nombre d'éléments filtrés
        this.totalPages = Math.ceil(this.filteredCoaches.length / this.itemsPerPage);
    }

    prevPage() {
        // Passe à la page précédente si possible
        if (this.page > 1) {
            this.page--;
        }
    }

    nextPage() {
        // Passe à la page suivante si possible
        if (this.page < this.totalPages) {
            this.page++;
        }
    }

    goToPage(pageNumber: number) {
        // Va à une page spécifique si le numéro est valide
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            this.page = pageNumber;
        }
    }

    getPageNumbers(): number[] {
        // Génère un tableau des numéros de page pour la pagination
        const pageNumbers: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    }

    discoverCoach(coach: Coach) {
        // Navigue vers la page de profil du coach sélectionné
        this.router.navigate(['/profile', coach.id]);
    }

    reserveCoach(coach: Coach) {
        // Ouvre un modal pour réserver un rendez-vous avec le coach
        const modalRef = this.modalService.open(CreateAppointmentModalComponent, {
            centered: true, // Centre le modal
            size: 'sm', // Taille petite
            backdrop: true, // Fond sombre
            keyboard: true // Fermeture avec la touche Échap
        });

        // Passe les données du coach au modal
        modalRef.componentInstance.coachId = coach.id;
        modalRef.componentInstance.coachName = `${coach.firstName} ${coach.lastName}`;
        modalRef.componentInstance.coachSpecialization = coach.specialization;
    }

    ngOnDestroy() {
        // Nettoie les données lors de la destruction du composant
        this.coaches = [];
        this.filteredCoaches = [];
    }
}