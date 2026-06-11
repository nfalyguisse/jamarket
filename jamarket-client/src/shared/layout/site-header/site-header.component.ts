import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCircleUser, LucideMenu, LucideX } from '@lucide/angular';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LucideCircleUser, LucideMenu, LucideX],
  templateUrl: './site-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly authState = inject(AuthStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  protected readonly mobileMenuOpen = signal(false);

  protected readonly navLinks = [
    { label: 'Catalogue', path: '/catalogue' },
    { label: 'Services', path: '/services' },
  ] as const;

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
    this.syncBodyScroll();
  }

  protected closeMobileMenu(): void {
    if (!this.mobileMenuOpen()) {
      return;
    }

    this.mobileMenuOpen.set(false);
    this.syncBodyScroll();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMobileMenu();
  }

  private syncBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
  }
}
