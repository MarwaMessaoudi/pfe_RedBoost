import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-investments-table',
  standalone: true,
  imports: [CommonModule, TableModule, ProgressBarModule, TooltipModule],
  template: `
    <div class="table-container">
      <h2 class="table-title">Mes Investissements</h2>
      <p-table [value]="investments" [paginator]="true" [rows]="5" [rowsPerPageOptions]="[5, 10, 20]">
        <ng-template pTemplate="header">
          <tr>
            <th>Startup</th>
            <th>Montant Investi</th>
            <th>ROI</th>
            <th>Progrès de Startup</th>
            <th>Dernière Mise à Jour</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-investment>
          <tr [@fadeIn] class="hover-row">
            <td>{{ investment.startup }}</td>
            <td>{{ investment.amount }} €</td>
            <td>{{ investment.roi }}%</td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill" [ngStyle]="{ width: animatedProgress[investment.startup] + '%', 'background-color': '#DB1E37' }"></div>
              </div>
              <span class="progress-text">{{ animatedProgress[investment.startup] || '0' }}%</span>
            </td>
            <td>{{ investment.lastUpdate | date: 'dd/MM/yyyy' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .table-container {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .table-title {
        color: #0a4955;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
      }

      .progress-bar {
        width: 100%;
        height: 0.5rem;
        background: #e5e7eb;
        border-radius: 0.25rem;
        overflow: hidden;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        border-radius: 0.25rem;
        transition: width 0.5s ease;
      }

      .progress-text {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #4b5563;
      }

      /* Hover effect for table rows */
      .hover-row:hover {
        background-color: #f9fafb; /* Light grey background on hover */
      }
    `,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class InvestmentsTableComponent implements OnInit {
  investments = [
    {
      startup: 'Tech Innovators',
      amount: 200000,
      roi: 22.5,
      progress: 85,
      lastUpdate: new Date('2023-10-15'),
    },
    {
      startup: 'Green Energy Solutions',
      amount: 150000,
      roi: 15.3,
      progress: 60,
      lastUpdate: new Date('2023-09-20'),
    },
    {
      startup: 'HealthTech Pro',
      amount: 300000,
      roi: 18.7,
      progress: 45,
      lastUpdate: new Date('2023-10-01'),
    },
    {
      startup: 'AI Dynamics',
      amount: 250000,
      roi: 12.4,
      progress: 90,
      lastUpdate: new Date('2023-08-10'),
    },
    {
      startup: 'FinTech Leaders',
      amount: 100000,
      roi: 20.1,
      progress: 70,
      lastUpdate: new Date('2023-10-05'),
    },
  ];

  animatedProgress: { [key: string]: number } = {}; // Stores animated progress values

  ngOnInit() {
    this.animateProgressBars();
  }

  // Function to animate progress bars
  animateProgressBars() {
    this.investments.forEach((investment) => {
      this.animateValue(investment.startup, investment.progress);
    });
  }

  // Helper function to animate a value
  animateValue(key: string, targetValue: number) {
    const duration = 2000; // Animation duration in milliseconds
    const increment = targetValue / (duration / 16); // Increment for the progress

    let currentValue = 0;

    const updateAnimation = () => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
      }

      this.animatedProgress[key] = Math.round(currentValue);

      if (currentValue < targetValue) {
        requestAnimationFrame(updateAnimation);
      }
    };

    requestAnimationFrame(updateAnimation);
  }
}