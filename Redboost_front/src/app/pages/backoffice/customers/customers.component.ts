import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Customer {
    id?: number;
    name: string;
    address?: string;
    email: string;
    phoneNumber?: string;
}

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="min-h-screen bg-gradient-to-br from-[#245C67] to-[#568086] text-[#568086]">
            <!-- Header -->
            <header class="bg-[#0A4955] text-white py-8 shadow-xl">
                <div class="container mx-auto px-6">
                    <h1 class="text-4xl font-bold tracking-tight">Customers</h1>
                    <p class="mt-2 text-[#EA7988] text-lg">Manage your customer database</p>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-6 py-10 max-w-6xl">
                <!-- Add/Edit Form -->
                <section class="mb-12">
                    <div class="bg-white rounded-xl shadow-lg p-8 transition-all hover:shadow-2xl">
                        <h2 class="text-2xl font-semibold text-[#0A4955] mb-6">
                            {{ editingCustomer ? 'Edit Customer' : 'Add Customer' }}
                        </h2>
                        <form (submit)="saveCustomer()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <input [(ngModel)]="newCustomer.name" name="name" placeholder="Name" required class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div>
                                <input [(ngModel)]="newCustomer.email" name="email" placeholder="Email" required class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div>
                                <input [(ngModel)]="newCustomer.address" name="address" placeholder="Address" class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div>
                                <input [(ngModel)]="newCustomer.phoneNumber" name="phoneNumber" placeholder="Phone Number" class="w-full p-3 border border-[#568086] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4955] transition-all" />
                            </div>
                            <div class="col-span-full flex space-x-4">
                                <button type="submit" class="bg-[#0A4955] text-white px-6 py-3 rounded-lg hover:bg-[#245C67] transition-colors duration-300">
                                    {{ editingCustomer ? 'Update' : 'Add' }}
                                </button>
                                <button *ngIf="editingCustomer" (click)="cancelEdit()" type="button" class="bg-[#568086] text-white px-6 py-3 rounded-lg hover:bg-[#245C67] transition-colors duration-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </section>

                <!-- Customer List -->
                <section>
                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <h2 class="text-2xl font-semibold text-[#0A4955] mb-6">Customer List</h2>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-[#245C67] text-white">
                                        <th class="p-4 text-left rounded-tl-lg">ID</th>
                                        <th class="p-4 text-left">Name</th>
                                        <th class="p-4 text-left">Email</th>
                                        <th class="p-4 text-left">Address</th>
                                        <th class="p-4 text-left">Phone</th>
                                        <th class="p-4 text-left rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let customer of customers" class="border-b border-[#568086] hover:bg-[#EA7988] hover:bg-opacity-10 transition-colors duration-200">
                                        <td class="p-4">{{ customer.id }}</td>
                                        <td class="p-4">{{ customer.name }}</td>
                                        <td class="p-4">{{ customer.email }}</td>
                                        <td class="p-4">{{ customer.address || 'N/A' }}</td>
                                        <td class="p-4">{{ customer.phoneNumber || 'N/A' }}</td>
                                        <td class="p-4 flex space-x-2">
                                            <button (click)="editCustomer(customer)" class="bg-[#0A4955] text-white px-4 py-2 rounded-lg hover:bg-[#245C67] transition-colors duration-300">Edit</button>
                                            <button (click)="deleteCustomer(customer.id!)" class="bg-[#DB1E37] text-white px-4 py-2 rounded-lg hover:bg-[#E44D62] transition-colors duration-300">Delete</button>
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
export class CustomersComponent implements OnInit {
    private apiUrl = 'http://localhost:8085/api/customers';

    constructor(private http: HttpClient) {}

    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(this.apiUrl);
    }

    createCustomer(customer: Customer): Observable<Customer> {
        return this.http.post<Customer>(this.apiUrl, customer);
    }

    updateCustomer(id: number, customer: Customer): Observable<Customer> {
        return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
    }

    removeCustomer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    customers: Customer[] = [];
    newCustomer: Customer = { name: '', email: '' };
    editingCustomer: Customer | null = null;

    public ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers() {
        this.getCustomers().subscribe((data) => (this.customers = data));
    }

    saveCustomer() {
        if (this.editingCustomer) {
            this.updateCustomer(this.editingCustomer.id!, this.newCustomer).subscribe(() => {
                this.loadCustomers();
                this.resetForm();
            });
        } else {
            this.createCustomer(this.newCustomer).subscribe(() => {
                this.loadCustomers();
                this.resetForm();
            });
        }
    }

    editCustomer(customer: Customer) {
        this.editingCustomer = customer;
        this.newCustomer = { ...customer };
    }

    deleteCustomer(id: number) {
        this.removeCustomer(id).subscribe(() => this.loadCustomers());
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.newCustomer = { name: '', email: '' };
        this.editingCustomer = null;
    }
}
