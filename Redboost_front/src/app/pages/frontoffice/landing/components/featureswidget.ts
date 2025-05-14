import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faCog, faChartLine, faShield } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'features-widget',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule, FontAwesomeModule],
  template: `
    <section class="challenge-section" #sectionRef>
      <div class="challenge-content">
        <h1 class="challenge-title" [@textAnimation]="isVisible ? 'in' : 'hidden'">Les défis que nous relevons</h1>
        <p class="challenge-description" [@textAnimation]="isVisible ? 'in' : 'hidden'">gérer les échanges et suivre vos progrès peut être complexe et chronophage. Notre plateforme élimine ces obstacles en vous offrant.</p>
        <h3 class="challenge-subtitle" [@textAnimation]="isVisible ? 'in' : 'hidden'">RedBoost est conçu pour changer cela :</h3>
        <div class="challenge-cards">
          <div *ngFor="let feature of features; let i = index"
               class="challenge-card"
               [@cardAnimation]="isVisible ? (isSelected(i) ? 'selected' : 'default') : 'hidden'"
               [@hoverAnimation]="hoverState[i]"
               (mouseenter)="onMouseEnter(i)"
               (mouseleave)="onMouseLeave(i)"
               (click)="selectFeature(i)"
               [class.selected]="isSelected(i)"
               [style.animationDelay]="i * 0.15 + 's'">
            <div class="card-icon">
              <fa-icon [icon]="feature.icon" size="2x"></fa-icon>
            </div>
            <h3>{{ feature.text }}</h3>
          </div>
        </div>
        <button pButton pRipple label="Découvrez RedBoost en action" 
                class="action-button" 
                [@buttonHoverAnimation]="buttonHoverState"
                (mouseenter)="onButtonMouseEnter()"
                (mouseleave)="onButtonMouseLeave()">
        </button>
      </div>
    </section>
  `,
  animations: [
    trigger('cardAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'scale(0.85) translateY(30px)'
      })),
      state('default', style({
        opacity: 1,
        transform: 'scale(1) rotate(0deg)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(203, 74, 89, 0.1)'
      })),
      state('selected', style({
        opacity: 1,
        transform: 'scale(1.05) rotate(0deg)',
        boxShadow: '0 15px 35px rgba(0, 77, 77, 0.2)',
        border: '2px solid #C8223A'
      })),
      transition('hidden => default', [
        animate('0.8s ease-out', keyframes([
          style({ opacity: 0.3, transform: 'scale(0.85) translateY(30px)', offset: 0 }),
          style({ opacity: 0.8, transform: 'scale(1.03) translateY(-5px)', offset: 0.7 }),
          style({ opacity: 1, transform: 'scale(1) translateY(0)', offset: 1 })
        ]))
      ]),
      transition('default <=> selected', [
        animate('0.4s ease-in-out')
      ])
    ]),
    trigger('hoverAnimation', [
      state('inactive', style({
        transform: 'translateY(0) scale(1)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      })),
      state('active', style({
        transform: 'translateY(-10px) scale(1.02)',
        boxShadow: '0 20px 40px rgba(0, 77, 77, 0.15)',
        borderColor: 'rgba(203, 74, 89, 0.3)'
      })),
      transition('inactive => active', [
        animate('0.3s ease-out')
      ]),
      transition('active => inactive', [
        animate('0.3s ease-in')
      ])
    ]),
    trigger('textAnimation', [
      state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => in', [
        animate('0.8s ease-out')
      ])
    ]),
    trigger('buttonHoverAnimation', [
      state('inactive', style({
        transform: 'translateY(0)',
        boxShadow: '0 10px 20px rgba(0, 77, 77, 0.15)',
        background: 'linear-gradient(to right, #C8223A, #034A55)'
      })),
      state('active', style({
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 20px rgba(0, 77, 77, 0.2)',
        background: 'linear-gradient(to right, #034A55, #C8223A)'
      })),
      transition('inactive => active', [
        animate('0.3s ease-out')
      ]),
      transition('active => inactive', [
        animate('0.3s ease-in')
      ])
    ])
  ],
  styles: [`
    .challenge-section {
      min-height: 100vh;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      padding: 6rem 2rem;
      position: relative;
      overflow: hidden;
    }

    .challenge-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 2;
    }

    .challenge-title {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #034A55;
    }

    .challenge-description {
      font-size: 1.2rem;
      color: #555;
      max-width: 800px;
      margin: 0 auto 3rem;
      line-height: 1.6;
    }

    .challenge-subtitle {
      font-size: 1.4rem;
      color: #004D4D;
      margin-bottom: 4rem;
    }

    .challenge-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .challenge-card {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      padding: 2rem;
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }

    .card-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #EA7988;
    }

    .challenge-card h3 {
      font-size: 1.2rem;
      color: #004D4D;
      margin-bottom: 1rem;
    }

    .action-button {
      background: linear-gradient(to right, #C8223A, #034A55);
      color: white; /* Couleur fixe */
      border: none;
      padding: 1rem 2.5rem;
      font-weight: bold;
      border-radius: 50px;
      font-size: 1.1rem;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .challenge-title {
        font-size: 3rem;
      }
      .challenge-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .challenge-section {
        padding: 4rem 1.5rem;
      }
      .challenge-title {
        font-size: 2.5rem;
      }
      .challenge-description {
        font-size: 1.1rem;
      }
      .challenge-cards {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .challenge-title {
        font-size: 2rem;
      }
      .challenge-description {
        font-size: 1rem;
      }
      .action-button {
        padding: 0.8rem 2rem;
        font-size: 1rem;
      }
    }
  `]
})
export class FeaturesWidget {
  @ViewChild('sectionRef', { static: false }) sectionRef!: ElementRef;
  isVisible: boolean = false;
  features = [
    { icon: faUsers, text: "Un matching intelligent entre entrepreneurs et coachs expérimentés" },
    { icon: faCog, text: "Une centralisation des données pour un suivi clair et organisé." },
    { icon: faChartLine, text: "Des outils de communication digitaux pour des échanges fluides et efficaces" },
    { icon: faShield, text: "Un suivi personnalisé pour mesurer vos progrès et atteindre vos objectifs" }
  ];

  selectedFeatureIndex: number | null = null;
  hoverState: string[] = this.features.map(() => 'inactive');
  buttonHoverState: string = 'inactive';

  @HostListener('window:scroll', [])
  onScroll() {
    if (this.sectionRef) {
      const rect = this.sectionRef.nativeElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }
  }

  selectFeature(index: number) {
    this.selectedFeatureIndex = index === this.selectedFeatureIndex ? null : index;
  }

  isSelected(index: number): boolean {
    return this.selectedFeatureIndex === index;
  }

  onMouseEnter(index: number) {
    this.hoverState[index] = 'active';
  }

  onMouseLeave(index: number) {
    this.hoverState[index] = 'inactive';
  }

  onButtonMouseEnter() {
    this.buttonHoverState = 'active';
  }

  onButtonMouseLeave() {
    this.buttonHoverState = 'inactive';
  }
}