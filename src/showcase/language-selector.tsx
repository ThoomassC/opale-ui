import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { LanguageFlag } from './language-flag';
import { LANGUAGE_OPTIONS, type Language } from './localization';

/* =============================================================================
   LE SÉLECTEUR DE LANGUE — un `combobox` à liste seule, habillé en opaleUI.

   CE QUI A CHANGÉ. C'était un `<select>` natif rendu par
   `LanguageSelector`, qui affichait « Français », « English »,
   « Español ». Il affiche maintenant des DRAPEAUX, et un `<select>` ne peut
   pas les porter : le contenu d'une `<option>` est du texte brut dans tous les
   navigateurs, aucun n'y peint un SVG. Le contrôle est donc refait à la main,
   et la liste est un vrai panneau posé sous le bouton.

   C'EST LE MOTIF « SELECT-ONLY COMBOBOX » DE L'APG, ET PAS UN MENU. La
   distinction n'est pas cosmétique : un `menu` exécute des COMMANDES et n'a
   pas d'état sélectionné, une `listbox` porte une VALEUR et l'annonce
   (« Français, sélectionné, 1 sur 3 »). Ici on choisit la langue du site : il
   y a une valeur courante, donc c'est une `listbox`.

   LE FOCUS NE QUITTE JAMAIS LE BOUTON, et c'est ce que dit
   `aria-activedescendant` — même arbitrage que la recherche, pour les mêmes
   raisons : la frappe suivante continue d'arriver au contrôle, et le lecteur
   d'écran annonce l'option SANS perdre le contexte du champ.

   LE BOUTON PORTE `role="combobox"` ET RESTE UN `<button>`. Un `<div
   tabindex="0">`, comme dans l'exemple de l'APG, aurait demandé de recâbler à
   la main ce qu'un bouton donne gratuitement : l'atteinte au clavier, le
   curseur, le comportement du clic milieu, et la désactivation. Le rôle
   remplace `button` dans l'arbre, il ne retire rien de tout cela.

   LES DRAPEAUX SONT DÉCORATIFS, LE NOM EST TEXTE. Chaque option porte son
   libellé en endonyme — « Français », « English », « Español » — masqué
   visuellement et muni de son `lang`. C'est ce qui fait annoncer « English »
   avec l'accent anglais plutôt qu'« englisse », et c'est ce qui permet au
   pilotage à la voix de dire « clic Español ». Le drapeau, lui, n'est jamais
   un nom de langue : le Royaume-Uni n'est pas l'anglais, et un lecteur
   d'écran qui lirait « drapeau » n'aurait rien dit d'utile.
   ========================================================================== */

/** Le code BCP 47 de chaque langue, pour le `lang` du libellé annoncé. */
function htmlLangOf(language: Language): string {
  return language.toLowerCase();
}

export interface LanguageSelectorProps {
  readonly language: Language;
  readonly label: string;
  readonly onChange: (language: Language) => void;
}

