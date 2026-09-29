import { describe, expect, it } from 'vitest';

/* =============================================================================
   LA DOC PUBLIQUE EST EN FRANÇAIS, LES IDENTIFIANTS EN ANGLAIS.

   Ce que lit un consommateur — la JSDoc que son éditeur affiche au survol —
   est rédigé en français, comme le reste de la librairie. Les noms de code,
   eux, restent anglais, y compris ceux qui ne sont pas exportés.
   ========================================================================== */

const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/* Des mots-outils anglais qu'aucune phrase française n'emploie. */
const ENGLISH_PROSE = /\b(?:the|and|when|used|with|which|should|provided)\b/i;

/* Les identifiants français qu'a connus ce dossier. */
const FRENCH_IDENTIFIER =
  /\b(?:const|let|function|type)\s+(?:Panneau\w*|contenu|enveloppe|attributsCommuns|Carte)\b/;

describe('la langue du code public des composants', () => {
  it('balaie bien les sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it('rédige chaque JSDoc en français', () => {
    const guilty = Object.entries(sources).flatMap(([file, source]) =>
      [...source.matchAll(/\/\*\*[\s\S]*?\*\//g)]
        .map((match) => match[0])
        .filter((block) => ENGLISH_PROSE.test(block.replace(/`[^`]*`/g, '')))
        .map((block) => `${file}: ${block.split('\n')[0]}`),
    );
    expect(guilty).toEqual([]);
  });

  it('nomme ses identifiants en anglais', () => {
    const guilty = Object.entries(sources)
      .filter(([, source]) => FRENCH_IDENTIFIER.test(source))
      .map(([file]) => file);
    expect(guilty).toEqual([]);
  });
});
