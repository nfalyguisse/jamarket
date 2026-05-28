import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCalendar, LucideGauge, LucideHeart, LucideSettings } from '@lucide/angular';
import type { VehicleCard } from '../../../core/models/vehicle-card.model';

@Component({
  selector: 'app-vehicle-card',
  imports: [CurrencyPipe, DecimalPipe, LucideGauge, LucideCalendar, LucideSettings, LucideHeart],
  templateUrl: './vehicle-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCardComponent {
  readonly vehicle = input.required<VehicleCard>();
  readonly favoriteToggle = output<string>();

  onFavoriteClick(): void {
    this.favoriteToggle.emit(this.vehicle().id);
  }
}
