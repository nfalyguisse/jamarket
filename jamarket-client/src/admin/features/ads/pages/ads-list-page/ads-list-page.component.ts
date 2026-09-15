import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  LucideEdit,
  LucideLayoutGrid,
  LucideLoader2,
  LucidePlus,
  LucideRotateCcw,
  LucideTag,
  LucideTrash2,
  LucideUser,
} from '@lucide/angular';
import { AdminAdsApiService } from '@admin/data/admin-ads-api.service';
import type { AdminAd, AdminAdListScope } from '@core/models/admin-ad.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { finalize } from 'rxjs';

export type AdStatusFilter = 'available' | 'sold' | 'all';

@Component({
  selector: 'app-ads-list-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    LucideEdit,
    LucideLayoutGrid,
    LucideLoader2,
    LucidePlus,
    LucideRotateCcw,
    LucideTag,
    LucideTrash2,
    LucideUser,
  ],
  templateUrl: './ads-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsListPageComponent implements OnInit {
  private readonly adminAdsApi = inject(AdminAdsApiService);

  protected readonly ads = signal<AdminAd[]>([]);
  protected readonly listScope = signal<AdminAdListScope>('mine');
  protected readonly statusFilter = signal<AdStatusFilter>('available');
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly deletingId = signal<number | null>(null);
  protected readonly statusActionId = signal<number | null>(null);

  protected readonly filteredAds = computed(() => {
    const filter = this.statusFilter();
    const list = this.ads().filter((ad) => !ad.isArchived);
    if (filter === 'all') {
      return list;
    }
    if (filter === 'sold') {
      return list.filter((ad) => ad.isSold);
    }
    return list.filter((ad) => !ad.isSold);
  });

  ngOnInit(): void {
    this.loadAds();
  }

  protected switchScope(scope: AdminAdListScope): void {
    if (this.listScope() === scope) {
      return;
    }
    this.listScope.set(scope);
    this.loadAds();
  }

  protected switchStatusFilter(filter: AdStatusFilter): void {
    this.statusFilter.set(filter);
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

  protected statusLabel(ad: AdminAd): string {
    if (ad.isArchived) return 'Archivée';
    if (ad.isSold) return 'Vendue';
    if (ad.isActive) return 'En ligne';
    return 'Brouillon';
  }

  protected statusClass(ad: AdminAd): string {
    if (ad.isArchived) return 'bg-gray-100 text-gray-500';
    if (ad.isSold) return 'bg-gray-100 text-gray-700';
    if (ad.isActive) return 'bg-emerald-50 text-emerald-700';
    return 'bg-amber-50 text-amber-700';
  }

  protected confirmDelete(ad: AdminAd): void {
    void Swal.fire({
      icon: 'warning',
      title: 'Archiver cette annonce ?',
      text: `"${ad.label}" sera retirée du catalogue public. Elle sera marquée comme archivée (et non comme brouillon).`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Archiver',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteAd(ad.id);
      }
    });
  }

  protected confirmMarkSold(ad: AdminAd): void {
    void Swal.fire({
      icon: 'question',
      title: 'Marquer comme vendue ?',
      text: `"${ad.label}" quittera le catalogue. Les conversations existantes passeront en lecture seule.`,
      showCancelButton: true,
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Marquer vendue',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.markSold(ad);
      }
    });
  }

  protected confirmMarkAvailable(ad: AdminAd): void {
    void Swal.fire({
      icon: 'question',
      title: 'Repasser en disponible ?',
      text: `"${ad.label}" réapparaîtra au catalogue et le chat redeviendra actif.`,
      showCancelButton: true,
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Repasser disponible',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.markAvailable(ad);
      }
    });
  }

  private loadAds(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminAdsApi.getMyAds(this.listScope()).subscribe({
      next: (ads) => {
        this.ads.set(ads);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        logHttpError(error, '[admin-ads] chargement des annonces');
        this.errorMessage.set(
          resolveUserFacingError(error, 'generic', '[admin-ads] chargement'),
        );
        this.isLoading.set(false);
      },
    });
  }

  private markSold(ad: AdminAd): void {
    this.statusActionId.set(ad.id);
    this.adminAdsApi
      .markAsSold(ad.id)
      .pipe(finalize(() => this.statusActionId.set(null)))
      .subscribe({
        next: (updated) => {
          this.ads.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          void Swal.fire({
            icon: 'success',
            title: 'Annonce marquée vendue',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: 'Action impossible',
            text: resolveUserFacingError(error, 'ad-form'),
            confirmButtonColor: '#006b5e',
          });
        },
      });
  }

  private markAvailable(ad: AdminAd): void {
    this.statusActionId.set(ad.id);
    this.adminAdsApi
      .markAsAvailable(ad.id)
      .pipe(finalize(() => this.statusActionId.set(null)))
      .subscribe({
        next: (updated) => {
          this.ads.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          void Swal.fire({
            icon: 'success',
            title: 'Annonce repassée disponible',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          void Swal.fire({
            icon: 'error',
            title: 'Action impossible',
            text: resolveUserFacingError(error, 'ad-form'),
            confirmButtonColor: '#006b5e',
          });
        },
      });
  }

  private deleteAd(id: number): void {
    this.deletingId.set(id);

    this.adminAdsApi.deleteAd(id).subscribe({
      next: () => {
        this.ads.update((items) => items.filter((ad) => ad.id !== id));
        this.deletingId.set(null);
        void Swal.fire({
          icon: 'success',
          title: 'Annonce archivée',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.deletingId.set(null);
        void Swal.fire({
          icon: 'error',
          title: 'Suppression impossible',
          text: resolveUserFacingError(error, 'ad-form'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }
}
