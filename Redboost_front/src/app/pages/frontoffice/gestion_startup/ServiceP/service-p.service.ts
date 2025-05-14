import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceP } from '../../../../models/ServiceP';

@Injectable({
    providedIn: 'root'
})
export class ServicePService {
    private apiUrl = 'http://localhost:8085/api/services'; // Adjust to your backend URL

    constructor(private http: HttpClient) {}

    // Create a single service
    createService(projetId: number, service: ServiceP): Observable<ServiceP> {
        return this.http.post<ServiceP>(`${this.apiUrl}?projetId=${projetId}`, service);
    }

    // Create three standard services (Free, Premium, Gold) for a project
    createStandardServices(projetId: number): Observable<ServiceP[]> {
        return this.http.post<ServiceP[]>(`${this.apiUrl}/standard/${projetId}`, null);
    }

    // Get all services
    getAllServices(): Observable<ServiceP[]> {
        return this.http.get<ServiceP[]>(this.apiUrl);
    }

    // Get services by project ID
    getServicesByProjectId(projetId: number): Observable<ServiceP[]> {
        return this.http.get<ServiceP[]>(`${this.apiUrl}/project/${projetId}`);
    }

    // Get services by project ID (alternative endpoint)
    getServicesByProjetId(projetId: number): Observable<ServiceP[]> {
        return this.http.get<ServiceP[]>(`${this.apiUrl}/getByIdProjet/${projetId}`);
    }

    // Get a service by ID
    getServiceById(id: number): Observable<ServiceP> {
        return this.http.get<ServiceP>(`${this.apiUrl}/${id}`);
    }

    // Update a service
    updateService(id: number, service: ServiceP): Observable<ServiceP> {
        return this.http.put<ServiceP>(`${this.apiUrl}/${id}`, service);
    }

    // Delete a service
    deleteService(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}