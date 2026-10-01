import type { SiteNavItem } from './site-nav';

/**
 * Les destinations par défaut de la barre de navigation compacte.
 * @deprecated Depuis 2.6 — utilisez `items`.
 */
export const DEFAULT_SITE_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'map', href: '/', label: 'Carte' },
  { id: 'countries', href: '/countries', label: 'Pays' },
  { id: 'cities', href: '/cities', label: 'Villes' },
  { id: 'about', href: '/about', label: 'À propos' },
];
