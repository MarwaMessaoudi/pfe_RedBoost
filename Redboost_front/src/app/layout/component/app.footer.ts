import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        RedBoost by
        <a href="https://redstart.tn/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Redstart</a>
    </div>`
})
export class AppFooter {}
