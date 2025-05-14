import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffType } from '../../../models/Staff-type';
import { Attribute } from '../../../models/Attribute';
import { Staff } from '../../../models/Staff';

@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private apiUrl = 'http://localhost:8085/api/staff'; // Adjust to your backend URL

    constructor(private http: HttpClient) {}

    getAllStaffTypes(): Observable<StaffType[]> {
        return this.http.get<StaffType[]>(`${this.apiUrl}/types`);
    }

    getStaffTypeById(id: number): Observable<StaffType> {
        return this.http.get<StaffType>(`${this.apiUrl}/types/${id}`);
    }

    createStaffType(typeName: string, attributeIds: number[]): Observable<StaffType> {
        return this.http.post<StaffType>(`${this.apiUrl}/types`, { typeName, attributeIds });
    }

    updateStaffType(id: number, typeName: string, attributeIds: number[]): Observable<StaffType> {
        return this.http.put<StaffType>(`${this.apiUrl}/types/${id}`, { typeName, attributeIds });
    }

    deleteStaffType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/types/${id}`);
    }

    getAllAttributes(): Observable<Attribute[]> {
        return this.http.get<Attribute[]>(`${this.apiUrl}/attributes`);
    }

    getAvailableAttributesForType(typeId: number): Observable<Attribute[]> {
        return this.http.get<Attribute[]>(`${this.apiUrl}/types/${typeId}/available-attributes`);
    }

    createAttribute(attributeName: string, dataType: string, defaultValues?: string[]): Observable<Attribute> {
        return this.http.post<Attribute>(`${this.apiUrl}/attributes`, { attributeName, dataType, defaultValues });
    }

    updateAttribute(id: number, attributeName: string, dataType: string, defaultValues?: string[]): Observable<Attribute> {
        return this.http.put<Attribute>(`${this.apiUrl}/attributes/${id}`, { attributeName, dataType, defaultValues });
    }

    deleteAttribute(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/attributes/${id}`);
    }

    createNewAttributeForType(typeId: number, attributeId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/types/${typeId}/attributes`, { attributeId });
    }

    downloadTemplate(typeId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/types/${typeId}/template`, { responseType: 'blob' });
    }

    importStaff(typeId: number, file: File): Observable<void> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<void>(`${this.apiUrl}/types/${typeId}/import`, formData);
    }

    filterStaff(typeIds: number[]): Observable<Staff[]> {
        let params = new HttpParams();
        if (typeIds.length > 0) {
            params = params.set('typeIds', typeIds.join(','));
        }
        return this.http.get<Staff[]>(`${this.apiUrl}/filter`, { params });
    }
}
