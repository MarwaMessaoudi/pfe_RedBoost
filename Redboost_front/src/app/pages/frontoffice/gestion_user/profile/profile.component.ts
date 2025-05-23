import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/UserService';
import { ProjetService } from '../../service/projet-service.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Projet } from '../../../../models/Projet';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';

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

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    providers: [MessageService]
})
export class UserProfileComponent implements OnInit {
    user: any = {
        firstName: '',
        lastName: '',
        profile_pictureurl: '',
        role: '',
        email: '',
        phoneNumber: '',
        yearsOfExperience: 0,
        startupName: '',
        industry: '',
        bio: '',
        facebookUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        skills: '',
        expertise: '',
        investmentFocus: ''
    };
    isLoading: boolean = true;
    projetContacts: { [key: number]: ProjectContacts } = {};
    projectContactAvatars: { [projectId: number]: { [userId: number]: SafeUrl } } = {};
    isLoadingContacts: boolean = false;
    private avatarUrlCache = new Map<string, SafeUrl>();
    defaultAvatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADPSURBVHhe7dEBDQAgAMAw3/yvOQ9NswkJoQMIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAgAAQAAIAAEgAASAABAAAgAAQAALWot3pD5K6gAAAABJRU5ErkJggg==';

    isEditingName: boolean = false;
    tempFirstName: string = '';
    tempLastName: string = '';

    stats = [
        { currentValue: 0, label: 'Projects' },
        { currentValue: 0, label: 'Connections' },
        { currentValue: 0, label: 'XP Points' }
    ];

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService,
        private userService: UserService,
        private projetService: ProjetService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadStoredData();
        this.fetchUserProfile();
        this.fetchUserProjectsAndContacts();
    }

    loadStoredData(): void {
        const storedContacts = localStorage.getItem('projetContacts');
        if (storedContacts) {
            this.projetContacts = JSON.parse(storedContacts);
        }

        const storedStats = localStorage.getItem('stats');
        if (storedStats) {
            this.stats = JSON.parse(storedStats);
        }
    }

    fetchUserProfile(): void {
        this.http.get('http://localhost:8085/users/profile').subscribe({
            next: (response: any) => {
                this.user = {
                    ...this.user,
                    ...response,
                    facebookUrl: response.facebookUrl || '',
                    instagramUrl: response.instagramUrl || '',
                    linkedinUrl: response.linkedinUrl || '',
                    skills: response.skills || '',
                    expertise: response.expertise || '',
                    investmentFocus: response.investmentFocus || ''
                };
                this.userService.setUser(this.user);
                this.isLoading = false;
                if (!['ADMIN', 'SUPERADMIN'].includes(this.user.role)) {
                    this.fetchUserProjectsAndContacts();
                } else {
                    this.stats[0].currentValue = 0;
                    localStorage.setItem('stats', JSON.stringify(this.stats));
                    this.isLoading = false;
                }
            },
            error: (error) => {
                console.error('Failed to fetch user profile:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch user profile'
                });
                this.isLoading = false;
                this.router.navigate(['/signin']);
            }
        });
    }

    fetchUserProjectsAndContacts(): void {
        this.isLoadingContacts = true;

        const cachedProjects = localStorage.getItem('userProjects');
        if (cachedProjects) {
            const projects = JSON.parse(cachedProjects);
            this.updateProjectStats(projects);
            this.processProjects(projects);
        }

        this.projetService.getUserProjects().pipe(
            tap((projects: Projet[]) => {
                localStorage.setItem('userProjects', JSON.stringify(projects));
                this.updateProjectStats(projects);
                this.processProjects(projects);
            }),
            catchError(() => {
                this.isLoadingContacts = false;
                return of([]);
            })
        ).subscribe();
    }

    private updateProjectStats(projects: Projet[]): void {
        this.stats[0].currentValue = projects.length;
        this.saveProfileData();
    }

    private saveProfileData(): void {
        localStorage.setItem('profileData', JSON.stringify({
            stats: this.stats,
            contacts: this.projetContacts
        }));
    }

    private processProjects(projects: Projet[]): void {
        const contactRequests = projects.map(projet => {
            const projectId = projet.id ?? 0;
            if (!projectId) return of(null);

            return this.projetService.getProjectContacts(projectId).pipe(
                tap(contacts => {
                    this.projetContacts[projectId] = {
                        founder: contacts.founder,
                        entrepreneurs: contacts.entrepreneurs || [],
                        coaches: contacts.coaches || [],
                        investors: contacts.investors || []
                    };
                    this.saveProfileData();
                }),
                catchError(() => {
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
            this.updateConnectionsCount();
        });
    }

    updateConnectionsCount(): void {
        const uniqueConnections = new Set<number>();
        const currentUserId = this.user?.id;

        Object.values(this.projetContacts).forEach(contacts => {
            [contacts.founder, ...contacts.entrepreneurs, ...contacts.coaches, ...contacts.investors]
                .filter(user => user?.id && user.id !== currentUserId)
                .forEach(user => uniqueConnections.add(user!.id));
        });

        this.stats[1].currentValue = uniqueConnections.size;
        this.saveProfileData();
    }

    getProjectIds(): number[] {
        return Object.keys(this.projetContacts).map((id) => Number(id));
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = this.defaultAvatar;
    }

    getUserAvatar(user: User | null): SafeUrl {
        if (!user) {
            return this.defaultAvatar;
        }
        const profilePictureUrl = user.profilePictureUrl || (user as any).profile_pictureurl || (user as any).avatar;
        if (!profilePictureUrl || profilePictureUrl === 'null' || !profilePictureUrl.startsWith('http')) {
            return this.defaultAvatar;
        }
        if (this.avatarUrlCache.has(profilePictureUrl)) {
            return this.avatarUrlCache.get(profilePictureUrl)!;
        }
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(profilePictureUrl);
        this.avatarUrlCache.set(profilePictureUrl, safeUrl);
        return safeUrl;
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

    getRoleSectionTitle(role: string): string {
        switch (role) {
            case 'COACH':
                return 'Coaching Information';
            case 'ENTREPRENEUR':
                return 'Business Information';
            case 'INVESTOR':
                return 'Investment Information';
            case 'ADMIN':
            case 'SUPERADMIN':
            case 'EMPLOYEE':
                return 'Administrative Information';
            default:
                return 'Professional Information';
        }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            this.http.post('http://localhost:8085/users/upload', formData).subscribe({
                next: (response: any) => {
                    this.user.profile_pictureurl = response.imageUrl;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Profile picture updated successfully'
                    });
                },
                error: (error) => {
                    console.error('Failed to upload image:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to upload profile picture'
                    });
                }
            });
        }
    }

    startEditingName(): void {
        this.isEditingName = true;
        this.tempFirstName = this.user.firstName || '';
        this.tempLastName = this.user.lastName || '';
    }

    saveName(): void {
        if (!this.tempFirstName || !this.tempLastName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'First name and last name are required'
            });
            return;
        }

        const updatePayload = {
            firstName: this.tempFirstName,
            lastName: this.tempLastName
        };

        this.http.patch('http://localhost:8085/users/updateprofile', updatePayload).subscribe({
            next: (response: any) => {
                this.user.firstName = this.tempFirstName;
                this.user.lastName = this.tempLastName;
                this.isEditingName = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Name updated successfully'
                });
                this.userService.setUser(this.user);
            },
            error: (error) => {
                console.error('Failed to update name:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update name'
                });
            }
        });
    }

    cancelEditingName(): void {
        this.isEditingName = false;
        this.tempFirstName = '';
        this.tempLastName = '';
    }
}