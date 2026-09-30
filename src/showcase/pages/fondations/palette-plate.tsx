import type { Plate } from '../../palette-data';

/* La plaque de palette, seul export de ce fichier :
   `react-refresh/only-export-components` refuse un composant déclaré à côté
   d'un export `DocPage`. */

/**
 * Une plaque de palette. Fond, encre et filet sont posés en **style en
 * ligne** avec des hexadécimaux littéraux : la plaque documente un thème, elle
 * ne doit pas suivre celui du lecteur. C'est la seule dérogation à la règle
 * « aucune couleur littérale » de la charte, et elle est délibérée — ce sont
 * des mesures, pas de la mise en forme.
 *
 * Le titre est un `<h2>` et non un `<h3>` : une plaque n'est pas dans un
 * `Specimen`, elle est posée directement sous le `<h1>` que rend la coquille.
 */
export function PalettePlate({ plate }: { plate: Plate }) {
  return (
    <article
      className="tc-doc-plate"
      style={{ background: plate.ground, color: plate.ink, borderColor: plate.rule }}
      aria-labelledby={`${plate.id}-title`}
    >
      <header className="tc-doc-plate__head" style={{ borderColor: plate.rule }}>
        <h2 className="tc-doc-plate__title" id={`${plate.id}-title`}>
          {plate.title}
        </h2>
        <p className="tc-doc-plate__ground" style={{ color: plate.inkMuted }}>
          {plate.groundLabel}
        </p>
      </header>

      {plate.groups.map((group) => (
        <section className="tc-doc-plate__group" key={group.title}>
          <h3 className="tc-doc-plate__grouptitle" style={{ borderColor: plate.rule }}>
            {group.title}
          </h3>
          <p className="tc-doc-plate__groupnote" style={{ color: plate.inkMuted }}>
            {group.note}
          </p>
          <ul className="tc-doc-swatches">
            {group.swatches.map((swatch) => (
              <li className="tc-doc-swatch" key={swatch.token + swatch.hex}>
                {/* Un lavis est peint par sa COMPOSITION et non par sa valeur
                    déclarée : posé tel quel, il se composerait sur le sol de
                    la plaque alors que son support réel est ailleurs — la
                    carte, le plus souvent. La valeur déclarée reste affichée en
                    texte, elle, parce que c'est elle que la feuille porte. */}
                <span
                  className="tc-doc-swatch__chip"
                  style={{
                    background: swatch.wash?.composite ?? swatch.hex,
                    borderColor: plate.rule,
                  }}
                  aria-hidden="true"
                />
                <span className="tc-doc-swatch__meta">
                  <code className="tc-doc-swatch__token">{swatch.token}</code>
                  <span className="tc-doc-swatch__hex">
                    {swatch.hex}
                    {swatch.wash ? (
                      <span className="tc-doc-swatch__against">
                        {' '}
                        → {swatch.wash.composite} sur {swatch.wash.over.join(' + ')}
                      </span>
                    ) : null}
                  </span>
                  <span className="tc-doc-swatch__ratio" style={{ color: plate.inkMuted }}>
                    {swatch.ratio ? `${swatch.ratio} ` : null}
                    <span className="tc-doc-swatch__against">{swatch.against}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
