import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { Opale } from '../../magic';

const OPTIONS = [
  { value: 'design', label: 'Design system' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Documentation' },
] as const;

const NAV_ITEMS = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'activity', label: 'Activité' },
  { id: 'settings', label: 'Réglages' },
] as const;

const PREVIEW_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 360%22%3E%3Crect width=%22640%22 height=%22360%22 fill=%22%23dce7fb%22/%3E%3Ccircle cx=%22180%22 cy=%22155%22 r=%2275%22 fill=%22%233d66aa%22/%3E%3Cpath d=%22M40 320 245 120l95 105 80-70 180 165Z%22 fill=%22%23f8b31a%22 opacity=%22.85%22/%3E%3C/svg%3E';

function Row({ children }: { children: ReactNode }) {
  return <div className="tc-doc-opale-preview__row">{children}</div>;
}

function DemoFrame({ children }: { children: ReactNode }) {
  return <div className="tc-doc-opale-demo">{children}</div>;
}

/* =============================================================================
   LA BARRE DE PROGRESSION SE REMPLIT, PARCE QU'UNE BARRE FIGÉE NE MONTRE RIEN.

   L'aperçu affichait `value={72}` : un rectangle immobile, dont on ne pouvait
   deviner ni la façon dont il se remplit, ni l'animation de sa bande. Qui vient
   choisir un composant a besoin de le voir VIVRE — c'est tout l'objet d'une
   démonstration.

   LE MOUVEMENT EST DANS LA DÉMONSTRATION ET NON DANS LE COMPOSANT, et c'est la
   distinction qui compte : `ProgressBar` reste piloté par sa prop `value`,
   comme doit l'être une barre DÉTERMINÉE. Lui coudre une animation interne
   mentirait sur une progression réelle et retirerait au consommateur le
   contrôle de sa propre valeur.

   LE MINUTEUR NE TOURNE QUE SUR LA PAGE CONCERNÉE (`active`). Sans ce garde, un
   `setInterval` rerendrait l'aperçu quatre fois par seconde sur les
   quatre-vingt-treize pages du catalogue, y compris celles qui n'affichent
   aucune barre.

   `prefers-reduced-motion` EST RESPECTÉ, ET C'EST UNE OBLIGATION, PAS UNE
   POLITESSE : une barre qui se remplit en boucle est un mouvement répété et non
   essentiel, exactement ce que WCAG 2.3.3 demande de pouvoir désactiver. Dans ce
   cas la barre se pose à 72 %, la valeur d'origine — on ne voit pas le
   remplissage, on voit tout de même à quoi la barre ressemble.
   ========================================================================== */
const PROGRESS_STEP = 4;
const PROGRESS_TICK_MS = 240;
const PROGRESS_STATIC_VALUE = 72;

function useDemoProgress(active: boolean): number {
  const [value, setValue] = useState(PROGRESS_STATIC_VALUE);

  useEffect(() => {
    if (!active) return;

    /* `matchMedia` est optionnel : jsdom ne l'implémente pas, et l'aperçu est
       monté par la suite de tests du catalogue. Sans ce repli, chaque page
       testée jetterait. */
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    /* AUCUN `setValue` SYNCHRONE ICI, et ce n'est pas un détail de style : poser
       l'état pendant l'effet déclenche un second rendu en cascade avant la
       peinture — ce que la règle `react-hooks` du dépôt refuse, à raison. La
       barre démarre donc à sa valeur de repos et c'est le premier battement du
       minuteur qui la met en mouvement ; elle repasse par zéro d'elle-même en
       fin de course. */
    const timer = window.setInterval(() => {
      setValue((current) => (current >= 100 ? 0 : Math.min(100, current + PROGRESS_STEP)));
    }, PROGRESS_TICK_MS);

    return () => window.clearInterval(timer);
  }, [active]);

  return value;
}

