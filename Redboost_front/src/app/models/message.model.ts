// src/app/models/message.model.ts

export interface ReactionMessageDTO {
    id: number;
    userId: number;
    username: string;
    emoji: string;
  }
  
  export interface MessageDTO {
    id?: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    recipientId?: number;
    conversationId?: number;
    groupId?: number;
    dateEnvoi: string;
    conversationTitle?: string;
    reactionMessages?: ReactionMessageDTO[];
  }