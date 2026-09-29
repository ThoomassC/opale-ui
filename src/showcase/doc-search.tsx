import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Opale } from '../opale';

import type { DocPage } from './doc-model';
import { hrefFor } from './doc-model';
import {
  copyFor,
  groupLabelFor,
  localizedPages,
  searchCountMessage,
  type Language,
} from './localization';
import { MAX_SUGGESTIONS, searchPages } from './search-model';

/* =============================================================================
   LA RECHERCHE DE LA VITRINE — un `combobox` avec liste de suggestions.

   C'EST LE MOTIF LE PLUS FACILE À RATER DE TOUT ARIA, et le rater ne se voit
   pas à la souris. Ce qui est implémenté ici est le motif « Combobox » de
   l'APG, dans sa forme à liste : `role="combobox"` SUR LE CHAMP, la liste
   référencée par `aria-controls`, l'option courante désignée par
   `aria-activedescendant` — et non par le focus, qui ne quitte jamais le champ.

   POURQUOI `aria-activedescendant` ET PAS UN VRAI FOCUS SUR L'OPTION. Déplacer
   le focus dans la liste avec les flèches paraît plus simple et casse deux
   choses : la frappe suivante n'arrive plus dans le champ (il faudrait la
   réacheminer), et le lecteur d'écran annonce l'option en PERDANT le contexte
   du champ, si bien qu'on ne sait plus dans quoi on tape. Avec
   `activedescendant`, le focus reste au champ, la frappe continue d'y arriver,
   et l'option courante est annoncée en plus du champ.

   AUCUN RACCOURCI GLOBAL, ET C'EST UNE DÉCISION. Un `⌘K` aurait fait moderne,
   et il détourne un raccourci du navigateur — dans Chrome, `⌘K` met le curseur
   dans la barre d'adresse en mode recherche. Un `/` est pire : il vole la
   frappe dès que le focus est dans un champ, et cette vitrine est pleine de
   spécimens d'`Input`. Le champ est visible dans la barre du haut et atteint
   par `Tab` : c'est moins spectaculaire et ça ne prend rien à personne.

   AUCUN AMORTISSEMENT NON PLUS. Vingt-quatre pages, un balayage linéaire par
   frappe : le `useMemo` ci-dessous ne recalcule que sur changement de requête,
   et il n'y a rien à différer. Un `debounce` de 150 ms n'aurait fait
   qu'introduire un décalage entre ce qui est tapé et ce qui est annoncé.
   ========================================================================== */

/**
 * La phrase annoncée pour un compte. Hors du composant parce qu'elle est pure :
 * elle sert de dépendance STABLE au report de 400 ms, là où une valeur
 * reconstruite à chaque rendu relancerait le minuteur sans arrêt.
 *
 * ELLE DIT LE TOTAL ET NON LE NOMBRE AFFICHÉ. Au-delà de huit, la liste est
 * tronquée ; annoncer « 8 résultats » là où il y en a douze laisserait croire
 * qu'affiner ne sert à rien.
 */
function countMessage(query: string, total: number, language: Language): string {
  if (query.trim().length === 0) return '';
  return searchCountMessage(language, total, MAX_SUGGESTIONS);
}

export interface DocSearchProps {
  readonly pages: readonly DocPage[];
  readonly language?: Language;
}

/**
 * Le champ de recherche de la barre du haut.
 *
 * Il ne connaît pas la route : choisir une suggestion écrit le fragment, et
 * c'est la coquille qui rend la page ET déplace le focus sur son titre. Rien
 * n'est à faire ici pour le focus — le tenter le disputerait à la coquille.
 */
