import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type CSSProperties, type ReactElement, type RefCallback } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Modal, type ModalProps } from './components/modal';
import { PageScaffold, type PageScaffoldProps } from './components/page-scaffold';
import { SiteNav, type SiteNavProps } from './components/site-nav';
import { useSvgMapViewport } from './components/svg-map';
import {
  Autocomplete,
  BackgroundSurface,
  Badge,
  Breadcrumb,
  BulletList,
  Button,
  Card,
  CardGrid,
  Checkbox,
  Clipboard,
  CommandPalette,
  ConfirmDialog,
  CookieBanner,
  DataTable,
  DescriptionList,
  Divider,
  Donut,
  Dropzone,
  EmptyState,
  Feedback,
  FileCard,
  Form,
  Heading,
  Icon,
  IconActionButton,
  InlineInput,
  Input,
  LegalLinks,
  Layout,
  Lightbox,
  Link,
  Menu,
  MultiSelect,
  Navbar,
  Pagination,
  Pressable,
  ProgressBar,
  Rating,
  RatingInput,
  SegmentedControl,
  Select,
  SelectionBar,
  SidePanel,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  StatCard,
  SvgMap,
  SvgMapControls,
  Text,
  Toast,
  Toggle,
  type AutocompleteProps,
  type BackgroundSurfaceProps,
  type BadgeProps,
  type BreadcrumbProps,
  type BulletListProps,
  type ButtonProps,
  type CardGridProps,
  type CardProps,
  type CheckboxProps,
  type ClipboardProps,
  type CommandPaletteProps,
  type ConfirmDialogProps,
  type CookieBannerProps,
  type DataTableProps,
  type DescriptionListProps,
  type DividerProps,
  type DonutProps,
  type DropzoneProps,
  type EmptyStateProps,
  type FeedbackProps,
  type FileCardProps,
  type FormProps,
  type HeadingProps,
  type IconActionButtonProps,
  type IconProps,
  type InlineInputProps,
  type InputProps,
  type LayoutProps,
  type LegalLinksProps,
  type LightboxProps,
  type LinkProps,
  type MenuProps,
  type MultiSelectProps,
  type NavbarProps,
  type PaginationProps,
  type PressableProps,
  type ProgressBarProps,
  type RatingInputProps,
  type RatingProps,
  type SegmentedControlProps,
  type SelectionBarProps,
  type SelectProps,
  type SidePanelProps,
  type SkeletonProps,
  type SliderProps,
  type SpinnerProps,
  type StackProps,
  type StatCardProps,
  type SvgMapControlsProps,
  type SvgMapProps,
  type TextProps,
  type ToastProps,
  type ToggleProps,
} from './opale';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* =============================================================================
   LA RACINE DE CHAQUE COMPOSANT ACCEPTE CE QU'ACCEPTE SON ÉLÉMENT.

   Une ligne par composant : on le rend avec `ref`, `id`, `data-testid`,
   `className`, `style` et `aria-label`, et chacun doit atterrir sur l'élément
   cible — le contrôle natif pour un champ (sa racine garde `className`), le
   panneau pour une surimpression, l'élément le plus externe pour le reste.
   ========================================================================== */

/* LE CONTRAT DE TYPE, VÉRIFIÉ À LA COMPILATION. Un composant dont les props
   ignorent l'une de ces clés fait échouer `tsc`, avant même l'exécution. */
type RootKey = 'ref' | 'id' | 'className' | 'style' | 'aria-label';
type AcceptsRoot<P> = [Exclude<RootKey, keyof P>] extends [never] ? true : false;

