import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize } from 'rxjs';
import {
  LucideArrowRight,
  LucideBadgeCheck,
  LucideCheckCircle,
  LucideHandshake,
  LucideHeadphones,
  LucideLoader2,
  LucideSearch,
  LucideShield,
  LucideShieldCheck,
  LucideWrench,
} from '@lucide/angular';
import { SiteFooterComponent } from '../../../../../shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../../../../shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '../../../../../shared/ui/vehicle-card/vehicle-card.component';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { logHttpError } from '@core/utils/http-error.util';
import { FavoritesStateService } from '@core/services/favorites-state.service';
import { HomeApiService } from '../../data/home-api.service';
import { BENTO_WORKSHOP_IMAGE, HOME_HERO_IMAGE } from '../../data/home.mock';
import { CatalogueSearchApiService } from '../../../catalogue/data/catalogue-search-api.service';
import { filtersToQueryParams } from '../../../catalogue/data/catalogue-filters.util';
import { DEFAULT_CATALOGUE_FILTERS } from '../../../catalogue/data/catalogue-filters.model';
import { CATALOGUE_DEFAULT_SORT } from '../../../catalogue/data/catalogue.mock';
import type {
  ApiFilterBrand,
  ApiFilterModel,
} from '../../../catalogue/data/catalogue-search.model';

const PRICE_SLIDER_MAX = 80_000;

@Component({
  selector: 'app-home-page',
  imports: [
    DecimalPipe,
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    VehicleCardComponent,
    LucideArrowRight,
    LucideBadgeCheck,
    LucideCheckCircle,
    LucideHandshake,
    LucideHeadphones,
    LucideLoader2,
    LucideSearch,
    LucideShield,
    LucideShieldCheck,
    LucideWrench,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly homeApiService = inject(HomeApiService);
  private readonly searchApiService = inject(CatalogueSearchApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly favoritesState = inject(FavoritesStateService);

  protected readonly heroImage = HOME_HERO_IMAGE;
  protected readonly bentoImage = BENTO_WORKSHOP_IMAGE;
  protected readonly vehicles = signal<VehicleCard[]>([]);
  protected readonly isLoadingVehicles = signal(isPlatformBrowser(this.platformId));
  protected readonly brands = signal<ApiFilterBrand[]>([]);
  protected readonly allModels = signal<ApiFilterModel[]>([]);

  protected readonly selectedBrandId = signal<number | null>(null);
  protected readonly selectedModelId = signal<number | null>(null);
  protected readonly maxPrice = signal(PRICE_SLIDER_MAX);
  protected readonly priceSliderMax = PRICE_SLIDER_MAX;

  protected readonly filteredModels = computed(() => {
    const brandId = this.selectedBrandId();
    if (brandId === null) {
      return [];
    }
    return this.allModels().filter((m) => m.brandId === brandId);
  });

  protected readonly modelsDisabled = computed(
    () => this.selectedBrandId() === null || this.filteredModels().length === 0,
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.homeApiService
      .getLatestVehicles()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[home] chargement des véhicules');
          return EMPTY;
        }),
        finalize(() => this.isLoadingVehicles.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((vehicles) => {
        this.vehicles.set(vehicles);
      });

    this.searchApiService
      .getFilterOptions()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[home] options de filtrage');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((options) => {
        this.brands.set(options.brands);
        this.allModels.set(options.models);
      });
  }

  protected onBrandChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.selectedBrandId.set(raw === '' ? null : Number(raw));
    this.selectedModelId.set(null);
  }

  protected onModelChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.selectedModelId.set(raw === '' ? null : Number(raw));
  }

  protected onPriceChange(event: Event): void {
    this.maxPrice.set(Number((event.target as HTMLInputElement).value));
  }

  protected onSearch(): void {
    const filters = {
      ...DEFAULT_CATALOGUE_FILTERS,
      brandId: this.selectedBrandId(),
      modelId: this.selectedModelId(),
      priceMax: this.maxPrice() < this.priceSliderMax ? this.maxPrice() : null,
    };

    const queryParams = filtersToQueryParams(filters, CATALOGUE_DEFAULT_SORT, 1, CATALOGUE_DEFAULT_SORT);

    void this.router.navigate(['/catalogue'], { queryParams });
  }

  protected onFavoriteToggle(vehicleId: string): void {
    this.favoritesState.toggle(vehicleId);
  }
}
