import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideMegaphone,
  LucideMessageSquare,
  LucideUsers,
  LucideSettings,
  LucideBell,
  LucideCircleHelp,
  LucidePlus,
  LucideMenu,
  LucideX,
} from '@lucide/angular';

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
    LucideCircleHelp,
    LucidePlus,
    LucideMenu,
    LucideX,
  ],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  protected readonly sidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
