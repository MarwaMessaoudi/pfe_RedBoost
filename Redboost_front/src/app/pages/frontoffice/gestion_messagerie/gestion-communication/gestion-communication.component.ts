import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChatComponent } from '../chat/chat.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationService } from '../notification.service';
import { MessageService } from 'primeng/api';

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

interface ConversationDTO {
  id: number;
  titre: string;
  estGroupe: boolean;
  creatorId?: number;
  participantIds: number[];
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
  showOptions?: boolean;
  selected?: boolean;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-gestion-communication',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './gestion-communication.component.html',
  styleUrls: ['./gestion-communication.component.scss']
})
export class GestionCommunicationComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentUserId: number | null = null;
  activeTab = 'chats';
  chats: ChatItem[] = [];
  groups: ChatItem[] = [];
  searchTerm: string = '';
  userSearchTerm: string = '';
  filteredAvailableUsers: RoleSpecificUser[] = [];
  selectedChat: ChatItem | null = null;
  showChatDetail: boolean = false;
  isMobileView: boolean = false;
  showUserModal: boolean = false;
  showGroupModal: boolean = false;
  availableUsers: RoleSpecificUser[] = [];
  selectedUsers: RoleSpecificUser[] = [];
  groupName: string = '';
  initialGroupUser: RoleSpecificUser | null = null;
  private subscriptions: Subscription[] = [];
  private userCache: Map<number, RoleSpecificUser> = new Map();
  private stompClient: Client | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private messageService: MessageService // Add MessageService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.getCurrentUser().subscribe({
        next: (userData) => {
          if (userData) {
            this.currentUserId = userData.id;
            this.getUserProfile(userData.id).then(userDetails => {
              if (userDetails) {
                this.currentUser = {
                  id: userDetails.id,
                  name: `${userDetails.firstName || 'Unknown'} ${userDetails.lastName || ''}`.trim(),
                  avatar: userDetails.profile_pictureurl || 'assets/avatars/user.jpg'
                };
                this.loadConversations();
                this.setupWebSocket();
                this.notificationService.initialize(userData.id);
              }
            }).catch(err => {
              console.error('Error fetching user profile:', err);
              this.currentUser = {
                id: userData.id,
                name: 'Unknown User',
                avatar: 'assets/avatars/user.jpg'
              };
              this.loadConversations();
              this.setupWebSocket();
              this.notificationService.initialize(userData.id);
            });
          } else {
            console.error('No user logged in');
          }
        },
        error: (err) => {
          console.error('Error retrieving current user:', err);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

private setupWebSocket(): void {
  if (!this.currentUserId) {
    console.error('Impossible de configurer WebSocket: Aucun ID utilisateur disponible');
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
      console.log('STOMP Connected for conversation list:', frame);

      // Subscribe to existing conversation message updates
      this.chats.concat(this.groups).forEach(chat => {
        this.stompClient!.subscribe(`/topic/conversation/${chat.conversationId}`, (message: IMessage) => {
          const messageDTO: MessageDTO = JSON.parse(message.body);
          this.updateChatItem(chat.conversationId, messageDTO);
        });
      });

      // Subscribe to conversation creation/deletion updates
      this.stompClient!.subscribe(`/topic/conversations/${this.currentUserId}`, (message: IMessage) => {
        const conversationUpdate: { conversation: ConversationDTO; action: string } = JSON.parse(message.body);
        this.handleConversationUpdate(conversationUpdate);
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

private async handleConversationUpdate(update: { conversation: ConversationDTO; action: string }): Promise<void> {
  const { conversation, action } = update;

  if (action === 'create') {
    // Check if conversation already exists to avoid duplicates
    const existsInChats = this.chats.some(chat => chat.conversationId === conversation.id);
    const existsInGroups = this.groups.some(group => group.conversationId === conversation.id);
    if (existsInChats || existsInGroups) {
      return;
    }

    // Map the conversation to a ChatItem
    const chatItem = await this.mapToChatItem(conversation);

    // Fetch unread count
    try {
      const unreadCount = await this.http.get<number>(
        `http://localhost:8085/api/messages/unread/count/${conversation.id}?userId=${this.currentUserId}`
      ).toPromise();
      chatItem.unreadCount = unreadCount;
    } catch (err) {
      console.error(`Error fetching unread count for conversation ${conversation.id}:`, err);
      chatItem.unreadCount = 0;
    }

    // Add to appropriate list and sort
    if (conversation.estGroupe) {
      this.groups.push(chatItem);
      this.groups.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
      this.groups = [...this.groups];
    } else {
      this.chats.push(chatItem);
      this.chats.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
      this.chats = [...this.chats];
    }

    // Subscribe to messages for the new conversation
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.subscribe(`/topic/conversation/${conversation.id}`, (message: IMessage) => {
        const messageDTO: MessageDTO = JSON.parse(message.body);
        this.updateChatItem(conversation.id, messageDTO);
      });
    }

    // Show notification (optional)
    this.messageService.add({
      severity: 'success',
      summary: 'Nouvelle conversation',
      detail: `Vous avez été ajouté à "${conversation.titre}"`
    });
  } else if (action === 'delete') {
    this.chats = this.chats.filter(chat => chat.conversationId !== conversation.id);
    this.groups = this.groups.filter(group => group.conversationId !== conversation.id);
    if (this.selectedChat?.conversationId === conversation.id) {
      this.selectedChat = null;
      this.showChatDetail = false;
    }
    this.notificationService.updateUnreadMessageCount();
  }
}

  private updateChatItem(conversationId: number, message: MessageDTO): void {
    const chatList = this.activeTab === 'groups' ? this.groups : this.chats;
    const chatIndex = chatList.findIndex(c => c.conversationId === conversationId);
    if (chatIndex !== -1) {
      const chat = chatList[chatIndex];
      chat.lastMessage = message.content.length > 50 ? message.content.substring(0, 47) + '...' : message.content;
      chat.time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Fetch the latest unread count to ensure accuracy
      this.http.get<number>(
        `http://localhost:8085/api/messages/unread/count/${conversationId}?userId=${this.currentUserId}`
      ).subscribe({
        next: (unreadCount) => {
          chat.unreadCount = unreadCount;
          chatList.splice(chatIndex, 1);
          chatList.unshift(chat);
          if (this.activeTab === 'groups') {
            this.groups = [...chatList];
          } else {
            this.chats = [...chatList];
          }
          this.notificationService.updateUnreadMessageCount();
        },
        error: (err) => {
          console.error('Error fetching unread count:', err);
        }
      });
    }
  }

  private getUserProfile(userId: number): Promise<RoleSpecificUser> {
    if (this.userCache.has(userId)) {
      return Promise.resolve(this.userCache.get(userId)!);
    }

    return new Promise((resolve, reject) => {
      this.http.get<RoleSpecificUser>(`http://localhost:8085/users/${userId}`).subscribe({
        next: (userDetails) => {
          if (userDetails) {
            const validatedUser: RoleSpecificUser = {
              id: userDetails.id ?? userId,
              firstName: userDetails.firstName || 'Unknown',
              lastName: userDetails.lastName || 'User',
              email: userDetails.email || '',
              phoneNumber: userDetails.phoneNumber || '',
              role: userDetails.role || '',
              isActive: userDetails.isActive ?? false,
              profile_pictureurl: userDetails.profile_pictureurl || 'assets/avatars/user.jpg',
              specialization: userDetails.specialization,
              yearsOfExperience: userDetails.yearsOfExperience,
              StartupName: userDetails.StartupName,
              Industry: userDetails.Industry,
              showOptions: false,
              selected: false
            };
            this.userCache.set(userId, validatedUser);
            resolve(validatedUser);
          } else {
            reject(new Error('User data is null or undefined'));
          }
        },
        error: (err) => {
          console.error(`Failed to fetch user ${userId}:`, err);
          const fallbackUser: RoleSpecificUser = {
            id: userId,
            firstName: 'Unknown',
            lastName: 'User',
            email: '',
            phoneNumber: '',
            role: '',
            isActive: false,
            profile_pictureurl: 'assets/avatars/user.jpg',
            showOptions: false,
            selected: false
          };
          this.userCache.set(userId, fallbackUser);
          resolve(fallbackUser);
        }
      });
    });
  }

  private async loadConversations(): Promise<void> {
    if (!this.currentUserId) {
        console.error('Cannot load conversations: No user ID available');
        return;
    }

    // Fetch all conversations
    this.subscriptions.push(
        this.http.get<ConversationDTO[]>('http://localhost:8085/api/conversations').subscribe({
            next: async (conversations) => {
                const chatItems = await Promise.all(
                    conversations.map(async conv => {
                        const chatItem = await this.mapToChatItem(conv);
                        try {
                            const unreadCount = await this.http.get<number>(
                                `http://localhost:8085/api/messages/unread/count/${conv.id}?userId=${this.currentUserId}`
                            ).toPromise();
                            chatItem.unreadCount = unreadCount;
                        } catch (err) {
                            console.error(`Error fetching unread count for conversation ${conv.id}:`, err);
                            chatItem.unreadCount = 0; // Default to 0 if error occurs
                        }
                        return chatItem;
                    })
                );

                // Separate chats and groups
                this.chats = chatItems.filter(chat => !chat.isGroup);
                this.groups = chatItems.filter(chat => chat.isGroup);

                // Sort conversations to prioritize those with unread messages
                this.chats.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
                this.groups.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));

                // Update WebSocket subscriptions
                if (this.stompClient && this.stompClient.connected) {
                    chatItems.forEach(chat => {
                        this.stompClient!.subscribe(`/topic/conversation/${chat.conversationId}`, (message: IMessage) => {
                            const messageDTO: MessageDTO = JSON.parse(message.body);
                            this.updateChatItem(chat.conversationId, messageDTO);
                        });
                    });
                }
            },
            error: (err) => {
                console.error('Error loading conversations:', err);
                this.chats = [];
                this.groups = [];
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les conversations.'
                });
            }
        })
    );
}

  private async mapToChatItem(conv: ConversationDTO): Promise<ChatItem> {
    const isGroup = conv.estGroupe;

    if (isGroup) {
      try {
        const participants = await Promise.all(
          conv.participantIds
            .filter(id => id !== this.currentUserId)
            .slice(0, 4)
            .map(id => this.getUserProfile(id))
        );

        const participantNames = participants.map(p => `${p.firstName}`).join(', ');
        const participantAvatars = participants.map(p => p.profile_pictureurl || 'assets/avatars/user.jpg');

        const groupAvatar = await this.generateCombinedAvatar(participantAvatars);

        return {
          id: Number(`group${conv.id}`),
          name: conv.titre || `Group (${participantNames})`,
          avatar: groupAvatar,
          lastMessage: '',
          time: '',
          unreadCount: 0,
          conversationId: conv.id,
          isGroup: true
        };
      } catch (err) {
        console.error('Error creating group chat item:', err);
        return {
          id: Number(`group${conv.id}`),
          name: conv.titre || 'Unknown Group',
          avatar: 'assets/avatars/group.jpg',
          lastMessage: '',
          time: '',
          unreadCount: 0,
          conversationId: conv.id,
          isGroup: true
        };
      }
    } else {
      const otherUserId = conv.participantIds.find(id => id !== this.currentUserId);

      if (!otherUserId) {
        return {
          id: 0,
          name: 'Unknown User',
          avatar: 'assets/avatars/user.jpg',
          lastMessage: '',
          time: '',
          unreadCount: 0,
          conversationId: conv.id,
          isGroup: false
        };
      }

      try {
        const otherUser = await this.getUserProfile(otherUserId);
        return {
          id: otherUser.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          avatar: otherUser.profile_pictureurl || 'assets/avatars/user.jpg',
          lastMessage: '',
          time: '',
          unreadCount: 0,
          conversationId: conv.id,
          isGroup: false
        };
      } catch (err) {
        console.error(`Error fetching user ${otherUserId}:`, err);
        return {
          id: otherUserId,
          name: 'Unknown User',
          avatar: 'assets/avatars/user.jpg',
          lastMessage: '',
          time: '',
          unreadCount: 0,
          conversationId: conv.id,
          isGroup: false
        };
      }
    }
  }

  private async generateCombinedAvatar(imageUrls: string[]): Promise<string> {
    if (imageUrls.length === 0) {
      return 'assets/avatars/group.jpg';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return 'assets/avatars/group.jpg';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layouts: { [key: number]: { x: number; y: number; width: number; height: number }[] } = {
      1: [{ x: 0, y: 0, width: 100, height: 100 }],
      2: [
        { x: 0, y: 0, width: 50, height: 100 },
        { x: 50, y: 0, width: 50, height: 100 }
      ],
      3: [
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 50, y: 0, width: 50, height: 50 },
        { x: 0, y: 50, width: 100, height: 50 }
      ],
      4: [
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 50, y: 0, width: 50, height: 50 },
        { x: 0, y: 50, width: 50, height: 50 },
        { x: 50, y: 50, width: 50, height: 50 }
      ]
    };

    const layout = layouts[Math.min(imageUrls.length, 4)] || layouts[1];

    try {
      const images = await Promise.all(
        imageUrls.slice(0, 4).map(url =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
              const fallbackImg = new Image();
              fallbackImg.src = 'assets/avatars/user.jpg';
              fallbackImg.onload = () => resolve(fallbackImg);
              fallbackImg.onerror = reject;
            };
            img.src = url;
          })
        )
      );

      images.forEach((img, index) => {
        if (index >= layout.length) return;
        const { x, y, width, height } = layout[index];
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
      });

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error generating combined avatar:', err);
      return 'assets/avatars/group.jpg';
    }
  }

  @HostListener('window:resize', ['$event'])
  checkScreenSize() {
    this.isMobileView = window.innerWidth < 768;
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  searchChats(): void {
    // Already implemented in filteredChats getter
  }

  addNewChat(): void {
    if (!this.currentUserId) {
      console.error('Cannot retrieve users: No user ID available');
      return;
    }
    this.userSearchTerm = '';
    this.subscriptions.push(
      this.http.get<RoleSpecificUser[]>('http://localhost:8085/users/role-specific').subscribe({
        next: (users) => {
          this.availableUsers = users
            .filter(user => user.id !== this.currentUserId)
            .map(user => ({ ...user, showOptions: false, selected: false }));
          this.filteredAvailableUsers = [...this.availableUsers];
          this.showUserModal = true;
        },
        error: (err) => {
          console.error('Error retrieving users:', err);
          this.availableUsers = [];
          this.filteredAvailableUsers = [];
          this.showUserModal = true;
        }
      })
    );
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.availableUsers = [];
    this.filteredAvailableUsers = [];
    this.userSearchTerm = '';
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
    this.availableUsers = [];
    this.filteredAvailableUsers = [];
    this.selectedUsers = [];
    this.groupName = '';
    this.initialGroupUser = null;
    this.userSearchTerm = '';
  }

  toggleUserOptions(userId: number): void {
    this.availableUsers = this.availableUsers.map(user => ({
      ...user,
      showOptions: user.id === userId ? !user.showOptions : false
    }));
    this.filteredAvailableUsers = this.filteredAvailableUsers.map(user => ({
      ...user,
      showOptions: user.id === userId ? !user.showOptions : false
    }));
  }

  startChatWithUser(user: RoleSpecificUser): void {
    this.startPrivateChat(user);
  }

  startPrivateChat(user: RoleSpecificUser): void {
    if (!this.currentUserId) {
      console.error('Cannot start private conversation: No user ID available');
      return;
    }
    const existingChat = this.chats.find(chat => chat.id === user.id && !chat.isGroup);
    if (existingChat) {
      this.openChat(existingChat);
      this.closeUserModal();
      return;
    }

    const payload = {
      recipientId: user.id
    };

    this.subscriptions.push(
      this.http.post<ConversationDTO>('http://localhost:8085/api/conversations/private', payload).subscribe({
        next: (conv) => {
          const newChat: ChatItem = {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.profile_pictureurl || 'assets/avatars/user.jpg',
            lastMessage: '',
            time: '',
            unreadCount: 0,
            conversationId: conv.id,
            isGroup: false
          };
          this.chats.push(newChat);
          if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe(`/topic/conversation/${conv.id}`, (message: IMessage) => {
              const messageDTO: MessageDTO = JSON.parse(message.body);
              this.updateChatItem(conv.id, messageDTO);
            });
          }
          this.openChat(newChat);
          this.closeUserModal();
        },
        error: (err) => console.error('Error creating private conversation:', err)
      })
    );
  }

  startGroupChat(user: RoleSpecificUser): void {
    if (!this.currentUserId) {
      console.error('Cannot start group chat: No user ID available');
      return;
    }
    this.initialGroupUser = user;
    this.userSearchTerm = '';
    this.subscriptions.push(
      this.http.get<RoleSpecificUser[]>('http://localhost:8085/users/role-specific').subscribe({
        next: (users) => {
          this.availableUsers = users
            .filter(u => u.id !== this.currentUserId)
            .map(u => ({
              ...u,
              selected: u.id === user.id,
              showOptions: false
            }));
          this.filteredAvailableUsers = [...this.availableUsers];
          this.selectedUsers = [user];
          this.groupName = `Groupe avec ${user.firstName} ${user.lastName}`;
          this.showUserModal = false;
          this.showGroupModal = true;
        },
        error: (err) => {
          console.error('Error retrieving users for group chat:', err);
          this.availableUsers = [];
          this.filteredAvailableUsers = [];
          this.showGroupModal = true;
        }
      })
    );
  }

  toggleUserSelection(user: RoleSpecificUser): void {
    if (user.id === this.initialGroupUser?.id) {
      return;
    }
    user.selected = !user.selected;
    if (user.selected) {
      this.selectedUsers.push(user);
    } else {
      this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
    }
    this.filteredAvailableUsers = this.filteredAvailableUsers.map(u =>
      u.id === user.id ? { ...u, selected: user.selected } : u
    );
  }

  createGroup(): void {
    if (!this.currentUserId) {
      console.error('Cannot create group: No user ID available');
      return;
    }
    if (!this.groupName.trim()) {
      alert('Please enter a group name.');
      return;
    }
    if (this.selectedUsers.length < 1) {
      alert('Please select at least one user.');
      return;
    }

    const memberIds = [...new Set([this.currentUserId, ...this.selectedUsers.map(u => u.id)])];
    const payload = {
      name: this.groupName,
      memberIds
    };

    this.subscriptions.push(
      this.http.post<ConversationDTO>('http://localhost:8085/api/conversations/group', payload).subscribe({
        next: async (conv) => {
          const avatarUrls = await Promise.all(
            this.selectedUsers.slice(0, 4).map(async user => {
              return user.profile_pictureurl || 'assets/avatars/user.jpg';
            })
          );

          const groupAvatar = await this.generateCombinedAvatar(avatarUrls);

          const newGroup: ChatItem = {
            id: Number(`group${conv.id}`),
            name: this.groupName,
            avatar: groupAvatar,
            lastMessage: '',
            time: '',
            unreadCount: 0,
            conversationId: conv.id,
            isGroup: true
          };
          this.groups.push(newGroup);
          if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe(`/topic/conversation/${conv.id}`, (message: IMessage) => {
              const messageDTO: MessageDTO = JSON.parse(message.body);
              this.updateChatItem(conv.id, messageDTO);
            });
          }
          this.openChat(newGroup);
          this.closeGroupModal();
        },
        error: (err) => {
          console.error('Error creating group chat:', err);
          alert('Failed to create group chat.');
        }
      })
    );
  }

  deleteConversation(conversationId: number, event: Event): void {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation? This action is irreversible.')) {
      return;
    }

    this.subscriptions.push(
      this.http.delete(`http://localhost:8085/api/conversations/${conversationId}`).subscribe({
        next: () => {
          this.chats = this.chats.filter(chat => chat.conversationId !== conversationId);
          this.groups = this.groups.filter(group => group.conversationId !== conversationId);
          if (this.selectedChat?.conversationId === conversationId) {
            this.selectedChat = null;
            this.showChatDetail = false;
          }
          this.notificationService.updateUnreadMessageCount();
        },
        error: (err) => {
          console.error('Error deleting conversation:', err);
          alert(`Failed to delete conversation: ${err.error || 'Server error'}`);
        }
      })
    );
  }

  get filteredChats(): ChatItem[] {
    const chatsToShow = this.activeTab === 'groups' ? this.groups : this.chats;
    if (!this.searchTerm.trim()) {
      return chatsToShow;
    }
    return chatsToShow.filter(chat =>
      chat.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openChat(chat: ChatItem): void {
    this.selectedChat = { ...chat };
    this.showChatDetail = true;
    chat.unreadCount = 0;
  }

  onMessagesMarkedAsRead(conversationId: number): void {
    const chatList = this.activeTab === 'groups' ? this.groups : this.chats;
    const chat = chatList.find(c => c.conversationId === conversationId);
    if (chat) {
      this.http.get<number>(
        `http://localhost:8085/api/messages/unread/count/${conversationId}?userId=${this.currentUserId}`
      ).subscribe({
        next: (unreadCount) => {
          chat.unreadCount = unreadCount;
          if (this.activeTab === 'groups') {
            this.groups = [...this.groups];
          } else {
            this.chats = [...this.chats];
          }
          this.notificationService.updateUnreadMessageCount();
        },
        error: (err) => {
          console.error('Error fetching unread count:', err);
        }
      });
    }
  }

  backToList(): void {
    if (this.isMobileView) {
      this.showChatDetail = false;
      this.selectedChat = null;
    }
  }

  filterUsers(): void {
    if (!this.userSearchTerm || this.userSearchTerm.trim() === '') {
      this.filteredAvailableUsers = [...this.availableUsers];
      return;
    }

    const searchTerm = this.userSearchTerm.toLowerCase().trim();
    this.filteredAvailableUsers = this.availableUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = (user.role || '').toLowerCase();
      return fullName.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
    });
  }
}