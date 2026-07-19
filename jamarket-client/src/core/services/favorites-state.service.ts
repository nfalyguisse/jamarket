import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, finalize, map, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthStateService } from '@core/services/auth-state.service';
import { logHttpError } from '@core/utils/http-error.util';
import { FavoritesApiService } from '../../app/features/favorites/data/favorites-api.service';

@Injectable({ providedIn: 'root' })
export class FavoritesStateService {
  private readonly api = inject(FavoritesApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _ids = signal<Set<number>>(new Set());
  private readonly _loaded = signal(false);
  private readonly _pending = signal<Set<number>>(new Set());

  readonly ids = this._ids.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly count = computed(() => this._ids().size);

  constructor() {
    effect(() => {
      const loggedIn = this.authState.isLoggedIn();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      if (loggedIn) {
        this.refresh();
      } else {
        this._ids.set(new Set());
        this._loaded.set(false);
      }
    });
  }

  isFavorite(adId: number | string): boolean {
    return this._ids().has(Number(adId));
  }

  isPending(adId: number | string): boolean {
    return this._pending().has(Number(adId));
  }

  refresh(): void {
    if (!this.authState.isLoggedIn()) {
      this._ids.set(new Set());
      this._loaded.set(false);
      return;
    }

    this.api
      .listIds()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[favorites] chargement des IDs');
          return of([] as number[]);
        }),
      )
      .subscribe((ids) => {
        this._ids.set(new Set(ids));
        this._loaded.set(true);
      });
  }

  /**
   * Bascule le favori. Si non connecté, affiche une popup puis propose /connexion.
   * @returns true si une action API a été lancée
   */
  toggle(adId: number | string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (!this.authState.isLoggedIn()) {
      void this.promptLoginToFavorite();
      return false;
    }

    const id = Number(adId);
    if (!Number.isFinite(id) || id <= 0 || this.isPending(id)) {
      return false;
    }

    this.markPending(id, true);
    const currentlyFavorite = this.isFavorite(id);

    this.setFavoriteLocal(id, !currentlyFavorite);

    const request$ = currentlyFavorite
      ? this.api.remove(id).pipe(map(() => undefined))
      : this.api.add(id).pipe(map(() => undefined));

    request$
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[favorites] toggle');
          this.setFavoriteLocal(id, currentlyFavorite);
          return EMPTY;
        }),
        finalize(() => this.markPending(id, false)),
      )
      .subscribe();

    return true;
  }

  private async promptLoginToFavorite(): Promise<void> {
    const result = await Swal.fire({
      icon: 'info',
      title: 'Connexion requise',
      text: 'Connectez-vous pour ajouter des véhicules à vos favoris et les retrouver plus tard.',
      showCancelButton: true,
      confirmButtonText: 'Se connecter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      void this.router.navigateByUrl('/connexion');
    }
  }

  private setFavoriteLocal(adId: number, favorite: boolean): void {
    const next = new Set(this._ids());
    if (favorite) {
      next.add(adId);
    } else {
      next.delete(adId);
    }
    this._ids.set(next);
  }

  private markPending(adId: number, pending: boolean): void {
    const next = new Set(this._pending());
    if (pending) {
      next.add(adId);
    } else {
      next.delete(adId);
    }
    this._pending.set(next);
  }
}