const ROOT_PROPS_ARE_TYPED = {
  Autocomplete: true satisfies AcceptsRoot<AutocompleteProps>,
  BackgroundSurface: true satisfies AcceptsRoot<BackgroundSurfaceProps>,
  Badge: true satisfies AcceptsRoot<BadgeProps>,
  Breadcrumb: true satisfies AcceptsRoot<BreadcrumbProps>,
  BulletList: true satisfies AcceptsRoot<BulletListProps>,
  Button: true satisfies AcceptsRoot<ButtonProps>,
  Card: true satisfies AcceptsRoot<CardProps>,
  CardGrid: true satisfies AcceptsRoot<CardGridProps>,
  Checkbox: true satisfies AcceptsRoot<CheckboxProps>,
  Clipboard: true satisfies AcceptsRoot<ClipboardProps>,
  CommandPalette: true satisfies AcceptsRoot<CommandPaletteProps>,
  ConfirmDialog: true satisfies AcceptsRoot<ConfirmDialogProps>,
  CookieBanner: true satisfies AcceptsRoot<CookieBannerProps>,
  DataTable: true satisfies AcceptsRoot<DataTableProps>,
  DescriptionList: true satisfies AcceptsRoot<DescriptionListProps>,
  Divider: true satisfies AcceptsRoot<DividerProps>,
  Donut: true satisfies AcceptsRoot<DonutProps>,
  Dropzone: true satisfies AcceptsRoot<DropzoneProps>,
  EmptyState: true satisfies AcceptsRoot<EmptyStateProps>,
  Feedback: true satisfies AcceptsRoot<FeedbackProps>,
  FileCard: true satisfies AcceptsRoot<FileCardProps>,
  Form: true satisfies AcceptsRoot<FormProps>,
  Heading: true satisfies AcceptsRoot<HeadingProps>,
  Icon: true satisfies AcceptsRoot<IconProps>,
  IconActionButton: true satisfies AcceptsRoot<IconActionButtonProps>,
  InlineInput: true satisfies AcceptsRoot<InlineInputProps>,
  Input: true satisfies AcceptsRoot<InputProps>,
  Layout: true satisfies AcceptsRoot<LayoutProps>,
  LegalLinks: true satisfies AcceptsRoot<LegalLinksProps>,
  Lightbox: true satisfies AcceptsRoot<LightboxProps>,
  Link: true satisfies AcceptsRoot<LinkProps>,
  Menu: true satisfies AcceptsRoot<MenuProps>,
  Modal: true satisfies AcceptsRoot<ModalProps>,
  MultiSelect: true satisfies AcceptsRoot<MultiSelectProps>,
  Navbar: true satisfies AcceptsRoot<NavbarProps>,
  PageScaffold: true satisfies AcceptsRoot<PageScaffoldProps>,
  Pagination: true satisfies AcceptsRoot<PaginationProps>,
  Pressable: true satisfies AcceptsRoot<PressableProps>,
  ProgressBar: true satisfies AcceptsRoot<ProgressBarProps>,
  Rating: true satisfies AcceptsRoot<RatingProps>,
  RatingInput: true satisfies AcceptsRoot<RatingInputProps>,
  SegmentedControl: true satisfies AcceptsRoot<SegmentedControlProps>,
  Select: true satisfies AcceptsRoot<SelectProps>,
  SelectionBar: true satisfies AcceptsRoot<SelectionBarProps>,
  SidePanel: true satisfies AcceptsRoot<SidePanelProps>,
  SiteNav: true satisfies AcceptsRoot<SiteNavProps>,
  Skeleton: true satisfies AcceptsRoot<SkeletonProps>,
  Slider: true satisfies AcceptsRoot<SliderProps>,
  Spinner: true satisfies AcceptsRoot<SpinnerProps>,
  Stack: true satisfies AcceptsRoot<StackProps>,
  StatCard: true satisfies AcceptsRoot<StatCardProps>,
  SvgMap: true satisfies AcceptsRoot<SvgMapProps>,
  SvgMapControls: true satisfies AcceptsRoot<SvgMapControlsProps>,
  Text: true satisfies AcceptsRoot<TextProps>,
  Toast: true satisfies AcceptsRoot<ToastProps>,
  Toggle: true satisfies AcceptsRoot<ToggleProps>,
};

interface RootProps {
  ref: RefCallback<Element>;
  id: string;
  'data-testid': string;
  className: string;
  style: CSSProperties;
  'aria-label': string;
}

