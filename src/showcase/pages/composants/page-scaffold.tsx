import { useState } from 'react';

import { Opale, PageScaffold } from '../../../opale';
import { Specimen } from '../../section';
import { PropsTable, UsageBlock, type PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { MaterialSwitch } from './material-switch';

const USAGE = `import { Card, PageScaffold } from '@thomascaron/opale-ui';
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
  searchSuggestions={[{ id: 'work', href: '/projets', label: 'Projets', group: 'Navigation' }]}
  pageTitle="Un espace pour vos idées"
  pageDescription="Une introduction que vous pouvez remplacer."
  footerLinks={[{ id: 'legal', href: '/mentions-legales', label: 'Mentions légales' }]}
>
  <Card title="Votre contenu">Une page prête à enrichir.</Card>
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
    type: "'small' | 'medium' | 'large' / boolean / string / string",
    defaultValue: "'medium' / true / 'Navigation principale' / 'Menu'",
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
    name: 'searchSuggestions / onSearchSuggestionSelect',
    type: 'readonly PageScaffoldSearchSuggestion[] / callback',
    defaultValue: '— / —',
    description:
      'Suggestions personnalisées filtrées dans une liste accessible ; sans callback, le choix ouvre href.',
  },
  {
    name: 'searchSuggestionsLabel / searchNoResultsLabel',
    type: 'string / string',
    defaultValue: 'libellés traduits',
    description: 'Noms du panneau de suggestions et du message sans résultat.',
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
    name: 'mainAs / mainId',
    type: "'main' | 'div' / string",
    defaultValue: "'main' / identifiant unique",
    description: 'Repère principal, identifiant personnalisable et usage imbriqué.',
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
    <ComponentPageLayout
      id="page-scaffold"
      imports={['PageScaffold']}
      demo={
        <Specimen
          title="Une page complète, prête à personnaliser"
          note="Les onglets, le thème et la langue reprennent les contrôles du header Opale. Essayez la recherche et ses suggestions, puis réduisez la fenêtre pour ouvrir le menu mobile."
        >
          <MaterialSwitch name="PageScaffold" stack>
            {(liquidGlass) => (
              <PageScaffold
                liquidGlass={liquidGlass}
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
                searchSuggestions={DEMO_NAVIGATION.map((link) => ({
                  ...link,
                  label: content[link.id as 'home' | 'work' | 'about'],
                  group:
                    language === 'fr'
                      ? 'Navigation'
                      : language === 'en'
                        ? 'Navigation'
                        : 'Navegación',
                }))}
                onSearchSuggestionSelect={(suggestion) => setActiveId(suggestion.id)}
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
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={<UsageBlock label="Créer une page avec PageScaffold" code={USAGE} />}
      props={<PropsTable id="page-scaffold" rows={PROPS} />}
      states={[
        {
          state: 'empty',
          description: (
            <>
              Une recherche sans suggestion correspondante affiche « Aucun résultat » (
              <code>searchNoResultsLabel</code>) dans un <code>role=&quot;status&quot;</code>. Une
              navigation vide ne rend ni <code>&lt;nav&gt;</code> ni bouton de menu.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Menu mobile : le bouton l’ouvre et le ferme ; <kbd>Échap</kbd>, un clic hors du menu ou
            le choix d’un lien le ferment et rendent le focus au bouton.
          </>,
          <>
            Suggestions de recherche : <kbd>↓</kbd> et <kbd>↑</kbd> les parcourent en boucle, le
            focus restant dans le champ ; <kbd>Entrée</kbd> choisit, <kbd>Échap</kbd> ferme la
            liste.
          </>,
          <>
            Sélecteur de langue : <kbd>↓</kbd>, <kbd>↑</kbd>, <kbd>Entrée</kbd> ou <kbd>Espace</kbd>{' '}
            ouvrent la liste ; ouverte, les flèches bouclent, <kbd>Origine</kbd> et <kbd>Fin</kbd>{' '}
            vont aux bouts, <kbd>Échap</kbd> ferme et <kbd>Tab</kbd> valide l’option désignée.
          </>,
        ],
        semantics: [
          <>
            Repères : <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code> nommé par{' '}
            <code>navigationLabel</code> (« Navigation principale »), <code>&lt;main&gt;</code> (ou{' '}
            <code>&lt;div&gt;</code> via <code>mainAs</code>) et <code>&lt;footer&gt;</code> avec
            son propre <code>&lt;nav&gt;</code> nommé.
          </>,
          <>
            Le lien de marque est nommé « Accueil — {'{siteName}'} » (<code>brandLabel</code>) ; le
            logo est <code>aria-hidden</code>. Le lien de <code>activeId</code> porte{' '}
            <code>aria-current=&quot;page&quot;</code>.
          </>,
          <>
            Le bouton de menu mobile porte <code>aria-expanded</code> et <code>aria-controls</code>{' '}
            ; il se nomme « Menu » (<code>mobileMenuLabel</code>).
          </>,
          <>
            La bascule de thème porte <code>aria-pressed</code> ; le sélecteur de langue est un{' '}
            <code>role=&quot;combobox&quot;</code> relié à une <code>role=&quot;listbox&quot;</code>{' '}
            par <code>aria-controls</code> et <code>aria-activedescendant</code>.
          </>,
          <>
            Avec suggestions, le champ devient un <code>role=&quot;combobox&quot;</code> (
            <code>aria-autocomplete=&quot;list&quot;</code>) relié à la liste « Suggestions de
            recherche ».
          </>,
          <>
            La racine porte <code>lang</code> selon la langue choisie ; le titre est un{' '}
            <code>&lt;h1&gt;</code> par défaut (<code>titleAs</code>).
          </>,
        ],
      }}
      limits={[
        <>
          Pas de lien d’évitement vers le contenu, bien que <code>&lt;main&gt;</code> porte un{' '}
          <code>id</code> et <code>tabIndex={'{-1}'}</code>.
        </>,
        <>Le menu mobile n’est pas un dialogue : il ne piège pas le focus.</>,
        <>
          Huit suggestions au plus ; sans <code>onSearchSuggestionSelect</code>, un choix ouvre son{' '}
          <code>href</code>.
        </>,
        <>Les langues de l’interface se limitent au français, à l’anglais et à l’espagnol.</>,
      ]}
    />
  );
}
