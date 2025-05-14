import { Component, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import axios from 'axios';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  providers: [MessageService],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center text-[#245C67] mb-8">Startup Marketplace</h1>

      <!-- Search and Filter Section -->
      <div class="flex flex-col gap-4 mb-8">
        <div class="relative w-full">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterStartups()"
            placeholder="Search by name, sector, or description..."
            class="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0A4955] focus:border-[#0A4955]"
          />
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Sector Checkboxes -->
        <div class="flex flex-wrap gap-4">
          <label *ngFor="let sector of sectors" class="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              [checked]="selectedSectors.includes(sector)"
              (change)="toggleSector(sector)"
              class="h-6 w-6 text-[#0A4955] border-gray-300 rounded focus:ring-[#0A4955]"
            />
            <span class="text-[#568086] text-lg font-medium" [ngClass]="{'text-[#0A4955]': selectedSectors.includes(sector)}">
              {{ sector }}
            </span>
          </label>
        </div>
      </div>

      <!-- Startup Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let startup of displayedStartups"
          class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
        >
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <img
                  [src]="startup.logo_url"
                  alt="{{ startup.name }} logo"
                  class="w-10 h-10 rounded-full object-cover"
                  
                />
                <h2 class="text-xl font-semibold text-[#245C67] truncate">{{ startup.name }}</h2>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded-full bg-[#E88D9A] text-[#DB1E37]">
                {{ startup.sector }}
              </span>
            </div>
            
            <p class="text-[#568086] text-sm mb-4 line-clamp-2">{{ startup.description }}</p>
            
            <div class="space-y-2 text-sm text-[#568086] mb-4">
              <div class="flex justify-between">
                <span>Funding Goal:</span>
                <span class="font-medium">{{ startup.fundingGoal | currency }}</span>
              </div>
              <div class="flex justify-between">
                <span>Location:</span>
                <span class="font-medium">{{ startup.location }}</span>
              </div>
              <div class="flex justify-between">
                <span>Team Size:</span>
                <span class="font-medium">{{ startup.teamSize }}</span>
              </div>
              <div class="flex justify-between">
                <span>ID:</span>
                <span class="font-medium">{{ startup.id }}</span>
              </div>
            </div>

            <div class="flex items-center mb-4">
              <div class="flex items-center text-[#E44D62]">
                <span *ngFor="let star of [1,2,3,4,5]" [class.fill-star]="star <= startup.rating">★</span>
              </div>
              <span class="ml-2 text-sm text-[#568086]">({{ startup.rating }}/5)</span>
            </div>

            <div class="flex gap-3">
              <button
                (click)="openModal(startup)"
                class="flex-1 bg-[#0A4955] text-white py-2 px-4 rounded-md hover:bg-[#245C67] transition-colors text-sm"
              >
                Send Proposal
              </button>
              <button
                (click)="viewStartupDetails(startup.id)"
                class="flex-1 bg-[#A0CED9] text-[#568086] py-2 px-4 rounded-md hover:bg-[#7BB4C2] transition-colors text-sm"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div *ngIf="displayedStartups.length === 0 && !loading" class="text-center text-[#568086] mt-6">
        No startups found matching your criteria.
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="loading" class="text-center text-[#568086] mt-6 py-4">
        Loading more startups...
      </div>

      <!-- Modal -->
      <div
        *ngIf="isModalOpen"
        class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-[#245C67]">Send Proposal to {{ selectedStartup?.name }} (ID: {{ selectedStartup?.id }})</h3>
            <button (click)="closeModal()" class="text-[#568086] hover:text-[#245C67]">✕</button>
          </div>
          <textarea
            [(ngModel)]="message"
            placeholder="Your proposal message"
            class="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-[#0A4955]"
            rows="4"
          ></textarea>
          <input
            [(ngModel)]="proposedAmount"
            type="number"
            placeholder="Proposed Amount ($)"
            class="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-[#0A4955]"
          />
          <div class="flex justify-end gap-3">
            <button
              (click)="closeModal()"
              class="px-4 py-2 bg-[#A0CED9] rounded-md hover:bg-[#7BB4C2]"
            >
              Cancel
            </button>
            <button
              (click)="sendProposal()"
              class="px-4 py-2 bg-[#0A4955] text-white rounded-md hover:bg-[#245C67]"
            >
              Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fill-star { color: #E44D62; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class MarketplaceComponent {
  searchQuery: string = '';
  selectedSectors: string[] = [];
  startups: any[] = [];
  displayedStartups: any[] = [];
  message: string = '';
  proposedAmount: number = 0;
  isModalOpen: boolean = false;
  selectedStartup: any;
  loading: boolean = false;
  sectors: string[] = [];
  currentUser: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService
  ) {
    this.fetchCurrentUser();
    this.fetchStartups();
  }

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
        if (response.role !== 'INVESTOR') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Only investors can send proposals.',
          });
          this.router.navigate(['/dashboard']);
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

  fetchStartups() {
    this.loading = true;
    axios
      .get('http://localhost:8085/api/projets/GetAll')
      .then((response) => {
        this.startups = response.data.map((startup: any) => {
          if (!startup.id) {
            console.warn('Startup missing ID:', startup);
          }
          return startup;
        });
        this.sectors = [...new Set(this.startups.map(startup => startup.sector))];
        this.filterStartups();
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error fetching startups:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: '.failed to load startups.',
        });
        this.loading = false;
      });
  }

  toggleSector(sector: string) {
    if (this.selectedSectors.includes(sector)) {
      this.selectedSectors = this.selectedSectors.filter(s => s !== sector);
    } else {
      this.selectedSectors.push(sector);
    }
    this.filterStartups();
  }

  filterStartups() {
    const query = this.searchQuery.toLowerCase();
    this.displayedStartups = this.startups.filter(startup => {
      const matchesSector = this.selectedSectors.length === 0 || this.selectedSectors.includes(startup.sector);
      const matchesSearch = 
        startup.name.toLowerCase().includes(query) ||
        startup.sector.toLowerCase().includes(query) ||
        startup.description.toLowerCase().includes(query) ||
        startup.location.toLowerCase().includes(query);
      return matchesSector && matchesSearch;
    });
    this.loading = false;
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
      !this.loading &&
      this.displayedStartups.length < this.startups.length
    ) {
      this.loadMoreStartups();
    }
  }

  loadMoreStartups() {
    this.loading = true;
    setTimeout(() => {
      const filtered = this.startups.filter(startup => {
        const matchesSector = this.selectedSectors.length === 0 || this.selectedSectors.includes(startup.sector);
        const matchesSearch = startup.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              startup.sector.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              startup.description.toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesSector && matchesSearch;
      });
      const nextBatch = filtered.slice(
        this.displayedStartups.length,
        this.displayedStartups.length + 3
      );
      this.displayedStartups = [...this.displayedStartups, ...nextBatch];
      this.loading = false;
    }, 1000);
  }

  openModal(startup: any) {
    if (!startup.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selected startup is missing an ID.',
      });
      return;
    }
    this.selectedStartup = startup;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.message = '';
    this.proposedAmount = 0;
  }

  sendProposal() {
    if (!this.currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please log in to send a proposal.',
      });
      this.closeModal();
      this.router.navigate(['/signin']);
      return;
    }

    if (!this.selectedStartup?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No startup selected or startup ID is missing.',
      });
      this.closeModal();
      return;
    }

    const proposal = {
      investor: { id: this.currentUser.id },
      projet: { id: this.selectedStartup.id },
      message: this.message,
      proposedAmount: this.proposedAmount,
      status: 'PENDING',
      requestDate: new Date().toISOString()
    };

    console.log('Sending proposal:', proposal);

    axios
      .post('http://localhost:8085/api/investment-requests', proposal)
      .then((response) => {
        console.log('Proposal sent successfully:', response.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Proposal sent successfully!',
        });
        this.closeModal();
      })
      .catch((error) => {
        console.error('Error sending proposal:', error.response?.data || error);
        console.log(this.currentUser.id);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send proposal: ' + (error.response?.data?.error || 'Unknown error'),
        });
      });
  }

  viewStartupDetails(startupId: number) {
    if (!startupId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Startup ID is missing.',
      });
      return;
    }
    this.router.navigate([`/startup/${startupId}`]);
  }

  // Handle image loading errors by setting a fallback imag
}