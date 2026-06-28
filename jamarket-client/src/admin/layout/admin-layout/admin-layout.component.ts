import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideMegaphone,
  LucideMessageSquare,
  LucideUsers,
  LucideSettings,
  LucideBell,
  LucidePlus,
  LucideMenu,
  LucideX,
  LucideLogOut,
} from '@lucide/angular';
import { AuthStateService } from '@core/services/auth-state.service';
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
export class AdminLayoutComponent implements OnInit {
  protected readonly sidebarOpen = signal(false);
  protected readonly authState = inject(AuthStateService);
  private readonly adminAuth = inject(AdminAuthApiService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.adminAuth.refreshAdminProfile().subscribe({
      error: () => {
        this.adminAuth.logout();
        void this.router.navigateByUrl('/admin/connexion');
      },
    });
  }

  protected get adminInitials(): string {
    const profile = this.authState.adminProfile();
    if (!profile) return 'A';
    return `${profile.name.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  protected get adminFullName(): string {
    const profile = this.authState.adminProfile();
    if (!profile) return 'Administrateur';
    return `${profile.name} ${profile.lastName}`;
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
}
