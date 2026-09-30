import { useContext, type ReactNode } from 'react';

import { DocHeadingLevel } from './doc-heading-level';

/** Le titre d'un bloc de documentation, au niveau fixé par `DocHeadingLevel`. */
export function DocHeading({
  id,
  className,
  children,
}: {
  readonly id?: string;
  readonly className: string;
  readonly children: ReactNode;
}) {
  const Tag = useContext(DocHeadingLevel) === 3 ? 'h3' : 'h2';
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  );
}

export interface SpecimenProps {
  title: string;
  note?: ReactNode;
  /** Dispose les enfants en ligne fluide plutôt qu'en pile. */
  inline?: boolean;
  children: ReactNode;
}

/**
 * Cadre d'un spécimen : un titre, une note, une scène.
 *
 * UN `<div>` ET NON UN `<article>`, et ce n'était pas un détail : un spécimen
 * n'est pas un contenu distribuable indépendamment, et `role="article"` sans
 * nom accessible se présentait cinq fois par page comme « article » dans les
 * rotors — cinquante-neuf fois sur le site. Le `<h2>` structure déjà le
 * spécimen, et lui apparaît dans le plan de titres.
 *
 * Le titre est un `<h2>` sous le `<h1>` de la coquille, ou un `<h3>` dans une
 * section du gabarit de composant (voir `DocHeadingLevel`). La classe reste
 * `tc-doc-specimen__title` : c'est le niveau VISUEL voulu, indépendamment du
 * niveau de titre.
 */
export function Specimen({ title, note, inline = false, children }: SpecimenProps) {
  return (
    <div className="tc-doc-specimen">
      <DocHeading className="tc-doc-specimen__title">{title}</DocHeading>
      {note ? <p className="tc-doc-specimen__note">{note}</p> : null}
      <div
        className={
          inline
            ? 'tc-doc-specimen__stage tc-doc-specimen__stage--inline'
            : 'tc-doc-specimen__stage'
        }
      >
        {children}
      </div>
    </div>
  );
}
