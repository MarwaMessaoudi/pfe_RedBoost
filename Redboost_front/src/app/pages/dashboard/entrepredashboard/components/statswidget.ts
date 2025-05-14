import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6 bg-gradient-to-br from-[#0A4955] to-[#08313A] rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 ease-in-out">
            <div class="flex justify-between items-center">
                <div>
                    <div class="text-white font-bold text-2xl">15%</div>
                    <div class="text-[#A0AEC0] text-lg">Taux de Croissance</div>
                </div>
                <div class="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full">
                    <i class="pi pi-chart-line text-xl text-white"></i>
                </div>
            </div>
        </div>
        <div class="card p-6 bg-gradient-to-br from-[#0A4955] to-[#08313A] rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 ease-in-out">
            <div class="flex justify-between items-center">
                <div>
                    <div class="text-white font-bold text-2xl">$1.5M</div>
                    <div class="text-[#A0AEC0] text-lg">Levée de Fonds</div>
                </div>
                <div class="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full">
                    <i class="pi pi-money-bill text-xl text-white"></i>
                </div>
            </div>
        </div>
    </div>
    `
})
export class StatsWidget {}