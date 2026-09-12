import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  output,
} from '@angular/core';
import { LucideChevronDown, LucideSlidersHorizontal } from '@lucide/angular';
import {
  FUEL_DISPLAY_LABELS,
  type CatalogueFiltersState,
  type CataloguePriceBounds,
} from '../../data/catalogue-filters.model';
import { hasActiveFilters } from '../../data/catalogue-filters.util';
import type { ApiFilterBrand, ApiFilterModel } from '../../data/catalogue-search.model';

@Component({
  selector: 'app-catalogue-filters',
  imports: [DecimalPipe, LucideChevronDown, LucideSlidersHorizontal],
  templateUrl: './catalogue-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueFiltersComponent {
  protected readonly fuelDisplayLabels = FUEL_DISPLAY_LABELS;
  protected readonly yearInputMin = 1900;
  protected readonly yearInputMax = new Date().getFullYear() + 1;

  readonly filters = input.required<CatalogueFiltersState>();
  readonly brandOptions = input.required<ApiFilterBrand[]>();
  readonly modelOptions = input.required<ApiFilterModel[]>();
  readonly fuelOptions = input.required<string[]>();
  readonly priceBounds = input.required<CataloguePriceBounds>();
  readonly mobileOpen = input(false);

  readonly filtersChange = output<Partial<CatalogueFiltersState>>();
  readonly clearAll = output<void>();
  readonly mobileOpenChange = output<boolean>();

  /** Valeur locale du slider pour retour visuel immédiat avant navigation */
  protected readonly localPriceMax = signal<number | null>(null);

  protected readonly hasActiveFilters = computed(() =>
    hasActiveFilters(this.filters()),
  );

  protected readonly sliderMin = computed(() => this.priceBounds().min);
  protected readonly sliderMax = computed(() => this.priceBounds().max);

  protected readonly displayPriceMax = computed(
    () =>
      this.localPriceMax() ??
      this.filters().priceMax ??
      this.priceBounds().max,
  );

  protected onBrandChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    const brandId = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ brandId, modelId: null });
  }

  protected onModelChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    const modelId = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ modelId });
  }

  protected onPriceMinChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ priceMin: Number.isFinite(parsed) ? (parsed as number) : null });
  }

  protected onPriceMaxChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({ priceMax: Number.isFinite(parsed) ? (parsed as number) : null });
  }

  protected onPriceSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.localPriceMax.set(value);
  }

  protected onPriceSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.localPriceMax.set(null);
    this.filtersChange.emit({ priceMax: value });
  }

  protected onYearMinChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({
      yearMin: Number.isFinite(parsed) ? (parsed as number) : null,
    });
  }

  protected onYearMaxChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw === '' ? null : Number(raw);
    this.filtersChange.emit({
      yearMax: Number.isFinite(parsed) ? (parsed as number) : null,
    });
  }

  protected onFuelChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.filtersChange.emit({ fuel: raw || null });
  }

  protected onClearAll(): void {
    this.localPriceMax.set(null);
    this.clearAll.emit();
  }

  protected toggleMobilePanel(): void {
    this.mobileOpenChange.emit(!this.mobileOpen());
  }
}
