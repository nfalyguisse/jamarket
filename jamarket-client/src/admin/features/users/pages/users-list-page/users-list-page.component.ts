import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  LucideBan,
  LucideCheckCircle,
  LucideKeyRound,
  LucideLoader2,
  LucidePlus,
  LucideSearch,
  LucideShield,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { AdminUsersApiService } from '@admin/data/admin-users-api.service';
import type { AdminUser, AdminUserRole } from '@core/models/admin-user.model';
import {
  CUSTOMER_ROLE_ID,
  ROLE_LABELS,
} from '@core/models/admin-user.model';
import { AuthStateService } from '@core/services/auth-state.service';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';

type UserTab = 'clients' | 'team';

@Component({
  selector: 'app-users-list-page',
  imports: [
    DatePipe,
    FormsModule,
    LucideBan,
    LucideCheckCircle,
    LucideKeyRound,
    LucideLoader2,
    LucidePlus,
    LucideSearch,
    LucideShield,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './users-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListPageComponent implements OnInit {
  private readonly adminUsersApi = inject(AdminUsersApiService);
  private readonly authState = inject(AuthStateService);

  protected readonly activeTab = signal<UserTab>('clients');
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly assignableRoles = signal<AdminUserRole[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly searchInput = '';
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalUsers = signal(0);
  protected readonly actionUserId = signal<number | null>(null);
  protected readonly showCreateForm = signal(false);
  protected readonly isCreating = signal(false);

  protected formName = '';
  protected formLastName = '';
  protected formEmail = '';
  protected formRoleId: number | null = null;

  protected readonly roleLabels = ROLE_LABELS;

  ngOnInit(): void {
    this.loadAssignableRoles();
    this.loadUsers();
  }

  protected switchTab(tab: UserTab): void {
    if (this.activeTab() === tab) {
      return;
    }
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.closeCreateForm();
    this.loadUsers();
  }

  protected openCreateForm(): void {
    const roles = this.assignableRoles();
    this.formName = '';
    this.formLastName = '';
    this.formEmail = '';
    this.formRoleId = roles[0]?.id ?? null;
    this.showCreateForm.set(true);
  }

  protected closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.formName = '';
    this.formLastName = '';
    this.formEmail = '';
    this.formRoleId = null;
  }

  protected submitCreateForm(): void {
    const name = this.formName.trim();
    const lastName = this.formLastName.trim();
    const email = this.formEmail.trim();
    const roleId = this.formRoleId;

    if (!name || !lastName || !email || !roleId) {
      void Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez renseigner le prénom, le nom, l’email et le rôle.',
        confirmButtonColor: '#006b5e',
      });
      return;
    }

    this.isCreating.set(true);

    this.adminUsersApi.createEmployee({ name, lastName, email, roleId }).subscribe({
      next: (response) => {
        this.isCreating.set(false);
        this.closeCreateForm();

        if (this.activeTab() === 'team') {
          this.users.update((items) => [response.user, ...items]);
          this.totalUsers.update((count) => count + 1);
        }

        void this.showTemporaryPasswordPopup(response, 'created');
      },
      error: (error: unknown) => {
        this.isCreating.set(false);
        void Swal.fire({
          icon: 'error',
          title: 'Création impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }

  private async showTemporaryPasswordPopup(
    response: { user: AdminUser; temporaryPassword: string },
    context: 'created' | 'reset',
  ): Promise<void> {
    const title =
      context === 'created' ? 'Compte employé créé' : 'Mot de passe régénéré';
    const intro =
      context === 'created'
        ? `Le compte de <strong>${this.fullName(response.user)}</strong> est actif. Communiquez ce mot de passe à l’employé — il ne sera plus affiché.`
        : `Un nouveau mot de passe a été généré pour <strong>${this.fullName(response.user)}</strong>. L’ancien mot de passe n’est plus valide.`;

    await Swal.fire({
      icon: 'success',
      title,
      html: `
        <p class="text-sm text-gray-600 mb-4">${intro}</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Mot de passe temporaire</p>
          <p id="temp-password" class="font-mono text-lg font-bold text-gray-900 tracking-wider">${response.temporaryPassword}</p>
        </div>
      `,
      confirmButtonText: 'Copier le mot de passe',
      confirmButtonColor: '#006b5e',
      showCancelButton: true,
      cancelButtonText: 'Fermer',
      cancelButtonColor: '#6b7280',
      preConfirm: async () => {
        try {
          await navigator.clipboard.writeText(response.temporaryPassword);
          return true;
        } catch {
          Swal.showValidationMessage('Impossible de copier automatiquement. Sélectionnez le mot de passe manuellement.');
          return false;
        }
      },
    });
  }

  protected onSearchSubmit(): void {
    this.searchQuery.set(this.searchInput.trim());
    this.currentPage.set(1);
    this.loadUsers();
  }

  protected onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadUsers();
  }

  protected fullName(user: AdminUser): string {
    return `${user.name} ${user.lastName}`;
  }

  protected roleLabel(roleId: number): string {
    return ROLE_LABELS[roleId] ?? 'Inconnu';
  }

  protected statusLabel(user: AdminUser): string {
    return user.isActive ? 'Actif' : 'Désactivé';
  }

  protected statusClass(user: AdminUser): string {
    return user.isActive
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-red-50 text-red-700';
  }

  protected isCurrentUser(user: AdminUser): boolean {
    return user.id === this.authState.adminProfile()?.id;
  }

  protected confirmResetPassword(user: AdminUser): void {
    if (this.isCurrentUser(user)) {
      return;
    }

    void Swal.fire({
      icon: 'warning',
      title: 'Régénérer le mot de passe ?',
      text: `Un nouveau mot de passe sera généré pour ${this.fullName(user)}. L’ancien ne fonctionnera plus.`,
      showCancelButton: true,
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Régénérer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetPassword(user);
      }
    });
  }

  protected confirmBan(user: AdminUser): void {
    this.confirmToggleStatus(user, 'client');
  }

  protected confirmToggleEmployeeStatus(user: AdminUser): void {
    if (this.isCurrentUser(user)) {
      return;
    }
    this.confirmToggleStatus(user, 'employee');
  }

  private confirmToggleStatus(user: AdminUser, context: 'client' | 'employee'): void {
    const isDeactivating = user.isActive;
    const appName = context === 'client' ? 'Jamarket Auto' : 'le back-office';

    void Swal.fire({
      icon: 'warning',
      title: isDeactivating
        ? context === 'client'
          ? 'Désactiver ce compte client ?'
          : 'Désactiver ce compte employé ?'
        : context === 'client'
          ? 'Réactiver ce compte client ?'
          : 'Réactiver ce compte employé ?',
      text: isDeactivating
        ? `${this.fullName(user)} ne pourra plus se connecter à ${appName}.`
        : `${this.fullName(user)} pourra à nouveau accéder à ${appName}.`,
      showCancelButton: true,
      confirmButtonColor: isDeactivating ? '#dc2626' : '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isDeactivating ? 'Désactiver' : 'Réactiver',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.toggleBan(user, isDeactivating);
      }
    });
  }

  protected onRoleChange(user: AdminUser, newRoleId: number): void {
    if (user.roleId === newRoleId || this.isCurrentUser(user)) {
      return;
    }

    const newRole = this.assignableRoles().find((r) => r.id === newRoleId);
    const newRoleLabel = newRole?.label ?? this.roleLabel(newRoleId);

    void Swal.fire({
      icon: 'question',
      title: 'Modifier le rôle ?',
      text: `Attribuer le rôle « ${newRoleLabel} » à ${this.fullName(user)} ?`,
      showCancelButton: true,
      confirmButtonColor: '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateUserRole(user, newRoleId);
      } else {
        this.loadUsers();
      }
    });
  }

  private loadAssignableRoles(): void {
    this.adminUsersApi.getAssignableRoles().subscribe({
      next: (roles) => this.assignableRoles.set(roles),
      error: (error: unknown) => {
        logHttpError(error, '[admin-users] chargement des rôles');
      },
    });
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const tab = this.activeTab();
    const status = this.statusFilter();

    this.adminUsersApi
      .getUsers({
        search: this.searchQuery() || undefined,
        roleId: tab === 'clients' ? CUSTOMER_ROLE_ID : undefined,
        garageOnly: tab === 'team' ? true : undefined,
        isActive:
          tab === 'clients' && status !== 'all'
            ? status === 'active'
            : undefined,
        page: this.currentPage(),
        limit: 15,
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.totalUsers.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          logHttpError(error, '[admin-users] chargement des utilisateurs');
          this.errorMessage.set(
            resolveUserFacingError(error, 'generic', '[admin-users] chargement'),
          );
          this.isLoading.set(false);
        },
      });
  }

  private toggleBan(user: AdminUser, banned: boolean): void {
    this.actionUserId.set(user.id);

    this.adminUsersApi.banUser(user.id, banned).subscribe({
      next: (updated) => {
        this.users.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.actionUserId.set(null);
        void Swal.fire({
          icon: 'success',
          title: banned ? 'Compte désactivé' : 'Compte réactivé',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.actionUserId.set(null);
        void Swal.fire({
          icon: 'error',
          title: 'Action impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }

  private resetPassword(user: AdminUser): void {
    this.actionUserId.set(user.id);

    this.adminUsersApi.resetPassword(user.id).subscribe({
      next: (response) => {
        this.actionUserId.set(null);
        void this.showTemporaryPasswordPopup(response, 'reset');
      },
      error: (error: unknown) => {
        this.actionUserId.set(null);
        void Swal.fire({
          icon: 'error',
          title: 'Régénération impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }

  private updateUserRole(user: AdminUser, roleId: number): void {
    this.actionUserId.set(user.id);

    this.adminUsersApi.updateRole(user.id, roleId).subscribe({
      next: (updated) => {
        this.users.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.actionUserId.set(null);
        void Swal.fire({
          icon: 'success',
          title: 'Rôle mis à jour',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.actionUserId.set(null);
        this.loadUsers();
        void Swal.fire({
          icon: 'error',
          title: 'Modification impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }
}
