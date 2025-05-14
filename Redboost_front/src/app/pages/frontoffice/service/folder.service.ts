import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Import HttpParams
import { Observable } from 'rxjs';
import { Folder } from '../../../models/folder.model';

@Injectable({
    providedIn: 'root'
})
export class FolderService {
    private apiUrl = 'http://localhost:8085/api/folders';

    constructor(private http: HttpClient) {}

    createFolder(folder: Folder): Observable<Folder> {
        return this.http.post<Folder>(this.apiUrl, folder);
    }

    getAllFolders(): Observable<Folder[]> {
        return this.http.get<Folder[]>(this.apiUrl);
    }

    deleteFolder(folderId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${folderId}`);
    }

    updateFolder(folder: Folder): Observable<Folder> {
        // Create HttpParams
        let params = new HttpParams();
        if (folder.categoryId) {
            params = params.set('categoryId', folder.categoryId);
        }

        // Make the PUT request
        return this.http.put<Folder>(`${this.apiUrl}/${folder.id}`, folder, { params: params });
    }
}
