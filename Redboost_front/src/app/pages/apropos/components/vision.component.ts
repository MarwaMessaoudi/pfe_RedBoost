import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'vision-component',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="vision-section" #visionSection>
            <div class="vision-content">
                <h2 class="section-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Notre Vision</h2>
                <p class="section-description" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                    RedBoost est un catalyseur incontournable de l’innovation et de la réussite entrepreneuriale en Tunisie, en connectant efficacement startups, coachs et investisseurs à travers une plateforme intuitive, collaborative et axée sur la performance.
                </p>
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
        ])
    ],
    styles: [`
        .vision-section {
            padding: 4rem 2rem;
            background: #f5f7fa;
            position: relative;
            overflow: hidden;
        }

        .vision-content {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }

        .section-title {
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            color: #034A55;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .section-description {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            .vision-section {
                padding: 3rem 1.5rem;
            }

            .section-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .section-description {
                font-size: 1rem;
            }
        }
    `]
})
export class VisionComponent {
    @ViewChild('visionSection', { static: true }) visionSection!: ElementRef;
    isVisible: boolean = false;

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.visionSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.onScroll();
    }
}
