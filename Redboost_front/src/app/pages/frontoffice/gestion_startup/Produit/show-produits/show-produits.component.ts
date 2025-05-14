import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../produit.service';
import { Produit } from '../../../../../models/Produit';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-show-produits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-produits.component.html',
  styleUrls: ['./show-produits.component.scss'],
})
export class ShowProduitsComponent implements OnInit {
  produits: Produit[] = [];
  newProduit: Produit = this.resetProduit();
  editingProduit: Produit | null = null;
  projetId: number = 0;
  errorMessage: string = '';
  successMessage: string = '';
  showAddModal: boolean = false;
  selectedFile: File | null = null;
  isLoading: boolean = false;
  defaultCategories: string[] = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  selectedCategory: string = '';
  showCustomCategory: boolean = false;

  constructor(
    private produitService: ProduitService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      console.log('Route params:', params.keys, 'ID:', id);
      this.projetId = id ? Number(id) : 0;
      console.log('Set Projet ID:', this.projetId);

      if (this.projetId <= 0) {
        this.errorMessage = 'Invalid project ID. Please ensure you are accessing a valid project.';
        console.warn('Invalid projetId, redirecting to home');
        this.router.navigate(['/affiche-projet']);
        return;
      }

      const accessToken = localStorage.getItem('accessToken');
      console.log('Access Token at ngOnInit:', accessToken ? 'Present' : 'Missing');
      if (!accessToken) {
        console.log('No access token found, redirecting to signin');
        this.errorMessage = 'Please log in to view products.';
        this.router.navigate(['/signin']);
        return;
      }

      this.loadProduits();
    });
  }

  loadProduits(): void {
    console.log('Loading products for project ID:', this.projetId);
    this.isLoading = true;
    this.clearMessages();
    this.produitService.getProduitsByProjetId(this.projetId).subscribe({
      next: (produits) => {
        console.log('Products received:', produits);
        this.produits = produits.map((p) => ({
          ...p,
          isFavorite: p.isFavorite ?? false,
          description: p.description ?? '', // Ensure description is included
        }));
        this.isLoading = false;
        if (produits.length === 0) {
          this.errorMessage = 'No products found for this project.';
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.handleError('Failed to load products', err);
        this.isLoading = false;
        if (err.message.includes('Authentication required') || err.message.includes('Redirected to login')) {
          console.log('Authentication error detected, redirecting to signin');
          this.errorMessage = 'Session expired. Please log in again.';
          this.router.navigate(['/signin']);
        } else if (err.message.includes('HTTP 404') || err.message.includes('Projet not found')) {
          this.errorMessage = 'Project not found or no products available.';
          this.router.navigate(['/affiche-projet']);
        } else {
          this.errorMessage = 'An unexpected error occurred while loading products.';
        }
      },
      complete: () => {
        console.log('Product loading subscription completed');
        this.isLoading = false;
      }
    });
  }

  openAddModal(): void {
    if (this.projetId <= 0) {
      this.errorMessage = 'Cannot add product: Invalid project ID';
      console.warn('Attempted to open add modal with invalid projetId:', this.projetId);
      return;
    }
    this.showAddModal = true;
    this.newProduit = this.resetProduit();
    this.selectedCategory = '';
    this.showCustomCategory = false;
    this.selectedFile = null;
    this.clearMessages();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.clearForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        console.log('Selected file:', file.name);
      } else {
        this.errorMessage = 'Please select a valid image file';
        this.selectedFile = null;
      }
    }
  }

  onCategoryChange(): void {
    console.log('Selected category:', this.selectedCategory);
    if (this.selectedCategory === 'other') {
      this.showCustomCategory = true;
      this.newProduit.categorie = '';
      if (this.editingProduit) {
        this.editingProduit.categorie = '';
      }
    } else {
      this.showCustomCategory = false;
      this.newProduit.categorie = this.selectedCategory;
      if (this.editingProduit) {
        this.editingProduit.categorie = this.selectedCategory;
      }
    }
  }

  createProduit(): void {
    console.log('Attempting to create product:', this.newProduit, 'Projet ID:', this.projetId);
    if (!this.isValidProduit(this.newProduit) || this.projetId <= 0) {
      this.errorMessage = 'Please fill all required fields correctly and ensure a valid project ID';
      console.log('Validation failed:', this.newProduit, this.projetId);
      return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData(this.newProduit);
    console.log('FormData prepared for submission');

    this.produitService.createProduit(this.projetId, formData).subscribe({
      next: (produit) => {
        console.log('Product created successfully:', produit);
        this.produits.push({ ...produit, isFavorite: false });
        if (this.showCustomCategory && this.newProduit.categorie) {
          this.defaultCategories.push(this.newProduit.categorie);
        }
        this.successMessage = 'Product added successfully';
        this.isLoading = false;
        this.closeAddModal();
      },
      error: (err) => {
        this.handleError('Failed to add product', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  editProduit(produit: Produit): void {
    if (!produit.id) {
      this.errorMessage = 'Cannot edit product: Invalid product ID';
      console.warn('Invalid product ID for edit:', produit);
      return;
    }
    this.editingProduit = { ...produit };
    this.selectedCategory = this.defaultCategories.includes(produit.categorie)
      ? produit.categorie
      : 'other';
    this.showCustomCategory = this.selectedCategory === 'other';
    this.selectedFile = null;
    this.clearMessages();
  }

  updateProduit(): void {
    if (!this.editingProduit || !this.isValidProduit(this.editingProduit) || !this.editingProduit.id) {
      this.errorMessage = 'Please fill all required fields correctly and ensure a valid product ID';
      console.warn('Invalid product for update:', this.editingProduit);
      return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData(this.editingProduit);
    this.produitService.updateProduit(this.editingProduit.id, formData).subscribe({
      next: (updatedProduit) => {
        const index = this.produits.findIndex((p) => p.id === updatedProduit.id);
        if (index !== -1) {
          this.produits[index] = { ...updatedProduit, isFavorite: this.produits[index].isFavorite };
        }
        if (
          this.showCustomCategory &&
          this.editingProduit?.categorie &&
          !this.defaultCategories.includes(this.editingProduit.categorie)
        ) {
          this.defaultCategories.push(this.editingProduit.categorie);
        }
        this.successMessage = 'Product updated successfully';
        this.isLoading = false;
        this.editingProduit = null;
      },
      error: (err) => {
        this.handleError('Failed to update product', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  deleteProduit(id: number | undefined): void {
    if (!id) {
      this.errorMessage = 'Cannot delete product: Invalid product ID';
      console.warn('Invalid product ID for delete:', id);
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) return;

    this.isLoading = true;
    this.produitService.deleteProduit(id).subscribe({
      next: () => {
        this.produits = this.produits.filter((p) => p.id !== id);
        this.successMessage = 'Product deleted successfully';
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Failed to delete product', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  toggleFavorite(produit: Produit): void {
    produit.isFavorite = !produit.isFavorite;
  }

  buyProduit(produit: Produit): void {
    console.log(`Added ${produit.name} to cart at $${produit.price}`);
    this.successMessage = `${produit.name} added to cart!`;
  }

  private isValidProduit(produit: Produit): boolean {
    const isValid = !!produit.name && produit.price > 0 && !!produit.categorie;
    console.log('Validation check:', {
      name: !!produit.name,
      price: produit.price > 0,
      categorie: !!produit.categorie,
      isValid,
    });
    return isValid;
  }

  private prepareFormData(produit: Produit): FormData {
    const formData = new FormData();
    const produitData = {
      name: produit.name,
      description: produit.description || '', // Include description
      price: produit.price,
      categorie: produit.categorie,
      stock: produit.stock || 0,
      ventes: produit.ventes || 0,
      poids: produit.poids || 0,
      dateExpiration: produit.dateExpiration || '',
    };
    console.log('Produit data for FormData:', produitData);
    formData.append('produit', new Blob([JSON.stringify(produitData)], { type: 'application/json' }));
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    return formData;
  }

  private handleError(message: string, err: any): void {
    console.error('Error details:', err);
    this.errorMessage = `${message}: ${err.message || 'Unknown error'}`;
    this.successMessage = '';
    this.isLoading = false;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearForm(): void {
    this.newProduit = this.resetProduit();
    this.selectedFile = null;
    this.selectedCategory = '';
    this.showCustomCategory = false;
    this.clearMessages();
  }

  private resetProduit(): Produit {
    return new Produit('', 0, 0, 0, 0, '', '', ''); // Include empty description
  }
}