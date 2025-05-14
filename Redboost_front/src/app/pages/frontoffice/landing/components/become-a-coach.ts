import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, animate, transition, keyframes, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-become-a-coach',
    standalone: true,
    imports: [RouterModule, CommonModule],
    template: `
        <section class="min-h-screen bg-gradient-to-br from-white to-gray-50 py-20 px-4 sm:px-6 lg:px-8" #section>
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" [@containerAnimation]="isVisible ? 'visible' : 'hidden'">
                <!-- Texte et contenu -->
                <div class="space-y-8 text-left">
                    <h1 class="text-5xl font-bold text-[#034A55] leading-tight">
                        Devenez
                        <span class="text-[#C8223A] relative inline-block">
                            Coach
                            <span class="absolute -bottom-2 left-0 w-full h-1 bg-[#C8223A]" [@underlineAnimation]="isVisible ? 'visible' : 'hidden'"></span>
                        </span>
                    </h1>

                    <p class="text-lg text-gray-600 leading-relaxed max-w-xl" [@itemAnimation]="isVisible ? 'visible' : 'hidden'">
                        Partagez Votre Expertise et Faites la Différence Vous êtes un coach passionné et expérimenté ?
                        <br />
                        Rejoignez notre plateforme pour connecter avec des entrepreneurs motivés, gagner en visibilité grâce à un profil détaillé et des recommandations personnalisées, et utilisez des outils digitaux pour simplifier vos interactions
                        et suivre les progrès de vos clients
                    </p>

                    <!-- Cards avec icônes -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div
                            *ngFor="let item of cards; let i = index"
                            class="bg-white p-6 rounded-xl shadow-lg text-left"
                            [@itemAnimation]="{ value: isVisible ? 'visible' : 'hidden', params: { delay: i * 0.2 } }"
                            [@hoverAnimation]="hoverStates[item.id] || 'default'"
                            (mouseenter)="onMouseEnter(item.id)"
                            (mouseleave)="onMouseLeave(item.id)"
                        >
                            <span class="text-4xl mb-4 block">{{ item.icon }}</span>
                            <h3 class="text-lg font-semibold text-[#034A55] mb-2">{{ item.title }}</h3>
                            <p class="text-gray-600 text-sm">{{ item.desc }}</p>
                        </div>
                    </div>

                    <!-- Bouton -->
                    <div class="mt-8 text-left">
                        <button class="action-button relative" routerLink="/coach-request" [@buttonAnimation]="buttonState" (mouseenter)="onButtonMouseEnter()" (mouseleave)="onButtonMouseLeave()">
                            Commencer Maintenant
                            <span class="button-glow absolute inset-0 bg-gradient-to-r from-[#C8223A] to-[#034A55]" [@glowAnimation]="buttonState"></span>
                        </button>
                    </div>
                </div>

                <!-- Image -->
                <div class="relative" [@imageAnimation]="isVisible ? 'visible' : 'hidden'">
                    <div class="relative z-10" [@floatingAnimation]="isVisible ? 'visible' : 'hidden'">
                        <img src="/assets/images/coach.jpg" alt="Coaching Session" class="rounded-2xl shadow-2xl w-full object-cover" />
                        <div class="absolute -top-6 -right-6 w-24 h-24 bg-[#C8223A] rounded-full opacity-20" [@circleAnimation]="isVisible ? 'visible' : 'hidden'"></div>
                        <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-[#034A55] rounded-full opacity-20" [@circleAnimationReverse]="isVisible ? 'visible' : 'hidden'"></div>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            :host {
                display: block;
            }

            .action-button {
                position: relative;
                overflow: hidden;
                color: #ffffff;
                padding: 1rem 2rem;
                font-size: 1.1rem;
                font-weight: 600;
                background: linear-gradient(to right, #c8223a, #034a55);
                border: none;
                border-radius: 50px;
                cursor: pointer;
                z-index: 1;
            }

            .button-glow {
                z-index: -1;
                opacity: 0;
            }
        `
    ],
    animations: [
        // Container animation
        trigger('containerAnimation', [
            state('hidden', style({ opacity: 0 })),
            state('visible', style({ opacity: 1 })),
            transition('hidden => visible', [animate('0.5s', style({ opacity: 1 })), query(':enter', stagger('0.3s', [animate('0.5s', style({ opacity: 1 }))]), { optional: true })])
        ]),

        // Item animation (text, cards, etc.)
        trigger('itemAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])
        ]),

        // Underline animation
        trigger('underlineAnimation', [state('hidden', style({ transform: 'scaleX(0)' })), state('visible', style({ transform: 'scaleX(1)' })), transition('hidden => visible', animate('0.5s 0.5s ease-out'))]),

        // Card hover animation
        trigger('hoverAnimation', [
            state('default', style({ transform: 'translateY(0)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' })),
            state('hovered', style({ transform: 'translateY(-5px)', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)' })),
            transition('default <=> hovered', animate('0.3s ease-out'))
        ]),

        // Image animation
        trigger('imageAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateX(100px)' })),
            state('visible', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('hidden => visible', animate('0.8s ease-out')) // Simplified spring-like effect
        ]),

        // Floating animation
        trigger('floatingAnimation', [
            state('hidden', style({ opacity: 0, transform: 'translateY(0)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [animate('6s ease-in-out', keyframes([style({ transform: 'translateY(0)', offset: 0 }), style({ transform: 'translateY(-20px)', offset: 0.5 }), style({ transform: 'translateY(0)', offset: 1.0 })]))])
        ]),

        // Circle animation (red circle)
        trigger('circleAnimation', [
            state('hidden', style({ opacity: 0 })),
            state('visible', style({ opacity: 1 })),
            transition('hidden => visible', [animate('8s  ease-in-out', keyframes([style({ transform: 'scale(1) rotate(0deg)' }), style({ transform: 'scale(1.2) rotate(180deg)' }), style({ transform: 'scale(1) rotate(360deg)' })]))])
        ]),

        // Circle animation (blue circle, reverse direction)
        trigger('circleAnimationReverse', [
            state('hidden', style({ opacity: 0 })),
            state('visible', style({ opacity: 1 })),
            transition('hidden => visible', [animate('10s  ease-in-out', keyframes([style({ transform: 'scale(1) rotate(360deg)' }), style({ transform: 'scale(1.3) rotate(180deg)' }), style({ transform: 'scale(1) rotate(0deg)' })]))])
        ]),

        // Button animation
        trigger('buttonAnimation', [
            state('default', style({ background: 'linear-gradient(to right, #C8223A, #034A55)' })),
            state('hovered', style({ background: 'linear-gradient(to right, #034A55, #C8223A)' })),
            transition('default <=> hovered', animate('0.3s ease-out'))
        ]),

        // Button glow animation
        trigger('glowAnimation', [state('default', style({ opacity: 0, transform: 'translateX(100%)' })), state('hovered', style({ opacity: 1, transform: 'translateX(0)' })), transition('default <=> hovered', animate('0.3s ease-out'))])
    ]
})
export class BecomeCoachComponent {
    @ViewChild('section', { static: true }) section!: ElementRef;

    cards = [
        { id: 1, icon: '🚀', title: 'Instant Access', desc: 'Start coaching immediately' },
        { id: 2, icon: '💡', title: 'Share Expertise', desc: 'Help others grow' },
        { id: 3, icon: '🌟', title: 'Build Network', desc: 'Connect with professionals' }
    ];

    isVisible = false;
    hoverStates: { [key: number]: string } = {};
    buttonState = 'default';

    constructor(private router: Router) {}

    ngOnInit() {
        this.checkVisibility();
    }

    @HostListener('window:scroll', [])
    onScroll() {
        this.checkVisibility();
    }

    checkVisibility() {
        const rect = this.section.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.75 && rect.bottom >= 0;
    }

    onMouseEnter(id: number) {
        this.hoverStates[id] = 'hovered';
    }

    onMouseLeave(id: number) {
        this.hoverStates[id] = 'default';
    }

    onButtonMouseEnter() {
        this.buttonState = 'hovered';
    }

    onButtonMouseLeave() {
        this.buttonState = 'default';
    }

    navigateToSignUp() {
        this.router.navigate(['/signup']);
    }
}