interface Row {
  readonly name: string;
  readonly render: (props: RootProps) => ReactElement;
  /** L'élément qui reçoit `ref` et les attributs. */
  readonly target: string;
  /** L'élément qui reçoit `className`, quand ce n'est pas la cible (champs). */
  readonly classTarget?: string;
  /** Le nom attendu quand le composant garde le sien (`IconActionButton`). */
  readonly ariaLabel?: string;
}

const NAV = [
  { id: 'a', label: 'Accueil', href: '#a' },
  { id: 'b', label: 'Composants' },
];
const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];
const REGIONS = [{ id: 'r1', path: 'M0 0 L10 0 L10 10 Z', name: 'Région' }];

function Controls(props: RootProps) {
  const viewport = useSvgMapViewport('0 0 100 50');
  return <SvgMapControls {...props} viewport={viewport} />;
}

const ROWS: readonly Row[] = [
  { name: 'Button', render: (p) => <Button {...p}>Ok</Button>, target: 'button' },
  {
    name: 'Button sous verre',
    render: (p) => (
      <Button {...p} liquidGlass>
        Ok
      </Button>
    ),
    target: 'button',
  },
  { name: 'Pressable', render: (p) => <Pressable {...p}>Ok</Pressable>, target: 'button' },
  { name: 'Card', render: (p) => <Card {...p}>Corps</Card>, target: '.opale-card' },
  {
    name: 'Card sous verre',
    render: (p) => (
      <Card {...p} liquidGlass>
        Corps
      </Card>
    ),
    target: '.opale-card',
  },
  { name: 'CardGrid', render: (p) => <CardGrid {...p} />, target: '.opale-card-grid' },
  {
    name: 'Input',
    render: (p) => <Input {...p} label="Nom" />,
    target: 'input',
    classTarget: '.opale-field',
  },
  {
    name: 'InlineInput',
    render: (p) => <InlineInput {...p} label="Nom" />,
    target: 'input',
    classTarget: '.opale-field',
  },
  {
    name: 'Autocomplete',
    render: (p) => <Autocomplete {...p} label="Ville" options={['Lyon']} />,
    target: 'input',
    classTarget: '.opale-field',
  },
  {
    name: 'Checkbox',
    render: (p) => <Checkbox {...p} label="Accepter" />,
    target: 'input[type="checkbox"]',
    classTarget: '.opale-checkbox-row',
  },
  {
    name: 'Toggle',
    render: (p) => <Toggle {...p} label="Actif" />,
    target: 'input[type="checkbox"]',
    classTarget: '.opale-toggle-row',
  },
  {
    name: 'Slider',
    render: (p) => <Slider {...p} label="Volume" />,
    target: 'input[type="range"]',
    classTarget: '.opale-field',
  },
  {
    name: 'Select',
    render: (p) => <Select {...p} label="Pays" options={OPTIONS} />,
    target: 'select',
    classTarget: '.opale-field',
  },
  {
    name: 'MultiSelect',
    render: (p) => <MultiSelect {...p} label="Pays" options={OPTIONS} />,
    target: 'select',
    classTarget: '.opale-field',
  },
  {
    name: 'SegmentedControl',
    render: (p) => <SegmentedControl {...p} options={OPTIONS} />,
    target: '.opale-segmented',
  },
  { name: 'Form', render: (p) => <Form {...p} />, target: 'form' },
  {
    name: 'RatingInput',
    render: (p) => <RatingInput {...p} label="Note" />,
    target: 'fieldset',
  },
  {
    name: 'IconActionButton',
    render: (p) => <IconActionButton {...p} label="Plus" />,
    target: 'button',
    ariaLabel: 'Plus',
  },
  {
    name: 'DataTable',
    render: (p) => <DataTable {...p} columns={[{ key: 'a', label: 'A' }]} rows={[{ a: '1' }]} />,
    target: '.opale-table-panel',
  },
  {
    name: 'DescriptionList',
    render: (p) => <DescriptionList {...p} items={[{ term: 'T', description: 'D' }]} />,
    target: 'dl',
  },
  { name: 'BulletList', render: (p) => <BulletList {...p} items={['Un']} />, target: 'ul' },
  { name: 'Badge', render: (p) => <Badge {...p}>Neuf</Badge>, target: '.opale-badge' },
  {
    name: 'Badge sous verre',
    render: (p) => (
      <Badge {...p} liquidGlass>
        Neuf
      </Badge>
    ),
    target: '.opale-badge',
  },
  { name: 'Rating', render: (p) => <Rating {...p} value={3} />, target: '.opale-rating' },
  {
    name: 'Pagination',
    render: (p) => <Pagination {...p} pageCount={3} />,
    target: 'nav.opale-pagination',
  },
  { name: 'Skeleton', render: (p) => <Skeleton {...p} />, target: '.opale-skeleton' },
  {
    name: 'StatCard',
    render: (p) => <StatCard {...p} label="Ventes" value="12" />,
    target: '.opale-stat-card',
  },
  { name: 'Donut', render: (p) => <Donut {...p} value={40} />, target: '.opale-donut' },
  {
    name: 'LegalLinks',
    render: (p) => <LegalLinks {...p} links={NAV} />,
    target: 'nav.opale-legal-links',
  },
  { name: 'Heading', render: (p) => <Heading {...p}>Titre</Heading>, target: 'h2' },
  { name: 'Text', render: (p) => <Text {...p}>Texte</Text>, target: 'p.opale-text' },
  { name: 'Icon', render: (p) => <Icon {...p} />, target: '.opale-icon' },
  {
    name: 'Feedback',
    render: (p) => <Feedback {...p}>Message</Feedback>,
    target: '.opale-feedback',
  },
  {
    name: 'Feedback sous verre',
    render: (p) => (
      <Feedback {...p} liquidGlass>
        Message
      </Feedback>
    ),
    target: '.opale-feedback',
  },
  { name: 'Toast', render: (p) => <Toast {...p} message="Enregistré" />, target: '.opale-toast' },
  { name: 'Spinner', render: (p) => <Spinner {...p} />, target: '[role="status"]' },
  {
    name: 'ProgressBar',
    render: (p) => <ProgressBar {...p} value={40} />,
    target: '[role="progressbar"]',
    classTarget: '.opale-field',
  },
  {
    name: 'ConfirmDialog',
    render: (p) => <ConfirmDialog {...p} open onOpenChange={() => undefined} />,
    target: '[role="dialog"]',
  },
  { name: 'EmptyState', render: (p) => <EmptyState {...p} />, target: '.opale-empty-state' },
  { name: 'Navbar', render: (p) => <Navbar {...p} items={NAV} />, target: 'nav.opale-nav' },
  { name: 'Menu', render: (p) => <Menu {...p} items={NAV} />, target: 'details' },
  {
    name: 'Link',
    render: (p) => (
      <Link {...p} href="#x">
        Lien
      </Link>
    ),
    target: 'a.opale-link',
  },
  {
    name: 'SidePanel',
    render: (p) => (
      <SidePanel {...p} open onOpenChange={() => undefined}>
        Corps
      </SidePanel>
    ),
    target: '[role="dialog"]',
  },
  {
    name: 'CommandPalette',
    render: (p) => <CommandPalette {...p} open onOpenChange={() => undefined} />,
    target: '[role="dialog"]',
  },
  {
    name: 'Breadcrumb',
    render: (p) => <Breadcrumb {...p} items={NAV} />,
    target: 'nav.opale-breadcrumb',
  },
  {
    name: 'CookieBanner',
    render: (p) => <CookieBanner {...p} storageKey={null} />,
    target: 'section.opale-cookie-banner',
  },
  {
    name: 'SelectionBar',
    render: (p) => <SelectionBar {...p} selectedCount={2} />,
    target: '.opale-selection-bar',
  },
  { name: 'Stack', render: (p) => <Stack {...p} />, target: '.opale-stack' },
  { name: 'Layout', render: (p) => <Layout {...p} />, target: '.opale-layout' },
  { name: 'Divider', render: (p) => <Divider {...p} />, target: 'hr' },
  {
    name: 'BackgroundSurface',
    render: (p) => <BackgroundSurface {...p} />,
    target: '.opale-opaley-background',
  },
  {
    name: 'FileCard (bouton)',
    render: (p) => <FileCard {...p} name="a.pdf" onClick={() => undefined} />,
    target: 'button.opale-file-card',
  },
  {
    name: 'FileCard (statique)',
    render: (p) => <FileCard {...p} name="a.pdf" />,
    target: 'div.opale-file-card',
  },
  { name: 'Dropzone', render: (p) => <Dropzone {...p} />, target: 'label.opale-dropzone' },
  {
    name: 'Lightbox',
    render: (p) => <Lightbox {...p} open src="/a.png" alt="Photo" onOpenChange={() => undefined} />,
    target: '[role="dialog"]',
  },
  { name: 'Clipboard', render: (p) => <Clipboard {...p} value="texte" />, target: 'button' },
  {
    name: 'SvgMap',
    render: (p) => <SvgMap {...p} viewBox="0 0 100 50" regions={REGIONS} controls={false} />,
    target: '.opale-svg-map',
  },
  { name: 'SvgMapControls', render: (p) => <Controls {...p} />, target: '.opale-svg-map-controls' },
  {
    name: 'Modal',
    render: (p) => (
      <Modal {...p} open onOpenChange={() => undefined}>
        Corps
      </Modal>
    ),
    target: '[role="dialog"]',
  },
  {
    name: 'SiteNav',
    render: (p) => <SiteNav {...p} items={[{ id: 'a', href: '/', label: 'Accueil' }]} />,
    target: 'header',
  },
  {
    name: 'PageScaffold',
    render: (p) => <PageScaffold {...p}>Contenu</PageScaffold>,
    target: '[data-opale-page-theme]',
  },
];

