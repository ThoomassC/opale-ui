import type { ReactNode } from 'react';

import { REMOVAL_VERSION, REMOVED_EXPORTS, REMOVED_PROPS } from '../../opale/deprecations';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { MigrationTable, ReplacementCell, type MigrationRow } from './migration-table';

/* =============================================================================
   « MIGRER VERS LA 4.0 », DÉDUITE DE LA LISTE DES NOMS RETIRÉS.

   Aucune ligne des deux tableaux n'est écrite ici : elles viennent de
   `REMOVED_PROPS` et `REMOVED_EXPORTS` (`src/opale/deprecations.ts`), la copie
   figée des dépréciations de la 2.x que `removed-api.structure.test.ts` tient
   contre la surface publique. La page ne peut donc ni oublier un nom retiré,
   ni en annoncer un qui serait encore là.

   Les anciens noms n'apparaissent qu'en données, jamais dans un extrait : la
   vitrine n'enseigne pas l'API retirée (`no-deprecated-api.structure.test.ts`).

   L'ancienne adresse `#/migrer-vers-3` mène toujours ici (`SLUG_ALIASES`).
   ========================================================================== */

const PROP_ROWS = REMOVED_PROPS.map((entry): MigrationRow => ({
  key: `${entry.component}.${entry.prop}`,
  cells: [
    <code key="component">{entry.component}</code>,
    <code key="prop">{entry.prop}</code>,
    <ReplacementCell key="replacement" replacement={entry.replacement} note={entry.note} />,
    entry.since,
  ],
}));

const EXPORT_ROWS = REMOVED_EXPORTS.map((entry): MigrationRow => ({
  key: entry.name,
  cells: [
    <code key="name">{entry.name}</code>,
    entry.kind === 'type' ? 'type' : 'valeur',
    <ReplacementCell key="replacement" replacement={entry.replacement} note={entry.note} />,
    entry.since,
  ],
}));

/** Ce que la 4.0.0 a changé en plus du retrait des anciens noms. */
const BREAKING_CHANGES: readonly ReactNode[] = [
  <>
    <code>Toggle</code> expose <code>role="switch"</code> par défaut : il s’annonce « activé /
    désactivé ». Un <code>role="checkbox"</code> explicite garde l’ancienne annonce.
  </>,
  <>
    Les attributs <code>data-testid</code> posés par <code>Modal</code> et{' '}
    <code>ToastProvider</code> (<code>modal-container</code>, <code>modal-overlay</code>,{' '}
    <code>toast</code>, <code>toast-portal</code>) ont disparu : visez les rôles ARIA ou les classes
    stables <code>opale-*</code>.
  </>,
  <>
    Les dépendances pairs <code>react</code> et <code>react-dom</code> sont bornées à{' '}
    <code>^19</code>.
  </>,
  <>
    La feuille héritée <code>tokens.css</code> a quitté le paquet : <code>opale.css</code> porte les
    jetons <code>--opale-*</code>, seul contrat public.
  </>,
  <>
    <code>SiteNav</code> exige <code>items</code> : ses destinations par défaut ont disparu avec{' '}
    <code>DEFAULT_SITE_NAV_ITEMS</code>. TypeScript le refuse ; en JavaScript, un{' '}
    <code>SiteNav</code> sans <code>items</code> lève au rendu.
  </>,
  <>
    En JavaScript non typé, rien ne refuse un ancien nom : les props retirées passent désormais au
    DOM comme n’importe quel attribut. Un ancien <code>onChange</code> sur{' '}
    <code>CommandPalette</code> ou <code>RatingInput</code> reçoit ainsi l’événement{' '}
    <code>change</code> natif qui remonte de leur champ, et non plus une valeur : renommez-le en{' '}
    <code>onValueChange</code>.
  </>,
];

/** Les rappels dont les arguments changent, au-delà du nom. */
const SIGNATURE_CHANGES: readonly ReactNode[] = [
  <>
    <code>Sidebar</code> : <code>onSelectItem(id, event)</code> devient{' '}
    <code>onValueChange(id)</code>, sans l’événement du clic. Une entrée lien (<code>href</code>)
    passe par <code>onNavigate</code>.
  </>,
  <>
    <code>Toast</code>, <code>Lightbox</code>, <code>CommandPalette</code> (<code>onClose</code>) et{' '}
    <code>ConfirmDialog</code> (<code>onCancel</code>) passaient l’événement du clic quand le bouton
    les appelait directement. <code>onOpenChange(false)</code> reçoit <code>false</code>, quelle que
    soit la fermeture : croix, bouton, Échap ou voile.
  </>,
  <>
    <code>Modal</code> et <code>SidePanel</code> appelaient <code>onClose()</code> sans argument :{' '}
    <code>onOpenChange(false)</code> s’y substitue tel quel.
  </>,
];

const CHECKBOX = `<Toggle role="checkbox" label="Wi-Fi" />`;

export const migrationPage: DocPage = {
  slug: 'migrer-vers-4',
  label: 'Migrer vers la 4.0',
  group: 'introduction',
  title: 'Migrer vers la 4.0',
  searchTerms: [
    '4.0',
    '4.0.0',
    '3.0',
    'migration',
    'déprécié',
    'dépréciation',
    'deprecated',
    'retiré',
    'role switch',
  ],
  lede: (
    <>
      La {REMOVAL_VERSION} a retiré les noms dépréciés de la 2.x. Remplacez chacun par le nom
      indiqué ici : le compilateur signale ceux qui restent.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen title="À retenir">
        <p className="tc-doc-prose">
          Les noms dépréciés depuis 2.6, 2.7 et 2.10 ne compilent plus depuis la {REMOVAL_VERSION} :
          les {REMOVED_PROPS.length} props et {REMOVED_EXPORTS.length} exports ci-dessous sont la
          liste complète de ce que la 4.0 a retiré.
        </p>
        <ul className="tc-doc-checklist">
          <li>TypeScript refuse chaque ancien nom ; le tableau donne son remplaçant.</li>
          <li>
            La valeur reste la même, sauf quand la colonne précise une correspondance — et sauf pour
            les rappels listés plus bas, qui changent aussi de signature.
          </li>
          <li>Aucun avertissement ne part plus dans la console : l’erreur est à la compilation.</li>
        </ul>
      </Specimen>

      <MigrationTable
        id="migration-props"
        title="Les props retirées"
        note="Renommez la prop ; la valeur reste la même, sauf quand la colonne précise une correspondance ou un changement de signature."
        columns={['Composant', 'Ancien nom', 'À utiliser', 'Dépréciée en']}
        rows={PROP_ROWS}
      />

      <MigrationTable
        id="migration-exports"
        title="Les exports retirés"
        note="Un import d’un de ces noms ne compile plus : importez le remplaçant, ou chaque composant par son nom."
        columns={['Export', 'Nature', 'À utiliser', 'Déprécié en']}
        rows={EXPORT_ROWS}
      />

      <Specimen title="Les rappels qui changent de signature">
        <ul className="tc-doc-checklist">
          {SIGNATURE_CHANGES.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Ce que la 4.0 a changé aussi">
        <ul className="tc-doc-checklist">
          {BREAKING_CHANGES.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
        <UsageBlock label="Garder l’annonce d’une case à cocher" code={CHECKBOX} actions={false} />
      </Specimen>
    </PageBody>
  ),
};
