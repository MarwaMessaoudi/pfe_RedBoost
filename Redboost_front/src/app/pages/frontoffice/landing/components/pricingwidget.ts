import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCode, faPalette, faMobileAlt, faRocket } from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'pricing-widget',
  standalone: true,
  imports: [CommonModule, ButtonModule, FontAwesomeModule],
  template: `
    <section class="services-section" #servicesSection  id="servicesSection">
      <div class="services-container">
        <div class="services-header">
          <span class="section-subtitle">Services que nous offrons</span>
          <h2 class="section-title">Plus qu'une plateforme</h2>
          <p class="section-description">
            Des solutions complètes pour aider votre entreprise à prospérer à l'ère numérique
          </p>
        </div>

        <div class="services-grid">
          <div *ngFor="let service of services; let i = index" 
               class="service-card" 
               [@cardAnimation]="cardStates[i]"
               [@hoverAnimation]="hoverStates[i]"
               (mouseenter)="onMouseEnter(i)"
               (mouseleave)="onMouseLeave(i)">
            <div class="xy" style="display: flex; justify-content: center; align-items: center;">
              <div class="service-icon">
                <fa-icon [icon]="service.icon" size="2x"></fa-icon>
              </div>
            </div>
            <h3 class="service-title">{{ service.title }}</h3>
            <p class="service-description">{{ service.description }}</p>
          </div>
        </div>

        <div class="button-container">
          <button pButton class="discover-button">
            Découvrez nos services
            <span class="button-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .services-section {
      position: relative;
      padding: 80px 0;
      background: #f5f7fa;
      overflow: hidden;
    }

    .services-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      position: relative;
      z-index: 1;
    }

    .services-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-subtitle {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: rgba(0, 77, 77, 0.1);
      color: #004D4D;
      border-radius: 20px;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: clamp(2rem, 4vw, 3rem);
      color: #004D4D;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .section-description {
      font-size: 1.1rem;
      color: #666;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 60px;
    }

    .service-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease; /* Retained for non-animated hover effects */
    }

    .service-icon {
      margin-bottom: 1.5rem;
      color: #C8223A;
    }

    .service-title {
      font-size: 1.5rem;
      color: #004D4D;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .service-description {
      font-size: 1rem;
      color: #666;
      line-height: 1.5;
    }

    .button-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .discover-button {
      padding: 1rem 2rem;
      background: linear-gradient(to right, #034A55, #C8223A);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 20px rgba(0, 77, 77, 0.15);
    }

    .discover-button:hover {
      background: linear-gradient(to left, #034A55, #C8223A);
      transform: translateY(-2px);
      box-shadow: 0 15px 25px rgba(0, 77, 77, 0.2);
    }

    .button-arrow {
      transition: transform 0.3s ease;
    }

    .discover-button:hover .button-arrow {
      transform: translateX(4px);
    }

    @media (max-width: 768px) {
      .services-section {
        padding: 60px 0;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .service-title {
        font-size: 1.3rem;
      }
    }
  `],
  animations: [
    // Entrance animation (on scroll)
    trigger('cardAnimation', [
      state('hidden', style({ opacity: 0, transform: 'translateY(30px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', [
        animate('0.6s ease-out', keyframes([
          style({ opacity: 0, transform: 'translateY(30px)', offset: 0 }),
          style({ opacity: 0.7, transform: 'translateY(10px)', offset: 0.7 }),
          style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
        ]))
      ])
    ]),
    // Hover animation
    trigger('hoverAnimation', [
      state('default', style({ transform: 'scale(1)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' })),
      state('hovered', style({ transform: 'scale(1.05)', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)' })),
      transition('default => hovered', animate('0.3s ease-in')),
      transition('hovered => default', animate('0.3s ease-out'))
    ])
  ]
})
export class PricingWidget implements OnInit {
  @ViewChild('servicesSection', { static: true }) servicesSection!: ElementRef;

  faCode = faCode;
  faPalette = faPalette;
  faMobileAlt = faMobileAlt;
  faRocket = faRocket;

  services = [
    {
      icon: this.faCode,
      title: "Services de développement Web",
      description: "Des sites Web personnalisés et évolutifs conçus pour évoluer avec vous"
    },
    {
      icon: this.faPalette,
      title: "Solutions de communication et de conception",
      description: "Un contenu attrayant qui amplifient votre marque"
    },
    {
      icon: this.faMobileAlt,
      title: "Development App Mobile",
      description: "Applications mobiles natives et multiplateformes"
    },
    {
      icon: this.faRocket,
      title: "Marketing Digital",
      description: "Solutions marketing stratégiques pour la croissance des entreprises"
    }
  ];

  cardStates: string[] = [];
  hoverStates: string[] = [];

  ngOnInit() {
    this.cardStates = this.services.map(() => 'hidden');
    this.hoverStates = this.services.map(() => 'default');
    this.checkVisibility();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.checkVisibility();
  }

  private checkVisibility(): void {
    const rect = this.servicesSection.nativeElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top <= windowHeight * 0.25 && rect.bottom >= 0) {
      this.cardStates = this.services.map(() => 'visible');
    }
  }

  onMouseEnter(index: number): void {
    this.hoverStates[index] = 'hovered';
  }

  onMouseLeave(index: number): void {
    this.hoverStates[index] = 'default';
  }
}