function renderRow(row: Row) {
  let captured: Element | null = null;
  const props: RootProps = {
    ref: (node) => {
      captured = node;
    },
    id: 'appelant',
    'data-testid': 'racine',
    className: 'classe-appelante',
    style: { outlineOffset: '3px' },
    'aria-label': 'Nom de l’appelant',
  };
  render(row.render(props));
  return { current: () => captured };
}

describe('les attributs de racine', () => {
  it('devrait déclarer les clés de racine dans les props de chaque composant', () => {
    expect(Object.values(ROOT_PROPS_ARE_TYPED).every(Boolean)).toBe(true);
  });

  it.each(ROWS.map((row) => [row.name, row] as const))(
    'devrait poser ref, id, data-*, className, style et aria-label de %s sur sa cible',
    (_, row) => {
      const ref = renderRow(row);
      const target = document.querySelector<HTMLElement>(row.target);

      expect(target, `cible « ${row.target} » introuvable`).not.toBeNull();
      expect(ref.current()).toBe(target);
      expect(target).toHaveAttribute('id', 'appelant');
      expect(target).toHaveAttribute('data-testid', 'racine');
      expect(target).toHaveAttribute('aria-label', row.ariaLabel ?? 'Nom de l’appelant');
      expect(target?.style.outlineOffset).toBe('3px');

      const classHolder = document.querySelector(row.classTarget ?? row.target);
      expect(classHolder).toHaveClass('classe-appelante');
      /* La classe de l'appelant S'AJOUTE à celle du composant. */
      expect(classHolder?.classList.length).toBeGreaterThan(1);
    },
  );
});

