import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideMegaphone,
  LucideMessageSquare,
  LucideUsers,
  LucideKeyRound,
  LucideSettings,
  LucideBell,
  LucidePlus,
  LucideMenu,
  LucideX,
  LucideLogOut,
} from '@lucide/angular';
import { hasSuperAdminRight } from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { AdminAuthApiService } from '@admin/data/admin-auth-api.service';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideMegaphone,
    LucideMessageSquare,
    LucideUsers,
    LucideKeyRound,
    LucideSettings,
    LucideBell,
    LucidePlus,
    LucideMenu,
    LucideX,
    LucideLogOut,
  ],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  protected readonly sidebarOpen = signal(false);
  protected readonly authState = inject(AuthStateService);
  private readonly adminAuth = inject(AdminAuthApiService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.lockDocumentScroll(true);

    this.adminAuth.refreshAdminProfile().subscribe({
      error: () => {
        this.adminAuth.logout();
        void this.router.navigateByUrl('/admin/connexion');
      },
    });
  }

  ngOnDestroy(): void {
    this.lockDocumentScroll(false);
  }

  protected get adminInitials(): string {
    const profile = this.authState.adminProfile();
    if (!profile) return 'A';
    return `${profile.name.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  protected get adminAvatarUrl(): string | null {
    const url = this.authState.adminProfile()?.avatarUrl;
    return url ? resolveMediaUrl(url) : null;
  }

  protected get adminFullName(): string {
    const profile = this.authState.adminProfile();
    if (!profile) return 'Administrateur';
    return `${profile.name} ${profile.lastName}`;
  }

  protected get canManageUsers(): boolean {
    const profile = this.authState.adminProfile();
    return !!profile && hasSuperAdminRight(profile);
  }

  protected logout(): void {
    this.adminAuth.logout();
    void this.router.navigateByUrl('/admin/connexion');
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  /** Empêche le double scroll (body + main) sur le shell admin. */
  private lockDocumentScroll(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.documentElement.style.overflow = locked ? 'hidden' : '';
    this.document.body.style.overflow = locked ? 'hidden' : '';
  }
}
