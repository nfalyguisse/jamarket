import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendar, LucideFuel, LucideGauge, LucideHeart } from '@lucide/angular';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';

@Component({
  selector: 'app-catalogue-vehicle-card',
  imports: [RouterLink, CurrencyPipe, DecimalPipe, LucideGauge, LucideCalendar, LucideFuel, LucideHeart],
  templateUrl: './catalogue-vehicle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class CatalogueVehicleCardComponent {
  readonly vehicle = input.required<VehicleCard>();
  readonly isFavorite = input(false);
  readonly favoriteToggle = output<string>();

  protected imageSrc(): string {
    return resolveMediaUrl(this.vehicle().imageUrl);
  }

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.vehicle().id);
  }
}
