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
  LucideEdit,
  LucideKeyRound,
  LucideLoader2,
  LucidePlus,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { AdminRolesApiService } from '@admin/data/admin-roles-api.service';
import type { AdminRole, AvailableRight } from '@core/models/admin-role.model';
import { RIGHT_LABELS } from '@core/models/admin-role.model';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';

@Component({
  selector: 'app-roles-list-page',
  imports: [
    FormsModule,
    LucideEdit,
    LucideKeyRound,
    LucideLoader2,
    LucidePlus,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './roles-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesListPageComponent implements OnInit {
  private readonly adminRolesApi = inject(AdminRolesApiService);

  protected readonly roles = signal<AdminRole[]>([]);
  protected readonly availableRights = signal<AvailableRight[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingRoleId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);

  protected formLabel = '';
  protected selectedRights = signal<string[]>([]);

  protected readonly rightLabels = RIGHT_LABELS;

  ngOnInit(): void {
    this.loadData();
  }

  protected rightLabel(right: string): string {
    return RIGHT_LABELS[right] ?? right;
  }

  protected openCreateForm(): void {
    this.editingRoleId.set(null);
    this.formLabel = '';
    this.selectedRights.set([]);
    this.showForm.set(true);
  }

  protected openEditForm(role: AdminRole): void {
    this.editingRoleId.set(role.id);
    this.formLabel = role.label;
    this.selectedRights.set([...role.rights]);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingRoleId.set(null);
    this.formLabel = '';
    this.selectedRights.set([]);
  }

  protected isRightSelected(right: string): boolean {
    return this.selectedRights().includes(right);
  }

  protected toggleRight(right: string): void {
    this.selectedRights.update((rights) =>
      rights.includes(right) ? rights.filter((r) => r !== right) : [...rights, right],
    );
  }

  protected submitForm(): void {
    const label = this.formLabel.trim();
    const rights = this.selectedRights();

    if (!label) {
      void Swal.fire({
        icon: 'warning',
        title: 'Nom requis',
        text: 'Veuillez saisir un nom pour le rôle.',
        confirmButtonColor: '#006b5e',
      });
      return;
    }

    if (rights.length === 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Droits requis',
        text: 'Sélectionnez au moins un droit pour ce rôle.',
        confirmButtonColor: '#006b5e',
      });
      return;
    }

    const editingId = this.editingRoleId();
    this.isSaving.set(true);

    const request$ = editingId
      ? this.adminRolesApi.updateRole(editingId, { label, rights })
      : this.adminRolesApi.createRole({ label, rights });

    request$.subscribe({
      next: (saved) => {
        if (editingId) {
          this.roles.update((items) =>
            items.map((item) => (item.id === saved.id ? saved : item)),
          );
        } else {
          this.roles.update((items) => [...items, saved]);
        }
        this.isSaving.set(false);
        this.closeForm();
        void Swal.fire({
          icon: 'success',
          title: editingId ? 'Rôle mis à jour' : 'Rôle créé',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        void Swal.fire({
          icon: 'error',
          title: 'Enregistrement impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }

  protected confirmDelete(role: AdminRole): void {
    const userInfo =
      role.userCount > 0
        ? ` Ce rôle est actuellement assigné à ${role.userCount} utilisateur${role.userCount > 1 ? 's' : ''}.`
        : '';

    void Swal.fire({
      icon: 'warning',
      title: 'Supprimer ce rôle ?',
      text: `« ${role.label} » sera définitivement retiré.${userInfo}`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRole(role);
      }
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminRolesApi.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        logHttpError(error, '[admin-roles] chargement des rôles');
        this.errorMessage.set(
          resolveUserFacingError(error, 'generic', '[admin-roles] chargement'),
        );
        this.isLoading.set(false);
      },
    });

    this.adminRolesApi.getAvailableRights().subscribe({
      next: (rights) => this.availableRights.set(rights),
      error: (error: unknown) => {
        logHttpError(error, '[admin-roles] chargement des droits');
      },
    });
  }

  private deleteRole(role: AdminRole): void {
    this.deletingId.set(role.id);

    this.adminRolesApi.deleteRole(role.id).subscribe({
      next: () => {
        this.roles.update((items) => items.filter((item) => item.id !== role.id));
        this.deletingId.set(null);
        void Swal.fire({
          icon: 'success',
          title: 'Rôle supprimé',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.deletingId.set(null);
        void Swal.fire({
          icon: 'error',
          title: 'Suppression impossible',
          text: resolveUserFacingError(error, 'generic'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }
}
