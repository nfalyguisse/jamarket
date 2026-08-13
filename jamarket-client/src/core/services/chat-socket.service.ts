import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import type { ChatMessage, UserTypingEvent } from '@core/models/chat.model';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authState = inject(AuthStateService);

  private socket: Socket | null = null;
  private readonly newMessageSubject = new Subject<ChatMessage>();
  private readonly typingSubject = new Subject<UserTypingEvent>();

  readonly connected = signal(false);

  readonly newMessages$: Observable<ChatMessage> = this.newMessageSubject.asObservable();
  readonly typing$: Observable<UserTypingEvent> = this.typingSubject.asObservable();

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.authState.getAccessToken();
    if (!token) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.disconnect();

    // Origine de l'API (sans /api) — pas CDN_URL, qui peut pointer vers un stockage objet.
    const wsUrl = environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    this.socket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('newMessage', (message: ChatMessage) => {
      this.newMessageSubject.next(message);
    });
    this.socket.on('userTyping', (event: UserTypingEvent) => {
      this.typingSubject.next(event);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected.set(false);
  }

  joinConversation(conversationId: number): void {
    this.socket?.emit('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: number): void {
    this.socket?.emit('leaveConversation', { conversationId });
  }

  sendMessage(conversationId: number, text: string): void {
    this.socket?.emit('sendMessage', { conversationId, text });
  }

  setTyping(conversationId: number, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, isTyping });
  }
}
