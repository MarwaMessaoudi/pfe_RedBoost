import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FeedbackService } from '../service/Feedback.service';

import { ToastModule } from 'primeng/toast';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-feedback-page',
    standalone: true,
    imports: [CommonModule, ToastModule],
    templateUrl: './feedback-popup.component.html',
    styleUrls: ['./feedback-popup.component.scss'],
    providers: [MessageService],
    animations: [
        trigger('fadeInOut', [
            state('void', style({ opacity: 0, transform: 'scale(0.9)' })),
            transition(':enter', [animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))]),
            transition(':leave', [animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.9)' }))])
        ]),
        trigger('ratingHover', [
            state('default', style({ transform: 'scale(1)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' })),
            state('hovered', style({ transform: 'scale(1.1)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)' })),
            transition('default <=> hovered', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
        ])
    ]
})
export class FeedbackPageComponent implements OnInit {
    ratingOptions = [
        { emoji: '😞', value: 1, label: 'Mauvais', color: '#DB1E37' },
        { emoji: '😐', value: 2, label: 'Moyen', color: '#E44D62' },
        { emoji: '😊', value: 3, label: 'Bon', color: '#EA7988' },
        { emoji: '😍', value: 4, label: 'Excellent', color: '#568086' }
    ];

    selectedRating: number | null = null;
    hoveredRating: number | null = null;
    isSubmitted = false;

    constructor(
        private feedbackService: FeedbackService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit() {}

    selectRating(rating: number) {
        this.selectedRating = rating;
    }

    onHover(rating: number) {
        this.hoveredRating = rating;
    }

    onLeave() {
        this.hoveredRating = null;
    }

    submitFeedback() {
        if (!this.selectedRating) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez sélectionner une note'
            });
            return;
        }

        this.isSubmitted = true;

        this.feedbackService.submitFeedback(this.selectedRating).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Merci !',
                    detail: 'Votre feedback a été enregistré'
                });
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, 2000);
            },
            error: (err: { error?: { message?: string } }) => {
                this.isSubmitted = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || "Échec de l'envoi du feedback"
                });
            }
        });
    }
}
