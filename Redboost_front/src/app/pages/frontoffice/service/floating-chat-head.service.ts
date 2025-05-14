// src/app/service/floating-chat-head.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageDTO } from '../../../models/message.model';

export interface ChatHead {
    conversationId: number;
    name: string;
    avatar: string;
    unreadCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class FloatingChatHeadService {
    private chatHeads: ChatHead[] = [];
    private chatHeadsSubject = new BehaviorSubject<ChatHead[]>([]);
    chatHeads$ = this.chatHeadsSubject.asObservable();

    addChatHead(message: MessageDTO): void {
        const existingHead = this.chatHeads.find((head) => head.conversationId === message.conversationId);
        if (existingHead) {
            existingHead.unreadCount = (existingHead.unreadCount || 0) + 1;
        } else {
            const newHead: ChatHead = {
                conversationId: message.conversationId!,
                name: message.conversationTitle || message.senderName || 'Unknown',
                avatar: message.senderAvatar || 'assets/avatars/user.jpg',
                unreadCount: 1
            };
            this.chatHeads.push(newHead);
        }
        this.chatHeadsSubject.next([...this.chatHeads]);
    }

    markAsRead(conversationId: number): void {
        const head = this.chatHeads.find((h) => h.conversationId === conversationId);
        if (head) {
            head.unreadCount = 0;
            this.chatHeadsSubject.next([...this.chatHeads]);
        }
    }

    removeChatHead(conversationId: number): void {
        this.chatHeads = this.chatHeads.filter((h) => h.conversationId !== conversationId);
        this.chatHeadsSubject.next([...this.chatHeads]);
    }

    clearChatHeads(): void {
        this.chatHeads = [];
        this.chatHeadsSubject.next([]);
    }
}
