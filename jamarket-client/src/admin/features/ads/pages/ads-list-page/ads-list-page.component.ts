import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-ads-list-page',
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900">Annonces</h1>
      <p class="mt-2 text-gray-500">Cette section sera implémentée prochainement.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsListPageComponent {}
