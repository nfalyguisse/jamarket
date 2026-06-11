import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { AdImage } from '@core/models/ad-detail.model';

const VISIBLE_THUMBNAILS = 4;

@Component({
  selector: 'app-ad-image-gallery',
  templateUrl: './ad-image-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdImageGalleryComponent {
  readonly images = input.required<AdImage[]>();
  readonly altPrefix = input('Photo du véhicule');

  protected readonly selectedIndex = signal(0);

  protected readonly selectedImage = computed(() => {
    const imgs = this.images();
    const index = this.selectedIndex();
    return imgs[index] ?? imgs[0] ?? null;
  });

  protected readonly visibleThumbnails = computed(() =>
    this.images().slice(0, VISIBLE_THUMBNAILS),
  );

  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.images().length - VISIBLE_THUMBNAILS),
  );

  protected selectImage(index: number): void {
    if (index >= 0 && index < this.images().length) {
      this.selectedIndex.set(index);
    }
  }

  protected onThumbnailClick(index: number): void {
    if (this.isLastVisibleThumbnail(index) && this.hiddenCount() > 0) {
      this.selectImage(VISIBLE_THUMBNAILS);
      return;
    }
    this.selectImage(index);
  }

  protected isLastVisibleThumbnail(index: number): boolean {
    return index === VISIBLE_THUMBNAILS - 1 && this.hiddenCount() > 0;
  }
}
