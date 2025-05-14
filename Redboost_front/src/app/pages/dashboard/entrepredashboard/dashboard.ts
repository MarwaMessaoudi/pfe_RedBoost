import { Component } from '@angular/core';
import { MaturityLevelComponent } from './components/maturityLevel';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { CalendarComponent } from './components/calendarwidget';
import { KpiCardsComponent } from './components/kpiCards';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [BestSellingWidget, RevenueStreamWidget, CalendarComponent, KpiCardsComponent],
    template: `
        <div class="grid grid-cols-12 gap-8 p-8">
            <div class="col-span-12">
                <app-kpi-cards />
            </div>
            <div class="col-span-12 lg:col-span-6">
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 lg:col-span-6">
                <app-revenue-stream-widget />
            </div>
            <div class="col-span-12 ">
                <calendar-component class="mt-8" />
            </div>
        </div>
    `
})
export class Dashboard {}
