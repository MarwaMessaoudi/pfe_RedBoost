import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, SimpleChanges, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/UserService';

interface ChatItem {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    status?: string;
    unreadCount?: number;
    conversationId: number;
    isGroup?: boolean;
}

interface User {
    id: number;
    name: string;
    avatar: string;
}

interface Reaction {
    id?: number;
    userId: number;
    username: string;
    emoji: string;
}

interface Message {
    id?: number;
    text: string;
    time: string;
    sent: boolean;
    read?: boolean;
    file?: {
        name: string;
        size: string;
        url: string;
    };
    showOptions: boolean;
    showReactionPicker?: boolean;
    senderAvatar?: string;
    reactions?: Reaction[];
}

interface MessageDTO {
    id?: number;
    content: string;
    timestamp: string;
    senderId: number;
    senderName: string;
    recipientId?: number;
    conversationId?: number;
    groupId?: number;
    isRead: boolean;
    senderAvatar?: string;
    reactionMessages?: {
        id: number;
        userId: number;
        username: string;
        emoji: string;
    }[];
}

interface PrivateMessageRequest {
    senderId: number;
    recipientId: number;
    content: string;
}

interface GroupMessageRequest {
    senderId: number;
    conversationId: number;
    content: string;
}

interface UpdateMessageRequest {
    userId: number;
    newContent: string;
}

interface AddMemberRequest {
    memberId: number;
}

