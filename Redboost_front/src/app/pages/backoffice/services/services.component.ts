import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Service {
    id?: number;
    name: string;
    description?: string;
    price: number;
}

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="min-h-screen bg-gradient-to-br from-[#245C67] to-[#568086] text-[#568086]">
            <!-- Header -->
            <header class="bg-[#0A4955] text-white py-8 shadow-xl">
                <div class="container mx-auto px-6">
                    <h1 class="text-4xl font-bold tracking-tight">Services</h1>
                    <p class="mt-2 text-[#EA7988] text-lg">Manage your service offerings</p>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-6 py-10 max-w-6xl">
                <!-- Add/Edit Form -->
                <section class="mb-12">
                    <div class="bg-white rounded-xl shadow-lg p-8 transition-all hover:shadow-2xl">
                        <h2 class="text-2xl font-semibold text-[#0A4955] mb-6">
                            {{ editingService ? 'Edit Service' : 'Add Service' }}
                        </h2>
                        <form (submit)="saveService()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <input [(ngModel)]="newService.name" name="name" placeholder="Name" required class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div>
                                <input [(ngModel)]="newService.description" name="description" placeholder="Description" class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div>
                                <input [(ngModel)]="newService.price" name="price" type="number" placeholder="Price" required class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div class="col-span-full flex space-x-4">
                                <button type="submit" class="bg-[#0A4955] text-white px-6 py-3 rounded-lg hover:bg-[#245C67] transition-colors duration-300">
                                    {{ editingService ? 'Update' : 'Add' }}
                                </button>
                                <button *ngIf="editingService" (click)="cancelEdit()" type="button" class="bg-[#568086] text-white px-6 py-3 rounded-lg hover:bg-[#245C67] transition-colors duration-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </section>

                <!-- Service List -->
                <section>
                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <h2 class="text-2xl font-semibold text-[#0A4955] mb-6">Service List</h2>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-[#245C67] text-white">
                                        <th class="p-4 text-left rounded-tl-lg">ID</th>
                                        <th class="p-4 text-left">Name</th>
                                        <th class="p-4 text-left">Description</th>
                                        <th class="p-4 text-left">Price</th>
                                        <th class="p-4 text-left rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let service of services" class="border-b border-[#568086] hover:bg-[#EA7988] hover:bg-opacity-10 transition-colors duration-200">
                                        <td class="p-4">{{ service.id }}</td>
                                        <td class="p-4">{{ service.name }}</td>
                                        <td class="p-4">{{ service.description || 'N/A' }}</td>
                                        <td class="p-4">{{ service.price }}</td>
                                        <td class="p-4 flex space-x-2">
                                            <button (click)="editService(service)" class="bg-[#0A4955] text-white px-4 py-2 rounded-lg hover:bg-[#245C67] transition-colors duration-300">Edit</button>
                                            <button (click)="deleteService(service.id!)" class="bg-[#DB1E37] text-white px-4 py-2 rounded-lg hover:bg-[#E44D62] transition-colors duration-300">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `,
    styles: []
})
export class ServicesComponent implements OnInit {
    private apiUrl = 'http://localhost:8085/api/customerservices';

    constructor(private http: HttpClient) {}

    getServices(): Observable<Service[]> {
        return this.http.get<Service[]>(this.apiUrl);
    }

    createService(service: Service): Observable<Service> {
        return this.http.post<Service>(this.apiUrl, service);
    }

    updateService(id: number, service: Service): Observable<Service> {
        return this.http.put<Service>(`${this.apiUrl}/${id}`, service);
    }

    removeService(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    services: Service[] = [];
    newService: Service = { name: '', price: 0 };
    editingService: Service | null = null;

    public ngOnInit(): void {
        this.loadServices();
    }

    loadServices() {
        this.getServices().subscribe((data) => (this.services = data));
    }

    saveService() {
        if (this.editingService) {
            this.updateService(this.editingService.id!, this.newService).subscribe(() => {
                this.loadServices();
                this.resetForm();
            });
        } else {
            this.createService(this.newService).subscribe(() => {
                this.loadServices();
                this.resetForm();
            });
        }
    }

    editService(service: Service) {
        this.editingService = service;
        this.newService = { ...service };
    }

    deleteService(id: number) {
        this.removeService(id).subscribe(() => this.loadServices());
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.newService = { name: '', price: 0 };
        this.editingService = null;
    }
}
