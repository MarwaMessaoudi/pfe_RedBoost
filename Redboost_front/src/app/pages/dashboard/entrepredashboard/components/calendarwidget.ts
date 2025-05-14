import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'calendar-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

      :host {
        font-family: 'Poppins', sans-serif;
        color: #0A4955;
        background: linear-gradient(135deg, #f0f4f8, #e2e8f0);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .container {
        max-width: 1000px;
        width: 100%;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(10, 73, 85, 0.1);
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        animation: fadeIn 0.6s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      h3 {
        margin: 0 0 24px;
        font-size: 28px;
        font-weight: 700;
        color: #0A4955;
        text-align: center;
        letter-spacing: -0.5px;
      }

      .btn-group {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 24px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        background: #0A4955;
        color: white;
        box-shadow: 0 4px 12px rgba(10, 73, 85, 0.2);
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(10, 73, 85, 0.3);
      }

      .btn-outline-secondary {
        background: transparent;
        border: 2px solid #0A4955;
        color: #0A4955;
      }

      .btn-outline-secondary:hover {
        background: #0A4955;
        color: white;
      }

      .btn-danger {
        background: #DB1E37;
        color: white;
      }

      .btn-danger:hover {
        background: #B2182B;
        transform: translateY(-2px);
      }

      .calendar-grid {
        display: grid;
        gap: 12px;
        margin-top: 24px;
      }

      .calendar-grid.month-view {
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-grid.week-view {
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-grid.day-view {
        grid-template-columns: 1fr;
      }

      .calendar-cell {
        border: 1px solid rgba(224, 224, 224, 0.3);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(5px);
        min-height: 100px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .calendar-cell:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(10, 73, 85, 0.1);
      }

      .calendar-cell.header {
        background: linear-gradient(135deg, #0A4955, #0A4955);
        color: white;
        font-weight: bold;
        text-align: center;
        font-size: 14px;
        padding: 12px;
      }

      .calendar-cell .day-number {
        font-size: 16px;
        font-weight: 600;
        color: #0A4955;
        margin-bottom: 8px;
      }

      .event-card {
        background: rgba(245, 245, 245, 0.95);
        border: 1px solid rgba(224, 224, 224, 0.3);
        border-radius: 8px;
        padding: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        transition: all 0.3s ease;
      }

      .event-card:hover {
        background: rgba(224, 224, 224, 0.95);
        transform: translateX(3px);
      }

      .event-card h4 {
        margin: 0;
        font-size: 12px;
        color: #0A4955;
      }

      .event-card p {
        margin: 0;
        color: #718096;
      }

      .active {
        background: #DB1E37 !important;
        color: white !important;
        border-color: #DB1E37 !important;
      }
    `,
  ],
  template: `
    <div class="container">
      <!-- Calendar Section -->
      <div class="calendar-section">
        <div class="row text-center">
          <div class="col-md-4">
            <div class="btn-group">
              <button class="btn btn-primary" (click)="previous()">Précédent</button>
              <button class="btn btn-outline-secondary" (click)="today()">Aujourd'hui</button>
              <button class="btn btn-primary" (click)="next()">Suivant</button>
            </div>
          </div>
          <div class="col-md-4">
            <h3>{{ viewDate | date: 'MMMM y' }}</h3>
          </div>
          <div class="col-md-4">
            <div class="btn-group">
              <button class="btn btn-primary" (click)="setView('month')" [class.active]="view === 'month'">Mois</button>
              <button class="btn btn-primary" (click)="setView('week')" [class.active]="view === 'week'">Semaine</button>
              <button class="btn btn-primary" (click)="setView('day')" [class.active]="view === 'day'">Jour</button>
            </div>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div *ngIf="view === 'month'" class="calendar-grid month-view">
          <div class="calendar-cell header" *ngFor="let day of daysOfWeek">{{ day }}</div>
          <div class="calendar-cell" *ngFor="let day of monthDays">
            <div class="day-number">{{ day | date: 'd' }}</div>
            <div *ngFor="let event of getEventsForDay(day)" class="event-card">
              <h4>{{ event.title }}</h4>
              <p>{{ event.start | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="view === 'week'" class="calendar-grid week-view">
          <div class="calendar-cell header" *ngFor="let day of weekDays">{{ day | date: 'EEE d' }}</div>
          <div class="calendar-cell" *ngFor="let day of weekDays">
            <div *ngFor="let event of getEventsForDay(day)" class="event-card">
              <h4>{{ event.title }}</h4>
              <p>{{ event.start | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="view === 'day'" class="calendar-grid day-view">
          <div class="calendar-cell">
            <div>{{ viewDate | date: 'EEE d' }}</div>
            <div *ngFor="let event of getEventsForDay(viewDate)" class="event-card">
              <h4>{{ event.title }}</h4>
              <p>{{ event.start | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent {
  view: 'month' | 'week' | 'day' = 'month';
  viewDate: Date = new Date();
  refresh = new Subject<void>();

  daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  events: { title: string; start: Date; end: Date }[] = [
    {
      title: 'Tâche 1',
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 2)),
    },
    {
      title: 'Tâche 2',
      start: new Date(new Date().setDate(new Date().getDate() + 1)),
      end: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
  ];

  get monthDays(): Date[] {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, 0 - i));
    }
    days.reverse();

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding for days after the last day of the month
    for (let i = 1; i <= 6 - lastDay.getDay(); i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  get weekDays(): Date[] {
    const startOfWeek = new Date(this.viewDate);
    startOfWeek.setDate(this.viewDate.getDate() - this.viewDate.getDay());
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }

    return days;
  }

  getEventsForDay(day: Date): { title: string; start: Date; end: Date }[] {
    return this.events.filter(
      (event) =>
        event.start.toDateString() === day.toDateString()
    );
  }

  previous(): void {
    const date = new Date(this.viewDate);
    if (this.view === 'month') {
      date.setMonth(date.getMonth() - 1);
    } else if (this.view === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (this.view === 'day') {
      date.setDate(date.getDate() - 1);
    }
    this.viewDate = date;
  }

  today(): void {
    this.viewDate = new Date();
  }

  next(): void {
    const date = new Date(this.viewDate);
    if (this.view === 'month') {
      date.setMonth(date.getMonth() + 1);
    } else if (this.view === 'week') {
      date.setDate(date.getDate() + 7);
    } else if (this.view === 'day') {
      date.setDate(date.getDate() + 1);
    }
    this.viewDate = date;
  }

  setView(view: 'month' | 'week' | 'day'): void {
    this.view = view;
  }
}