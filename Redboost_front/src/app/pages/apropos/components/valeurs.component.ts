import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'valeurs-component',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, RippleModule],
    template: `
        <section class="valeurs-section" #valeursSection>
            <div class="valeurs-content">
                <span class="section-badge" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Nos Valeurs</span>
                <h2 class="section-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Les Piliers de RedBoost</h2>
                <div class="valeurs-grid" [@gridAnimation]="isVisible ? 'visible' : 'hidden'">
                    <p-card *ngFor="let valeur of valeurs; let i = index"
                            class="valeur-card"
                            [ngClass]="{'card-animate': isVisible}"
                            [style.transitionDelay]="(i * 0.2) + 's'"
                            [@cardAnimation]="hoverStates[i]"
                            (mouseenter)="onMouseEnter(i)"
                            (mouseleave)="onMouseLeave(i)">
                        <div class="card-content">
                            <i [class]="valeur.icon" class="icon text-[#DB1E37]"></i>
                            <h3 class="valeur-title">{{ valeur.title }}</h3>
                            <p class="valeur-description">{{ valeur.description }}</p>
                        </div>
                    </p-card>
                </div>
                <button pButton pRipple label="Rejoignez Notre Écosystème" class="cta-button"
                        [@buttonHoverAnimation]="buttonHoverState"
                        (mouseenter)="onButtonMouseEnter()"
                        (mouseleave)="onButtonMouseLeave()"
                        routerLink="/contactlanding"></button>
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
        trigger('gridAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate('0.6s ease-out')
            ])
        ]),
        trigger('cardAnimation', [
            state('default', style({
                transform: 'scale(1) translateY(0)',
                boxShadow: '0 6px 20px rgba(0, 77, 77, 0.1)',
                background: 'linear-gradient(145deg, #ffffff, #f5f7fa)'
            })),
            state('hovered', style({
                transform: 'scale(1.05) translateY(-8px)',
                boxShadow: '0 12px 30px rgba(0, 77, 77, 0.2)',
                background: 'linear-gradient(145deg, #f5f7fa, #ffffff)'
            })),
            transition('default => hovered', animate('0.3s ease-out')),
            transition('hovered => default', animate('0.3s ease-in'))
        ]),
        trigger('buttonHoverAnimation', [
            state('inactive', style({
                transform: 'translateY(0)',
                boxShadow: '0 10px 20px rgba(0, 77, 77, 0.15)',
                background: 'linear-gradient(to right, #C8223A, #034A55)'
            })),
            state('active', style({
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 25px rgba(0, 77, 77, 0.2)',
                background: 'linear-gradient(to right, #034A55, #C8223A)'
            })),
            transition('inactive => active', animate('0.3s ease-out')),
            transition('active => inactive', animate('0.3s ease-in'))
        ])
    ],
    styles: [`
        .valeurs-section {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            position: relative;
            overflow: hidden;
        }

        .valeurs-content {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }

        .section-badge {
            display: inline-block;
            padding: 0.5rem 1.5rem;
            background: rgba(203, 74, 89, 0.1);
            color: #004D4D;
            border-radius: 30px;
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }

        .section-title {
            font-size: clamp(2rem, 4vw, 3rem);
            color: #034A55;
            font-weight: 800;
            margin-bottom: 2.5rem;
        }

        .valeurs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto 3rem;
        }

        .valeur-card {
            background: linear-gradient(145deg, #ffffff, #f5f7fa);
            border-radius: 16px;
            padding: 3rem 2rem;
            min-height: 350px;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid rgba(203, 74, 89, 0.1);
        }

        .card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            flex: 1;
        }

        .icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
        }

        .valeur-title {
            font-size: 1.6rem;
            color: #004D4D;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .valeur-description {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.6;
            flex: 1;
        }

        .card-animate {
            animation: fadeInUp 0.8s ease-out forwards;
        }

        .cta-button {
            padding: 1rem 2.5rem;
            background: linear-gradient(to right, #C8223A, #034A55);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1.5rem;
        }

        @media (max-width: 992px) {
            .valeurs-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
        }

        @media (max-width: 768px) {
            .valeurs-section {
                padding: 4rem 1.5rem;
            }

            .section-title {
                font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            }

            .section-badge {
                font-size: 0.9rem;
                padding: 0.4rem 1.2rem;
            }

            .valeur-card {
                padding: 2rem 1.5rem;
                min-height: 300px;
            }

            .valeur-title {
                font-size: 1.4rem;
            }

            .valeur-description {
                font-size: 1rem;
            }

            .icon {
                font-size: 2.5rem;
            }

            .cta-button {
                padding: 0.8rem 2rem;
                font-size: 1rem;
            }
        }

        @media (max-width: 480px) {
            .valeurs-section {
                padding: 3rem 1rem;
            }

            .section-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .valeur-card {
                min-height: 280px;
            }

            .valeur-title {
                font-size: 1.3rem;
            }

            .valeur-description {
                font-size: 0.95rem;
            }

            .icon {
                font-size: 2rem;
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `]
})
export class ValeursComponent {
    @ViewChild('valeursSection', { static: true }) valeursSection!: ElementRef;
    isVisible: boolean = false;
    valeurs = [
        {
            title: 'Collaboration',
            description: 'Favoriser l’échange et la synergie entre entrepreneurs, coachs et investisseurs pour une croissance collective.',
            icon: 'pi pi-handshake'
        },
        {
            title: 'Innovation',
            description: 'Intégrer des outils performants pour un accompagnement structuré et efficace.',
            icon: 'pi pi-bolt'
        },
        {
            title: 'Impact',
            description: 'Accélérer le développement des projets et maximiser leur portée sur l’économie et la société.',
            icon: 'pi pi-star'
        }
    ];
    hoverStates: string[] = this.valeurs.map(() => 'default');
    buttonHoverState: string = 'inactive';

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.valeursSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.onScroll();
    }

    onMouseEnter(index: number) {
        this.hoverStates[index] = 'hovered';
    }

    onMouseLeave(index: number) {
        this.hoverStates[index] = 'default';
    }

    onButtonMouseEnter() {
        this.buttonHoverState = 'active';
    }

    onButtonMouseLeave() {
        this.buttonHoverState = 'inactive';
    }
}
