import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Topbar from '../topbar/Topbar';
import SearchBar, { type SearchBarProps } from '../search-bar/SearchBar';
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
export type PageScaffoldLanguage = 'fr' | 'en' | 'es';

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

export interface PageScaffoldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Nom repris dans la marque, le titre initial et le copyright. */
  siteName?: string;
  homeHref?: string;
  logo?: ReactNode;
  brandLabel?: string;
  headerSize?: 'compact' | 'comfortable' | 'spacious';
  navigation?: readonly PageScaffoldLink[];
  activeId?: string;
  onNavigate?: (link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) => void;
  navigationLabel?: string;
  mobileMenuLabel?: string;
  /** Thème et langue contrôlés, ou valeurs initiales en mode autonome. */
  theme?: PageScaffoldTheme;
  defaultTheme?: PageScaffoldTheme;
  onThemeChange?: (theme: PageScaffoldTheme) => void;
  language?: PageScaffoldLanguage;
  defaultLanguage?: PageScaffoldLanguage;
  onLanguageChange?: (language: PageScaffoldLanguage) => void;
  showThemeToggle?: boolean;
  showLanguageSelector?: boolean;
  themeToggleLabel?: string;
  languageSelectorLabel?: string;
  showNavigation?: boolean;
  showSearch?: boolean;
  /** Attributs natifs du vrai champ Opale.SearchBar. */
  searchProps?: SearchBarProps;
  /** La soumission native GET vers `/search` reste disponible sans callback. */
  searchAction?: string;
  searchName?: string;
  onSearch?: (query: string, event: FormEvent<HTMLFormElement>) => void;
  pageTitle?: ReactNode;
  introEyebrow?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3';
  pageDescription?: ReactNode;
  footerLinks?: readonly PageScaffoldLink[];
  footerNavigationLabel?: string;
  footerDescription?: ReactNode;
  copyrightOwner?: ReactNode;
  copyrightText?: ReactNode;
  copyrightYear?: number | string;
  showCopyright?: boolean;
  contentWidth?: 'normal' | 'wide' | 'full';
  stickyHeader?: boolean;
  liquidGlass?: boolean;
  mainId?: string;
  /** Utile quand le gabarit est montré dans une page qui possède déjà un `<main>`. */
  mainAs?: 'main' | 'div';
  slots?: PageScaffoldSlots;
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
    welcome: 'Bienvenue',
    description: 'Découvrez nos contenus et trouvez rapidement ce qui vous intéresse.',
    footerNavigation: 'Liens de pied de page',
    footerDescription: 'Une expérience construite avec Opale.',
    copyright: 'Tous droits réservés.',
    theme: 'Changer le thème clair ou sombre',
    language: 'Langue de la page',
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
    welcome: 'Welcome',
    description: 'Explore our content and quickly find what you need.',
    footerNavigation: 'Footer links',
    footerDescription: 'An experience built with Opale.',
    copyright: 'All rights reserved.',
    theme: 'Switch between light and dark theme',
    language: 'Page language',
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
    welcome: 'Bienvenido',
    description: 'Descubre nuestros contenidos y encuentra rápidamente lo que necesitas.',
    footerNavigation: 'Enlaces del pie de página',
    footerDescription: 'Una experiencia creada con Opale.',
    copyright: 'Todos los derechos reservados.',
    theme: 'Cambiar entre tema claro y oscuro',
    language: 'Idioma de la página',
  },
} as const;

