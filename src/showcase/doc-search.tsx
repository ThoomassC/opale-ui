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

/* La recherche de la vitrine : le motif « Combobox » de l'APG, forme à liste.
   `role="combobox"` sur le champ, liste désignée par `aria-controls`, option
   courante par `aria-activedescendant` : le focus et la frappe restent au
   champ. Aucun raccourci global (`⌘K` et `/` sont déjà pris) et aucun
   amortissement : le balayage est linéaire et mémoïsé sur la requête. */

/**
 * La phrase annoncée pour un compte, pure pour rester une dépendance stable du
 * report de 400 ms. Elle dit le total, et non le nombre affiché.
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
          /* L'option courante repart de zéro à chaque frappe : la liste change. */
          setActiveIndex(-1);
        }}
        onKeyDown={onKeyDown}
      />

      {/* La liste reste dans le DOM pour que `aria-controls` désigne un élément
          présent ; `hidden` la retire quand elle est vide. */}
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
             le focus ne quitte jamais le champ (`aria-activedescendant`) : le
             clavier est câblé sur l'input, l'option n'en reçoit jamais. */
          <li
            className="tc-doc-search__option"
            id={optionId(index)}
            key={suggestion.page.slug}
            role="option"
            aria-selected={index === activeIndex}
            /* `preventDefault` au `mousedown` : le champ garde le focus, et le
               `blur` ne ferme pas le panneau avant le clic. */
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

      {/* Le message vide vit hors de la liste : une `listbox` ne contient que
          des `option`. `aria-hidden`, car la région live dit la même phrase. */}
      {isPanelOpen && suggestions.length === 0 ? (
        <p className="tc-doc-search__empty" aria-hidden="true">
          {copy.noSearchResult}
        </p>
      ) : null}

      {/* Le compte, annoncé poliment après une pause de frappe. Il dit le
          total, et non le nombre affiché. */}
      <p className="tc-visually-hidden" aria-live="polite">
        {announced}
      </p>
    </div>
  );
}
