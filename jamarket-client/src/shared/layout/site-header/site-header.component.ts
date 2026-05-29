import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCircleUser } from '@lucide/angular';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LucideCircleUser],
  templateUrl: './site-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly authState = inject(AuthStateService);

  protected readonly navLinks = [
    { label: 'Catalogue', path: '/catalogue' },
    { label: 'Services', path: '/services' },
  ] as const;
}
