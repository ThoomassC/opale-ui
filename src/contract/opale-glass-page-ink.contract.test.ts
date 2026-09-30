import { describe, expect, it } from 'vitest';

import { atRules, declaration, declarations } from '../test/css-rules';
import { compositeOver, contrastRatio, withAlpha } from './color';
import { parseThemes, resolveToken, type Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';
import tabsSource from '../opale/components/tabs/style/Tabs.module.css?raw';

/* ============================================================================
   LE VERRE POSÉ SUR LA PAGE : UN RÉGLAGE, ET TOUTES LES ENCRES SUIVENT.

   ACC-01 et THM-17. Par défaut l'encre du verre est blanche : elle est faite
   pour une photographie voilée, et ce défaut ne change pas en 3.x. Sur une
   page claire unie, elle publiait du blanc sur du blanc. L'hôte pose
   `data-opale-glass-ink="page"` sur la racine (ou sur un ancêtre) : l'encre
   rejoint alors celle de la page, et avec elle les champs, les onglets, le
   message d'erreur, les remplissages et le toast — ce que redéfinir
   `--opale-glass-ink` seul laissait de côté.
   ========================================================================== */

const PAGE = "[data-opale-glass-ink='page']";
const INSIDE = `${PAGE} [data-opale-glass]`;

describe('le verre, par défaut', () => {
  it('garde l’encre blanche de la scène photographique', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-glass-ink')).toBe('#fff');
    expect(root.get('--opale-glass-ink-muted')).toBe('rgba(255, 255, 255, 0.86)');
  });
});

describe('le verre sur la page', () => {
  it.each([PAGE, INSIDE, `${PAGE}[data-opale-glass]`])(
    '%s prend l’encre de la page',
    (selector) => {
      const scope = declarations(opaleSource, selector);
      expect(scope.get('--opale-glass-ink')).toBe('var(--opale-text)');
      expect(scope.get('--opale-glass-ink-muted')).toBe('var(--opale-text-secondary)');
    },
  );

  it('éclaircit le lavis des champs au lieu de l’assombrir', () => {
    const tint = declaration(opaleSource, `${PAGE} .opale-input--glass-root`, '--opale-glass-tint');
    expect(tint).toMatch(/var\(--opale-surface\)/);
    expect(tint).not.toMatch(/glass-deep/);
  });

  it('rend au champ une bordure de champ', () => {
    expect(declaration(opaleSource, `${PAGE} .opale-input-shell--glass`, 'box-shadow')).toBe(
      'inset 0 0 0 1px var(--opale-field-border)',
    );
  });

  it('rend son rouge au message d’erreur', () => {
    expect(
      declaration(opaleSource, `${PAGE} [data-opale-glass] .opale-field__helper--error`, 'color'),
    ).toBe('var(--opale-danger-on-surface)');
  });

  it('rend aux onglets de verre l’encre, les voiles et le focus de la page', () => {
    /* La règle vit dans le module des onglets : `opale.css` ne déclare aucune
       classe stable d'un composant (garde de `stable-classes.test.tsx`). */
    const tabs = declarations(
      tabsSource,
      ":global([data-opale-glass-ink='page']) :global(.opale-tabs__shell)[data-opale-glass] .tabs",
    );
    expect(tabs.get('--opale-tabs-ink')).toBe('var(--opale-text)');
    expect(tabs.get('--opale-tabs-focus')).toBe('var(--opale-focus)');
    expect(tabs.get('--opale-tabs-surface')).toMatch(/var\(--opale-surface\)/);
    expect(tabs.get('--opale-tabs-indicator')).toMatch(/var\(--opale-primary\)/);
  });

  it.each([
    ['primary', 'var(--opale-primary)', 'var(--opale-on-fill)'],
    ['secondary', 'var(--opale-secondary-dark)', 'var(--opale-on-fill)'],
    ['danger', 'var(--opale-danger)', 'var(--opale-on-fill)'],
    ['accent', 'var(--opale-accent)', 'var(--opale-on-accent)'],
  ])('rend au bouton %s son aplat, donc la hiérarchie des actions', (variant, fill, ink) => {
    const button = declarations(
      opaleSource,
      `${PAGE} .opale-button--glass.opale-button--${variant}`,
    );
    expect(button.get('--opale-button-background')).toBe(fill);
    expect(button.get('color')).toBe(ink);
  });

  it('rend aux boutons sans aplat l’encre primaire des surfaces', () => {
    for (const variant of ['tonal', 'ghost', 'text']) {
      expect(
        declaration(opaleSource, `${PAGE} .opale-button--glass.opale-button--${variant}`, 'color'),
      ).toBe('var(--opale-primary-on-surface)');
    }
  });

  it('pose l’encre des remplissages sur ce qui garde un aplat', () => {
    for (const selector of [
      `${PAGE} [data-opale-glass] .opale-badge`,
      `${PAGE} .opale-badge--glass`,
      `${PAGE} .opale-checkbox:checked + * .opale-checkbox-mark`,
    ]) {
      expect(declaration(opaleSource, selector, 'color'), selector).toBe('var(--opale-on-fill)');
    }
    expect(
      declaration(opaleSource, `${PAGE} [data-opale-glass] .opale-progress__value`, 'background'),
    ).toBe('var(--opale-primary)');
  });

  it('rend au toast une surface claire sous l’encre sombre', () => {
    expect(
      declaration(opaleSource, `${PAGE} .opale-toast--glass-root`, '--opale-glass-tint'),
    ).toMatch(/var\(--opale-surface\)/);
  });
});

