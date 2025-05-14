import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

interface Notification {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  contentPreview: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private unreadMessageCountSubject = new BehaviorSubject<number>(0);
  unreadMessageCount$: Observable<number> = this.unreadMessageCountSubject.asObservable();
  private stompClient: Client | null = null;
  private subscriptions: Subscription[] = [];
  private userId: number | null = null;

  constructor(private http: HttpClient) {}

  initialize(userId: number): void {
    this.userId = userId;
    console.log('NotificationService initialized for userId:', userId);
    this.fetchUnreadMessageCount();
    this.setupWebSocket();
  }

  private fetchUnreadMessageCount(): void {
    if (!this.userId) {
      console.error('Cannot fetch unread message count: No user ID available');
      return;
    }
    this.subscriptions.push(
      this.http.get<number>(`http://localhost:8085/api/messages/unread/total-count/${this.userId}`).subscribe({
        next: (count) => {
          console.log(`Fetched unread message count for user ${this.userId}:`, count);
          this.unreadMessageCountSubject.next(count);
        },
        error: (err) => {
          console.error('Error fetching unread message count:', err);
          this.unreadMessageCountSubject.next(0);
        }
      })
    );
  }

  private setupWebSocket(): void {
    if (!this.userId) {
      console.error('Cannot setup WebSocket: No user ID available');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8085/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      },
      onConnect: (frame: IFrame) => {
        console.log('STOMP Connected for notifications:', frame);
        this.stompClient!.subscribe(`/topic/notifications/${this.userId}`, (message: IMessage) => {
          const notification: Notification = JSON.parse(message.body);
          console.log('Received notification:', notification);
          this.fetchUnreadMessageCount(); // Fetch latest count instead of incrementing
        });
      },
      onStompError: (frame: IFrame) => {
        console.error('STOMP Error:', frame);
      },
      onWebSocketClose: () => {
        console.log('WebSocket Closed');
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
      }
    });

    this.stompClient.activate();
  }

  updateUnreadMessageCount(): void {
    console.log('Updating unread message count for user:', this.userId);
    this.fetchUnreadMessageCount();
  }

  getUnreadMessageCount(): Observable<number> {
    return this.unreadMessageCount$;
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}