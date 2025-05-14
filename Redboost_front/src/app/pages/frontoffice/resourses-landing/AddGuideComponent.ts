import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ResourceService, Category, Guide } from '../service/ressource.service';

@Component({
  selector: 'app-add-guide',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    InputTextModule,
  ],
  template: `
    <div class="add-guide-container">
      <p-card header="Add New Guide" class="add-guide-card">
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
              pInputTextarea
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

          <div class="button-group">
            <p-button
              label="Cancel"
              icon="pi pi-times"
              (click)="cancel()"
              styleClass="p-button-text p-button-secondary"
            ></p-button>
            <p-button
              label="Add Guide"
              icon="pi pi-check"
              (click)="addGuide()"
              styleClass="p-button-raised p-button-success"
              [disabled]="!newGuide.title || !newGuide.description || !newGuide.categoryId || !selectedFile"
            ></p-button>
          </div>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Inter', sans-serif;
    }

    .add-guide-container {
      padding: 100px 30px 50px 30px;
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
      min-height: 100vh;
    }

    .add-guide-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      padding: 20px;
      background: #ffffff;
    }

    .form-grid {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      color: #1a2b49;
      font-weight: 500;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .full-width {
      width: 100%;
      border: 1px solid #e0e6ed;
      border-radius: 6px;
      padding: 10px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .full-width:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .file-input {
      padding: 10px;
      border: 1px solid #e0e6ed;
      border-radius: 6px;
      background: #fff;
    }

    .button-group {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .add-guide-container {
        padding: 80px 20px 40px 20px;
      }
    }
  `]
})
export class AddGuideComponent implements OnInit {
  categories: Category[] = [];
  newGuide: { title: string; description: string; categoryId: number | null } = {
    title: '',
    description: '',
    categoryId: null
  };
  selectedFile: File | null = null;

  constructor(private resourceService: ResourceService, private router: Router) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.resourceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        alert('Failed to load categories: ' + (err.error?.message || err.message));
      }
    });
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
          this.router.navigate(['/resources']);
        },
        error: (err) => {
          console.error('Error adding guide:', err);
          const errorMessage = err.error?.message || err.message || 'Unknown error';
          alert(`Failed to add guide: ${errorMessage}`);
        }
      });
    } else {
      alert('Please fill all required fields and select a file.');
    }
  }

  cancel() {
    this.router.navigate(['/resources']);
  }
}