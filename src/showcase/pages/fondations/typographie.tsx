import { Specimen } from '../../section';
import { PageBody } from '../api';

interface TypeStep {
  readonly token: string;
  readonly size: string;
  readonly usage: string;
}

const TYPE_STEPS: readonly TypeStep[] = [
  { token: '--text-xs', size: '12 px', usage: 'mention légale, unité, note de bas de tableau' },
  { token: '--text-sm', size: '14 px', usage: 'étiquette, aide de champ, méta' },
  { token: '--text-base', size: '16 px', usage: 'texte courant — le pas de référence' },
  { token: '--text-md', size: '19 px', usage: 'chapeau de page, chapeau de spécimen' },
  { token: '--text-lg', size: '23 px', usage: 'titre de carte, titre de spécimen' },
  /* Sans emploi dans la vitrine ; `section-heading.css` le refuse au niveau 2. */
  { token: '--text-xl', size: '28 px', usage: 'inemployé — le pas laissé libre entre 23 et 30' },
  /* Publiés, mais la vitrine borne ses titres elle-même
     (`clamp()` sur `.tc-doc-page__title`). */
  {
    token: '--text-display-sm',
    size: '24 → 34 px (fluide)',
    usage: 'titre secondaire — publié, inemployé par la vitrine',
  },
  {
    token: '--text-display-md',
    size: '30 → 52 px (fluide)',
    usage: 'titre d’ouverture — la vitrine lui préfère sa propre borne fluide',
  },
];

interface FontFamily {
  readonly token: string;
  readonly name: string;
  readonly note: string;
}

/* Les familles qui peignent la vitrine : Bricolage Grotesque (titres, chiffres
   de l'accueil), Chivo (le reste), Hack (le code). Les jetons cités sont les
   `--opale-font-*` : les `--font-*` de `roles.css` existent encore mais sont
   recouverts par la couche V3. */
const FAMILIES: readonly FontFamily[] = [
  {
    token: '--opale-font-title',
    name: 'Bricolage Grotesque — opsz 72, graisse 600',
    note: 'Les titres de page et les chiffres de l’accueil, et eux seuls.',
  },
  {
    token: '--opale-font-body',
    name: 'Chivo, system-ui, Segoe UI, Roboto',
    note: 'Tout le reste : texte courant, contrôles, étiquettes, sommaire, onglets.',
  },
  {
    token: '--opale-font-display',
    name: 'Chivo, system-ui, Segoe UI, Roboto',
    note: 'Les titres des composants de la librairie — métrique, donut, plaques.',
  },
  {
    token: '--opale-font-mono',
    name: 'Hack, ui-monospace, Cascadia Code, Consolas',
    note: 'Les mesures et le code : hexadécimaux, ratios, noms de jetons.',
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `typographie.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function TypographieContent() {
  return (
    <PageBody>
      <Specimen title="Les huit pas" note="Le texte courant est borné à --measure (66 caractères).">
        <ul className="tc-doc-scale">
          {TYPE_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.size}</span>
                <span className="tc-doc-scale__usage">{step.usage}</span>
              </div>
              <p className="tc-doc-scale__sample" style={{ fontSize: `var(${step.token})` }}>
                Teal &amp; cuivre
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen
        title="Les quatre familles"
        note="Bricolage Grotesque, Chivo et Hack sont servis localement."
      >
        <ul className="tc-doc-scale">
          {FAMILIES.map((family) => (
            <li className="tc-doc-scale__row" key={family.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{family.token}</code>
                <span className="tc-doc-scale__usage">{family.note}</span>
              </div>
              <p
                className="tc-doc-scale__sample tc-doc-scale__sample--family"
                style={{ fontFamily: `var(${family.token})` }}
              >
                Portfolio &amp; travels — 0123456789
                <span className="tc-doc-scale__stack">{family.name}</span>
              </p>
            </li>
          ))}
        </ul>
      </Specimen>
    </PageBody>
  );
}
