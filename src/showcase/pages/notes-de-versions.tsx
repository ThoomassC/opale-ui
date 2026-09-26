import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { currentDeploymentLabel } from '../deployment-environment';
import { CURRENT_RELEASE, RELEASES } from '../releases';
import { PageBody } from './api';
import { CopyMigrationCode } from './copy-migration-code';

const CURRENT_SOURCE_LABEL = 'Voir le code de la recette';

export const notesVersionsPage: DocPage = {
  slug: 'notes-de-versions',
  label: 'Notes de versions',
  group: 'introduction',
  title: 'Notes de versions',
  searchTerms: [
    'migration',
    'rupture',
    'Glass',
    'liquidGlass',
    '3.2.0',
    '3.3.0',
    'PageScaffold',
    'changelog',
  ],
  lede: (
    <>
      L’historique d’Opale, version par version. Chaque entrée décrit les changements et donne accès
      à un <strong>snapshot utilisable</strong> ainsi qu’au code qui l’a produit.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-release-lede">
        Les changements de la version courante, puis les archives consultables avec leur propre
        application et leur code.
      </p>

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
                    <span className="tc-doc-release__status">
                      {currentDeploymentLabel()} · version courante
                    </span>
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
                  {release.sections.map((section, sectionIndex) => (
                    <section className="tc-doc-release__section" key={section.title}>
                      <h3>{section.title}</h3>
                      <ul className="tc-doc-release__change-list">
                        {section.changes.map((change) => (
                          <li key={change.title}>
                            <strong>{change.title}</strong>
                            <p>{change.detail}</p>
                            {change.links ? (
                              <span className="tc-doc-release__change-links">
                                {change.links.map((link) => (
                                  <a
                                    className="tc-doc-link"
                                    href={hrefFor(link.slug)}
                                    key={link.slug}
                                  >
                                    {link.label}
                                  </a>
                                ))}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {sectionIndex === 0 && release.migration ? (
                        <details className="tc-doc-release__migration" open>
                          <summary>
                            Guide de migration depuis la {release.migration.fromVersion}
                          </summary>
                          <div className="tc-doc-release__migration-steps">
                            {release.migration.steps.map((step) => (
                              <section className="tc-doc-release__migration-step" key={step.title}>
                                <h4>{step.title}</h4>
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
                                    <CopyMigrationCode code={step.after} />
                                  </div>
                                </div>
                              </section>
                            ))}
                            {release.removedComponents ? (
                              <details className="tc-doc-release__removed">
                                <summary>
                                  Correspondance des{' '}
                                  {release.removedComponents.flatMap((row) => row.removed).length}{' '}
                                  exports retirés
                                </summary>
                                <div
                                  className="tc-doc-release__removed-scroll"
                                  role="group"
                                  aria-label="Tableau des exports retirés, défilement horizontal"
                                  tabIndex={0}
                                >
                                  <table>
                                    <thead>
                                      <tr>
                                        <th scope="col">Export 3.1.1</th>
                                        <th scope="col">Migration conseillée</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {release.removedComponents.map((row) => (
                                        <tr key={row.removed.join(',')}>
                                          <th scope="row">{row.removed.join(', ')}</th>
                                          <td>
                                            {row.guidance}
                                            {row.slug ? (
                                              <>
                                                {' '}
                                                <a className="tc-doc-link" href={hrefFor(row.slug)}>
                                                  Voir la fiche
                                                </a>
                                              </>
                                            ) : null}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </details>
                            ) : null}
                          </div>
                        </details>
                      ) : null}
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
        Chaque archive possède sa propre application sous <code>/versions/vX.Y.Z/</code> et son code
        figé. Le numéro de version vient de <code>package.json</code> et les archives ne sont jamais
        écrasées.
      </p>
    </PageBody>
  ),
};
