import type { ReactNode } from 'react';

import {
  DEPRECATED_EXPORTS,
  DEPRECATED_PROPS,
  DEPRECATION_REMOVAL,
  deprecationMessage,
} from '../../opale/deprecations';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { MigrationTable, ReplacementCell, type MigrationRow } from './migration-table';

/* =============================================================================
   « MIGRER VERS LA 4.0 », DÉDUITE DE LA TABLE DES DÉPRÉCIATIONS.

   Aucune ligne des deux tableaux n'est écrite ici : elles viennent de
   `src/opale/deprecations.ts`, la table que lit aussi l'avertissement de
   développement et que `deprecations.structure.test.ts` tient contre chaque
   `@deprecated` du code. Une prop dépréciée demain apparaît donc sur cette page
   sans qu'on la touche — et ne peut pas y manquer.

   Les anciens noms n'apparaissent qu'en données, jamais dans un extrait : la
   vitrine n'enseigne pas l'API dépréciée (`no-deprecated-api.structure.test.ts`).
   ========================================================================== */

const PROP_ROWS = DEPRECATED_PROPS.map((entry): MigrationRow => ({
  key: `${entry.component}.${entry.prop}`,
  cells: [
    <code key="component">{entry.component}</code>,
    <code key="prop">{entry.prop}</code>,
    <ReplacementCell
      key="replacement"
      replacement={entry.replacement}
      note={'note' in entry ? entry.note : undefined}
    />,
    entry.since,
  ],
}));

const EXPORT_ROWS = DEPRECATED_EXPORTS.map((entry): MigrationRow => ({
  key: entry.name,
  cells: [
    <code key="name">{entry.name}</code>,
    entry.kind === 'type' ? 'type' : 'valeur',
    <ReplacementCell
      key="replacement"
      replacement={entry.replacement}
      note={'note' in entry ? entry.note : undefined}
    />,
    entry.since,
  ],
}));

/** Ce que la 3.0.0 changera en plus du retrait des anciens noms. */
const BREAKING_CHANGES: readonly ReactNode[] = [
  <>
    <code>Toggle</code> exposera <code>role="switch"</code> par défaut : il s’annoncera « activé /
    désactivé ». Posez-le dès maintenant pour vérifier vos tests et vos parcours au lecteur d’écran.
  </>,
  <>
    Les attributs <code>data-testid</code> posés par <code>Modal</code> et{' '}
    <code>ToastProvider</code> (<code>modal-container</code>, <code>modal-overlay</code>,{' '}
    <code>toast</code>, <code>toast-portal</code>) disparaissent : visez les rôles ARIA ou les
    classes stables <code>opale-*</code>.
  </>,
  <>
    La plage des dépendances pairs de React, aujourd’hui <code>&gt;=19</code>, sera bornée aux
    versions majeures éprouvées.
  </>,
  <>
    La feuille héritée <code>tokens.css</code> (tirée de <code>src/tokens</code>) quitte le paquet :{' '}
    <code>opale.css</code> porte déjà les jetons <code>--opale-*</code>.
  </>,
  <>
    <code>SiteNav</code> exigera <code>items</code> : ses destinations par défaut disparaissent avec{' '}
    <code>DEFAULT_SITE_NAV_ITEMS</code>.
  </>,
];

const SWITCH = `<Toggle role="switch" label="Wi-Fi" />`;

const EXAMPLE_WARNING = deprecationMessage(DEPRECATED_PROPS[0]);

export const migrationPage: DocPage = {
  slug: 'migrer-vers-3',
  label: 'Migrer vers la 3.0',
  group: 'introduction',
  title: 'Migrer vers la 3.0',
  searchTerms: [
    '3.0',
    '3.0.0',
    'migration',
    'déprécié',
    'dépréciation',
    'deprecated',
    'avertissement',
    'console',
    'role switch',
  ],
  lede: (
    <>
      La 2.9 est la dernière 2.x : rien n’y casse, mais chaque ancien nom s’y signale. Remplacez-les
      ici, et la 3.0.0 s’installera sans surprise.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen title="À retenir">
        <p className="tc-doc-prose">
          Les noms dépréciés depuis 2.6 et 2.7 compilent encore et gardent leur effet. La{' '}
          {DEPRECATION_REMOVAL} les retirera : les {DEPRECATED_PROPS.length} props et{' '}
          {DEPRECATED_EXPORTS.length} exports ci-dessous sont la liste complète.
        </p>
        <ul className="tc-doc-checklist">
          <li>L’éditeur barre chaque ancien nom et affiche son remplaçant.</li>
          <li>En développement, la console le signale une fois par page chargée.</li>
          <li>Le build de production n’écrit rien.</li>
        </ul>
      </Specimen>

      <MigrationTable
        id="migration-props"
        title="Les props dépréciées"
        note="Renommez la prop ; la valeur reste la même, sauf quand la colonne précise une correspondance."
        columns={['Composant', 'Ancien nom', 'À utiliser', 'Depuis']}
        rows={PROP_ROWS}
      />

      <MigrationTable
        id="migration-exports"
        title="Les exports dépréciés"
        note="Un type ou un alias d’export ne s’exécute pas : ceux-là ne préviennent pas dans la console, seul l’éditeur les barre."
        columns={['Export', 'Nature', 'À utiliser', 'Depuis']}
        rows={EXPORT_ROWS}
      />

      <Specimen title="Ce que la 3.0.0 changera aussi">
        <ul className="tc-doc-checklist">
          {BREAKING_CHANGES.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
        <UsageBlock label="Adopter l’interrupteur dès la 2.9" code={SWITCH} actions={false} />
      </Specimen>

      <Specimen title="Voir les avertissements">
        <p className="tc-doc-prose">
          Lancez l’application en développement et ouvrez la console du navigateur. Chaque couple
          composant + ancien nom s’y signale une seule fois, sous cette forme :
        </p>
        <UsageBlock label="Console" code={EXAMPLE_WARNING} actions={false} />
        <p className="tc-doc-prose">
          Le garde lit <code>process.env.NODE_ENV</code>, que Vite, Next.js ou webpack remplacent au
          build : en production, l’appel disparaît. Un <code>Toggle</code> sans nom accessible y est
          signalé de la même façon.
        </p>
      </Specimen>
    </PageBody>
  ),
};
