import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  LucideCheck,
  LucideX,
  LucideMessageSquare,
  LucideUser,
  LucideMegaphone,
  LucideChevronDown,
} from '@lucide/angular';

export interface StatCard {
  label: string;
  value: string;
  badge: string;
  badgePositive: boolean;
}

export interface RecentActivity {
  type: 'ad' | 'user' | 'message';
  title: string;
  subtitle: string;
  time: string;
}

export interface PendingAd {
  id: number;
  vehicle: string;
  model: string;
  seller: string;
  price: number;
  date: string;
}

export interface BarChartEntry {
  day: string;
  value: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    LucideCheck,
    LucideX,
    LucideMessageSquare,
    LucideUser,
    LucideMegaphone,
    LucideChevronDown,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly statCards: StatCard[] = [
    {
      label: 'Total Annonces',
      value: '1 284',
      badge: '+12%',
      badgePositive: true,
    },
    {
      label: 'Ventes du mois',
      value: '42 850 €',
      badge: '+8.4%',
      badgePositive: true,
    },
    {
      label: 'Nouveaux messages',
      value: '156',
      badge: '24 nouveaux',
      badgePositive: true,
    },
  ];

  protected readonly barChartData: BarChartEntry[] = [
    { day: 'Lun', value: 65 },
    { day: 'Mar', value: 48 },
    { day: 'Mer', value: 82 },
    { day: 'Jeu', value: 70 },
    { day: 'Ven', value: 58 },
    { day: 'Sam', value: 90 },
    { day: 'Dim', value: 42 },
  ];

  protected readonly maxBarValue = Math.max(...this.barChartData.map((d) => d.value));

  protected readonly recentActivities: RecentActivity[] = [
    {
      type: 'ad',
      title: 'Nouvelle annonce ajoutée',
      subtitle: 'Porsche 911 (992) Carrera S',
      time: 'Il y a 14 minutes',
    },
    {
      type: 'user',
      title: 'Nouvel utilisateur inscrit',
      subtitle: 'Jean Dupont (Client particulier)',
      time: 'Il y a 1 heure',
    },
    {
      type: 'message',
      title: 'Nouveau message reçu',
      subtitle: "Demande d'essai : Audi RS6",
      time: 'Il y a 2 heures',
    },
  ];

  protected readonly pendingAds: PendingAd[] = [
    {
      id: 1,
      vehicle: 'Mercedes-Benz Classe G',
      model: 'AMG G63 · 2022',
      seller: "Garage de l'Étoile",
      price: 185900,
      date: '22/10/2023',
    },
    {
      id: 2,
      vehicle: 'Tesla Model S Plaid',
      model: 'Dual Motor · 2023',
      seller: 'Electro Drive',
      price: 94000,
      date: '22/10/2023',
    },
  ];

  protected approveAd(id: number): void {
    console.log('Approuver annonce', id);
  }

  protected rejectAd(id: number): void {
    console.log('Rejeter annonce', id);
  }

  protected approveAll(): void {
    console.log('Tout approuver');
  }

  protected getBarHeight(value: number): string {
    return `${(value / this.maxBarValue) * 100}%`;
  }
}
