import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendar, LucideFuel, LucideGauge, LucideHeart } from '@lucide/angular';
import type { VehicleCard } from '@core/models/vehicle-card.model';

@Component({
  selector: 'app-catalogue-vehicle-card',
  imports: [RouterLink, CurrencyPipe, DecimalPipe, LucideGauge, LucideCalendar, LucideFuel, LucideHeart],
  templateUrl: './catalogue-vehicle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueVehicleCardComponent {
  readonly vehicle = input.required<VehicleCard>();
  readonly favoriteToggle = output<string>();

  onFavoriteClick(): void {
    this.favoriteToggle.emit(this.vehicle().id);
  }
}