export function LanguageSelector({ language, label, onChange }: LanguageSelectorProps) {
  const [isOpen, setOpen] = useState(false);
  /* L'index de l'option DÉSIGNÉE pendant la navigation au clavier. Il part de
     la valeur courante à chaque ouverture : ouvrir la liste ne doit pas
     déplacer le point de départ de la lecture. */
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      LANGUAGE_OPTIONS.findIndex((option) => option.value === language),
    ),
  );

  /* L'enveloppe sert à savoir si le focus SORT vraiment du contrôle : sans
     elle, cliquer une option ferait perdre le focus au bouton, donc fermerait
     le panneau, donc annulerait le clic avant qu'il n'arrive. */
  const wrapperRef = useRef<HTMLDivElement>(null);

  const baseId = useId();
  const labelId = `${baseId}-label`;
  const triggerId = `${baseId}-trigger`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const selectedIndex = Math.max(
    0,
    LANGUAGE_OPTIONS.findIndex((option) => option.value === language),
  );
  const selected = LANGUAGE_OPTIONS[selectedIndex];

  function close(): void {
    setOpen(false);
  }

  function open(): void {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function choose(index: number): void {
    const option = LANGUAGE_OPTIONS[index];

    if (option) onChange(option.value);
    close();
  }

  /* Le clavier, dans l'ordre de l'APG pour un combobox à liste seule.

     `preventDefault` EST SYSTÉMATIQUE SUR `Entrée` ET `Espace`, et ce n'est pas
     une précaution de style : sur un `<button>`, les deux touches émettent un
     clic de synthèse, qui rappellerait `onClick` APRÈS ce gestionnaire et
     rouvrirait le panneau qu'on vient de fermer. Le neutraliser rend le
     clavier déterministe — les deux touches passent ici et nulle part ailleurs.

     `Tab` VALIDE L'OPTION DÉSIGNÉE au lieu d'annuler, ce que l'APG demande
     pour ce motif : on a navigué jusqu'à une option, la quitter par `Tab` ne
     doit pas jeter ce choix. Aucun `preventDefault` — `Tab` doit sortir. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setActiveIndex((current) => (current + 1) % LANGUAGE_OPTIONS.length);
        return;

      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setActiveIndex((current) => (current <= 0 ? LANGUAGE_OPTIONS.length - 1 : current - 1));
        return;

      case 'Home':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(0);
        return;

      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(LANGUAGE_OPTIONS.length - 1);
        return;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen) {
          choose(activeIndex);
          return;
        }
        open();
        return;

      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        close();
        return;

      case 'Tab':
        if (isOpen) choose(activeIndex);
        return;

      default:
    }
  }

  return (
    <div
      className="tc-doc-language"
      ref={wrapperRef}
      onBlur={(event) => {
        /* `relatedTarget` est l'élément qui REÇOIT le focus. S'il est encore
           dans l'enveloppe, le focus n'a pas quitté le contrôle et il n'y a
           rien à fermer. `null` — clic dans le vide, changement d'onglet —
           compte comme une sortie. */
        const next = event.relatedTarget;
        if (next instanceof Node && wrapperRef.current?.contains(next)) return;
        close();
      }}
    >
      {/* LE LIBELLÉ EST UN ÉLÉMENT, ET NON UN `aria-label`, ET C'EST TOUTE LA
          DIFFÉRENCE ENTRE UN CONTRÔLE QUI DIT SA VALEUR ET UN QUI LA TAIT.
          `aria-label` REMPLACE le contenu dans le calcul du nom : le bouton
          se serait annoncé « Langue, liste déroulante » — le nom, l'état, et
          pas un mot sur la langue en cours, alors que c'est la seule chose
          qu'on vient y lire. L'APG chaîne donc le libellé ET le contrôle
          lui-même (`aria-labelledby="{libellé} {contrôle}"`), ce qui donne
          « Langue Français » : le nom du contrôle, puis sa valeur, comme le
          fait un `<select>` natif. */}
      <span className="tc-visually-hidden" id={labelId}>
        {label}
      </span>

      <button
        className="tc-doc-language__trigger"
        id={triggerId}
        type="button"
        role="combobox"
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onKeyDown}
      >
        <LanguageFlag className="tc-doc-language__flag" language={selected.value} />
        <span className="tc-visually-hidden" lang={htmlLangOf(selected.value)}>
          {selected.label}
        </span>
        <span className="tc-doc-language__caret" aria-hidden="true" />
      </button>

      {/* LA LISTE EXISTE TOUJOURS DANS LE DOM, et c'est ce qui rend
          `aria-controls` honnête : il doit désigner un élément présent, sinon
          la référence est cassée pour les technologies d'assistance qui la
          résolvent au chargement. `hidden` la retire de l'arbre
          d'accessibilité comme de la peinture. */}
      <ul
        className="tc-doc-language__list"
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        hidden={!isOpen}
      >
        {LANGUAGE_OPTIONS.map((option, index) => (
          /* eslint-disable-next-line jsx-a11y/click-events-have-key-events --
             MÊME CAS QUE LA RECHERCHE, et la règle se trompe pour la même
             raison : dans un combobox à `aria-activedescendant`, l'option
             n'est pas focusable, donc elle ne peut recevoir AUCUN événement
             clavier. Un `onKeyDown` posé ici serait du code mort qui ferait
             seulement taire la règle. Tout le clavier est câblé sur le bouton,
             et c'est là que l'APG le place. */
          <li
            className="tc-doc-language__option"
            id={optionId(index)}
            key={option.value}
            role="option"
            aria-selected={option.value === language}
            data-active={isOpen && index === activeIndex ? 'true' : undefined}
            /* `onMouseDown` AVEC `preventDefault` : sans lui, appuyer sur une
               option retire le focus au bouton AVANT que le clic ne soit émis,
               le `blur` ferme le panneau, l'option disparaît sous le doigt et
               le clic n'atteint plus rien. */
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(index)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <LanguageFlag className="tc-doc-language__flag" language={option.value} />
            <span className="tc-visually-hidden" lang={htmlLangOf(option.value)}>
              {option.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
