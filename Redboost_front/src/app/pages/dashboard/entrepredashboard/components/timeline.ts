import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    standalone: true,
    selector: 'app-project-timeline',
    imports: [CommonModule],
    template: `
    <div class="card p-6 bg-gradient-to-br from-[#0A4955] to-[#08313A] rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 ease-in-out" [@fadeIn]>
        <div class="font-bold text-3xl text-white mb-6">Timeline du Projet</div>
        <div class="space-y-4">
            <div *ngFor="let event of timelineEvents" class="flex items-start">
                <div class="w-4 h-4 bg-[#DB1E37] rounded-full mt-2"></div>
                <div class="ml-4">
                    <div class="text-white font-semibold text-lg">{{ event.title }}</div>
                    <div class="text-[#A0AEC0] text-sm">{{ event.date }}</div>
                    <div class="text-[#A0AEC0] text-sm">{{ event.description }}</div>
                </div>
            </div>
        </div>
    </div>
    `,
    animations: [
        trigger('fadeIn', [
            state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
            transition(':enter', [
                animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class ProjectTimelineComponent {
    timelineEvents = [
        { title: 'Lancement du Projet', date: '01 Jan 2024', description: 'Début du projet avec l\'équipe principale' },
        { title: 'Phase de Conception', date: '15 Jan 2024', description: 'Conception des maquettes et prototypes' },
        { title: 'Développement Initial', date: '01 Fév 2024', description: 'Début du développement des fonctionnalités principales' },
        { title: 'Test et Validation', date: '15 Mar 2024', description: 'Tests intensifs et validation des fonctionnalités' },
        { title: 'Lancement Officiel', date: '01 Avr 2024', description: 'Lancement du produit sur le marché' }
    ];
}