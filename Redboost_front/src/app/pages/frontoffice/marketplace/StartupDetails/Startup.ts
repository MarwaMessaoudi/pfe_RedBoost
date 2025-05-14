import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Added HttpClient and HttpHeaders
import { Chart } from 'chart.js/auto';
import axios from 'axios';
import { MessageService } from 'primeng/api'; // Added MessageService

@Component({
  selector: 'app-startup-details',
  standalone: true,
  imports: [CommonModule],
  providers: [MessageService], // Added MessageService to providers
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Hero Section -->
      <section class="relative bg-gradient-to-r from-[#EA7988] to-[#FF8B79] text-white py-20">
        <div class="container mx-auto px-6 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-4">{{ projet?.name || 'Project Details' }}</h1>
          <p class="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            {{ projet?.description || 'An innovative project aimed to revolutionize the industry.' }}
          </p>
          <button (click)="goBack()" class="mt-8 px-8 py-3 bg-[#0A4955] text-lg font-semibold rounded-full shadow-lg hover:bg-[#245C67] transition-all">
            ← Back to Investments
          </button>
        </div>
      </section>

      <!-- Main Content Section -->
      <main class="container mx-auto px-6 -mt-12 pb-20">
        <!-- Project Overview -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 class="text-3xl font-semibold text-[#245C67] text-center mb-6">Project Overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-[#568086] text-center">
            <div class="p-4">
              <p class="font-medium">Sector</p>
              <p class="text-lg">{{ projet?.sector || 'N/A' }}</p>
            </div>
            <div class="p-4">
              <p class="font-medium">Location</p>
              <p class="text-lg">{{ projet?.location || 'N/A' }}</p>
            </div>
            <div class="p-4">
              <p class="font-medium">Founded</p>
              <p class="text-lg">{{ projet?.creationDate || 'N/A' }}</p>
            </div>
            <div class="p-4">
              <p class="font-medium">Team Size</p>
              <p class="text-lg">{{ projet?.numberOfEmployees || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Financial Overview -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 class="text-2xl font-semibold text-[#245C67] text-center mb-6">Financial Overview</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="p-6 bg-[#A0CED9] rounded-lg text-center">
              <h4 class="text-lg font-medium text-[#245C67] mb-2">Revenue</h4>
              <p class="text-2xl font-bold">{{ projet?.revenue | currency }}</p>
            </div>
            <div class="p-6 bg-[#568086] rounded-lg text-center">
              <h4 class="text-lg font-medium text-[#EA7988] mb-2">Funding Goal</h4>
              <p class="text-2xl font-bold">{{ projet?.fundingGoal | currency }}</p>
            </div>
          </div>
        </div>

        <!-- Investor Information -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-12" *ngIf="investment && currentUser">
          <h3 class="text-2xl font-semibold text-[#245C67] text-center mb-6">Your Investment</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="p-6 bg-[#A0CED9] rounded-lg text-center">
              <h4 class="text-lg font-medium text-[#245C67] mb-2">Invested Amount</h4>
              <p class="text-2xl font-bold">{{ investment?.proposedAmount | currency }}</p>
            </div>
            <div class="p-6 bg-[#568086] rounded-lg text-center">
              <h4 class="text-lg font-medium text-[#E44D62] mb-2">Equity Stake</h4>
              <p class="text-2xl font-bold">{{ investment?.equityPercentage || 0 }}%</p>
            </div>
            <div class="p-6 bg-[#E88D9A] rounded-lg text-center">
              <h4 class="text-lg font-medium text-[#DB1E37] mb-2">Current ROI</h4>
              <p class="text-2xl font-bold">{{ calculateROI() | percent:'1.2-2' }}</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h4 class="text-xl font-semibold text-[#245C67] mb-6 text-center">Revenue</h4>
            <canvas id="revenueChart" class="w-full h-64"></canvas>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h4 class="text-xl font-semibold text-[#245C67] mb-6 text-center">Funding Progress</h4>
            <canvas id="fundingChart" class="w-full h-64"></canvas>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="text-center text-[#E44D62] mt-12 text-lg">
          {{ errorMessage }}
        </div>
      </main>

      <!-- Footer Section -->
      <footer class="bg-[#0A4955] text-white py-8 text-center">
        <p>© 2025 {{ projet?.name || 'Startup' }}. All Rights Reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    canvas {
      max-height: 300px;
    }
    .shadow-lg {
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    .rounded-full {
      border-radius: 9999px;
    }
  `]
})
export class StartupDetailsComponent implements OnInit {
  projet: any = null;
  investment: any = null;
  investorId: number | null = null; // Changed to null initially
  loading: boolean = false;
  errorMessage: string = '';
  currentUser: any = null; // Added currentUser property

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient, // Added HttpClient
    private messageService: MessageService // Added MessageService
  ) {}

  ngOnInit() {
    this.fetchCurrentUser(); // Fetch user first
    const projetId = +this.route.snapshot.paramMap.get('id')!;
    if (projetId) {
      this.fetchProjetDetails(projetId);
    } else {
      this.errorMessage = 'No project ID provided';
    }
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
            detail: 'Only investors can view investment details.',
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

      setTimeout(() => this.renderCharts(), 0);
    } catch (error) {
      console.error('Error fetching project or investment details:', error);
      this.errorMessage = 'Failed to load project details. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  calculateROI(): number {
    if (!this.projet || !this.investment) return 0;
    const currentValue = this.projet.revenue * 0.1; // Simplified ROI calculation
    return (currentValue - this.investment.proposedAmount) / this.investment.proposedAmount;
  }

  renderCharts() {
    if (!this.projet) return;

    new Chart(document.getElementById('revenueChart') as HTMLCanvasElement, {
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

    new Chart(document.getElementById('fundingChart') as HTMLCanvasElement, {
      type: 'doughnut',
      data: {
        labels: ['Raised', 'Remaining'],
        datasets: [{
          data: [
            this.projet.investmentRequests?.reduce((sum: number, inv: any) => sum + (inv.status === 'ACCEPTED' ? inv.proposedAmount : 0), 0) || 0,
            this.projet.fundingGoal - (this.projet.investmentRequests?.reduce((sum: number, inv: any) => sum + (inv.status === 'ACCEPTED' ? inv.proposedAmount : 0), 0) || 0)
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
  }

  goBack() {
    this.router.navigate(['/investor-startups']);
  }
}