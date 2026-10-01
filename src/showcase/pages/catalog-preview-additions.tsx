import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';

import {
  Button,
  Carousel,
  Checkbox,
  CarouselSlide,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Grid,
  IconActionButton,
  Input,
  Marquee,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  Reveal,
  ScrollSection,
  ScrollStage,
  SegmentedControl,
  SplitHeading,
  Textarea,
  Toggle,
  Tooltip,
  type FieldControlProps,
  type ScrollGround,
} from '../../opale';

/* =============================================================================
   LES DÉMONSTRATIONS DES COMPOSANTS DE LA 2.10.0.

   Elles vivent à part de `catalog-preview.tsx` pour une raison de lecture, pas
   de chargement : chacune tient son propre état, là où l'aperçu commun partage
   une vingtaine de `useState` entre toutes les fiches. `CatalogPreview` les
   appelle depuis son `switch`, en leur transmettant le matériau.

   Les composants s'importent par leur nom : le namespace `Opale` ne les
   recense pas encore.
   ========================================================================== */

interface DemoProps {
  readonly liquidGlass: boolean;
}

const COMMENT_LIMIT = 200;

export function TextareaDemo({ liquidGlass }: DemoProps) {
  return (
    <div className="tc-doc-opale-demo">
      <Textarea
        liquidGlass={liquidGlass}
        label="Commentaire"
        helperText="Le champ grandit avec le texte, jusqu’à six lignes."
        autoResize
        maxRows={6}
        showCount
        maxLength={COMMENT_LIMIT}
        defaultValue="Le nouveau composant se lit bien au clavier."
      />
      <Textarea
        liquidGlass={liquidGlass}
        label="Note interne"
        size="small"
        minRows={2}
        error="La note ne peut pas rester vide."
      />
    </div>
  );
}

const PLANS = [
  { value: 'free', label: 'Gratuit', description: 'Un projet, sans équipe.' },
  { value: 'pro', label: 'Pro', description: 'Projets illimités.' },
  { value: 'team', label: 'Équipe', description: 'Disponible bientôt.', disabled: true },
] as const;

const BILLING = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
] as const;

export function RadioGroupDemo({ liquidGlass }: DemoProps) {
  const [plan, setPlan] = useState('');

  return (
    <div className="tc-doc-opale-demo">
      <RadioGroup
        liquidGlass={liquidGlass}
        label="Formule"
        helperText="Vous pourrez en changer à tout moment."
        options={PLANS}
        value={plan}
        onValueChange={setPlan}
        required
        error={plan === '' ? 'Choisissez une formule.' : undefined}
      />
      <RadioGroup
        liquidGlass={liquidGlass}
        label="Facturation"
        orientation="horizontal"
        size="small"
        options={BILLING}
        defaultValue="yearly"
      />
    </div>
  );
}

const SEATS_MIN = 1;
const SEATS_MAX = 9;
const SEATS_SELF_SERVICE = 6;

/* UN CONTRÔLE ÉCRIT PAR L'APPLICATION : un compteur `role="spinbutton"`. Un
   `<label for>` ne nomme pas un `<span>` ; c'est l'`aria-labelledby` que
   `Field` lui confie qui le fait. Le clavier suit le motif « Spinbutton » de
   l'APG : flèches, Début et Fin. */
function SeatStepper({
  value,
  onValueChange,
  ...fieldProps
}: FieldControlProps & { value: number; onValueChange: (value: number) => void }) {
  const set = (next: number) => onValueChange(Math.min(SEATS_MAX, Math.max(SEATS_MIN, next)));
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const next =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? value + 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? value - 1
          : event.key === 'Home'
            ? SEATS_MIN
            : event.key === 'End'
              ? SEATS_MAX
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    set(next);
  };

  return (
    <div className="tc-doc-stepper">
      <Button
        variant="secondary"
        size="small"
        aria-label="Retirer une place"
        disabled={value <= SEATS_MIN}
        onClick={() => set(value - 1)}
      >
        −
      </Button>
      <span
        {...fieldProps}
        className="tc-doc-stepper__value"
        role="spinbutton"
        tabIndex={0}
        aria-valuemin={SEATS_MIN}
        aria-valuemax={SEATS_MAX}
        aria-valuenow={value}
        aria-valuetext={`${value} place${value > 1 ? 's' : ''}`}
        onKeyDown={onKeyDown}
      >
        {value}
      </span>
      <Button
        variant="secondary"
        size="small"
        aria-label="Ajouter une place"
        disabled={value >= SEATS_MAX}
        onClick={() => set(value + 1)}
      >
        +
      </Button>
    </div>
  );
}