/* =============================================================================
   CE QUE L'APPELANT NE PEUT PAS ÉCRASER.

   Les attributs qui portent le contrat d'accessibilité ou le repère stable du
   composant passent APRÈS `...rest`. Chaque ligne tente de les écraser.
   ========================================================================== */
interface ContractRow {
  readonly name: string;
  readonly element: ReactElement;
  readonly target: string;
  readonly expected: Readonly<Record<string, string>>;
}

/* Le panneau, trouvé sans compter sur le rôle qu'on tente d'écraser. */
const PANEL = '[data-testid="modal-container"] > div:not([data-testid="modal-overlay"])';

const CONTRACTS: readonly ContractRow[] = [
  {
    name: 'Rating',
    element: <Rating value={3} role="presentation" data-opale-rating="9" />,
    target: '.opale-rating',
    expected: { role: 'img', 'data-opale-rating': '3' },
  },
  {
    name: 'Skeleton',
    element: <Skeleton aria-hidden={false} />,
    target: '.opale-skeleton',
    expected: { 'aria-hidden': 'true' },
  },
  {
    name: 'Feedback',
    element: (
      <Feedback tone="error" role="presentation">
        Échec
      </Feedback>
    ),
    target: '.opale-feedback',
    expected: { role: 'alert' },
  },
  {
    name: 'Modal',
    element: (
      <Modal open onOpenChange={() => undefined} role="alertdialog" aria-modal={false} tabIndex={0}>
        Corps
      </Modal>
    ),
    target: PANEL,
    expected: { role: 'dialog', 'aria-modal': 'true', tabindex: '-1' },
  },
  {
    name: 'ConfirmDialog',
    element: <ConfirmDialog open role="alertdialog" aria-modal={false} />,
    target: PANEL,
    expected: { role: 'dialog', 'aria-modal': 'true' },
  },
  {
    name: 'ProgressBar',
    element: <ProgressBar value={40} role="meter" aria-valuenow={5} aria-valuemax={10} />,
    target: '.opale-progress',
    expected: { role: 'progressbar', 'aria-valuenow': '40', 'aria-valuemax': '100' },
  },
  {
    name: 'FileCard',
    element: <FileCard name="a.pdf" selected onClick={() => undefined} aria-pressed={false} />,
    target: '.opale-file-card',
    expected: { 'aria-pressed': 'true' },
  },
  {
    name: 'Toast',
    element: <Toast message="Ok" tone="success" data-opale-toast-tone="error" />,
    target: '.opale-toast',
    expected: { 'data-opale-toast-tone': 'success' },
  },
  {
    name: 'Spinner',
    element: <Spinner role="presentation" />,
    target: '.opale-stack',
    expected: { role: 'status' },
  },
  {
    name: 'Donut',
    element: <Donut value={40} role="presentation" />,
    target: '.opale-donut',
    expected: { role: 'img' },
  },
  {
    name: 'SegmentedControl',
    element: <SegmentedControl options={OPTIONS} role="radiogroup" />,
    target: '.opale-segmented',
    expected: { role: 'group' },
  },
];

