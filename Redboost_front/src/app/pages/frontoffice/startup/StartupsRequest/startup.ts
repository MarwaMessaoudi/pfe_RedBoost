import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import axios from 'axios';

@Component({
  selector: 'app-startup-investment-requests',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center text-[#245C67] mb-8">My Startup Investment Requests</h1>

      <!-- Search and Filter Section -->
      <div class="flex flex-col gap-4 mb-8">
        <div class="relative w-full">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterRequests()"
            placeholder="Search by investor name, message, or project..."
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

      <!-- Investment Requests Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let request of displayedRequests"
             class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200">
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-[#245C67]">{{ request.investor.name }}</h2>
              <span class="text-xs font-medium px-2 py-1 rounded-full"
                    [ngClass]="{
                      'bg-[#568086] text-[#E44D62]': request.status === 'ACCEPTED',
                      'bg-[#EA7988] text-[#DB1E37]': request.status === 'DECLINED',
                      'bg-[#A0CED9] text-[#245C67]': request.status === 'PENDING'
                    }">
                {{ request.status }}
              </span>
            </div>

            <p class="text-[#568086] text-sm mb-4 line-clamp-2">{{ request.message }}</p>

            <div class="space-y-2 text-sm text-[#568086] mb-4">
              <div class="flex justify-between">
                <span>Phone:</span>
                <span class="font-medium">{{ request.investor.phoneNumber || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Proposed Amount:</span>
                <span class="font-medium">{{ request.proposedAmount | currency }}</span>
              </div>
              <div class="flex justify-between">
                <span>Project:</span>
                <span class="font-medium">{{ request.projet.name }}</span>
              </div>
              <div class="flex justify-between">
                <span>Date Submitted:</span>
                <span class="font-medium">{{ request.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3" *ngIf="request.status === 'PENDING'">
              <button
                (click)="updateStatus(request.id, 'ACCEPTED')"
                class="flex-1 bg-[#0A4955] text-white py-2 px-4 rounded-md hover:bg-[#245C67] transition-colors text-sm">
                ✅ Accept
              </button>
              <button
                (click)="updateStatus(request.id, 'DECLINED')"
                class="flex-1 bg-[#DB1E37] text-white py-2 px-4 rounded-md hover:bg-[#E44D62] transition-colors text-sm">
                ❌ Reject
              </button>
            </div>

            <!-- Accepted/Rejected Message -->
            <div *ngIf="request.status !== 'PENDING'" class="mt-4 text-sm text-[#568086]">
              <p *ngIf="request.status === 'ACCEPTED'">Accepted on {{ request.updatedAt | date:'medium' }}</p>
              <p *ngIf="request.status === 'DECLINED'">Declined on {{ request.updatedAt | date:'medium' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="loading" class="text-center text-[#568086] mt-6 py-4">
        Loading investment requests...
      </div>

      <!-- No Results Message -->
      <div *ngIf="!loading && displayedRequests.length === 0" class="text-center text-[#568086] mt-6">
        No investment requests found for your startups.
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="text-center text-[#DB1E37] mt-6">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class StartupInvestmentRequestsComponent {
  investmentRequests: any[] = [];
  displayedRequests: any[] = [];
  searchQuery: string = '';
  selectedStatuses: string[] = [];
  statuses = ['PENDING', 'ACCEPTED', 'DECLINED'];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient) {
    this.fetchUserStartupRequests();
  }

  fetchUserStartupRequests() {
    this.loading = true;
    this.errorMessage = '';
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.errorMessage = 'You must be logged in to view investment requests.';
      this.loading = false;
      return;
    }

    console.log('Fetching requests from /my-startups with token:', token); // Debug log
    axios
      .get('http://localhost:8085/api/investment-requests/my-startups', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((response) => {
        console.log('Response data:', response.data); // Debug log
        this.investmentRequests = response.data.map((req: any) => ({
          ...req,
          createdAt: req.createdAt || new Date().toISOString(),
          updatedAt: req.updatedAt || new Date().toISOString()
        }));
        this.filterRequests();
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error fetching investment requests:', error);
        this.investmentRequests = [];
        this.filterRequests();
        if (error.response) {
          console.log('Error response:', error.response.data); // Debug log
          this.errorMessage = error.response.data.message || 'Failed to load investment requests.';
        } else {
          this.errorMessage = 'Failed to connect to the server. Please try again later.';
        }
        this.loading = false;
      });
  }

  toggleStatus(status: string) {
    if (this.selectedStatuses.includes(status)) {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    } else {
      this.selectedStatuses.push(status);
    }
    this.filterRequests();
  }

  filterRequests() {
    const query = this.searchQuery.toLowerCase();
    this.displayedRequests = this.investmentRequests.filter(request => {
      const matchesStatus = this.selectedStatuses.length === 0 || this.selectedStatuses.includes(request.status);
      const matchesSearch = 
        (request.investor?.name || '').toLowerCase().includes(query) ||
        (request.message || '').toLowerCase().includes(query) ||
        (request.investor?.phoneNumber || '').toLowerCase().includes(query) ||
        (request.projet?.name || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }

  updateStatus(requestId: number, newStatus: string) {
    this.loading = true;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.errorMessage = 'You must be logged in to update request status.';
      this.loading = false;
      return;
    }

    axios
      .put(
        `http://localhost:8085/api/investment-requests/${requestId}/status?status=${newStatus}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then(() => {
        this.investmentRequests = this.investmentRequests.map(req =>
          req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
        );
        this.filterRequests();
        this.loading = false;
      })
      .catch((error) => {
        console.error(`Error updating request ${requestId} to ${newStatus}:`, error);
        this.errorMessage = `Failed to update request status to ${newStatus}.`;
        this.loading = false;
      });
  }
}