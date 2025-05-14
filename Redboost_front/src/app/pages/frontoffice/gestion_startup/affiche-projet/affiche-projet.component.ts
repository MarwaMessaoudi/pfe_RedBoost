import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, of, forkJoin } from 'rxjs';
import { ProjetService } from '../../service/projet-service.service';
import { UserService } from '../../service/UserService';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Projet } from '../../../../models/Projet';
import { catchError, debounceTime, map, shareReplay, tap, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CoachListComponent } from '../rendezvous/CoachlistComponent';

interface ProjectContacts {
    founder: User | null;
    entrepreneurs: User[];
    coaches: User[];
    investors: User[];
}

interface User {
    id: number;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string | null;
}

interface PendingInvitation {
    projectId: number;
    projectName: string;
    invitorEmail: string;
    invitorName: string;
}

@Component({
    selector: 'app-affiche-projet',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        RouterModule,
        MatTooltipModule,
        MatTabsModule,
        CoachListComponent // Note: This must be standalone or imported via NgModule
    ],
    templateUrl: './affiche-projet.component.html',
    styleUrls: ['./affiche-projet.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AfficheProjetComponent implements OnInit, OnDestroy {
    projets$!: Observable<Projet[]>;
    filteredProjets$!: Observable<Projet[]>;
    searchTerm: string = '';
    selectedSector: string = '';
    selectedLocation: string = '';
    sortField: string = 'creationDate';
    sortAscending: boolean = true;
    uniqueSectors: string[] = [];
    uniqueLocations: string[] = [];
    currentUserId: number | null = null;
    currentUserRole: string | null = null;
    pendingInvitations: PendingInvitation[] = [];
    projetContacts: { [key: number]: ProjectContacts } = {};
    projectContactAvatars: { [projectId: number]: { [userId: number]: SafeUrl } } = {};
    isLoadingContacts: boolean = false;
    private searchSubject = new Subject<string>();
    imageErrorCount: { [key: string]: number } = {};
    imageLoadStatus: { [key: string]: 'loaded' | 'failed' | 'loading' } = {};
    avatarErrorCount: { [key: string]: number } = {};
    private avatarUrlCache = new Map<string, SafeUrl>();
    defaultImage = '/assets/images/default-logo.png';
    defaultAvatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADPSURBVHhe7dEBDQAgAMAw3/yvOQ9NswkJoQMIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAgAAQAAIAAEgAASAABAAAgAAQAALWot3pD5K6gAAAABJRU5ErkJggg==';
    baseUrl = 'http://localhost:8085';

    constructor(
        private projetService: ProjetService,
        private userService: UserService,
        private sanitizer: DomSanitizer,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.setupSearchDebounce();
        this.loadCurrentUser();
    }

    ngOnDestroy() {
        this.searchSubject.unsubscribe();
        this.avatarUrlCache.clear();
    }

    setupSearchDebounce() {
        this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
            this.applyFilters();
            this.cdr.markForCheck();
        });
    }

    loadCurrentUser() {
        this.projetService
            .fetchCurrentUserId()
            .pipe(
                switchMap((userId) => {
                    this.currentUserId = userId;
                    return this.userService.getUserById(userId);
                })
            )
            .subscribe({
                next: (user) => {
                    this.currentUserRole = user?.role?.toLowerCase() || null;
                    if (this.currentUserRole === 'coach') {
                        this.loadCoachProjects();
                    } else {
                        this.loadEntrepreneurProjects();
                        this.loadPendingInvitations();
                    }
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading user:', error.message);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur!',
                        text: "Impossible de charger les informations de l'utilisateur. Veuillez vous reconnecter."
                    });
                    this.router.navigate(['/login']);
                }
            });
    }

    loadEntrepreneurProjects() {
        this.projets$ = this.projetService.getUserProjects().pipe(
            map((projets: Projet[]) => {
                return projets.map((projet, index) => {
                    if (!projet.id) projet.id = index + 1;
                    return projet;
                });
            }),
            catchError((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: 'Échec du chargement des projets.'
                });
                return of([]);
            }),
            shareReplay(1)
        );

        this.projets$.subscribe({
            next: (projets) => {
                this.uniqueSectors = [...new Set(projets.map((p) => p.sector).filter(Boolean))];
                this.uniqueLocations = [...new Set(projets.map((p) => p.location).filter(Boolean))];
                this.applyFilters();
                this.loadProjectContacts(projets);
                this.cdr.markForCheck();
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: 'Échec du chargement des projets.'
                });
            }
        });
    }

    loadCoachProjects() {
        if (!this.currentUserId) return;
        this.projets$ = this.projetService.getCoachProjects(this.currentUserId).pipe(
            map((projets: Projet[]) => {
                return projets.map((projet, index) => {
                    if (!projet.id) projet.id = index + 1;
                    return projet;
                });
            }),
            catchError((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: 'Échec du chargement des projets.'
                });
                return of([]);
            }),
            shareReplay(1)
        );

        this.projets$.subscribe({
            next: (projets) => {
                this.uniqueSectors = [...new Set(projets.map((p) => p.sector).filter(Boolean))];
                this.uniqueLocations = [...new Set(projets.map((p) => p.location).filter(Boolean))];
                this.applyFilters();
                this.loadProjectContacts(projets);
                this.cdr.markForCheck();
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: 'Échec du chargement des projets.'
                });
            }
        });
    }

    loadProjectContacts(projets: Projet[]) {
        this.isLoadingContacts = true;
        this.avatarErrorCount = {};
        const contactRequests = projets.map((projet) => {
            const projectId = projet.id ?? 0;
            if (!projectId) {
                return of(null);
            }
            this.projectContactAvatars[projectId] = {};
            return this.projetService.getProjectContacts(projectId).pipe(
                tap((contacts) => {
                    const projectContacts: ProjectContacts = {
                        founder: contacts.founder,
                        entrepreneurs: contacts.entrepreneurs || [],
                        coaches: contacts.coaches || [],
                        investors: contacts.investors || []
                    };
                    const userIds: number[] = [];
                    if (projectContacts.founder?.id) userIds.push(projectContacts.founder.id);
                    projectContacts.entrepreneurs.forEach((user) => user.id && userIds.push(user.id));
                    projectContacts.coaches.forEach((user) => user.id && userIds.push(user.id));
                    projectContacts.investors.forEach((user) => user.id && userIds.push(user.id));

                    if (userIds.length > 0) {
                        forkJoin(
                            userIds.map((id) =>
                                this.userService.getUserById(id).pipe(
                                    catchError((err) => {
                                        console.error(`Failed to load profile for user ${id}:`, err);
                                        return of(null);
                                    })
                                )
                            )
                        ).subscribe((profiles) => {
                            const profileMap = new Map<number, User>();
                            profiles.forEach((profile, index) => {
                                if (profile && profile.id) {
                                    const normalizedProfile = {
                                        ...profile,
                                        profilePictureUrl: profile.profilePictureUrl || (profile as any).profile_pictureurl || (profile as any).avatar
                                    };
                                    profileMap.set(userIds[index], normalizedProfile);
                                }
                            });

                            if (projectContacts.founder?.id) {
                                const profile = profileMap.get(projectContacts.founder.id);
                                if (profile) {
                                    projectContacts.founder = {
                                        ...projectContacts.founder,
                                        profilePictureUrl: profile.profilePictureUrl || projectContacts.founder.profilePictureUrl
                                    };
                                    this.projectContactAvatars[projectId][projectContacts.founder.id] = this.getUserAvatar(projectContacts.founder);
                                }
                            }

                            projectContacts.entrepreneurs = projectContacts.entrepreneurs.map((user) => {
                                const profile = user.id ? profileMap.get(user.id) : null;
                                if (profile && user.id) {
                                    const updatedUser = { ...user, profilePictureUrl: profile.profilePictureUrl || user.profilePictureUrl };
                                    this.projectContactAvatars[projectId][user.id] = this.getUserAvatar(updatedUser);
                                    return updatedUser;
                                }
                                return user;
                            });

                            projectContacts.coaches = projectContacts.coaches.map((user) => {
                                const profile = user.id ? profileMap.get(user.id) : null;
                                if (profile && user.id) {
                                    const updatedUser = { ...user, profilePictureUrl: profile.profilePictureUrl || user.profilePictureUrl };
                                    this.projectContactAvatars[projectId][user.id] = this.getUserAvatar(updatedUser);
                                    return updatedUser;
                                }
                                return user;
                            });

                            projectContacts.investors = projectContacts.investors.map((user) => {
                                const profile = user.id ? profileMap.get(user.id) : null;
                                if (profile && user.id) {
                                    const updatedUser = { ...user, profilePictureUrl: profile.profilePictureUrl || user.profilePictureUrl };
                                    this.projectContactAvatars[projectId][user.id] = this.getUserAvatar(updatedUser);
                                    return updatedUser;
                                }
                                return user;
                            });

                            this.projetContacts[projectId] = projectContacts;
                        });
                    } else {
                        this.projetContacts[projectId] = projectContacts;
                    }
                }),
                catchError((error) => {
                    console.error(`Failed to load contacts for project ${projectId}:`, error);
                    this.projetContacts[projectId] = {
                        founder: null,
                        entrepreneurs: [],
                        coaches: [],
                        investors: []
                    };
                    return of(null);
                })
            );
        });

        forkJoin(contactRequests).subscribe(() => {
            this.isLoadingContacts = false;
            this.cdr.detectChanges();
        });
    }

    loadPendingInvitations() {
        if (this.currentUserRole !== 'entrepreneur') return;
        this.projetService.getPendingInvitations().subscribe({
            next: (invitations) => {
                this.pendingInvitations = invitations;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.pendingInvitations = [];
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: error.message || 'Impossible de charger les invitations en attente.'
                });
                this.cdr.markForCheck();
            }
        });
    }

    navigateToPhases(projectId: number | undefined) {
        if (!projectId) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'ID du projet non défini.'
            });
            return;
        }
        this.router.navigate(['/phases'], { queryParams: { projectId } });
    }

    navigateToCreateProject() {
        this.router.navigate(['/addprojet']);
    }

    navigateToDocuments(projectId: number | undefined) {
        if (!projectId || projectId === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'ID du projet non défini.'
            });
            return;
        }
        this.router.navigate([`/projects/${projectId}/documents`]);
    }

    applyFilters() {
        this.filteredProjets$ = this.projets$.pipe(
            debounceTime(100),
            map((projets) =>
                projets
                    .filter((projet) => {
                        const matchesSearch =
                            !this.searchTerm ||
                            projet.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            projet.sector.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            projet.location.toLowerCase().includes(this.searchTerm.toLowerCase());
                        const matchesSector = !this.selectedSector || projet.sector === this.selectedSector;
                        const matchesLocation = !this.selectedLocation || projet.location === this.selectedLocation;
                        return matchesSearch && matchesSector && matchesLocation;
                    })
                    .sort((a, b) => {
                        const aValue = this.sortField === 'creationDate' ? a.creationDate || '' : a.globalScore || 0;
                        const bValue = this.sortField === 'creationDate' ? b.creationDate || '' : b.globalScore || 0;
                        return this.sortAscending ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
                    })
            ),
            tap(() => setTimeout(() => this.cdr.markForCheck(), 0))
        );
    }

    onSearchChange() {
        this.searchSubject.next(this.searchTerm);
    }

    onSectorChange() {
        this.applyFilters();
    }

    onLocationChange() {
        this.applyFilters();
    }

    onSortFieldChange() {
        this.applyFilters();
    }

    toggleSortDirection() {
        this.sortAscending = !this.sortAscending;
        this.applyFilters();
    }

    sanitizedImageUrl(url: string | null | undefined): SafeUrl {
        if (!url || url === 'null' || url.trim() === '' || this.imageLoadStatus[url] === 'failed') {
            return this.defaultImage;
        }
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}/Uploads${url}`;
        this.imageLoadStatus[fullUrl] = 'loading';
        return this.sanitizer.bypassSecurityTrustUrl(fullUrl);
    }

    getUserAvatar(user: User | null): SafeUrl {
        if (!user) {
            console.warn(`No user provided for avatar`);
            return this.defaultAvatar;
        }
        const profilePictureUrl = user.profilePictureUrl || (user as any).profile_pictureurl || (user as any).avatar;
        if (!profilePictureUrl || profilePictureUrl === 'null' || !profilePictureUrl.startsWith('http') || this.avatarErrorCount[profilePictureUrl]) {
            console.warn(`Invalid or missing profilePictureUrl for user ${user.id} (role: ${user.role}): ${profilePictureUrl || 'null/undefined'}`);
            return this.defaultAvatar;
        }
        if (this.avatarUrlCache.has(profilePictureUrl)) {
            return this.avatarUrlCache.get(profilePictureUrl)!;
        }
        console.debug(`Loading avatar for user ${user.id} (role: ${user.role}): ${profilePictureUrl}`);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(profilePictureUrl);
        this.avatarUrlCache.set(profilePictureUrl, safeUrl);
        return safeUrl;
    }

    onImageError(event: Event) {
        const img = event.target as HTMLImageElement;
        const src = img.getAttribute('data-original-url') || img.src;
        if (this.imageErrorCount[src]) {
            return;
        }
        this.imageErrorCount[src] = 1;
        this.imageLoadStatus[src] = 'failed';
        img.src = this.defaultImage;
        img.onerror = null;
        console.warn(`Project logo load failed for ${src}, using default: ${this.defaultImage}`);
    }

    onAvatarError(event: Event) {
        const img = event.target as HTMLImageElement;
        const src = img.src;
        if (this.avatarErrorCount[src]) {
            return;
        }
        this.avatarErrorCount[src] = 1;
        img.src = this.defaultAvatar;
        img.onerror = null;
        console.warn(`Avatar load failed for ${src}, using default: ${this.defaultAvatar}`);
    }

    onImageLoad(logoUrl: string) {
        this.imageLoadStatus[logoUrl] = 'loaded';
        this.cdr.markForCheck();
    }

    deleteProjet(projectId: number | undefined) {
        if (!projectId || this.currentUserRole !== 'entrepreneur') return;
        Swal.fire({
            title: 'Êtes-vous sûr?',
            text: 'Vous ne pourrez pas revenir en arrière!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer!',
            cancelButtonText: 'Non, annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.projetService.deleteProjet(projectId).subscribe({
                    next: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Supprimé!',
                            text: 'Le projet a été supprimé.'
                        });
                        this.loadEntrepreneurProjects();
                    },
                    error: (error) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur!',
                            text: error.message || 'Échec de la suppression.'
                        });
                    }
                });
            }
        });
    }

    acceptInvitation(projetId: number | undefined) {
        if (!projetId || projetId === 0 || !this.currentUserId || this.currentUserRole !== 'entrepreneur') {
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'ID du projet ou utilisateur non valide.'
            });
            return;
        }
        this.projetService.acceptInvitation(projetId, this.currentUserId).subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Succès!',
                    text: 'Invitation acceptée avec succès!'
                });
                this.loadPendingInvitations();
                this.loadEntrepreneurProjects();
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: error.message || "Échec de l'acceptation de l'invitation."
                });
            }
        });
    }

    declineInvitation(projetId: number | undefined) {
        if (!projetId || projetId === 0 || !this.currentUserId || this.currentUserRole !== 'entrepreneur') {
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'ID du projet ou utilisateur non valide.'
            });
            return;
        }
        this.projetService.declineInvitation(projetId, this.currentUserId).subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Succès!',
                    text: 'Invitation refusée avec succès!'
                });
                this.loadPendingInvitations();
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: error.message || "Échec du refus de l'invitation."
                });
            }
        });
    }

    inviteUser(projetId: number | undefined) {
        if (!projetId || this.currentUserRole !== 'entrepreneur') {
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'ID du projet non défini ou action non autorisée.'
            });
            return;
        }
        this.projetService.getEligibleCollaborators(projetId).subscribe({
            next: (users) => {
                if (users.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Info',
                        text: 'Aucun collaborateur éligible trouvé.'
                    });
                    return;
                }
                const userOptions = users.map((user) => ({
                    value: user.id,
                    text: `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim()
                }));
                Swal.fire({
                    title: 'Inviter un Collaborateur',
                    html: `
                        <select id="userSelect" class="swal-custom-select">
                            <option value="">Sélectionnez un utilisateur</option>
                            ${userOptions.map((option) => `<option value="${option.value}">${option.text}</option>`).join('')}
                        </select>
                    `,
                    showCancelButton: true,
                    confirmButtonText: "Envoyer l'invitation",
                    cancelButtonText: 'Annuler',
                    preConfirm: () => {
                        const selectedUserId = (document.getElementById('userSelect') as HTMLSelectElement).value;
                        if (!selectedUserId) {
                            Swal.showValidationMessage('Veuillez sélectionner un utilisateur.');
                            return false;
                        }
                        return parseInt(selectedUserId, 10);
                    }
                }).then((result) => {
                    if (result.isConfirmed && result.value) {
                        this.projetService.inviteCollaborator(projetId, result.value).subscribe({
                            next: () => {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Succès!',
                                    text: 'Invitation envoyée avec succès!'
                                });
                                this.loadEntrepreneurProjects();
                                this.loadPendingInvitations();
                            },
                            error: (error) => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur!',
                                    text: error.message || "Échec de l'envoi de l'invitation."
                                });
                            }
                        });
                    }
                });
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur!',
                    text: error.message || 'Impossible de charger les collaborateurs éligibles.'
                });
            }
        });
    }

    getCardColorClass(index: number): string {
        return index % 2 === 0 ? 'card-red-border' : 'card-blue-border';
    }

    getUserName(user: User | null): string {
        if (!user) return 'N/A';
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
    }

    groupUsersByEmail(contacts: ProjectContacts): { users: User[]; roles: string[] }[] {
        const userMap = new Map<string, { users: User[]; roles: string[] }>();

        const addUserToMap = (user: User, role: string) => {
            if (!user || !user.email) return;
            const email = user.email;
            if (!userMap.has(email)) {
                userMap.set(email, { users: [user], roles: [role] });
            } else {
                const entry = userMap.get(email)!;
                if (!entry.roles.includes(role)) {
                    entry.roles.push(role);
                }
            }
        };

        if (contacts.founder) {
            addUserToMap(contacts.founder, 'Fondateur');
        }

        contacts.entrepreneurs?.forEach((user) => addUserToMap(user, 'Entrepreneur'));
        contacts.coaches?.forEach((user) => addUserToMap(user, 'Coach'));
        contacts.investors?.forEach((user) => addUserToMap(user, 'Investisseur'));

        return Array.from(userMap.values());
    }

    trackByUserGroup(index: number, userGroup: { users: User[]; roles: string[] }): string {
        return userGroup.users[0]?.id?.toString() || index.toString();
    }
}
