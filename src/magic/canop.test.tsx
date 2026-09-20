import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CanopButton, CanopSegmentedControl } from './canop';

afterEach(cleanup);

describe('CanopButton', () => {
  it('utilise button comme type sûr par défaut et respecte un type explicite', () => {
    render(
      <>
        <CanopButton>Action</CanopButton>
        <CanopButton type="submit">Envoyer</CanopButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute('type', 'submit');
  });

  it.each(['primary', 'secondary', 'accent', 'danger'] as const)(
    'expose la variante pleine %s',
    (variant) => {
      render(<CanopButton variant={variant}>{variant}</CanopButton>);
      expect(screen.getByRole('button', { name: variant })).toHaveClass(`canop-button--${variant}`);
    },
  );

  it('conserve ghost dans l’API pour les boutons spécialisés existants', () => {
    render(<CanopButton variant="ghost">Action secondaire</CanopButton>);
    expect(screen.getByRole('button', { name: 'Action secondaire' })).toHaveClass(
      'canop-button--ghost',
    );
  });
});

describe('CanopSegmentedControl', () => {
  const OPTIONS = [
    { value: 'design', label: 'Design system' },
    { value: 'code', label: 'Code' },
  ] as const;

  /* jsdom n'a pas de mise en page : tout rectangle y vaut 0, ce qui est aussi
     l'état d'une première peinture. Les rectangles ne sont doublés que là où le
     test veut voir la pastille se déplacer. */
  const rect = (left: number, width: number): DOMRect =>
    ({
      bottom: 36,
      height: 36,
      left,
      right: left + width,
      top: 0,
      width,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('garde aria-pressed comme seule annonce de la sélection', () => {
    const { container } = render(<CanopSegmentedControl options={OPTIONS} value="code" />);
    const indicator = container.querySelector('.canop-segmented__indicator');

    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('laisse la pastille sans position tant que rien n’est mesurable', () => {
    const { container } = render(<CanopSegmentedControl options={OPTIONS} value="code" />);
    const indicator = container.querySelector<HTMLElement>('.canop-segmented__indicator');

    expect(indicator?.style.transform).toBe('');
    expect(indicator?.dataset.animated).toBeUndefined();
  });

  it('place la pastille sous l’option pressée', () => {
    const { container } = render(<CanopSegmentedControl options={OPTIONS} value="code" />);
    const group = screen.getByRole('group');
    const pressed = screen.getByRole('button', { name: 'Code' });

    vi.spyOn(group, 'getBoundingClientRect').mockReturnValue(rect(0, 240));
    vi.spyOn(pressed, 'getBoundingClientRect').mockReturnValue(rect(130, 72));

    fireEvent(window, new Event('resize'));

    const indicator = container.querySelector<HTMLElement>('.canop-segmented__indicator');
    expect(indicator?.style.transform).toBe('translate3d(130px, 0px, 0)');
    expect(indicator?.style.width).toBe('72px');
    expect(indicator?.dataset.animated).toBe('true');
  });
});
