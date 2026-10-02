import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import { HeaderNavigation } from '../header-controls/HeaderNavigation';
import { HeaderThemeToggle } from '../header-controls/HeaderThemeToggle';
import { LanguageSelector } from '../header-controls/LanguageSelector';
import Topbar from '../topbar/Topbar';
import type { OpaleSize } from '../../shared';
import { shouldHandleNavigation } from '../../shared/navigate';
import { PageThemeContext } from '../../shared/page-theme-context';
import { useScrollPadding } from '../../shared/use-scroll-padding';
import { useHydrated, useThemePreference } from '../../theme/use-opale-theme';
import type { SearchBarProps } from '../search-bar/SearchBar';
import { PageScaffoldSearch } from './PageScaffoldSearch';
import styles from './PageScaffold.module.css';

/** Une destination du menu ou du pied de page. Les liens restent de vrais liens. */
export interface PageScaffoldLink {
  readonly id: string;
  readonly href: string;
  readonly label: ReactNode;
  readonly target?: string;
  readonly rel?: string;
}

export type PageScaffoldTheme = 'light' | 'dark';
/**
 * La préférence de départ du gabarit autonome : un thème, ou `system`, qui suit
 * `prefers-color-scheme` en direct.
 */
export type PageScaffoldThemePreference = PageScaffoldTheme | 'system';
export type PageScaffoldLanguage = 'fr' | 'en' | 'es';

/** Proposition de recherche propre au site, affichée sous le champ. */
export interface PageScaffoldSearchSuggestion {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly group?: string;
}

/** `undefined` conserve la zone par défaut ; `null` la retire. */
export interface PageScaffoldSlots {
  readonly header?: ReactNode;
  readonly brand?: ReactNode;
  readonly navigation?: ReactNode;
  readonly mobileNavigation?: ReactNode;
  readonly search?: ReactNode;
  readonly actions?: ReactNode;
  readonly intro?: ReactNode;
  readonly beforeContent?: ReactNode;
  readonly afterContent?: ReactNode;
  readonly footer?: ReactNode;
  readonly footerExtra?: ReactNode;
}

