import { describe, expect, it } from 'vitest';

import { parseThemes } from '../contract/stylesheet';
import opaleSource from './opale.css?raw';
import { OPALE_TOKENS, TOKEN_GROUPS, publicTokens } from './tokens-manifest';

/* ============================================================================
   LA TABLE DES JETONS SUIT LA FEUILLE, DANS LES DEUX SENS.

   Cent jetons `--opale-*` coexistaient sans statut : entrées de marque,
   dérivés à ne pas toucher, réglages du verre, un jeton déprécié. Le
   manifeste dit lesquels un hôte peut surcharger. Il ne vaut que s'il est
   complet : un jeton ajouté à `:root` sans ligne ici rougit, et une ligne
   dont le jeton a disparu aussi.
   ========================================================================== */

const [light, ...darkThemes] = parseThemes(opaleSource);
const declared = [...light.tokens.keys()];
const listed: readonly string[] = OPALE_TOKENS.map((entry) => entry.name);

describe('le manifeste des jetons', () => {
  it('lit bien la feuille', () => {
    expect(declared.length).toBeGreaterThan(90);
  });

  it('liste chaque jeton déclaré sur :root', () => {
    const missing = declared.filter((name) => !listed.includes(name));
    expect(missing, 'jetons de :root absents de tokens-manifest.ts').toEqual([]);
  });

  it('ne liste aucun jeton absent de :root', () => {
    const unknown = listed.filter((name) => !declared.includes(name));
    expect(unknown, 'lignes du manifeste sans jeton dans :root').toEqual([]);
  });

  it('ne liste chaque jeton qu’une fois', () => {
    const twice = listed.filter((name, index) => listed.indexOf(name) !== index);
    expect(twice).toEqual([]);
  });

  it('ne connaît pas de jeton que seul un thème sombre déclarerait', () => {
    for (const theme of darkThemes) {
      const orphans = [...theme.overrides.keys()].filter((name) => !listed.includes(name));
      expect(orphans, `jetons du thème ${theme.name} absents du manifeste`).toEqual([]);
    }
  });

  it('donne à chaque jeton un groupe connu et un rôle d’une ligne', () => {
    const groups = new Set(TOKEN_GROUPS.map((group) => group.id));
    const faulty = OPALE_TOKENS.filter(
      (entry) => !groups.has(entry.group) || entry.role.trim() === '' || entry.role.includes('\n'),
    ).map((entry) => entry.name);
    expect(faulty).toEqual([]);
  });

  it('n’a aucun groupe vide', () => {
    const empty = TOKEN_GROUPS.filter(
      (group) => !OPALE_TOKENS.some((entry) => entry.group === group.id),
    ).map((group) => group.id);
    expect(empty).toEqual([]);
  });
});

describe('les statuts', () => {
  const statusOf = (name: string) => OPALE_TOKENS.find((entry) => entry.name === name)?.status;

  it.each([
    '--opale-primary',
    '--opale-secondary',
    '--opale-danger',
    '--opale-accent',
    '--opale-on-fill',
    '--opale-on-primary',
    '--opale-on-secondary',
    '--opale-on-danger',
    '--opale-on-accent',
    '--opale-primary-on-surface',
    '--opale-danger-on-surface',
    '--opale-background',
    '--opale-surface',
    '--opale-text',
    '--opale-radius-md',
    '--opale-font-body',
    '--opale-space-md',
    '--opale-control-md',
    '--opale-focus',
    '--opale-focus-ring-width',
    '--opale-z-modal',
  ])('%s est public : un hôte peut le surcharger', (name) => {
    expect(statusOf(name)).toBe('public');
  });

  it.each([
    '--opale-color-scheme',
    '--opale-field-border',
    '--opale-fill-danger',
    '--opale-tonal-mix',
    '--opale-squircle-radius',
    '--opale-squircle-clip',
    '--opale-glass-blur',
  ])('%s est interne : dérivé ou mécanique', (name) => {
    expect(statusOf(name)).toBe('internal');
  });

  it('signale le jeton déprécié et sa version', () => {
    const blur = OPALE_TOKENS.find((entry) => entry.name === '--opale-glass-blur');
    expect(blur?.deprecatedSince).toBe('3.7');
  });

  it('publicTokens ne rend que les publics, dans l’ordre du manifeste', () => {
    const names = publicTokens().map((entry) => entry.name);
    expect(names).toEqual(
      OPALE_TOKENS.filter((entry) => entry.status === 'public').map((entry) => entry.name),
    );
    expect(names.length).toBeGreaterThan(50);
  });
});
