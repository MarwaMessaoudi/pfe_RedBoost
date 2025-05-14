import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceP, Pack } from '../../../../../models/ServiceP';
import { ServicePService } from '../service-p.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-show-service-p',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './show-service-p.component.html',
    styleUrls: ['./show-service-p.component.scss']
})
export class ShowServicePComponent implements OnInit {
    packs: Pack[] = [];
    newService: ServiceP & { subServicesInput?: string } = this.resetService();
    editService: ServiceP & { subServicesInput?: string } = this.resetService();
    showAddModal = false;
    showEditModal = false;
    selectedPack: Pack | null = null;
    errorMessage = '';
    successMessage = '';
    projetId: number = 0;
    isLoading = false;
    hasService: { [key: string]: boolean } = {};

    constructor(
        private servicePService: ServicePService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.packs = [
            new Pack('Free', 'Basic plan for starters', [], 0, false),
            new Pack('Premium', 'Advanced plan for professionals', [], 49, false),
            new Pack('Gold', 'Best plan for enterprises', [], 99, true)
        ];

        this.packs.forEach(pack => {
            this.hasService[pack.name] = false;
        });

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            this.projetId = id ? Number(id) : 0;

            if (this.projetId <= 0) {
                this.errorMessage = 'Invalid project ID. Please ensure you are accessing a valid project.';
                this.router.navigate(['/affiche-projet']);
                return;
            }

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                this.errorMessage = 'Please log in to view services.';
                this.router.navigate(['/signin']);
                return;
            }

            this.loadServices();
        });
    }

    loadServices(): void {
        this.isLoading = true;
        this.servicePService.getServicesByProjetId(this.projetId).subscribe({
            next: (services: ServiceP[]) => {
                this.packs.forEach((pack) => (pack.services = []));
                services.forEach((service) => {
                    const pack = this.packs.find((p) => p.name.toLowerCase() === service.typeservice?.toLowerCase());
                    if (pack) {
                        pack.services = [service];
                        this.hasService[pack.name] = true;
                    }
                });
                this.isLoading = false;
                if (services.length === 0) {
                    this.successMessage = 'No services found for this project. You can add one to each pack.';
                }
            },
            error: (err: any) => {
                this.handleError('Failed to load services', err);
                this.isLoading = false;
                if (err.status === 401 || err.message.includes('Authentication required')) {
                    this.errorMessage = 'Session expired. Please log in again.';
                    this.router.navigate(['/signin']);
                } else if (err.status === 404 || err.message.includes('Projet not found')) {
                    this.errorMessage = 'Project not found or no services available.';
                    this.router.navigate(['/affiche-projet']);
                } else {
                    this.errorMessage = 'An unexpected error occurred while loading services.';
                }
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    openAddModalForPack(pack: Pack): void {
        if (this.projetId <= 0) {
            this.errorMessage = 'Cannot add service: Invalid project ID';
            return;
        }
        if (this.hasService[pack.name]) {
            this.errorMessage = `A service already exists for the ${pack.name} pack. You can edit or delete it.`;
            return;
        }
        this.selectedPack = pack;
        this.showAddModal = true;
        this.newService = this.resetService(pack.name);
        this.clearMessages();
    }

    closeAddModal(): void {
        this.showAddModal = false;
        this.selectedPack = null;
        this.resetAddForm();
    }

    createService(): void {
        if (!this.isValidService(this.newService) || !this.selectedPack) {
            this.errorMessage = 'Please fill all required fields with valid values.';
            return;
        }

        this.newService.subServices = this.newService.subServicesInput
            ? this.newService.subServicesInput.split(',').map(s => s.trim()).filter(s => s)
            : [];

        this.isLoading = true;
        this.servicePService.createService(this.projetId, this.newService).subscribe({
            next: (service: ServiceP) => {
                const newServiceToAdd = new ServiceP(
                    service.name,
                    service.description,
                    service.price,
                    service.typeservice,
                    service.subServices || []
                );
                newServiceToAdd.id = service.id;
                this.selectedPack!.services = [newServiceToAdd];
                this.hasService[this.selectedPack!.name] = true;
                this.successMessage = 'Service added successfully!';
                this.isLoading = false;
                this.closeAddModal();
            },
            error: (err: any) => {
                this.handleError('Failed to add service', err);
                this.isLoading = false;
                if (err.status === 400 && err.error?.message?.includes('typeservice')) {
                    this.errorMessage = `A service with type "${this.newService.typeservice}" already exists for this project.`;
                }
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    openEditModal(pack: Pack, service: ServiceP): void {
        this.selectedPack = pack;
        this.showEditModal = true;
        this.editService = { ...service, subServicesInput: service.subServices?.join(', ') || '' };
        this.clearMessages();
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.selectedPack = null;
        this.resetEditForm();
    }

    updateService(): void {
        if (!this.isValidService(this.editService) || !this.editService.id || !this.selectedPack) {
            this.errorMessage = 'Please fill all required fields with valid values.';
            return;
        }

        this.editService.subServices = this.editService.subServicesInput
            ? this.editService.subServicesInput.split(',').map(s => s.trim()).filter(s => s)
            : [];

        this.isLoading = true;
        this.servicePService.updateService(this.editService.id, this.editService).subscribe({
            next: (updatedService: ServiceP) => {
                this.selectedPack!.services = [updatedService];
                this.successMessage = 'Service updated successfully!';
                this.isLoading = false;
                this.closeEditModal();
            },
            error: (err: any) => {
                this.handleError('Failed to update service', err);
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    deleteService(pack: Pack, service: ServiceP): void {
        if (!service.id) {
            this.errorMessage = 'Cannot delete service: Invalid service ID';
            return;
        }

        if (!confirm('Are you sure you want to delete this service?')) return;

        this.isLoading = true;
        this.servicePService.deleteService(service.id).subscribe({
            next: () => {
                pack.services = [];
                this.hasService[pack.name] = false;
                this.successMessage = 'Service deleted successfully!';
                this.isLoading = false;
            },
            error: (err: any) => {
                this.handleError('Failed to delete service', err);
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    truncateDescription(description: string | undefined): string {
        if (!description) return 'N/A';
        const words = description.split(' ');
        if (words.length <= 10) return description;
        return words.slice(0, 10).join(' ') + '...';
    }

    private isValidService(service: ServiceP): boolean {
        return !!service.name && service.price >= 0 && !!service.typeservice;
    }

    private handleError(message: string, err: any): void {
        console.error('Error details:', err);
        this.errorMessage = `${message}: ${err.message || 'Unknown error'}`;
        this.successMessage = '';
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    private resetAddForm(): void {
        this.newService = this.resetService(this.selectedPack?.name);
        this.clearMessages();
    }

    private resetEditForm(): void {
        this.editService = this.resetService(this.selectedPack?.name);
        this.clearMessages();
    }

    private resetService(typeService: string = ''): ServiceP & { subServicesInput?: string } {
        return {
            ...new ServiceP('', '', 0, typeService || 'Standard', []),
            subServicesInput: ''
        };
    }
}