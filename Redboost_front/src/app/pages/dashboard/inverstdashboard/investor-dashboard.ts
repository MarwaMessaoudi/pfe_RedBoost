import { Component } from '@angular/core';
import { InvestorKpisComponent } from './components/investor-kpis.component';
import { InvestmentsTableComponent } from './components/investments-table.component';
import { RoiProgressChartComponent } from './components/roi-progress-chart.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    InvestorKpisComponent,
    InvestmentsTableComponent,
    RoiProgressChartComponent
  ],
  template: `
    <div class="grid grid-cols-12 gap-8 p-8 bg-gray-50 font-poppins">
      <!-- KPIs and Chart on the same line -->
      <div class="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- KPIs Section -->
        <div class="col-span-1">
          <app-investor-kpis />
        </div>

        <!-- ROI Progress Chart -->
        <div class="col-span-1">
          <app-roi-progress-chart />
        </div>
      </div>

      <!-- Investments Table -->
      <div class="col-span-12">
        <app-investments-table />
      </div>
    </div>
  `,
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
      :host {
        font-family: 'Poppins', sans-serif;
      }
    `,
  ],
})
export class InvestorDashboardComponent {}