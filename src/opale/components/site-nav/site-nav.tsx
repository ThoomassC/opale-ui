'use client';

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { NavBubble } from './nav-bubble';
import Glass from '../glass/Glass';

import styles from './site-nav.module.css';

export type SiteNavItem = {
  /** Stable identifier used to position the single active liquid bubble. */
  readonly id: string;
  /** Destination of the anchor. */
  readonly href: string;
  /** Visible label for the destination. */
  readonly label: ReactNode;
};

/** Default destinations for the compact site navigation. */
export const DEFAULT_SITE_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'map', href: '/', label: 'Carte' },
  { id: 'countries', href: '/countries', label: 'Pays' },
  { id: 'cities', href: '/cities', label: 'Villes' },
  { id: 'about', href: '/about', label: 'À propos' },
];

export type SiteNavProps = Omit<ComponentPropsWithoutRef<'header'>, 'children'> & {
  /** Optional brand lock-up supplied by the consuming application. */
  readonly brand?: ReactNode;
  /** Main destinations. The liquid navigation is designed for four items. */
  readonly items?: readonly SiteNavItem[];
  /** Identifier of the destination that owns the active bubble. */
  readonly activeItem?: string;
  /** Accessible name of the navigation landmark. */
  readonly navLabel?: string;
  /**
   * Optional client-side navigation hook. When provided, the component keeps
   * the clicked bubble visible and delegates routing to the consumer.
   */
  readonly onNavigate?: (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Rend la barre dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ELLE EST ORIGINALE, comme tout composant d'Opale : la barre
   * garde son aplat d'accent, qui est opaque et ne dépend d'aucun
   * arrière-plan. Le matériau est une OPTION — et ici elle n'a de sens que
   * posée sur quelque chose : un verre n'a rien à réfracter au-dessus d'une
   * page unie.
   */
  readonly liquidGlass?: boolean;
};

/**
 * Reusable liquid-glass site navigation.
 *
 * The component owns the chrome and the animated active surface. Application
 * concerns stay in slots and data: optional brand, routes and labels.
 */
export function SiteNav({
  brand,
  items = DEFAULT_SITE_NAV_ITEMS,
  activeItem,
  navLabel = 'Navigation principale',
  onNavigate,
  liquidGlass = false,
  className,
  ...headerProps
}: SiteNavProps) {
  const classes = [styles.bar, liquidGlass ? styles.glass : '', className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {brand && <div className={styles.brandZone}>{brand}</div>}

      <div className={styles.inner}>
        <nav aria-label={navLabel}>
          <NavBubble items={items} activeKey={activeItem} onNavigate={onNavigate} />
        </nav>
      </div>
    </>
  );

  /* LE `<header>` RESTE LE MÊME NŒUD DANS LES DEUX MATIÈRES. `Glass` rend la
     balise demandée pour sa couche de CONTENU : le repère de page et les
     attributs que l'appelant lui passe ne se déplacent pas sur une enveloppe
     décorative quand on active le matériau. */
  if (liquidGlass) {
    return (
      <Glass as="header" className={classes} rootClassName={styles.glassRoot} {...headerProps}>
        {content}
      </Glass>
    );
  }

  return (
    <header className={classes} {...headerProps}>
      {content}
    </header>
  );
}
