import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ResourceService, Category, Guide } from '../../service/ressource.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <div class="resources-container">
      <button
        pButton
        pRipple
        class="back-to-landing-btn"
        (click)="navigateToLanding()"
        title="Back to Landing Page"
      >
        <i class="pi pi-arrow-left"></i>
      </button>
      <h1>Resources</h1>
      <p class="subtitle">Explore our collection of resources to help you succeed in your projects.</p>

      <div class="layout-container">
        <!-- Categories Sidebar -->
        <div class="categories-sidebar">
          <h2>Categories</h2>
          <ul>
            <li
              *ngFor="let category of categories"
              [class.active]="selectedCategory?.id === category.id"
              (click)="selectCategory(category)"
            >
              {{ category.title }}
            </li>
            <li *ngIf="categories.length === 0" class="no-categories">
              No categories available.
            </li>
          </ul>
        </div>

        <!-- Guides Grid -->
        <div class="guides-grid">
          <p-card
            *ngFor="let guide of guides"
            [header]="guide.title"
            class="guide-card"
          >
            <div class="card-content-wrapper">
              <p>{{ guide.description }}</p>
              <div class="card-footer">
                <button
                  pButton
                  pRipple
                  label="Télécharger guide"
                  class="p-button-raised p-button-rounded learn-more-btn"
                  (click)="navigateToGuide(guide.file)"
                ></button>
              </div>
            </div>
          </p-card>
          <p *ngIf="guides.length === 0" class="no-guides">
            No guides available for this category.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resources-container {
      padding: 120px 20px 40px 20px;
      max-width: 1400px;
      margin: 0 auto;
      text-align: center;
      position: relative; /* Added for absolute positioning of button */
    }

    .back-to-landing-btn {
      position: absolute;
      top: 80px; /* Adjusted to account for fixed topbar */
      left: 20px;
      background: #568086;
      border: none;
      padding: 8px;
      border-radius: 50%;
      color: #ffffff;
      transition: all 0.3s ease;
    }

    .back-to-landing-btn:hover {
      background: #0A4955;
      transform: translateY(-2px);
      box-shadow: 0 3px 8px ;
      color: #ffffff;
    }

    .back-to-landing-btn .pi {
      font-size: 1.2rem;
    }

    h1 {
      color: #DB1E37;
      font-size: 2.5rem;
      margin-bottom: 10px;
      position: relative;
      display: inline-block;
    }

    h1::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background-color: #DB1E37;
      border-radius: 2px;
    }

    .subtitle {
      color: #555;
      font-size: 1.2rem;
      margin-bottom: 40px;
    }

    .layout-container {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }

    .categories-sidebar {
      flex: 0 0 250px;
      text-align: left;
    }

    .categories-sidebar h2 {
      color: #0A4955;
      font-size: 1.8rem;
      margin-bottom: 20px;
    }

    .categories-sidebar ul {
      list-style: none;
      padding: 0;
    }

    .categories-sidebar li {
      padding: 10px 15px;
      cursor: pointer;
      font-size: 1.1rem;
      color: #333;
      border-radius: 5px;
      margin-bottom: 5px;
      transition: background-color 0.3s ease;
    }

    .categories-sidebar li:hover {
      background-color: #e0e7ff;
    }

    .categories-sidebar li.active {
      background-color: #DB1E37;
      color: white;
    }

    .no-categories {
      color: #555;
      font-style: italic;
    }

    .guides-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 20px;
      padding: 0 10px;
      justify-items: center;
    }

    .guide-card {
      transition: all 0.3s ease;
      border-radius: 10px;
      overflow: hidden;
      width: 280px;
      height: 200px;
      display: flex;
      align-items: center;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border: 2px solid #e0e0e0;
    }

    .guide-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      border-color: #568086;
    }

    .guide-card .p-card-header {
      background: transparent;
      padding: 15px;
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: bold;
      color: #0A4955;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      border-bottom: none;
    }

    .card-content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-grow: 1;
      padding: 15px;
      text-align: center;
    }

    .guide-card .p-card-body {
      margin-top: 0;
      padding: 0;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .guide-card .p-card-content p {
      color: #444;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 10px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      font-family: 'Roboto', sans-serif;
      font-weight: 400;
      flex-grow: 1;
    }

    .card-footer {
      margin-top: auto;
      padding: 0;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .learn-more-btn {
      background: #568086;
      border: none;
      padding: 8px 20px;
      font-size: 0.9rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      border-radius: 25px;
      color: #ffffff;
      transition: all 0.3s ease;
    }

    .learn-more-btn:hover {
      background: #0A4955;
      transform: translateY(-2px);
      box-shadow: 0 3px 8px;
      color: #ffffff;
    }
  `]
})
export class ResourcesComponent implements OnInit {
  categories: Category[] = [];
  guides: Guide[] = [];
  selectedCategory: Category | null = null;

  constructor(private resourceService: ResourceService, private router: Router) {}

  ngOnInit() {
    this.loadCategories();
    this.loadAllGuides();
  }

  loadCategories() {
    this.resourceService.getCategories().subscribe({
      next: (categories) => {
        console.log('Fetched categories:', categories);
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.categories = [];
        alert('Failed to load categories. Please try again later.');
      }
    });
  }

  loadAllGuides() {
    this.resourceService.getGuides().subscribe({
      next: (guides) => {
        this.guides = guides;
      },
      error: (err) => {
        console.error('Error fetching guides:', err);
      }
    });
  }

  selectCategory(category: Category) {
    this.selectedCategory = category;
    this.resourceService.getGuidesByCategory(category.id).subscribe({
      next: (guides) => {
        this.guides = guides;
      },
      error: (err) => {
        console.error('Error fetching guides for category:', err);
      }
    });
  }

  navigateToGuide(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }

  navigateToLanding() {
    this.router.navigate(['/landing']);
  }
}