import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for ngClass and *ngFor

@Component({
  selector: 'app-hero-widget', // Consistent naming with Angular conventions
  standalone: true, // Make it standalone
  imports: [CommonModule], // Import CommonModule for ngClass and *ngFor
  template: `
    <section class="hero">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="hero-text">
          <div class="hero-badge" style="text-align: left; margin-left: 0">Welcome to Reboost</div>
          <h1 class="hero-title" style="text-align: left">
            Connectez-vous,
            <span class="highlight">{{ businessWord }}</span>
          </h1>
          <p class="hero-description">
            La plateforme qui révolutionne le lien entre entrepreneurs et coachs :
            <br />
            digitalisation fluide, suivi simplifié, résultats amplifiés.

          </p>
          <div class="cta-group">
            <button class="cta-button primary">
              Commencez dès aujourd'hui
              <i class="fi-arrow-right button-arrow"></i>
            </button>
          </div>
        </div>

        <div class="hero-images">
          <div class="carousel">
            <button class="carousel-button prev" (click)="prevImage()" aria-label="Previous image">
              <i class="fi-chevron-left"></i>
            </button>
            <img
              [src]="images[currentImage]"
              alt="Reboost Platform Interface"
              [ngClass]="{'hero-image': true, 'animating': isAnimating}"
            />
            <button class="carousel-button next" (click)="nextImage()" aria-label="Next image">
              <i class="fi-chevron-right"></i>
            </button>
            <div class="dots-indicator">
              <button
                *ngFor="let image of images; let i = index"
                [ngClass]="{'dot': true, 'active': currentImage === i}"
                (click)="goToImage(i)"
                [attr.aria-label]="'Go to image ' + (i + 1)"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      background:rgb(255, 255, 255);
      padding-top: calc(45px + 75px);
      width: 100%;
      margin-top: -50px;
    }

    .hero-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0, 77, 77, 0.05) 0%, rgba(203, 74, 89, 0.02) 100%);
      z-index: 1;
    }

    .hero-content {
      width: 90%;
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
      position: relative;
      z-index: 2;
      padding: 2rem 0;
    }

    .hero-text {
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.8s ease forwards;
      color: #C8223A;
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-badge {
      display: inline-block;
      padding: 8px 20px;
      background: rgba(203, 74, 89, 0.1);
      color: #004D4D;
      border-radius: 30px;
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 2rem;
      text-align: left;
      margin-left: 0;
    }

    .hero-title {
      font-size: 40px;
      line-height: 1.1;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      font-weight: 800;
      text-align: left;
      width: 100%;
    }

    .highlight {
      position: relative;
      display: inline-block;
      color: #CB4A59;
      min-width: 150px;
    }

    .underline-svg {
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 100%;
      height: 10px;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: drawUnderline 1s ease forwards 0.5s;
    }

    .hero-description {
      font-size: 1.2rem;
      color: black;
      line-height: 1.6;
      margin-bottom: 2.5rem;
      max-width: 600px;
      font-weight: bold;
      text-align: left;
    }

    .cta-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cta-button {
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cta-button.primary {
      background: linear-gradient(to right, #C8223A, #034A55);
      color: white;
      border: none;
      box-shadow: 0 10px 20px rgba(0, 77, 77, 0.15);
    }

    .cta-button.primary:hover {
      background: linear-gradient(to right, #034A55, #C8223A);
      transform: translateY(-2px);
      box-shadow: 0 15px 25px rgba(0, 77, 77, 0.2);
    }

    .hero-images {
      opacity: 0;
      transform: translateX(20px);
      animation: fadeInRight 0.8s ease forwards 0.3s;
    }

    .carousel {
      position: relative;
      width: 100%;
      padding: 2rem 0;
    }

    .hero-image {
      width: 100%;
      height: auto;
      border-radius: 24px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .hero-image.animating {
      opacity: 0;
      transform: scale(0.98);
    }

    .carousel-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: none;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 3;
    }

    .carousel-button:hover {
      background: #CB4A59;
      color: white;
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 12px rgba(203, 74, 89, 0.2);
    }

    .carousel-button.prev {
      left: -24px;
    }

    .carousel-button.next {
      right: -24px;
    }

    @media (max-width: 1200px) {
      .hero-content {
        gap: 2rem;
      }
      
      .hero-badge {
        margin-left: 50px;
      }
      
      .hero-title {
        margin-left: 20px;
      }
      
      .cta-button {
        margin-left: 50px;
      }
    }

    @media (max-width: 992px) {
      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .hero-text {
        order: 1;
      }

      .hero-images {
        order: 2;
      }

      .hero-badge {
        margin: 0 auto 2rem;
      }

      .hero-title {
        margin-left: 0;
        text-align: center;
      }

      .hero-description {
        text-align: center;
        margin: 0 auto 2.5rem;
      }

      .cta-group {
        justify-content: center;
      }

      .cta-button {
        margin-left: 0;
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding-top: 100px;
        min-height: auto;
      }

      .hero-content {
        width: 95%;
        padding: 1rem 0;
      }

      .hero-title {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .hero-description {
        font-size: 1rem;
        padding: 0 1rem;
      }

      .carousel-button {
        width: 40px;
        height: 40px;
      }

      .carousel-button.prev {
        left: -10px;
      }

      .carousel-button.next {
        right: -10px;
      }
    }

    @media (max-width: 480px) {
      .hero {
        padding-top: 80px;
      }

      .hero-badge {
        font-size: 1rem;
        padding: 6px 16px;
      }

      .hero-title {
        font-size: clamp(1.8rem, 3.5vw, 2.5rem);
      }

      .cta-button {
        width: 100%;
        justify-content: center;
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

    @keyframes fadeInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes drawUnderline {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes typewriting {
      0%, 10% {
        width: 0;
      }
      30%, 70% {
        width: 100%;
      }
      10%, 70% {
        width: 0;
      }
    }
  `]
})
export class HeroWidget implements OnInit, OnDestroy {
  currentImage: number = 0;
  isAnimating: boolean = false;
  businessWord: string = 'Progressez.';

  images: string[] = [
    'assets/images/comm.jpeg',
    'assets/images/commu.jpg',
    'assets/images/commun.jpeg'
  ];

  private imageInterval: any;
  private wordInterval: any;

  ngOnInit() {
    this.imageInterval = setInterval(() => this.nextImage(), 5000);
    const words = [' Progressez.', ' Réussissez.'];
    let index = 0;
    this.wordInterval = setInterval(() => {
      index = (index + 1) % words.length;
      this.businessWord = words[index];
    }, 3000);
  }

  ngOnDestroy() {
    if (this.imageInterval) clearInterval(this.imageInterval);
    if (this.wordInterval) clearInterval(this.wordInterval);
  }

  handleImageTransition(newIndex: number) {
    this.isAnimating = true;
    setTimeout(() => {
      this.currentImage = newIndex;
      this.isAnimating = false;
    }, 300);
  }

  nextImage() {
    const newIndex = (this.currentImage + 1) % this.images.length;
    this.handleImageTransition(newIndex);
  }

  prevImage() {
    const newIndex = (this.currentImage - 1 + this.images.length) % this.images.length;
    this.handleImageTransition(newIndex);
  }

  goToImage(index: number) {
    this.handleImageTransition(index);
  }
}