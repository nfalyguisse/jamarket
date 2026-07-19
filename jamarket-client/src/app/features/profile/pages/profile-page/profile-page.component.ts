import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import {
  LucideMail,
  LucideMapPin,
  LucideLogOut,
  LucidePencil,
  LucideMessageSquare,
} from '@lucide/angular';
import { AuthStateService } from '@core/services/auth-state.service';
import { ChatApiService } from '@core/services/chat-api.service';
import { SiteFooterComponent } from '../../../../../shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../../../../shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '../../../../../shared/ui/vehicle-card/vehicle-card.component';
import type { UserProfile } from '../../../../../core/models/user-profile.model';
import type { VehicleCard } from '../../../../../core/models/vehicle-card.model';
import { logHttpError } from '@core/utils/http-error.util';
import { ProfileApiService } from '../../data/profile-api.service';

interface MessagePreview {
  id: number;
  senderName: string;
  preview: string;
  time: string;
  isNew: boolean;
}

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    VehicleCardComponent,
    LucideMail,
    LucideMapPin,
    LucideLogOut,
    LucidePencil,
    LucideMessageSquare,
  ],
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly profileApiService = inject(ProfileApiService);
  private readonly chatApi = inject(ChatApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly favorites = signal<VehicleCard[]>([]);
  protected readonly messages = signal<MessagePreview[]>([]);
  protected readonly newMessagesCount = signal(0);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.profileApiService
      .getProfile()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[profile] chargement du profil');
          void this.router.navigateByUrl('/connexion');
          return EMPTY;
        }),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
        this.loadMessagesPreview();
      });
  }

  protected get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return `${p.name[0]}${p.lastName[0]}`.toUpperCase();
  }

  protected openConversation(id: number): void {
    void this.router.navigate(['/messages', id]);
  }

  logout(): void {
    this.authState.clearTokens();
    void this.router.navigateByUrl('/');
  }

  private loadMessagesPreview(): void {
    this.chatApi
      .list()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[profile] messages');
          return EMPTY;
        }),
      )
      .subscribe((list) => {
        const previews = list.slice(0, 5).map((c) => ({
          id: c.id,
          senderName: `${c.admin.name} ${c.admin.lastName}`.trim() || c.ad.label,
          preview: c.lastMessage?.text ?? `À propos de « ${c.ad.label} »`,
          time: c.lastMessage?.createdAt
            ? new Date(c.lastMessage.createdAt).toLocaleDateString('fr-FR')
            : new Date(c.createdAt).toLocaleDateString('fr-FR'),
          isNew: false,
        }));
        this.messages.set(previews);
        this.newMessagesCount.set(list.length);
      });
  }
}
