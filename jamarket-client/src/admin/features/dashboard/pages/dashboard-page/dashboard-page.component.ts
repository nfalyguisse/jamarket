import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  LucideCheck,
  LucideX,
  LucideMessageSquare,
  LucideMegaphone,
  LucideChevronDown,
  LucideLoader2,
} from '@lucide/angular';
import { AdminAdsApiService } from '@admin/data/admin-ads-api.service';
import type { AdminAd } from '@core/models/admin-ad.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { finalize } from 'rxjs';

export interface StatCard {
  label: string;
  value: string;
  badge: string;
  badgePositive: boolean;
}

export interface RecentActivity {
  type: 'ad' | 'user' | 'message';
  title: string;
  subtitle: string;
  time: string;
}

export interface BarChartEntry {
  day: string;
  value: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    LucideCheck,
    LucideX,
    LucideMessageSquare,
    LucideMegaphone,
    LucideChevronDown,
    LucideLoader2,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly adminAdsApi = inject(AdminAdsApiService);

  protected readonly statCards: StatCard[] = [
    {
      label: 'Total Annonces',
      value: '1 284',
      badge: '+12%',
      badgePositive: true,
    },
    {
      label: 'Ventes du mois',
      value: '42 850 €',
      badge: '+8.4%',
      badgePositive: true,
    },
    {
      label: 'Nouveaux messages',
      value: '156',
      badge: '24 nouveaux',
      badgePositive: true,
    },
  ];

  protected readonly barChartData: BarChartEntry[] = [
    { day: 'Lun', value: 65 },
    { day: 'Mar', value: 48 },
    { day: 'Mer', value: 82 },
    { day: 'Jeu', value: 70 },
    { day: 'Ven', value: 58 },
    { day: 'Sam', value: 90 },
    { day: 'Dim', value: 42 },
  ];

  protected readonly maxBarValue = Math.max(...this.barChartData.map((d) => d.value));

  protected readonly recentActivities: RecentActivity[] = [
    {
      type: 'ad',
      title: 'Nouvelle annonce ajoutée',
      subtitle: 'Porsche 911 (992) Carrera S',
      time: 'Il y a 14 minutes',
    },
    {
      type: 'user',
      title: 'Nouvel utilisateur inscrit',
      subtitle: 'Jean Dupont (Client particulier)',
      time: 'Il y a 1 heure',
    },
    {
      type: 'message',
      title: 'Nouveau message reçu',
      subtitle: "Demande d'essai : Audi RS6",
      time: 'Il y a 2 heures',
    },
  ];

  protected readonly pendingAds = signal<AdminAd[]>([]);
  protected readonly isLoadingPending = signal(true);
  protected readonly pendingError = signal('');
  protected readonly actionAdId = signal<number | null>(null);
  protected readonly isApprovingAll = signal(false);

  ngOnInit(): void {
    this.loadPendingAds();
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

  protected getBarHeight(value: number): string {
    return `${(value / this.maxBarValue) * 100}%`;
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
