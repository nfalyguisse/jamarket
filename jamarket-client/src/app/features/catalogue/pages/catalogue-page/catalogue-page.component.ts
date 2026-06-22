import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { SiteFooterComponent } from '@shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '@shared/layout/site-header/site-header.component';
import { logHttpError } from '@core/utils/http-error.util';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { CatalogueFiltersComponent } from '../../components/catalogue-filters/catalogue-filters.component';
import { CatalogueVehicleCardComponent } from '../../components/catalogue-vehicle-card/catalogue-vehicle-card.component';
import { CatalogueApiService } from '../../data/catalogue-api.service';
import {
  DEFAULT_CATALOGUE_FILTERS,
  type CatalogueFiltersState,
} from '../../data/catalogue-filters.model';
import {
  applyCatalogueFilters,
  extractBrandOptions,
  extractModelOptions,
  getPriceBounds,
} from '../../data/catalogue-filters.util';
import {
  CATALOGUE_PAGE_SIZE,
  CATALOGUE_SORT_OPTIONS,
  CATALOGUE_VEHICLES,
  type CatalogueSortValue,
} from '../../data/catalogue.mock';

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
  private readonly catalogueApi = inject(CatalogueApiService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly sortOptions = CATALOGUE_SORT_OPTIONS;
  protected readonly pageSize = CATALOGUE_PAGE_SIZE;

  protected readonly vehicles = signal<VehicleCard[]>(CATALOGUE_VEHICLES);
  protected readonly filters = signal<CatalogueFiltersState>({ ...DEFAULT_CATALOGUE_FILTERS });
  protected readonly filtersMobileOpen = signal(false);
  protected readonly selectedSort = signal<CatalogueSortValue>('latest');
  protected readonly currentPage = signal(1);

  protected readonly priceBounds = computed(() => getPriceBounds(this.vehicles()));

  protected readonly brandOptions = computed(() =>
    extractBrandOptions(this.vehicles()),
  );

  protected readonly modelOptions = computed(() =>
    extractModelOptions(this.vehicles(), this.filters().brand),
  );

  protected readonly filteredVehicles = computed(() =>
    applyCatalogueFilters(this.vehicles(), this.filters()),
  );

  protected readonly sortedVehicles = computed(() => {
    const items = [...this.filteredVehicles()];
    const sort = this.selectedSort();

    switch (sort) {
      case 'price-asc':
        return items.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return items.sort((a, b) => b.price - a.price);
      case 'mileage-asc':
        return items.sort((a, b) => a.mileageKm - b.mileageKm);
      case 'latest':
      default:
        return items.sort((a, b) => Number(b.id) - Number(a.id));
    }
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedVehicles().length / this.pageSize)),
  );

  protected readonly paginatedVehicles = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedVehicles().slice(start, start + this.pageSize);
  });

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.catalogueApi
      .getVehicles()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[catalogue] chargement des véhicules');
          return EMPTY;
        }),
      )
      .subscribe((vehicles) => {
        if (vehicles.length > 0) {
          this.vehicles.set(vehicles);
        }
      });
  }

  protected onFiltersChange(partial: Partial<CatalogueFiltersState>): void {
    this.filters.update((current) => ({ ...current, ...partial }));
    this.currentPage.set(1);
  }

  protected onClearFilters(): void {
    this.filters.set({ ...DEFAULT_CATALOGUE_FILTERS });
    this.currentPage.set(1);
  }

  protected onFiltersMobileOpenChange(open: boolean): void {
    this.filtersMobileOpen.set(open);
  }

  protected onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedSort.set(select.value as CatalogueSortValue);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  protected onFavoriteToggle(_vehicleId: string): void {
    // Favoris : branché dans une tâche dédiée
  }
}
