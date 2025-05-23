// src/app/services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Phase } from '../../../models/phase';
import { Task } from '../../../models/task';
import { RendezVous } from '../../../models/rendez-vous.model';

interface RendezVousUpdate {
  rendezVous?: RendezVous;
  id?: number;
  action: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private phaseUpdatesSubject = new BehaviorSubject<Phase | { phaseId: number; action: string } | null>(null);
  private taskUpdatesSubject = new BehaviorSubject<Task | { taskId: number; action: string } | null>(null);
  private rendezVousUpdatesSubject = new BehaviorSubject<RendezVousUpdate | null>(null);
  phaseUpdates$: Observable<Phase | { phaseId: number; action: string } | null> = this.phaseUpdatesSubject.asObservable();
  taskUpdates$: Observable<Task | { taskId: number; action: string } | null> = this.taskUpdatesSubject.asObservable();
  rendezVousUpdates$: Observable<RendezVousUpdate | null> = this.rendezVousUpdatesSubject.asObservable();
  private apiUrl = 'http://localhost:8085';
  private projectId: number | null = null;
  private userId: number | null = null;

  constructor() {}

  // Overloaded initialize method
  initialize(projectId: number): void;
  initialize(projectId: number | null, userId: number | null): void;
  initialize(projectId: number | null, userId?: number | null): void {
    if (this.stompClient?.active && this.projectId === projectId && this.userId === userId) {
      console.log(`WebSocket already initialized for project ${projectId}, user ${userId}`);
      return;
    }
    this.projectId = projectId;
    this.userId = userId ?? null;
    console.log(`WebSocketService initialized for projectId: ${projectId}, userId: ${userId}`);
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.apiUrl}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      },
      onConnect: (frame: IFrame) => {
        console.log('STOMP Connected:', frame);
        // Phase and Task subscriptions
        if (this.projectId) {
          this.stompClient!.subscribe(`/topic/project/${this.projectId}/phases`, (message: IMessage) => {
            const update = JSON.parse(message.body);
            console.log(`Received phase update for project ${this.projectId}:`, update);
            this.phaseUpdatesSubject.next(update);
          });
          this.stompClient!.subscribe(`/topic/project/${this.projectId}/tasks`, (message: IMessage) => {
            const update = JSON.parse(message.body);
            console.log(`Received task update for project ${this.projectId}:`, update);
            this.taskUpdatesSubject.next(update);
          });
        }
        // Rendez-vous subscription
        if (this.userId) {
          this.stompClient!.subscribe(`/topic/rendezvous/${this.userId}`, (message: IMessage) => {
            const update: RendezVousUpdate = JSON.parse(message.body);
            console.log(`Received rendez-vous update for user ${this.userId}:`, update);
            this.rendezVousUpdatesSubject.next(update);
          });
        }
      },
      onStompError: (frame: IFrame) => {
        console.error('STOMP Error:', frame);
      },
      onWebSocketClose: () => {
        console.log('WebSocket Closed');
        this.phaseUpdatesSubject.next(null);
        this.taskUpdatesSubject.next(null);
        this.rendezVousUpdatesSubject.next(null);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
      }
    });

    this.stompClient.activate();
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}