import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  LucideCheck,
  LucideX,
  LucideMegaphone,
  LucideLoader2,
} from '@lucide/angular';
import { AdminAdsApiService } from '@admin/data/admin-ads-api.service';
import type { AdminAd } from '@core/models/admin-ad.model';
import { hasDeleteAdRight } from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    LucideCheck,
    LucideX,
    LucideMegaphone,
    LucideLoader2,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly adminAdsApi = inject(AdminAdsApiService);
  private readonly authState = inject(AuthStateService);

  protected readonly totalAds = signal<number | null>(null);
  protected readonly isLoadingStats = signal(true);
  protected readonly statsError = signal('');

  protected readonly pendingAds = signal<AdminAd[]>([]);
  protected readonly isLoadingPending = signal(true);
  protected readonly pendingError = signal('');
  protected readonly actionAdId = signal<number | null>(null);
  protected readonly isApprovingAll = signal(false);

  protected readonly canArchiveAds = computed(() => {
    const profile = this.authState.adminProfile();
    return !!profile && hasDeleteAdRight(profile);
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadPendingAds();
  }

  protected formatCount(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  protected vehicleTitle(ad: AdminAd): string {
    const brand = ad.vehicule.brandLabel.trim();
    const model = ad.vehicule.modelLabel.trim();
    return [brand, model].filter(Boolean).join(' ') || ad.label;
  }

  protected vehicleSubtitle(ad: AdminAd): string {
    const parts = [ad.label.trim(), String(ad.vehicule.year)].filter(Boolean);
    return parts.join(' · ');
  }

  protected sellerName(ad: AdminAd): string {
    if (!ad.seller) {
      return '—';
    }
    return `${ad.seller.name} ${ad.seller.lastName}`;
  }

  protected imageUrl(ad: AdminAd): string {
    const url = ad.vehicule.images[0]?.url;
    return url ? resolveMediaUrl(url) : '/assets/images/vehicle-placeholder.svg';
  }

  protected approveAd(ad: AdminAd): void {
    if (this.actionAdId() !== null) {
      return;
    }

    this.actionAdId.set(ad.id);

    this.adminAdsApi
      .approveAd(ad.id)
      .pipe(finalize(() => this.actionAdId.set(null)))
      .subscribe({
        next: () => {
          this.pendingAds.update((items) => items.filter((item) => item.id !== ad.id));
          void Swal.fire({
            icon: 'success',
            title: 'Annonce approuvée',
            text: `"${ad.label}" est maintenant en ligne.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: 'Approbation impossible',
            text: resolveUserFacingError(error, 'ad-form'),
            confirmButtonColor: '#006b5e',
          });
        },
      });
  }

  protected rejectAd(ad: AdminAd): void {
    void Swal.fire({
      icon: 'warning',
      title: 'Rejeter cette annonce ?',
      text: `"${ad.label}" sera archivée et retirée du catalogue.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Rejeter',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.actionAdId.set(ad.id);

      this.adminAdsApi
        .deleteAd(ad.id)
        .pipe(finalize(() => this.actionAdId.set(null)))
        .subscribe({
          next: () => {
            this.pendingAds.update((items) => items.filter((item) => item.id !== ad.id));
            this.loadStats();
            void Swal.fire({
              icon: 'success',
              title: 'Annonce rejetée',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (error: unknown) => {
            void Swal.fire({
              icon: 'error',
              title: 'Rejet impossible',
              text: resolveUserFacingError(error, 'ad-form'),
              confirmButtonColor: '#006b5e',
            });
          },
        });
    });
  }

  protected approveAll(): void {
    if (this.pendingAds().length === 0 || this.isApprovingAll()) {
      return;
    }

    const count = this.pendingAds().length;

    void Swal.fire({
      icon: 'question',
      title: 'Tout approuver ?',
      text: `${count} annonce${count > 1 ? 's' : ''} seront publiées en ligne.`,
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Tout approuver',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.isApprovingAll.set(true);

      this.adminAdsApi
        .approveAllPending()
        .pipe(finalize(() => this.isApprovingAll.set(false)))
        .subscribe({
          next: ({ approved }) => {
            this.pendingAds.set([]);
            void Swal.fire({
              icon: 'success',
              title: 'Annonces approuvées',
              text: `${approved} annonce${approved > 1 ? 's' : ''} publiée${approved > 1 ? 's' : ''}.`,
              timer: 2500,
              showConfirmButton: false,
            });
          },
          error: (error: unknown) => {
            void Swal.fire({
              icon: 'error',
              title: 'Approbation impossible',
              text: resolveUserFacingError(error, 'ad-form'),
              confirmButtonColor: '#006b5e',
            });
          },
        });
    });
  }

  private loadStats(): void {
    this.isLoadingStats.set(true);
    this.statsError.set('');

    this.adminAdsApi.getMyAds('all').subscribe({
      next: (ads) => {
        this.totalAds.set(ads.length);
        this.isLoadingStats.set(false);
      },
      error: (error: unknown) => {
        logHttpError(error, '[dashboard] chargement total annonces');
        this.statsError.set(
          resolveUserFacingError(error, 'generic', '[dashboard] total ads'),
        );
        this.totalAds.set(null);
        this.isLoadingStats.set(false);
      },
    });
  }

  private loadPendingAds(): void {
    this.isLoadingPending.set(true);
    this.pendingError.set('');

    this.adminAdsApi.getPendingAds().subscribe({
      next: (ads) => {
        this.pendingAds.set(ads);
        this.isLoadingPending.set(false);
      },
      error: (error: unknown) => {
        logHttpError(error, '[dashboard] chargement annonces en attente');
        this.pendingError.set(
          resolveUserFacingError(error, 'generic', '[dashboard] pending ads'),
        );
        this.isLoadingPending.set(false);
      },
    });
  }
}
