import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { LucideArrowLeft, LucideLock, LucideUser } from '@lucide/angular';
import type { UserProfile } from '@core/models/user-profile.model';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { ProfileApiService } from '../../data/profile-api.service';
import { SiteHeaderComponent } from '../../../../../shared/layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../../../../shared/layout/site-footer/site-footer.component';


@Component({
  selector: 'app-edit-profile-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    LucideArrowLeft,
    LucideUser,
    LucideLock,
  ],
  templateUrl: './edit-profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileApiService = inject(ProfileApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    password: ['', [Validators.minLength(8)]],
    passwordConfirm: ['', []],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.profileApiService
      .getProfile()
      .pipe(
        catchError((error: unknown) => {
          logHttpError(error, '[profile-edit] chargement du profil');
          void this.router.navigateByUrl('/connexion');
          return EMPTY;
        }),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.form.patchValue({ name: profile.name, lastName: profile.lastName });
        this.isLoading.set(false);
      });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, lastName, password, passwordConfirm } = this.form.getRawValue();

    if (password && password !== passwordConfirm) {
      this.serverError.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.serverError.set('');
    this.isSubmitting.set(true);

    const payload: { name: string; lastName: string; password?: string } = {
      name,
      lastName,
    };
    if (password) payload.password = password;

    this.profileApiService
      .updateProfile(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          if (isPlatformBrowser(this.platformId)) {
            void Swal.fire({
              icon: 'success',
              title: 'Profil mis à jour',
              text: 'Vos informations ont bien été enregistrées.',
              confirmButtonColor: '#006b5e',
              confirmButtonText: 'Parfait',
              timer: 3000,
              timerProgressBar: true,
            });
          }
          void this.router.navigateByUrl('/profil');
        },
        error: (error: unknown) => {
          this.serverError.set(resolveUserFacingError(error, 'profile-update'));
        },
      });
  }
}
