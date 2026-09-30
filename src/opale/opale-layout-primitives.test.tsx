import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Grid, Heading, Stack, Text } from './opale';

/* =============================================================================
   LES PRIMITIVES DE MISE EN PAGE (DX-16).

   `Stack` n'avait que `direction` et `wrap`, son espacement était figé à
   `--opale-space-md` ; `Text` ne savait rendre qu'un `<p>` ; `Heading`
   s'arrêtait au niveau 4. Tout s'ajoute sans changer les défauts : un appel
   d'avant rend le même balisage et les mêmes classes.
   ========================================================================== */

afterEach(cleanup);

describe('Stack', () => {
  it('garde son balisage par défaut', () => {
    const { container } = render(<Stack>Contenu</Stack>);
    const stack = container.firstElementChild as HTMLElement;

    expect(stack.tagName).toBe('DIV');
    expect(stack.className).toBe('opale-stack opale-stack--column');
    expect(stack.getAttribute('style')).toBeNull();
  });

  it('pose l’espacement sur un pas de l’échelle', () => {
    const { container } = render(<Stack gap="xl">Contenu</Stack>);

    expect(container.firstElementChild).toHaveClass('opale-stack--gap-xl');
  });

  it('accepte `none` pour un empilement serré', () => {
    const { container } = render(<Stack gap="none">Contenu</Stack>);

    expect(container.firstElementChild).toHaveClass('opale-stack--gap-none');
  });

  it('aligne et répartit par classes', () => {
    const { container } = render(
      <Stack direction="row" align="center" justify="between">
        Contenu
      </Stack>,
    );

    expect(container.firstElementChild).toHaveClass(
      'opale-stack',
      'opale-stack--align-center',
      'opale-stack--justify-between',
    );
    expect(container.firstElementChild).not.toHaveClass('opale-stack--column');
  });

  it('rend la balise demandée par `as`', () => {
    render(
      <Stack as="ul" aria-label="Étapes">
        <li>Un</li>
      </Stack>,
    );

    expect(screen.getByRole('list', { name: 'Étapes' })).toHaveClass('opale-stack');
  });

  it('rend un repère de navigation avec `as="nav"`', () => {
    render(<Stack as="nav" aria-label="Secondaire" />);

    expect(screen.getByRole('navigation', { name: 'Secondaire' })).toBeInTheDocument();
  });
});

describe('Grid', () => {
  it('répartit un nombre fixe de colonnes', () => {
    const { container } = render(<Grid columns={3}>Contenu</Grid>);
    const grid = container.firstElementChild as HTMLElement;

    expect(grid).toHaveClass('opale-grid');
    expect(grid.style.getPropertyValue('--opale-grid-columns')).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('remplit avec des pistes d’une largeur minimale, sans déborder', () => {
    const { container } = render(<Grid columns="12rem">Contenu</Grid>);
    const grid = container.firstElementChild as HTMLElement;

    expect(grid.style.getPropertyValue('--opale-grid-columns')).toBe(
      'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))',
    );
  });

  it('ignore un nombre de colonnes invalide', () => {
    const { container } = render(<Grid columns={0}>Contenu</Grid>);
    const grid = container.firstElementChild as HTMLElement;

    expect(grid.style.getPropertyValue('--opale-grid-columns')).toBe('');
  });

  it('prend l’espacement de l’échelle et garde le `style` de l’appelant', () => {
    const { container } = render(
      <Grid columns={2} gap="sm" style={{ marginTop: 4 }}>
        Contenu
      </Grid>,
    );
    const grid = container.firstElementChild as HTMLElement;

    expect(grid).toHaveClass('opale-grid', 'opale-grid--gap-sm');
    expect(grid.style.marginTop).toBe('4px');
  });
});

describe('Text', () => {
  it('reste un paragraphe par défaut', () => {
    render(<Text>Bonjour</Text>);

    expect(screen.getByText('Bonjour').tagName).toBe('P');
  });

  it.each(['span', 'div', 'label'] as const)('rend un `<%s>` avec `as`', (tag) => {
    render(
      <Text as={tag} variant="caption">
        Bonjour
      </Text>,
    );
    const node = screen.getByText('Bonjour');

    expect(node.tagName).toBe(tag.toUpperCase());
    expect(node).toHaveClass('opale-text', 'opale-text--caption');
  });

  it('associe un `<label>` à son champ', () => {
    render(
      <>
        <Text as="label" htmlFor="courriel">
          Courriel
        </Text>
        <input id="courriel" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Courriel' })).toBeInTheDocument();
  });
});

describe('Heading', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('rend un titre de niveau %i', (level) => {
    render(<Heading level={level}>Titre</Heading>);

    expect(screen.getByRole('heading', { level, name: 'Titre' })).toHaveClass('opale-heading');
  });

  it('reste un `<h2>` par défaut', () => {
    render(<Heading>Titre</Heading>);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
