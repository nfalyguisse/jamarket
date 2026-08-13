import { CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import {
  LucideCalendar,
  LucideCar,
  LucideFuel,
  LucideGauge,
  LucideHeart,
  LucideMail,
  LucideMessageSquare,
  LucidePalette,
  LucideUser,
  LucideZap,
} from '@lucide/angular';
import type { AdDetail, AdSpecItem } from '@core/models/ad-detail.model';
import { FavoritesStateService } from '@core/services/favorites-state.service';
import { AUTH_SCOPE_KEY } from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';
import { ChatApiService } from '@core/services/chat-api.service';
import { logHttpError } from '@core/utils/http-error.util';
import { SiteFooterComponent } from '@shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '@shared/layout/site-header/site-header.component';
import { AdImageGalleryComponent } from '../../components/ad-image-gallery/ad-image-gallery.component';
import { buildAdSpecs } from '../../data/ad-api.mapper';
import { AdDetailApiService } from '../../data/ad-detail-api.service';

@Component({
  selector: 'app-ad-detail-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    SiteHeaderComponent,
    SiteFooterComponent,
    AdImageGalleryComponent,
    LucideCalendar,
    LucideGauge,
    LucideFuel,
    LucideZap,
    LucidePalette,
    LucideCar,
    LucideMail,
    LucideMessageSquare,
    LucideUser,
    LucideHeart,
  ],
  templateUrl: './ad-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adDetailApi = inject(AdDetailApiService);
  protected readonly favoritesState = inject(FavoritesStateService);
  private readonly chatApi = inject(ChatApiService);
  private readonly authState = inject(AuthStateService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly ad = signal<AdDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly isContacting = signal(false);

  protected readonly specs = computed<AdSpecItem[]>(() => {
    const detail = this.ad();
    return detail ? buildAdSpecs(detail) : [];
  });

  protected readonly subtitle = computed(() => {
    const detail = this.ad();
    if (!detail) return '';

    const { brandLabel, modelLabel, year } = detail.vehicule;
    const parts = [brandLabel, modelLabel].filter(Boolean).join(' ').trim();

    if (parts && year) {
      return `${parts} — ${year}`;
    }
    return parts || (year ? String(year) : '');
  });

  protected readonly statusLabel = computed(() => {
    const detail = this.ad();
    if (!detail) return '';
    if (detail.isSold) return 'Vendu';
    if (!detail.isActive) return 'Indisponible';
    return 'Stock disponible';
  });

  protected readonly isAvailable = computed(() => {
    const detail = this.ad();
    return !!detail && detail.isActive && !detail.isSold;
  });

  protected readonly isFavorite = computed(() => {
    const detail = this.ad();
    // Re-read ids signal so the computed updates on toggle
    this.favoritesState.ids();
    return detail ? this.favoritesState.isFavorite(detail.id) : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.adDetailApi
      .getById(id)
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[ad-detail] chargement annonce');
          this.hasError.set(true);
          this.isLoading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((detail) => {
        this.ad.set(detail);
        this.isLoading.set(false);
      });
  }

  protected onFavoriteToggle(): void {
    const detail = this.ad();
    if (detail) {
      this.favoritesState.toggle(detail.id);
    }
  }

  protected async contactSeller(): Promise<void> {
    const detail = this.ad();
    if (!detail || !this.isAvailable()) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isAdminScope = localStorage.getItem(AUTH_SCOPE_KEY) === 'admin';
    if (!this.authState.isLoggedIn() || isAdminScope) {
      const result = await Swal.fire({
        icon: 'info',
        title: 'Connexion requise',
        text: 'Connectez-vous avec votre compte client pour contacter le vendeur à propos de ce véhicule.',
        confirmButtonText: 'Se connecter',
        showCancelButton: true,
        cancelButtonText: 'Annuler',
      });
      if (result.isConfirmed) {
        void this.router.navigate(['/connexion'], {
          queryParams: { returnUrl: `/annonces/${detail.id}` },
        });
      }
      return;
    }

    if (!detail.seller) {
      await Swal.fire({
        icon: 'warning',
        title: 'Contact indisponible',
        text: 'Cette annonce n’a pas encore de vendeur associé.',
        confirmButtonText: 'Compris',
      });
      return;
    }

    this.isContacting.set(true);
    this.chatApi
      .create({
        adId: detail.id,
        initialMessage: `Bonjour, je suis intéressé(e) par « ${detail.label} ». Est-il toujours disponible ?`,
      })
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[ad-detail] ouverture conversation');
          this.isContacting.set(false);
          void Swal.fire({
            icon: 'error',
            title: 'Impossible d’ouvrir la conversation',
            text: 'Réessayez dans un instant ou contactez le garage par e-mail.',
            confirmButtonText: 'OK',
          });
          return EMPTY;
        }),
      )
      .subscribe((conversation) => {
        this.isContacting.set(false);
        void this.router.navigate(['/messages', conversation.id]);
      });
  }
}
