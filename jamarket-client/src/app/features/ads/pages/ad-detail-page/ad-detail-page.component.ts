import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import {
  LucideCalendar,
  LucideCar,
  LucideFuel,
  LucideGauge,
  LucideMail,
  LucideMessageSquare,
  LucidePalette,
  LucideUser,
  LucideZap,
} from '@lucide/angular';
import type { AdDetail, AdSpecItem } from '@core/models/ad-detail.model';
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
  ],
  templateUrl: './ad-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adDetailApi = inject(AdDetailApiService);

  protected readonly ad = signal<AdDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

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

}