export function FieldDemo() {
  const [seats, setSeats] = useState(3);

  return (
    <Field
      label="Nombre de places"
      description={`De ${SEATS_MIN} à ${SEATS_MAX}, aux flèches ou avec les boutons.`}
      error={
        seats > SEATS_SELF_SERVICE
          ? `Au-delà de ${SEATS_SELF_SERVICE} places, l’équipe commerciale vous recontacte.`
          : undefined
      }
      required
    >
      {(fieldProps) => <SeatStepper {...fieldProps} value={seats} onValueChange={setSeats} />}
    </Field>
  );
}

const GRID_COLUMNS = [
  { value: '2', label: '2 colonnes' },
  { value: '3', label: '3 colonnes' },
  { value: '9rem', label: 'Largeur 9 rem' },
] as const;

const GRID_CELLS = ['Design', 'Code', 'Tests', 'Revue', 'Docs', 'Envoi'] as const;

export function GridDemo() {
  const [columns, setColumns] = useState<string>('3');
  const track = /^\d+$/.test(columns) ? Number(columns) : columns;

  return (
    <div className="tc-doc-opale-demo">
      <SegmentedControl
        aria-label="Colonnes de la grille"
        options={GRID_COLUMNS}
        value={columns}
        onValueChange={setColumns}
      />
      <Grid columns={track} gap="sm">
        {GRID_CELLS.map((cell) => (
          <div key={cell} className="tc-doc-grid-cell">
            {cell}
          </div>
        ))}
      </Grid>
    </div>
  );
}

/* Les six diapositives de la planche de direction artistique : une famille
   d'Opale chacune, et son glyphe. */
const CAROUSEL_SLIDES = [
  ['Button', 'Saisie · tons, tailles, verre liquide en option'],
  ['Textarea', 'Formulaires · grandit avec le texte, compteur annoncé'],
  ['Popover', 'Couches flottantes · focus gardé, Échap rendu'],
  ['DataTable', 'Affichage · générique, sélection de lignes'],
  ['Carousel', 'Nouveau en 3.0 · ce que vous faites défiler en ce moment'],
  ['SplitHeading', 'Nouveau en 3.0 · un titre qui arrive mot à mot'],
] as const;

/* Les mêmes diapositives, avec ou sans lecture automatique. Une fonction
   appelée, pas un composant : le carrousel compte ses enfants directs, et un
   composant qui les rendrait les lui cacherait. */
function carouselSlides() {
  return CAROUSEL_SLIDES.map(([name, text], index) => (
    <CarouselSlide key={name} className="tc-doc-carousel-slide">
      <span className="tc-doc-carousel-glyph" aria-hidden="true" data-glyph={index} />
      <div>
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
    </CarouselSlide>
  ));
}

/* Deux carrousels : le premier à la main, le second en lecture automatique
   — bouton pause en tête, pause au survol et au focus. */
export function CarouselDemo() {
  return (
    <div className="tc-doc-carousel-demo">
      <Carousel label="Composants d’Opale" className="tc-doc-carousel">
        {carouselSlides()}
      </Carousel>
      <p className="tc-doc-carousel-caption">Lecture automatique, une diapositive toutes les 4 s</p>
      <Carousel
        label="Composants d’Opale, en lecture automatique"
        autoPlay={4000}
        className="tc-doc-carousel"
      >
        {carouselSlides()}
      </Carousel>
    </div>
  );
}

/* Les preuves de la bande « qualités » de la planche : assez de cartes pour
   que les dernières soient sous la vue et montent quand on défile. */
