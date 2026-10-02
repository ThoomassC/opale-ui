import { hrefFor } from './doc-model';
import type { InterfaceCopy } from './localization';
import { UI_VERSION } from './version';

/* =============================================================================
   LE PIED DE LA DOCUMENTATION.

   Sobre, comme le reste de la doc (planche de DA) : la marque, une phrase, les
   trois pages d'entrée, puis la version et la licence. Un vrai `<footer>` hors
   de `<main>` : le repère `contentinfo` de la page.
   ========================================================================== */

export interface DocFooterProps {
  /** Les textes de l'interface, dans la langue courante. */
  readonly copy: InterfaceCopy;
}

/** Le pied de page de la vitrine, sous chaque page. */
export function DocFooter({ copy }: DocFooterProps) {
  const links = [
    { href: hrefFor(''), label: copy.home },
    { href: hrefFor('installation'), label: copy.installation },
    { href: hrefFor('notes-de-versions'), label: copy.releaseNotes },
  ];
  return (
    <footer className="tc-doc-footer">
      <div className="tc-doc-footer__inner">
        <div className="tc-doc-footer__brand">
          <p className="tc-doc-footer__name">
            Opale<span>UI</span>
          </p>
          <p className="tc-doc-footer__tagline">{copy.footerTagline}</p>
        </div>
        <nav className="tc-doc-footer__nav" aria-label={copy.footerNavigation}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a className="tc-doc-footer__link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="tc-doc-footer__meta">
          v{UI_VERSION} · {copy.footerLicense}
        </p>
      </div>
    </footer>
  );
}
