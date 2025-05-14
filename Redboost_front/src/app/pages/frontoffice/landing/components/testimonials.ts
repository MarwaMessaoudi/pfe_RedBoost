import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'testimonials-widget',
    standalone: true,
    imports: [CommonModule, CarouselModule, ButtonModule],
    template: `
        <section class="testimonials-section">
            <div class="testimonials-container">
                <div class="testimonials-header">
                    <span class="testimonials-subtitle">Testimonials or Trust Section</span>
                    <h2 class="testimonials-title text-4xl font-bold text-[#0A4955] mt-2">Trusted by Innovators</h2>
                </div>

                <div class="testimonials-grid">
                    <div *ngFor="let testimonial of displayedTestimonials; let i = index" 
                         class="testimonial-card" 
                         [ngClass]="{'active': currentIndex === i % testimonials.length}">
                        <div class="rating flex">
                            <ng-container *ngFor="let star of [].constructor(testimonial.rating); let j = index">
                                <span class="star-icon text-[#CB4A59] text-xl">★</span>
                            </ng-container>
                        </div>
                        <h3 class="testimonial-name text-xl font-semibold text-[#004D4D] mt-4">
                            {{ testimonial.name }} - <span class="text-[#CB4A59]">{{ testimonial.role }}</span>
                        </h3>
                        <p class="testimonial-text text-[#666] italic mt-2">{{ testimonial.quote }}</p>
                    </div>
                </div>

                <div class="testimonials-dots flex justify-center mt-8">
                    <span *ngFor="let dot of testimonials; let i = index" 
                          class="dot" 
                          [ngClass]="{'active': currentIndex === i}" 
                          (click)="setCurrentIndex(i)"></span>
                </div>
            </div>
        </section>
    `,
    styles: [`
        .testimonials-section {
            padding: 120px 0;
            background: #f8faff;
            position: relative;
            overflow: hidden;
        }

        .testimonials-container {
            max-width: 1400px;
            width: 90%;
            margin: 0 auto;
            position: relative;
        }

        .testimonials-header {
            text-align: center;
            margin-bottom: 60px;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease forwards;
        }

        .testimonials-subtitle {
            display: inline-block;
            padding: 8px 20px;
            background: rgba(203, 74, 89, 0.1);
            color: #004D4D;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
        }

        .testimonials-title {
            font-size: clamp(2.5rem, 5vw, 4rem);
            color: #004D4D;
            margin-bottom: 1.5rem;
            font-weight: 800;
            line-height: 1.2;
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .testimonial-card {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            border: 1px solid rgba(203, 74, 89, 0.1);
            animation: slideIn 0.5s ease-out forwards;
            opacity: 0; /* Pour l'animation initiale */
        }

        .testimonial-card.active {
            transform: translateY(-5px);
            box-shadow: 0 20px 30px rgba(0, 77, 77, 0.1);
            border: 1px solid rgba(203, 74, 89, 0.2);
            opacity: 1; /* Réinitialise l'opacité pour l'élément actif */
        }

        .rating {
            margin-bottom: 1.5rem;
            display: flex;
            gap: 0.5rem;
            justify-content: center;
        }

        .star-icon {
            color: #CB4A59;
            font-size: 1.2rem;
        }

        .testimonial-name {
            font-size: 1.2rem;
            color: #004D4D;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        .testimonial-name span {
            color: #CB4A59;
        }

        .testimonial-text {
            color: #666;
            line-height: 1.6;
            font-size: 1rem;
        }

        .testimonials-dots {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(0, 77, 77, 0.2);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .dot.active {
            background: #CB4A59;
            transform: scale(1.5);
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

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @media (max-width: 1024px) {
            .testimonials-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .testimonials-section {
                padding: 80px 0;
            }

            .testimonials-grid {
                grid-template-columns: 1fr;
            }

            .testimonial-card {
                padding: 1.5rem;
            }

            .testimonials-title {
                font-size: 2.5rem;
            }
        }
    `]
})
export class TestimonialsWidget implements OnInit {
    testimonials = [
        {
            name: 'Oussama Lamine',
            role: 'CEO Pixi',
            quote: 'This services are really awesome. Thank you for the great job.',
            image: 'https://via.placeholder.com/150',
            rating: 5
        },
        {
            name: 'Mehdi Hadi',
            role: 'CFO TechCorp',
            quote: 'Amazing services with great attention to detail. Highly recommended!',
            image: 'https://via.placeholder.com/150',
            rating: 5
        },
        {
            name: 'Adem Abdallah',
            role: 'CEO Pixi',
            quote: 'This services are really awesome. Thank you for the great job.',
            image: 'https://via.placeholder.com/150',
            rating: 5
        }
    ];

    currentIndex = 0;
    displayedTestimonials = [...this.testimonials];

    ngOnInit() {
        this.startAutoRotation();
    }

    startAutoRotation() {
        this.interval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
            this.updateDisplayedTestimonials();
        }, 3000);
    }

    updateDisplayedTestimonials() {
        this.displayedTestimonials = [
            ...this.testimonials.slice(this.currentIndex),
            ...this.testimonials.slice(0, this.currentIndex)
        ];
    }

    setCurrentIndex(index: number) {
        this.currentIndex = index;
        this.updateDisplayedTestimonials();
        if (this.interval) {
            clearInterval(this.interval);
            this.startAutoRotation();
        }
    }

    private interval: any;
}

// Exportez le composant pour qu'il soit importable
