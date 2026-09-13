import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export interface AuthPromptOptions {
  /** Titre de la popup (défaut : « Connexion requise »). */
  title?: string;
  /** Message informatif affiché à l’utilisateur. */
  text: string;
  /** URL de retour après connexion réussie. */
  returnUrl?: string;
}

/**
 * Affiche une popup informative lorsque l’utilisateur doit se connecter
 * pour accéder à une action (favoris, messagerie, etc.).
 */
@Injectable({ providedIn: 'root' })
export class AuthPromptService {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * @returns `true` si l’utilisateur a choisi « Se connecter ».
   */
  async promptLogin(options: AuthPromptOptions): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const result = await Swal.fire({
      icon: 'info',
      title: options.title ?? 'Connexion requise',
      text: options.text,
      showCancelButton: true,
      confirmButtonText: 'Se connecter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return false;
    }

    void this.router.navigate(['/connexion'], {
      queryParams: options.returnUrl ? { returnUrl: options.returnUrl } : {},
    });
    return true;
  }
}
