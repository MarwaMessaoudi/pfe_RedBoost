import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../service/staff.service';
import { StaffType } from '../../../../models/Staff-type';
import { Attribute } from '../../../../models/Attribute';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-staff-type-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, DialogModule, MultiSelectModule, InputTextModule],
    templateUrl: './staff-type-detail.component.html',
    styleUrls: ['./staff-type-detail.component.scss'],
    providers: [MessageService]
})
export class StaffTypeDetailComponent implements OnInit {
    typeId: number = 0;
    staffType: StaffType | undefined;
    selectedFile: File | null = null;
    addAttributeDialogVisible: boolean = false;
    editAttributeDialogVisible: boolean = false;
    availableAttributes: Attribute[] = [];
    selectedAttributeIds: number[] = [];
    newAttributeName: string = '';
    newAttributeDefaultValues: string[] = [];
    editAttribute: Attribute | null = null;
    defaultAttributeNames: string[] = ['firstName', 'lastName', 'email', 'phoneNumber'];

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    constructor(
        private route: ActivatedRoute,
        private staffService: StaffService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.typeId = +params['id'];
            console.log("Chargement du type de personnel pour l'ID :", this.typeId);
            this.loadStaffType();
            this.loadAvailableAttributes();
        });
    }

    get filteredAttributes(): Attribute[] {
        return (this.staffType?.attributes || []).filter((attr) => attr != null);
    }

    isDefaultAttribute(attribute: Attribute): boolean {
        return this.defaultAttributeNames.includes(attribute.attributeName);
    }

    loadStaffType(): void {
        this.staffService.getStaffTypeById(this.typeId).subscribe({
            next: (staffType: StaffType) => {
                console.log('Type de personnel chargé :', staffType);
                this.staffType = staffType;
            },
            error: (error: any) => {
                console.error('Erreur lors du chargement du type de personnel :', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement du type de personnel' });
            }
        });
    }

    loadAvailableAttributes(): void {
        this.staffService.getAvailableAttributesForType(this.typeId).subscribe({
            next: (attributes: Attribute[]) => {
                console.log('Attributs disponibles chargés :', attributes);
                this.availableAttributes = attributes;
            },
            error: (error: any) => {
                console.error('Erreur lors du chargement des attributs disponibles :', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des attributs disponibles' });
            }
        });
    }

    downloadTemplate(): void {
        this.staffService.downloadTemplate(this.typeId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.staffType?.typeName}_modèle.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Modèle téléchargé' });
            },
            error: (error: any) => {
                console.error('Erreur de téléchargement :', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du modèle' });
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.selectedFile = file;
                console.log('Fichier sélectionné :', file.name, file.size, file.lastModified);
            } else {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner un fichier .xlsx' });
            }
        }
    }

    uploadFile(): void {
        if (!this.selectedFile) {
            this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'Aucun fichier sélectionné' });
            return;
        }

        console.log('Téléchargement du fichier :', this.selectedFile.name, this.selectedFile.size);
        this.staffService.importStaff(this.typeId, this.selectedFile).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Fichier téléchargé avec succès' });
                this.selectedFile = null;
                if (this.fileInput) {
                    this.fileInput.nativeElement.value = '';
                }
                this.loadStaffType();
            },
            error: (error: any) => {
                console.error('Erreur de téléchargement :', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.message || 'Échec du téléchargement du fichier'
                });
            }
        });
    }

    openAddAttributeDialog(): void {
        this.addAttributeDialogVisible = true;
        this.selectedAttributeIds = [];
        this.newAttributeName = '';
        this.newAttributeDefaultValues = [];
    }

    addAttribute(): void {
        if (this.selectedAttributeIds && this.selectedAttributeIds.length > 0) {
            const addAttributeRequests = this.selectedAttributeIds.map((attributeId: number) =>
                this.staffService
                    .createNewAttributeForType(this.typeId, attributeId)
                    .toPromise()
                    .then(() => {
                        console.log(`Attribut ID ${attributeId} ajouté avec succès`);
                    })
                    .catch((error: any) => {
                        if (error.status === 400 && error.error?.includes('already exists')) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Avertissement',
                                detail: error.error || `L'attribut avec l'ID ${attributeId} existe déjà dans ce type de personnel`
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: `Échec de l'ajout de l'attribut ID ${attributeId} : ${error.message || 'Erreur inconnue'}`
                            });
                        }
                        throw error;
                    })
            );

            Promise.all(addAttributeRequests)
                .then(() => {
                    this.loadStaffType();
                    this.loadAvailableAttributes();
                    this.addAttributeDialogVisible = false;
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Attributs ajoutés avec succès' });
                })
                .catch(() => {
                    console.error("Échec de l'ajout d'un ou plusieurs attributs");
                });
        } else if (this.newAttributeName) {
            this.staffService.createAttribute(this.newAttributeName, 'STRING', this.newAttributeDefaultValues.length > 0 ? this.newAttributeDefaultValues : undefined).subscribe({
                next: () => {
                    this.staffService.getAllAttributes().subscribe({
                        next: (attributes: Attribute[]) => {
                            const newAttr = attributes.find((attr) => attr.attributeName === this.newAttributeName);
                            if (newAttr) {
                                this.staffService.createNewAttributeForType(this.typeId, newAttr.id).subscribe({
                                    next: () => {
                                        this.loadStaffType();
                                        this.loadAvailableAttributes();
                                        this.addAttributeDialogVisible = false;
                                        this.newAttributeDefaultValues = [];
                                        this.newAttributeName = '';
                                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Nouvel attribut ajouté' });
                                    },
                                    error: (error: any) => {
                                        if (error.status === 400 && error.error?.includes('already exists')) {
                                            this.messageService.add({
                                                severity: 'warn',
                                                summary: 'Avertissement',
                                                detail: error.error || "Ce nom d'attribut existe déjà dans ce type de personnel"
                                            });
                                        } else {
                                            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de l'ajout de l'attribut au type de personnel" });
                                        }
                                    }
                                });
                            } else {
                                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de la recherche de l'attribut nouvellement créé" });
                            }
                        },
                        error: (error: any) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la récupération des attributs' })
                    });
                },
                error: (error: any) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de la création de l'attribut" })
            });
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: "Veuillez sélectionner au moins un attribut ou entrer un nouveau nom d'attribut" });
        }
    }

    openEditAttributeDialog(attribute: Attribute): void {
        this.editAttribute = { ...attribute };
        this.editAttributeDialogVisible = true;
    }

    updateAttribute(): void {
        if (!this.editAttribute) return;
        this.staffService.updateAttribute(this.editAttribute.id, this.editAttribute.attributeName, 'STRING', this.editAttribute.defaultValues).subscribe({
            next: () => {
                this.loadStaffType();
                this.editAttributeDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Attribut mis à jour' });
            },
            error: (error: any) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de la mise à jour de l'attribut" })
        });
    }

    deleteAttribute(attributeId: number): void {
        this.staffService.deleteAttribute(attributeId).subscribe({
            next: () => {
                this.loadStaffType();
                this.loadAvailableAttributes();
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Attribut supprimé' });
            },
            error: (error: any) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de la suppression de l'attribut" })
        });
    }

    addDefaultValue(value: string): void {
        if (value && !this.newAttributeDefaultValues.includes(value)) {
            this.newAttributeDefaultValues.push(value);
        }
    }

    removeDefaultValue(value: string): void {
        this.newAttributeDefaultValues = this.newAttributeDefaultValues.filter((v) => v !== value);
    }

    addDefaultValueEdit(value: string): void {
        if (value && this.editAttribute && !this.editAttribute.defaultValues?.includes(value)) {
            this.editAttribute.defaultValues = this.editAttribute.defaultValues || [];
            this.editAttribute.defaultValues.push(value);
        }
    }

    removeDefaultValueEdit(value: string): void {
        if (this.editAttribute && this.editAttribute.defaultValues) {
            this.editAttribute.defaultValues = this.editAttribute.defaultValues.filter((v) => v !== value);
        }
    }

    goToStaffTypes(): void {
        this.router.navigate(['/staff-types']);
    }
}
