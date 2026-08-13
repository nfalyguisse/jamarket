import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { LucideCircleUser, LucideMenu, LucideSearch, LucideX } from '@lucide/angular';
import { AuthStateService } from '@core/services/auth-state.service';
import { CATALOGUE_SEARCH_QUERY_PARAM } from '@core/constants/catalogue-search.constants';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LucideCircleUser, LucideMenu, LucideSearch, LucideX],
  templateUrl: './site-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent implements OnInit {
  protected readonly authState = inject(AuthStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly searchQuery = signal('');

  protected readonly navLinks = [
    { label: 'Accueil', path: '/' },
    { label: 'Catalogue', path: '/catalogue' },
  ] as const;

  ngOnInit(): void {
    this.syncSearchFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => (event as NavigationEnd).urlAfterRedirects),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((url) => this.syncSearchFromUrl(url));
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.submitSearch();
  }

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

  private submitSearch(): void {
    const query = this.searchQuery().trim();
    this.closeMobileMenu();

    void this.router.navigate(['/catalogue'], {
      queryParams: query ? { [CATALOGUE_SEARCH_QUERY_PARAM]: query } : {},
    });
  }

  private syncSearchFromUrl(url: string): void {
    const tree = this.router.parseUrl(url);
    const query = tree.queryParams[CATALOGUE_SEARCH_QUERY_PARAM];
    this.searchQuery.set(typeof query === 'string' ? query : '');
  }

  private syncBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
  }
}
