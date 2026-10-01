import { useState, type FormEvent, type KeyboardEvent } from 'react';

import {
  Button,
  Carousel,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  SegmentedControl,
  Textarea,
  Tooltip,
  type FieldControlProps,
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

/* Les mêmes diapositives, avec ou sans lecture automatique. */
function CarouselSlides() {
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
        <CarouselSlides />
      </Carousel>
      <p className="tc-doc-carousel-caption">Lecture automatique, une diapositive toutes les 4 s</p>
      <Carousel
        label="Composants d’Opale, en lecture automatique"
        autoPlay={4000}
        className="tc-doc-carousel"
      >
        <CarouselSlides />
      </Carousel>
    </div>
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
