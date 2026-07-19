import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideHeart } from '@lucide/angular';
import { EMPTY, catchError } from 'rxjs';
import { AuthStateService } from '@core/services/auth-state.service';
import { FavoritesStateService } from '@core/services/favorites-state.service';
import { logHttpError } from '@core/utils/http-error.util';
import type { VehicleCard } from '@core/models/vehicle-card.model';
import { SiteFooterComponent } from '@shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '@shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '@shared/ui/vehicle-card/vehicle-card.component';
import { FavoritesApiService } from '../../data/favorites-api.service';

@Component({
  selector: 'app-favorites-page',
  imports: [
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    VehicleCardComponent,
    LucideHeart,
  ],
  templateUrl: './favorites-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPageComponent implements OnInit {
  private readonly favoritesApi = inject(FavoritesApiService);
  private readonly favoritesState = inject(FavoritesStateService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly vehicles = signal<VehicleCard[]>([]);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.authState.isLoggedIn()) {
      void this.router.navigateByUrl('/connexion');
      return;
    }

    this.favoritesApi
      .list()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[favorites] chargement de la liste');
          void this.router.navigateByUrl('/connexion');
          return EMPTY;
        }),
      )
      .subscribe((vehicles) => {
        this.vehicles.set(vehicles);
        this.isLoading.set(false);
        this.favoritesState.refresh();
      });
  }

  protected isFavorite(vehicleId: string): boolean {
    return this.favoritesState.isFavorite(vehicleId);
  }

  protected onFavoriteToggle(vehicleId: string): void {
    this.favoritesState.toggle(vehicleId);
    if (!this.favoritesState.isFavorite(vehicleId)) {
      this.vehicles.update((list) => list.filter((v) => v.id !== vehicleId));
    }
  }
}
