import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-maturity-level',
    imports: [CommonModule],
    template: `
    <div class="card p-6 bg-gradient-to-br from-[#0A4955] to-[#08313A] rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 ease-in-out">
        <div class="font-bold text-3xl text-white mb-6">Maturité des Projets</div>
        <div class="flex justify-around">
            <div *ngFor="let project of projects" class="text-center">
                <div class="radial-progress text-[#DB1E37]" [style.--value]="project.progress" role="progressbar">
                    {{ project.progress }}%
                </div>
                <div class="text-white font-semibold mt-2">{{ project.name }}</div>
            </div>
        </div>
    </div>
    `
})
export class MaturityLevelComponent {
    projects = [
        { name: 'Projet A', progress: 75 },
        { name: 'Projet B', progress: 50 },
        { name: 'Projet C', progress: 90 }
    ];
}