import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { LucideChevronDown, LucideSlidersHorizontal } from '@lucide/angular';
import {
  CATALOGUE_FUEL_FILTER_OPTIONS,
  CATALOGUE_YEAR_RANGE_OPTIONS,
  type CatalogueFiltersState,
  type CataloguePriceBounds,
  type CatalogueYearRange,
} from '../../data/catalogue-filters.model';
import { hasActiveFilters } from '../../data/catalogue-filters.util';

@Component({
  selector: 'app-catalogue-filters',
  imports: [DecimalPipe, LucideChevronDown, LucideSlidersHorizontal],
  templateUrl: './catalogue-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueFiltersComponent {
  protected readonly yearRangeOptions = CATALOGUE_YEAR_RANGE_OPTIONS;
  protected readonly fuelOptions = CATALOGUE_FUEL_FILTER_OPTIONS;

  readonly filters = input.required<CatalogueFiltersState>();
  readonly brandOptions = input.required<string[]>();
  readonly modelOptions = input.required<string[]>();
  readonly priceBounds = input.required<CataloguePriceBounds>();
  readonly mobileOpen = input(false);

  readonly filtersChange = output<Partial<CatalogueFiltersState>>();
  readonly clearAll = output<void>();
  readonly mobileOpenChange = output<boolean>();

  protected readonly hasActiveFilters = computed(() =>
    hasActiveFilters(this.filters()),
  );

  protected readonly sliderMin = computed(() => this.priceBounds().min);
  protected readonly sliderMax = computed(() => this.priceBounds().max);

  protected readonly effectivePriceMax = computed(() => {
    const filters = this.filters();
    return filters.priceMax ?? this.priceBounds().max;
  });

  protected onBrandChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filtersChange.emit({ brand: value, model: '' });
  }

  protected onModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filtersChange.emit({ model: value });
  }

  protected onPriceMinInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ priceMin: Number.isFinite(parsed) ? parsed : null });
  }

  protected onPriceMaxInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ priceMax: Number.isFinite(parsed) ? parsed : null });
  }

  protected onPriceSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.filtersChange.emit({ priceMax: value });
  }

  protected onYearRangeSelect(range: CatalogueYearRange): void {
    const current = this.filters().yearRange;
    this.filtersChange.emit({ yearRange: current === range ? null : range });
  }

  protected onFuelToggle(fuel: string, checked: boolean): void {
    const current = this.filters().fuelTypes;
    const next = checked
      ? [...current, fuel]
      : current.filter((item) => item !== fuel);
    this.filtersChange.emit({ fuelTypes: next });
  }

  protected isFuelChecked(fuel: string): boolean {
    return this.filters().fuelTypes.includes(fuel);
  }

  protected onClearAll(): void {
    this.clearAll.emit();
  }

  protected toggleMobilePanel(): void {
    this.mobileOpenChange.emit(!this.mobileOpen());
  }
}
