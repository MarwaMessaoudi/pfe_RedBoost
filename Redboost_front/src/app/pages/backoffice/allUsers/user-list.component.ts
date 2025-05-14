import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SignupModalComponent } from './RegistrationComponent';
import { ModifierComponent } from './ModifierComponent';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {
    users: any[] = [];
    isSubmitting: boolean = false;
    selectedRole: string = 'TOUS'; // Default to "TOUS" (ALL)
    roles: string[] = ['TOUS', 'COACH', 'ENTREPRENEUR', 'ADMIN', 'INVESTOR', 'SUPERADMIN']; // Available roles for filtering
    private apiUrl = 'http://localhost:8085/users'; // Backend API URL

    constructor(
        private http: HttpClient, // Use HttpClient directly
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }
    loadUsers(): void {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('No auth token found. Please log in.');
            return;
        }

        const roleParam = this.selectedRole === 'TOUS' ? null : this.selectedRole;
        const url = roleParam ? `${this.apiUrl}?role=${roleParam}` : this.apiUrl;

        const headers = {
            Authorization: `Bearer ${token}`
        };

        this.http.get<any[]>(url, { headers }).subscribe({
            next: (data) => {
                this.users = data.map((user) => ({
                    id: user.id,
                    firstName: user.firstName || user.first_name,
                    lastName: user.lastName || user.last_name,
                    role: user.role,
                    phoneNumber: user.phoneNumber || user.phone_number,
                    email: user.email
                }));
            },
            error: (error) => {
                console.error('Erreur lors du chargement des utilisateurs:', error);
            }
        });
    }

    // Handle role filter change
    onRoleFilterChange(role: string): void {
        this.selectedRole = role;
        this.loadUsers();
    }

    deleteUser(id: number): void {
        if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
            };

            this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).subscribe({
                next: () => {
                    console.log(`Utilisateur ${id} supprimé avec succès`);
                    this.loadUsers();
                },
                error: (error) => {
                    console.error('Erreur lors de la suppression:', {
                        status: error.status,
                        statusText: error.statusText,
                        message: error.message,
                        error: error.error,
                        url: error.url
                    });
                }
            });
        }
    }

    showEditUserDialog(user: any): void {
        const modalRef = this.modalService.open(ModifierComponent, { size: 'lg' });
        modalRef.componentInstance.user = user;
        modalRef.result.then(
            (result) => {
                if (result === 'updated') {
                    this.loadUsers();
                }
            },
            (reason) => {
                console.log('Modal dismissed:', reason);
            }
        );
    }

    showCreateUserDialog(): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const modalRef = this.modalService.open(SignupModalComponent, {
            centered: true,
            size: 'sm',
            backdrop: true,
            keyboard: true
        });

        modalRef.result
            .then((result) => {
                if (result?.success) {
                    this.loadUsers(); // Recharge la liste des utilisateurs si l'inscription a réussi
                }
            })
            .catch((error) => {
                // Ignorer les erreurs si la modale est juste fermée sans action
                console.log('Modal dismissed:', error);
            })
            .finally(() => {
                this.isSubmitting = false;
            });
    }
}
