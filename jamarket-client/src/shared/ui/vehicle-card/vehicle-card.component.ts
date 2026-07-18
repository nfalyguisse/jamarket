import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendar, LucideGauge, LucideHeart, LucideSettings } from '@lucide/angular';
import type { VehicleCard } from '@core/models/vehicle-card.model';

@Component({
  selector: 'app-vehicle-card',
  imports: [RouterLink, CurrencyPipe, DecimalPipe, LucideGauge, LucideCalendar, LucideSettings, LucideHeart],
  templateUrl: './vehicle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCardComponent {
  readonly vehicle = input.required<VehicleCard>();
  readonly isFavorite = input(false);
  readonly favoriteToggle = output<string>();

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.vehicle().id);
  }
}
