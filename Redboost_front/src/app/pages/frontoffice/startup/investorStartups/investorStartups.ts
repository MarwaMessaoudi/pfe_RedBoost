import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Added HttpHeaders
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import axios from 'axios';
import { MessageService } from 'primeng/api'; // Added MessageService

@Component({
  selector: 'app-investor-startups',
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [MessageService], // Added MessageService to providers
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center text-[#245C67] mb-8">My Investments</h1>

      <!-- Filter Section -->
      <div class="flex flex-col gap-4 mb-8">
        <div class="relative w-full">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterInvestments()"
            placeholder="Search investments by name or industry..."
            class="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0A4955] focus:border-[#0A4955]"
          />
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Status Checkboxes -->
        <div class="flex flex-wrap gap-4">
          <label *ngFor="let status of statuses" class="flex items-center space-x-2">
            <input
              type="checkbox"
              [checked]="selectedStatuses.includes(status)"
              (change)="toggleStatus(status)"
              class="h-4 w-4 text-[#0A4955] border-gray-300 rounded focus:ring-[#0A4955]"
            />
            <span class="text-[#568086] text-sm">{{ status }}</span>
          </label>
        </div>
      </div>

      <!-- Investment Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let request of displayedRequests"
             class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200">
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-[#245C67]">{{ request.projet?.name }}</h2>
              <span class="text-xs font-medium px-2 py-1 rounded-full"
                    [ngClass]="{
                      'bg-[#568086] text-[#E44D62]': request.status === 'ACCEPTED',
                      'bg-[#EA7988] text-[#DB1E37]': request.status === 'DECLINED',
                      'bg-[#A0CED9] text-[#245C67]': request.status === 'PENDING'
                    }">
                {{ request.status }}
              </span>
            </div>

            <p class="text-[#568086] text-sm mb-4 line-clamp-2">{{ request.projet?.description }}</p>

            <div class="space-y-2 text-sm text-[#568086] mb-4">
              <div class="flex justify-between">
                <span>Industry:</span>
                <span class="font-medium">{{ request.projet?.sector }}</span>
              </div>
              <div class="flex justify-between">
                <span>Investment:</span>
                <span class="font-medium">{{ request.proposedAmount | currency }}</span>
              </div>
              <div class="flex justify-between" *ngIf="request.status === 'ACCEPTED'">
                <span>Current Value:</span>
                <span class="font-medium">{{ (request.projet?.revenue * 0.1) | currency }}</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button *ngIf="request.status === 'ACCEPTED'"
                      (click)="viewProjetDetails(request.projet?.id)"
                      class="flex-1 bg-[#0A4955] text-white py-2 px-4 rounded-md hover:bg-[#245C67] transition-colors text-sm">
                📊 View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div *ngIf="displayedRequests.length === 0 && !loading" class="text-center text-[#568086] mt-6">
        No investments found matching your criteria.
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="loading" class="text-center text-[#568086] mt-6 py-4">
        Loading investments...
      </div>
    </div>
  `,
  styles: [`
    .fill-star { color: #fbbf24; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class InvestorStartupsComponent {
  investmentRequests: any[] = [];
  displayedRequests: any[] = [];
  investorId: number | null = null; // Changed to null initially
  searchQuery: string = '';
  selectedStatuses: string[] = [];
  statuses = ['PENDING', 'ACCEPTED', 'DECLINED'];
  loading: boolean = false;
  currentUser: any = null; // Added currentUser property

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService // Added MessageService
  ) {
    this.fetchCurrentUser(); // Fetch user first
  }

  // Imported fetchCurrentUser logic from MarketplaceComponent
  private fetchCurrentUser(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No authentication token found. Please log in.',
      });
      this.router.navigate(['/signin']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get('http://localhost:8085/users/profile', { headers }).subscribe({
      next: (response: any) => {
        this.currentUser = response;
        this.investorId = response.id; // Set investorId from currentUser
        if (response.role !== 'INVESTOR') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Only investors can view investments.',
          });
          this.router.navigate(['/dashboard']);
        } else {
          this.fetchInvestorStartups(); // Fetch investments only if user is an investor
        }
      },
      error: (error) => {
        console.error('Failed to fetch user profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user profile',
        });
        this.router.navigate(['/signin']);
      },
    });
  }

  fetchInvestorStartups() {
    if (!this.investorId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not authenticated. Unable to fetch investments.',
      });
      return;
    }

    this.loading = true;
    axios
      .get(`http://localhost:8085/api/investment-requests/investor/${this.investorId}`)
      .then((response) => {
        this.investmentRequests = response.data;
        this.filterInvestments();
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error fetching investment requests:', error);
        this.investmentRequests = []; // Reset to empty array on error
        this.filterInvestments();
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load investments.',
        });
      });
  }

  toggleStatus(status: string) {
    if (this.selectedStatuses.includes(status)) {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    } else {
      this.selectedStatuses.push(status);
    }
    this.filterInvestments();
  }

  filterInvestments() {
    const query = this.searchQuery.toLowerCase();
    this.displayedRequests = this.investmentRequests.filter(request => {
      const matchesStatus = this.selectedStatuses.length === 0 || this.selectedStatuses.includes(request.status);
      const matchesSearch = 
        (request.projet?.name || '').toLowerCase().includes(query) ||
        (request.projet?.sector || '').toLowerCase().includes(query) ||
        (request.projet?.description || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }

  viewProjetDetails(projetId?: number) {
    if (projetId) {
      this.router.navigate(['/startup-details', projetId]);
    } else {
      console.error('Projet ID is undefined');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Project ID is missing.',
      });
      this.router.navigate(['/investor-startups']); // Fallback route
    }
  }
}