import { describe, expect, it } from 'vitest';

import { declaration, stripComments } from '../test/css-rules';
import docSource from './doc.css?raw';
import docV3Source from './doc-v3.css?raw';

/* =============================================================================
   LA VITRINE PARLE GRIS, PLUS SARCELLE.

   Les anciens rôles de `tokens/roles.css` (`--text-muted`, `--panel-surface`,
   `--rule`) portent la teinte sarcelle de la palette précédente : une note de
   spécimen, un en-tête de tableau ou un filet tiraient sur le bleu-vert au
   milieu d'une charte devenue neutre et saphir. La vitrine pose désormais les
   jetons Opale — l'encre secondaire, la surface creusée, le séparateur —, qui
   existent dans les deux thèmes. Ce fichier garde le retour en arrière.
   ========================================================================== */

describe('la palette neutre de la vitrine', () => {
  it('pose l’encre secondaire Opale sur les notes de spécimen', () => {
    expect(declaration(docSource, '.tc-doc-specimen__note', 'color')).toBe(
      'var(--opale-text-secondary)',
    );
  });

  it('ne cite plus l’encre atténuée sarcelle nulle part dans doc.css', () => {
    expect(stripComments(docSource)).not.toContain('var(--text-muted)');
  });

  it('pose une surface et un filet neutres sous l’en-tête de tableau', () => {
    const background = declaration(docSource, '.tc-doc-table thead th', 'background');

    expect(background).not.toContain('--panel-surface');
    expect(background).toBe('var(--opale-surface-sunken)');
    expect(declaration(docSource, '.tc-doc-table th', 'border-block-end')).toBe(
      '1px solid var(--opale-divider)',
    );
  });

  it('écrit l’option de recherche désignée à l’encre du primaire', () => {
    const selected = ".tc-doc-search__option[aria-selected='true']";

    expect(declaration(docV3Source, selected, 'color')).toBe('var(--opale-on-primary) !important');
    expect(declaration(docV3Source, `${selected} .tc-doc-search__group`, 'color')).toBe(
      'var(--opale-on-primary) !important',
    );
    expect(stripComments(docV3Source)).not.toContain('#e8f8fb');
    /* L'ancienne reprise sombre du nom de groupe (#182033) tombait à 4,48:1
       sur le primaire sombre ; l'encre du rôle y tient 5,32:1. */
    expect(
      declaration(
        docV3Source,
        `:root[data-theme='dark'] ${selected} .tc-doc-search__group`,
        'color',
      ),
    ).toBeUndefined();
  });
});