export interface PageScaffoldProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Nom repris dans la marque, le titre initial et le copyright. */
  siteName?: string;
  /** La cible du lien de marque. Défaut : `/`. */
  homeHref?: string;
  /** Le visuel de la marque, décoratif. Défaut : la mosaïque Opale ; `null` le retire. */
  logo?: ReactNode;
  /** Le nom accessible du lien de marque. Défaut : « Accueil — {siteName} », selon la langue. */
  brandLabel?: string;
  /** La hauteur de l'en-tête. `compact`, `comfortable` et `spacious` valent `small`, `medium` et `large`. */
  headerSize?: OpaleSize | 'compact' | 'comfortable' | 'spacious';
  /**
   * Les liens de l'en-tête, repris dans le menu mobile. Défaut : trois liens d'exemple (accueil,
   * explorer, à propos).
   */
  navigation?: readonly PageScaffoldLink[];
  /** L'`id` du lien courant, marqué `aria-current="page"`. Défaut : `home`. */
  activeId?: string;
  /**
   * Le crochet du routeur côté client, pour les liens de l'en-tête (bureau et
   * mobile) ET du pied de page. Il ne reçoit que les clics gauches simples :
   * Ctrl, Cmd, Maj, Alt, le clic du milieu et `target` vers un autre onglet
   * restent au navigateur, sans l'appeler.
   *
   * C'EST L'APPELANT QUI ANNULE LA NAVIGATION NATIVE, comme depuis toujours :
   * un `onNavigate` qui ne fait qu'observer laisse le lien naviguer.
   * Next.js : `(link, event) => { event.preventDefault(); router.push(link.href); }`.
   */
  onNavigate?: (link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Le nom de la navigation principale. Défaut : « Navigation principale », selon la langue. */
  navigationLabel?: string;
  /** Le nom du bouton du menu mobile. Défaut : « Menu », selon la langue. */
  mobileMenuLabel?: string;
  /** Thème et langue contrôlés, ou valeurs initiales en mode autonome. */
  theme?: PageScaffoldTheme;
  /**
   * Le thème de départ en mode autonome. Défaut : `light`.
   *
   * `system` suit `prefers-color-scheme`, en direct, jusqu'à ce que la bascule
   * fixe un choix. Le serveur ne connaît pas l'OS : la racine y est rendue
   * sans thème local et hérite de `<html>` — posez `opaleThemeScript` dans
   * `<head>`, avec le même `defaultTheme`, pour qu'elle soit juste dès la
   * première peinture.
   */
  defaultTheme?: PageScaffoldThemePreference;
  /**
   * Mémorise le choix de la bascule dans `localStorage` sous cette clé, et le
   * relit au chargement. Sans clé, rien n'est écrit. Ignoré quand `theme` est
   * contrôlé. Comme pour `system`, le serveur rend la racine sans thème local :
   * passez au script la même clé ET le même `defaultTheme` pour éviter le flash.
   * Le script suit le système par défaut, le gabarit part du clair :
   *
   * ```tsx
   * // app/layout.tsx, dans <head>
   * <script
   *   dangerouslySetInnerHTML={{
   *     __html: opaleThemeScript({ storageKey: 'site-theme', defaultTheme: 'light' }),
   *   }}
   * />
   * // la page
   * <PageScaffold themeStorageKey="site-theme" defaultTheme="light" />
   * ```
   */
  themeStorageKey?: string;
  /** Appelée au clic de la bascule, avec le thème résolu. Un changement de l'OS ne l'appelle pas. */
  onThemeChange?: (theme: PageScaffoldTheme) => void;
  /** La langue contrôlée des textes par défaut. À accompagner de `onLanguageChange`. */
  language?: PageScaffoldLanguage;
  /**
   * La langue de départ en mode autonome. Défaut : `fr`. Ignorée quand `language` est contrôlée.
   */
  defaultLanguage?: PageScaffoldLanguage;
  /** Appelée au choix d'une langue dans le sélecteur de l'en-tête. */
  onLanguageChange?: (language: PageScaffoldLanguage) => void;
  /** Affiche la bascule clair / sombre dans l'en-tête. Défaut : `true`. */
  showThemeToggle?: boolean;
  /** Affiche le sélecteur de langue dans l'en-tête. Défaut : `true`. */
  showLanguageSelector?: boolean;
  /**
   * Le nom accessible de la bascule de thème. Défaut : « Changer le thème clair ou sombre », selon
   * la langue.
   */
  themeToggleLabel?: string;
  /** Le nom accessible du sélecteur de langue. Défaut : « Langue de la page », selon la langue. */
  languageSelectorLabel?: string;
  /** Affiche la navigation de l'en-tête et son menu mobile. Défaut : `true`. */
  showNavigation?: boolean;
  /**
   * Affiche le champ de recherche de l'en-tête. Défaut : `true`. `slots.search` reste prioritaire.
   */
  showSearch?: boolean;
  /** Attributs natifs du vrai champ Opale.SearchBar. */
  searchProps?: SearchBarProps;
  /** Suggestions du site ; leur présence active la liste accessible et son état bleu. */
  searchSuggestions?: readonly PageScaffoldSearchSuggestion[];
  /** Gère le choix dans un routeur client ; sans callback, le lien est ouvert. */
  onSearchSuggestionSelect?: (suggestion: PageScaffoldSearchSuggestion) => void;
  /**
   * Ouvre le `href` d'une suggestion quand `onSearchSuggestionSelect` est absent.
   * Par défaut : `window.location.assign(href)`. `onSearchSuggestionSelect` reste prioritaire.
   */
  searchNavigate?: (href: string) => void;
  /** Le nom de la liste de suggestions. Défaut : « Suggestions de recherche », selon la langue. */
  searchSuggestionsLabel?: string;
  /**
   * Le texte affiché quand aucune suggestion ne correspond. Défaut : « Aucun résultat », selon la
   * langue.
   */
  searchNoResultsLabel?: string;
  /**
   * Le compte annoncé quand des suggestions s'affichent. Défaut, selon la
   * langue : « 2 suggestions », « 2 suggestions », « 2 sugerencias ».
   */
  searchSuggestionCountLabel?: (count: number) => string;
  /** La soumission native GET vers `/search` reste disponible sans callback. */
  searchAction?: string;
  /** Le `name` du champ, lu par la soumission native. Défaut : `q`. */
  searchName?: string;
  /**
   * Appelée à la soumission avec la requête saisie. Pour rester dans un routeur client, appelez
   * `event.preventDefault()`.
   */
  onSearch?: (query: string, event: FormEvent<HTMLFormElement>) => void;
  /** Le titre de l'introduction. Défaut : `siteName`. */
  pageTitle?: ReactNode;
  /**
   * La ligne d'accroche au-dessus du titre. Défaut : « Bienvenue », selon la langue ; `null` ou
   * `''` la retire.
   */
  introEyebrow?: ReactNode;
  /** Le niveau du titre de l'introduction. Défaut : `h1`. */
  titleAs?: 'h1' | 'h2' | 'h3';
  /**
   * Le paragraphe sous le titre. Défaut : un texte d'accueil, selon la langue ; `null` ou `''` le
   * retire.
   */
  pageDescription?: ReactNode;
  /** Les liens du pied de page. Défaut : mentions légales et confidentialité. */
  footerLinks?: readonly PageScaffoldLink[];
  /**
   * Le nom de la navigation du pied de page. Défaut : « Liens de pied de page », selon la langue.
   */
  footerNavigationLabel?: string;
  /**
   * Le texte du pied de page. Défaut : « Une expérience construite avec Opale. », selon la langue ;
   * `null` ou `''` le retire.
   */
  footerDescription?: ReactNode;
  /** Le titulaire affiché après l'année. Défaut : `siteName`. */
  copyrightOwner?: ReactNode;
  /**
   * La mention qui suit le titulaire. Défaut : « Tous droits réservés. », selon la langue ; `null`
   * ou `''` la retire.
   */
  copyrightText?: ReactNode;
  /** L'année du copyright. Défaut : l'année courante, lue au rendu. */
  copyrightYear?: number | string;
  /** Affiche la ligne de copyright du pied de page. Défaut : `true`. */
  showCopyright?: boolean;
  /**
   * La largeur maximale du contenu principal. Défaut : `normal` ; `full` occupe toute la largeur.
   */
  contentWidth?: 'normal' | 'wide' | 'full';
  /**
   * Garde l'en-tête en haut de l'écran au défilement, sans masquer l'élément qui reçoit le focus.
   * Défaut : `false`.
   */
  stickyHeader?: boolean;
  /** Applique la matière verre liquide à l'en-tête et à la recherche. Défaut : `false`. */
  liquidGlass?: boolean;
  /**
   * Rend un lien d'évitement vers le contenu principal, visible au focus.
   * Il déplace le focus sans écrire le fragment dans l'adresse. Défaut : `false`.
   */
  showSkipLink?: boolean;
  /** Le texte du lien d'évitement. Défaut : « Aller au contenu », selon la langue. */
  skipLinkLabel?: string;
  /** L'`id` du contenu principal, cible du lien d'évitement. Défaut : un identifiant généré. */
  mainId?: string;
  /** Utile quand le gabarit est montré dans une page qui possède déjà un `<main>`. */
  mainAs?: 'main' | 'div';
  /** Remplace ou retire une région du gabarit, sans toucher aux autres. */
  slots?: PageScaffoldSlots;
  /** Des classes ajoutées aux régions internes, sans remplacer les classes Opale. */
  classNames?: Partial<
    Record<
      'header' | 'headerRoot' | 'brand' | 'navigation' | 'search' | 'main' | 'intro' | 'footer',
      string
    >
  >;
}

