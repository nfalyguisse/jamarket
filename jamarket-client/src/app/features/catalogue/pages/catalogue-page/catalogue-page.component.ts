import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { SiteFooterComponent } from '@shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '@shared/layout/site-header/site-header.component';
import { logHttpError } from '@core/utils/http-error.util';
import { CatalogueFiltersComponent } from '../../components/catalogue-filters/catalogue-filters.component';
import { CatalogueVehicleCardComponent } from '../../components/catalogue-vehicle-card/catalogue-vehicle-card.component';
import {
  DEFAULT_CATALOGUE_FILTERS,
  type CatalogueFiltersState,
  type CataloguePriceBounds,
} from '../../data/catalogue-filters.model';
import {
  filtersToQueryParams,
  parseFiltersFromParams,
} from '../../data/catalogue-filters.util';
import { CatalogueSearchApiService } from '../../data/catalogue-search-api.service';
import {
  EMPTY_FILTER_OPTIONS,
  EMPTY_SEARCH_RESULT,
  type ApiFilterBrand,
  type ApiFilterModel,
  type ApiFilterOptions,
  type SearchPageResult,
} from '../../data/catalogue-search.model';
import {
  CATALOGUE_DEFAULT_SORT,
  CATALOGUE_PAGE_SIZE,
  CATALOGUE_SORT_OPTIONS,
  type CatalogueSortValue,
} from '../../data/catalogue.mock';
import { FavoritesStateService } from '@core/services/favorites-state.service';

@Component({
  selector: 'app-catalogue-page',
  imports: [
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    CatalogueVehicleCardComponent,
    CatalogueFiltersComponent,
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './catalogue-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CataloguePageComponent implements OnInit {
  private readonly searchApi = inject(CatalogueSearchApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly favoritesState = inject(FavoritesStateService);

  protected readonly sortOptions = CATALOGUE_SORT_OPTIONS;
  protected readonly pageSize = CATALOGUE_PAGE_SIZE;

  protected readonly filters = signal<CatalogueFiltersState>({ ...DEFAULT_CATALOGUE_FILTERS });
  protected readonly selectedSort = signal<CatalogueSortValue>(CATALOGUE_DEFAULT_SORT);
  protected readonly currentPage = signal(1);
  protected readonly filtersMobileOpen = signal(false);

  protected readonly filterOptions = signal<ApiFilterOptions>(EMPTY_FILTER_OPTIONS);
  protected readonly searchResult = signal<SearchPageResult>(EMPTY_SEARCH_RESULT);
  protected readonly isLoading = signal(isPlatformBrowser(this.platformId));

  protected readonly brandOptions = computed<ApiFilterBrand[]>(() =>
    this.filterOptions().brands,
  );

  protected readonly modelOptions = computed<ApiFilterModel[]>(() => {
    const brandId = this.filters().brandId;
    const allModels = this.filterOptions().models;
    return brandId !== null
      ? allModels.filter((m) => m.brandId === brandId)
      : allModels;
  });

  protected readonly fuelOptions = computed<string[]>(() =>
    this.filterOptions().fuelTypes,
  );

  protected readonly priceBounds = computed<CataloguePriceBounds>(() => ({
    min: this.filterOptions().priceRange.min,
    max: Math.max(this.filterOptions().priceRange.max, 5_000),
  }));

  protected readonly vehicles = computed(() => this.searchResult().vehicles);
  protected readonly totalResults = computed(() => this.searchResult().total);
  protected readonly totalPages = computed(() => this.searchResult().totalPages);

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  constructor() {
    effect(() => {
      const brandId = this.filters().brandId;
      untracked(() => this.loadFilterOptions(brandId ?? undefined));
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.queryParamMap
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (a, b) => a.keys.join() === b.keys.join() && a.keys.every((k) => a.get(k) === b.get(k)),
        ),
        switchMap((params) => {
          const filters = parseFiltersFromParams(params);
          const sort = (params.get('sort') ?? CATALOGUE_DEFAULT_SORT) as CatalogueSortValue;
          const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));

          this.filters.set(filters);
          this.selectedSort.set(sort);
          this.currentPage.set(page);
          this.isLoading.set(true);

          return this.searchApi
            .search({ filters, sort, page, limit: this.pageSize })
            .pipe(
              catchError((error: unknown) => {
                logHttpError(error, '[catalogue] recherche');
                this.isLoading.set(false);
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.searchResult.set(result);
        this.isLoading.set(false);
      });
  }

  private loadFilterOptions(brandId?: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.searchApi
      .getFilterOptions(brandId)
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[catalogue] options de filtrage');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((options) => {
        this.filterOptions.set(options);
      });
  }

  protected onFiltersChange(partial: Partial<CatalogueFiltersState>): void {
    const next = { ...this.filters(), ...partial };
    const params = filtersToQueryParams(next, this.selectedSort(), 1, CATALOGUE_DEFAULT_SORT);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }

  protected onClearFilters(): void {
    const params = filtersToQueryParams(
      { ...DEFAULT_CATALOGUE_FILTERS },
      CATALOGUE_DEFAULT_SORT,
      1,
      CATALOGUE_DEFAULT_SORT,
    );
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CatalogueSortValue;
    const params = filtersToQueryParams(this.filters(), value, 1, CATALOGUE_DEFAULT_SORT);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    const params = filtersToQueryParams(this.filters(), this.selectedSort(), page, CATALOGUE_DEFAULT_SORT);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }

  protected onFiltersMobileOpenChange(open: boolean): void {
    this.filtersMobileOpen.set(open);
  }

  protected onFavoriteToggle(vehicleId: string): void {
    this.favoritesState.toggle(vehicleId);
  }
}