export function CatalogPreview({ name, liquidGlass }: { name: string; liquidGlass: boolean }) {
  const [message, setMessage] = useState('Prêt');
  const [text, setText] = useState('Opale');
  const [selected, setSelected] = useState('design');
  const [multiSelected, setMultiSelected] = useState<string[]>(['design', 'docs']);
  const [slider, setSlider] = useState(64);
  const [language, setLanguage] = useState('FR');
  const [dark, setDark] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [valid, setValid] = useState(true);
  const [score, setScore] = useState(12);
  const progress = useDemoProgress(name === 'ProgressBar');

  let preview: ReactNode;

  switch (name) {
    case 'Button':
      preview = (
        <Row>
          <Opale.Button liquidGlass={liquidGlass}>Primaire</Opale.Button>
          <Opale.Button liquidGlass={liquidGlass} variant="secondary">
            Secondaire
          </Opale.Button>
          <Opale.Button liquidGlass={liquidGlass} variant="accent">
            Accent
          </Opale.Button>
          <Opale.Button liquidGlass={liquidGlass} variant="danger">
            Danger
          </Opale.Button>
        </Row>
      );
      break;
    case 'Pressable':
      preview = (
        <Opale.Pressable onClick={() => setMessage('Surface activée')}>
          Surface pressable · {message}
        </Opale.Pressable>
      );
      break;
    case 'InlineInput':
      preview = (
        <Opale.InlineInput
          label="Nom du projet"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
      );
      break;
    case 'Input':
      preview = (
        <Opale.Input
          liquidGlass={liquidGlass}
          label="Email"
          placeholder="thomas@crn-studio.com"
          helperText="Une adresse valide est requise."
        />
      );
      break;
    case 'Checkbox':
      preview = (
        <Opale.Checkbox
          liquidGlass={liquidGlass}
          label="Recevoir les notifications"
          description="Les nouveautés du design system."
          defaultChecked
        />
      );
      break;
    case 'Toggle':
      preview = (
        <Opale.Toggle liquidGlass={liquidGlass} label="Notifications activées" defaultChecked />
      );
      break;
    case 'Slider':
      preview = (
        <Opale.Slider
          liquidGlass={liquidGlass}
          label="Volume"
          value={slider}
          valueLabel={`${slider} %`}
          min={0}
          max={100}
          onChange={(event) => setSlider(Number(event.currentTarget.value))}
        />
      );
      break;
    case 'MultiSelect':
      preview = (
        <Opale.MultiSelect
          liquidGlass={liquidGlass}
          label="Domaines"
          values={multiSelected}
          options={OPTIONS}
          onChange={(event) =>
            setMultiSelected(
              Array.from(event.currentTarget.selectedOptions, (option) => option.value),
            )
          }
        />
      );
      break;
    case 'Select':
      preview = (
        <Opale.Select
          liquidGlass={liquidGlass}
          label="Domaine"
          value={selected}
          options={OPTIONS}
          onChange={(event) => setSelected(event.currentTarget.value)}
        />
      );
      break;
    case 'Autocomplete':
      preview = (
        <Opale.Autocomplete
          liquidGlass={liquidGlass}
          label="Composant"
          placeholder="Commencez à saisir…"
          options={['Button', 'Card', 'Modal', 'Select']}
        />
      );
      break;
    case 'Form':
      preview = (
        <Opale.Form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setMessage('Formulaire envoyé');
          }}
        >
          <Opale.Input label="Projet" defaultValue="Opale UI" />
          <Opale.Button type="submit">Envoyer</Opale.Button>
          <span role="status">{message}</span>
        </Opale.Form>
      );
      break;
    case 'LanguageSelector':
      preview = (
        <Row>
          <Opale.LanguageSelector
            value={language}
            onChange={(event) => setLanguage(event.currentTarget.value)}
          />
          <Opale.Badge>{language}</Opale.Badge>
        </Row>
      );
      break;
    case 'SegmentedControl':
      preview = (
        <Opale.SegmentedControl options={OPTIONS} value={selected} onChange={setSelected} />
      );
      break;
    case 'ThemeToggle':
      preview = (
        <Row>
          <Opale.ThemeToggle dark={dark} onChange={setDark} />
          <span role="status">Thème {dark ? 'sombre' : 'clair'}</span>
        </Row>
      );
      break;
    case 'AddButton':
      preview = (
        <DemoFrame>
          <Opale.AddButton onClick={() => setMessage('Élément ajouté')} />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'SaveButton':
      preview = <Opale.SaveButton onSaved={() => setMessage('Modification enregistrée')} />;
      break;
    case 'ApproveButton':
      preview = (
        <DemoFrame>
          <Opale.ApproveButton onClick={() => setMessage('Demande validée')} />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'EditButton':
      preview = (
        <DemoFrame>
          <Opale.EditButton onClick={() => setMessage('Mode édition')} />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'DeleteButton':
      preview = (
        <DemoFrame>
          <Opale.DeleteButton onClick={() => setMessage('Élément supprimé')} />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'IconActionButton':
      preview = (
        <DemoFrame>
          <Opale.IconActionButton label="Partager" onClick={() => setMessage('Lien partagé')} />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'Card':
      preview = (
        <Opale.Card
          liquidGlass={liquidGlass}
          title="Une surface Opale"
          subtitle="Carte, actions et élévation."
          actions={<Opale.Badge>Stable</Opale.Badge>}
        >
          <p>Une surface claire, lisible et responsive.</p>
        </Opale.Card>
      );
      break;
    case 'CardGrid':
      preview = (
        <Opale.CardGrid>
          <Opale.StatCard
            liquidGlass={liquidGlass}
            label="Composants"
            value="77"
            delta="Catalogue complet"
          />
          <Opale.StatCard
            liquidGlass={liquidGlass}
            label="Thèmes"
            value="3"
            delta="Clair, sombre, verre"
          />
        </Opale.CardGrid>
      );
      break;
    case 'Carousel':
      preview = (
        <Opale.Carousel className="tc-doc-opale-demo__carousel">
          <Opale.Card title="Carte 1">Découvrir</Opale.Card>
          <Opale.Card title="Carte 2">Comparer</Opale.Card>
          <Opale.Card title="Carte 3">Adopter</Opale.Card>
        </Opale.Carousel>
      );
      break;
    case 'DataTable':
      preview = (
        <Opale.DataTable
          columns={[
            { key: 'name', label: 'Nom' },
            { key: 'status', label: 'Statut' },
          ]}
          rows={[
            { name: 'Button', status: 'Stable' },
            { name: 'DataTable', status: 'Nouveau' },
          ]}
        />
      );
      break;
    case 'DescriptionList':
      preview = (
        <Opale.DescriptionList
          items={[
            { term: 'Version', description: '3.0.0' },
            { term: 'Licence', description: 'MIT' },
            { term: 'React', description: '≥ 19' },
          ]}
        />
      );
      break;
    case 'BulletList':
      preview = (
        <Opale.BulletList
          items={['Accessible au clavier', 'TypeScript strict', 'Thèmes clair et sombre']}
        />
      );
      break;
    case 'StatusChip':
      preview = (
        <Row>
          <Opale.StatusChip status="En production" />
          <Opale.StatusChip status="En révision" />
        </Row>
      );
      break;
    case 'Badge':
      preview = (
        <Row>
          <Opale.Badge liquidGlass={liquidGlass}>Stable</Opale.Badge>
          <Opale.Badge liquidGlass={liquidGlass} tone="accent">
            Nouveau
          </Opale.Badge>
          <Opale.Badge liquidGlass={liquidGlass} tone="danger">
            Critique
          </Opale.Badge>
        </Row>
      );
      break;
    case 'Rating':
      preview = <Opale.Rating value={4} max={5} />;
      break;
    case 'StatCard':
      preview = (
        <Opale.StatCard
          liquidGlass={liquidGlass}
          label="Disponibilité"
          value="99,9 %"
          delta="+0,4 %"
        />
      );
      break;
    case 'Donut':
      preview = <Opale.Donut value={72} label="72 %" />;
      break;
    case 'LegalLinks':
      preview = (
        <Opale.LegalLinks
          links={[
            { id: 'installation', label: 'Installation', href: '#/installation' },
            { id: 'accessibility', label: 'Accessibilité', href: '#/accessibilite' },
          ]}
        />
      );
      break;
    case 'Legend':
      preview = (
        <Opale.Legend items={[{ label: 'Stable' }, { label: 'En cours' }, { label: 'Déprécié' }]} />
      );
      break;
    case 'Heading':
      preview = (
        <DemoFrame>
          <Opale.Heading level={2}>Titre de section</Opale.Heading>
          <Opale.Heading level={3}>Sous-section</Opale.Heading>
        </DemoFrame>
      );
      break;
    case 'Text':
      preview = (
        <DemoFrame>
          <Opale.Text>Corps de texte lisible.</Opale.Text>
          <Opale.Text variant="caption">Légende secondaire</Opale.Text>
          <Opale.Text variant="metric">2 328</Opale.Text>
        </DemoFrame>
      );
      break;
    case 'Icon':
      preview = (
        <Row>
          <Opale.Icon name="✦" label="Étincelle" />
          <Opale.Icon name="⌘" label="Commande" />
          <Opale.Icon name="✓" label="Validé" />
        </Row>
      );
      break;
    case 'Feedback':
      preview = (
        <Opale.Feedback severity="success" title="En production">
          La dernière version est disponible.
        </Opale.Feedback>
      );
      break;
    case 'Toast':
      preview = (
        <DemoFrame>
          <Opale.Button size="small" onClick={() => setToastOpen(true)}>
            Afficher le toast
          </Opale.Button>
          <Opale.Toast
            open={toastOpen}
            message="Modifications enregistrées"
            onClose={() => setToastOpen(false)}
          />
        </DemoFrame>
      );
      break;
    case 'Spinner':
      preview = <Opale.Spinner label="Chargement des composants" />;
      break;
    case 'ProgressBar':
      preview = <Opale.ProgressBar label="Progression" value={progress} />;
      break;
    case 'ConfirmDialog':
      preview = (
        <>
          <Opale.Button onClick={() => setDialogOpen(true)}>Supprimer le fichier</Opale.Button>
          <Opale.ConfirmDialog
            open={dialogOpen}
            title="Supprimer le fichier ?"
            onCancel={() => setDialogOpen(false)}
            onConfirm={() => {
              setDialogOpen(false);
              setMessage('Fichier supprimé');
            }}
          >
            Cette action est irréversible.
          </Opale.ConfirmDialog>
        </>
      );
      break;
    case 'EmptyState':
      preview = (
        <Opale.EmptyState
          title="Aucun projet"
          description="Créez votre premier projet Opale."
          action={<Opale.AddButton />}
        />
      );
      break;
    case 'Navbar':
      preview = <Opale.Navbar items={NAV_ITEMS} activeId={activeNav} onSelect={setActiveNav} />;
      break;
    case 'Menu':
      preview = (
        <Opale.Menu
          label="Actions"
          items={[
            { id: 'duplicate', label: 'Dupliquer' },
            { id: 'archive', label: 'Archiver' },
          ]}
        />
      );
      break;
    case 'Link':
      preview = <Opale.Link href="#/installation">Lire le guide d’installation →</Opale.Link>;
      break;
    case 'SidePanel':
      preview = (
        <>
          <Opale.Button onClick={() => setPanelOpen(true)}>Ouvrir le panneau</Opale.Button>
          <Opale.SidePanel open={panelOpen} title="Réglages" onClose={() => setPanelOpen(false)}>
            <Opale.Toggle label="Notifications" defaultChecked />
          </Opale.SidePanel>
        </>
      );
      break;
    case 'SettingsMenu':
      preview = (
        <Opale.SettingsMenu>
          <Opale.ThemeToggle dark={dark} onChange={setDark} />
          <Opale.LanguageSelector
            value={language}
            onChange={(event) => setLanguage(event.currentTarget.value)}
          />
        </Opale.SettingsMenu>
      );
      break;
    case 'CommandPalette':
      preview = (
        <>
          <Opale.Button onClick={() => setPaletteOpen(true)}>Ouvrir la palette</Opale.Button>
          <Opale.CommandPalette open={paletteOpen} value={text} onChange={setText}>
            <Opale.Button variant="text" onClick={() => setPaletteOpen(false)}>
              Fermer
            </Opale.Button>
          </Opale.CommandPalette>
        </>
      );
      break;
    case 'Breadcrumb':
      preview = (
        <Opale.Breadcrumb
          items={[
            { id: 'home', label: 'Accueil', href: '#/' },
            { id: 'components', label: 'Composants', href: '#/composants/opale-button' },
            { id: 'button', label: 'Button' },
          ]}
        />
      );
      break;
    case 'Toolbar':
      preview = (
        <Opale.Toolbar>
          <Opale.Input aria-label="Rechercher" placeholder="Rechercher" />
          <Opale.Button size="small">Filtrer</Opale.Button>
        </Opale.Toolbar>
      );
      break;
    case 'CookieBanner':
      preview = (
        <DemoFrame>
          <Opale.Button size="small" onClick={() => setCookieOpen(true)}>
            Réafficher
          </Opale.Button>
          <Opale.CookieBanner open={cookieOpen} onAccept={() => setCookieOpen(false)} />
        </DemoFrame>
      );
      break;
    case 'Scrollbar':
      preview = (
        <Opale.Scrollbar className="tc-doc-opale-demo__scroll">
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index}>Ligne de contenu {index + 1}</p>
          ))}
        </Opale.Scrollbar>
      );
      break;
    case 'SelectionBar':
      preview = (
        <Opale.SelectionBar selectedCount={3}>
          <Opale.Button size="small" variant="danger">
            Supprimer
          </Opale.Button>
        </Opale.SelectionBar>
      );
      break;
    case 'Stack':
      preview = (
        <Opale.Stack direction="row" wrap>
          <Opale.Badge>Design</Opale.Badge>
          <Opale.Badge>Code</Opale.Badge>
          <Opale.Badge>Documentation</Opale.Badge>
        </Opale.Stack>
      );
      break;
    case 'Layout':
      preview = (
        <Opale.Layout
          className="tc-doc-opale-demo__layout"
          navigation={<Opale.Navbar items={NAV_ITEMS.slice(0, 2)} activeId="overview" />}
        >
          <Opale.Heading level={3}>Contenu principal</Opale.Heading>
          <Opale.Text>Une grille navigation-contenu responsive.</Opale.Text>
        </Opale.Layout>
      );
      break;
    case 'PageScaffold':
      preview = (
        <Opale.PageScaffold className="tc-doc-opale-demo__page">
          <Opale.Toolbar>
            <strong>Opale</strong>
            <Opale.Badge>V3</Opale.Badge>
          </Opale.Toolbar>
          <Opale.PageContent>
            <Opale.Heading level={3}>Page complète</Opale.Heading>
          </Opale.PageContent>
        </Opale.PageScaffold>
      );
      break;
    case 'PageContent':
      preview = (
        <Opale.PageContent>
          <Opale.Heading level={3}>Contenu centré</Opale.Heading>
          <Opale.Text>La largeur de lecture reste maîtrisée.</Opale.Text>
        </Opale.PageContent>
      );
      break;
    case 'Divider':
      preview = (
        <DemoFrame>
          <span>Avant le séparateur</span>
          <Opale.Divider />
          <span>Après le séparateur</span>
        </DemoFrame>
      );
      break;
    case 'Separator':
      preview = (
        <Row>
          <span>Stable</span>
          <Opale.Separator />
          <span>React 19</span>
          <Opale.Separator />
          <span>TypeScript</span>
        </Row>
      );
      break;
    case 'BackgroundSurface':
      preview = (
        <Opale.BackgroundSurface className="tc-doc-opale-demo__background">
          <Opale.Card title="Fond animé">Contenu au premier plan</Opale.Card>
        </Opale.BackgroundSurface>
      );
      break;
    case 'ShapeBackground':
      preview = (
        <Opale.ShapeBackground className="tc-doc-opale-demo__background">
          <Opale.Card title="Formes organiques">Décor non interactif</Opale.Card>
        </Opale.ShapeBackground>
      );
      break;
    case 'SlidingIndicator':
      preview = (
        <Opale.SlidingIndicator>
          <Opale.Button size="small" variant="tonal">
            Actifs
          </Opale.Button>
          <Opale.Button size="small" variant="text">
            Archivés
          </Opale.Button>
        </Opale.SlidingIndicator>
      );
      break;
    case 'FileUploader':
      preview = (
        <DemoFrame>
          <Opale.FileUploader
            onFiles={(files) => setMessage(`${files.length} fichier(s) sélectionné(s)`)}
          />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'FileCard':
      preview = (
        <Opale.FileCard
          name="design-system.fig"
          size="2,4 Mo"
          selected={selectedFile}
          onClick={() => setSelectedFile((value) => !value)}
        />
      );
      break;
    case 'Dropzone':
      preview = (
        <Opale.Dropzone onFiles={(files) => setMessage(`${files.length} fichier(s) déposé(s)`)}>
          Déposez les maquettes ici
        </Opale.Dropzone>
      );
      break;
    case 'Lightbox':
      preview = (
        <>
          <Opale.Button onClick={() => setLightboxOpen(true)}>Voir l’image</Opale.Button>
          <Opale.Lightbox
            src={PREVIEW_IMAGE}
            alt="Aperçu abstrait Opale"
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      );
      break;
    case 'Map':
      preview = (
        <Opale.Map>
          <Row>
            <Opale.Badge>Paris</Opale.Badge>
            <Opale.Badge tone="accent">Lyon</Opale.Badge>
          </Row>
        </Opale.Map>
      );
      break;
    case 'RouteGuard':
      preview = (
        <DemoFrame>
          <Opale.Toggle
            label="Accès autorisé"
            checked={allowed}
            onChange={(event) => setAllowed(event.currentTarget.checked)}
          />
          <Opale.RouteGuard allowed={allowed} fallback="Accès administrateur requis">
            <Opale.Feedback severity="success">Contenu protégé visible</Opale.Feedback>
          </Opale.RouteGuard>
        </DemoFrame>
      );
      break;
    case 'I18n':
      preview = (
        <Opale.I18n>
          <Row>
            <Opale.LanguageSelector
              value={language}
              onChange={(event) => setLanguage(event.currentTarget.value)}
            />
            <span role="status">
              Message actif : {language === 'FR' ? 'Bonjour' : language === 'EN' ? 'Hello' : 'Hola'}
            </span>
          </Row>
        </Opale.I18n>
      );
      break;
    case 'Http':
      preview = (
        <DemoFrame>
          <Opale.Http status={message === 'Chargement' ? 'Chargement…' : 'API prête · 200'} />
          <Opale.Button
            size="small"
            onClick={() => {
              setMessage('Chargement');
              window.setTimeout(() => setMessage('Prêt'), 250);
            }}
          >
            Relancer
          </Opale.Button>
        </DemoFrame>
      );
      break;
    case 'Validation':
      preview = (
        <DemoFrame>
          <Opale.Input
            label="Identifiant"
            value={text}
            onChange={(event) => {
              setText(event.currentTarget.value);
              setValid(event.currentTarget.value.length >= 3);
            }}
          />
          <Opale.Validation valid={valid} />
        </DemoFrame>
      );
      break;
    case 'Sound':
      preview = <Opale.Sound enabled />;
      break;
    case 'LocalStore':
      preview = (
        <Opale.LocalStore>
          <DemoFrame>
            <Opale.Input
              label="Valeur locale"
              value={text}
              onChange={(event) => setText(event.currentTarget.value)}
            />
            <Opale.Badge>{text || 'Vide'}</Opale.Badge>
          </DemoFrame>
        </Opale.LocalStore>
      );
      break;
    case 'Countdown':
      preview = (
        <Row>
          <span>Départ dans</span>
          <Opale.Countdown seconds={15} />
        </Row>
      );
      break;
    case 'Game':
      preview = (
        <DemoFrame>
          <Opale.Game score={score} />
          <Opale.Button size="small" onClick={() => setScore((value) => value + 1)}>
            Marquer un point
          </Opale.Button>
        </DemoFrame>
      );
      break;
    case 'Clipboard':
      preview = (
        <Opale.Clipboard value="npm install @thomascaron/opale-ui">
          Copier la commande
        </Opale.Clipboard>
      );
      break;
    case 'SvgMap':
      preview = (
        <Opale.SvgMap>
          <circle cx="205" cy="75" r="12" fill="currentColor">
            <title>Étape active</title>
          </circle>
        </Opale.SvgMap>
      );
      break;
    default:
      preview = (
        <Opale.Feedback severity="error" title="Démonstration manquante">
          Le composant {name} n’a pas encore de spécimen.
        </Opale.Feedback>
      );
  }

  return (
    /* LE MATÉRIAU EST SUR LE COMPOSANT, PAS SUR SON CADRE.

       Ce conteneur portait `opale-liquid` : une plaque de verre grande comme
       toute la zone de démonstration, DERRIÈRE le composant qui en portait déjà
       une. On voyait donc deux surfaces empilées là où l'on venait en observer
       une, et le spécimen ne se lisait plus à la place ni à la taille qu'il
       aurait dans une vraie page. Le cadre redevient neutre ; l'attribut reste,
       il sert au ciblage. */
    <div
      className="tc-doc-opale-preview__material"
      data-liquid-glass={liquidGlass ? 'true' : undefined}
      data-preview-component={name}
    >
      {preview}
    </div>
  );
}
