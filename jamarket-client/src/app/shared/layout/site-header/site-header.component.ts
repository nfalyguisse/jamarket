import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCircleUser } from '@lucide/angular';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LucideCircleUser],
  templateUrl: './site-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly navLinks = [
    { label: 'Catalogue', path: '/catalogue' },
    { label: 'Favoris', path: '/favoris' },
    { label: 'Services', path: '/services' },
  ] as const;
}
