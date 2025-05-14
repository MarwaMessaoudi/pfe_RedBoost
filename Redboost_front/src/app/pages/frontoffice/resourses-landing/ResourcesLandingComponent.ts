import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ResourceService, Category, Guide } from '../service/ressource.service';

@Component({
  selector: 'app-resources-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListboxModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
  ],
  template: `
    <div class="resources-container">
      <div class="resources-grid">
        <!-- Categories Section -->
        <div class="categories-section">
          <div class="section-header">
            <h2>Categories</h2>
            <p-button
              icon="pi pi-plus"
              class="add-btn"
              (click)="showAddCategoryDialog()"
            ></p-button>
          </div>
          <p-listbox
            [options]="categories"
            [(ngModel)]="selectedCategory"
            optionLabel="title"
            optionValue="id"
            (onChange)="loadGuides()"
            [style]="{ width: '100%', 'border-radius': '8px' }"
            class="category-listbox"
          >
            <ng-template let-category pTemplate="item">
              <div class="category-item">
                <span>{{ category.title }}</span>
                <i
                  class="pi pi-trash delete-icon"
                  (click)="deleteCategory(category.id)"
                  title="Delete Category"
                ></i>
              </div>
            </ng-template>
          </p-listbox>
        </div>

        <!-- Guides Section -->
        <div class="guides-section">
          <div class="section-header">
            <h2>Guides {{ selectedCategory ? 'in ' + getSelectedCategoryName() : '' }}</h2>
            <p-button
         
              icon="pi pi-plus"
              class="add-btn"
              (click)="showAddGuideDialog()"
            ></p-button>
          </div>
          <div class="guides-grid" *ngIf="guides.length > 0; else noGuides">
            <p-card *ngFor="let guide of guides" class="guide-card">
              <div class="guide-actions">
                <i
                  class="pi pi-pencil edit-icon"
                  (click)="showEditGuideDialog(guide)"
                  title="Edit Guide"
                ></i>
                <i
                  class="pi pi-trash delete-icon"
                  (click)="deleteGuide(guide.id)"
                  title="Delete Guide"
                ></i>
              </div>
              <div class="guide-content">
                <h3>{{ guide.title }}</h3>
                <p>{{ guide.description }}</p>
                <p-button
                  label="Download"
                  icon="pi pi-download"
                  class="download-btn"
                  (click)="downloadGuide(guide.id)"
                ></p-button>
              </div>
            </p-card>
          </div>
          <ng-template #noGuides>
            <p class="no-guides">No guides available for this category.</p>
          </ng-template>
        </div>
      </div>

      <!-- Add Category Dialog -->
      <p-dialog
        header="Add New Category"
        [(visible)]="displayAddCategoryDialog"
        [modal]="true"
        [style]="{ width: '450px', 'border-radius': '12px' }"
        class="dialog"
      >
        <div class="form-group">
          <label for="newCategoryTitle">Category Title</label>
          <input
            pInputText
            id="newCategoryTitle"
            [(ngModel)]="newCategory.title"
            placeholder="Enter category title"
            class="full-width"
          />
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            (click)="displayAddCategoryDialog = false"
            styleClass="p-button-text p-button-secondary"
          ></p-button>
          <p-button
            label="Add"
            icon="pi pi-check"
            (click)="addCategory()"
            styleClass="p-button-raised p-button-success"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Add/Edit Guide Dialog -->
      <p-dialog
        [header]="isEditMode ? 'Edit Guide' : 'Add New Guide'"
        [(visible)]="displayAddGuideDialog"
        [modal]="true"
        [style]="{ width: '600px', 'border-radius': '12px' }"
        class="dialog"
      >
        <div class="form-grid">
          <div class="form-group">
            <label for="guideTitle">Guide Title</label>
            <input
              pInputText
              id="guideTitle"
              [(ngModel)]="newGuide.title"
              placeholder="Enter guide title"
              class="full-width"
            />
          </div>

          <div class="form-group">
            <label for="guideDescription">Description</label>
            <textarea
              id="guideDescription"
              [(ngModel)]="newGuide.description"
              placeholder="Enter guide description"
              rows="4"
              class="full-width"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="category">Category</label>
            <p-dropdown
              id="category"
              [options]="categories"
              [(ngModel)]="newGuide.categoryId"
              optionLabel="title"
              optionValue="id"
              placeholder="Select a category"
              class="full-width"
            ></p-dropdown>
          </div>

          <div class="form-group">
            <label for="guideFile">Guide File</label>
            <input
              type="file"
              id="guideFile"
              (change)="onFileSelect($event)"
              class="file-input"
              accept=".pdf,.doc,.docx"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            (click)="displayAddGuideDialog = false"
            styleClass="p-button-text p-button-secondary"
          ></p-button>
          <p-button
            [label]="isEditMode ? 'Update Guide' : 'Add Guide'"
            icon="pi pi-check"
            (click)="isEditMode ? updateGuide() : addGuide()"
            styleClass="p-button-raised p-button-success"
            [disabled]="!newGuide.title || !newGuide.description || !newGuide.categoryId || (!selectedFile && !isEditMode)"
          ></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Inter', sans-serif;
    }

    .resources-container {
      padding: 100px 30px 50px 30px;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #e6f0fa 0%, #f0f4f8 100%);
      min-height: 100vh;
    }

    .resources-grid {
      display: grid;
      grid-template-columns: 1fr 3fr;
      gap: 30px;
      align-items: start;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    h2 {
      color: #1e3a8a;
      font-size: 1.6rem;
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .categories-section {
      background: #ffffff;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease;
    }

    .categories-section:hover {
      transform: translateY(-3px);
    }

    .category-listbox {
      border: 1px solid #d1d5db !important;
      border-radius: 8px !important;
      transition: border-color 0.3s ease;
    }

    .category-listbox:hover {
      border-color: #568086 !important;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .category-item span {
      color: #568086;
    }

    .delete-icon {
      color: #ef4444;
      cursor: pointer;
      transition: color 0.3s ease;
      margin-left: 20px; /* Increased margin to push the icon further to the right */
    }

    .delete-icon:hover {
      color: #dc2626;
    }

    .edit-icon {
      color: #EA7988;
      cursor: pointer;
      transition: color 0.3s ease;
    }

    .edit-icon:hover {
      color: #E44D62;
    }

    .add-btn {
      background: #0A4955; /* Dark teal as requested */
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .add-btn:hover {
      background: #0d9488;
      transform: rotate(90deg);
    }

    .guides-section {
      padding: 25px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease;
    }

    .guides-section:hover {
      transform: translateY(-3px);
    }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .guide-card {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .guide-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
    }

    .guide-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 10px;
    }

    .guide-content {
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .guide-content h3 {
      color: #1e3a8a;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
    }

    .guide-content p {
      color: #6b7280;
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.5;
    }

    .download-btn {
      align-self: flex-start;
      background: #568086;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      transition: background 0.3s ease;
    }

    .download-btn:hover {
      background: #0A4955;
    }

    .no-guides {
      color: #9ca3af;
      text-align: center;
      font-size: 1rem;
      margin-top: 30px;
      font-style: italic;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #1e3a8a;
      font-weight: 500;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .form-grid {
      display: grid;
      gap: 20px;
    }

    .full-width {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .full-width:focus {
      border-color: #14b8a6;
      outline: none;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }

    .file-input {
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      width: 100%;
    }

    .dialog {
      border-radius: 12px !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 1024px) {
      .resources-grid {
        grid-template-columns: 1fr;
      }

      .categories-section,
      .guides-section {
        padding: 20px;
      }
    }

    @media (max-width: 768px) {
      .resources-container {
        padding: 80px 20px 40px 20px;
      }

      .guides-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResourcesLandingComponent implements OnInit {
  categories: Category[] = [];
  selectedCategory: number | null = null;
  guides: Guide[] = [];
  displayAddCategoryDialog: boolean = false;
  displayAddGuideDialog: boolean = false;
  newCategory: { title: string } = { title: '' };
  newGuide: { id?: number; title: string; description: string; categoryId: number | null } = {
    title: '',
    description: '',
    categoryId: null
  };
  selectedFile: File | null = null;
  isEditMode: boolean = false;

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.resourceService.getCategories().subscribe(categories => {
      this.categories = categories;
      if (categories.length > 0 && !this.selectedCategory) {
        this.selectedCategory = categories[0].id;
        this.loadGuides();
      }
    });
  }

  loadGuides() {
    if (this.selectedCategory) {
      this.resourceService.getGuidesByCategory(this.selectedCategory).subscribe(guides => {
        this.guides = guides;
      });
    } else {
      this.guides = [];
    }
  }

  showAddCategoryDialog() {
    this.newCategory = { title: '' };
    this.displayAddCategoryDialog = true;
  }

  showAddGuideDialog() {
    this.isEditMode = false;
    this.newGuide = { title: '', description: '', categoryId: null };
    this.selectedFile = null;
    this.displayAddGuideDialog = true;
  }

  showEditGuideDialog(guide: Guide) {
    this.isEditMode = true;
    this.newGuide = {
      id: guide.id,
      title: guide.title,
      description: guide.description,
      categoryId: guide.categoryId
    };
    this.selectedFile = null;
    this.displayAddGuideDialog = true;
  }

  addCategory() {
    if (this.newCategory.title.trim()) {
      this.resourceService.addCategory(this.newCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.displayAddCategoryDialog = false;
          alert('Category added successfully!');
        },
        error: (err) => {
          alert('Failed to add category: ' + err.message);
        }
      });
    } else {
      alert('Please enter a category title.');
    }
  }

  deleteCategory(categoryId: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.resourceService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.loadCategories();
          if (this.selectedCategory === categoryId) {
            this.selectedCategory = null;
            this.guides = [];
          }
          alert('Category deleted successfully!');
        },
        error: (err) => {
          alert('Failed to delete category: ' + err.message);
        }
      });
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  addGuide() {
    if (this.newGuide.title && this.newGuide.description && this.newGuide.categoryId && this.selectedFile) {
      const guideData = {
        title: this.newGuide.title,
        description: this.newGuide.description,
        categoryId: this.newGuide.categoryId,
        file: this.selectedFile
      };

      this.resourceService.addGuide(guideData).subscribe({
        next: () => {
          alert('Guide added successfully!');
          this.displayAddGuideDialog = false;
          this.loadGuides();
        },
        error: (err) => {
          alert('Failed to add guide: ' + err.message);
        }
      });
    } else {
      alert('Please fill all required fields and select a file.');
    }
  }

  updateGuide() {
    if (this.newGuide.title && this.newGuide.description && this.newGuide.categoryId && this.newGuide.id) {
      const guideData = {
        id: this.newGuide.id,
        title: this.newGuide.title,
        description: this.newGuide.description,
        categoryId: this.newGuide.categoryId,
        file: this.selectedFile ?? null
      };

      this.resourceService.updateGuide(guideData).subscribe({
        next: () => {
          alert('Guide updated successfully!');
          this.displayAddGuideDialog = false;
          this.loadGuides();
        },
        error: (err) => {
          alert('Failed to update guide: ' + err.message);
        }
      });
    } else {
      alert('Please fill all required fields.');
    }
  }

  deleteGuide(guideId: number) {
    if (confirm('Are you sure you want to delete this guide?')) {
      this.resourceService.deleteGuide(guideId).subscribe({
        next: () => {
          alert('Guide deleted successfully!');
          this.loadGuides();
        },
        error: (err) => {
          alert('Failed to delete guide: ' + err.message);
        }
      });
    }
  }

  getSelectedCategoryName(): string {
    const category = this.categories.find(cat => cat.id === this.selectedCategory);
    return category ? category.title : '';
  }

  downloadGuide(guideId: number) {
    window.open(`${this.resourceService['apiUrl']}/guides/download/${guideId}`, '_blank');
  }
}