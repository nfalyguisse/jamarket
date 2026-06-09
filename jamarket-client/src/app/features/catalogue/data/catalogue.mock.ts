import type { VehicleCard } from '@core/models/vehicle-card.model';

export const CATALOGUE_VEHICLES: VehicleCard[] = [
  {
    id: '1',
    title: 'Renault Clio V — Zen',
    price: 14900,
    mileageKm: 42000,
    year: 2021,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Renault Clio grise, vue latérale',
  },
  {
    id: '2',
    title: 'Peugeot 308 — Allure',
    price: 18500,
    mileageKm: 35400,
    year: 2020,
    transmission: 'Automatique',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'Peugeot 308 bleue en exposition',
  },
  {
    id: '3',
    title: 'Citroën C3 — Feel',
    price: 11200,
    mileageKm: 61000,
    year: 2019,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Citroën C3 blanche compacte',
  },
  {
    id: '4',
    title: 'Volkswagen Golf VIII — Life',
    price: 22400,
    mileageKm: 28500,
    year: 2021,
    transmission: 'Automatique',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Volkswagen Golf grise',
  },
  {
    id: '5',
    title: 'Toyota Yaris Hybrid — Design',
    price: 16800,
    mileageKm: 39200,
    year: 2020,
    transmission: 'Automatique',
    fuelType: 'Hybride',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'Toyota Yaris hybride blanche',
  },
  {
    id: '6',
    title: 'Dacia Sandero — Essential',
    price: 9900,
    mileageKm: 52000,
    year: 2018,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Dacia Sandero rouge',
  },
  {
    id: '7',
    title: 'Peugeot 2008 — Active',
    price: 19500,
    mileageKm: 31800,
    year: 2021,
    transmission: 'Automatique',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Peugeot 2008 SUV orange',
  },
  {
    id: '8',
    title: 'Renault Captur — Intens',
    price: 17200,
    mileageKm: 44500,
    year: 2019,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'Renault Captur bleu',
  },
  {
    id: '9',
    title: 'Fiat 500 — Lounge',
    price: 10900,
    mileageKm: 58000,
    year: 2017,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Fiat 500 blanche',
  },
  {
    id: '10',
    title: 'Opel Corsa — Edition',
    price: 12400,
    mileageKm: 47200,
    year: 2019,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Opel Corsa grise',
  },
  {
    id: '11',
    title: 'Hyundai i20 — Creative',
    price: 13800,
    mileageKm: 33600,
    year: 2020,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'Hyundai i20 rouge',
  },
  {
    id: '12',
    title: 'Nissan Leaf — Acenta',
    price: 15900,
    mileageKm: 41000,
    year: 2019,
    transmission: 'Automatique',
    fuelType: 'Électrique',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Nissan Leaf électrique bleue',
  },
];

export const CATALOGUE_SORT_OPTIONS = [
  { value: 'latest', label: 'Dernières arrivées' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'mileage-asc', label: 'Kilométrage croissant' },
] as const;

export type CatalogueSortValue = (typeof CATALOGUE_SORT_OPTIONS)[number]['value'];

export const CATALOGUE_PAGE_SIZE = 9;
