import { Component, ElementRef, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { TopbarWidget } from './components/topbarwidget.component';
import { FooterWidget } from './components/footerwidget';
import { ContactInfoComponent } from './components/contact-info.component';
import { ScrollToTopComponent } from './components/ScrollToTopComponent';
import { RedstartComponent } from './components/redstart.component';
import { RedboostComponent } from './components/redboost.component';
import { MissionComponent } from './components/mission.component';
import { VisionComponent } from './components/vision.component';
import { ValeursComponent } from './components/valeurs.component';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        TimelineModule,
        TopbarWidget,
        FooterWidget,
        ContactInfoComponent,
        ScrollToTopComponent,
        RedstartComponent,
        RedboostComponent,
        MissionComponent,
        VisionComponent,
        ValeursComponent
    ],
    template: `
        <div class="dark:bg-surface-900">
            <div id="about" class="about-wrapper overflow-hidden">
                <contact-info />
                <topbar-widget class="py-4 px-4 md:py-6 md:px-6 lg:mx-2 lg:px-8 xl:mx-4 flex items-center justify-between relative lg:static" />

                <!-- Hero Section -->
                <section class="hero-section" #heroSection>
                    <div class="hero-background">
                        <div class="bg-image" [ngStyle]="{'background-image': 'url(' + currentImage + ')'}"></div>
                        <div class="bg-image next" [ngStyle]="{'background-image': 'url(' + nextImage + ')'}"></div>
                    </div>
                    <div class="hero-content">
                        <span class="section-badge" [@textAnimation]="isVisible ? 'visible' : 'hidden'">À Propos</span>
                        <h1 class="hero-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">RedBoost : Votre Catalyseur de Succès</h1>
                        <p class="hero-description" [@textAnimation]="isVisible ? 'visible' : 'hidden'">
                            Connectez startups, coachs et investisseurs pour transformer vos idées en réussites grâce à notre plateforme intuitive.
                        </p>
                    </div>
                </section>

                <redstart-component />
                <redboost-component />
                <mission-component />
                <vision-component />
                <valeurs-component />
                <footer-widget />
                <app-scroll-to-top />
            </div>
        </div>
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
        .about-wrapper {
            background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
        }

        .hero-section {
            padding: 8rem 1.5rem;
            position: relative;
            overflow: hidden;
            min-height: 600px;
            display: flex;
            align-items: center;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }

        .bg-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            filter: blur(8px); /* Blur effect on the images */
            transition: opacity 1s ease-in-out;
            opacity: 1;
            transform: translateY(0);
        }

        .bg-image.next {
            opacity: 0;
        }

        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(26, 46, 53, 0.6); /* Semi-transparent overlay for text readability */
            z-index: 1;
        }

        .hero-content {
            max-width: 1280px;
            margin: 0 auto;
            text-align: center;
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .section-badge {
            display: inline-block;
            padding: 0.5rem 1.5rem;
            background: rgba(219, 30, 55, 0.2);
            color: #DB1E37;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }

        .hero-title {
            font-size: clamp(2.2rem, 4vw, 3.2rem);
            color: #ffffff;
            font-weight: 800;
            margin-bottom: 2rem;
            line-height: 1.3;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .hero-description {
            font-size: 1.2rem;
            color: #f0f4f8;
            line-height: 1.6;
            max-width: 700px;
            margin: 0 auto 2.5rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
            .hero-section {
                padding: 6rem 1rem;
                min-height: 500px;
            }

            .hero-title {
                font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            }

            .hero-description {
                font-size: 1rem;
            }

            .section-badge {
                font-size: 0.9rem;
                padding: 0.4rem 1.2rem;
            }
        }

        @media (max-width: 480px) {
            .hero-section {
                padding: 5rem 1rem;
                min-height: 400px;
            }

            .hero-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .hero-description {
                font-size: 0.95rem;
            }
        }
    `]
})
export class AboutComponent implements OnInit, OnDestroy {
    @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
    isVisible: boolean = false;
    currentImage: string = '';
    nextImage: string = '';
    private images: string[] = [
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1920',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920'
    ];
    private currentIndex: number = 0;
    private slideshowInterval: any;

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.heroSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.currentImage = this.images[0];
        this.nextImage = this.images[1];
        this.onScroll();
        this.startSlideshow();
    }

    ngOnDestroy() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
        }
    }

    startSlideshow() {
        this.slideshowInterval = setInterval(() => {
            // Prepare the next image
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.nextImage = this.images[this.currentIndex];

            // Trigger fade by updating styles
            const backgroundElement = this.heroSection.nativeElement.querySelector('.bg-image');
            const nextBackgroundElement = this.heroSection.nativeElement.querySelector('.bg-image.next');
            if (backgroundElement && nextBackgroundElement) {
                nextBackgroundElement.style.opacity = '1';
                setTimeout(() => {
                    backgroundElement.style.opacity = '0';
                    this.currentImage = this.nextImage;
                    backgroundElement.style.backgroundImage = `url(${this.currentImage})`;
                    backgroundElement.style.opacity = '1';
                    nextBackgroundElement.style.opacity = '0';
                    this.nextImage = this.images[(this.currentIndex + 1) % this.images.length];
                    nextBackgroundElement.style.backgroundImage = `url(${this.nextImage})`;
                }, 1000); // Wait for fade-in to complete
            }
        }, 3000); // Change every 2 seconds
    }
}
