import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  title: string;
}

export interface Guide {
  id: number;
  title: string;
  description: string;
  file: string;
  categoryId: number;
  category?: Category;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private apiUrl = 'http://localhost:8085/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { headers: this.getAuthHeaders() });
  }

  addCategory(category: { title: string }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories/add`, category, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    });
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  getGuides(): Observable<Guide[]> {
    return this.http.get<Guide[]>(`${this.apiUrl}/guides`, { headers: this.getAuthHeaders() });
  }

  getGuidesByCategory(categoryId: number): Observable<Guide[]> {
    return this.http.get<Guide[]>(`${this.apiUrl}/guides/category/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  addGuide(guide: { title: string; description: string; file: File; categoryId: number }): Observable<Guide> {
    const formData = new FormData();
    formData.append('title', guide.title);
    formData.append('description', guide.description);
    formData.append('categoryId', guide.categoryId.toString()); // Convert to string for FormData
    formData.append('file', guide.file);

    return this.http.post<Guide>(`${this.apiUrl}/guides`, formData, { headers: this.getAuthHeaders() });
  }

  updateGuide(guide: { id: number; title: string; description: string; file: File | null; categoryId: number }): Observable<Guide> {
    const formData = new FormData();
    formData.append('title', guide.title);
    formData.append('description', guide.description);
    formData.append('categoryId', guide.categoryId.toString());
    if (guide.file) {
      formData.append('file', guide.file);
    }
    return this.http.put<Guide>(`${this.apiUrl}/guides/${guide.id}`, formData, { headers: this.getAuthHeaders() });
  }

  deleteGuide(guideId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/guides/${guideId}`, { headers: this.getAuthHeaders() });
  }
}