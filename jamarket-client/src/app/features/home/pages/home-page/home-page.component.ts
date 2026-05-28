import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBadgeCheck,
  LucideCheckCircle,
  LucideHandshake,
  LucideHeadphones,
  LucideSearch,
  LucideShield,
  LucideShieldCheck,
  LucideWrench,
} from '@lucide/angular';
import { SiteFooterComponent } from '../../../../shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../../../shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '../../../../shared/ui/vehicle-card/vehicle-card.component';
import {
  BENTO_WORKSHOP_IMAGE,
  BRAND_OPTIONS,
  HOME_HERO_IMAGE,
  LATEST_VEHICLES,
} from '../../data/home.mock';

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
    LucideSearch,
    LucideShield,
    LucideShieldCheck,
    LucideWrench,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly heroImage = HOME_HERO_IMAGE;
  protected readonly bentoImage = BENTO_WORKSHOP_IMAGE;
  protected readonly vehicles = LATEST_VEHICLES;
  protected readonly brandOptions = BRAND_OPTIONS;

  protected readonly selectedBrand = signal(BRAND_OPTIONS[0]);
  protected readonly maxPrice = signal(80000);

  protected onBrandChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedBrand.set(select.value);
  }

  protected onPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.maxPrice.set(Number(input.value));
  }
}
