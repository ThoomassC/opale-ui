'use client';

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { NavBubble } from './nav-bubble';
import Glass from '../glass/Glass';

import styles from './site-nav.module.css';

export type SiteNavItem = {
  /** Identifiant stable qui place l'unique bulle active. */
  readonly id: string;
  /** La destination du lien. */
  readonly href: string;
  /** Le libellé visible de la destination. */
  readonly label: ReactNode;
};

/**
 * Les destinations par défaut de la barre de navigation compacte.
 * @deprecated Depuis 3.6 — utilisez `items`.
 */
export const DEFAULT_SITE_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'map', href: '/', label: 'Carte' },
  { id: 'countries', href: '/countries', label: 'Pays' },
  { id: 'cities', href: '/cities', label: 'Villes' },
  { id: 'about', href: '/about', label: 'À propos' },
];

export type SiteNavProps = Omit<ComponentPropsWithRef<'header'>, 'children'> & {
  /** La marque, fournie par l'application hôte. Facultative. */
  readonly brand?: ReactNode;
  /**
   * Les destinations principales, pensées pour quatre entrées. Passez-les
   * toujours : le défaut n'est gardé que pour les appels existants.
   */
  readonly items?: readonly SiteNavItem[];
  /** L'identifiant de la destination qui porte la bulle active. */
  readonly value?: string;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  readonly activeItem?: string;
  /** Le nom accessible du repère de navigation. */
  readonly navLabel?: string;
  /**
   * Le crochet de navigation côté client, facultatif. Présent, il reçoit le
   * routage : le composant garde la bulle sur l'entrée cliquée et laisse
   * l'appelant changer de page.
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
 * La barre de navigation du site, réutilisable.
 *
 * Le composant tient le chrome et la surface active animée. Ce qui relève de
 * l'application passe par les emplacements et les données : marque
 * facultative, adresses et libellés.
 */
export function SiteNav({
  brand,
  items = DEFAULT_SITE_NAV_ITEMS,
  value,
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
          <NavBubble items={items} activeKey={value ?? activeItem} onNavigate={onNavigate} />
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
