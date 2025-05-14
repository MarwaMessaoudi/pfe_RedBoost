import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'redboost-component',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section class="redboost-section" #redboostSection>
            <div class="redboost-content">
                <div class="section-text">
                    <h2 class="section-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                        RedBoost : Boost Your Business
                    </h2>
                    <p class="section-description" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                        RedBoost est la plateforme dédiée aux entrepreneurs, coachs et investisseurs souhaitant dynamiser leurs collaborations et optimiser leur réussite. En centralisant le suivi d’accompagnement, la gestion des tâches, les KPI, la prise de rendez-vous et la communication, RedBoost simplifie et structure les interactions au sein de l’écosystème entrepreneurial.
                    </p>
                    <p class="section-description" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                        Grâce à une approche intuitive et des outils performants, nous offrons un espace où innovation, mentorat et opportunités d’investissement se rencontrent pour transformer vos idées en succès.
                    </p>
                    <button pButton pRipple label="Découvrir RedBoost" class="cta-button"
                            [@buttonHoverAnimation]="buttonHoverState"
                            (mouseenter)="onButtonMouseEnter()"
                            (mouseleave)="onButtonMouseLeave()"
                            routerLink="/landing"></button>
                </div>
                <div class="section-image" [@imageAnimation]="isVisible ? 'visible' : 'hidden'"></div>
            </div>
        </section>
    `,
    animations: [
        trigger('textAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate('0.8s ease-out', keyframes([
                    style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
                    style({ opacity: 0.7, transform: 'translateY(5px)', offset: 0.7 }),
                    style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
                ]))
            ])
        ]),
        trigger('imageAnimation', [
            state('hidden', style({ opacity: 0, transform: 'scale(0.95)' })),
            state('visible', style({ opacity: 1, transform: 'scale(1)' })),
            transition('hidden => visible', [
                animate('0.8s ease-out')
            ])
        ]),
        trigger('buttonHoverAnimation', [
            state('inactive', style({
                transform: 'translateY(0)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(to right, #DB1E37, #1a2e35)'
            })),
            state('active', style({
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)',
                background: 'linear-gradient(to right, #1a2e35, #DB1E37)'
            })),
            transition('inactive => active', animate('0.3s ease-out')),
            transition('active => inactive', animate('0.3s ease-in'))
        ])
    ],
    styles: [`
        .redboost-section {
            padding: 4rem 1.5rem;
            background: #ffffff;
            position: relative;
            overflow: hidden;
        }

        .redboost-content {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: center;
        }

        .section-text {
            flex: 1;
            text-align: left;
        }

        .section-image {
            flex: 1;
            height: 400px;
            background-image: url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800');
            background-size: cover;
            background-position: center;
            border-radius: 12px;
        }

        .section-title {
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            color: #1a2e35;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .section-description {
            font-size: 1.1rem;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            max-width: 600px;
        }

        .cta-button {
            padding: 0.8rem 2rem;
            background: linear-gradient(to right, #DB1E37, #1a2e35);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
        }

        @media (max-width: 992px) {
            .redboost-content {
                flex-direction: column;
                text-align: center;
            }

            .section-text {
                text-align: center;
                order: 1;
            }

            .section-image {
                height: 300px;
                width: 100%;
                order: 2;
            }
        }

        @media (max-width: 768px) {
            .redboost-section {
                padding: 3rem 1rem;
            }

            .section-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .section-description {
                font-size: 1rem;
            }

            .cta-button {
                padding: 0.7rem 1.8rem;
                font-size: 0.95rem;
            }
        }

        @media (max-width: 480px) {
            .redboost-section {
                padding: 2rem 1rem;
            }

            .section-title {
                font-size: clamp(1.3rem, 2.5vw, 1.8rem);
            }

            .section-image {
                height: 250px;
            }
        }
    `]
})
export class RedboostComponent {
    @ViewChild('redboostSection', { static: true }) redboostSection!: ElementRef;
    isVisible: boolean = false;
    buttonHoverState: string = 'inactive';

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.redboostSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.onScroll();
    }

    onButtonMouseEnter() {
        this.buttonHoverState = 'active';
    }

    onButtonMouseLeave() {
        this.buttonHoverState = 'inactive';
    }
}
