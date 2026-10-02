import{S as e,f as t,l as n,o as r,p as i,s as a,u as o,w as s}from"./index-BnvZ6beJ.js";import{t as c}from"./opale-api-data-ZJJTv25R.js";var l=s(),u=e(),d=[{value:`design`,label:`Design system`},{value:`code`,label:`Code`},{value:`docs`,label:`Documentation`}],f=[{id:`overview`,label:`Vue d’ensemble`},{id:`activity`,label:`Activité`},{id:`settings`,label:`Réglages`}],p=`opale-demo-cookie-consent`,m=`data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 360%22%3E%3Crect width=%22640%22 height=%22360%22 fill=%22%23dce7fb%22/%3E%3Ccircle cx=%22180%22 cy=%22155%22 r=%2275%22 fill=%22%233d66aa%22/%3E%3Cpath d=%22M40 320 245 120l95 105 80-70 180 165Z%22 fill=%22%23f8b31a%22 opacity=%22.85%22/%3E%3C/svg%3E`,h=[`neutral`,`success`,`warning`,`error`,`info`],g=[`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`],_={neutral:`Modifications enregistrées`,success:`Étape publiée sur le carnet`,warning:`La carte n’a pas été régénérée`,error:`Publication refusée : titre manquant`,info:`Une nouvelle version est disponible`};function v({children:e}){return(0,u.jsx)(`div`,{className:`tc-doc-opale-preview__row`,children:e})}function y({children:e}){return(0,u.jsx)(`div`,{className:`tc-doc-opale-demo`,children:e})}var b=4,x=240,S=72;function C(e){let[t,n]=(0,l.useState)(S);return(0,l.useEffect)(()=>{if(!e||window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches)return;let t=window.setInterval(()=>{n(e=>e>=100?0:Math.min(100,e+b))},x);return()=>window.clearInterval(t)},[e]),t}function w({name:e,liquidGlass:n,playground:r}){let[a,o]=(0,l.useState)(`Prêt`),[s,c]=(0,l.useState)(`Opale`),[b,x]=(0,l.useState)(`design`),[S,w]=(0,l.useState)([`design`,`docs`]),[T,E]=(0,l.useState)(64),[D,O]=(0,l.useState)(!0),[k,A]=(0,l.useState)(`success`),[j,M]=(0,l.useState)(`bottom-right`),[N,P]=(0,l.useState)(!1),[F,I]=(0,l.useState)(!1),[L,R]=(0,l.useState)(!1),[z,B]=(0,l.useState)(0),[V,H]=(0,l.useState)(!1),[U,W]=(0,l.useState)(`overview`),[G,K]=(0,l.useState)(!1),[q,J]=(0,l.useState)(2),[Y,X]=(0,l.useState)(3),Z=C(e===`ProgressBar`),Q;switch(e){case`Button`:Q=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)(v,{children:[(0,u.jsx)(i.Button,{liquidGlass:n,children:`Primaire`}),(0,u.jsx)(i.Button,{liquidGlass:n,variant:`secondary`,children:`Secondaire`}),(0,u.jsx)(i.Button,{liquidGlass:n,variant:`accent`,children:`Accent`}),(0,u.jsx)(i.Button,{liquidGlass:n,variant:`danger`,children:`Danger`})]}),r&&(0,u.jsx)(`div`,{className:`tc-doc-opale-playground__result`,children:(0,u.jsx)(i.Button,{liquidGlass:n,variant:r.buttonVariant,size:r.buttonSize,loading:r.buttonLoading,children:`Essai configuré`})})]});break;case`Pressable`:Q=(0,u.jsxs)(i.Pressable,{liquidGlass:n,onClick:()=>o(`Surface activée`),children:[`Surface pressable · `,a]});break;case`InlineInput`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.InlineInput,{liquidGlass:n,label:`Nom du projet`,helperText:`Entrée valide, Échap rétablit.`,value:s,onChange:e=>c(e.currentTarget.value),onCommit:e=>o(`Validé : ${e}`),onCancel:e=>{c(e),o(`Modification abandonnée`)}}),(0,u.jsx)(`span`,{role:`status`,children:a})]});break;case`Input`:Q=(0,u.jsx)(i.Input,{liquidGlass:n,label:`Email`,placeholder:`thomas@crn-studio.com`,helperText:`Une adresse valide est requise.`,error:r?.inputError?`Adresse invalide`:void 0,disabled:r?.inputDisabled});break;case`Checkbox`:Q=(0,u.jsx)(i.Checkbox,{liquidGlass:n,label:`Recevoir les notifications`,description:`Les nouveautés du design system.`,defaultChecked:!0});break;case`Toggle`:Q=(0,u.jsx)(i.Toggle,{liquidGlass:n,label:`Notifications activées`,defaultChecked:!0});break;case`Slider`:Q=(0,u.jsx)(i.Slider,{liquidGlass:n,label:`Volume`,value:T,valueLabel:`${T} %`,min:0,max:100,onChange:e=>E(Number(e.currentTarget.value))});break;case`MultiSelect`:Q=(0,u.jsx)(i.MultiSelect,{liquidGlass:n,label:`Domaines`,values:S,options:d,onChange:e=>w(Array.from(e.currentTarget.selectedOptions,e=>e.value))});break;case`Select`:Q=(0,u.jsx)(i.Select,{liquidGlass:n,label:`Domaine`,value:b,options:d,onChange:e=>x(e.currentTarget.value)});break;case`Autocomplete`:Q=(0,u.jsx)(i.Autocomplete,{liquidGlass:n,label:`Composant`,placeholder:`Commencez à saisir…`,options:[`Button`,`Card`,`Modal`,`Select`]});break;case`Form`:Q=(0,u.jsxs)(i.Form,{onSubmit:e=>{e.preventDefault(),o(`Formulaire envoyé`)},children:[(0,u.jsx)(i.Input,{label:`Projet`,defaultValue:`Opale UI`}),(0,u.jsx)(i.Button,{type:`submit`,children:`Envoyer`}),(0,u.jsx)(`span`,{role:`status`,children:a})]});break;case`SegmentedControl`:Q=(0,u.jsx)(i.SegmentedControl,{liquidGlass:n,options:d,value:b,onChange:x});break;case`IconActionButton`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.IconActionButton,{liquidGlass:n,icon:`share`,label:`Partager`,onClick:()=>o(`Lien partagé`)}),(0,u.jsx)(`span`,{role:`status`,children:a})]});break;case`Card`:Q=(0,u.jsx)(i.Card,{liquidGlass:n,title:`Une surface Opale`,subtitle:`Carte, actions et élévation.`,actions:(0,u.jsx)(i.Badge,{children:`Stable`}),children:(0,u.jsx)(`p`,{children:`Une surface claire, lisible et responsive.`})});break;case`CardGrid`:Q=(0,u.jsxs)(i.CardGrid,{children:[(0,u.jsx)(i.StatCard,{liquidGlass:n,label:`Composants`,value:String(t.length),delta:`Catalogue complet`}),(0,u.jsx)(i.StatCard,{liquidGlass:n,label:`Thèmes`,value:`3`,delta:`Clair, sombre, verre`})]});break;case`DataTable`:Q=(0,u.jsx)(i.DataTable,{liquidGlass:n,caption:`Composants`,showRowCount:!0,striped:r?.tableStriped??!0,density:r?.tableDensity,columns:[{key:`name`,label:`Nom`,sortable:!0},{key:`uses`,label:`Usages`,sortable:!0,align:`end`},{key:`status`,label:`Statut`}],rowKey:e=>String(e.name),loading:r?.tableMode===`loading`,rows:r?.tableMode===`empty`?[]:[{name:`DataTable`,uses:4,status:`Nouveau`},{name:`Button`,uses:128,status:`Stable`},{name:`Autocomplete`,uses:17,status:`Stable`}]});break;case`DescriptionList`:Q=(0,u.jsx)(i.DescriptionList,{items:[{term:`Version`,description:`3.2.0`},{term:`Licence`,description:`MIT`},{term:`React`,description:`≥ 19`}]});break;case`BulletList`:Q=(0,u.jsx)(i.BulletList,{items:[`Accessible au clavier`,`TypeScript strict`,`Thèmes clair et sombre`]});break;case`Badge`:Q=(0,u.jsxs)(v,{children:[(0,u.jsx)(i.Badge,{liquidGlass:n,children:`Stable`}),(0,u.jsx)(i.Badge,{liquidGlass:n,tone:`accent`,children:`Nouveau`}),(0,u.jsx)(i.Badge,{liquidGlass:n,tone:`danger`,children:`Critique`}),(0,u.jsx)(i.Badge,{liquidGlass:n,tone:`danger`,dot:!0,children:`3 messages non lus`})]});break;case`RatingInput`:Q=(0,u.jsx)(i.RatingInput,{label:`Qualité de l’expérience`,value:Y,onChange:X});break;case`Pagination`:Q=(0,u.jsx)(i.Pagination,{page:q,pageCount:8,onChange:J});break;case`Skeleton`:Q=(0,u.jsxs)(`div`,{role:`status`,"aria-label":`Chargement de la fiche`,className:`tc-doc-opale-demo`,children:[(0,u.jsx)(i.Skeleton,{width:`45%`,height:`1.5rem`}),(0,u.jsx)(i.Skeleton,{height:`5rem`}),(0,u.jsx)(i.Skeleton,{width:`70%`})]});break;case`Rating`:Q=(0,u.jsx)(i.Rating,{value:4.75,max:5});break;case`StatCard`:Q=(0,u.jsx)(i.StatCard,{liquidGlass:n,label:`Disponibilité`,value:`99,9 %`,delta:`+0,4 %`});break;case`Donut`:Q=(0,u.jsx)(i.Donut,{value:72,label:`72 %`});break;case`LegalLinks`:Q=(0,u.jsx)(i.LegalLinks,{links:[{id:`installation`,label:`Installation`,href:`#/installation`},{id:`accessibility`,label:`Accessibilité`,href:`#/accessibilite`}]});break;case`Heading`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.Heading,{level:2,children:`Titre de section`}),(0,u.jsx)(i.Heading,{level:3,children:`Sous-section`})]});break;case`Text`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.Text,{children:`Corps de texte lisible.`}),(0,u.jsx)(i.Text,{variant:`caption`,children:`Légende secondaire`}),(0,u.jsx)(i.Text,{variant:`metric`,children:`2 328`})]});break;case`Icon`:Q=(0,u.jsxs)(v,{children:[(0,u.jsx)(i.Icon,{name:`compass`,label:`Boussole`}),(0,u.jsx)(i.Icon,{name:`map-pin`,label:`Point sur la carte`}),(0,u.jsx)(i.Icon,{name:`luggage`,label:`Bagage`}),(0,u.jsx)(i.Icon,{name:`bell`,label:`Notifications`}),(0,u.jsx)(i.Icon,{name:`✦`,label:`Étincelle`})]});break;case`Feedback`:Q=(0,u.jsx)(i.Feedback,{liquidGlass:n,severity:`success`,title:`En production`,children:`La dernière version est disponible.`});break;case`Toast`:Q=(0,u.jsxs)(y,{children:[(0,u.jsxs)(`div`,{className:`tc-doc-opale-preview__row`,children:[(0,u.jsx)(i.Select,{label:`Ton`,value:k,onChange:e=>A(e.currentTarget.value),options:h.map(e=>({value:e,label:e}))}),(0,u.jsx)(i.Select,{label:`Place à l’écran`,value:j,onChange:e=>M(e.currentTarget.value),options:g.map(e=>({value:e,label:e}))})]}),(0,u.jsx)(`code`,{className:`tc-doc-inline-code`,children:`<Opale.Toast tone="${k}" position="${j}" message="…" />`}),(0,u.jsx)(i.Button,{size:`small`,onClick:()=>O(!0),children:`Afficher le toast`}),(0,u.jsxs)(`p`,{className:`tc-doc-prose`,children:[`Six places : `,(0,u.jsx)(`code`,{children:`top-left`}),`, `,(0,u.jsx)(`code`,{children:`top-center`}),`, `,(0,u.jsx)(`code`,{children:`top-right`}),`,`,` `,(0,u.jsx)(`code`,{children:`bottom-left`}),`, `,(0,u.jsx)(`code`,{children:`bottom-center`}),`, `,(0,u.jsx)(`code`,{children:`bottom-right`}),`. Elles sont relatives à la `,(0,u.jsx)(`strong`,{children:`fenêtre`}),` et non au bloc qui appelle le composant : le message est rendu dans un portail, donc il sort de ce cadre et va se poser dans le coin demandé. Cinq tons : `,(0,u.jsx)(`code`,{children:`neutral`}),` (sans couleur), `,(0,u.jsx)(`code`,{children:`success`}),`,`,` `,(0,u.jsx)(`code`,{children:`warning`}),`, `,(0,u.jsx)(`code`,{children:`error`}),` et `,(0,u.jsx)(`code`,{children:`info`}),` ; `,(0,u.jsx)(`code`,{children:`error`}),` et`,` `,(0,u.jsx)(`code`,{children:`warning`}),` sont annoncés de façon assertive, les autres poliment, et chacun porte une icône pour que la couleur ne soit pas le seul signal.`]}),(0,u.jsxs)(`p`,{className:`tc-doc-prose`,children:[(0,u.jsx)(`strong`,{children:`Plusieurs messages à la même place s’empilent`}),` dans une ancre partagée, et l’ordre de tabulation suit l’écran : un message posé en haut vient avant la page, un message posé en bas après elle. Minuter et congédier une file reste le travail de`,` `,(0,u.jsx)(`code`,{children:`ToastProvider`}),`.`]}),(0,u.jsx)(i.Toast,{open:D,liquidGlass:n,tone:k,position:j,message:_[k],onClose:()=>O(!1)})]});break;case`Spinner`:Q=(0,u.jsx)(i.Spinner,{label:`Chargement des composants`});break;case`ProgressBar`:Q=(0,u.jsx)(i.ProgressBar,{liquidGlass:n,label:`Progression`,value:Z});break;case`ConfirmDialog`:Q=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(i.Button,{onClick:()=>P(!0),children:`Supprimer le fichier`}),(0,u.jsx)(i.ConfirmDialog,{open:N,liquidGlass:n,title:`Supprimer le fichier ?`,onCancel:()=>P(!1),onConfirm:()=>{P(!1),o(`Fichier supprimé`)},children:`Cette action est irréversible.`})]});break;case`EmptyState`:Q=(0,u.jsx)(i.EmptyState,{liquidGlass:n,title:`Aucun projet`,description:`Créez votre premier projet Opale.`,action:(0,u.jsx)(i.Button,{children:`Créer un projet`})});break;case`Navbar`:Q=(0,u.jsx)(i.Navbar,{liquidGlass:n,items:f,activeId:U,onSelect:W});break;case`Menu`:Q=(0,u.jsx)(i.Menu,{liquidGlass:n,label:`Actions`,items:[{id:`duplicate`,label:`Dupliquer`},{id:`archive`,label:`Archiver`}]});break;case`Link`:Q=(0,u.jsx)(i.Link,{href:`#/installation`,children:`Lire le guide d’installation →`});break;case`SidePanel`:Q=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(i.Button,{onClick:()=>I(!0),children:`Ouvrir le panneau`}),(0,u.jsx)(i.SidePanel,{open:F,liquidGlass:n,title:`Réglages`,onClose:()=>I(!1),children:(0,u.jsx)(i.Toggle,{label:`Notifications`,defaultChecked:!0})})]});break;case`CommandPalette`:Q=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(i.Button,{onClick:()=>R(!0),children:`Ouvrir la palette`}),(0,u.jsx)(i.CommandPalette,{open:L,liquidGlass:n,value:s,onChange:c,onClose:()=>R(!1)})]});break;case`Breadcrumb`:Q=(0,u.jsx)(i.Breadcrumb,{items:[{id:`home`,label:`Accueil`,href:`#/`},{id:`components`,label:`Composants`,href:`#/composants/opale-button`},{id:`button`,label:`Button`}]});break;case`CookieBanner`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.Button,{size:`small`,onClick:()=>{try{window.localStorage.removeItem(p)}catch{}B(e=>e+1)},children:`Réafficher`}),(0,u.jsx)(i.CookieBanner,{storageKey:p,liquidGlass:n,onAccept:()=>o(`Cookies acceptés — choix mémorisé`),onDecline:()=>o(`Cookies refusés — choix mémorisé`)},z),(0,u.jsx)(`span`,{role:`status`,children:a})]});break;case`SelectionBar`:Q=(0,u.jsx)(i.SelectionBar,{liquidGlass:n,selectedCount:3,children:(0,u.jsx)(i.Button,{size:`small`,variant:`danger`,children:`Supprimer`})});break;case`Stack`:Q=(0,u.jsxs)(i.Stack,{direction:`row`,wrap:!0,children:[(0,u.jsx)(i.Badge,{children:`Design`}),(0,u.jsx)(i.Badge,{children:`Code`}),(0,u.jsx)(i.Badge,{children:`Documentation`})]});break;case`Layout`:Q=(0,u.jsxs)(i.Layout,{className:`tc-doc-opale-demo__layout`,navigation:(0,u.jsx)(i.Navbar,{items:f.slice(0,2),activeId:`overview`}),children:[(0,u.jsx)(i.Heading,{level:3,children:`Contenu principal`}),(0,u.jsx)(i.Text,{children:`Une grille navigation-contenu responsive.`})]});break;case`Divider`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(`span`,{children:`Avant le séparateur`}),(0,u.jsx)(i.Divider,{}),(0,u.jsx)(`span`,{children:`Après le séparateur`})]});break;case`BackgroundSurface`:Q=(0,u.jsx)(i.BackgroundSurface,{className:`tc-doc-opale-demo__background`,children:(0,u.jsx)(i.Card,{title:`Fond animé`,children:`Contenu au premier plan`})});break;case`FileCard`:Q=(0,u.jsx)(i.FileCard,{liquidGlass:n,name:`design-system.fig`,size:`2,4 Mo`,selected:G,onClick:()=>K(e=>!e)});break;case`Dropzone`:Q=(0,u.jsxs)(y,{children:[(0,u.jsx)(i.Dropzone,{liquidGlass:n,accept:`image/*`,maxFiles:3,maxSizeBytes:5e6,onFiles:e=>o(`${e.length} fichier${e.length>1?`s`:``} reçu${e.length>1?`s`:``}`),children:`Déposez les maquettes ici`}),(0,u.jsx)(`span`,{role:`status`,children:a})]});break;case`Lightbox`:Q=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(i.Button,{onClick:()=>H(!0),children:`Voir l’image`}),(0,u.jsx)(i.Lightbox,{liquidGlass:n,src:m,alt:`Aperçu abstrait Opale`,open:V,onClose:()=>H(!1)})]});break;case`Clipboard`:Q=(0,u.jsx)(i.Clipboard,{liquidGlass:n,value:`npm install @thomascaron/opale-ui`,children:`Copier la commande`});break;case`SvgMap`:Q=(0,u.jsx)(i.SvgMap,{liquidGlass:n,label:`Trois zones`,viewBox:`0 0 300 120`,selectable:!0,regions:[{id:`nord`,path:`M10 10 H140 V60 H10 Z`,name:`Nord`},{id:`est`,path:`M150 10 H290 V110 H150 Z`,name:`Est`},{id:`sud`,path:`M10 70 H140 V110 H10 Z`,name:`Sud`}]});break;default:Q=(0,u.jsxs)(i.Feedback,{severity:`error`,title:`Démonstration manquante`,children:[`Le composant `,e,` n’a pas encore de spécimen.`]})}return(0,u.jsx)(`div`,{className:`tc-doc-opale-preview__material`,"data-liquid-glass":n?`true`:void 0,"data-preview-component":e,children:Q})}var T=`Autocomplete.Badge.Button.Card.CardGrid.Checkbox.Clipboard.CommandPalette.ConfirmDialog.CookieBanner.DataTable.Dropzone.EmptyState.Feedback.FileCard.IconActionButton.InlineInput.Input.Lightbox.Menu.MultiSelect.Navbar.Pressable.ProgressBar.SegmentedControl.Select.SelectionBar.SidePanel.Slider.StatCard.SvgMap.Toast.Toggle`.split(`.`);function E(e,t){let r=t===`CardGrid`?`StatCard`:n(t),i=[...e.matchAll(RegExp(`<Opale\\.${r}(?=[\\s/>])`,`g`))],a=[];for(let t of i){let n=t.index,r=0,i=null;for(let o=n+t[0].length;o<e.length;o+=1){let t=e[o];if(i){if(t===`\\`){o+=1;continue}t===i&&(i=null)}else if(t===`"`||t===`'`||t==="`")i=t;else if(t===`{`)r+=1;else if(t===`}`)--r;else if(t===`>`&&r===0){let t=e.slice(n,o);/\bliquidGlass\b/.test(t)||a.push(e[o-1]===`/`?o-1:o);break}}}return a.reverse().reduce((e,t)=>`${e.slice(0,t)} liquidGlass${e.slice(t)}`,e)}var D={Pressable:`<Opale.Pressable onClick={() => alert("Action")}>Ouvrir</Opale.Pressable>`,MultiSelect:`<Opale.MultiSelect
  label="Domaines"
  values={['design']}
  options={[{ value: 'design', label: 'Design' }, { value: 'code', label: 'Code' }]}
  onChange={(event) => console.log([...event.currentTarget.selectedOptions].map((item) => item.value))}
/>`,Select:`<Opale.Select
  label="Domaine"
  defaultValue="design"
  options={[{ value: 'design', label: 'Design' }, { value: 'code', label: 'Code' }]}
/>`,Autocomplete:`<Opale.Autocomplete
  label="Composant"
  options={['Button', 'Card', 'Select']}
  placeholder="Commencez à saisir…"
/>`,Form:`<Opale.Form onSubmit={(event) => { event.preventDefault(); alert('Envoyé'); }}>
  <Opale.Input label="Projet" name="project" required />
  <Opale.Button type="submit">Envoyer</Opale.Button>
</Opale.Form>`,IconActionButton:`<Opale.IconActionButton
  icon="share"
  label="Partager cette page"
  onClick={() => void navigator.clipboard?.writeText(location.href)}
/>`,DescriptionList:`<Opale.DescriptionList items={[
  { term: 'Version', description: '3.2.0' },
  { term: 'Licence', description: 'MIT' },
]} />`,BulletList:`<Opale.BulletList items={['Clavier', 'Thème sombre', 'TypeScript']} />`,Donut:`<Opale.Donut value={72} label="72 % des tâches terminées" />`,LegalLinks:`<Opale.LegalLinks links={[
  { id: 'legal', label: 'Mentions légales', href: '/mentions-legales' },
  { id: 'privacy', label: 'Confidentialité', href: '/confidentialite' },
]} />`,Icon:`<Opale.Icon name="compass" label="Boussole" />`,Spinner:`<Opale.Spinner label="Chargement des projets" />`,ConfirmDialog:`import { useState } from 'react';

export function DeleteAction() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button variant="danger" onClick={() => setOpen(true)}>Supprimer</Opale.Button>
    <Opale.ConfirmDialog open={open} title="Supprimer ce projet ?"
      onCancel={() => setOpen(false)}
      onConfirm={() => { setOpen(false); console.log('Projet supprimé'); }}>
      Cette action est irréversible.
    </Opale.ConfirmDialog>
  </>;
}`,EmptyState:`<Opale.EmptyState
  title="Aucun projet"
  description="Créez votre premier projet."
  action={<Opale.Link href="/projets/nouveau">Créer un projet</Opale.Link>}
/>`,Navbar:`<Opale.Navbar items={[
  { id: 'home', label: 'Accueil', href: '/' },
  { id: 'projects', label: 'Projets', href: '/projets' },
]} activeId="projects" />`,Menu:`<Opale.Menu label="Actions" items={[
  { id: 'duplicate', label: 'Dupliquer' },
  { id: 'archive', label: 'Archiver' },
]} />`,SidePanel:`import { useState } from 'react';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Réglages</Opale.Button>
    <Opale.SidePanel open={open} title="Réglages" onClose={() => setOpen(false)}>
      <Opale.Toggle label="Notifications" defaultChecked />
    </Opale.SidePanel>
  </>;
}`,CommandPalette:`import { useState } from 'react';

export function Commands() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Commandes</Opale.Button>
    <Opale.CommandPalette open={open} value={query} onChange={setQuery}
      onClose={() => setOpen(false)} />
  </>;
}`,Breadcrumb:`<Opale.Breadcrumb items={[
  { id: 'home', label: 'Accueil', href: '/' },
  { id: 'projects', label: 'Projets', href: '/projets' },
  { id: 'current', label: 'Opale' },
]} />`,SelectionBar:`<Opale.SelectionBar selectedCount={3}>
  <Opale.Button size="small" variant="danger">Supprimer la sélection</Opale.Button>
</Opale.SelectionBar>`,Stack:`<Opale.Stack direction="row" wrap>
  <Opale.Badge>Design</Opale.Badge><Opale.Badge>Code</Opale.Badge>
</Opale.Stack>`,Layout:`<Opale.Layout navigation={<Opale.Navbar items={[{ id: 'home', label: 'Accueil', href: '/' }]} />}>
  <Opale.Heading level={2}>Contenu principal</Opale.Heading>
</Opale.Layout>`,Divider:`<Opale.Text>Avant</Opale.Text>
<Opale.Divider />
<Opale.Text>Après</Opale.Text>`,BackgroundSurface:`<Opale.Background>
  <Opale.Card title="Contenu au premier plan">Bienvenue</Opale.Card>
</Opale.Background>`,Lightbox:`import { useState } from 'react';

export function ImagePreview() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Voir l’image</Opale.Button>
    <Opale.Lightbox src="/visuel.png" alt="Aperçu du projet" open={open}
      onClose={() => setOpen(false)} />
  </>;
}`,RatingInput:`import { useState } from 'react';

export function ReviewRating() {
  const [rating, setRating] = useState(3);
  return <Opale.RatingInput label="Qualité de l’expérience" value={rating} onChange={setRating} />;
}`,Pagination:`import { useState } from 'react';

export function ResultsPagination() {
  const [page, setPage] = useState(2);
  return <Opale.Pagination page={page} pageCount={8} onChange={setPage} />;
}`,Skeleton:`<div role="status" aria-label="Chargement de la fiche">
  <Opale.Skeleton width="45%" height="1.5rem" />
  <Opale.Skeleton height="5rem" />
</div>`,SvgMap:`<Opale.SvgMap
  label="Trois zones"
  viewBox="0 0 300 120"
  selectable
  onSelect={(id) => console.log(id)}
  regions={[
    { id: 'nord', path: 'M10 10 H140 V60 H10 Z', name: 'Nord' },
    { id: 'est', path: 'M150 10 H290 V110 H150 Z', name: 'Est' },
    { id: 'sud', path: 'M10 70 H140 V110 H10 Z', name: 'Sud' },
  ]}
/>`};function O(e,r=!1){let i=n(e),a=t=>r&&T.includes(e)?E(t,e):t;switch(e){case`Button`:return a(`<Opale.Button variant="primary">Primaire</Opale.Button>
<Opale.Button variant="secondary">Secondaire</Opale.Button>
<Opale.Button variant="accent">Accent</Opale.Button>
<Opale.Button variant="danger">Danger</Opale.Button>`);case`Input`:return a(`<Opale.Input
  label="Email"
  placeholder="thomas@crn-studio.com"
  helperText="Une adresse valide est requise."
/>`);case`Checkbox`:return a(`<Opale.Checkbox
  label="Recevoir les notifications"
  description="Les nouveautés du design system."
  defaultChecked
/>`);case`Toggle`:return a(`<Opale.Toggle label="Activées" defaultChecked />`);case`Slider`:return a(`<Opale.Slider label="Volume" defaultValue={64} min={0} max={100} />`);case`SegmentedControl`:return a(`<Opale.SegmentedControl
  value="all"
  options={[
    { value: 'all', label: 'Tout' },
    { value: 'active', label: 'Actifs' },
    { value: 'archived', label: 'Archivés' },
  ]}
/>`);case`Card`:return a(`// elevation : 0 (à plat) à 3 (détachée) ; 1 par défaut.
<Opale.Card title="Une surface Opale" subtitle="Carte, actions et élévation." elevation={2}>
  <p>Une surface claire, lisible et responsive.</p>
</Opale.Card>`);case`CardGrid`:return a(`<Opale.CardGrid>
  <Opale.StatCard label="Composants" value="${t.length}" delta="Catalogue Opale" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`);case`Badge`:return a(`<Opale.Badge tone="accent">Nouveau</Opale.Badge>
// dot : un point de notification ; le texte reste lu par les lecteurs d'écran.
<Opale.Badge tone="danger" dot>3 messages non lus</Opale.Badge>`);case`StatCard`:return a(`<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />`);case`Heading`:return a(`<Opale.Heading level={2}>Titre de section</Opale.Heading>`);case`Text`:return a(`<Opale.Text variant="caption">Légende secondaire</Opale.Text>`);case`DataTable`:return a(`// sortable : l'en-tête devient un bouton de tri.
// sortValue : la valeur de tri quand la cellule n'est pas du texte.
<Opale.DataTable
  caption="Composants"
  showRowCount
  striped
  columns={[
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'uses', label: 'Usages', sortable: true, align: 'end' },
    { key: 'status', label: 'Statut' },
  ]}
  rows={[
    { name: 'DataTable', uses: 4, status: 'Nouveau' },
    { name: 'Button', uses: 128, status: 'Stable' },
  ]}
  onSortChange={({ key, direction }) => console.log(key, direction)}
/>`);case`Feedback`:return a(`<Opale.Feedback severity="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`);case`Rating`:return a(`// value : la note, au quart près — 0,25 / 0,5 / 0,75 / 1 par étoile.
// max   : le nombre d'étoiles (5 par défaut).
<Opale.Rating value={4.75} max={5} />`);case`Toast`:return a(`// Le ton choisit la couleur, la place choisit le coin de l'ÉCRAN.
// tone     : 'neutral' | 'success' | 'warning' | 'error' | 'info'
// position : 'top-left'    | 'top-center'    | 'top-right'
//            'bottom-left' | 'bottom-center' | 'bottom-right'
<Opale.Toast
  open={open}
  tone="success"
  position="bottom-right"
  message="Étape publiée sur le carnet"
  onClose={() => setOpen(false)}
/>`);case`ProgressBar`:return a(`<Opale.ProgressBar label="Progression" value={72} />`);case`Link`:return a(`<Opale.Link href="/installation">Lire le guide</Opale.Link>`);case`FileCard`:return a(`import { useState } from 'react';

export function FileSelection() {
  const [selected, setSelected] = useState(false);
  return <Opale.FileCard name="design-system.fig" size="2,4 Mo"
    selected={selected} onClick={() => setSelected((value) => !value)} />;
}`);case`Clipboard`:return a(`<Opale.Clipboard value="npm install @thomascaron/opale-ui" />`);case`CookieBanner`:return a(`// Le choix est mémorisé dans localStorage, sous storageKey
// ('opale-cookie-consent' par défaut ; null coupe la mémoire).
// Sans open, le bandeau ne revient plus une fois le choix fait ;
// open={true} le rouvre, pour un lien « Gérer mes cookies ».

// Au démarrage : onAccept ne part qu'au clic, le choix mémorisé se lit ici
// (import { readCookieConsent } from '@thomascaron/opale-ui').
if (readCookieConsent() === 'accepted') enableAnalytics();

<Opale.CookieBanner
  onAccept={() => enableAnalytics()}
  onDecline={() => disableAnalytics()}
/>`);case`Dropzone`:return a(`// Glisser-déposer ou sélecteur natif : les deux passent par onFiles.
<Opale.Dropzone accept="image/*" maxFiles={3} maxSizeBytes={5000000}
  onFiles={(files) => upload(files)} onError={(message) => announce(message)}>
  Déposez les maquettes ici
</Opale.Dropzone>`);case`InlineInput`:return a(`// Entrée appelle onCommit ; Échap rétablit la dernière valeur validée.
<Opale.InlineInput
  label="Nom du projet"
  defaultValue="Opale"
  onCommit={(value) => rename(value)}
/>`);default:if(!D[e])throw Error(`Exemple manquant pour ${i}`);return a(D[e])}}function k({entry:e}){let t=n(e.name),s=T.includes(e.name),[d,f]=(0,l.useState)(!1),[p,m]=(0,l.useState)(`primary`),[h,g]=(0,l.useState)(`medium`),[_,v]=(0,l.useState)(!1),[y,b]=(0,l.useState)(!1),[x,S]=(0,l.useState)(!1),[C,E]=(0,l.useState)(`filled`),[D,k]=(0,l.useState)(`comfortable`),[A,j]=(0,l.useState)(!0),M={buttonVariant:p,buttonSize:h,buttonLoading:_,inputError:y,inputDisabled:x,tableMode:C,tableDensity:D,tableStriped:A},N=O(e.name,d),P=e.name===`Button`?`${N}\n\n// Essai configuré\n<Opale.Button variant="${p}" size="${h}"${_?` loading`:``}${d?` liquidGlass`:``}>Essai configuré</Opale.Button>`:e.name===`Input`?`<Opale.Input label="Email" placeholder="thomas@crn-studio.com" helperText="Une adresse valide est requise."${y?` error="Adresse invalide"`:``}${x?` disabled`:``}${d?` liquidGlass`:``} />`:e.name===`DataTable`?`const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'uses', label: 'Usages', sortable: true, align: 'end' },
  { key: 'status', label: 'Statut' },
];
const rows = [
  { name: 'DataTable', uses: 4, status: 'Nouveau' },
  { name: 'Button', uses: 128, status: 'Stable' },
  { name: 'Autocomplete', uses: 17, status: 'Stable' },
];
<Opale.DataTable
  caption="Composants"
  showRowCount${A?`
  striped`:``}${D===`compact`?`
  density="compact"`:``}
  columns={columns}
  rowKey={(row) => String(row.name)}
  rows={${C===`empty`?`[]`:`rows`}}${C===`loading`?`
  loading`:``}${d?`
  liquidGlass`:``}
/>`:N,F=c[e.name];if(!F)throw Error(`API manquante pour ${e.name}`);return(0,u.jsxs)(`div`,{className:`tc-doc-opale-page`,children:[(0,u.jsx)(`p`,{className:`tc-doc-lede`,children:e.description}),(0,u.jsxs)(`div`,{className:`tc-doc-opale-meta`,children:[(0,u.jsx)(i.Badge,{children:e.category===`Inputs`?`Saisie`:e.category===`Feedback`?`Retours`:e.category}),(0,u.jsx)(`span`,{children:`Composant Opale · TypeScript strict`})]}),(0,u.jsxs)(`section`,{className:`tc-doc-specimen tc-doc-specimen--opale`,"aria-label":`Démonstration ${t}`,children:[(0,u.jsx)(`div`,{className:`tc-doc-specimen__header`,children:(0,u.jsx)(`h2`,{children:`Aperçu interactif`})}),s&&(0,u.jsxs)(`div`,{className:`tc-doc-opale-material-toggle`,children:[(0,u.jsxs)(`div`,{className:`tc-doc-opale-material-toggle__text`,children:[(0,u.jsx)(`strong`,{children:`Rendu Liquid Glass`}),(0,u.jsx)(`span`,{children:`Appliquer le matériau uniquement à ce composant.`})]}),(0,u.jsx)(i.Toggle,{label:`Liquid Glass pour ${t}`,checked:d,onChange:e=>f(e.currentTarget.checked)})]}),(e.name===`Button`||e.name===`Input`||e.name===`DataTable`)&&(0,u.jsxs)(`fieldset`,{className:`tc-doc-opale-playground`,"aria-label":`Réglages de ${t}`,children:[(0,u.jsx)(`legend`,{children:`Essayer les états`}),e.name===`Button`&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)(`label`,{children:[`Variante`,` `,(0,u.jsxs)(`select`,{value:p,onChange:e=>m(e.currentTarget.value),children:[(0,u.jsx)(`option`,{value:`primary`,children:`Primaire`}),(0,u.jsx)(`option`,{value:`secondary`,children:`Secondaire`}),(0,u.jsx)(`option`,{value:`accent`,children:`Accent`}),(0,u.jsx)(`option`,{value:`danger`,children:`Danger`})]})]}),(0,u.jsxs)(`label`,{children:[`Taille`,` `,(0,u.jsxs)(`select`,{value:h,onChange:e=>g(e.currentTarget.value),children:[(0,u.jsx)(`option`,{value:`small`,children:`Petite`}),(0,u.jsx)(`option`,{value:`medium`,children:`Moyenne`}),(0,u.jsx)(`option`,{value:`large`,children:`Grande`})]})]}),(0,u.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Chargement`,checked:_,onChange:e=>v(e.currentTarget.checked)})]}),e.name===`Input`&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Erreur`,checked:y,onChange:e=>b(e.currentTarget.checked)}),(0,u.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Désactivé`,checked:x,onChange:e=>S(e.currentTarget.checked)})]}),e.name===`DataTable`&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)(`label`,{children:[`État`,` `,(0,u.jsxs)(`select`,{value:C,onChange:e=>E(e.currentTarget.value),children:[(0,u.jsx)(`option`,{value:`filled`,children:`Avec données`}),(0,u.jsx)(`option`,{value:`empty`,children:`Vide`}),(0,u.jsx)(`option`,{value:`loading`,children:`Chargement`})]})]}),(0,u.jsxs)(`label`,{children:[`Densité`,` `,(0,u.jsxs)(`select`,{value:D,onChange:e=>k(e.currentTarget.value),children:[(0,u.jsx)(`option`,{value:`comfortable`,children:`Confortable`}),(0,u.jsx)(`option`,{value:`compact`,children:`Compacte`})]})]}),(0,u.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Lignes alternées`,checked:A,onChange:e=>j(e.currentTarget.checked)})]})]}),(0,u.jsx)(`div`,{className:`tc-doc-opale-preview`,"data-liquid-glass":d?`true`:void 0,children:(0,u.jsx)(w,{name:e.name,liquidGlass:d,playground:M})}),(0,u.jsx)(a,{label:`Exemple ${t}`,code:`import { Opale } from '@thomascaron/opale-ui';\n\n${P}`})]}),(0,u.jsx)(r,{id:o(e.name).replace(`/`,`-`),title:`API et états`,note:F.states,rows:[...F.rows,...s?[{name:`liquidGlass`,type:`boolean`,defaultValue:`false`,description:`Active le matériau en verre.`}]:[]]})]})}export{k as ComponentPage};