
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import {
  LucideGrid2x2,
  LucideList,
  LucideMail,
  LucideMapPin,
  LucidePencil,
  LucideMessageSquare,
} from '@lucide/angular';
import { SiteFooterComponent } from '../../../../shared/layout/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../../../shared/layout/site-header/site-header.component';
import { VehicleCardComponent } from '../../../../shared/ui/vehicle-card/vehicle-card.component';
import type { UserProfile } from '../../../../core/models/user-profile.model';
import type { VehicleCard } from '../../../../core/models/vehicle-card.model';
import { ProfileApiService } from '../../data/profile-api.service';

interface MessagePreview {
  id: number;
  senderName: string;
  preview: string;
  time: string;
  isNew: boolean;
}

const FAVORITES_MOCK: VehicleCard[] = [
  {
    id: 'f1',
    title: 'Porsche 911 Carrera S',
    year: 2023,
    price: 132000,
    mileageKm: 8500,
    transmission: 'Automatique',
    badge: 'Sport',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Porsche 911 Carrera S',
  },
  {
    id: 'f2',
    title: 'BMW M4 Competition',
    year: 2022,
    price: 98500,
    mileageKm: 15200,
    transmission: 'Automatique',
    badge: 'Coupé',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'BMW M4 Competition',
  },
  {
    id: 'f3',
    title: 'Audi RS6 Avant',
    year: 2024,
    price: 145000,
    mileageKm: 3200,
    transmission: 'Automatique',
    badge: 'Break',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Audi RS6 Avant',
  },
];

const MESSAGES_MOCK: MessagePreview[] = [
  {
    id: 1,
    senderName: 'Marc Dubois',
    preview: "La Porsche est disponible pour l'essai demain matin…",
    time: '11h20',
    isNew: true,
  },
  {
    id: 2,
    senderName: 'Garage Precision',
    preview: "Votre rapport d'expertise technique est prêt.",
    time: 'Hier',
    isNew: false,
  },
  {
    id: 3,
    senderName: 'Sophie Martin',
    preview: "Bonjour, j'ai bien reçu les documents.",
    time: 'Lun',
    isNew: false,
  },
];

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent,
    VehicleCardComponent,
    LucideMail,
    LucideMapPin,
    LucidePencil,
    LucideMessageSquare,
    LucideGrid2x2,
    LucideList,
  ],
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly profileApiService = inject(ProfileApiService);
  private readonly router = inject(Router);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly favorites = signal(FAVORITES_MOCK);
  protected readonly messages = signal(MESSAGES_MOCK);
  protected readonly newMessagesCount = signal(
    MESSAGES_MOCK.filter((m) => m.isNew).length,
  );

  ngOnInit(): void {
    this.profileApiService
      .getProfile()
      .pipe(
        catchError(() => {
          void this.router.navigateByUrl('/connexion');
          return EMPTY;
        }),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      });
  }

  protected get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return `${p.name[0]}${p.lastName[0]}`.toUpperCase();
  }
}
