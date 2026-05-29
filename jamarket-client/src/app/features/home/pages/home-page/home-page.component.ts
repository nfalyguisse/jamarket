import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
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
import { SiteFooterComponent } from '../../../../../shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../../../../shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '../../../../../shared/ui/vehicle-card/vehicle-card.component';
import {
  BENTO_WORKSHOP_IMAGE,
  BRAND_OPTIONS,
  HOME_HERO_IMAGE,
  LATEST_VEHICLES,
} from '../../data/home.mock';
import { HomeApiService } from '../../data/home-api.service';

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
export class HomePageComponent implements OnInit {
  private readonly homeApiService = inject(HomeApiService);

  protected readonly heroImage = HOME_HERO_IMAGE;
  protected readonly bentoImage = BENTO_WORKSHOP_IMAGE;
  protected readonly vehicles = signal(LATEST_VEHICLES);
  protected readonly brandOptions = BRAND_OPTIONS;

  protected readonly selectedBrand = signal(BRAND_OPTIONS[0]);
  protected readonly maxPrice = signal(80000);

  ngOnInit(): void {
    this.homeApiService
      .getLatestVehicles()
      .pipe(
        catchError(() => {
          // En cas d'API locale indisponible, on conserve les données mock.
          return EMPTY;
        }),
      )
      .subscribe((vehicles) => {
        if (vehicles.length > 0) {
          this.vehicles.set(vehicles);
        }
      });
  }

  protected onBrandChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedBrand.set(select.value);
  }

  protected onPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.maxPrice.set(Number(input.value));
  }
}
