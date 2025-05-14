import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-appointment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-container">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">Confirmer la suppression</h4>
        </div>
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer ce rendez-vous ?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="activeModal.dismiss()">Annuler</button>
          <button class="btn-delete" (click)="activeModal.close('confirm')">Supprimer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1050 !important;
    }

    .modal-content {
      width: 600px;
      background: #f5f7fa;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      z-index: 1060 !important;
      color: #333;
    }

    .modal-header {
      padding: 20px 30px;
      border-bottom: none;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a3c34;
      margin: 0;
    }

    .modal-body {
      padding: 20px 30px;
      text-align: center;
      font-size: 1.1rem;
      color: #666;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px 30px;
      border-top: none;
    }

    .btn-cancel,
    .btn-delete {
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 5px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn-cancel {
      background: transparent;
      color: #666;
      border: 1px solid #e0e0e0;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-delete {
      background: #ff5252;
      color: #fff;
    }

    .btn-delete:hover {
      background: #d32f2f;
    }
  `]
})
export class DeleteAppointmentModalComponent {
  @Input() appointmentId: number = 0;

  constructor(public activeModal: NgbActiveModal) {}
}