const REVEAL_ITEMS = [
  ['Accessible', 'Sémantique native, clavier complet, contrastes forcés'],
  ['Sans dépendance', 'React et clsx, rien d’autre au poids de l’import'],
  ['Rendu serveur', 'Visible au repos, sans attendre un script'],
  ['Verre liquide', 'Une matière en option, jamais une condition'],
  ['Mouvement sobre', 'Seuls transform et opacity s’animent'],
  ['Thèmes', 'Clair, sombre et contrastes forcés, aux mêmes jetons'],
  ['Impression', 'Tout est là, à l’état final, sur papier'],
  ['Mouvement réduit', 'Aucune montée, le contenu simplement présent'],
  ['Typé', 'TypeScript strict, chaque prop documentée'],
] as const;

/* Une colonne de cartes : chaque `Reveal` est un `<li>` enfant direct de la
   liste, et son rang dans la rangée de trois règle la cascade. */
export function RevealDemo() {
  return (
    <ul className="tc-doc-reveal-demo" aria-label="Les qualités d’Opale">
      {REVEAL_ITEMS.map(([name, text], index) => (
        <Reveal key={name} as="li" delay={index % 3} className="tc-doc-reveal-card">
          <h3>{name}</h3>
          <p>{text}</p>
        </Reveal>
      ))}
    </ul>
  );
}

/* Les garanties de la bande « qualités » de la planche, en enfants directs :
   le bandeau les rend une fois pour les lecteurs d'écran, et une seconde
   fois, masquée, pour la boucle. */
export function MarqueeDemo() {
  return (
    <Marquee label="Ce qu’Opale garantit" className="tc-doc-marquee-demo">
      <span>WCAG 2.2 AA</span>
      <span>React 19</span>
      <span>Rendu serveur</span>
      <span>Verre liquide</span>
      <span>Aucune dépendance</span>
    </Marquee>
  );
}

/* Deux titres : le premier joue au montage, et « Rejouer » le remonte (une
   nouvelle clé) ; le second, posé sous la ligne de flottaison par la marge de
   la démo, part quand il entre dans la vue — une seule fois. */
export function SplitHeadingDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="tc-doc-split-demo">
      <Button variant="secondary" onClick={() => setRun(run + 1)}>
        Rejouer
      </Button>
      <SplitHeading key={run} level={3} trigger="mount">
        Un titre qui prend son temps.
      </SplitHeading>
      <p>Plus bas, un second titre attend d’entrer dans la vue.</p>
      <SplitHeading level={3} className="tc-doc-split-demo__below">
        Celui-ci part quand on le voit.
      </SplitHeading>
    </div>
  );
}

/* Les quatre fonds de la planche, chacun avec son nom lisible et sa phrase. */
const SCROLL_GROUNDS: readonly (readonly [ScrollGround, string, string])[] = [
  ['paper', 'Papier', 'Le fond de la page : la surface et l’encre du thème.'],
  ['amber', 'Ambre', 'L’accent d’Opale, sous une encre presque noire.'],
  ['night', 'Nuit', 'Un vert presque noir ; les composants y passent en thème sombre.'],
  ['blue', 'Bleu', 'Le primaire d’Opale, sous une encre blanche.'],
];

/* Une scène aux quatre fonds, assez haute pour défiler. L'étiquette collante
   n'est dans aucune section : elle lit le couple actif de la scène
   (`--opale-stage-ground` / `--opale-stage-ink`), qui change d'un coup. Son
   nom du fond suit `data-ground` par la feuille — juste dès le montage, même
   au milieu de la page ; `onGroundChange`, qui ne part qu'au défilement,
   compte les changements. Les gouttières montrent le fondu du fond propre de
   la scène. */
