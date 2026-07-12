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
  LucideLoader2,
  LucideSearch,
  LucideShield,
  LucideUsers,
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
    LucideLoader2,
    LucideSearch,
    LucideShield,
    LucideUsers,
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
    this.loadUsers();
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

  protected confirmBan(user: AdminUser): void {
    const isBanning = user.isActive;

    void Swal.fire({
      icon: 'warning',
      title: isBanning ? 'Désactiver ce compte client ?' : 'Réactiver ce compte client ?',
      text: isBanning
        ? `${this.fullName(user)} ne pourra plus se connecter à Jamarket Auto.`
        : `${this.fullName(user)} pourra à nouveau accéder à son compte.`,
      showCancelButton: true,
      confirmButtonColor: isBanning ? '#dc2626' : '#006b5e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isBanning ? 'Désactiver' : 'Réactiver',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.toggleBan(user, isBanning);
      }
    });
  }

  protected onRoleChange(user: AdminUser, newRoleId: number): void {
    if (user.roleId === newRoleId || this.isCurrentUser(user)) {
      return;
    }

    const newRoleLabel = this.roleLabel(newRoleId);

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
