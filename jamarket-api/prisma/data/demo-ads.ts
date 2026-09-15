export type DemoVehicleTypeKey = 'berline' | 'suv' | 'citadine' | 'utilitaire';

export type DemoFuelType = 'essence' | 'diesel' | 'electrique' | 'hybride';

export type DemoAdSeed = {
  /** Clé `Marque:Modèle` alignée sur seedCatalog. */
  modelKey: string;
  vehicleType: DemoVehicleTypeKey;
  kilometer: number;
  year: number;
  doorsNumber: number;
  power: string;
  fuel: DemoFuelType;
  color: string;
  price: number;
  label: string;
  description: string;
};

/**
 * Stock démo « petit garage » : occasions 1 090–11 990 €, sans photos.
 * Les images seront ajoutées à la main depuis le back-office.
 */
export const DEMO_ADS: DemoAdSeed[] = [
  {
    modelKey: 'Renault:Twingo',
    vehicleType: 'citadine',
    kilometer: 198000,
    year: 2011,
    doorsNumber: 3,
    power: '75ch',
    fuel: 'essence',
    color: 'Rouge',
    price: 1090,
    label: 'Renault Twingo 2011 — Idéale premier véhicule',
    description:
      'Petite citadine économique, parfaite pour la ville. Contrôle technique en cours de validité, révision effectuée à la vente. Traces d’usage normales pour l’âge et le kilométrage.',
  },
  {
    modelKey: 'Citroën:C1',
    vehicleType: 'citadine',
    kilometer: 98000,
    year: 2013,
    doorsNumber: 5,
    power: '68ch',
    fuel: 'essence',
    color: 'Blanc',
    price: 3990,
    label: 'Citroën C1 2013 — Faible consommation',
    description:
      'Voiture de ville facile à garer, entretien suivi en garage. Carnet présent, pneus en bon état. Idéale pour les trajets quotidiens et le stationnement en centre-ville.',
  },
  {
    modelKey: 'Peugeot:207',
    vehicleType: 'citadine',
    kilometer: 168000,
    year: 2011,
    doorsNumber: 5,
    power: '92ch',
    fuel: 'diesel',
    color: 'Gris',
    price: 3290,
    label: 'Peugeot 207 1.4 HDi — Économique au quotidien',
    description:
      'Diesel sobre, bien adaptée aux trajets domicile-travail. Distribution faite, CT ok. Quelques marques de carrosserie cohérentes avec l’âge, mécanique saine.',
  },
  {
    modelKey: 'Fiat:Panda',
    vehicleType: 'citadine',
    kilometer: 89000,
    year: 2015,
    doorsNumber: 5,
    power: '69ch',
    fuel: 'essence',
    color: 'Bleu',
    price: 5490,
    label: 'Fiat Panda 2015 — Pratique et facile',
    description:
      'Citadine haute, pratique pour monter et descendre. Entretien régulier, intérieur propre. Un bon compagnon de tous les jours, sans surprise.',
  },
  {
    modelKey: 'Opel:Corsa',
    vehicleType: 'citadine',
    kilometer: 124000,
    year: 2014,
    doorsNumber: 5,
    power: '90ch',
    fuel: 'essence',
    color: 'Noir',
    price: 4790,
    label: 'Opel Corsa 2014 — Compacte et soignée',
    description:
      'Corsa cinq portes, climatisation, direction assistée. Révision faite avant mise en vente. Véhicule contrôlé à l’atelier, prêt à partir.',
  },
  {
    modelKey: 'Renault:Clio',
    vehicleType: 'citadine',
    kilometer: 134000,
    year: 2016,
    doorsNumber: 5,
    power: '90ch',
    fuel: 'diesel',
    color: 'Blanc',
    price: 7490,
    label: 'Renault Clio 4 dCi — Trajets quotidiens',
    description:
      'Clio diesel sobre, entretien suivi. Bluetooth, régulateur, climatisation. Contrôle technique valide, pneus récents. Une valeur sûre pour un usage régulier.',
  },
  {
    modelKey: 'Peugeot:208',
    vehicleType: 'citadine',
    kilometer: 121000,
    year: 2015,
    doorsNumber: 5,
    power: '82ch',
    fuel: 'essence',
    color: 'Gris',
    price: 7990,
    label: 'Peugeot 208 2015 — Confortable en ville',
    description:
      '208 essence souple, écran tactile, radar de recul. Carnet à jour, vidange récente. Habitacle bien tenu, véhicule passé au contrôle du garage.',
  },
  {
    modelKey: 'Volkswagen:Polo',
    vehicleType: 'citadine',
    kilometer: 142000,
    year: 2014,
    doorsNumber: 5,
    power: '75ch',
    fuel: 'diesel',
    color: 'Noir',
    price: 8490,
    label: 'Volkswagen Polo 1.4 TDI — Fiable et sobre',
    description:
      'Polo diesel reconnue pour sa robustesse. Entretien documenté, CT ok. Idéale pour enchaîner ville et route sans trop consommer.',
  },
  {
    modelKey: 'Toyota:Yaris',
    vehicleType: 'citadine',
    kilometer: 156000,
    year: 2014,
    doorsNumber: 5,
    power: '69ch',
    fuel: 'essence',
    color: 'Rouge',
    price: 6790,
    label: 'Toyota Yaris 2014 — Réputation de fiabilité',
    description:
      'Yaris essence, entretien simple et régulier. Véhicule de confiance, bien connu de l’atelier. Contrôle technique en cours, révision à jour.',
  },
  {
    modelKey: 'Ford:Fiesta',
    vehicleType: 'citadine',
    kilometer: 108000,
    year: 2016,
    doorsNumber: 5,
    power: '82ch',
    fuel: 'essence',
    color: 'Bleu',
    price: 7290,
    label: 'Ford Fiesta 2016 — Agréable à conduire',
    description:
      'Fiesta vive et facile à vivre. Climatisation, Bluetooth, direction précise. Kilométrage correct, entretien fait. Un bon choix pour un usage mixte.',
  },
  {
    modelKey: 'Renault:Mégane',
    vehicleType: 'berline',
    kilometer: 178000,
    year: 2015,
    doorsNumber: 5,
    power: '110ch',
    fuel: 'diesel',
    color: 'Gris',
    price: 6490,
    label: 'Renault Mégane 3 dCi — Familiale sobre',
    description:
      'Berline spacieuse, coffre généreux, diesel pour les longs trajets. Distribution effectuée, CT valide. Entretien garage, prête à reprendre la route.',
  },
  {
    modelKey: 'Peugeot:308',
    vehicleType: 'berline',
    kilometer: 165000,
    year: 2014,
    doorsNumber: 5,
    power: '115ch',
    fuel: 'diesel',
    color: 'Blanc',
    price: 6990,
    label: 'Peugeot 308 1.6 HDi — Confort et volume',
    description:
      '308 diesel, sièges confortables, GPS d’origine. Révision récente, carnet présent. Quelques traces d’usage, mécanique vérifiée à l’atelier.',
  },
  {
    modelKey: 'Citroën:C4',
    vehicleType: 'berline',
    kilometer: 139000,
    year: 2016,
    doorsNumber: 5,
    power: '120ch',
    fuel: 'diesel',
    color: 'Bleu',
    price: 8490,
    label: 'Citroën C4 2016 — Polyvalente et soignée',
    description:
      'C4 diesel, suspension confortable, régulateur de vitesse. Entretien suivi, pneus en bon état. Un véhicule de tous les jours, simple et rassurant.',
  },
  {
    modelKey: 'Volkswagen:Golf',
    vehicleType: 'berline',
    kilometer: 189000,
    year: 2013,
    doorsNumber: 5,
    power: '105ch',
    fuel: 'diesel',
    color: 'Noir',
    price: 8990,
    label: 'Volkswagen Golf 7 TDI — Valeur sûre',
    description:
      'Golf diesel, finition soignée, tenue de route rassurante. Historique d’entretien, CT ok. Kilométrage élevé mais véhicule entretenu et contrôlé.',
  },
  {
    modelKey: 'Ford:Focus',
    vehicleType: 'berline',
    kilometer: 151000,
    year: 2015,
    doorsNumber: 5,
    power: '120ch',
    fuel: 'diesel',
    color: 'Gris',
    price: 7790,
    label: 'Ford Focus 2015 — Route et famille',
    description:
      'Focus diesel, bon équilibre confort / consommation. Radar de recul, climatisation auto. Révision faite avant la vente, contrôle technique valide.',
  },
  {
    modelKey: 'Renault:Captur',
    vehicleType: 'suv',
    kilometer: 128000,
    year: 2016,
    doorsNumber: 5,
    power: '90ch',
    fuel: 'essence',
    color: 'Orange',
    price: 9990,
    label: 'Renault Captur 2016 — Compact et surélevé',
    description:
      'SUV compact facile à vivre, position de conduite haute. Entretien régulier, intérieur propre. Idéal pour la ville comme pour les week-ends.',
  },
  {
    modelKey: 'Dacia:Duster',
    vehicleType: 'suv',
    kilometer: 145000,
    year: 2017,
    doorsNumber: 5,
    power: '110ch',
    fuel: 'diesel',
    color: 'Blanc',
    price: 11990,
    label: 'Dacia Duster 2017 — Robuste et spacieux',
    description:
      'Duster diesel, garde au sol rassurante, coffre généreux. Entretien simple, pièces abordables. Contrôle technique en cours, révision à jour. Un SUV sans chichis.',
  },
  {
    modelKey: 'Peugeot:2008',
    vehicleType: 'suv',
    kilometer: 132000,
    year: 2015,
    doorsNumber: 5,
    power: '120ch',
    fuel: 'diesel',
    color: 'Gris',
    price: 9490,
    label: 'Peugeot 2008 2015 — SUV de proximité',
    description:
      '2008 diesel, pratique au quotidien, bon confort de suspension. Carnet à jour, vidange récente. Véhicule inspecté à l’atelier avant mise en ligne.',
  },
  {
    modelKey: 'Renault:Kangoo',
    vehicleType: 'utilitaire',
    kilometer: 162000,
    year: 2014,
    doorsNumber: 5,
    power: '90ch',
    fuel: 'diesel',
    color: 'Blanc',
    price: 5990,
    label: 'Renault Kangoo 2014 — Utile et polyvalent',
    description:
      'Kangoo diesel, volume de chargement généreux, sièges arrière. Idéal artisan ou famille. Entretien suivi, CT valide. Contrôlé et prêt à servir.',
  },
  {
    modelKey: 'Citroën:Berlingo',
    vehicleType: 'utilitaire',
    kilometer: 187000,
    year: 2013,
    doorsNumber: 5,
    power: '90ch',
    fuel: 'diesel',
    color: 'Gris',
    price: 4490,
    label: 'Citroën Berlingo 2013 — Volume et simplicité',
    description:
      'Berlingo diesel, pratique pour transporter et se déplacer. Usure cohérente avec le kilométrage, mécanique vérifiée. Contrôle technique en cours de validité.',
  },
];