export function ScrollSectionDemo() {
  const id = useId();
  const [changes, setChanges] = useState(0);
  return (
    <ScrollStage
      className="tc-doc-stage-demo"
      onGroundChange={() => setChanges((count) => count + 1)}
    >
      <p className="tc-doc-stage-demo__label">
        Fond actif :{' '}
        {SCROLL_GROUNDS.map(([value, title]) => (
          <span key={value} data-name={value}>
            {title}
          </span>
        ))}
        {` · ${changes} changement${changes > 1 ? 's' : ''}`}
      </p>
      {SCROLL_GROUNDS.map(([value, title, text]) => (
        <ScrollSection
          key={value}
          ground={value}
          aria-labelledby={`${id}-${value}`}
          className="tc-doc-stage-demo__section"
        >
          <h3 id={`${id}-${value}`}>{title}</h3>
          <p>{text}</p>
          <div className="tc-doc-opale-preview__row">
            <Button>Action principale</Button>
            <Button variant="secondary">Action secondaire</Button>
          </div>
          {/* Le bleu inverse le primaire : une case cochée et un interrupteur
              actif montrent que l'inversion leur va aussi. */}
          {value === 'blue' && (
            <div className="tc-doc-opale-preview__row">
              <Checkbox label="Option cochée" defaultChecked />
              <Toggle label="Réglage actif" role="switch" defaultChecked />
            </div>
          )}
        </ScrollSection>
      ))}
      {/* Une bande plus courte que la demi-vue : elle ne croise jamais le
          milieu, et devient active en bas de page, ou quand elle le touche. */}
      <ScrollSection
        ground="amber"
        aria-labelledby={`${id}-end`}
        className="tc-doc-stage-demo__section tc-doc-stage-demo__section--short"
      >
        <h3 id={`${id}-end`}>Fin de la scène</h3>
        <p>Une bande courte, active quand elle contient le milieu de la vue.</p>
      </ScrollSection>
    </ScrollStage>
  );
}

export function TooltipDemo({ liquidGlass }: DemoProps) {
  return (
    <div className="tc-doc-opale-preview__row">
      <Tooltip liquidGlass={liquidGlass} content="Enregistre le brouillon sans le publier.">
        <Button variant="secondary">Enregistrer</Button>
      </Tooltip>
      <Tooltip
        liquidGlass={liquidGlass}
        content="Copie l’adresse de cette page."
        placement="bottom"
      >
        <IconActionButton icon="share" label="Partager" />
      </Tooltip>
    </div>
  );
}

export function PopoverDemo({ liquidGlass }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Opale UI');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new FormData(event.currentTarget).get('name');
    if (typeof next === 'string' && next.trim() !== '') setName(next.trim());
    setOpen(false);
  };

  return (
    <div className="tc-doc-opale-demo">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="opale-button opale-button--secondary">
          Renommer le projet
        </PopoverTrigger>
        <PopoverContent liquidGlass={liquidGlass} placement="bottom" align="start">
          <form className="tc-doc-popover-form" onSubmit={onSubmit}>
            <Input label="Nom du projet" name="name" defaultValue={name} required />
            <Button type="submit" size="small">
              Enregistrer
            </Button>
          </form>
        </PopoverContent>
      </Popover>
      <span role="status">Projet : {name}</span>
    </div>
  );
}

const SORTS = [
  { value: 'name', label: 'Trier par nom' },
  { value: 'date', label: 'Trier par date' },
] as const;

export function DropdownMenuDemo({ liquidGlass }: DemoProps) {
  const [last, setLast] = useState('aucune');
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState<string>('name');

  return (
    <div className="tc-doc-opale-demo">
      <DropdownMenu>
        <DropdownMenuTrigger className="opale-button opale-button--secondary">
          Actions
        </DropdownMenuTrigger>
        <DropdownMenuContent liquidGlass={liquidGlass}>
          <DropdownMenuItem onSelect={() => setLast('dupliquer')}>Dupliquer</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast('renommer')}>Renommer</DropdownMenuItem>
          <DropdownMenuItem disabled onSelect={() => setLast('archiver')}>
            Archiver
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            Afficher la grille
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup label="Tri" value={sort} onValueChange={setSort}>
            {SORTS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span role="status">
        Dernière action : {last} · grille {grid ? 'affichée' : 'masquée'} · tri par{' '}
        {sort === 'name' ? 'nom' : 'date'}
      </span>
    </div>
  );
}
