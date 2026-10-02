import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import opaleSource from './opale.css?raw';

/* ============================================================================
   LES CLASSES QU'AUCUN COMPOSANT NE POSE RESTENT, MARQUÉES DÉPRÉCIÉES.

   `opale-dialog*`, `opale-chip`, `opale-stat-grid` et `opale-upload-list` ne
   sont plus rendues par aucun composant. Un consommateur peut pourtant les
   poser à la main : elles font partie de l'API de classes de la feuille, donc
   elles restent, et chaque règle qui les porte le dit juste au-dessus d'elle.
   ========================================================================== */

const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const DEPRECATED = [
  'opale-dialog',
  'opale-dialog-backdrop',
  'opale-dialog__header',
  'opale-dialog__footer',
  'opale-dialog__body',
  'opale-dialog__close',
  'opale-chip',
  'opale-stat-grid',
  'opale-upload-list',
];

const classPattern = (name: string) => new RegExp(`\\.${name}(?![\\w-])`);

describe('les classes dépréciées', () => {
  const root = postcss.parse(opaleSource);

  it.each(DEPRECATED)('%s reste déclarée par la feuille', (name) => {
    const rules: string[] = [];
    root.walkRules((rule) => {
      if (classPattern(name).test(rule.selector)) rules.push(rule.selector);
    });
    expect(rules.length).toBeGreaterThan(0);
  });

  it.each(DEPRECATED)('%s n’est posée par aucun composant', (name) => {
    const users = Object.entries(sources)
      .filter(([, source]) => new RegExp(`['"\` ]${name}['"\` ]`).test(source))
      .map(([file]) => file);
    expect(users).toEqual([]);
  });

  it.each(DEPRECATED)('%s est marquée dépréciée au-dessus de chaque règle', (name) => {
    const unmarked: string[] = [];
    root.walkRules((rule) => {
      if (!classPattern(name).test(rule.selector)) return;
      const previous = rule.prev();
      const marked = previous?.type === 'comment' && previous.text.includes('Déprécié depuis 2.7');
      if (!marked) unmarked.push(rule.selector.replace(/\s+/g, ' '));
    });
    expect(unmarked).toEqual([]);
  });
});