describe('les attributs de contrat', () => {
  it.each(CONTRACTS.map((row) => [row.name, row] as const))(
    'devrait garder les attributs de contrat de %s',
    (_, row) => {
      render(row.element);
      const target = document.querySelector(row.target);

      expect(target, `cible « ${row.target} » introuvable`).not.toBeNull();
      for (const [name, value] of Object.entries(row.expected)) {
        expect(target, name).toHaveAttribute(name, value);
      }
    },
  );

  it('devrait laisser l’appelant régler la taille du squelette par style', () => {
    render(<Skeleton width="10px" style={{ width: '20px' }} />);

    expect(document.querySelector<HTMLElement>('.opale-skeleton')?.style.width).toBe('20px');
  });

  it('devrait garder les variables vitales de Donut et SvgMap sous le style de l’appelant', () => {
    render(
      <>
        <Donut value={40} style={{ color: 'red' }} />
        <SvgMap viewBox="0 0 100 50" regions={REGIONS} controls={false} style={{ color: 'red' }} />
      </>,
    );
    const donut = document.querySelector<HTMLElement>('.opale-donut');
    const map = document.querySelector<HTMLElement>('.opale-svg-map');

    expect(donut?.style.getPropertyValue('--opale-donut-value')).toBe('40%');
    expect(donut?.style.color).toBe('red');
    expect(map?.style.getPropertyValue('--opale-svg-map-ratio')).toBe('100 / 50');
    expect(map?.style.color).toBe('red');
  });

  it('devrait appeler le gestionnaire de l’appelant après celui du composant', () => {
    const onKeyDown = vi.fn();
    const onDragEnter = vi.fn();
    render(
      <>
        <SvgMap viewBox="0 0 100 50" regions={REGIONS} controls={false} onKeyDown={onKeyDown} />
        <Dropzone onDragEnter={onDragEnter} />
      </>,
    );

    fireEvent.keyDown(screen.getByRole('img', { name: 'Carte' }), { key: '0' });
    fireEvent.dragEnter(document.querySelector('.opale-dropzone') ?? document.body);

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.opale-dropzone')).toHaveAttribute('data-dragging', 'true');
  });
});

