import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Category } from '../../../models/category.model'; // Ensure that this model matches your response structure

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private baseUrl = 'http://localhost:8085/api/categories'; // Replace with your actual backend URL

    constructor(private http: HttpClient) {}

    // Get all categories from the backend
    getAllCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.baseUrl).pipe(
            map((categories: Category[]) => {
                // Add map to process and return
                // console.log('Categories from backend:', categories);
                return categories;
            }),
            catchError(this.handleError) // Catch and handle any errors that may occur
        );
    }

    // Create a new category
    createCategory(category: Category): Observable<Category> {
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };

        return this.http.post<Category>(this.baseUrl, category, httpOptions).pipe(catchError(this.handleError));
    }

    // Handle HTTP errors gracefully
    private handleError(error: HttpErrorResponse): Observable<any> {
        // (Your improved error handling logic here - keep the same!)
        let errorMessage = 'An unknown error occurred!';

        if (error.error instanceof ErrorEvent) {
            // Client-side errors
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side errors
            if (typeof error.error === 'string') {
                // Simple string error message
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.error}`;
            } else if (error.error && typeof error.error === 'object') {
                // Attempt to parse the error object (assuming it's JSON)
                try {
                    // Check for standard Spring Boot error structure:
                    if (error.error.message) {
                        errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.message}`;
                    } else if (error.error.error) {
                        // Check for the error field in Spring {error: "message"}
                        errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.error}`;
                    } else if (error.error.errors && Array.isArray(error.error.errors)) {
                        // Handling Spring Boot Validation Errors
                        // Accumulate validation error messages
                        errorMessage = `Error Code: ${error.status}\nMessage: Validation errors:\n`;
                        error.error.errors.forEach((validationError: any) => {
                            errorMessage += `${validationError.field}: ${validationError.defaultMessage}\n`;
                        });
                    } else {
                        // Fallback to stringifying the entire error object
                        errorMessage = `Error Code: ${error.status}\nMessage: ${JSON.stringify(error.error)}`;
                    }
                } catch (e) {
                    // If parsing JSON fails
                    errorMessage = `Error Code: ${error.status}\nMessage: Could not parse error message from server. ${e}`;
                }
            } else {
                // Unknown error format
                errorMessage = `Error Code: ${error.status}\nMessage: Unknown error format from server.`;
            }
        }

        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
