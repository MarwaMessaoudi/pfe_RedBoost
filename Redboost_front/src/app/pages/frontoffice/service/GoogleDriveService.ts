import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class GoogleDriveService {
    private apiUrl = 'http://localhost:8085/api/drive';

    constructor(private http: HttpClient) {}

    // Create a folder
    createFolder(folderName: string): Observable<string> {
        const params = new HttpParams().set('folderName', folderName);
        return this.http.post<string>(`${this.apiUrl}/create-folder`, null, { params, responseType: 'text' as 'json' }).pipe(
            tap((response) => console.log('Create folder response:', response)),
            catchError((error) => {
                console.error('Failed to create folder:', error);
                return throwError(() => new Error('Failed to create folder. Please try again.'));
            })
        );
    }

    // Create a subfolder
    createSubFolder(parentFolderId: string, subFolderName: string): Observable<string> {
        const params = new HttpParams().set('parentFolderId', parentFolderId).set('subFolderName', subFolderName);
        return this.http.post<string>(`${this.apiUrl}/create-subfolder`, null, { params, responseType: 'text' as 'json' }).pipe(
            tap((response) => console.log('Create subfolder response:', response)),
            catchError((error) => {
                console.error('Failed to create subfolder:', error);
                return throwError(() => new Error('Failed to create subfolder. Please try again.'));
            })
        );
    }

    // Upload a file
    uploadFile(folderId: string, file: File): Observable<string> {
        const formData = new FormData();
        formData.append('folderId', folderId);
        formData.append('file', file);
        return this.http.post<string>(`${this.apiUrl}/upload-file`, formData, { responseType: 'text' as 'json' }).pipe(
            tap((response) => console.log('Upload file response:', response)),
            catchError((error) => {
                console.error('Failed to upload file:', error);
                return throwError(() => new Error('Failed to upload file. Please try again.'));
            })
        );
    }

    // Get subfolders
    getSubFolders(parentFolderId: string): Observable<any[]> {
        const params = new HttpParams().set('parentFolderId', parentFolderId);
        return this.http.get<any[]>(`${this.apiUrl}/subfolders`, { params }).pipe(
            tap((response) => console.log('Get subfolders response:', response)),
            catchError((error) => {
                console.error('Failed to fetch subfolders:', error);
                return throwError(() => new Error('Failed to fetch subfolders. Please try again.'));
            })
        );
    }

    // Get files
    getFiles(folderId: string): Observable<any[]> {
        const params = new HttpParams().set('folderId', folderId);
        return this.http.get<any[]>(`${this.apiUrl}/files`, { params }).pipe(
            tap((response) => console.log('Get files response:', response)),
            catchError((error) => {
                console.error('Failed to fetch files:', error);
                return throwError(() => new Error('Failed to fetch files. Please try again.'));
            })
        );
    }
}
