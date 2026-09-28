import { Fragment, type ReactNode } from 'react';

import { DocHeadingLevel } from '../doc-heading-level';
import { UsageBlock } from './api';

/* =============================================================================
   LE GABARIT DE TOUTE PAGE DE COMPOSANT.

   Les pages du catalogue comme les pages écrites à la main passent par ici :
   l'ordre des sections est donc tenu par le code, pas par la discipline de
   chaque page. Import, Démo, Exemples, Props, États, Accessibilité, Limites
   connues — « États » et « Limites connues » disparaissent quand ils n'ont
   rien à dire. `component-page.structure.test.tsx` vérifie le plan rendu.

   À l'intérieur d'une section, spécimens et tableaux de props titrent en
   `<h3>` (voir `DocHeadingLevel`), sous le `<h2>` de la section.
   ========================================================================== */

/** Les états qu'une page peut documenter, dans l'ordre d'affichage. */
export type ComponentState = 'disabled' | 'loading' | 'error' | 'empty';

const STATE_LABELS: Readonly<Record<ComponentState, string>> = {
  disabled: 'Désactivé',
  loading: 'Chargement',
  error: 'Erreur',
  empty: 'Vide',
};

export interface ComponentStateNote {
  readonly state: ComponentState;
  readonly description: ReactNode;
}

/** Le contrat d'accessibilité, tel que le code du composant le tient. */
export interface AccessibilityContract {
  /** Les touches prises en charge ; vide pour un composant sans interaction. */
  readonly keyboard: readonly ReactNode[];
  /** Rôles, noms accessibles, attributs `aria-*`, régions live, focus. */
  readonly semantics: readonly ReactNode[];
}

export interface ComponentPageLayoutProps {
  /** Préfixe des identifiants de section — le slug du composant suffit. */
  readonly id: string;
  /** Les noms importés depuis `@thomascaron/opale-ui`. */
  readonly imports: readonly string[];
  /** Ce qui précède les sections : chapô, pastille de famille. */
  readonly intro?: ReactNode;
  /** La démonstration vivante, commutateur de matériau compris. */
  readonly demo: ReactNode;
  readonly examples: ReactNode;
  /** Un ou plusieurs `PropsTable`. */
  readonly props: ReactNode;
  readonly states?: readonly ComponentStateNote[];
  readonly accessibility: AccessibilityContract;
  readonly limits?: readonly ReactNode[];
}

/** Rend `du texte` entre accents graves en `<code>`, pour les contrats écrits en chaîne. */
export function InlineCode({ text }: { readonly text: string }) {
  return (
    <>
      {text
        .split('`')
        .map((part, index) =>
          index % 2 === 1 ? (
            <code key={index}>{part}</code>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

function BulletList({ items }: { readonly items: readonly ReactNode[] }) {
  return (
    <ul className="tc-doc-component-section__list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Section({
  id,
  slug,
  title,
  children,
}: {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const titleId = `${id}-${slug}`;

  return (
    <div className="tc-doc-component-section" data-section={slug}>
      <h2 className="tc-doc-component-section__title" id={titleId}>
        {title}
      </h2>
      <DocHeadingLevel.Provider value={3}>{children}</DocHeadingLevel.Provider>
    </div>
  );
}

export function ComponentPageLayout({
  id,
  imports,
  intro,
  demo,
  examples,
  props,
  states = [],
  accessibility,
  limits = [],
}: ComponentPageLayoutProps) {
  const importCode = `import { ${imports.join(', ')} } from '@thomascaron/opale-ui';`;

  return (
    <div className="tc-doc-component-page">
      {intro}

      <Section id={id} slug="import" title="Import">
        <UsageBlock label={`Import de ${imports.join(', ')}`} code={importCode} actions={false} />
      </Section>

      <Section id={id} slug="demo" title="Démo">
        <div className="tc-doc-component-demo">{demo}</div>
      </Section>

      <Section id={id} slug="exemples" title="Exemples">
        {examples}
      </Section>

      <Section id={id} slug="props" title="Props">
        {props}
      </Section>

      {states.length > 0 ? (
        <Section id={id} slug="etats" title="États">
          <dl className="tc-doc-component-section__states">
            {states.map(({ state, description }) => (
              <div key={state}>
                <dt>{STATE_LABELS[state]}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <Section id={id} slug="accessibilite" title="Accessibilité">
        {accessibility.keyboard.length > 0 ? (
          <>
            <h3 className="tc-doc-component-section__subtitle">Clavier</h3>
            <BulletList items={accessibility.keyboard} />
          </>
        ) : null}
        <h3 className="tc-doc-component-section__subtitle">Rôles et noms</h3>
        <BulletList items={accessibility.semantics} />
      </Section>

      {limits.length > 0 ? (
        <Section id={id} slug="limites" title="Limites connues">
          <BulletList items={limits} />
        </Section>
      ) : null}
    </div>
  );
}
