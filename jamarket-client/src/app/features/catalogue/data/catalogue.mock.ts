export const CATALOGUE_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Dernières arrivées' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'mileage_asc', label: 'Kilométrage croissant' },
] as const;

export type CatalogueSortValue = (typeof CATALOGUE_SORT_OPTIONS)[number]['value'];

export const CATALOGUE_DEFAULT_SORT: CatalogueSortValue = 'date_desc';

export const CATALOGUE_PAGE_SIZE = 9;
