import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.fetchUserRoleAndSetMenu();
    }

    private fetchUserRoleAndSetMenu(): void {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: "Aucun jeton d'authentification trouvé. Veuillez vous connecter."
            });
            this.router.navigate(['/signin']);
            return;
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        this.http.get('http://localhost:8085/users/profile', { headers }).subscribe({
            next: (response: any) => {
                const userRole = response.role;
                this.setMenuBasedOnRole(userRole);
            },
            error: (error) => {
                console.error('Échec de la récupération du profil utilisateur :', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la récupération du rôle utilisateur'
                });
                this.router.navigate(['/signin']);
            }
        });
    }

    // private getProfileMenuItem(): MenuItem {
    //     return {
    //         label: 'Profil',
    //         items: [
    //             {
    //                 label: 'Profil',
    //                 icon: 'pi pi-fw pi-user-edit', // Icône améliorée pour l'édition du profil
    //                 routerLink: ['/profile']
    //             }
    //         ]
    //     };
    // }

    private setMenuBasedOnRole(role: string): void {
        let roleMenu: MenuItem[] = [];
        switch (role) {
            case 'ENTREPRENEUR':
                roleMenu = this.getEntrepreneurMenu();
                break;
            case 'COACH':
                roleMenu = this.getCoachMenu();
                break;
            case 'INVESTOR':
                roleMenu = this.getInvestorMenu();
                break;
            case 'SUPERADMIN':
                roleMenu = this.getSuperAdminMenu();
                break;
            case 'ADMIN':
                roleMenu = this.getAdminMenu();
                break;
            default:
                console.warn('Rôle inconnu :', role);
                roleMenu = [];
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Avertissement',
                    detail: 'Rôle utilisateur inconnu détecté'
                });
        }
        this.model = [...roleMenu];
    }

    private getSuperAdminMenu(): MenuItem[] {
        return [
            {
                label: 'Accueil',
                items: [
                    { label: 'Tableau de bord', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard'] } // Icône de graphique pour le tableau de bord
                ]
            },
            {
                label: 'Demandes de coachs',
                items: [
                    { label: 'Demandes de coachs', icon: 'pi pi-fw pi-users', routerLink: ['/all-coach-requests'] } // Icône d'utilisateurs pour les demandes
                ]
            },
            {
                label: 'Utilisateurs',
                items: [
                    { label: 'Tous les utilisateurs', icon: 'pi pi-fw pi-user', routerLink: ['/all-users'] } // Icône d'utilisateur pour les utilisateurs
                ]
            },
            {
                label: 'Gérer les types',
                items: [
                    { label: 'Gérer les types', icon: 'pi pi-fw pi-tags', routerLink: ['/staff-types'] } // Icône d'étiquettes pour les types
                ]
            },
            {
                label: 'Filtrer les données du personnel',
                items: [
                    { label: 'Filtrer les données du personnel', icon: 'pi pi-fw pi-filter', routerLink: ['/staff-filter'] } // Icône de filtre conservée
                ]
            },
            {
                label: 'Gestion de programmes',
                items: [
                    { label: 'Gestion de programmes', icon: 'pi pi-fw pi-folder', routerLink: ['/ProgramMonitoring'] } // Icône de dossier pour les programmes
                ]
            },
            {
                label: 'Assigner coach',
                items: [
                    { label: 'Assignation', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/Assign-coach'] } // Icône de graphique pour le tableau de bord
                ]
            }
        ];
    }

    private getAdminMenu(): MenuItem[] {
        return [
            {
                label: 'Accueil',
                items: [
                    { label: 'Tableau de bord', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard'] } // Icône de graphique pour le tableau de bord
                ]
            },
            {
                label: 'Gestion de programmes',
                items: [
                    { label: 'Gestion de programmes', icon: 'pi pi-fw pi-folder', routerLink: ['/ProgramMonitoring'] } // Icône de dossier pour les programmes
                ]
            },
            {
                label: 'Réclamations',
                items: [
                    { label: 'Toutes les réclamations', icon: 'pi pi-fw pi-file-excel', routerLink: ['/all-reclamations'] } // Icône de fichier Excel pour les réclamations
                ]
            }, {
                label: 'Utilisateurs',
                items: [
                    { label: 'Tous les utilisateurs', icon: 'pi pi-fw pi-user', routerLink: ['/all-users'] } // Icône d'utilisateur pour les utilisateurs
                ]
            },

             {
                label: 'Demandes de coachs',
                items: [
                    { label: 'Demandes de coachs', icon: 'pi pi-fw pi-users', routerLink: ['/all-coach-requests'] } // Icône d'utilisateurs pour les demandes
                ]
            },
              {
                label: 'Assigner coach',
                items: [
                    { label: 'Assignation', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/Assign-coach'] } // Icône de graphique pour le tableau de bord
                ]
            },
            // {
            //     label: 'Documents',
            //     items: [
            //         { label: 'Documents', icon: 'pi pi-fw pi-file', routerLink: ['/documents'] } // Icône de fichier pour les documents
            //     ]
            // },
            {
                label: 'Ressources',
                items: [
                    { label: 'Toutes les ressources', icon: 'pi pi-fw pi-box', routerLink: ['/all-resourses'] } // Icône de boîte pour les ressources
                ]
            },
            {
                label: 'Clients',
                items: [
                    { label: 'Ajouter un client', icon: 'pi pi-fw pi-user-plus', routerLink: ['/customers'] } // Icône d'ajout d'utilisateur pour les clients
                ]
            },
            {
                label: 'Services',
                items: [
                    { label: 'Ajouter un service', icon: 'pi pi-fw pi-cog', routerLink: ['/services'] } // Icône d'engrenage pour les services
                ]
            },
            {
                label: 'Factures / Devis',
                items: [
                    { label: 'Générer une facture / devis', icon: 'pi pi-fw pi-money-bill', routerLink: ['/inv'] } // Icône de billet pour les factures
                ]
            }
        ];
    }

    private getEntrepreneurMenu(): MenuItem[] {
        return [
            {
                label: 'Accueil',
                items: [
                    { label: 'Tableau de bord', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard'] } // Icône de graphique pour le tableau de bord
                ]
            },
            {
                label: 'Projets',
                items: [
                    { label: 'Projets', icon: 'pi pi-fw pi-briefcase', routerLink: ['/GetProjet'] } // Icône de mallette pour les projets
                ]
            },
            {
                label: 'Gestion de la communication',
                items: [
                    { label: 'Communication', icon: 'pi pi-fw pi-comments', routerLink: ['/gestion_comm'] } // Icône de commentaires pour la communication
                ]
            },
            {
                label: 'Rendez-vous',
                items: [
                    { label: 'Rendez-vous', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/appointments'] }, // Icône de calendrier plus pour les rendez-vous
                    { label: 'Liste de mes réunions', icon: 'pi pi-fw pi-calendar', routerLink: ['/meeting-list'] } // Icône de calendrier pour les réunions
                ]
            },
            {
                label: 'Mes réclamations',
                items: [
                    { label: 'Réclamation', icon: 'pi pi-fw pi-file-excel', routerLink: ['/messagerie-reclamation'] } // Icône de fichier Excel pour les réclamations
                ]
            },
            {
                label: 'Vue startup',
                items: [
                    { label: 'Mes demandes', icon: 'pi pi-fw pi-briefcase', routerLink: ['/startup/v1'] } // Icône de mallette pour les demandes de startup
                ]
            },
            {
                label: 'Feedback',
                items: [{ label: 'Donner Feedback', icon: 'pi pi-fw pi-comment', routerLink: ['/feedback'] }]
            }
        ];
    }

    private getCoachMenu(): MenuItem[] {
        return [
            {
                label: 'Accueil',
                items: [
                    { label: 'Tableau de bord', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/Dash'] } // Icône de graphique pour le tableau de bord
                ]
            },
            {
                label: 'Rendez-vous',
                items: [
                    { label: 'Disponibilités', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/appointments/received'] } // Icône de calendrier plus pour les disponibilités
                ]
            },
            {
                label: 'Projets',
                items: [
                    { label: 'Projets', icon: 'pi pi-fw pi-briefcase', routerLink: ['/GetProjet'] } // Icône de mallette pour les projets
                ]
            },
            {
                label: 'Mes réclamations',
                items: [
                    { label: 'Réclamation', icon: 'pi pi-fw pi-file-excel', routerLink: ['/messagerie-reclamation'] } // Icône de fichier Excel pour les réclamations
                ]
            },
            {
                label: 'Gestion de la communication',
                items: [
                    { label: 'Communication', icon: 'pi pi-fw pi-comments', routerLink: ['/gestion_comm'] } // Icône de commentaires pour la communication
                ]
            },
            {
                label: 'Feedback',
                items: [{ label: 'Donner Feedback', icon: 'pi pi-fw pi-comment', routerLink: ['/feedback'] }]
            }
        ];
    }

    private getInvestorMenu(): MenuItem[] {
        return [
            {
                label: 'Accueil',
                items: [
                    { label: 'Tableau de bord', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard'] } // Icône de graphique pour le tableau de bord
                ]
            },
            {
                label: 'Marketplace',
                items: [
                    { label: 'Marketplace', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/marketplace'] } // Icône de panier pour le marketplace
                ]
            },
            {
                label: 'Startups',
                items: [
                    { label: 'Mes startups', icon: 'pi pi-fw pi-briefcase', routerLink: ['/investor/v1'] } // Icône de mallette pour les startups
                ]
            },
            // {
            //     label: 'Documents',
            //     items: [
            //         { label: 'Documents', icon: 'pi pi-fw pi-file', routerLink: ['/documents'] } // Icône de fichier pour les documents
            //     ]
            // },
            {
                label: 'Mes réclamations',
                items: [
                    { label: 'Réclamation', icon: 'pi pi-fw pi-file-excel', routerLink: ['/messagerie-reclamation'] } // Icône de fichier Excel pour les réclamations
                ]
            },
            {
                label: 'Gestion de la communication',
                items: [
                    { label: 'Communication', icon: 'pi pi-fw pi-comments', routerLink: ['/gestion_comm'] } // Icône de commentaires pour la communication
                ]
            },
        ];
    }
}