interface RoleSpecificUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    profile_pictureurl?: string;
    specialization?: string;
    yearsOfExperience?: number;
    StartupName?: string;
    Industry?: string;
}

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
    @Input() currentChat!: ChatItem;
    @Input() currentUser!: User;
    @Output() goBack = new EventEmitter<void>();
    @Output() messagesMarkedAsRead = new EventEmitter<number>();

    newMessage: string = '';
    selectedFile: File | null = null;
    messages: Message[] = [];
    private stompClient: Client | null = null;
    private currentUserId: number | null = null;
    isEditing: boolean = false;
    editingMessageIndex: number = -1;
    isLoading: boolean = false;
    isLoadingOlder: boolean = false;
    availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    private currentPage: number = 0;
    private pageSize: number = 10;
    public hasMoreMessages: boolean = true;
    showAddMemberModal: boolean = false;
    showViewMembersModal: boolean = false;
    availableUsers: RoleSpecificUser[] = [];
    groupMembers: RoleSpecificUser[] = [];
    selectedUser: RoleSpecificUser | null = null;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private userService: UserService,
        private cdr: ChangeDetectorRef
    ) {}

    @HostListener('document:click', ['$event'])
    closeDropdowns(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.message-options') && !target.closest('.reaction-picker')) {
            this.messages = this.messages.map((msg) => ({
                ...msg,
                showOptions: false,
                showReactionPicker: false
            }));
            this.cdr.detectChanges();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentChat'] && changes['currentChat'].currentValue !== changes['currentChat'].previousValue) {
            this.messages = [];
            this.newMessage = '';
            this.isEditing = false;
            this.editingMessageIndex = -1;
            this.currentPage = 0;
            this.hasMoreMessages = true;
            this.disconnectWebSocket();
            if (this.currentUserId) {
                this.setupWebSocket();
                this.loadMessages();
            }
        }
    }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe({
            next: (user) => {
                if (user) {
                    this.currentUserId = user.id;
                    this.setupWebSocket();
                    this.loadMessages();
                } else {
                    console.error('Aucun utilisateur connecté');
                }
            },
            error: (err) => {
                console.error('Erreur lors de la récupération de l’utilisateur:', err);
            }
        });
    }

    ngOnDestroy(): void {
        this.disconnectWebSocket();
    }

    addMember(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error("Impossible d'ajouter un membre: ID utilisateur ou ID de conversation manquant");
            return;
        }
    
        this.isLoading = true;
        this.http.get<RoleSpecificUser[]>(`http://localhost:8085/api/conversations/${this.currentChat.conversationId}/non-members`).subscribe({
            next: (nonMembers) => {
                this.availableUsers = nonMembers.filter(user => 
                    user.role && ['ENTREPRENEUR', 'COACH', 'INVESTOR'].some(role => 
                        role.toLowerCase() === user.role.toLowerCase()
                    )
                );
                this.showAddMemberModal = true;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la récupération des non-membres:', error);
                alert('Échec de la récupération des utilisateurs disponibles.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    viewMembers(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error("Impossible de voir les membres: ID utilisateur ou ID de conversation manquant");
            return;
        }

        this.isLoading = true;
        this.http.get<RoleSpecificUser[]>(`http://localhost:8085/api/conversations/${this.currentChat.conversationId}/members`).subscribe({
            next: (members) => {
                this.groupMembers = members;
                this.showViewMembersModal = true;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la récupération des membres:', error);
                let errorMessage = 'Échec de la récupération des membres.';
                if (error.status === 404) {
                    errorMessage = 'Conversation non trouvée.';
                } else if (error.status === 400) {
                    errorMessage = 'Requête invalide.';
                }
                alert(errorMessage);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    selectUser(user: RoleSpecificUser): void {
        this.selectedUser = user;
        this.cdr.detectChanges();
    }

    closeAddMemberModal(): void {
        this.showAddMemberModal = false;
        this.availableUsers = [];
        this.selectedUser = null;
        this.cdr.detectChanges();
    }

    closeViewMembersModal(): void {
        this.showViewMembersModal = false;
        this.groupMembers = [];
        this.cdr.detectChanges();
    }

    confirmAddMember(): void {
        if (!this.currentUserId || !this.currentChat.conversationId || !this.selectedUser) {
            console.error('Impossible d’ajouter un membre: Données manquantes');
            return;
        }

        this.isLoading = true;
        const request: AddMemberRequest = {
            memberId: this.selectedUser.id
        };

        this.http.patch(`http://localhost:8085/api/conversations/${this.currentChat.conversationId}/members`, request).subscribe({
            next: () => {
                alert('Membre ajouté avec succès !');
                this.closeAddMemberModal();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de l’ajout du membre:', error);
                let errorMessage = 'Échec de l’ajout du membre.';
                if (error.status === 404) {
                    errorMessage = 'Conversation ou utilisateur non trouvé.';
                } else if (error.status === 400) {
                    errorMessage = error.error || 'Requête invalide.';
                }
                alert(errorMessage);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    leaveGroup(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error('Impossible de quitter le groupe: ID utilisateur ou ID de conversation manquant');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
            return;
        }

        this.isLoading = true;
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        });

        this.http.delete(`http://localhost:8085/api/conversations/${this.currentChat.conversationId}/leave`, { headers }).subscribe({
            next: () => {
                alert('Vous avez quitté le groupe avec succès.');
                this.isLoading = false;
                this.goBack.emit();
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la tentative de quitter le groupe:', error);
                let errorMessage = 'Échec de la tentative de quitter le groupe.';
                if (error.status === 404) {
                    errorMessage = 'Conversation ou utilisateur non trouvé.';
                } else if (error.status === 400) {
                    errorMessage = error.error || 'Vous ne pouvez pas quitter ce groupe (par exemple, vous êtes le créateur).';
                } else if (error.status === 401) {
                    errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
                }
                alert(errorMessage);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private setupWebSocket(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error('Impossible de configurer WebSocket: ID utilisateur ou ID de conversation manquant');
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
                console.log('STOMP Connected:', frame);
                this.stompClient!.subscribe(`/topic/conversation/${this.currentChat.conversationId}`, (message: IMessage) => {
                    const messageDTO: MessageDTO = JSON.parse(message.body);
                    this.fetchAndMapMessage(messageDTO).then((mappedMessage) => {
                        if (mappedMessage) {
                            const isNewMessage = !this.messages.some((m) => m.id === mappedMessage.id);
                            if (isNewMessage) {
                                this.messages.push(mappedMessage);
                                this.scrollToBottom();
                                if (!messageDTO.isRead && 
                                    messageDTO.senderId !== this.currentUserId && 
                                    messageDTO.id && 
                                    (messageDTO.recipientId === this.currentUserId || this.currentChat.isGroup)) {
                                    this.markMessagesAsRead([messageDTO.id]);
                                }
                            } else {
                                const index = this.messages.findIndex((m) => m.id === mappedMessage.id);
                                if (index !== -1) {
                                    this.messages[index] = mappedMessage;
                                    this.cdr.detectChanges();
                                }
                            }
                        }
                    });
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

    private disconnectWebSocket(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    }

    private isGroupChat(): boolean {
        return this.currentChat.isGroup || false;
    }

    private loadMessages(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error('Impossible de charger les messages: ID utilisateur ou ID de conversation manquant');
            return;
        }

        this.isLoading = true;
        this.fetchMessages(this.currentPage, false);
    }

    private fetchMessages(page: number, prepend: boolean): void {
        if (!this.currentUserId) {
            console.error('Cannot fetch messages: No user ID available');
            this.isLoading = false;
            this.isLoadingOlder = false;
            return;
        }

        this.http
            .get<MessageDTO[]>(`http://localhost:8085/api/messages/conversation/${this.currentChat.conversationId}`, {
                params: {
                    page: page.toString(),
                    size: this.pageSize.toString(),
                    userId: this.currentUserId.toString()
                }
            })
            .subscribe({
                next: (messages) => {
                    console.log('Fetched messages:', messages);
                    Promise.all(messages.map((dto) => this.fetchAndMapMessage(dto))).then((mappedMessages) => {
                        console.log('Mapped messages:', mappedMessages);
                        let newMessages = mappedMessages.filter((msg) => msg !== null) as Message[];
                        if (prepend) {
                            newMessages = newMessages.reverse();
                            this.messages = [...newMessages, ...this.messages].filter((msg, index, self) => index === self.findIndex((m) => m.id === msg.id));
                        } else {
                            this.messages = newMessages.reverse();
                        }
                        console.log('Updated messages array:', this.messages);
                        this.hasMoreMessages = newMessages.length === this.pageSize;
                        this.scrollToBottom();
                        const unreadMessageIds = messages
                            .filter((m) => !m.isRead && m.senderId !== this.currentUserId && m.id)
                            .map((m) => m.id!);
                        if (unreadMessageIds.length > 0) {
                            this.markMessagesAsRead(unreadMessageIds);
                        }
                        this.isLoading = false;
                        this.isLoadingOlder = false;
                        this.cdr.detectChanges();
                    });
                },
                error: (err) => {
                    console.error(`Error fetching messages for conversation ${this.currentChat.conversationId}:`, err);
                    this.isLoading = false;
                    this.isLoadingOlder = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private markMessagesAsRead(messageIds: number[]): void {
        if (!this.currentUserId || messageIds.length === 0) {
            console.warn('Cannot mark messages as read: Missing userId or messageIds');
            return;
        }

        console.log(`Marking messages as read: messageIds=${messageIds}, userId=${this.currentUserId}`);
        this.http
            .put('http://localhost:8085/api/messages/mark-as-read', messageIds, {
                params: { userId: this.currentUserId.toString() },
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                })
            })
            .subscribe({
                next: () => {
                    console.log('Messages marked as read successfully:', messageIds);
                    this.messages = this.messages.map((msg) => ({
                        ...msg,
                        read: messageIds.includes(msg.id!) ? true : msg.read
                    }));
                    this.messagesMarkedAsRead.emit(this.currentChat.conversationId);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error marking messages as read:', err);
                    alert('Failed to mark messages as read. Please try again.');
                }
            });
    }

    loadOlderMessages(): void {
        if (!this.hasMoreMessages || this.isLoadingOlder) return;
        this.isLoadingOlder = true;
        this.currentPage++;
        this.fetchMessages(this.currentPage, true);
    }

    private fetchAndMapMessage(dto: MessageDTO): Promise<Message | null> {
        return new Promise((resolve) => {
            if (dto.senderAvatar) {
                resolve(this.mapToMessage(dto));
                return;
            }

            this.userService.getUserById(dto.senderId).subscribe({
                next: (user) => {
                    const avatar = user?.profile_pictureurl || 'assets/avatars/user.jpg';
                    resolve(this.mapToMessage({ ...dto, senderAvatar: avatar }));
                },
                error: () => {
                    resolve(this.mapToMessage({ ...dto, senderAvatar: 'assets/avatars/user.jpg' }));
                }
            });
        });
    }

    private mapToMessage(dto: MessageDTO): Message {
        return {
            id: dto.id,
            text: dto.content,
            time: new Date(dto.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sent: dto.senderId === this.currentUserId,
            read: dto.isRead,
            showOptions: false,
            showReactionPicker: false,
            senderAvatar: dto.senderAvatar || 'assets/avatars/user.jpg',
            reactions:
                dto.reactionMessages?.map((r) => ({
                    id: r.id,
                    userId: r.userId,
                    username: r.username,
                    emoji: r.emoji
                })) || []
        };
    }

    toggleReactionPicker(index: number): void {
        this.messages = this.messages.map((msg, i) => ({
            ...msg,
            showReactionPicker: i === index ? !msg.showReactionPicker : false,
            showOptions: i === index ? false : msg.showOptions
        }));
        this.cdr.detectChanges();
    }

    addReaction(messageIndex: number, emoji: string): void {
        if (!this.currentUserId) return;

        const message = this.messages[messageIndex];
        if (!message.id) return;

        const existingReaction = message.reactions?.find((r) => r.userId === this.currentUserId && r.emoji === emoji);

        if (existingReaction) {
            this.removeReaction(messageIndex, existingReaction.id!);
            return;
        }

        this.http
            .post<MessageDTO>(`http://localhost:8085/api/messages/${message.id}/reactions`, null, {
                params: {
                    userId: this.currentUserId.toString(),
                    emoji
                }
            })
            .subscribe({
                next: () => {
                    // Reaction update is handled via STOMP subscription
                },
                error: (err) => {
                    console.error('Error adding reaction:', err);
                }
            });
    }

    removeReaction(messageIndex: number, reactionId: number): void {
        if (!this.currentUserId) return;

        const message = this.messages[messageIndex];
        if (!message.id) return;

        this.http
            .delete<MessageDTO>(`http://localhost:8085/api/messages/${message.id}/reactions`, {
                params: {
                    userId: this.currentUserId.toString()
                }
            })
            .subscribe({
                next: () => {
                    // Reaction removal is handled via STOMP subscription
                },
                error: (err) => {
                    console.error('Error removing reaction:', err);
                }
            });
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.currentUserId) return;

        this.isLoading = true;
        const isGroupChat = this.isGroupChat();
        if (isGroupChat) {
            this.sendGroupMessage();
        } else {
            this.sendPrivateMessage();
        }
        if (this.selectedFile) {
            console.warn('Téléchargement de fichier non implémenté dans le backend');
            console.warn('Selected file:', this.selectedFile);
        }
    }

    private sendPrivateMessage(): void {
        if (!this.currentUserId || !this.currentChat.id) {
            console.error('Impossible d’envoyer un message privé: ID utilisateur ou ID destinataire manquant');
            this.isLoading = false;
            return;
        }

        const request: PrivateMessageRequest = {
            senderId: this.currentUserId,
            recipientId: this.currentChat.id,
            content: this.newMessage
        };

        this.http.post<MessageDTO>('http://localhost:8085/api/messages/private', request).subscribe({
            next: () => {
                this.newMessage = '';
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Erreur lors de l’envoi du message privé:', error);
                this.isLoading = false;
            }
        });
    }

    private sendGroupMessage(): void {
        if (!this.currentUserId || !this.currentChat.conversationId) {
            console.error('Impossible d’envoyer un message de groupe: ID utilisateur ou ID de conversation manquant');
            this.isLoading = false;
            return;
        }

        const request: GroupMessageRequest = {
            senderId: this.currentUserId,
            conversationId: this.currentChat.conversationId,
            content: this.newMessage
        };

        this.http.post<MessageDTO>('http://localhost:8085/api/messages/group', request).subscribe({
            next: () => {
                this.newMessage = '';
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Erreur lors de l’envoi du message de groupe:', error);
                this.isLoading = false;
            }
        });
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 100);
    }

    toggleMessageOptions(index: number): void {
        this.messages = this.messages.map((msg, i) => ({
            ...msg,
            showOptions: i === index ? !msg.showOptions : false
        }));
        this.cdr.detectChanges();
    }

    editMessage(index: number): void {
        if (!this.messages[index].sent) return;

        this.isEditing = true;
        this.editingMessageIndex = index;
        this.newMessage = this.messages[index].text;
        this.messages[index].showOptions = false;
        this.cdr.detectChanges();

        setTimeout(() => {
            const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (inputField) inputField.focus();
        }, 100);
    }

    updateMessage(): void {
        if (!this.newMessage.trim() || this.editingMessageIndex === -1 || !this.currentUserId) {
            console.error('Impossible de mettre à jour le message: État invalide');
            return;
        }

        const messageToUpdate = this.messages[this.editingMessageIndex];
        if (!messageToUpdate.id) {
            console.error('Impossible de mettre à jour le message: Aucun ID de message');
            return;
        }

        this.isLoading = true;
        const request: UpdateMessageRequest = {
            userId: this.currentUserId,
            newContent: this.newMessage
        };

        this.http.put<MessageDTO>(`http://localhost:8085/api/messages/${messageToUpdate.id}`, request).subscribe({
            next: () => {
                this.isEditing = false;
                this.editingMessageIndex = -1;
                this.newMessage = '';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la mise à jour du message:', error);
                alert('Échec de la mise à jour du message.');
                this.isLoading = false;
            }
        });
    }

    cancelEditing(): void {
        this.isEditing = false;
        this.editingMessageIndex = -1;
        this.newMessage = '';
        this.cdr.detectChanges();
    }

    deleteMessage(index: number): void {
        if (!this.messages[index].sent || !this.currentUserId) return;

        const messageToDelete = this.messages[index];
        if (!messageToDelete.id) {
            console.error('Impossible de supprimer le message: Aucun ID de message');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
            return;
        }

        this.isLoading = true;
        this.http
            .delete<MessageDTO>(`http://localhost:8085/api/messages/${messageToDelete.id}`, {
                params: { userId: this.currentUserId.toString() }
            })
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Erreur lors de la suppression du message:', error);
                    alert('Échec de la suppression du message.');
                    this.isLoading = false;
                }
            });
    }

    trackByMessageId(index: number, message: Message): number | undefined {
        return message.id;
    }
}