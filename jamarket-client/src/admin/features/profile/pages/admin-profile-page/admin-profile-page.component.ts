import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  LucideCamera,
  LucideLoader2,
  LucideLock,
  LucideTrash2,
  LucideUser,
} from '@lucide/angular';
import { AdminAuthApiService } from '@admin/data/admin-auth-api.service';
import type { UserProfile } from '@core/models/user-profile.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-profile-page',
  imports: [
    ReactiveFormsModule,
    LucideCamera,
    LucideLoader2,
    LucideLock,
    LucideTrash2,
    LucideUser,
  ],
  templateUrl: './admin-profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminAuth = inject(AdminAuthApiService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSavingProfile = signal(false);
  protected readonly isSavingPassword = signal(false);
  protected readonly isUploadingAvatar = signal(false);
  protected readonly profileError = signal('');
  protected readonly passwordError = signal('');
  protected readonly avatarError = signal('');

  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPasswordConfirm: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.adminAuth.refreshAdminProfile().subscribe({
      next: (profile) => this.applyProfile(profile),
      error: (error: unknown) => {
        logHttpError(error, '[admin-profile] chargement');
        this.isLoading.set(false);
      },
    });
  }

  protected initials(): string {
    const p = this.profile();
    if (!p) return 'A';
    return `${p.name.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  }

  protected avatarSrc(): string | null {
    const url = this.profile()?.avatarUrl;
    return url ? resolveMediaUrl(url) : null;
  }

  protected roleLabel(): string {
    return this.profile()?.role.label ?? 'Employé';
  }

  protected openAvatarPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.avatarError.set('');
    this.isUploadingAvatar.set(true);

    this.adminAuth
      .uploadAvatar(file)
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          void Swal.fire({
            icon: 'success',
            title: 'Photo mise à jour',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          this.avatarError.set(resolveUserFacingError(error, 'profile-update'));
        },
      });
  }

  protected confirmRemoveAvatar(): void {
    if (!this.profile()?.avatarUrl) {
      return;
    }

    void Swal.fire({
      icon: 'warning',
      title: 'Supprimer la photo ?',
      text: 'Votre photo de profil sera retirée.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.removeAvatar();
      }
    });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid || this.isSavingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileError.set('');
    this.isSavingProfile.set(true);

    const { name, lastName } = this.profileForm.getRawValue();

    this.adminAuth
      .updateProfile({ name, lastName })
      .pipe(finalize(() => this.isSavingProfile.set(false)))
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          void Swal.fire({
            icon: 'success',
            title: 'Profil mis à jour',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          this.profileError.set(resolveUserFacingError(error, 'profile-update'));
        },
      });
  }

  protected savePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, newPasswordConfirm } =
      this.passwordForm.getRawValue();

    if (newPassword !== newPasswordConfirm) {
      this.passwordError.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.passwordError.set('');
    this.isSavingPassword.set(true);

    this.adminAuth
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.isSavingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          void Swal.fire({
            icon: 'success',
            title: 'Mot de passe modifié',
            text: 'Votre nouveau mot de passe est actif.',
            timer: 2500,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          this.passwordError.set(resolveUserFacingError(error, 'profile-update'));
        },
      });
  }

  private applyProfile(profile: UserProfile): void {
    this.profile.set(profile);
    this.profileForm.patchValue({
      name: profile.name,
      lastName: profile.lastName,
    });
    this.isLoading.set(false);
  }

  private removeAvatar(): void {
    this.avatarError.set('');
    this.isUploadingAvatar.set(true);

    this.adminAuth
      .deleteAvatar()
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          void Swal.fire({
            icon: 'success',
            title: 'Photo supprimée',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error: unknown) => {
          this.avatarError.set(resolveUserFacingError(error, 'profile-update'));
        },
      });
  }
}
