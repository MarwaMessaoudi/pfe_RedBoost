import { Component, OnInit, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../frontoffice/service/UserService';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

interface CertificationDocument {
    id: number;
    documentUrl: string;
    documentName: string;
    documentType: string;
}

interface CoachRequest {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    yearsOfExperience: number;
    skills: string;
    expertise: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    binomeInvitationToken: string | null;
    relatedBinomeRequestId: number | null;
    binomeEmail: string | null;
    isCertified: boolean;
    totalProposedFee: number;
    cvUrl: string | null;
    trainingProgramUrl: string | null;
    certificationDocuments: CertificationDocument[];
    binome: boolean;
}

interface Connection {
    id1: number;
    id2: number;
    color: string;
}

@Component({
    selector: 'app-all-coach-requests',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="container">
            <h2 class="title">All Coach Requests</h2>
            <div *ngIf="loading" class="loading">Loading requests...</div>
            <div *ngIf="error" class="error">{{ error }}</div>
            <div *ngIf="!loading && !error && displayItems.length > 0" class="cards-container" #cardsContainer>
                <div *ngFor="let item of displayItems" class="card-wrapper">
                    <div *ngIf="item" class="card" [attr.data-request-id]="item.id" [ngClass]="getConnectionClass(item.id)">
                        <div class="card-header">
                            <div class="card-title-wrapper">
                                <h3 class="card-title">{{ item.firstName }} {{ item.lastName }}</h3>
                                <span *ngIf="item.binome" class="binome-icon" title="Binome Request">👥</span>
                            </div>
                            <span class="status" [ngClass]="{
                                'status-pending': item.status === 'PENDING',
                                'status-approved': item.status === 'APPROVED',
                                'status-rejected': item.status === 'REJECTED'
                            }">
                                {{ item.status }}
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="info-section">
                                <h4>Personal Information</h4>
                                <p><strong>Email:</strong> {{ item.email }}</p>
                                <p><strong>Phone:</strong> {{ item.phoneNumber || '-' }}</p>
                                <p><strong>Created At:</strong> {{ item.createdAt | date: 'medium' }}</p>
                            </div>
                            <div class="info-section">
                                <h4>Professional Details</h4>
                                <p><strong>Years of Experience:</strong> {{ item.yearsOfExperience }}</p>
                                <p><strong>Skills:</strong> {{ item.skills || '-' }}</p>
                                <p><strong>Expertise:</strong> {{ item.expertise || '-' }}</p>
                                <p><strong>Certified:</strong> {{ item.isCertified ? 'Yes' : 'No' }}</p>
                                <p><strong>Total Proposed Fee ($):</strong> {{ item.totalProposedFee || '-' }}</p>
                            </div>
                            <div class="info-section">
                                <h4>Documents</h4>
                                <p>
                                    <strong>CV:</strong>
                                    <a *ngIf="item.cvUrl" [href]="item.cvUrl" target="_blank" class="doc-link">View CV</a>
                                    <span *ngIf="!item.cvUrl">-</span>
                                </p>
                                <p>
                                    <strong>Training Program:</strong>
                                    <a *ngIf="item.trainingProgramUrl" [href]="item.trainingProgramUrl" target="_blank" class="doc-link">View Program</a>
                                    <span *ngIf="!item.trainingProgramUrl">-</span>
                                </p>
                                <p>
                                    <strong>Certifications:</strong>
                                    <ng-container *ngIf="item.certificationDocuments?.length">
                                        <a *ngFor="let doc of item.certificationDocuments" [href]="doc.documentUrl" target="_blank" class="doc-link">
                                            {{ doc.documentName }} ({{ doc.documentType }})
                                        </a>
                                    </ng-container>
                                    <span *ngIf="!item.certificationDocuments?.length">-</span>
                                </p>
                            </div>
                        </div>
                        <div class="card-footer" *ngIf="item.status === 'PENDING'">
                            <button class="approve-btn" (click)="approveRequest(item.id)">Approve</button>
                            <button class="reject-btn" (click)="rejectRequest(item.id)">Reject</button>
                        </div>
                    </div>
                </div>
            </div>
            <div *ngIf="!loading && !error && displayItems.length === 0" class="no-data">No coach requests found.</div>
        </div>
    `,
    styles: [
        `
            .container {
                max-width: 1200px;
                margin: 40px auto;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            .title {
                font-size: 2rem;
                font-weight: bold;
                color: #034a55;
                margin-bottom: 30px;
                text-align: center;
            }
            .loading {
                text-align: center;
                color: #034a55;
                font-size: 1.2rem;
            }
            .error {
                text-align: center;
                color: #c8223a;
                font-size: 1.2rem;
                margin-bottom: 20px;
            }
            .no-data {
                text-align: center;
                color: #6b7280;
                font-size: 1.2rem;
                margin-top: 20px;
            }
            .cards-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                position: relative;
            }
            .card-wrapper {
                min-height: 0;
            }
            .card {
                background: #f9fafb;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                overflow: hidden;
                transition: transform 0.2s, box-shadow 0.3s;
                position: relative;
                border: 2px solid transparent;
                height: 100%;
            }
            .card:hover {
                transform: translateY(-4px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .connection-color-0 {
                border: 2px solid #ec4899;
                box-shadow: 0 0 8px rgba(236, 72, 153, 0.5);
            }
            .connection-color-1 {
                border: 2px solid #10b981;
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
            }
            .connection-color-2 {
                border: 2px solid #3b82f6;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
            }
            .connection-color-3 {
                border: 2px solid #f59e0b;
                box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
            }
            .connection-color-4 {
                border: 2px solid #8b5cf6;
                box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
            }
            .card:hover.connection-color-0,
            .card.connection-color-0:hover ~ .card.connection-color-0 {
                border: 2px solid #db2777;
                box-shadow: 0 0 12px rgba(219, 39, 119, 0.7);
            }
            .card:hover.connection-color-1,
            .card.connection-color-1:hover ~ .card.connection-color-1 {
                border: 2px solid #059669;
                box-shadow: 0 0 12px rgba(5, 150, 105, 0.7);
            }
            .card:hover.connection-color-2,
            .card.connection-color-2:hover ~ .card.connection-color-2 {
                border: 2px solid #2563eb;
                box-shadow: 0 0 12px rgba(37, 99, 235, 0.7);
            }
            .card:hover.connection-color-3,
            .card.connection-color-3:hover ~ .card.connection-color-3 {
                border: 2px solid #d97706;
                box-shadow: 0 0 12px rgba(217, 119, 6, 0.7);
            }
            .card:hover.connection-color-4,
            .card.connection-color-4:hover ~ .card.connection-color-4 {
                border: 2px solid #7c3aed;
                box-shadow: 0 0 12px rgba(124, 58, 237, 0.7);
            }
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #EA7988 0%, #568086 100%);
                color: white;
            }
            .card-title-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .card-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0;
                color: #f3f4f6;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            .card-header .binome-icon:hover {
                transform: scale(1.2);
            }
            .status {
                padding: 5px 10px;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: 500;
            }
            .status-pending {
                background: #facc15;
                color: #1f2937;
            }
            .status-approved {
                background: #10b981;
                color: white;
            }
            .status-rejected {
                background: #ef4444;
                color: white;
            }
            .card-body {
                padding: 20px;
            }
            .info-section {
                margin-bottom: 20px;
            }
            .info-section h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: #034a55;
                margin-bottom: 10px;
            }
            .info-section p {
                margin: 8px 0;
                color: #1f2937;
                font-size: 0.95rem;
            }
            .info-section p strong {
                color: #034a55;
                margin-right: 5px;
            }
            .doc-link {
                color: #034a55;
                text-decoration: underline;
                margin-right: 10px;
                display: inline-block;
            }
            .doc-link:hover {
                color: #c8223a;
            }
            .card-footer {
                padding: 15px 20px;
                background: #f3f4f6;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .approve-btn,
            .reject-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.3s;
            }
            .approve-btn {
                background-color: #10b981;
                color: white;
            }
            .approve-btn:hover {
                background-color: #059669;
            }
            .reject-btn {
                background-color: #ef4444;
                color: white;
            }
            .reject-btn:hover {
                background-color: #dc2626;
            }
            @media (max-width: 900px) {
                .cards-container {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 600px) {
                .cards-container {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class AllCoachRequestsComponent implements OnInit, AfterViewChecked {
    requests: CoachRequest[] = [];
    displayItems: (CoachRequest | null)[] = [];
    loading = true;
    error: string | null = null;
    connections: Connection[] = [];
    private colorPalette: string[] = ['connection-color-0', 'connection-color-1', 'connection-color-2', 'connection-color-3', 'connection-color-4'];

    constructor(
        private userService: UserService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.fetchRequests();
    }

    ngAfterViewChecked() {
        this.updateConnections();
    }

    @HostListener('window:resize')
    onResize() {
        this.updateConnections();
    }

    fetchRequests() {
        this.loading = true;
        this.error = null;
        this.userService.getAllCoachRequests().subscribe({
            next: (data) => {
                this.requests = data;
                this.updateDisplayItems();
                this.loading = false;
                setTimeout(() => this.updateConnections(), 0);
            },
            error: (err) => {
                this.error = 'Failed to load coach requests. Please try again later.';
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.error
                });
            }
        });
    }

    updateDisplayItems() {
        const displayItems: (CoachRequest | null)[] = [];
        const processedIds = new Set<number>();
        const columns = 3;

        // Collect binome pairs and non-binome requests
        const binomePairs: [CoachRequest, CoachRequest][] = [];
        const nonBinomeRequests: CoachRequest[] = [];

        this.requests.forEach((request) => {
            if (request.binome && request.relatedBinomeRequestId && !processedIds.has(request.id)) {
                const relatedRequest = this.requests.find(
                    (r) => r.id === request.relatedBinomeRequestId
                );
                if (relatedRequest) {
                    binomePairs.push([request, relatedRequest]);
                    processedIds.add(request.id);
                    processedIds.add(relatedRequest.id);
                }
            } else if (!request.binome && !processedIds.has(request.id)) {
                nonBinomeRequests.push(request);
                processedIds.add(request.id);
            }
        });

        // Shuffle non-binome requests to randomize their placement
        for (let i = nonBinomeRequests.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonBinomeRequests[i], nonBinomeRequests[j]] = [nonBinomeRequests[j], nonBinomeRequests[i]];
        }

        // Combine binome pairs and non-binome requests
        const items: (CoachRequest | [CoachRequest, CoachRequest])[] = [];
        let binomeIndex = 0;
        let nonBinomeIndex = 0;

        // Randomly decide whether to add a binome pair or a non-binome request
        while (binomeIndex < binomePairs.length || nonBinomeIndex < nonBinomeRequests.length) {
            if (binomeIndex >= binomePairs.length) {
                items.push(nonBinomeRequests[nonBinomeIndex++]);
            } else if (nonBinomeIndex >= nonBinomeRequests.length) {
                items.push(binomePairs[binomeIndex++]);
            } else {
                // Randomly choose between binome pair and non-binome request
                if (Math.random() < 0.5) {
                    items.push(binomePairs[binomeIndex++]);
                } else {
                    items.push(nonBinomeRequests[nonBinomeIndex++]);
                }
            }
        }

        // Build displayItems array
        items.forEach((item) => {
            if (Array.isArray(item)) {
                // Binome pair
                displayItems.push(item[0], item[1]);
                if (displayItems.length % columns !== 0) {
                    displayItems.push(null);
                }
            } else {
                // Non-binome request
                displayItems.push(item);
            }
        });

        this.displayItems = displayItems;
    }

    approveRequest(requestId: number) {
        this.userService.approveCoachRequest(requestId).subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Coach request approved successfully.',
                    confirmButtonColor: '#034A55'
                });
                this.fetchRequests();
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Failed to approve request';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage
                });
            }
        });
    }

    rejectRequest(requestId: number) {
        this.userService.rejectCoachRequest(requestId).subscribe({
            next: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Coach request rejected successfully.',
                    confirmButtonColor: '#034A55'
                });
                this.fetchRequests();
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Failed to approve request';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage
                });
            }
        });
    }

    updateConnections() {
        const cout = 0;
        const connections: Connection[] = [];
        const processedPairs = new Set<string>();
        let colorIndex = 0;

        this.requests.forEach((request) => {
            if (request.binome && request.relatedBinomeRequestId) {
                const pairKey = [request.id, request.relatedBinomeRequestId].sort().join('-');
                if (processedPairs.has(pairKey)) return;
                processedPairs.add(pairKey);

                const color = this.colorPalette[colorIndex % this.colorPalette.length];
                colorIndex++;

                connections.push({
                    id1: request.id,
                    id2: request.relatedBinomeRequestId,
                    color
                });
            }
        });

        this.connections = connections;
    }

    getConnectionClass(requestId: number): string {
        const connection = this.connections.find(
            (conn) => conn.id1 === requestId || conn.id2 === requestId
        );
        return connection ? connection.color : '';
    }
}