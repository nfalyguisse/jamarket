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
import { LucideFilter, LucideMessageSquare, LucideSend } from '@lucide/angular';
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

@Component({
  selector: 'app-admin-messages-page',
  imports: [RouterLink, FormsModule, DatePipe, LucideFilter, LucideMessageSquare, LucideSend],
  templateUrl: './admin-messages-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMessagesPageComponent implements OnInit, OnDestroy {
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
  protected readonly adFilter = signal<number | 'all'>('all');
  protected readonly currentUserId = signal<number | null>(null);

  protected readonly adOptions = computed(() => {
    const map = new Map<number, string>();
    for (const c of this.conversations()) {
      map.set(c.ad.id, c.ad.label);
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  });

  protected readonly filteredConversations = computed(() => {
    const filter = this.adFilter();
    const list = this.conversations();
    if (filter === 'all') {
      return list;
    }
    return list.filter((c) => c.ad.id === filter);
  });

  protected readonly peerName = computed(() => {
    const thread = this.active();
    if (!thread) return '';
    return `${thread.customer.name} ${thread.customer.lastName}`.trim();
  });

  protected readonly filterSelectValue = computed(() => {
    const filter = this.adFilter();
    return filter === 'all' ? 'all' : String(filter);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const profile = this.authState.adminProfile();
    if (profile) {
      this.currentUserId.set(profile.id);
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
        this.typingLabel.set(event.isTyping ? 'Le client écrit…' : null);
      });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('c');
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

  protected onFilterChange(value: string): void {
    this.adFilter.set(value === 'all' ? 'all' : Number(value));
  }

  protected selectConversation(id: number): void {
    void this.router.navigate(['/admin/messages'], { queryParams: { c: id } });
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

  private loadList(): void {
    this.isLoadingList.set(true);
    this.chatApi
      .list()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[admin-messages] liste');
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
          logHttpError(error, '[admin-messages] détail');
          this.isLoadingThread.set(false);
          return EMPTY;
        }),
      )
      .subscribe((detail) => {
        this.active.set(detail);
        this.messages.set(detail.messages);
        if (this.currentUserId() == null) {
          this.currentUserId.set(detail.admin.id);
        }
        this.chatSocket.joinConversation(detail.id);
        this.isLoadingThread.set(false);
        queueMicrotask(() => this.scrollToBottom());
      });
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
