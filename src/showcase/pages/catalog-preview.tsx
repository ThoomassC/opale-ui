import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { Opale } from '../../opale';
import { SHOWCASE_CATALOG } from '../showcase-catalog';
import {
  DropdownMenuDemo,
  FieldDemo,
  GridDemo,
  PopoverDemo,
  RadioGroupDemo,
  TextareaDemo,
  TooltipDemo,
} from './catalog-preview-additions';
import type { DataTableSize, OpalePlacement, OpaleTone } from '../../opale';

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

/* Clé propre à la démo : accepter ici n'engage pas un vrai site servi à la
   même origine, qui lirait la clé par défaut. */
const COOKIE_DEMO_KEY = 'opale-demo-cookie-consent';

const PREVIEW_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 360%22%3E%3Crect width=%22640%22 height=%22360%22 fill=%22%23dce7fb%22/%3E%3Ccircle cx=%22180%22 cy=%22155%22 r=%2275%22 fill=%22%233d66aa%22/%3E%3Cpath d=%22M40 320 245 120l95 105 80-70 180 165Z%22 fill=%22%23f8b31a%22 opacity=%22.85%22/%3E%3C/svg%3E';

/* Recopiés en valeurs ; un garde de `opale.test.tsx` les confronte aux types
   du composant pour que chaque place et chaque ton restent essayables. */
const TOAST_TONES = ['neutral', 'success', 'warning', 'error', 'info'] as const;

const TOAST_PLACEMENTS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

const TOAST_MESSAGES: Record<OpaleTone, string> = {
  neutral: 'Modifications enregistrées',
  success: 'Étape publiée sur le carnet',
  warning: 'La carte n’a pas été régénérée',
  error: 'Publication refusée : titre manquant',
  info: 'Une nouvelle version est disponible',
};

function Row({ children }: { children: ReactNode }) {
  return <div className="tc-doc-opale-preview__row">{children}</div>;
}

function DemoFrame({ children }: { children: ReactNode }) {
  return <div className="tc-doc-opale-demo">{children}</div>;
}

/* =============================================================================
   La démonstration de `ProgressBar` se remplit en boucle. Le mouvement
   appartient à la démonstration : le composant reste piloté par `value`. Le
   minuteur ne tourne que sur la page concernée (`active`), et
   `prefers-reduced-motion` pose la barre à 72 % sans mouvement (WCAG 2.3.3).
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

    /* Aucun `setValue` synchrone dans l'effet (règle `react-hooks`) : la barre
       part de sa valeur de repos et le minuteur la met en mouvement. */
    const timer = window.setInterval(() => {
      setValue((current) => (current >= 100 ? 0 : Math.min(100, current + PROGRESS_STEP)));
    }, PROGRESS_TICK_MS);

    return () => window.clearInterval(timer);
  }, [active]);

  return value;
}

export interface PlaygroundConfig {
  buttonVariant: 'primary' | 'secondary' | 'accent' | 'danger';
  buttonSize: 'small' | 'medium' | 'large';
  buttonLoading: boolean;
  inputError: boolean;
  inputDisabled: boolean;
  tableMode: 'filled' | 'empty' | 'loading';
  tableSize: DataTableSize;
  tableStriped: boolean;
}

