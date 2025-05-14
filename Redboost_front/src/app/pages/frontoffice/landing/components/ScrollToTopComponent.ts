import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule], // For *ngIf
  template: `
    <button
      *ngIf="isVisible"
      (click)="scrollToTop()"
      class="fixed bottom-8 right-8 p-4 bg-gradient-to-r 
             from-[#034A55] to-[#C8223A] text-white rounded-full 
             shadow-2xl hover:bg-gray-800 transition duration-600 
             ease-in-out hover:scale-105 hover:-translate-x-2 
             hover:-translate-y-2 hover:shadow-2xl"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  `,
  styles: [`
    button {
      position: fixed;
      bottom: 8px;
      right: 8px;
      padding: 1rem;
      background: linear-gradient(to right, #034A55, #C8223A);
      color: white;
      border-radius: 9999px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transition: all 0.6s ease-in-out;
    }
    button:hover {
      background:linear-gradient(to right, #C8223A, #034A55);
      transform: scale(1.05) translateX(-0.5rem) translateY(-0.5rem);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    svg {
      width: 1.5rem;
      height: 1.5rem;
    }
  `]
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  isVisible: boolean = false;

  ngOnInit() {
    // No need to add event listener here; we'll use @HostListener instead
  }

  ngOnDestroy() {
    // Cleanup is handled automatically with @HostListener, but we'll keep this for clarity
  }

  // Listen to the scroll event on the window
  @HostListener('window:scroll', [])
  toggleVisibility() {
    this.isVisible = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}