/* =============================================================================
   LES CHAMPS SE BRANCHENT COMME UN CHAMP NATIF.

   Une bibliothèque de formulaires comme react-hook-form enregistre un champ par
   sa `ref` et relit `checked` ou `value` sur le nœud. La ref doit donc être
   celle du contrôle natif, et la mécanique interne du composant doit survivre
   à la ref externe.
   ========================================================================== */
describe('les refs des champs', () => {
  it('devrait laisser lire checked sur Checkbox et Toggle après un clic', async () => {
    const user = userEvent.setup();
    const checkbox = createRef<HTMLInputElement>();
    const toggle = createRef<HTMLInputElement>();
    render(
      <>
        <Checkbox ref={checkbox} label="Accepter" />
        <Toggle ref={toggle} label="Actif" />
      </>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Accepter' }));
    await user.click(screen.getByRole('switch', { name: 'Actif' }));

    expect(checkbox.current?.checked).toBe(true);
    expect(toggle.current?.checked).toBe(true);
  });

  it('devrait laisser lire value sur Select après un choix', async () => {
    const user = userEvent.setup();
    const select = createRef<HTMLSelectElement>();
    render(<Select ref={select} label="Pays" options={OPTIONS} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Pays' }), 'b');

    expect(select.current?.value).toBe('b');
  });

  it('devrait poser la ref externe de Slider sans couper sa progression', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Slider ref={ref} label="Volume" defaultValue={40} />);
    const input = screen.getByRole('slider');
    const shell = input.parentElement;

    expect(ref.current).toBe(input);
    expect(shell?.style.getPropertyValue('--opale-range-progress')).toBe('0.4');

    fireEvent.change(input, { target: { value: '75' } });

    expect(ref.current?.value).toBe('75');
    expect(shell?.style.getPropertyValue('--opale-range-progress')).toBe('0.75');
  });

  it('devrait poser la ref externe de MultiSelect sur le select natif, qui suit la sélection', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLSelectElement>();
    render(<MultiSelect ref={ref} label="Pays" options={OPTIONS} />);

    await user.click(screen.getByRole('option', { name: 'B' }));

    expect(ref.current?.tagName).toBe('SELECT');
    expect(Array.from(ref.current?.selectedOptions ?? [], (option) => option.value)).toEqual(['b']);
  });

  it('devrait poser la ref externe de SegmentedControl sans cesser de placer la pastille', () => {
    const rect = (left: number, width: number): DOMRect => ({
      bottom: 36,
      height: 36,
      left,
      right: left + width,
      top: 0,
      width,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('opale-segmented')) return rect(0, 240);
      if (this.getAttribute('aria-pressed') === 'true') return rect(130, 72);
      return rect(0, 36);
    });
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<SegmentedControl ref={ref} options={OPTIONS} defaultValue="b" />);
    const indicator = container.querySelector<HTMLElement>('.opale-segmented__indicator');

    expect(ref.current).toBe(screen.getByRole('group'));
    expect(indicator?.style.width).toBe('72px');
    expect(indicator?.style.transform).toBe('translate3d(130px, 0px, 0)');
  });

  it('devrait poser la ref externe de Modal sans perdre le focus du panneau', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Modal ref={ref} open title="Titre" onOpenChange={() => undefined}>
        Corps
      </Modal>,
    );

    expect(ref.current).toBe(screen.getByRole('dialog'));
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });
});