export function DocSearch({ pages, language = 'FR' }: DocSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setOpen] = useState(false);
  /* L'index de l'option courante, ou `-1` quand il n'y en a pas. Un nombre et
     non l'objet suggestion : la liste est reconstruite à chaque frappe, donc
     une référence d'objet y serait périmée d'un rendu sur l'autre. */
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  /* L'enveloppe sert à savoir si le focus SORT vraiment du composant : sans
     elle, cliquer une suggestion faisait perdre le focus au champ, donc
     fermait le panneau, donc annulait le clic avant qu'il n'arrive. */
  const wrapperRef = useRef<HTMLDivElement>(null);

  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const listRef = useRef<HTMLUListElement>(null);

  const copy = copyFor(language);
  const searchablePages = useMemo(() => localizedPages(pages, language), [language, pages]);
  const { suggestions, total } = useMemo(
    () => searchPages(searchablePages, query),
    [query, searchablePages],
  );

  /* Trois états distincts :
     — `hasQuery` : il y a quelque chose à chercher ;
     — `isPanelOpen` : le panneau est ouvert, résultats ou message d'absence ;
       c'est lui que `Échap` referme ;
     — `isListShown` : la `listbox` est dans l'arbre, avec au moins une option.
       C'est lui seul que dit `aria-expanded` : ARIA interdit une `listbox`
       sans `option`. */
  const hasQuery = query.trim().length > 0;
  const isPanelOpen = isOpen && hasQuery;
  const isListShown = isPanelOpen && suggestions.length > 0;
  const activeSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;

  function close(): void {
    setOpen(false);
    setActiveIndex(-1);
  }

  /* Le panneau fait défiler l'option désignée jusqu'à la rendre visible :
     `aria-activedescendant` ne déplace aucun pixel, et une option désignée
     hors champ n'est pas visible (WCAG 1.4.11, 2.4.7). `block: 'nearest'`
     bouge le moins possible. L'appel est optionnel parce que jsdom ne
     l'implémente pas ; l'index des enfants est la position de l'option, la
     rangée « aucun résultat » vivant hors du `<ul>`. */
  useEffect(() => {
    if (activeIndex < 0) return;
    const option = listRef.current?.children[activeIndex];
    if (option instanceof HTMLElement) option.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  /* Le compte annoncé attend 400 ms de calme dans la frappe : `aria-live="polite"`
     met les annonces en file sans les regrouper. Le filtrage affiché, lui,
     reste immédiat. */
  const [announced, setAnnounced] = useState('');
  const message = countMessage(query, total, language);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(message), 400);
    return () => window.clearTimeout(timer);
  }, [message]);

  /** Navigue vers une suggestion, puis vide le champ. */
  function choose(slug: string): void {
    /* `location.hash` et non `history.pushState` : tout le routage de la
       vitrine lit le fragment, et `pushState` n'émet PAS `hashchange`. La page
       n'aurait pas changé. */
    window.location.hash = hrefFor(slug);
    setQuery('');
    close();
  }

  /* Le clavier, dans l'ordre de l'APG. `preventDefault` sur les flèches et sur
     `Entrée` : sans lui, la flèche déplace le curseur dans le texte pendant
     qu'elle déplace l'option, et `Entrée` soumet le formulaire s'il y en a un
     autour — la barre du haut n'en a pas aujourd'hui, mais un champ de
     recherche qui dépend de l'absence de formulaire est un champ fragile. */
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isListShown) {
        setOpen(true);
        setActiveIndex(suggestions.length > 0 ? 0 : -1);
        return;
      }
      if (suggestions.length === 0) return;
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    /* `Début` et `Fin` restent au champ : sur un combobox éditable, l'APG les
       rend au déplacement du curseur dans le texte. */

    if (event.key === 'Enter') {
      /* `Entrée` est toujours neutralisée, pour qu'un `<form>` englobant ne soit
         jamais soumis. Elle n'ouvre que la suggestion désignée ; sans
         désignation, elle ne fait rien — surtout pas ouvrir la première. */
      event.preventDefault();
      if (activeSuggestion) {
        choose(activeSuggestion.page.slug);
      }
      return;
    }

    if (event.key === 'Escape') {
      /* DEUX ÉCHAPPEMENTS, ET C'EST L'APG : le premier ferme la liste en
         gardant le texte, le second vide le champ. Vider dès le premier fait
         perdre une requête qu'on voulait juste corriger. */
      event.preventDefault();
      if (isPanelOpen) {
        close();
        return;
      }
      setQuery('');
      return;
    }

    if (event.key === 'Tab') {
      /* Pas de `preventDefault` : `Tab` doit sortir du champ. On ferme
         seulement, sinon le panneau resterait ouvert au-dessus du contenu
         alors que le focus est parti ailleurs. */
      close();
    }
  }

  return (
    <div
      className="tc-doc-search"
      ref={wrapperRef}
      onBlur={(event) => {
        /* `relatedTarget` est l'élément qui REÇOIT le focus. S'il est encore
           dans l'enveloppe, le focus n'a pas quitté le composant et il n'y a
           rien à fermer. `null` — clic dans le vide, changement d'onglet —
           compte comme une sortie. */
        const next = event.relatedTarget;
        if (next instanceof Node && wrapperRef.current?.contains(next)) return;
        close();
      }}
    >
      {/* Un vrai `<label>`, masqué visuellement : le nom « Rechercher une page »
         survit à la frappe, contrairement au `placeholder`. Le `placeholder` est
         contenu dans le nom accessible (WCAG 2.5.3). */}
      <label className="tc-visually-hidden" htmlFor={inputId}>
        {copy.searchLabel}
      </label>

      <Opale.SearchBar
        className="tc-doc-search__input"
        id={inputId}
        ref={inputRef}
        type="text"
        role="combobox"
        /* `aria-expanded` DIT LA LISTE, pas l'intention. Il est faux quand la
           requête est vide, même si le champ a le focus : il n'y a alors aucune
           liste, et l'annoncer développée est un mensonge que le lecteur
           d'écran répète. */
        aria-expanded={isListShown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeSuggestion ? optionId(activeIndex) : undefined}
        /* `off` sur les deux : le navigateur proposerait ses propres
           complétions par-dessus le panneau, et le lecteur d'écran annoncerait
           deux listes concurrentes. `autoCorrect` et `spellCheck` n'ont rien à
           faire sur des noms de composants. */
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={copy.searchPlaceholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          /* L'OPTION COURANTE EST REMISE À ZÉRO À CHAQUE FRAPPE. La garder
             pointerait sur une autre page dès que la liste change de contenu :
             on aurait désigné « Button » puis validé « Card » sans rien voir
             bouger. */
          setActiveIndex(-1);
        }}
        onKeyDown={onKeyDown}
      />

      {/* LA LISTE EXISTE TOUJOURS DANS LE DOM, et c'est ce qui rend
          `aria-controls` honnête : il doit désigner un élément présent, sinon
          la référence est cassée pour les technologies d'assistance qui la
          résolvent au chargement. Vide et `hidden` quand il n'y a rien —
          `hidden` la retire de l'arbre d'accessibilité comme de la peinture. */}
      <ul
        className="tc-doc-search__list"
        id={listId}
        role="listbox"
        aria-label={copy.suggestions}
        ref={listRef}
        hidden={!isListShown}
      >
        {suggestions.map((suggestion, index) => (
          /* eslint-disable-next-line jsx-a11y/click-events-have-key-events --
             LA RÈGLE SE TROMPE ICI, ET LA RAISON EST LE MOTIF LUI-MÊME. Elle
             exige un écouteur clavier sur tout élément non interactif qui porte
             un `onClick`. Dans un combobox à `aria-activedescendant`, le focus
             NE QUITTE JAMAIS le champ : l'option n'est pas focusable, elle ne
             peut donc pas recevoir d'événement clavier, et lui en attacher un
             serait du code mort. Le clavier est entièrement câblé sur l'input —
             flèches, Début, Fin, Entrée, Échap — et c'est là que l'APG le
             place. Ajouter un `onKeyDown` sur le `<li>` ferait taire la règle
             sans rien rendre atteignable : ce serait le pire des deux. */
          <li
            className="tc-doc-search__option"
            id={optionId(index)}
            key={suggestion.page.slug}
            role="option"
            aria-selected={index === activeIndex}
            /* `onMouseDown` AVEC `preventDefault`, ET C'EST LA CORRECTION D'UN
               DÉFAUT CLASSIQUE : sans lui, appuyer sur une option retire le
               focus au champ AVANT que le clic ne soit émis, le `blur` ferme le
               panneau, l'option disparaît sous le doigt et le clic n'atteint
               plus rien. Empêcher le défaut du `mousedown` empêche justement le
               transfert de focus. */
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(suggestion.page.slug)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span className="tc-doc-search__label">{suggestion.page.label}</span>
            <span className="tc-doc-search__group">
              {groupLabelFor(suggestion.page.group, suggestion.groupLabel, language)}
            </span>
          </li>
        ))}
      </ul>

      {/* LE MESSAGE VIDE EST DEHORS, pour que la liste n'ait jamais d'enfant
          qui ne soit pas une `option`. Une `role="listbox"` DOIT contenir des
          `option` — ARIA 1.2 l'exige et `axe-core` le relève en `critical` :
          « Required ARIA children role not present: group, option ». La rangée
          y était en `role="presentation"`, ce qui retire le rôle du `<li>` mais
          LAISSE SON TEXTE dans l'arbre : l'arbre exposait `listbox →
          StaticText`, une liste dont l'enfant est du texte nu.

          `aria-hidden` en plus, parce que la région live dit déjà la même
          phrase et qu'elle a le bon comportement — elle annonce au CHANGEMENT,
          ce qu'une rangée statique ne fait pas. */}
      {isPanelOpen && suggestions.length === 0 ? (
        <p className="tc-doc-search__empty" aria-hidden="true">
          {copy.noSearchResult}
        </p>
      ) : null}

      {/* LE COMPTE, ANNONCÉ POLIMENT ET UNE SEULE FOIS. `aria-live="polite"`
          attend une pause dans la frappe, ce qui est exactement le
          comportement voulu : personne ne veut entendre « 8 résultats,
          7 résultats, 3 résultats » lettre après lettre.

          IL DIT LE TOTAL ET NON LE NOMBRE AFFICHÉ. Au-delà de huit, la liste
          est tronquée ; annoncer « 8 résultats » là où il y en a douze
          laisserait croire qu'affiner ne sert à rien. */}
      <p className="tc-visually-hidden" aria-live="polite">
        {announced}
      </p>
    </div>
  );
}
