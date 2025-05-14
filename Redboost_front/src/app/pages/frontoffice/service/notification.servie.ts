import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: WebSocket | null = null; // Type explicitly as WebSocket or null
  public messages: Subject<string> = new Subject<string>();

  connect(userId: string) {
    this.socket = new WebSocket('ws://localhost:8085/notifications');

    this.socket.onopen = () => {
      console.log('WebSocket connected for user:', userId);
      this.socket!.send(JSON.stringify({ userId: userId })); // ! asserts socket is not null
    };

    this.socket.onmessage = (event) => {
      console.log('Received WebSocket message:', event.data); // Add for debugging
      this.messages.next(event.data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket closed');
      this.socket = null; // Reset socket
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
      console.log('WebSocket disconnected manually');
    }
  }
}