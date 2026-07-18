import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideShieldCheck } from '@lucide/angular';
import { AdminAuthApiService } from '@admin/data/admin-auth-api.service';
import { resolveUserFacingError } from '@core/utils/http-error.util';

@Component({
  selector: 'app-admin-login-page',
  imports: [ReactiveFormsModule, RouterLink, LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideShieldCheck],
  templateUrl: './admin-login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminAuth = inject(AdminAuthApiService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal('');
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set('');
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();

    this.adminAuth
      .login({ email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/admin/dashboard');
        },
        error: (error: unknown) => {
          this.serverError.set(resolveUserFacingError(error, 'login'));
        },
      });
  }
}
