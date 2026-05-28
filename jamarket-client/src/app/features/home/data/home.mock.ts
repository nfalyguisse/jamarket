import type { VehicleCard } from '../../../core/models/vehicle-card.model';

export const HOME_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDYaLcXSRTNY6IWyMj8-6rXcHeusAzXfzaCuvkQw-X79OJ1o7MY99cFIWYhYmRky1ounXSLbTdqHWyB8z1TKJgGSOdlSVrrqUcupqqhLU3_1KhY9OupUIq4UmC4-ck6HB6HbRD0aidxfm2o2jW_nNChPNyo85iUCMAF5cRNrRuCQ0guwxrSn9AZ58xXaqqxBZOQZuBIQxh2d4XP8RYPNe6VOsyBvVg-NpLEfHVTCFruvKiZHTR4JOLTUrdWrfLz49ZDDEC5gYe0tNo';

export const BENTO_WORKSHOP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB43GGaloupp6dTqLmLtxivgQ6Y0zdA19ZTvHoHzxxiypT04v51UMPQh4pmWq0h_GAo6xI-VY5FulI9rvd64lvM4vFBzCwap18Il7EvtXyvrtWZbNtNnhZew4tejMJ7eppzOrfT9nl9mfdDwucMqyZ8_cwSJgNZ3Fyq51NrUvYT6a_gCavYac1kYwQVlZMjQ3T8GQAEFOctB4e3WB51mRwNCkd3-GZ-luaL7gvWM79s-FFZHtn58xD2Gio5IfiDrD7cKwjFY010Pi4';

export const LATEST_VEHICLES: VehicleCard[] = [
  {
    id: '1',
    title: 'Renault Clio V — Zen',
    price: 14900,
    mileageKm: 42000,
    year: 2021,
    transmission: 'Manuelle',
    badge: 'Nouveau',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGhRegbtOE4zk-erFfgYf19E--ewgEfL0Z40oFDcnrCIqomJ1OKkxKU5kPUdH1K9aY_du7MtHWi7Q3cFDaYSMLSjbcslZT-BzL_tyQpLCOE3y2bu06rWmMQUx6BehGgf2Oby8Neg7S2AfqNxWu_L3vLnAD7fS4rkwHZ5HXEV4KQzPH8sPUpvph8dJich7lZTLe1N6zhKKjjqZzrm0VYWrbkjBe6-Fmmbt8rLDgXlcebljrt5swA83ipdiRiFzFmEoxPBiLU8tSB0',
    imageAlt: 'Renault Clio grise, vue latérale, véhicule d’occasion révisé en garage',
  },
  {
    id: '2',
    title: 'Peugeot 308 — Allure',
    price: 18500,
    mileageKm: 35400,
    year: 2020,
    transmission: 'Automatique',
    badge: 'Nouveau',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9lhgljPaO9LHCZMEK7UInY2V2JeFWKtRQvTjioIPSeQp7SzUjNNWgZmIDXqxgkaPQK-klOR60MMl7JE9Yruv_e_2eSawklhhqMUhXzCCFVy6aUtvl8oJOHo70cIBcpCA1TJDQzAbfR8LIv1OfnNykIipWDh6DUsf1w_or1lLM1JJ_OqDdIqFOFX0tzhNWq8pFWClAN6BxcFaGjUxP5BrOEuD_n4R8t3XOR1Hx2JWsoZk_IbYgS-zBDTMJ8DjILPzSncr9U5QgCtk',
    imageAlt: 'Peugeot 308 bleue en exposition dans un garage automobile',
  },
  {
    id: '3',
    title: 'Citroën C3 — Feel',
    price: 11200,
    mileageKm: 61000,
    year: 2019,
    transmission: 'Manuelle',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvH5VhH2TTSKKbowuEqw-045rn6uh7J8ZMHx5SnHGXTTqBm-b75MUZaSKRWrREM9dkrutGQfqRWAAOcasIaoqckF07QYUJfU0REzQIUZQabjNLcnLoICLkE8eBllM9J7xyEN2rBI9XAIeoUV8dhDeO1uClvdbxdx3cuhat81wYDAQmtBBpT9CfS4vMmd5Fgxgy7wdLHA_BAbM-cm5LR32WlH8efe5hgo6yHLZ-Bub_s6TjtgLKAvSUsJQDAQIctt09aErtBfFGhhc',
    imageAlt: 'Citroën C3 blanche, compacte, idéale pour la ville',
  },
];

export const BRAND_OPTIONS = ['Toutes les marques', 'Renault', 'Peugeot', 'Citroën', 'Volkswagen', 'Toyota'];
