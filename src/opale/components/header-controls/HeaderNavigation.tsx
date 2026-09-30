import { forwardRef, type MouseEvent, type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './HeaderControls.module.css';

export interface HeaderNavigationLink {
  readonly id: string;
  readonly href: string;
  readonly label: ReactNode;
  readonly target?: string;
  readonly rel?: string;
}

export interface HeaderNavigationProps {
  readonly links: readonly HeaderNavigationLink[];
  readonly activeId?: string;
  readonly ariaLabel: string;
  readonly onNavigate?: (link: HeaderNavigationLink, event: MouseEvent<HTMLAnchorElement>) => void;
  readonly className?: string;
  readonly id?: string;
  readonly hidden?: boolean;
  readonly children?: ReactNode;
  /** Conserve les classes historiques du header de la vitrine. */
  readonly siteClassNames?: boolean;
}

/** Les mêmes onglets de navigation pour le header Opale et PageScaffold. */
export const HeaderNavigation = forwardRef<HTMLElement, HeaderNavigationProps>(
  (
    {
      links,
      activeId,
      ariaLabel,
      onNavigate,
      className,
      id,
      hidden,
      children,
      siteClassNames = false,
    },
    ref,
  ) => (
    <nav ref={ref} className={className} id={id} aria-label={ariaLabel} hidden={hidden}>
      {children !== undefined
        ? children
        : links.map((link) => (
            <a
              key={link.id}
              className={clsx(siteClassNames && 'tc-doc-topbar__tab', styles.tab)}
              href={link.href}
              target={link.target}
              rel={link.rel}
              aria-current={link.id === activeId ? 'page' : undefined}
              onClick={(event) => onNavigate?.(link, event)}
            >
              {link.label}
            </a>
          ))}
    </nav>
  ),
);

HeaderNavigation.displayName = 'HeaderNavigation';
