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
  skipLinkLabel?: string;
  slots?: PageScaffoldSlots;
  classNames?: Partial<
    Record<
      'header' | 'headerRoot' | 'brand' | 'navigation' | 'search' | 'main' | 'intro' | 'footer',
      string
    >
  >;
}

const DEFAULT_NAVIGATION: readonly PageScaffoldLink[] = [
  { id: 'home', href: '/', label: 'Accueil' },
  { id: 'explore', href: '/explorer', label: 'Explorer' },
  { id: 'about', href: '/a-propos', label: 'À propos' },
];

const DEFAULT_FOOTER_LINKS: readonly PageScaffoldLink[] = [
  { id: 'legal', href: '/mentions-legales', label: 'Mentions légales' },
  { id: 'privacy', href: '/confidentialite', label: 'Confidentialité' },
];

/** Une page Opale complète, dont chaque région peut être configurée ou remplacée. */
export function PageScaffold({
  siteName = 'Mon site',
  homeHref = '/',
  logo,
  brandLabel,
  headerSize = 'comfortable',
  navigation = DEFAULT_NAVIGATION,
  activeId = 'home',
  onNavigate,
  navigationLabel = 'Navigation principale',
  mobileMenuLabel = 'Menu',
  showNavigation = true,
  showSearch = true,
  searchProps,
  searchAction = '/search',
  searchName = 'q',
  onSearch,
  pageTitle,
  introEyebrow = 'Bienvenue',
  titleAs: Title = 'h1',
  pageDescription = 'Découvrez nos contenus et trouvez rapidement ce qui vous intéresse.',
  footerLinks = DEFAULT_FOOTER_LINKS,
  footerNavigationLabel = 'Liens de pied de page',
  footerDescription = 'Une expérience construite avec Opale.',
  copyrightOwner,
  copyrightText = 'Tous droits réservés.',
  copyrightYear = new Date().getFullYear(),
  showCopyright = true,
  contentWidth = 'normal',
  stickyHeader = false,
  liquidGlass = false,
  mainId,
  mainAs: Main = 'main',
  skipLinkLabel = 'Aller au contenu',
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
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
          placeholder="Rechercher"
          aria-label="Rechercher sur le site"
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
        aria-label={brandLabel ?? `Accueil — ${siteName}`}
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
          {showNavigation && navigation.length > 0 ? (
            <Topbar.Section grow className={styles.desktopNavigation}>
              <nav
                aria-label={navigationLabel}
                className={clsx(styles.navigation, classNames?.navigation)}
              >
                {slots?.navigation !== undefined ? slots.navigation : renderLinks(navigation)}
              </nav>
            </Topbar.Section>
          ) : (
            <Topbar.Section grow />
          )}
          {search ? (
            <Topbar.Section className={styles.searchSection}>{search}</Topbar.Section>
          ) : null}
          {slots?.actions ? (
            <Topbar.Actions className={styles.actions}>{slots.actions}</Topbar.Actions>
          ) : null}
          {showNavigation && navigation.length > 0 ? (
            <button
              ref={menuButtonRef}
              className={styles.menuButton}
              type="button"
              aria-label={mobileMenuLabel}
              aria-expanded={menuOpen}
              aria-controls={mobileId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" className={styles.menuIcon} />
            </button>
          ) : null}
        </Topbar>
        {showNavigation && navigation.length > 0 ? (
          <nav
            id={mobileId}
            aria-label={`${navigationLabel} — mobile`}
            className={styles.mobileNavigation}
            hidden={!menuOpen}
          >
            {slots?.mobileNavigation !== undefined
              ? slots.mobileNavigation
              : renderLinks(navigation, true)}
          </nav>
        ) : null}
      </>
    );

  const intro =
    slots?.intro !== undefined ? (
      slots.intro
    ) : (
      <div className={clsx(styles.intro, classNames?.intro)}>
        {introEyebrow ? <span className={styles.eyebrow}>{introEyebrow}</span> : null}
        <Title>{pageTitle ?? siteName}</Title>
        {pageDescription ? <p>{pageDescription}</p> : null}
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
            {footerDescription ? <p>{footerDescription}</p> : null}
          </div>
          {footerLinks.length > 0 ? (
            <nav aria-label={footerNavigationLabel} className={styles.footerLinks}>
              {footerLinks.map((link) => (
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
            {copyrightText ? <>. {copyrightText}</> : null}
          </div>
        ) : null}
      </footer>
    );

  return (
    <div className={clsx(styles.root, className)} {...rootProps}>
      <a className={styles.skipLink} href={`#${contentId}`}>
        {skipLinkLabel}
      </a>
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
