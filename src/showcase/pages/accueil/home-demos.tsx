import { useState, type ReactNode } from 'react';

import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SplitHeading,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../../opale';
import { STAGE_GROUND } from '../composants/stage';
import type { HomeCopy } from './home-copy';

/* LES DÉMONSTRATIONS VIVANTES DES DIAPOSITIVES DE L'ACCUEIL, une par famille,
   faites des vrais composants. Le verre liquide n'est jamais posé sur le fond
   de la bande : il vit dans un puits photographié (`GlassWell`), le seul
   endroit où il a quelque chose à réfracter. `home-slides.tsx` les range. */

export type Demos = HomeCopy['components']['demos'];

/* Le puits photographié, voilé à 65 % : le verre y garde son encre blanche à
   4,5:1, mesurée sur la même photographie que les pages de composant. */
function GlassWell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tc-doc-landing-slide__glass" style={{ background: STAGE_GROUND }}>
      {children}
    </div>
  );
}

export function InputDemo({ demos }: { readonly demos: Demos }) {
  return (
    <>
      <div className="tc-doc-landing-slide__row">
        <Button size="small">{demos.primary}</Button>
        <Button size="small" variant="secondary">
          {demos.secondary}
        </Button>
        <Button size="small" variant="tonal">
          {demos.tonal}
        </Button>
      </div>
      <GlassWell>
        <Button size="small" liquidGlass>
          {demos.glass}
        </Button>
      </GlassWell>
    </>
  );
}

export function FormDemo({ demos }: { readonly demos: Demos }) {
  return (
    <Textarea
      label={demos.message}
      helperText={demos.messageHelp}
      size="small"
      autoResize
      maxRows={3}
      showCount
      maxLength={120}
      defaultValue={demos.messageValue}
    />
  );
}

export function OverlayDemo({ demos }: { readonly demos: Demos }) {
  return (
    <Popover>
      <PopoverTrigger className="opale-button opale-button--secondary opale-button--small">
        {demos.popoverTrigger}
      </PopoverTrigger>
      <PopoverContent placement="bottom" align="start" className="tc-doc-landing-slide__popover">
        <strong>{demos.popoverTitle}</strong>
        <p>{demos.popoverBody}</p>
      </PopoverContent>
    </Popover>
  );
}

export function DisplayDemo({ demos }: { readonly demos: Demos }) {
  return (
    <>
      <div className="tc-doc-landing-slide__row">
        <Badge>{demos.stable}</Badge>
        <Badge tone="accent">{demos.fresh}</Badge>
        <Badge tone="danger">{demos.offline}</Badge>
      </div>
      <GlassWell>
        <Badge liquidGlass>{demos.stable}</Badge>
        <Badge liquidGlass tone="accent">
          {demos.fresh}
        </Badge>
      </GlassWell>
    </>
  );
}

export function NavigationDemo({ demos }: { readonly demos: Demos }) {
  const [first] = demos.tabs;
  return (
    <Tabs defaultValue={first?.[0] ?? ''} className="tc-doc-landing-slide__tabs">
      <TabsList aria-label={demos.tabsLabel}>
        {demos.tabs.map(([name]) => (
          <TabsTrigger key={name} value={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {demos.tabs.map(([name, text]) => (
        <TabsContent key={name} value={name}>
          <p>{text}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* Le titre découpé, rejoué au bouton : une clé neuve le remonte, et il
   repart du premier mot. Niveau 4 : il vit sous le titre de la diapositive. */
export function MotionDemo({ demos }: { readonly demos: Demos }) {
  const [run, setRun] = useState(0);
  return (
    <div className="tc-doc-landing-slide__motion">
      <SplitHeading key={run} level={4} trigger="mount" className="tc-doc-landing-slide__split">
        {demos.splitTitle}
      </SplitHeading>
      <Button size="small" variant="secondary" onClick={() => setRun((count) => count + 1)}>
        {demos.replay}
      </Button>
    </div>
  );
}
