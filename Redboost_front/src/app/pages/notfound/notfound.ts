import { Component, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [RouterModule, ButtonModule, RippleModule],
  template: `
    <section class="min-h-screen flex items-center justify-center bg-[#FFFFFF] relative overflow-hidden">
      <!-- Bouncing Balls Canvas -->
      <canvas id="balls-canvas" class="absolute inset-0 pointer-events-none"></canvas>

      <div class="text-center max-w-md mx-auto relative z-10 px-4 sm:px-6">
        <!-- Logo -->
        <div class="mb-8">
          <img src="assets/images/logo_redboost.png" alt="RedBoost Logo" class="h-20 mx-auto" />
        </div>

        <!-- 404 Display -->
        <h1 class="text-6xl sm:text-8xl font-extrabold text-[#034A55] mb-6">404</h1>

        <!-- Message -->
        <h2 class="text-xl sm:text-2xl font-semibold text-[#C8223A] mb-4">Page Introuvable</h2>
        <p class="text-base sm:text-lg text-[#034A55] leading-relaxed mb-10 max-w-sm mx-auto">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <!-- Simple Red Button -->
        <div class="max-w-xs mx-auto">
          <button pButton pRipple
                  label="Retour à l'accueil"
                  routerLink="/Landing"
                  class="bg-[#C8223A] hover:bg-[#a61b30] border-0 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"></button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Button hover effect */
    button {
      transition: background-color 0.2s ease;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      .text-6xl {
        font-size: 3.5rem;
      }
      .text-8xl {
        font-size: 4.5rem;
      }
      .max-w-md {
        max-width: 90%;
      }
    }
  `]
})
export class Notfound implements AfterViewInit {
  ngAfterViewInit() {
    // Bouncing balls animation script
    const canvas = document.getElementById('balls-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const balls: { x: number, y: number, size: number, speedX: number, speedY: number, color: string }[] = [];
    const ballCount = 30;
    const colors = ['rgba(3, 74, 85, 0.4)', 'rgba(200, 34, 58, 0.4)'];

    // Initialize balls
    for (let i = 0; i < ballCount; i++) {
      balls.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 12 + 6,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Apply blur filter to canvas
    ctx.filter = 'blur(4px)';

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();

        // Update position
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Bounce off edges
        if (ball.x - ball.size < 0 || ball.x + ball.size > canvas.width) {
          ball.speedX *= -1;
        }
        if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
          ball.speedY *= -1;
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
}
