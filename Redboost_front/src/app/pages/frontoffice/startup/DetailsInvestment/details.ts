import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import axios from 'axios';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-startup-details',
  standalone: true,
  imports: [CommonModule],
  providers: [MessageService],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-[#EA7988] to-[#A0CED9] text-gray-800">
      <!-- Header -->
      <header class="bg-gradient-to-r from-[#0A4955] to-[#245C67] text-white py-8 shadow-xl">
        <div class="container mx-auto px-6 flex justify-between items-center">
          <h1 class="text-4xl font-extrabold tracking-tight">{{ projet?.name || 'Project Details' }}</h1>
          <button 
            (click)="goBack()" 
            class="bg-[#A0CED9] text-[#0A4955] px-6 py-2 rounded-full font-semibold hover:bg-[#7BB4C2] transition-colors duration-300 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Investments
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-6 py-12 max-w-6xl">
        <div *ngIf="projet && !loading && currentUser; else loadingOrError" class="bg-white rounded-2xl shadow-lg p-8">
          <!-- Overview -->
          <section class="mb-10">
            <h2 class="text-3xl font-bold text-[#245C67] mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-[#568086]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Overview
            </h2>
            <p class="text-[#568086] text-lg leading-relaxed">{{ projet.description }}</p>
            <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Sector</p>
                <p class="text-lg text-[#0A4955]">{{ projet.sector }}</p>
              </div>
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Location</p>
                <p class="text-lg text-[#0A4955]">{{ projet.location }}</p>
              </div>
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Founded</p>
                <p class="text-lg text-[#0A4955]">{{ projet.creationDate }}</p>
              </div>
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Team Size</p>
                <p class="text-lg text-[#0A4955]">{{ projet.numberOfEmployees }}</p>
              </div>
            </div>
          </section>

          <!-- Investor Stake -->
          <section class="mb-10" *ngIf="investment">
            <h3 class="text-2xl font-bold text-[#245C67] mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-[#568086]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Your Investment
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="bg-gradient-to-br from-[#A0CED9] to-[#7BB4C2] p-6 rounded-xl shadow-md text-center">
                <p class="text-sm text-[#568086]">Invested Amount</p>
                <p class="text-3xl font-bold text-[#0A4955] mt-2">{{ investment?.proposedAmount | currency }}</p>
              </div>
              <div class="bg-gradient-to-br from-[#568086] to-[#3A6A72] p-6 rounded-xl shadow-md text-center">
                <p class="text-sm text-[#EA7988]">Equity Stake</p>
                <p class="text-3xl font-bold text-[#E44D62] mt-2">{{ investment?.equityPercentage || 0 }}%</p>
              </div>
              <div class="bg-gradient-to-br from-[#E88D9A] to-[#DB1E37] p-6 rounded-xl shadow-md text-center">
                <p class="text-sm text-[#568086]">Current ROI</p>
                <p class="text-3xl font-bold text-white mt-2">{{ calculateROI() | percent:'1.2-2' }}</p>
              </div>
            </div>
            <p class="mt-4 text-[#568086]"><strong class="text-[#245C67]">Investment Date:</strong> {{ investment?.investmentDate | date:'mediumDate' }}</p>
          </section>

          <!-- Financial Overview -->
          <section class="mb-10">
            <h3 class="text-2xl font-bold text-[#245C67] mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-[#568086]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              Financial Overview
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-[#A0CED9] to-[#7BB4C2] p-6 rounded-xl shadow-md text-center">
                <p class="text-sm text-[#568086]">Revenue</p>
                <p class="text-3xl font-bold text-[#0A4955] mt-2">{{ projet.revenue | currency }}</p>
              </div>
              <div class="bg-gradient-to-br from-[#7BB4C2] to-[#568086] p-6 rounded-xl shadow-md text-center">
                <p class="text-sm text-[#568086]">Funding Goal</p>
                <p class="text-3xl font-bold text-[#245C67] mt-2">{{ projet.fundingGoal | currency }}</p>
              </div>
            </div>
          </section>

          <!-- Project Metrics -->
          <section class="mb-10">
            <h3 class="text-2xl font-bold text-[#245C67] mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-[#568086]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Project Metrics
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Status</p>
                <p class="text-lg text-[#0A4955]">{{ projet.status }}</p>
              </div>
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Objectives</p>
                <p class="text-lg text-[#0A4955]">{{ projet.objectives }}</p>
              </div>
              <div class="bg-[#A0CED9] p-4 rounded-xl shadow-md">
                <p class="font-semibold text-[#245C67]">Global Score</p>
                <p class="text-lg text-[#0A4955]">{{ projet.globalScore }}</p>
              </div>
            </div>
          </section>

          <!-- Charts -->
          <section class="space-y-10">
            <div class="bg-white p-6 rounded-2xl shadow-md">
              <h4 class="text-xl font-semibold text-[#245C67] mb-4">Revenue</h4>
              <canvas id="revenueChart" class="w-full h-64"></canvas>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-md">
              <h4 class="text-xl font-semibold text-[#245C67] mb-4">Funding Progress</h4>
              <canvas id="fundingChart" class="w-full h-64"></canvas>
            </div>
          </section>
        </div>

        <!-- Loading/Error States -->
        <ng-template #loadingOrError>
          <div *ngIf="loading" class="text-center text-[#568086] mt-8 animate-pulse text-xl font-medium">Loading project details...</div>
          <div *ngIf="errorMessage" class="text-center text-[#DB1E37] mt-8 text-xl font-medium">{{ errorMessage }}</div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    canvas { 
      max-height: 256px; 
    }
    .shadow-md {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    .shadow-lg {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .rounded-2xl {
      border-radius: 1rem;
    }
  `]
})
export class StartupDetailsComponent implements OnInit, AfterViewInit {
  projet: any = null;
  investment: any = null;
  investorId: number | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  currentUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef // Added for manual change detection
  ) {}

  ngOnInit() {
    this.fetchCurrentUser();
    const projetId = +this.route.snapshot.paramMap.get('id')!;
    if (projetId) {
      this.fetchProjetDetails(projetId);
    } else {
      this.errorMessage = 'No project ID provided';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No project ID provided in the URL.',
      });
    }
  }

  ngAfterViewInit() {
    // Initial check after view init
    if (this.projet && !this.loading) {
      this.renderChartsWithRetry();
    }
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
        this.investorId = response.id;
        if (response.role !== 'INVESTOR') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Only investors can view project details.',
          });
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('Failed to fetch user profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user profile.',
        });
        this.router.navigate(['/signin']);
      },
    });
  }

  async fetchProjetDetails(projetId: number) {
    this.loading = true;
    this.errorMessage = '';

    try {
      const projetResponse = await axios.get(`http://localhost:8085/api/projets/GetProjet/${projetId}`);
      this.projet = projetResponse.data;

      if (this.investorId) {
        const investmentResponse = await axios.get(`http://localhost:8085/api/investment-requests/investor/${this.investorId}`);
        const investments = investmentResponse.data;
        this.investment = investments.find((inv: any) => inv.projet?.id === projetId && inv.status === 'ACCEPTED');

        if (!this.investment) {
          this.errorMessage = 'No accepted investment found for this project.';
        }
      } else {
        this.errorMessage = 'User not authenticated. Investment details unavailable.';
      }

      // Trigger change detection and render charts after data is ready
      this.cdr.detectChanges();
      this.renderChartsWithRetry();
    } catch (error) {
      console.error('Error fetching project or investment details:', error);
      this.errorMessage = 'Failed to load project details. Please try again later.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load project details: ',
      });
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // Ensure loading state updates
    }
  }

  calculateROI(): number {
    if (!this.projet || !this.investment) return 0;
    const currentValue = this.projet.revenue * 0.1;
    return (currentValue - this.investment.proposedAmount) / this.investment.proposedAmount;
  }

  renderChartsWithRetry(attempts = 5, delay = 100) {
    if (!this.projet) {
      console.warn('Cannot render charts: projet data is not available.');
      return;
    }

    const revenueCanvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    const fundingCanvas = document.getElementById('fundingChart') as HTMLCanvasElement;

    if (!revenueCanvas || !fundingCanvas) {
      if (attempts > 0) {
        console.warn(`Chart canvases not found in the DOM. Retrying (${attempts} attempts left)...`);
        setTimeout(() => this.renderChartsWithRetry(attempts - 1, delay * 2), delay);
      } else {
        console.error('Failed to render charts: Canvas elements not found after retries.');
      }
      return;
    }

    // Revenue Chart
    new Chart(revenueCanvas, {
      type: 'bar',
      data: {
        labels: ['Current Revenue'],
        datasets: [{
          label: 'Revenue ($)',
          data: [this.projet.revenue || 0],
          backgroundColor: '#0A4955',
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { position: 'top' } }, 
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } 
      }
    });

    // Funding Progress Chart
    new Chart(fundingCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Raised', 'Remaining'],
        datasets: [{
          data: [
            this.projet.investmentRequests?.reduce((sum: number, inv: any) => sum + (inv.status === 'ACCEPTED' ? inv.proposedAmount : 0), 0) || 0,
            this.projet.fundingGoal - (this.projet.investmentRequests?.reduce((sum: number, inv: any) => sum + (inv.status === 'ACCEPTED' ? inv.proposedAmount : 0), 0) || 0) || 0
          ],
          backgroundColor: ['#E44D62', '#EA7988'],
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { position: 'top' }, 
          tooltip: { callbacks: { label: (context) => `${context.label}: $${context.raw}` } } 
        } 
      }
    });

    console.log('Charts successfully rendered.');
  }

  goBack() {
    this.router.navigate(['/investor-startups']);
  }
}