/* =============================================================================
   LES APLATS DU MODE « PAGE » TIENNENT 4,5:1 DANS LES DEUX THÈMES.

   Les gardes ci-dessus lisent des noms de jetons ; celle-ci les résout. Le
   badge accent posait `--opale-accent-dark` sous `--opale-on-fill` : 6,63:1
   en clair, mais le brun n'est pas redéfini en sombre alors que l'encre des
   remplissages y devient sombre — #0c0f0d sur #7a5200, 2,78:1 relevé par axe.
   Chaque paire (fond, encre) est lue dans la feuille, puis résolue dans le
   thème clair et dans les deux thèmes sombres.
   ========================================================================== */
describe('le verre sur la page : contraste des aplats', () => {
  const themes = parseThemes(opaleSource);

  /** Un jeton résolu, `color-mix(in srgb, A N%, B)` composé comme le peint le navigateur. */
  function paint(theme: Theme, value: string): string {
    const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
    if (!token) throw new Error(`\`${value}\` n’est pas un jeton seul`);
    const resolved = resolveToken(theme, token);
    const mix = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/.exec(resolved);
    return mix ? compositeOver(withAlpha(mix[1], Number(mix[2]) / 100), mix[3]) : resolved;
  }

  const BADGE = `${PAGE} [data-opale-glass] .opale-badge`;
  const badgeInk = () => declaration(opaleSource, BADGE, 'color') ?? '';
  const pairs: ReadonlyArray<readonly [string, () => string, () => string]> = [
    ['badge primaire', () => declaration(opaleSource, BADGE, 'background') ?? '', badgeInk],
    ...(['accent', 'danger'] as const).map(
      (tone) =>
        [
          `badge ${tone}`,
          () =>
            declaration(
              opaleSource,
              `${PAGE} [data-opale-glass] .opale-badge--${tone}`,
              'background',
            ) ?? '',
          badgeInk,
        ] as const,
    ),
    ...(['primary', 'secondary', 'danger', 'accent'] as const).map((variant) => {
      const button = `${PAGE} .opale-button--glass.opale-button--${variant}`;
      return [
        `bouton ${variant}`,
        () => declaration(opaleSource, button, '--opale-button-background') ?? '',
        () => declaration(opaleSource, button, 'color') ?? '',
      ] as const;
    }),
  ];

  for (const theme of themes) {
    it.each(pairs)(`%s tient 4,5:1 en ${theme.name}`, (_name, fill, ink) => {
      expect(contrastRatio(paint(theme, ink()), paint(theme, fill()))).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('garde au badge accent son brun en clair', () => {
    const light = themes.find((theme) => theme.name === 'light') as Theme;
    const accent = declaration(
      opaleSource,
      `${PAGE} [data-opale-glass] .opale-badge--accent`,
      'background',
    );
    expect(paint(light, accent ?? '')).toBe(paint(light, 'var(--opale-accent-dark)'));
  });
});

/* =============================================================================
   LES OVERLAYS EN PORTAIL NE SUIVENT QUE L'ATTRIBUT POSÉ SUR <html>/<body>.
   Le commentaire du bloc le dit à l'hôte ; c'est la seule façon de le savoir.
   ========================================================================== */
describe('le verre sur la page : les portails', () => {
  it('documente que toasts et modales ne suivent que <html> ou <body>', () => {
    const block = opaleSource.slice(
      opaleSource.indexOf('LE VERRE POSÉ SUR LA PAGE'),
      opaleSource.indexOf("[data-opale-glass-ink='page'],"),
    );
    expect(block).toMatch(/portail/i);
    expect(block).toMatch(/<html>/);
    expect(block).toMatch(/<body>/);
  });
});

describe('le verre sans backdrop-filter', () => {
  const FALLBACK =
    '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))';

  it('déclare un repli', () => {
    expect(atRules(opaleSource, 'supports')).toContain(FALLBACK.replace('@supports ', ''));
  });

  it('donne au lavis une densité lisible, dans les deux encres', () => {
    expect(
      declaration(opaleSource, '[data-opale-glass]', '--opale-glass-tint', { within: FALLBACK }),
    ).toMatch(/var\(--opale-glass-deep\) \d+%/);
    expect(
      declaration(opaleSource, `${INSIDE}`, '--opale-glass-tint', { within: FALLBACK }),
    ).toMatch(/var\(--opale-surface\) \d+%/);
  });
});
