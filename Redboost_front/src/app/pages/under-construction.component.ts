import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F9FF] to-[#E6F0FA] px-6 relative overflow-hidden">
      <!-- Decorative background elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-[#FF3333]/10 blur-xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-[#1A3C5E]/10 blur-xl"></div>
      </div>

      <div class="text-center max-w-2xl mx-auto relative z-10">
        <!-- Animated Construction Icon -->
        <div class="relative mb-12 mx-auto w-32 h-32 flex items-center justify-center">
          <div class="absolute w-full h-full rounded-full bg-[#1A3C5E]/10 animate-pulse"></div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-[#1A3C5E] animate-rotate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>

        <!-- Message -->
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          <span class="text-[#FF3333]">Fonctionnalité</span> en construction
        </h1>
        <p class="text-xl text-gray-600 leading-relaxed mb-10">
          Nous travaillons activement sur cette fonctionnalité. <br>
          Elle sera disponible prochainement.
        </p>

        <!-- Enhanced Progress Indicator -->
        <div class="max-w-md mx-auto">
          <div class="flex justify-between text-sm text-gray-500 mb-2">
            <span>Début</span>
            <span>Fin</span>
          </div>
          <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-[#FF3333] to-[#1A3C5E] rounded-full animate-progress"></div>
          </div>
          <p class="text-sm text-gray-500 mt-3">Progression en cours...</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', 'Poppins', sans-serif;
    }

    /* Background pulse animation */
    .animate-pulse {
      animation: pulse 4s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.2;
      }
    }

    /* Icon rotation animation */
    .animate-rotate {
      animation: rotate 8s infinite linear;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Progress bar animation */
    .animate-progress {
      width: 0;
      animation: progress 2.5s infinite ease-in-out;
    }

    @keyframes progress {
      0% {
        width: 0%;
        background-position: 0% 50%;
      }
      50% {
        width: 100%;
        background-position: 100% 50%;
      }
      100% {
        width: 0%;
        background-position: 0% 50%;
      }
    }
  `]
})
export class UnderConstructionComponent {}
