import type { DocPage } from '../doc-model';
import { UI_VERSION } from '../version';
import { CURRENT_RELEASE, RELEASES } from '../releases';
import { PageBody } from './api';

const CURRENT_SOURCE_LABEL = 'Voir le code de la version courante';

export const notesVersionsPage: DocPage = {
  slug: 'notes-de-versions',
  label: 'Notes de versions',
  group: 'introduction',
  title: 'Notes de versions',
  lede: (
    <>
      L’historique d’Opale, version par version. Chaque entrée décrit les changements et donne accès
      à un <strong>snapshot utilisable</strong> ainsi qu’au code qui l’a produit.
    </>
  ),
  render: () => (
    <PageBody>
      <div className="tc-doc-release-callout">
        <div>
          <p className="tc-doc-release-callout__eyebrow">Version courante</p>
          <p className="tc-doc-release-callout__version">v{UI_VERSION}</p>
        </div>
        <p className="tc-doc-release-callout__text">
          Tu peux revenir à n’importe quel état sans perdre la vitrine actuelle. Les archives
          historiques sont servies sous <code>/versions/vX.Y.Z/</code> et conservent leurs propres
          routes et leur propre API documentée.
        </p>
      </div>

      <div className="tc-doc-release-list" aria-label="Historique des versions">
        {RELEASES.map((release) => {
          const isCurrent = release.version === CURRENT_RELEASE.version;

          return (
            <article
              className={`tc-doc-release${isCurrent ? ' tc-doc-release--current' : ''}`}
              key={release.version}
            >
              <header className="tc-doc-release__header">
                <div className="tc-doc-release__meta">
                  <span className="tc-doc-release__version">v{release.version}</span>
                  {isCurrent ? (
                    <span className="tc-doc-release__status">Version courante</span>
                  ) : null}
                  {release.breaking ? (
                    <span className="tc-doc-release__status tc-doc-release__status--breaking">
                      Changements incompatibles
                    </span>
                  ) : null}
                </div>
                <time className="tc-doc-release__date" dateTime={release.publishedAt}>
                  {release.dateLabel}
                </time>
              </header>

              <h2 className="tc-doc-release__title">{release.summary}</h2>

              {release.sections ? (
                <div className="tc-doc-release__sections">
                  {release.sections.map((section) => (
                    <section className="tc-doc-release__section" key={section.title}>
                      <h3>{section.title}</h3>
                      <ul className="tc-doc-checklist tc-doc-release__changes">
                        {section.changes.map((change) => (
                          <li key={change}>{change}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <ul className="tc-doc-checklist tc-doc-release__changes">
                  {release.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              )}

              {release.migration ? (
                <details className="tc-doc-release__migration">
                  <summary>Exemples de migration depuis la {release.migration.fromVersion}</summary>
                  <div className="tc-doc-release__migration-steps">
                    {release.migration.steps.map((step) => (
                      <section className="tc-doc-release__migration-step" key={step.title}>
                        <h3>{step.title}</h3>
                        <div className="tc-doc-release__migration-code">
                          <div>
                            <span>Avant</span>
                            <pre>
                              <code>{step.before}</code>
                            </pre>
                          </div>
                          <div>
                            <span>Après</span>
                            <pre>
                              <code>{step.after}</code>
                            </pre>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                </details>
              ) : null}

              <div className="tc-doc-release__actions">
                <a
                  className="opale-button opale-button--primary tc-doc-release__action"
                  href={release.appHref}
                  aria-label={`Ouvrir l’application en version ${release.version}`}
                >
                  {isCurrent ? 'Ouvrir la version courante' : 'Ouvrir cette version'}
                </a>
                <a
                  className="opale-button opale-button--tonal tc-doc-release__source"
                  href={release.sourceHref}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {isCurrent ? CURRENT_SOURCE_LABEL : 'Voir le code figé'}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <p className="tc-doc-prose tc-doc-release-footnote">
        Le numéro de version est géré depuis <code>package.json</code> et vérifié par la suite de
        tests. Les changements incompatibles sont signalés dans leur fiche et accompagnés d’exemples
        de migration quand une API change. Les archives existantes ne sont jamais écrasées.
      </p>
    </PageBody>
  ),
};
