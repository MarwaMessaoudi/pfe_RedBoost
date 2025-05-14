import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../service/staff.service';
import { StaffType } from '../../../../models/Staff-type';
import { Attribute } from '../../../../models/Attribute';
import { Staff } from '../../../../models/Staff';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-staff-filter',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, MultiSelectModule],
    templateUrl: './staff-filter.component.html',
    styleUrls: ['./staff-filter.component.scss'],
    providers: [MessageService]
})
export class StaffFilterComponent implements OnInit {
    staffTypes: StaffType[] = [];
    attributes: Attribute[] = [];
    selectedTypeIds: number[] = [];
    selectedAttributeIds: number[] = [];
    staffList: Staff[] = [];
    filteredAttributes: Attribute[] = [];
    loading: boolean = false;

    constructor(
        private staffService: StaffService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadStaffTypes();
        this.loadAttributes();
    }

    loadStaffTypes(): void {
        this.staffService.getAllStaffTypes().subscribe({
            next: (staffTypes) => {
                this.staffTypes = staffTypes;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des types de personnel :', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des types de personnel' });
            }
        });
    }

    loadAttributes(): void {
        this.staffService.getAllAttributes().subscribe({
            next: (attributes) => {
                this.attributes = attributes;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des attributs :', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des attributs' });
            }
        });
    }

    filterStaff(): void {
        this.loading = true;
        console.log('Filtrage du personnel avec les ID de type :', this.selectedTypeIds);
        this.staffService.filterStaff(this.selectedTypeIds).subscribe({
            next: (staffList) => {
                console.log('Les données du personnel sont chargés avec avec succès:', staffList);
                this.staffList = staffList;
                this.filteredAttributes = this.attributes.filter((attr) => this.selectedAttributeIds.includes(attr.id));
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors de la récupération des données du personnel :', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du chargement des données du personnel : ' + (error.message || 'Erreur inconnue')
                });
                this.loading = false;
            }
        });
    }

    resetFilters(): void {
        this.selectedTypeIds = [];
        this.selectedAttributeIds = [];
        this.staffList = [];
        this.filteredAttributes = [];
        this.messageService.add({ severity: 'info', summary: 'Réinitialisé', detail: 'Les filtres ont été réinitialisés.' });
    }

    getAttributeValue(staff: Staff, attributeId: number): string {
        const staffValue = staff.staffValues.find((sv) => sv.attribute.id === attributeId);
        return staffValue ? staffValue.value : '';
    }
}