export function CatalogPreview({
  name,
  liquidGlass,
  playground,
}: {
  name: string;
  liquidGlass: boolean;
  playground?: PlaygroundConfig;
}) {
  const [message, setMessage] = useState('Prêt');
  const [text, setText] = useState('Opale');
  const [selected, setSelected] = useState('design');
  const [multiSelected, setMultiSelected] = useState<string[]>(['design', 'docs']);
  const [slider, setSlider] = useState(64);
  const [toastOpen, setToastOpen] = useState(true);
  const [toastTone, setToastTone] = useState<OpaleTone>('success');
  const [toastPlacement, setToastPlacement] = useState<OpalePlacement>('bottom-right');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cookieRun, setCookieRun] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(false);
  const [page, setPage] = useState(2);
  const [ratingValue, setRatingValue] = useState(3);
  const progress = useDemoProgress(name === 'ProgressBar');

  let preview: ReactNode;

  switch (name) {
    case 'Button':
      preview = (
        <>
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
          {playground && (
            <div className="tc-doc-opale-playground__result">
              <Opale.Button
                liquidGlass={liquidGlass}
                variant={playground.buttonVariant}
                size={playground.buttonSize}
                loading={playground.buttonLoading}
              >
                Essai configuré
              </Opale.Button>
            </div>
          )}
        </>
      );
      break;
    case 'Pressable':
      preview = (
        <Opale.Pressable liquidGlass={liquidGlass} onClick={() => setMessage('Surface activée')}>
          Surface pressable · {message}
        </Opale.Pressable>
      );
      break;
    case 'InlineInput':
      preview = (
        <DemoFrame>
          <Opale.InlineInput
            liquidGlass={liquidGlass}
            label="Nom du projet"
            helperText="Entrée valide, Échap rétablit."
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            onCommit={(value) => setMessage(`Validé : ${value}`)}
            onCancel={(value) => {
              setText(value);
              setMessage('Modification abandonnée');
            }}
          />
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'Input':
      preview = (
        <Opale.Input
          liquidGlass={liquidGlass}
          label="Email"
          placeholder="thomas@crn-studio.com"
          helperText="Une adresse valide est requise."
          error={playground?.inputError ? 'Adresse invalide' : undefined}
          disabled={playground?.inputDisabled}
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
          value={multiSelected}
          options={OPTIONS}
          onValueChange={setMultiSelected}
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
    case 'SegmentedControl':
      preview = (
        <Opale.SegmentedControl
          liquidGlass={liquidGlass}
          options={OPTIONS}
          value={selected}
          onValueChange={setSelected}
        />
      );
      break;
    case 'IconActionButton':
      preview = (
        <DemoFrame>
          <Opale.IconActionButton
            liquidGlass={liquidGlass}
            icon="share"
            label="Partager"
            onClick={() => setMessage('Lien partagé')}
          />
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
            value={String(SHOWCASE_CATALOG.length)}
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
    case 'DataTable':
      preview = (
        <Opale.DataTable
          liquidGlass={liquidGlass}
          caption="Composants"
          showRowCount
          striped={playground?.tableStriped ?? true}
          size={playground?.tableSize}
          columns={[
            { key: 'name', label: 'Nom', sortable: true },
            { key: 'uses', label: 'Usages', sortable: true, align: 'end' },
            { key: 'status', label: 'Statut' },
          ]}
          rowKey={(row) => String(row.name)}
          loading={playground?.tableMode === 'loading'}
          rows={
            playground?.tableMode === 'empty'
              ? []
              : [
                  { name: 'DataTable', uses: 4, status: 'Nouveau' },
                  { name: 'Button', uses: 128, status: 'Stable' },
                  { name: 'Autocomplete', uses: 17, status: 'Stable' },
                ]
          }
        />
      );
      break;
    case 'DescriptionList':
      preview = (
        <Opale.DescriptionList
          items={[
            { term: 'Version', description: '2.2.0' },
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
          <Opale.Badge liquidGlass={liquidGlass} tone="danger" dot>
            3 messages non lus
          </Opale.Badge>
        </Row>
      );
      break;
    case 'RatingInput':
      preview = (
        <Opale.RatingInput
          label="Qualité de l’expérience"
          value={ratingValue}
          onValueChange={setRatingValue}
        />
      );
      break;
    case 'Pagination':
      preview = (
        <Opale.Pagination
          liquidGlass={liquidGlass}
          value={page}
          pageCount={8}
          onValueChange={setPage}
        />
      );
      break;
    case 'Skeleton':
      preview = (
        <div role="status" aria-label="Chargement de la fiche" className="tc-doc-opale-demo">
          <Opale.Skeleton width="45%" height="1.5rem" />
          <Opale.Skeleton height="5rem" />
          <Opale.Skeleton width="70%" />
        </div>
      );
      break;
    case 'Rating':
      /* Un seul exemple, fractionnaire, identique à l'extrait de code. */
      preview = <Opale.Rating liquidGlass={liquidGlass} value={4.75} max={5} />;
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
      /* LES NOMS SONT CEUX DU JEU D'OPALE, plus le glyphe libre en dernier —
         l'aperçu montre les DEUX formes que la prop accepte. Le catalogue
         complet est sur la page « Icônes ». */
      preview = (
        <Row>
          <Opale.Icon name="compass" label="Boussole" />
          <Opale.Icon name="map-pin" label="Point sur la carte" />
          <Opale.Icon name="luggage" label="Bagage" />
          <Opale.Icon name="bell" label="Notifications" />
          <Opale.Icon name="✦" label="Étincelle" />
        </Row>
      );
      break;
    case 'Feedback':
      preview = (
        <Opale.Feedback liquidGlass={liquidGlass} tone="success" title="En production">
          La dernière version est disponible.
        </Opale.Feedback>
      );
      break;
    case 'Toast':
      /* Démonstration pilotable : les sélecteurs écrivent l'appel exact, et le
         toast se pose là où il le dit, dans le coin de la fenêtre. */
      preview = (
        <DemoFrame>
          <div className="tc-doc-opale-preview__row">
            <Opale.Select
              label="Ton"
              value={toastTone}
              onChange={(event) => setToastTone(event.currentTarget.value as OpaleTone)}
              options={TOAST_TONES.map((value) => ({ value, label: value }))}
            />
            <Opale.Select
              label="Place à l’écran"
              value={toastPlacement}
              onChange={(event) => setToastPlacement(event.currentTarget.value as OpalePlacement)}
              options={TOAST_PLACEMENTS.map((value) => ({ value, label: value }))}
            />
          </div>

          <code className="tc-doc-inline-code">
            {`<Toast tone="${toastTone}" position="${toastPlacement}" message="…" />`}
          </code>

          <Opale.Button size="small" onClick={() => setToastOpen(true)}>
            Afficher le toast
          </Opale.Button>

          <p className="tc-doc-prose">
            Six places : <code>top-left</code>, <code>top-center</code>, <code>top-right</code>,{' '}
            <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code>. Elles
            sont relatives à la <strong>fenêtre</strong> et non au bloc qui appelle le composant :
            le message est rendu dans un portail, donc il sort de ce cadre et va se poser dans le
            coin demandé. Cinq tons : <code>neutral</code> (sans couleur), <code>success</code>,{' '}
            <code>warning</code>, <code>error</code> et <code>info</code> ; <code>error</code> et{' '}
            <code>warning</code> sont annoncés de façon assertive, les autres poliment, et chacun
            porte une icône pour que la couleur ne soit pas le seul signal.
          </p>

          <p className="tc-doc-prose">
            <strong>Plusieurs messages à la même place s’empilent</strong> dans une ancre partagée,
            et l’ordre de tabulation suit l’écran : un message posé en haut vient avant la page, un
            message posé en bas après elle. Minuter et congédier une file reste le travail de{' '}
            <code>ToastProvider</code>.
          </p>

          <Opale.Toast
            open={toastOpen}
            liquidGlass={liquidGlass}
            tone={toastTone}
            position={toastPlacement}
            message={TOAST_MESSAGES[toastTone]}
            onOpenChange={setToastOpen}
          />
        </DemoFrame>
      );
      break;
    case 'Spinner':
      preview = <Opale.Spinner label="Chargement des composants" />;
      break;
    case 'ProgressBar':
      preview = (
        <Opale.ProgressBar liquidGlass={liquidGlass} label="Progression" value={progress} />
      );
      break;
    case 'ConfirmDialog':
      preview = (
        <>
          <Opale.Button onClick={() => setDialogOpen(true)}>Supprimer le fichier</Opale.Button>
          <Opale.ConfirmDialog
            open={dialogOpen}
            liquidGlass={liquidGlass}
            title="Supprimer le fichier ?"
            onOpenChange={setDialogOpen}
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
          liquidGlass={liquidGlass}
          title="Aucun projet"
          description="Créez votre premier projet Opale."
          action={<Opale.Button>Créer un projet</Opale.Button>}
        />
      );
      break;
    case 'Navbar':
      preview = (
        <Opale.Navbar
          liquidGlass={liquidGlass}
          items={NAV_ITEMS}
          value={activeNav}
          onValueChange={setActiveNav}
        />
      );
      break;
    case 'Menu':
      preview = (
        <Opale.Menu
          liquidGlass={liquidGlass}
          label="Actions"
          items={[
            { id: 'duplicate', label: 'Dupliquer' },
            { id: 'archive', label: 'Archiver' },
          ]}
        />
      );
      break;
    case 'Link':
      preview = (
        <Opale.Link liquidGlass={liquidGlass} href="#/installation">
          Lire le guide d’installation →
        </Opale.Link>
      );
      break;
    case 'SidePanel':
      preview = (
        <>
          <Opale.Button onClick={() => setPanelOpen(true)}>Ouvrir le panneau</Opale.Button>
          <Opale.SidePanel
            open={panelOpen}
            liquidGlass={liquidGlass}
            title="Réglages"
            onOpenChange={setPanelOpen}
          >
            <Opale.Toggle label="Notifications" defaultChecked />
          </Opale.SidePanel>
        </>
      );
      break;
    case 'CommandPalette':
      preview = (
        <>
          <Opale.Button onClick={() => setPaletteOpen(true)}>Ouvrir la palette</Opale.Button>
          <Opale.CommandPalette
            open={paletteOpen}
            liquidGlass={liquidGlass}
            value={text}
            onValueChange={setText}
            onOpenChange={setPaletteOpen}
          />
        </>
      );
      break;
    case 'Breadcrumb':
      preview = (
        <Opale.Breadcrumb
          liquidGlass={liquidGlass}
          items={[
            { id: 'home', label: 'Accueil', href: '#/' },
            { id: 'components', label: 'Composants', href: '#/composants/opale-button' },
            { id: 'button', label: 'Button' },
          ]}
        />
      );
      break;
    case 'CookieBanner':
      preview = (
        <DemoFrame>
          {/* Le bandeau est fixe au bas de la fenêtre : monté d'office, il
              recouvrait la fiche au chargement. Il attend donc qu'on le
              demande ; le bouton efface la clé de démonstration et remonte le
              bandeau, qui relit alors le stockage. */}
          <Opale.Button
            size="small"
            onClick={() => {
              try {
                window.localStorage.removeItem(COOKIE_DEMO_KEY);
              } catch {
                /* Stockage inaccessible : rien à effacer. */
              }
              setCookieRun((run) => run + 1);
            }}
          >
            Afficher le bandeau
          </Opale.Button>
          {cookieRun > 0 ? (
            <Opale.CookieBanner
              key={cookieRun}
              storageKey={COOKIE_DEMO_KEY}
              liquidGlass={liquidGlass}
              onAccept={() => setMessage('Cookies acceptés — choix mémorisé')}
              onDecline={() => setMessage('Cookies refusés — choix mémorisé')}
            />
          ) : null}
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'SelectionBar':
      preview = (
        <Opale.SelectionBar liquidGlass={liquidGlass} selectedCount={3}>
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
          navigation={<Opale.Navbar items={NAV_ITEMS.slice(0, 2)} value="overview" />}
        >
          <Opale.Heading level={3}>Contenu principal</Opale.Heading>
          <Opale.Text>Une grille navigation-contenu responsive.</Opale.Text>
        </Opale.Layout>
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
    case 'BackgroundSurface':
      preview = (
        <Opale.BackgroundSurface className="tc-doc-opale-demo__background">
          <Opale.Card title="Fond animé">Contenu au premier plan</Opale.Card>
        </Opale.BackgroundSurface>
      );
      break;
    case 'FileCard':
      preview = (
        <Opale.FileCard
          liquidGlass={liquidGlass}
          name="design-system.fig"
          fileSize="2,4 Mo"
          selected={selectedFile}
          onClick={() => setSelectedFile((value) => !value)}
        />
      );
      break;
    case 'Dropzone':
      preview = (
        <DemoFrame>
          <Opale.Dropzone
            liquidGlass={liquidGlass}
            accept="image/*"
            maxFiles={3}
            maxSizeBytes={5000000}
            onFiles={(files) =>
              setMessage(
                `${files.length} fichier${files.length > 1 ? 's' : ''} reçu${files.length > 1 ? 's' : ''}`,
              )
            }
          >
            Déposez les maquettes ici
          </Opale.Dropzone>
          <span role="status">{message}</span>
        </DemoFrame>
      );
      break;
    case 'Lightbox':
      preview = (
        <>
          <Opale.Button onClick={() => setLightboxOpen(true)}>Voir l’image</Opale.Button>
          <Opale.Lightbox
            liquidGlass={liquidGlass}
            src={PREVIEW_IMAGE}
            alt="Aperçu abstrait Opale"
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        </>
      );
      break;
    case 'Clipboard':
      preview = (
        <Opale.Clipboard liquidGlass={liquidGlass} value="npm install @thomascaron/opale-ui">
          Copier la commande
        </Opale.Clipboard>
      );
      break;
    case 'SvgMap':
      preview = (
        <Opale.SvgMap
          liquidGlass={liquidGlass}
          label="Trois zones"
          viewBox="0 0 300 120"
          selectable
          regions={[
            { id: 'nord', path: 'M10 10 H140 V60 H10 Z', name: 'Nord' },
            { id: 'est', path: 'M150 10 H290 V110 H150 Z', name: 'Est' },
            { id: 'sud', path: 'M10 70 H140 V110 H10 Z', name: 'Sud' },
          ]}
        />
      );
      break;
    case 'Textarea':
      preview = <TextareaDemo liquidGlass={liquidGlass} />;
      break;
    case 'RadioGroup':
      preview = <RadioGroupDemo liquidGlass={liquidGlass} />;
      break;
    case 'Field':
      preview = <FieldDemo />;
      break;
    case 'Grid':
      preview = <GridDemo />;
      break;
    case 'Tooltip':
      preview = <TooltipDemo liquidGlass={liquidGlass} />;
      break;
    case 'Popover':
      preview = <PopoverDemo liquidGlass={liquidGlass} />;
      break;
    case 'DropdownMenu':
      preview = <DropdownMenuDemo liquidGlass={liquidGlass} />;
      break;
    default:
      preview = (
        <Opale.Feedback tone="error" title="Démonstration manquante">
          Le composant {name} n’a pas encore de spécimen.
        </Opale.Feedback>
      );
  }

  return (
    /* Le matériau est sur le composant, pas sur ce cadre neutre ; l'attribut
       reste pour le ciblage. */
    <div
      className="tc-doc-opale-preview__material"
      data-liquid-glass={liquidGlass ? 'true' : undefined}
      data-preview-component={name}
    >
      {preview}
    </div>
  );
}
