import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideGlobe, LucideShare2 } from '@lucide/angular';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, LucideGlobe, LucideShare2],
  templateUrl: './site-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly usefulLinks = [
    { label: 'Catalogue', path: '/catalogue' },
    { label: 'Services', path: '/services' },
    { label: 'À propos', path: '/a-propos' },
    { label: 'Contact', path: '/contact' },
  ] as const;

  protected readonly legalLinks = [
    { label: 'Mentions légales', path: '/mentions-legales' },
    { label: 'Confidentialité', path: '/confidentialite' },
    { label: 'Notre garage', path: '/a-propos' },
  ] as const;
}
