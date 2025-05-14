import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'commercialisation-component',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section class="service-section" #serviceSection>
            <div class="service-content">
                <div class="service-text">
                    <i class="pi pi-chart-bar icon text-primary" [@textAnimation]="isVisible ? 'visible' : 'hidden'"></i>
                    <h2 class="service-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Commercialisation – Boostez votre visibilité et vos ventes</h2>
                    <p class="service-description" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                        Une bonne idée ne suffit pas, il faut aussi savoir la vendre ! Nous vous aidons à positionner et développer votre marché.
                    </p>
                    <ul class="service-list" [@listAnimation]="isVisible ? 'visible' : 'hidden'">
                        @for (item of serviceItems; track item) {
                            <li class="service-item">
                                <i class="pi pi-check text-primary mr-2"></i>{{ item }}
                            </li>
                        }
                    </ul>
                    <button pButton pRipple label="En savoir plus" class="cta-button"
                            [@buttonHoverAnimation]="buttonHoverState"
                            (mouseenter)="onButtonMouseEnter()"
                            (mouseleave)="onButtonMouseLeave()"
                            routerLink="/contactlanding"></button>
                </div>
                <div class="service-image" [@imageAnimation]="isVisible ? 'visible' : 'hidden'"></div>
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
        trigger('listAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate('0.6s ease-out')
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
        .service-section {
            padding: 4rem 1.5rem;
            background: #ffffff;
            position: relative;
            overflow: hidden;
        }

        .service-content {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: center;
        }

        .service-text {
            flex: 1;
            text-align: left;
        }

        .service-image {
            flex: 1;
            height: 400px;
            background-image: url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800');
            background-size: cover;
            background-position: center;
            border-radius: 12px;
        }

        .icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .service-title {
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            color: #1a2e35;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .service-description {
            font-size: 1.1rem;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            max-width: 600px;
        }

        .service-list {
            list-style: none;
            padding: 0;
            margin-bottom: 2rem;
        }

        .service-item {
            font-size: 1rem;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
        }

        .pi-check {
            font-size: 1.2rem;
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
            .service-content {
                flex-direction: column;
                text-align: center;
            }

            .service-text {
                text-align: center;
                order: 1;
            }

            .service-image {
                height: 300px;
                width: 100%;
                order: 2;
            }
        }

        @media (max-width: 768px) {
            .service-section {
                padding: 3rem 1rem;
            }

            .service-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .service-description {
                font-size: 1rem;
            }

            .service-item {
                font-size: 0.95rem;
            }

            .icon {
                font-size: 2rem;
            }

            .cta-button {
                padding: 0.7rem 1.8rem;
                font-size: 0.95rem;
            }
        }

        @media (max-width: 480px) {
            .service-section {
                padding: 2rem 1rem;
            }

            .service-title {
                font-size: clamp(1.3rem, 2.5vw, 1.8rem);
            }

            .service-image {
                height: 250px;
            }

            .icon {
                font-size: 1.8rem;
            }
        }
    `]
})
export class CommercialisationComponent {
    @ViewChild('serviceSection', { static: true }) serviceSection!: ElementRef;
    isVisible: boolean = false;
    buttonHoverState: string = 'inactive';
    serviceItems = [
        'Prospection et acquisition de clients',
        'Élaboration de stratégies de pricing et de croissance',
        'Optimisation de l’expérience client et fidélisation'
    ];

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.serviceSection.nativeElement.getBoundingClientRect();
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