const LANGUAGE_OPTIONS: readonly { value: PageScaffoldLanguage; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<PageScaffoldTheme>(defaultTheme);
  const [localLanguage, setLocalLanguage] = useState<PageScaffoldLanguage>(defaultLanguage);
  const activeTheme = theme ?? localTheme;
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
  const changeTheme = () => {
    const next = activeTheme === 'light' ? 'dark' : 'light';
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

  const renderLinks = (items: readonly PageScaffoldLink[], mobile = false) =>
    items.map((link) => (
      <a
        key={link.id}
        href={link.href}
        target={link.target}
        rel={link.rel}
        aria-current={link.id === activeId ? 'page' : undefined}
        className={clsx(styles.navLink, link.id === activeId && styles.navLinkActive)}
        onClick={(event) => {
          onNavigate?.(link, event);
          if (mobile) {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
          }
        }}
      >
        {link.label}
      </a>
    ));

  const search =
    slots?.search !== undefined ? (
      slots.search
    ) : showSearch ? (
      <form
        className={clsx(styles.searchForm, classNames?.search)}
        action={searchAction}
        method="get"
        onSubmit={
          onSearch
            ? (event) => {
                event.preventDefault();
                const query = new FormData(event.currentTarget).get(
                  searchProps?.name ?? searchName,
                );
                onSearch(typeof query === 'string' ? query : '', event);
              }
            : undefined
        }
      >
        <SearchBar
          placeholder={copy.search}
          aria-label={copy.searchLabel}
          {...searchProps}
          name={searchProps?.name ?? searchName}
          liquidGlass={searchProps?.liquidGlass ?? liquidGlass}
        />
      </form>
    ) : null;

  const brand =
    slots?.brand !== undefined ? (
      slots.brand
    ) : (
      <a
        className={clsx(styles.brand, classNames?.brand)}
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
          elevated={false}
          size={headerSize}
          liquidGlass={liquidGlass}
          rootClassName={clsx(stickyHeader && styles.stickyHeader, classNames?.headerRoot)}
          className={clsx(styles.header, classNames?.header)}
        >
          <Topbar.Section className={styles.brandSection}>{brand}</Topbar.Section>
          {showNavigation && pageNavigation.length > 0 ? (
            <Topbar.Section grow className={styles.desktopNavigation}>
              <nav
                aria-label={navigationLabel ?? copy.navigation}
                className={clsx(styles.navigation, classNames?.navigation)}
              >
                {slots?.navigation !== undefined ? slots.navigation : renderLinks(pageNavigation)}
              </nav>
            </Topbar.Section>
          ) : (
            <Topbar.Section grow />
          )}
          {search ? (
            <Topbar.Section className={styles.searchSection}>{search}</Topbar.Section>
          ) : null}
          {slots?.actions !== undefined ? (
            slots.actions ? (
              <Topbar.Actions className={styles.actions}>{slots.actions}</Topbar.Actions>
            ) : null
          ) : showThemeToggle || showLanguageSelector ? (
            <Topbar.Actions className={styles.actions}>
              {showThemeToggle ? (
                <button
                  className={styles.controlButton}
                  type="button"
                  aria-label={themeToggleLabel ?? copy.theme}
                  aria-pressed={activeTheme === 'dark'}
                  onClick={changeTheme}
                >
                  <span aria-hidden="true">{activeTheme === 'dark' ? '☀' : '☾'}</span>
                </button>
              ) : null}
              {showLanguageSelector ? (
                <select
                  className={styles.languageSelect}
                  aria-label={languageSelectorLabel ?? copy.language}
                  value={activeLanguage}
                  onChange={(event) => changeLanguage(event.target.value as PageScaffoldLanguage)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </Topbar.Actions>
          ) : null}
          {showNavigation && pageNavigation.length > 0 ? (
            <button
              ref={menuButtonRef}
              className={styles.menuButton}
              type="button"
              aria-label={mobileMenuLabel ?? copy.menu}
              aria-expanded={menuOpen}
              aria-controls={mobileId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" className={styles.menuIcon} />
            </button>
          ) : null}
        </Topbar>
        {showNavigation && pageNavigation.length > 0 ? (
          <nav
            ref={mobileNavRef}
            id={mobileId}
            aria-label={`${navigationLabel ?? copy.navigation} — mobile`}
            className={styles.mobileNavigation}
            hidden={!menuOpen}
          >
            {slots?.mobileNavigation !== undefined
              ? slots.mobileNavigation
              : renderLinks(pageNavigation, true)}
          </nav>
        ) : null}
      </>
    );

  const intro =
    slots?.intro !== undefined ? (
      slots.intro
    ) : (
      <div className={clsx(styles.intro, classNames?.intro)}>
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
      <footer className={clsx(styles.footer, classNames?.footer)}>
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
              className={styles.footerLinks}
            >
              {pageFooterLinks.map((link) => (
                <a key={link.id} href={link.href} target={link.target} rel={link.rel}>
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
        {slots?.footerExtra}
        {showCopyright ? (
          <div className={styles.copyright}>
            © {copyrightYear} {copyrightOwner ?? siteName}
            {(copyrightText === undefined ? copy.copyright : copyrightText) ? (
              <>. {copyrightText === undefined ? copy.copyright : copyrightText}</>
            ) : null}
          </div>
        ) : null}
      </footer>
    );

  return (
    <div
      className={clsx(styles.root, className)}
      data-opale-page-theme={activeTheme}
      lang={activeLanguage}
      {...rootProps}
    >
      {header}
      <Main
        id={contentId}
        tabIndex={-1}
        className={clsx(styles.main, styles[contentWidth], classNames?.main)}
      >
        {intro}
        {slots?.beforeContent}
        {children}
        {slots?.afterContent}
      </Main>
      {footer}
    </div>
  );
}
