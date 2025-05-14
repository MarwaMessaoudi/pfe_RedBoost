import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-meeting-details-popup',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meeting-detail-popup.component.html',
    styleUrls: ['./meeting-detail-popup.component.scss']
})
export class MeetingDetailsPopupComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { RendezVous: RendezVous },
        private dialogRef: MatDialogRef<MeetingDetailsPopupComponent>,
        private router: Router
    ) {}

    closePopup() {
        this.dialogRef.close();
    }

    navigateToAppointmentList() {
        this.router.navigate(['/appointments']);
        this.dialogRef.close();
    }
}
