import { OPALE_CATALOG } from '../../magic';
import { currentDeploymentLabel } from '../deployment-environment';
import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { CURRENT_RELEASE } from '../releases';
import { UI_VERSION } from '../version';
import { PageBody } from './api';

const COMPONENT_COUNT = OPALE_CATALOG.length;

const HOME_STATS = [
  { value: String(COMPONENT_COUNT), label: 'composants Opale' },
  { value: '2', label: 'thèmes' },
  { value: '1', label: 'matériau optionnel' },
  { value: String(CURRENT_RELEASE.changes.length), label: `changements en v${UI_VERSION}` },
] as const;

const HOME_FEATURES = [
  {
    icon: '▦',
    title: `${COMPONENT_COUNT} composants Opale`,
    description:
      'Un catalogue issu des composants Opale réellement documentés, pour construire une interface cohérente.',
  },
  {
    icon: '☾',
    title: '2 thèmes, 1 matériau',
    description:
      'Clair et sombre sont les deux thèmes ; Liquid Glass est un matériau optionnel, activé composant par composant.',
  },
  {
    icon: '◆',
    title: 'Fiable et mesuré',
    description:
      'Tokens, contrat de couleur exécutable, focus accessible et suite de tests pour garder le socle lisible.',
  },
  {
    icon: '◉',
    title: 'Design tokens',
    description:
      'Palette, typographie, espacements, rayons et matériaux exposés comme une base réutilisable.',
  },
] as const;

export const introductionPage: DocPage = {
  slug: '',
  label: 'Présentation',
  group: 'introduction',
  title: 'Le design system de l’écosystème Opale.',
  lede: 'Opale UI réunit des composants React élégants, accessibles et strictement typés, enrichis du matériau Liquid Glass.',
  render: () => (
    <PageBody>
      <div className="tc-doc-home">
        <p className="tc-doc-home__eyebrow">v{UI_VERSION} — design system React</p>

        <p className="tc-doc-home__intro">
          Opale UI réunit des composants React élégants, accessibles et strictement typés, enrichis
          du matériau Liquid Glass. Concentrez-vous sur vos interfaces, Opale s’occupe du socle.
        </p>

        <div className="tc-doc-home__actions">
          <a className="tc-doc-home__action" href={hrefFor('installation')}>
            Commencer <span aria-hidden="true">›</span>
          </a>
          <a
            className="tc-doc-home__action tc-doc-home__action--secondary"
            href={hrefFor('composants/opale-button')}
          >
            Explorer les composants <span aria-hidden="true">›</span>
          </a>
        </div>

        <nav className="tc-doc-home__entry-grid" aria-label="Explorer Opale UI">
          <a href={hrefFor('utilisation')}>
            <strong>Composer une page</strong>
            <span>Exemples et bonnes pratiques d’intégration ›</span>
          </a>
          <a href={hrefFor('composants/opale-button')}>
            <strong>Choisir un composant</strong>
            <span>Aperçu, propriétés et états ›</span>
          </a>
          <a href={hrefFor('theming')}>
            <strong>Adapter le thème</strong>
            <span>Clair, sombre et Liquid Glass ›</span>
          </a>
        </nav>

        <section className="tc-doc-home__release" aria-labelledby="tc-doc-home-release-title">
          <div className="tc-doc-home__release-head">
            <div className="tc-doc-home__release-meta">
              <span className="tc-doc-home__release-eyebrow">Dernière version</span>
              <span className="tc-doc-home__release-status">{currentDeploymentLabel()}</span>
            </div>
            <time dateTime={CURRENT_RELEASE.publishedAt}>
              {CURRENT_RELEASE.dateLabel} · {CURRENT_RELEASE.changes.length} changements
            </time>
          </div>

          <h2 id="tc-doc-home-release-title">Opale UI {CURRENT_RELEASE.version}</h2>

          <ul>
            {(CURRENT_RELEASE.highlights ?? CURRENT_RELEASE.changes.slice(0, 3)).map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>

          <a className="tc-doc-home__release-link" href={hrefFor('notes-de-versions')}>
            Voir les notes de version <span aria-hidden="true">›</span>
          </a>
        </section>

        <section className="tc-doc-home__features" aria-labelledby="tc-doc-home-features-title">
          <h2 id="tc-doc-home-features-title">Pensé pour les interfaces Opale</h2>
          <div className="tc-doc-home__feature-grid">
            {HOME_FEATURES.map((feature) => (
              <article className="tc-doc-home__feature" key={feature.title}>
                <span className="tc-doc-home__feature-icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <dl className="tc-doc-home__stats" aria-label="Chiffres clés d’Opale UI">
          {HOME_STATS.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>

        <footer className="tc-doc-home__footer">
          <p>Opale UI — design system de l’écosystème Opale.</p>
          <p>Version {UI_VERSION} · Liquid Glass composant par composant</p>
        </footer>
      </div>
    </PageBody>
  ),
};
