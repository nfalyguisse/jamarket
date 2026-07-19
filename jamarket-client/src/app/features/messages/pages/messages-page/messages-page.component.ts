import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideMessageSquare,
  LucideSend,
} from '@lucide/angular';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from '@core/models/chat.model';
import { AuthStateService } from '@core/services/auth-state.service';
import { ChatApiService } from '@core/services/chat-api.service';
import { ChatSocketService } from '@core/services/chat-socket.service';
import { logHttpError } from '@core/utils/http-error.util';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { AUTH_SCOPE_KEY } from '@core/constants/auth.constants';
import { SiteFooterComponent } from '@shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '@shared/layout/site-header/site-header.component';

@Component({
  selector: 'app-messages-page',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    SiteHeaderComponent,
    SiteFooterComponent,
    LucideArrowLeft,
    LucideMessageSquare,
    LucideSend,
  ],
  templateUrl: './messages-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  private readonly chatApi = inject(ChatApiService);
  private readonly chatSocket = inject(ChatSocketService);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('messagesEnd') private messagesEnd?: ElementRef<HTMLElement>;

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly active = signal<ConversationDetail | null>(null);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly isLoadingList = signal(true);
  protected readonly isLoadingThread = signal(false);
  protected readonly draft = signal('');
  protected readonly typingLabel = signal<string | null>(null);
  protected readonly currentUserId = signal<number | null>(null);

  protected readonly peerName = computed(() => {
    const thread = this.active();
    const me = this.currentUserId();
    if (!thread || me == null) return '';
    const peer = thread.customer.id === me ? thread.admin : thread.customer;
    return `${peer.name} ${peer.lastName}`.trim();
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.authState.isLoggedIn() || this.isAdminScope()) {
      void this.router.navigateByUrl('/connexion');
      return;
    }

    this.loadList();
    this.chatSocket.connect();

    this.chatSocket.newMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => this.onIncomingMessage(message));

    this.chatSocket.typing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const thread = this.active();
        const me = this.currentUserId();
        if (!thread || event.conversationId !== thread.id || event.userId === me) {
          return;
        }
        this.typingLabel.set(event.isTyping ? 'En train d’écrire…' : null);
      });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.openConversation(Number(id));
      }
    });
  }

  ngOnDestroy(): void {
    const thread = this.active();
    if (thread) {
      this.chatSocket.leaveConversation(thread.id);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected resolveImage(url: string | null): string | null {
    if (!url) {
      return null;
    }
    return resolveMediaUrl(url) || null;
  }

  protected selectConversation(id: number): void {
    void this.router.navigate(['/messages', id]);
  }

  protected onDraftChange(value: string): void {
    this.draft.set(value);
    const thread = this.active();
    if (thread) {
      this.chatSocket.setTyping(thread.id, value.trim().length > 0);
    }
  }

  protected send(): void {
    const thread = this.active();
    const text = this.draft().trim();
    if (!thread || !text) {
      return;
    }
    this.chatSocket.sendMessage(thread.id, text);
    this.draft.set('');
    this.chatSocket.setTyping(thread.id, false);
  }

  private isAdminScope(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return localStorage.getItem(AUTH_SCOPE_KEY) === 'admin';
  }

  private loadList(): void {
    this.isLoadingList.set(true);
    this.chatApi
      .list()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[messages] liste');
          void this.router.navigateByUrl('/connexion');
          return EMPTY;
        }),
      )
      .subscribe((list) => {
        this.conversations.set(list);
        this.isLoadingList.set(false);
      });
  }

  private openConversation(id: number): void {
    if (Number.isNaN(id)) {
      return;
    }

    const previous = this.active();
    if (previous && previous.id !== id) {
      this.chatSocket.leaveConversation(previous.id);
    }

    this.isLoadingThread.set(true);
    this.typingLabel.set(null);

    this.chatApi
      .getById(id)
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[messages] détail');
          this.isLoadingThread.set(false);
          return EMPTY;
        }),
      )
      .subscribe((detail) => {
        this.active.set(detail);
        this.messages.set(detail.messages);
        this.inferCurrentUserId(detail);
        this.chatSocket.joinConversation(detail.id);
        this.isLoadingThread.set(false);
        queueMicrotask(() => this.scrollToBottom());
      });
  }

  private inferCurrentUserId(detail: ConversationDetail): void {
    // Le client est toujours customer dans ses conversations.
    this.currentUserId.set(detail.customer.id);
  }

  private onIncomingMessage(message: ChatMessage): void {
    const thread = this.active();
    if (!thread || message.conversationId !== thread.id) {
      this.loadList();
      return;
    }

    this.messages.update((list) => {
      if (list.some((m) => m.id === message.id)) {
        return list;
      }
      return [...list, message];
    });
    this.typingLabel.set(null);
    this.loadList();
    queueMicrotask(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
