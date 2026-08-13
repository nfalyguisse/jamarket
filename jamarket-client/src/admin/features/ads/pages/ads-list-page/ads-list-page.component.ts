import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  LucideEdit,
  LucideLayoutGrid,
  LucideLoader2,
  LucidePlus,
  LucideTag,
  LucideTrash2,
  LucideUser,
} from '@lucide/angular';
import { AdminAdsApiService } from '@admin/data/admin-ads-api.service';
import type { AdminAd, AdminAdListScope } from '@core/models/admin-ad.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';

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
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly deletingId = signal<number | null>(null);

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
