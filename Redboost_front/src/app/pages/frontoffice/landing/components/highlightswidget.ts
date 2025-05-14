import { Component, ElementRef, AfterViewInit, QueryList, ViewChildren, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'highlights-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div id="highlights" class="challenge-section py-12 mx-0 my-12" style="background-color: #555;">
            <div class="container mx-auto px-6 lg:px-15">
                <div class="grid grid-cols-12 my-20 pt-2 md:pt-20">
                    <div class="col-span-12 lg:col-span-6 my-auto flex flex-col text-center lg:text-left lg:items-start gap-4">
                        <div class="leading-none text-[#0A4955] text-5xl font-extrabold animate-fade-in">
                            Une Plateforme Tout-en-Un pour Votre Succès
                        </div>
                        <ul #featureList class="my-8 list-none p-0 flex text-[#333] flex-col gap-2">
                            <li *ngFor="let feature of features; let i = index" #featureItem
                                class="py-3 px-6 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 feature-item"
                                [ngClass]="{'feature-animate': inView[i]}"
                                [style.transitionDelay]="(i * 0.2) + 's'">
                                <i class="pi pi-fw pi-check text-xl text-[#DB1E37] mr-2"></i>
                                <span class="text-xl leading-normal">{{ feature }}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="flex justify-end order-1 sm:order-2 col-span-12 lg:col-span-6 p-0 animate-fade-in">
                        <img #featureImage src="/assets/redstart1.jpg" 
                            class="custom-image transition-shadow duration-300"
                            [ngClass]="{'image-animate': imageInView}" 
                            alt="mockup" />
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .feature-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .feature-animate {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        /* 🌟 Animation d'entrée pour l'image */
        .custom-image {
            opacity: 0;
            transform: translateX(100px);
            transition: opacity 1s ease-out, transform 1s ease-out;
            width: 90%;
            max-height: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .image-animate {
            opacity: 1 !important;
            transform: translateX(0) !important;
        }

        /* 🎨 Effet hover sur l’image */
        .custom-image:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        }

        .challenge-section {
            min-height: 100vh;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            padding: 6rem 2rem;
            position: relative;
            overflow: hidden;
        }
            .custom-image {
    margin-top: 150px; /* ✅ Ajout du margin-top */
}

    `]
})
export class HighlightsWidget implements AfterViewInit {
    @ViewChildren('featureItem') featureItems!: QueryList<ElementRef>;
    @ViewChild('featureImage') featureImage!: ElementRef;
    
    inView: boolean[] = [];
    imageInView: boolean = false;

    features: string[] = [
        "Matching Intelligent : Trouvez le coach parfait en fonction de vos besoins et objectifs.",
        "Centralisation des Données : Accédez à toutes vos informations et interactions en un seul endroit.",
        "Communication Digitale : Échangez facilement avec votre coach via des outils intégrés.",
        "Suivi et Reporting : Visualisez vos progrès grâce à des rapports automatiques et des indicateurs clés",
        "Engage seamlessly with stakeholders, including entrepreneurs, investors, and government entities.",
        "Sécurité et Évolutivité : Une plateforme sécurisée, conçue pour grandir avec vous.",
        
    ];

    constructor(private cdRef: ChangeDetectorRef) {}

    ngAfterViewInit() {
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const index = this.featureItems.toArray().findIndex(el => el.nativeElement === entry.target);
                    if (entry.isIntersecting && index !== -1) {
                        this.inView[index] = true;
                        this.cdRef.detectChanges();  
                    }
                });
            }, { threshold: 0.2 });

            this.featureItems.forEach((el) => {
                observer.observe(el.nativeElement);
            });

            this.inView = new Array(this.features.length).fill(false); 

            // 🌟 Observer pour l'image (entrée de droite à gauche)
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.imageInView = true;
                        this.cdRef.detectChanges();
                    }
                });
            }, { threshold: 0.2 });

            imageObserver.observe(this.featureImage.nativeElement);
        });
    }
}