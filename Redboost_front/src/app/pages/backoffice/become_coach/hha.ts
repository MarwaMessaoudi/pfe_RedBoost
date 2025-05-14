import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-test-binome-icon',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="container">
            <h2>Binome Icon Test</h2>
            <div class="test-group">
                <p>SVG Icon (Custom): 
                    <span class="binome-icon" title="SVG Icon" style="color: #eab308 !important;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                            <circle cx="8" cy="10" r="2" fill="currentColor"/>
                            <circle cx="16" cy="10" r="2" fill="currentColor"/>
                            <path d="M8 14h8c0 1.5-3.6 2-4 2s-4-.5-4-2z" fill="currentColor"/>
                        </svg>
                    </span>
                </p>
                <p>Handshake Emoji (🤝): <span class="binome-icon" title="Handshake Emoji" style="color: #eab308 !important;">🤝</span></p>
                <p>Text(BN): <span class="binome-icon" title="Text Test" style="color: #eab308 !important;">BN</span></p>
            </div>
        </div>
    `,
    styles: [
        `
            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: #f9fafb;
                font-family: Arial, sans-serif;
            }
            h2 {
                font-size: 1.5rem;
                color: #034a55;
                margin-bottom: 20px;
            }
            .test-group {
                display: flex;
                flex-direction: column;
                gap: 15px;
                text-align: left;
            }
            .test-group p {
                font-size: 1.1rem;
                color: #1f2937;
                margin: 0;
            }
            .container span.binome-icon {
                font-size: 2rem;
                color: #eab308 !important;
                cursor: help;
                transition: transform 0.2s;
                display: inline-block;
                vertical-align: middle;
                line-height: 1;
            }
            .container span.binome-icon svg {
                width: 24px;
                height: 24px;
                fill: currentColor;
            }
            .container span.binome-icon:hover {
                transform: scale(1.2);
            }
        `
    ]
})
export class TestBinomeIconComponent {}