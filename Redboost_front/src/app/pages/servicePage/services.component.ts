import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
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
import { DeveloppementComponent } from './components/developpement.component';
import { CommercialisationComponent } from './components/commercialisation.component';
import { DesignCommunicationComponent } from './components/design-communication.component';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'app-services',
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
        DeveloppementComponent,
        CommercialisationComponent,
        DesignCommunicationComponent
    ],
    template: `
        <div class="dark:bg-surface-900">
            <div id="services" class="services-wrapper overflow-hidden">
                <contact-info />
                <topbar-widget class="py-4 px-4 md:py-6 md:px-6 lg:mx-2 lg:px-8 xl:mx-4 flex items-center justify-between relative lg:static" />

                <!-- Hero Section -->
                <section class="hero-section" #heroSection>
                    <div class="hero-content">
                        <span class="section-badge" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Nos Services</span>
                        <h1 class="hero-title" [@textAnimation]="isVisible ? 'visible' : 'hidden'">Solutions pour Votre Succès</h1>
                        <div class="hero-grid">
                            @for (service of services; track service.title; let i = $index) {
                                <div class="hero-card"
                                     [ngClass]="{'hero-card-hovered': hoveredIndex === i, 'hero-card-blurred': hoveredIndex !== null && hoveredIndex !== i}"
                                     (mouseenter)="onHeroCardHover(i)"
                                     (mouseleave)="onHeroCardLeave()"
                                     (click)="scrollToService(service.ref)"
                                     [@cardAnimation]="hoveredIndex === i ? 'hovered' : 'default'">
                                    <i [class]="service.icon" class="hero-icon text-primary"></i>
                                    <h2 class="hero-service-title">{{ service.title }}</h2>
                                    <p class="hero-service-description">{{ service.description }}</p>
                                </div>
                            }
                        </div>
                    </div>
                </section>

                <!-- Service Sections -->
                <developpement-component #developpementSection />
                <commercialisation-component #commercialisationSection />
                <design-communication-component #designCommunicationSection />

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
        ]),
        trigger('cardAnimation', [
            state('default', style({
                transform: 'scale(1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(145deg, #ffffff, #f0f4f8)'
            })),
            state('hovered', style({
                transform: 'scale(1.03)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                background: 'linear-gradient(145deg, #f0f4f8, #ffffff)'
            })),
            transition('default => hovered', animate('0.3s ease-out')),
            transition('hovered => default', animate('0.3s ease-in'))
        ])
    ],
    styles: [`
        .services-wrapper {
            background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
        }

        .hero-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
            position: relative;
            overflow: hidden;
        }

        .hero-content {
            max-width: 1280px;
            margin: 0 auto;
            text-align: center;
        }

        .section-badge {
            display: inline-block;
            padding: 0.5rem 1.5rem;
            background: rgba(219, 30, 55, 0.1);
            color: #DB1E37;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }

        .hero-title {
            font-size: clamp(2.2rem, 4vw, 3.5rem);
            color: #1a2e35;
            font-weight: 800;
            margin-bottom: 3rem;
            line-height: 1.2;
        }

        .hero-grid {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            max-width: 1280px;
            margin: 0 auto;
        }

        .hero-card {
            flex: 1;
            background: linear-gradient(145deg, #ffffff, #f0f4f8);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: filter 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hero-card-hovered {
            filter: none;
            transform: scale(1.03);
        }

        .hero-card-blurred {
            filter: blur(2px);
        }

        .hero-icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
        }

        .hero-service-title {
            font-size: 1.8rem;
            color: #1a2e35;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .hero-service-description {
            font-size: 1rem;
            color: #4a5568;
            line-height: 1.6;
        }

        @media (max-width: 992px) {
            .hero-grid {
                flex-direction: column;
                gap: 1.5rem;
            }

            .hero-card {
                padding: 1.5rem;
            }
        }

        @media (max-width: 768px) {
            .hero-section {
                padding: 3rem 1rem;
            }

            .hero-title {
                font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            }

            .section-badge {
                font-size: 0.9rem;
                padding: 0.4rem 1.2rem;
            }

            .hero-service-title {
                font-size: 1.5rem;
            }

            .hero-service-description {
                font-size: 0.95rem;
            }

            .hero-icon {
                font-size: 2.5rem;
            }
        }

        @media (max-width: 480px) {
            .hero-section {
                padding: 2rem 1rem;
            }

            .hero-title {
                font-size: clamp(1.5rem, 3vw, 2rem);
            }

            .hero-service-title {
                font-size: 1.3rem;
            }

            .hero-icon {
                font-size: 2rem;
            }
        }
    `]
})
export class ServicesComponent {
    @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
    @ViewChild('developpementSection', { static: true }) developpementSection!: ElementRef;
    @ViewChild('commercialisationSection', { static: true }) commercialisationSection!: ElementRef;
    @ViewChild('designCommunicationSection', { static: true }) designCommunicationSection!: ElementRef;

    isVisible: boolean = false;
    hoveredIndex: number | null = null;
    services = [
        {
            title: 'Développement',
            description: 'Boostez votre présence en ligne avec des solutions technologiques sur mesure.',
            icon: 'pi pi-code',
            ref: 'developpementSection'
        },
        {
            title: 'Commercialisation',
            description: 'Amplifiez votre visibilité et vos ventes grâce à des stratégies de marché efficaces.',
            icon: 'pi pi-chart-bar',
            ref: 'commercialisationSection'
        },
        {
            title: 'Design & Communication',
            description: 'Renforcez votre identité digitale avec un design percutant et une communication ciblée.',
            icon: 'pi pi-palette',
            ref: 'designCommunicationSection'
        }
    ];

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.heroSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.onScroll();
    }

    onHeroCardHover(index: number) {
        this.hoveredIndex = index;
    }

    onHeroCardLeave() {
        this.hoveredIndex = null;
    }

    scrollToService(ref: string) {
        const element = this[ref as keyof ServicesComponent] as ElementRef;
        if (element) {
            element.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
