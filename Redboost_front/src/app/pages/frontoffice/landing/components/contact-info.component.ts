import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'contact-info',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-0 py-2">
            <div class="container mx-auto px-6">
                <!-- Version mobile -->
                <div *ngIf="isMobileView" style="display: flex; justify-content: center;">
                    <span class="text-sm">Phone: +216 71 793 125</span>
                </div>
                
                <!-- Version desktop -->
                <div *ngIf="!isMobileView" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="text-sm">Email: inforedsost.com</span>
                        <span class="text-sm">Phone: +216 71 793 125</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <a href="https://www.facebook.com/redstartunisie/?locale=fr_FR" class="text-sm">Follow us on Facebook</a>
                        <a href="https://www.facebook.com/redstartunisie/?locale=fr_FR" class="text-sm">Follow us on Twitter</a>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
    `]
})
export class ContactInfoComponent implements OnInit {
    isMobileView: boolean = true;
    
    ngOnInit() {
        this.checkScreenSize();
        window.addEventListener('resize', () => this.checkScreenSize());
    }
    
    checkScreenSize() {
        this.isMobileView = window.innerWidth < 640;
    }
    
    ngOnDestroy() {
        window.removeEventListener('resize', () => this.checkScreenSize());
    }
}