const COPY = {
  fr: {
    home: 'Accueil',
    explore: 'Explorer',
    about: 'À propos',
    legal: 'Mentions légales',
    privacy: 'Confidentialité',
    navigation: 'Navigation principale',
    menu: 'Menu',
    search: 'Rechercher',
    searchLabel: 'Rechercher sur le site',
    searchSuggestions: 'Suggestions de recherche',
    searchNoResults: 'Aucun résultat',
    searchSuggestionCount: (count: number) => `${count} suggestion${count > 1 ? 's' : ''}`,
    welcome: 'Bienvenue',
    description: 'Découvrez nos contenus et trouvez rapidement ce qui vous intéresse.',
    footerNavigation: 'Liens de pied de page',
    footerDescription: 'Une expérience construite avec Opale.',
    copyright: 'Tous droits réservés.',
    theme: 'Changer le thème clair ou sombre',
    language: 'Langue de la page',
    skipLink: 'Aller au contenu',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    about: 'About',
    legal: 'Legal notice',
    privacy: 'Privacy',
    navigation: 'Primary navigation',
    menu: 'Menu',
    search: 'Search',
    searchLabel: 'Search this site',
    searchSuggestions: 'Search suggestions',
    searchNoResults: 'No results',
    searchSuggestionCount: (count: number) => `${count} suggestion${count === 1 ? '' : 's'}`,
    welcome: 'Welcome',
    description: 'Explore our content and quickly find what you need.',
    footerNavigation: 'Footer links',
    footerDescription: 'An experience built with Opale.',
    copyright: 'All rights reserved.',
    theme: 'Switch between light and dark theme',
    language: 'Page language',
    skipLink: 'Skip to content',
  },
  es: {
    home: 'Inicio',
    explore: 'Explorar',
    about: 'Acerca de',
    legal: 'Aviso legal',
    privacy: 'Privacidad',
    navigation: 'Navegación principal',
    menu: 'Menú',
    search: 'Buscar',
    searchLabel: 'Buscar en el sitio',
    searchSuggestions: 'Sugerencias de búsqueda',
    searchNoResults: 'Sin resultados',
    searchSuggestionCount: (count: number) => `${count} sugerencia${count === 1 ? '' : 's'}`,
    welcome: 'Bienvenido',
    description: 'Descubre nuestros contenidos y encuentra rápidamente lo que necesitas.',
    footerNavigation: 'Enlaces del pie de página',
    footerDescription: 'Una experiencia creada con Opale.',
    copyright: 'Todos los derechos reservados.',
    theme: 'Cambiar entre tema claro y oscuro',
    language: 'Idioma de la página',
    skipLink: 'Saltar al contenido',
  },
} as const;

