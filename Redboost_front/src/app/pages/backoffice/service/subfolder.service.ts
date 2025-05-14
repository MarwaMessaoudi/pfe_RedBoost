import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SubFolderService {

    private baseUrl = 'http://localhost:8085/api/subfolders';

    constructor(private http: HttpClient) { }

    createSubFolder(subFolderRequest: any, folderMetadataId: number): Observable<any> {  // Using 'any' for the request body, to avoid typing issues, and any for the returning objects
        const url = `${this.baseUrl}/${folderMetadataId}`;
        console.log('createSubFolder URL:', url); // Log the constructed URL
        return this.http.post(url, subFolderRequest);
    }

    getSubFoldersByFolderMetadataId(folderMetadataId: number): Observable<any[]> { //Typing as any to reduce the typing error
        return this.http.get<any[]>(`${this.baseUrl}/${folderMetadataId}`); //Typing as any to reduce the typing error
    }

    deleteSubFolder(id: number): Observable<any> {
        const url = `${this.baseUrl}/${id}`;
        return this.http.delete(url);
    }

    updateSubFolder(id: number, subFolderData: any): Observable<any> {
        const url = `${this.baseUrl}/${id}`;
        return this.http.put(url, subFolderData);
    }
}
