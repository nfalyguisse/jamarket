import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  LucideArrowLeft,
  LucideImagePlus,
  LucideLoader2,
  LucidePlus,
  LucideSave,
  LucideTrash2,
  LucideUpload,
} from '@lucide/angular';
import { AdminAdsApiService } from '@admin/data/admin-ads-api.service';
import { AdminCatalogApiService } from '@admin/data/admin-catalog-api.service';
import { AdminUploadApiService } from '@admin/data/admin-upload-api.service';
import type { AdminAdImage, AdminFormReferences } from '@core/models/admin-ad.model';
import type { FuelType } from '@core/models/ad-detail.model';
import { resolveMediaUrl } from '@core/utils/media-url.util';
import { logHttpError, resolveUserFacingError } from '@core/utils/http-error.util';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

interface PendingImage {
  file: File;
  previewUrl: string;
}

const FUEL_LABELS: Record<FuelType, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  electrique: 'Électrique',
  hybride: 'Hybride',
};

@Component({
  selector: 'app-ad-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideImagePlus,
    LucideLoader2,
    LucidePlus,
    LucideSave,
    LucideTrash2,
    LucideUpload,
  ],
  templateUrl: './ad-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly adminAdsApi = inject(AdminAdsApiService);
  private readonly catalogApi = inject(AdminCatalogApiService);
  private readonly uploadApi = inject(AdminUploadApiService);

  protected readonly isEditMode = signal(false);
  protected readonly adId = signal<number | null>(null);
  protected readonly vehiculeId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal('');
  protected readonly references = signal<AdminFormReferences>({
    brands: [],
    models: [],
    vehiculeTypes: [],
    fuelTypes: ['essence', 'diesel', 'electrique', 'hybride'],
  });
  protected readonly existingImages = signal<AdminAdImage[]>([]);
  protected readonly pendingImages = signal<PendingImage[]>([]);
  protected readonly deletingImageId = signal<number | null>(null);
  protected readonly selectedBrandId = signal(0);
  protected readonly validationError = signal('');
  protected readonly isAddingReference = signal(false);

  protected readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [null as number | null, [Validators.required, Validators.min(1)]],
    isActive: [true],
    brandId: [null as number | null, [Validators.required, Validators.min(1)]],
    modelId: [null as number | null, [Validators.required, Validators.min(1)]],
    kilometer: [null as number | null, [Validators.required, Validators.min(0)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
    doorsNumber: [5, [Validators.required, Validators.min(1)]],
    power: ['', [Validators.required]],
    fuel: ['essence' as FuelType, [Validators.required]],
    color: ['', [Validators.required]],
    vehiculeTypeId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly filteredModels = computed(() => {
    const brandId = this.selectedBrandId();
    if (!brandId) {
      return [];
    }
    return this.references().models.filter((model) => model.brandId === brandId);
  });

  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Modifier l’annonce' : 'Nouvelle annonce',
  );

  protected readonly totalImagesCount = computed(
    () => this.existingImages().length + this.pendingImages().length,
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const isEdit = !!idParam;
    this.isEditMode.set(isEdit);

    if (isEdit && idParam) {
      this.adId.set(Number(idParam));
      this.loadAd(Number(idParam));
    } else {
      this.loadReferences();
    }
  }

  protected fuelLabel(fuel: FuelType): string {
    return FUEL_LABELS[fuel];
  }

  protected resolveImage(url: string): string {
    return resolveMediaUrl(url);
  }

  protected onBrandChange(): void {
    const brandId = Number(this.form.controls.brandId.value);
    this.selectedBrandId.set(brandId);
    this.form.controls.modelId.setValue(null);
  }

  protected addBrand(): void {
    void this.promptAndCreateReference('brand');
  }

  protected addModel(): void {
    if (!this.selectedBrandId()) {
      void Swal.fire({
        icon: 'info',
        title: 'Marque requise',
        text: 'Sélectionnez ou ajoutez une marque avant de créer un modèle.',
        confirmButtonColor: '#059669',
      });
      return;
    }
    void this.promptAndCreateReference('model');
  }

  protected addVehiculeType(): void {
    void this.promptAndCreateReference('vehiculeType');
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.invalid;
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    const remainingSlots = 10 - this.totalImagesCount();
    if (remainingSlots <= 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Limite atteinte',
        text: 'Vous pouvez ajouter jusqu’à 10 photos par véhicule.',
        confirmButtonColor: '#006b5e',
      });
      input.value = '';
      return;
    }

    const accepted = Array.from(files).slice(0, remainingSlots);
    const newPending = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.pendingImages.update((items) => [...items, ...newPending]);
    input.value = '';
  }

  protected removePendingImage(index: number): void {
    this.pendingImages.update((items) => {
      const next = [...items];
      const [removed] = next.splice(index, 1);
      if (removed && isPlatformBrowser(this.platformId)) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  }

  protected removeExistingImage(image: AdminAdImage): void {
    const vehiculeId = this.vehiculeId();
    if (!vehiculeId) {
      return;
    }

    this.deletingImageId.set(image.id);
    this.uploadApi.deleteImage(vehiculeId, image.id).subscribe({
      next: () => {
        this.existingImages.update((items) => items.filter((item) => item.id !== image.id));
        this.deletingImageId.set(null);
      },
      error: (error: unknown) => {
        this.deletingImageId.set(null);
        void Swal.fire({
          icon: 'error',
          title: 'Suppression impossible',
          text: resolveUserFacingError(error, 'ad-form'),
          confirmButtonColor: '#006b5e',
        });
      },
    });
  }

  protected submit(): void {
    this.saveAd(true);
  }

  protected saveDraft(): void {
    this.saveAd(false);
  }

  private saveAd(publish: boolean): void {
    this.validationError.set('');

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      this.validationError.set(this.buildValidationMessage());
      return;
    }

    this.serverError.set('');
    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.updateAd();
    } else {
      this.createAd(publish);
    }
  }

  private buildValidationMessage(): string {
    const { controls } = this.form;

    if (controls.label.invalid) return 'Le titre de l’annonce est obligatoire.';
    if (controls.description.invalid) {
      return 'La description doit contenir au moins 20 caractères.';
    }
    if (controls.price.invalid) return 'Indiquez un prix supérieur à 0 €.';
    if (controls.brandId.invalid) return 'Sélectionnez une marque.';
    if (controls.modelId.invalid) return 'Sélectionnez un modèle.';
    if (controls.vehiculeTypeId.invalid) return 'Sélectionnez un type de véhicule.';
    if (controls.kilometer.invalid) return 'Indiquez un kilométrage valide.';
    if (controls.year.invalid) return 'Indiquez une année valide.';
    if (controls.doorsNumber.invalid) return 'Indiquez le nombre de portes.';
    if (controls.power.invalid) return 'Indiquez la puissance du véhicule.';
    if (controls.color.invalid) return 'Indiquez la couleur du véhicule.';

    return 'Veuillez corriger les champs en surbrillance.';
  }

  private loadReferences(): void {
    this.adminAdsApi.getFormReferences().subscribe({
      next: (refs) => {
        this.references.set(refs);
      },
      error: (error: unknown) => {
        logHttpError(error, '[admin-ad-form] chargement des références');
      },
    });
  }

  private loadAd(id: number): void {
    this.isLoading.set(true);

    this.adminAdsApi.getAd(id).subscribe({
      next: (ad) => {
        this.vehiculeId.set(ad.vehicule.id);
        this.existingImages.set(ad.vehicule.images);
        this.form.patchValue({
          label: ad.label,
          description: ad.description,
          price: ad.price,
          isActive: ad.isActive,
          brandId: ad.vehicule.brandId,
          modelId: ad.vehicule.modelId,
          kilometer: ad.vehicule.kilometer,
          year: ad.vehicule.year,
          doorsNumber: ad.vehicule.doorsNumber,
          power: ad.vehicule.power,
          fuel: ad.vehicule.fuel,
          color: ad.vehicule.color,
          vehiculeTypeId: ad.vehicule.vehiculeTypeId,
        });
        this.selectedBrandId.set(ad.vehicule.brandId);
        this.loadReferences();
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        logHttpError(error, '[admin-ad-form] chargement annonce');
        this.serverError.set(resolveUserFacingError(error, 'ad-form'));
        this.isLoading.set(false);
      },
    });
  }

  private createAd(publish: boolean): void {
    const raw = this.getValidatedFormValues();
    const pending = this.pendingImages();

    this.adminAdsApi
      .createVehicule({
        modelId: raw.modelId,
        kilometer: raw.kilometer,
        year: raw.year,
        doorsNumber: raw.doorsNumber,
        power: raw.power,
        fuel: raw.fuel,
        color: raw.color,
        vehiculeTypeId: raw.vehiculeTypeId,
      })
      .pipe(
        switchMap(({ id: vehiculeId }) => {
          const createAd$ = this.adminAdsApi.createAd({
            label: raw.label,
            description: raw.description,
            price: raw.price,
            vehiculeId,
            isActive: publish,
          });

          if (pending.length === 0) {
            return createAd$;
          }

          return this.uploadApi
            .uploadImages(
              vehiculeId,
              pending.map((item) => item.file),
            )
            .pipe(switchMap(() => createAd$));
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () =>
          this.onSuccess(
            publish
              ? 'Annonce publiée avec succès.'
              : 'Brouillon enregistré. L’annonce n’est pas visible en ligne.',
          ),
        error: (error: unknown) => {
          this.serverError.set(resolveUserFacingError(error, 'ad-form'));
        },
      });
  }

  private updateAd(): void {
    const adId = this.adId();
    const vehiculeId = this.vehiculeId();
    if (!adId || !vehiculeId) {
      this.isSubmitting.set(false);
      return;
    }

    const raw = this.getValidatedFormValues();
    const pending = this.pendingImages();

    const updateRequests = [
      this.adminAdsApi.updateVehicule(vehiculeId, {
        modelId: raw.modelId,
        kilometer: raw.kilometer,
        year: raw.year,
        doorsNumber: raw.doorsNumber,
        power: raw.power,
        fuel: raw.fuel,
        color: raw.color,
        vehiculeTypeId: raw.vehiculeTypeId,
      }),
      this.adminAdsApi.updateAd(adId, {
        label: raw.label,
        description: raw.description,
        price: raw.price,
        isActive: raw.isActive,
      }),
    ];

    forkJoin(updateRequests)
      .pipe(
        switchMap(() => {
          if (pending.length === 0) {
            return of(null);
          }
          return this.uploadApi.uploadImages(
            vehiculeId,
            pending.map((item) => item.file),
          );
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => this.onSuccess('Annonce mise à jour avec succès.'),
        error: (error: unknown) => {
          this.serverError.set(resolveUserFacingError(error, 'ad-form'));
        },
      });
  }

  private onSuccess(message: string): void {
    if (isPlatformBrowser(this.platformId)) {
      void Swal.fire({
        icon: 'success',
        title: message,
        confirmButtonColor: '#006b5e',
        timer: 2500,
        timerProgressBar: true,
      });
    }
    void this.router.navigateByUrl('/admin/annonces');
  }

  private getValidatedFormValues() {
    const raw = this.form.getRawValue();

    return {
      label: raw.label!.trim(),
      description: raw.description!.trim(),
      price: raw.price!,
      isActive: raw.isActive ?? true,
      modelId: raw.modelId!,
      kilometer: raw.kilometer!,
      year: raw.year!,
      doorsNumber: raw.doorsNumber!,
      power: raw.power!.trim(),
      fuel: raw.fuel!,
      color: raw.color!.trim(),
      vehiculeTypeId: raw.vehiculeTypeId!,
    };
  }

  private async promptAndCreateReference(
    kind: 'brand' | 'model' | 'vehiculeType',
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isAddingReference()) {
      return;
    }

    const config = {
      brand: {
        title: 'Nouvelle marque',
        inputLabel: 'Nom de la marque',
        placeholder: 'Ex. Citroën',
      },
      model: {
        title: 'Nouveau modèle',
        inputLabel: 'Nom du modèle',
        placeholder: 'Ex. C3 Aircross',
      },
      vehiculeType: {
        title: 'Nouveau type de véhicule',
        inputLabel: 'Nom du type',
        placeholder: 'Ex. Break',
      },
    }[kind];

    const result = await Swal.fire({
      title: config.title,
      input: 'text',
      inputLabel: config.inputLabel,
      inputPlaceholder: config.placeholder,
      showCancelButton: true,
      confirmButtonText: 'Ajouter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => (!value?.trim() ? 'Ce champ est obligatoire' : undefined),
    });

    if (!result.isConfirmed || !result.value?.trim()) {
      return;
    }

    const label = result.value.trim();
    this.isAddingReference.set(true);

    const request$ =
      kind === 'brand'
        ? this.catalogApi.createBrand(label)
        : kind === 'model'
          ? this.catalogApi.createModel(label, this.selectedBrandId())
          : this.catalogApi.createVehiculeType(label);

    request$.subscribe({
      next: (created) => {
        this.isAddingReference.set(false);

        if (kind === 'brand') {
          this.upsertBrand(created as { id: number; label: string });
        } else if (kind === 'model') {
          this.upsertModel(created as { id: number; label: string; brandId: number });
        } else {
          this.upsertVehiculeType(created as { id: number; label: string });
        }

        void Swal.fire({
          icon: 'success',
          title: 'Élément ajouté',
          text: `"${created.label}" est maintenant sélectionné.`,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (error: unknown) => {
        this.isAddingReference.set(false);
        void Swal.fire({
          icon: 'error',
          title: 'Ajout impossible',
          text: resolveUserFacingError(error, 'ad-form'),
          confirmButtonColor: '#059669',
        });
      },
    });
  }

  private upsertBrand(brand: { id: number; label: string }): void {
    this.references.update((refs) => ({
      ...refs,
      brands: this.sortByLabel([...refs.brands.filter((item) => item.id !== brand.id), brand]),
    }));
    this.form.controls.brandId.setValue(brand.id);
    this.selectedBrandId.set(brand.id);
    this.form.controls.modelId.setValue(null);
  }

  private upsertModel(model: { id: number; label: string; brandId: number }): void {
    this.references.update((refs) => ({
      ...refs,
      models: this.sortByLabel([...refs.models.filter((item) => item.id !== model.id), model]),
    }));
    this.form.controls.modelId.setValue(model.id);
  }

  private upsertVehiculeType(type: { id: number; label: string }): void {
    this.references.update((refs) => ({
      ...refs,
      vehiculeTypes: this.sortByLabel([
        ...refs.vehiculeTypes.filter((item) => item.id !== type.id),
        type,
      ]),
    }));
    this.form.controls.vehiculeTypeId.setValue(type.id);
  }

  private sortByLabel<T extends { label: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }
}