const HEADER_LANGUAGE = { fr: 'FR', en: 'EN', es: 'ES' } as const;
const PAGE_LANGUAGE = { FR: 'fr', EN: 'en', ES: 'es' } as const;

/** Une page Opale complète, dont chaque région peut être configurée ou remplacée. */
export function PageScaffold({
  siteName = 'Mon site',
  homeHref = '/',
  logo,
  brandLabel,
  headerSize = 'comfortable',
  navigation,
  activeId = 'home',
  onNavigate,
  navigationLabel,
  mobileMenuLabel,
  theme,
  defaultTheme = 'light',
  themeStorageKey,
  onThemeChange,
  language,
  defaultLanguage = 'fr',
  onLanguageChange,
  showThemeToggle = true,
  showLanguageSelector = true,
  themeToggleLabel,
  languageSelectorLabel,
  showNavigation = true,
  showSearch = true,
  searchProps,
  searchSuggestions,
  onSearchSuggestionSelect,
  searchNavigate,
  searchSuggestionsLabel,
  searchNoResultsLabel,
  searchSuggestionCountLabel,
  searchAction = '/search',
  searchName = 'q',
  onSearch,
  pageTitle,
  introEyebrow,
  titleAs: Title = 'h1',
  pageDescription,
  footerLinks,
  footerNavigationLabel,
  footerDescription,
  copyrightOwner,
  copyrightText,
  copyrightYear = new Date().getFullYear(),
  showCopyright = true,
  contentWidth = 'normal',
  stickyHeader = false,
  liquidGlass = false,
  showSkipLink = false,
  skipLinkLabel,
  mainId,
  mainAs: Main = 'main',
  slots,
  classNames,
  className,
  children,
  ...rootProps
}: PageScaffoldProps) {
  const generatedId = useId().replaceAll(':', '');
  const contentId = mainId ?? `opale-page-content-${generatedId}`;
  const mobileId = `opale-page-menu-${generatedId}`;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  /* L'en-tête collant ne doit pas couvrir l'élément atteint au clavier. */
  useScrollPadding(headerRef, 'top', stickyHeader && slots?.header === undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  /* LE THÈME AUTONOME, MÉMORISÉ OU SYSTÈME (THM-22). La préférence est lue
     comme un magasin externe, jamais dans un effet. Sa racine ne va pas sur
     `<html>` : elle reste locale, sur `data-opale-page-theme`.

     CE QUE LE SERVEUR NE PEUT PAS SAVOIR, IL NE L'ÉCRIT PAS. Un clair écrit
     d'office sous un OS sombre ferait un flash — et le corriger à
     l'hydratation, un écart. La racine est donc rendue SANS thème local tant
     que l'hydratation n'est pas passée : elle hérite de `<html>`, que
     `opaleThemeScript` a posé avant la peinture. Le défaut `light`, lui, se
     sait au serveur et reste écrit comme en 2.9.3. */
  const { resolvedTheme: localTheme, setTheme: setLocalTheme } = useThemePreference(
    themeStorageKey,
    defaultTheme,
  );
  const hydrated = useHydrated();
  const unknownOnServer = themeStorageKey !== undefined || defaultTheme === 'system';
  const [localLanguage, setLocalLanguage] = useState<PageScaffoldLanguage>(defaultLanguage);
  const activeTheme: PageScaffoldTheme | null =
    theme ?? (unknownOnServer && !hydrated ? null : localTheme);
  const activeLanguage = language ?? localLanguage;
  const copy = COPY[activeLanguage];
  const pageNavigation = navigation ?? [
    { id: 'home', href: '/', label: copy.home },
    { id: 'explore', href: '/explorer', label: copy.explore },
    { id: 'about', href: '/a-propos', label: copy.about },
  ];
  const pageFooterLinks = footerLinks ?? [
    { id: 'legal', href: '/mentions-legales', label: copy.legal },
    { id: 'privacy', href: '/confidentialite', label: copy.privacy },
  ];
  /* Le fragment écrit dans l'adresse casserait un routeur par fragment :
     le focus est déplacé à la main, le `href` reste le filet sans script. */
  /* LE ROUTEUR NE REÇOIT QUE LES CLICS SIMPLES (DX-02), sur l'en-tête comme sur
     le pied : la règle commune de `shared/navigate.ts`. L'annulation reste à
     l'appelant — le contrat de PageScaffold l'a toujours voulu ainsi, et un
     crochet qui ne fait qu'observer ne doit pas bloquer le lien. */
  const routeLink = (link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate && shouldHandleNavigation(event)) onNavigate(link, event);
  };
  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(contentId);
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView?.({ block: 'start' });
  };
  const changeTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    if (theme === undefined) setLocalTheme(next);
    onThemeChange?.(next);
  };
  const changeLanguage = (next: PageScaffoldLanguage) => {
    if (language === undefined) setLocalLanguage(next);
    onLanguageChange?.(next);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuButtonRef.current?.contains(target) || mobileNavRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [menuOpen]);

  const search =
    slots?.search !== undefined ? (
      slots.search
    ) : showSearch ? (
      <PageScaffoldSearch
        language={activeLanguage}
        placeholder={copy.search}
        label={copy.searchLabel}
        suggestionsLabel={searchSuggestionsLabel ?? copy.searchSuggestions}
        noResultsLabel={searchNoResultsLabel ?? copy.searchNoResults}
        suggestionCountLabel={searchSuggestionCountLabel ?? copy.searchSuggestionCount}
        suggestions={searchSuggestions}
        onSuggestionSelect={onSearchSuggestionSelect}
        navigate={searchNavigate}
        searchProps={searchProps}
        searchAction={searchAction}
        searchName={searchName}
        liquidGlass={liquidGlass}
        className={classNames?.search}
        onSearch={onSearch}
      />
    ) : null;

  const brand =
    slots?.brand !== undefined ? (
      slots.brand
    ) : (
      <a
        className={clsx('opale-page-scaffold__brand', styles.brand, classNames?.brand)}
        href={homeHref}
        aria-label={brandLabel ?? `${copy.home} — ${siteName}`}
      >
        {logo !== null ? (
          <span
            className={logo === undefined ? styles.brandMark : styles.brandLogo}
            aria-hidden="true"
          >
            {logo === undefined
              ? Array.from({ length: 9 }, (_, index) => <span key={index} />)
              : logo}
          </span>
        ) : null}
        <span className={styles.brandName}>{siteName}</span>
      </a>
    );

  const header =
    slots?.header !== undefined ? (
      slots.header
    ) : (
      <>
        <Topbar
          ref={headerRef}
          elevated={false}
          size={headerSize}
          liquidGlass={liquidGlass}
          rootClassName={clsx(
            'opale-page-scaffold__header-shell',
            styles.headerSurface,
            stickyHeader && styles.stickyHeader,
            classNames?.headerRoot,
          )}
          className={clsx('opale-page-scaffold__header', styles.header, classNames?.header)}
        >
          <Topbar.Section className={styles.brandSection}>{brand}</Topbar.Section>
          {search ? (
            <Topbar.Section className={styles.searchSection}>{search}</Topbar.Section>
          ) : null}
          {showNavigation && pageNavigation.length > 0 ? (
            <Topbar.Section grow className={styles.desktopNavigation}>
              <HeaderNavigation
                links={pageNavigation}
                activeId={activeId}
                ariaLabel={navigationLabel ?? copy.navigation}
                className={clsx(
                  'opale-page-scaffold__navigation',
                  styles.navigation,
                  classNames?.navigation,
                )}
                onNavigate={routeLink}
              >
                {slots?.navigation}
              </HeaderNavigation>
            </Topbar.Section>
          ) : (
            <Topbar.Section grow />
          )}
          {showNavigation && pageNavigation.length > 0 ? (
            <button
              ref={menuButtonRef}
              className={clsx('opale-page-scaffold__menu-button', styles.menuButton)}
              type="button"
              aria-label={mobileMenuLabel ?? copy.menu}
              aria-expanded={menuOpen}
              aria-controls={mobileId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" className={styles.menuIcon} />
            </button>
          ) : null}
          {slots?.actions !== undefined ? (
            slots.actions ? (
              <Topbar.Actions className={clsx('opale-page-scaffold__actions', styles.actions)}>
                {slots.actions}
              </Topbar.Actions>
            ) : null
          ) : showThemeToggle || showLanguageSelector ? (
            <Topbar.Actions className={clsx('opale-page-scaffold__actions', styles.actions)}>
              {showThemeToggle ? (
                <HeaderThemeToggle
                  isDark={activeTheme === 'dark'}
                  label={themeToggleLabel ?? copy.theme}
                  onToggle={changeTheme}
                />
              ) : null}
              {showLanguageSelector ? (
                <LanguageSelector
                  language={HEADER_LANGUAGE[activeLanguage]}
                  label={languageSelectorLabel ?? copy.language}
                  onChange={(next) => changeLanguage(PAGE_LANGUAGE[next])}
                />
              ) : null}
            </Topbar.Actions>
          ) : null}
        </Topbar>
        {showNavigation && pageNavigation.length > 0 ? (
          <HeaderNavigation
            ref={mobileNavRef}
            id={mobileId}
            links={pageNavigation}
            activeId={activeId}
            ariaLabel={`${navigationLabel ?? copy.navigation} — mobile`}
            className={clsx('opale-page-scaffold__mobile-navigation', styles.mobileNavigation)}
            hidden={!menuOpen}
            onNavigate={(link, event) => {
              routeLink(link, event);
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
          >
            {slots?.mobileNavigation}
          </HeaderNavigation>
        ) : null}
      </>
    );

  const intro =
    slots?.intro !== undefined ? (
      slots.intro
    ) : (
      <div className={clsx('opale-page-scaffold__intro', styles.intro, classNames?.intro)}>
        {(introEyebrow === undefined ? copy.welcome : introEyebrow) ? (
          <span className={styles.eyebrow}>
            {introEyebrow === undefined ? copy.welcome : introEyebrow}
          </span>
        ) : null}
        <Title>{pageTitle ?? siteName}</Title>
        {(pageDescription === undefined ? copy.description : pageDescription) ? (
          <p>{pageDescription === undefined ? copy.description : pageDescription}</p>
        ) : null}
      </div>
    );

  const footer =
    slots?.footer !== undefined ? (
      slots.footer
    ) : (
      <footer className={clsx('opale-page-scaffold__footer', styles.footer, classNames?.footer)}>
        <div className={styles.footerTop}>
          <div>
            <strong>{siteName}</strong>
            {(footerDescription === undefined ? copy.footerDescription : footerDescription) ? (
              <p>{footerDescription === undefined ? copy.footerDescription : footerDescription}</p>
            ) : null}
          </div>
          {pageFooterLinks.length > 0 ? (
            <nav
              aria-label={footerNavigationLabel ?? copy.footerNavigation}
              className={clsx('opale-page-scaffold__footer-links', styles.footerLinks)}
            >
              {pageFooterLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.target}
                  rel={link.rel}
                  onClick={(event) => routeLink(link, event)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
        {slots?.footerExtra}
        {showCopyright ? (
          <div className={clsx('opale-page-scaffold__copyright', styles.copyright)}>
            © {copyrightYear} {copyrightOwner ?? siteName}
            {(copyrightText === undefined ? copy.copyright : copyrightText) ? (
              <>. {copyrightText === undefined ? copy.copyright : copyrightText}</>
            ) : null}
          </div>
        ) : null}
      </footer>
    );

  /* Le thème effectif descend aussi par contexte : les modales et les
     messages rendus en portail, hors de cette racine, le reprennent sur leur
     propre conteneur. Voir `shared/page-theme-context.ts`. */
  return (
    <PageThemeContext.Provider value={activeTheme}>
      <div
        className={clsx('opale-page-scaffold', styles.root, className)}
        data-opale-page-theme={activeTheme ?? undefined}
        lang={activeLanguage}
        {...rootProps}
      >
        {showSkipLink ? (
          <a
            className={clsx('opale-page-scaffold__skip-link', styles.skipLink)}
            href={`#${contentId}`}
            onClick={skipToContent}
          >
            {skipLinkLabel ?? copy.skipLink}
          </a>
        ) : null}
        {header}
        <Main
          id={contentId}
          tabIndex={-1}
          className={clsx(
            'opale-page-scaffold__main',
            styles.main,
            styles[contentWidth],
            classNames?.main,
          )}
        >
          {intro}
          {slots?.beforeContent}
          {children}
          {slots?.afterContent}
        </Main>
        {footer}
      </div>
    </PageThemeContext.Provider>
  );
}
