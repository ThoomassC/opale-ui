import { useState } from 'react';

import { Opale, PageScaffold } from '../../../magic';
import { PageBody, PropsTable, UsageBlock, type PropRow } from '../api';

const USAGE = `import { Opale, PageScaffold } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

const navigation = [
  { id: 'home', href: '/', label: 'Accueil' },
  { id: 'work', href: '/projets', label: 'Projets' },
  { id: 'about', href: '/a-propos', label: 'À propos' },
];

<PageScaffold
  siteName="Atelier"
  navigation={navigation}
  activeId="home"
  searchAction="/recherche"
  pageTitle="Un espace pour vos idées"
  pageDescription="Une introduction que vous pouvez remplacer."
  footerLinks={[{ id: 'legal', href: '/mentions-legales', label: 'Mentions légales' }]}
>
  <Opale.Card title="Votre contenu">Une page prête à enrichir.</Opale.Card>
</PageScaffold>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'siteName / homeHref / logo / brandLabel',
    type: 'string / string / ReactNode / string',
    defaultValue: "'Mon site' / '/' / grille Opale / nom calculé",
    description: 'Nom visible, destination, logo remplaçable et nom accessible du lien.',
  },
  {
    name: 'navigation / activeId / onNavigate',
    type: 'readonly PageScaffoldLink[] / string / callback',
    description: 'Destinations, page courante et branchement éventuel à un routeur client.',
  },
  {
    name: 'headerSize / showNavigation / navigationLabel / mobileMenuLabel',
    type: "'compact' | 'comfortable' | 'spacious' / boolean / string / string",
    defaultValue: "'comfortable' / true / 'Navigation principale' / 'Menu'",
    description: 'Visibilité et noms accessibles de la navigation responsive.',
  },
  {
    name: 'theme / defaultTheme / onThemeChange',
    type: "'light' | 'dark' / 'light' | 'dark' / callback",
    defaultValue: "— / 'light' / —",
    description: 'Bascule clair/sombre locale au gabarit, contrôlée ou autonome.',
  },
  {
    name: 'language / defaultLanguage / onLanguageChange',
    type: "'fr' | 'en' | 'es' / même union / callback",
    defaultValue: "— / 'fr' / —",
    description:
      'Traduit les libellés fournis par défaut. Traduisez vos contenus personnalisés via le callback.',
  },
  {
    name: 'showThemeToggle / showLanguageSelector / themeToggleLabel / languageSelectorLabel',
    type: 'boolean / boolean / string / string',
    defaultValue: 'true / true / libellés traduits',
    description: 'Affichage et noms accessibles des deux contrôles du header.',
  },
  {
    name: 'showSearch / searchProps',
    type: 'boolean / SearchBarProps',
    defaultValue: 'true / —',
    description:
      'Affiche le même SearchBar Opale que le reste du site ; accepte ses attributs natifs.',
  },
  {
    name: 'searchAction / searchName / onSearch',
    type: 'string / string / callback',
    defaultValue: "'/search' / 'q' / —",
    description:
      'Sans callback, formulaire GET natif vers searchAction ; avec callback, la soumission lui remet la requête.',
  },
  {
    name: 'pageTitle / titleAs / introEyebrow / pageDescription',
    type: "ReactNode / 'h1' | 'h2' | 'h3' / ReactNode / ReactNode",
    defaultValue: "siteName / 'h1' / 'Bienvenue' / texte initial",
    description: 'Introduction par défaut, remplaçable entièrement avec slots.intro.',
  },
  {
    name: 'footerLinks / footerNavigationLabel / footerDescription',
    type: 'readonly PageScaffoldLink[] / string / ReactNode',
    description: 'Liens et présentation du pied de page.',
  },
  {
    name: 'copyrightOwner / copyrightYear / copyrightText / showCopyright',
    type: 'ReactNode / number | string / ReactNode / boolean',
    defaultValue: 'siteName / année courante / texte initial / true',
    description: 'Ligne légale modifiable ou masquable.',
  },
  {
    name: 'contentWidth / stickyHeader / liquidGlass',
    type: "'normal' | 'wide' | 'full' / boolean / boolean",
    defaultValue: "'normal' / false / false",
    description: 'Largeur du contenu, en-tête collant et matériau optionnel.',
  },
  {
    name: 'slots / classNames / style',
    type: 'PageScaffoldSlots / classes par région / CSSProperties',
    description: 'Remplace les régions ou ajuste leurs classes et les variables CSS du gabarit.',
  },
  {
    name: 'mainAs / mainId / skipLinkLabel',
    type: "'main' | 'div' / string / string",
    defaultValue: "'main' / identifiant unique / 'Aller au contenu'",
    description: 'Repère principal, cible du lien d’évitement et usage imbriqué.',
  },
  {
    name: 'children / …ComponentPropsWithoutRef<"div">',
    type: 'ReactNode / attributs natifs',
    description: 'Contenu de page et attributs du conteneur racine.',
  },
];

const DEMO_NAVIGATION = [
  { id: 'home', href: '#/', label: 'Accueil' },
  { id: 'work', href: '#/installation', label: 'Projets' },
  { id: 'about', href: '#/utilisation', label: 'À propos' },
] as const;

export default function PageScaffoldContent() {
  const [activeId, setActiveId] = useState('home');
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en' | 'es'>('fr');
  const content = {
    fr: {
      home: 'Accueil',
      work: 'Projets',
      about: 'À propos',
      title: 'Une base pour vos projets',
      description: 'Une page accueillante, avec les composants Opale déjà en place.',
      card: 'Votre contenu',
      body: 'Ajoutez ici vos sections, cartes et interactions.',
      ready: 'La recherche est prête.',
      sent: 'Recherche envoyée',
      release: 'Notes de versions',
    },
    en: {
      home: 'Home',
      work: 'Projects',
      about: 'About',
      title: 'A home for your projects',
      description: 'A welcoming page, with Opale components already in place.',
      card: 'Your content',
      body: 'Add your sections, cards and interactions here.',
      ready: 'Search is ready.',
      sent: 'Search submitted',
      release: 'Release notes',
    },
    es: {
      home: 'Inicio',
      work: 'Proyectos',
      about: 'Acerca de',
      title: 'Una base para tus proyectos',
      description: 'Una página acogedora con los componentes Opale ya incluidos.',
      card: 'Tu contenido',
      body: 'Añade aquí tus secciones, tarjetas e interacciones.',
      ready: 'La búsqueda está lista.',
      sent: 'Búsqueda enviada',
      release: 'Notas de versión',
    },
  }[language];

  return (
    <PageBody>
      <UsageBlock label="Créer une page avec PageScaffold" code={USAGE} />

      <section className="tc-doc-page-scaffold-section">
        <h2 className="tc-doc-specimen__title">Une page complète, prête à personnaliser</h2>
        <p className="tc-doc-specimen__note">
          Essayez le thème, la langue, la navigation et la recherche. Réduisez la fenêtre pour
          ouvrir le menu mobile.
        </p>
        <PageScaffold
          className="tc-doc-page-scaffold-demo"
          mainAs="div"
          titleAs="h3"
          siteName="Atelier"
          homeHref="#/"
          navigation={DEMO_NAVIGATION.map((link) => ({
            ...link,
            label: content[link.id as 'home' | 'work' | 'about'],
          }))}
          language={language}
          onLanguageChange={setLanguage}
          activeId={activeId}
          onNavigate={(link, event) => {
            event.preventDefault();
            setActiveId(link.id);
          }}
          onSearch={setQuery}
          searchProps={{
            placeholder:
              language === 'fr'
                ? 'Rechercher dans Atelier'
                : language === 'en'
                  ? 'Search Atelier'
                  : 'Buscar en Atelier',
          }}
          pageTitle={content.title}
          pageDescription={content.description}
          footerLinks={[{ id: 'legal', href: '#/notes-de-versions', label: content.release }]}
          copyrightYear={2026}
        >
          <div className="tc-doc-page-scaffold-demo__content">
            <Opale.Card title={content.card}>{content.body}</Opale.Card>
            <p role="status">{query ? `${content.sent} : ${query}` : content.ready}</p>
          </div>
        </PageScaffold>
      </section>

      <PropsTable id="page-scaffold" rows={PROPS} />
    </PageBody>
  );
}
