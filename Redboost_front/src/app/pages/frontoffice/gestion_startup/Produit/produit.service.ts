import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit } from '../../../../models/Produit';

@Injectable({
  providedIn: 'root',
})
export class ProduitService {
  private apiUrl = 'http://localhost:8085/api/produits';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found in localStorage');
      throw new Error('Authentication required');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  getAllProduits(): Observable<Produit[]> {
    return this.http
      .get<Produit[]>(`${this.apiUrl}/GetAllprod`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((err) => this.handleError('fetch all products', err))
      );
  }

  getProduitsByProjetId(projetId: number): Observable<Produit[]> {
    if (!projetId || projetId <= 0) {
      return throwError(() => new Error('Invalid project ID'));
    }
    return this.http
      .get<Produit[]>(`${this.apiUrl}/getByIdProjet/${projetId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((err) => this.handleError(`fetch products for project ${projetId}`, err))
      );
  }

  createProduit(projetId: number, formData: FormData): Observable<Produit> {
    if (!projetId || projetId <= 0) {
      return throwError(() => new Error('Invalid project ID'));
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('Authentication required'));
    }
    return this.http
      .post<Produit>(`${this.apiUrl}/AddProduit/${projetId}`, formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(
        catchError((err) => this.handleError('create product', err))
      );
  }

  updateProduit(id: number, formData: FormData): Observable<Produit> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('Authentication required'));
    }
    return this.http
      .put<Produit>(`${this.apiUrl}/UpdateProd/${id}`, formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(
        catchError((err) => this.handleError(`update product ${id}`, err))
      );
  }

  deleteProduit(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }
    return this.http
      .delete<void>(`${this.apiUrl}/DeleteProd/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((err) => this.handleError(`delete product ${id}`, err))
      );
  }

  private handleError(operation: string, err: HttpErrorResponse): Observable<never> {
    let errorMessage = `Error during ${operation}`;
    if (err.error instanceof ErrorEvent) {
      errorMessage = `${errorMessage}: ${err.error.message}`;
    } else {
      errorMessage = `${errorMessage}: HTTP ${err.status} - ${err.statusText || 'Unknown error'}`;
      if (err.url?.includes('/login')) {
        errorMessage = `${errorMessage}: Redirected to login. Please authenticate.`;
      }
      if (err.error) {
        errorMessage += ` | Details: ${JSON.stringify(err.error) || 'No details available'}`;
      }
    }
    console.error(errorMessage, err);
    return throwError(() => new Error(errorMessage));
  }
}