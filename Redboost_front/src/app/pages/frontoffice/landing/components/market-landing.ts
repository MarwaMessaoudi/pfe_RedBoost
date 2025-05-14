import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-market-landing',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `
    <section #marketSection id="marketlanding" class="py-20 md:py-28 px-6 bg-gradient-to-br from-[#F5F9FF] to-[#E6F0FA]">
      <div class="max-w-7xl mx-auto">
        <!-- Header Section -->
        <div class="text-center mb-20 section-content">
          <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Choisissez Votre <span class="text-[#FF3333]">Plan</span>
          </h2>
          <p class="text-lg text-gray-600 max-w-3xl mx-auto mt-4 leading-relaxed">
            Trouvez le plan idéal pour vos besoins. Profitez d’une période d’essai gratuite de 14 jours avec chaque forfait.
          </p>
        </div>

        <!-- Plans Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 section-content">
          <div
            *ngFor="let plan of plans; let i = index"
            class="relative bg-white rounded-3xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg group"
            [ngClass]="{'ring-2 ring-[#FF3333] shadow-xl scale-105': plan.highlighted}"
          >
            <!-- Highlighted Badge -->
            <div *ngIf="plan.highlighted" class="absolute top-4 right-4 bg-[#FF3333] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
              Recommandé
            </div>

            <div class="p-8">
              <!-- Plan Icon -->
              <div class="mb-6 flex justify-center">
                <ng-container [ngSwitch]="plan.title">
                  <span *ngSwitchCase="'Basic'" class="pi pi-bolt text-[#1A3C5E] text-4xl"></span>
                  <span *ngSwitchCase="'Professional'" class="pi pi-shield text-[#1A3C5E] text-4xl"></span>
                  <span *ngSwitchCase="'Enterprise'" class="pi pi-users text-[#1A3C5E] text-4xl"></span>
                </ng-container>
              </div>

              <!-- Plan Details -->
              <h3 class="text-xl font-bold text-gray-900 mb-3 text-center">{{ plan.title }}</h3>
              <p class="text-sm text-gray-500 mb-6 leading-relaxed text-center">{{ plan.description }}</p>

              <!-- Pricing -->
              <div class="mb-8 text-center">
                <div class="text-4xl font-extrabold text-gray-900">{{ plan.price }}</div>
                <div *ngIf="plan.price !== 'Custom'" class="text-sm text-gray-500 mt-2">par utilisateur / mois</div>
              </div>

              <!-- CTA Button -->
              <div class="flex justify-center">
                <p-button
                  class="modern-button custom-button"
                  [label]="plan.ctaText"
                  pRipple
                ></p-button>
              </div>
            </div>

            <!-- Features -->
            <div class="border-t border-gray-100 p-8 bg-gray-50">
              <p class="font-semibold text-sm text-gray-900 mb-4 text-center">FONCTIONNALITÉS INCLUSES :</p>
              <ul class="space-y-3">
                <li *ngFor="let feature of plan.features" class="flex items-start text-sm">
                  <span class="pi pi-check text-[#1A3C5E] text-base mr-3 mt-1"></span>
                  <span class="text-gray-600">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Consultation Section -->
        <div class="mt-24 text-center section-content">
          <div class="bg-white p-12 rounded-3xl shadow-md max-w-3xl mx-auto">
            <span class="pi pi-clock text-[#1A3C5E] text-5xl mb-6 block mx-auto"></span>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Besoin d’une solution personnalisée ?</h3>
            <p class="text-gray-600 mb-8 leading-relaxed">
              Notre équipe est là pour concevoir un plan sur mesure adapté à vos besoins uniques. Contactez-nous pour discuter de votre projet.
            </p>
            <div class="flex justify-center">
              <p-button
                class="modern-consultation-button custom-button"
                label="Réserver une Consultation"
                pRipple
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', 'Poppins', sans-serif;
    }

    .pi {
      display: inline-block;
      vertical-align: middle;
    }

    .section-content {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }

    .section-content.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Modern Button Styling */
    .modern-button {
      width: 60%;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px !important;
      transition: all 0.3s ease !important;
      position: relative;
      overflow: hidden;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
    }

    .modern-consultation-button {
      width: 40%;
      height: 52px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 8px !important;
      transition: all 0.3s ease !important;
      position: relative;
      overflow: hidden;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
    }

    /* Unified Button Style */
    :host ::ng-deep .custom-button.p-button {
      background: linear-gradient(to right, #DB1E37, #1a2e35) !important;
      background-image: linear-gradient(to right, #DB1E37, #1a2e35) !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      font-weight: 600;
      transition: background 0.3s ease, background-image 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease !important;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
      opacity: 1 !important;
    }

    :host ::ng-deep .custom-button.p-button:enabled:hover {
      background: linear-gradient(to right, #1a2e35, #DB1E37) !important;
      background-image: linear-gradient(to right, #1a2e35, #DB1E37) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15) !important;
    }

    /* Override PrimeNG Button Label Centering */
    :host ::ng-deep .p-button .p-button-label {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      line-height: 1 !important;
    }

    /* Ripple Effect Customization */
    :host ::ng-deep .p-ripple .p-ink {
      background: rgba(255, 255, 255, 0.3) !important;
    }
  `]
})
export class MarketLandingComponent implements AfterViewInit {
  @ViewChild('marketSection') marketSection!: ElementRef;

  plans = [
    {
      title: 'De base',
      price: '$29',
      description: 'Fonctionnalités essentielles pour les petites équipes et les startups',
      features: [
        'Jusqu\'à 5 membres d\'équipe',
        'Analytique de base',
        '1 Go de stockage',
        'Support par e-mail',
        'Accès API'
      ],
      ctaText: 'S\'inscrire',
      highlighted: false,
    },
    {
      title: 'Professionnel',
      price: '$79',
      description: 'Tout ce dont vous avez besoin pour les entreprises en croissance',
      features: [
        'Jusqu\'à 20 membres d\'équipe',
        'Analytique avancée',
        '10 Go de stockage',
        'Support prioritaire',
        'Accès API',
        'Authentification unique (SSO)',
        'Intégrations personnalisées'
      ],
      ctaText: 'S\'inscrire',
      highlighted: true,
    },
    {
      title: 'Entreprise',
      price: 'Personnalisé',
      description: 'Fonctionnalités avancées pour les grandes organisations',
      features: [
        'Membres d\'équipe illimités',
        'Analytique pour entreprise',
        'Stockage illimité',
        'Support dédié 24/7',
        'Accès API avancé',
        'SAML & SSO',
        'Gestionnaire de compte dédié'
      ],
      ctaText: 'Contacter les ventes',
      highlighted: false,
    }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const contents = entry.target.querySelectorAll('.section-content');
            contents.forEach((content) => content.classList.add('visible'));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(this.marketSection.nativeElement);
  }
}
