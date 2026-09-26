import{_ as e,a as t,c as n,d as r,f as i,l as a,o,y as s}from"./index-C72ZD_TK.js";var c=s();function l(e,t,n,r,i=!1){return{name:e,type:t,description:n,defaultValue:r,required:i}}var u={Button:{states:`Comparer les variantes, la taille et l’état de chargement.`,rows:[l(`variant`,`'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text'`,`Couleur et rôle visuel du bouton.`,`primary`),l(`size`,`'small' | 'medium' | 'large'`,`Taille de la cible et du contenu.`,`medium`),l(`loading`,`boolean`,`Bloque l’action et affiche une progression.`,`false`)]},Pressable:{states:`Action discrète sans surface permanente.`,rows:[l(`onClick`,`MouseEventHandler<HTMLButtonElement>`,`Action déclenchée au clic.`)]},InlineInput:{states:`Entrée valide, Échap annule la dernière modification.`,rows:[l(`label`,`ReactNode`,`Nom visible du champ.`),l(`onCommit`,`(value: string) => void`,`Reçoit la valeur validée.`),l(`onCancel`,`(value: string) => void`,`Reçoit la valeur rétablie.`)]},Input:{states:`Comparer aide, erreur, focus et désactivation.`,rows:[l(`label`,`ReactNode`,`Nom visible du champ.`),l(`helperText`,`ReactNode`,`Aide persistante sous le champ.`),l(`error`,`ReactNode`,`Erreur annoncée aux technologies d’assistance.`)]},Checkbox:{states:`Choix binaire natif, contrôlé ou initialisé par défaut.`,rows:[l(`label`,`ReactNode`,`Nom de la case.`),l(`description`,`ReactNode`,`Précision associée au nom.`),l(`checked`,`boolean`,`État contrôlé par l’application.`)]},Toggle:{states:`Interrupteur pour un réglage activé ou désactivé.`,rows:[l(`label`,`ReactNode`,`Nom visible de l’interrupteur.`),l(`checked`,`boolean`,`État contrôlé par l’application.`)]},Slider:{states:`Valeur ajustable au pointeur et au clavier.`,rows:[l(`label`,`ReactNode`,`Nom visible du curseur.`),l(`value`,`number`,`Valeur contrôlée.`),l(`valueLabel`,`string`,`Valeur lisible affichée près du contrôle.`)]},MultiSelect:{states:`Plusieurs choix, avec état sélectionné annoncé.`,rows:[l(`label`,`ReactNode`,`Nom visible du groupe.`),l(`options`,`readonly { value: string; label: ReactNode }[]`,`Choix proposés.`),l(`values`,`readonly string[]`,`Valeurs actuellement sélectionnées.`)]},Select:{states:`Choix unique sur un contrôle natif.`,rows:[l(`label`,`ReactNode`,`Nom visible du sélecteur.`),l(`options`,`readonly { value: string; label: ReactNode }[]`,`Choix proposés.`),l(`helperText`,`ReactNode`,`Aide sous le sélecteur.`)]},Autocomplete:{states:`Suggestions fournies par l’application dans la liste native.`,rows:[l(`label`,`ReactNode`,`Nom visible du champ.`),l(`options`,`readonly string[]`,`Suggestions textuelles.`)]},Form:{states:`Un formulaire natif qui garde la soumission et la validation du navigateur.`,rows:[l(`onSubmit`,`FormEventHandler<HTMLFormElement>`,`Traite la soumission.`)]},SegmentedControl:{states:`Une seule option sélectionnée ; l’indicateur suit la sélection.`,rows:[l(`options`,`readonly { value: string; label: ReactNode }[]`,`Segments affichés.`,void 0,!0),l(`value`,`string`,`Segment actif.`),l(`onChange`,`(value: string) => void`,`Signale le nouveau segment.`)]},IconActionButton:{states:`Action à icône seule : le libellé doit nommer l’action.`,rows:[l(`icon`,`OpaleIconName`,`Dessin de l’action.`,`more-horizontal`),l(`label`,`string`,`Nom accessible du bouton.`,void 0,!0)]},Card:{states:`La surface conserve son niveau d’élévation dans les deux matériaux.`,rows:[l(`title`,`ReactNode`,`Titre de la carte.`),l(`elevation`,`0 | 1 | 2 | 3`,`Hauteur visuelle.`,`1`),l(`actions`,`ReactNode`,`Actions dans l’en-tête.`)]},CardGrid:{states:`Les cartes se répartissent en colonnes selon la place disponible.`,rows:[l(`children`,`ReactNode`,`Cartes placées dans la grille.`)]},DataTable:{states:`Cliquer un en-tête triable alterne les sens du tri.`,rows:[l(`columns`,`readonly DataTableColumn[]`,`Colonnes et option de tri.`),l(`rows`,`readonly DataTableRow[]`,`Données affichées.`),l(`defaultSort`,`DataTableSort`,`Tri initial.`),l(`rowKey`,`(row, index) => string | number`,`Identité stable des lignes.`),l(`loading`,`boolean`,`Affiche un état de chargement.`,`false`),l(`emptyMessage`,`string`,`Message quand il n’y a aucune ligne.`,`Aucune donnée à afficher.`)]},DescriptionList:{states:`Paires terme et description regroupées sémantiquement.`,rows:[l(`items`,`readonly { term: ReactNode; description: ReactNode }[]`,`Paires affichées.`)]},BulletList:{states:`Liste native pour des éléments textuels ou riches.`,rows:[l(`items`,`readonly ReactNode[]`,`Éléments de liste.`)]},Badge:{states:`Le point de notification reste accompagné d’un texte accessible.`,rows:[l(`tone`,`'primary' | 'accent' | 'danger'`,`Ton de la pastille.`,`primary`),l(`dot`,`boolean`,`Ajoute un point de notification.`,`false`)]},Rating:{states:`Affichage de note uniquement ; la valeur est arrondie au quart.`,rows:[l(`value`,`number`,`Note affichée.`,`0`),l(`max`,`number`,`Nombre d’étoiles du barème.`,`5`)]},RatingInput:{states:`Choisir une note au clavier ou au pointeur.`,rows:[l(`label`,`string`,`Nom du groupe de notation.`,void 0,!0),l(`value`,`number`,`Note contrôlée.`),l(`onChange`,`(value: number) => void`,`Nouvelle note.`)]},Pagination:{states:`La page courante et les bornes sont annoncées.`,rows:[l(`page`,`number`,`Page courante.`,void 0,!0),l(`pageCount`,`number`,`Nombre de pages.`,void 0,!0),l(`onChange`,`(page: number) => void`,`Changement demandé.`,void 0,!0)]},Skeleton:{states:`Décoratif : le conteneur annonce le chargement.`,rows:[l(`width`,`string | number`,`Largeur du repère.`,`100%`),l(`height`,`string | number`,`Hauteur du repère.`,`1rem`)]},StatCard:{states:`Métrique, valeur et variation sur une même surface.`,rows:[l(`label`,`ReactNode`,`Nom de la métrique.`),l(`value`,`ReactNode`,`Valeur principale.`),l(`delta`,`ReactNode`,`Variation ou contexte.`)]},Donut:{states:`Visualisation d’une valeur de progression.`,rows:[l(`value`,`number`,`Pourcentage représenté.`,`60`),l(`label`,`string`,`Nom accessible de l’anneau.`,"`${value}%`")]},LegalLinks:{states:`Liens regroupés dans une navigation nommée.`,rows:[l(`links`,`readonly NavItem[]`,`Adresses et libellés des pages légales.`)]},Heading:{states:`Le niveau HTML détermine la place dans le plan de la page.`,rows:[l(`level`,`1 | 2 | 3 | 4`,`Niveau du titre.`,`2`)]},Text:{states:`Corps, légende ou métrique selon le rôle du texte.`,rows:[l(`variant`,`'body' | 'label' | 'caption' | 'metric'`,`Rôle typographique.`,`body`)]},Icon:{states:`Une icône décorative reste masquée ; une icône informative reçoit un nom.`,rows:[l(`name`,`OpaleIconName | ReactNode`,`Dessin ou nœud à rendre.`,`sparkle`),l(`label`,`string`,`Nom accessible si l’icône porte du sens.`)]},Feedback:{states:`Les erreurs sont annoncées de façon prioritaire.`,rows:[l(`severity`,`'success' | 'info' | 'warning' | 'error'`,`Nature du message.`,`info`),l(`title`,`ReactNode`,`Titre du retour.`)]},Toast:{states:`Notification pilotée par l’application dans le coin choisi de l’écran.`,rows:[l(`open`,`boolean`,`Affiche ou masque le message.`,`true`),l(`tone`,`ToastTone`,`Sens et couleur du message.`,`neutral`),l(`position`,`ToastPlacement`,`Position dans la fenêtre.`,`bottom-right`)]},Spinner:{states:`Progression indéterminée accompagnée d’un nom accessible.`,rows:[l(`label`,`string`,`Action en cours annoncée.`,`Chargement`)]},ProgressBar:{states:`Progression déterminée de 0 à 100.`,rows:[l(`value`,`number`,`Valeur actuelle.`,`0`),l(`label`,`string`,`Nom de la progression.`)]},ConfirmDialog:{states:`Confirmer ou annuler une action importante.`,rows:[l(`open`,`boolean`,`État de la boîte.`,`false`),l(`onConfirm`,`() => void`,`Action confirmée.`),l(`onCancel`,`() => void`,`Fermeture sans action.`)]},EmptyState:{states:`Expliquer une absence de contenu et proposer la prochaine action.`,rows:[l(`title`,`ReactNode`,`Nom de l’état vide.`),l(`description`,`ReactNode`,`Explication courte.`),l(`action`,`ReactNode`,`Action à effectuer ensuite.`)]},Navbar:{states:`Un seul élément est signalé comme page courante.`,rows:[l(`items`,`readonly NavItem[]`,`Liens ou actions de navigation.`),l(`activeId`,`string`,`Identifiant de la page courante.`)]},Menu:{states:`Le contenu se déplie dans le flux de la page.`,rows:[l(`label`,`ReactNode`,`Libellé du contrôle.`,`Menu`),l(`items`,`readonly NavItem[]`,`Actions ou liens proposés.`)]},Link:{states:`Un lien natif, utilisable au clavier et ouvrable dans un nouvel onglet.`,rows:[l(`href`,`string`,`Adresse de destination.`)]},SidePanel:{states:`Panneau latéral contrôlé, fermé par son appelant.`,rows:[l(`open`,`boolean`,`Visibilité du panneau.`,`false`),l(`onClose`,`() => void`,`Demande de fermeture.`)]},CommandPalette:{states:`Le champ et les résultats sont pilotés par l’application.`,rows:[l(`open`,`boolean`,`Visibilité de la palette.`,`false`),l(`value`,`string`,`Texte saisi.`,`''`),l(`onChange`,`(value: string) => void`,`Nouveau texte saisi.`)]},Breadcrumb:{states:`La dernière étape est annoncée comme page courante.`,rows:[l(`items`,`readonly NavItem[]`,`Étapes du chemin.`)]},CookieBanner:{states:`Le choix est mémorisé et peut être rouvert par l’application.`,rows:[l(`onAccept`,`() => void`,`Consentement accepté.`),l(`onDecline`,`() => void`,`Consentement refusé.`),l(`storageKey`,`string | null`,`Clé de persistance.`,`opale-cookie-consent`)]},SelectionBar:{states:`Les actions portent sur le nombre d’éléments sélectionnés.`,rows:[l(`selectedCount`,`number`,`Nombre d’éléments sélectionnés.`,`0`)]},Stack:{states:`Empilement à espacement constant, éventuellement renvoyé à la ligne.`,rows:[l(`direction`,`'row' | 'column'`,`Axe des enfants.`,`column`),l(`wrap`,`boolean`,`Retour à la ligne.`,`false`)]},Layout:{states:`Gabarit navigation et contenu principal.`,rows:[l(`navigation`,`ReactNode`,`Contenu de la colonne de navigation.`)]},Divider:{states:`Séparateur horizontal sémantique sans état interactif.`,rows:[l(`className`,`string`,`Classe de personnalisation visuelle.`)]},BackgroundSurface:{states:`Fond décoratif derrière le contenu.`,rows:[l(`shape`,`boolean`,`Ajoute la forme organique.`,`false`)]},FileCard:{states:`Statique sans onClick ; sélectionnable et annoncée avec une action.`,rows:[l(`name`,`string`,`Nom du fichier.`,void 0,!0),l(`selected`,`boolean`,`État de sélection.`,`false`),l(`onClick`,`() => void`,`Bascule la sélection.`)]},Dropzone:{states:`Dépôt par glisser-déposer ou sélection native.`,rows:[l(`onFiles`,`(files: FileList) => void`,`Fichiers validés.`),l(`accept`,`string`,`Types MIME ou extensions autorisés.`),l(`maxFiles`,`number`,`Nombre maximal par sélection.`),l(`maxSizeBytes`,`number`,`Taille maximale par fichier.`),l(`disabled`,`boolean`,`Désactive le dépôt et le sélecteur.`,`false`)]},Lightbox:{states:`Visionneuse ouverte par l’application et fermée à la demande.`,rows:[l(`src`,`string`,`Adresse de l’image.`),l(`alt`,`string`,`Description de l’image.`,void 0,!0),l(`open`,`boolean`,`Affiche la visionneuse.`,`false`)]},Clipboard:{states:`Copie confirmée seulement après réussite ; l’échec est annoncé.`,rows:[l(`value`,`string`,`Texte à copier.`,void 0,!0)]},SvgMap:{states:`Cadre SVG recevant les tracés et points fournis par l’application.`,rows:[l(`children`,`ReactNode`,`Tracés et annotations SVG.`)]}},d=e(),f=[{value:`design`,label:`Design system`},{value:`code`,label:`Code`},{value:`docs`,label:`Documentation`}],p=[{id:`overview`,label:`Vue d’ensemble`},{id:`activity`,label:`Activité`},{id:`settings`,label:`Réglages`}],m=`opale-demo-cookie-consent`,h=`data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 360%22%3E%3Crect width=%22640%22 height=%22360%22 fill=%22%23dce7fb%22/%3E%3Ccircle cx=%22180%22 cy=%22155%22 r=%2275%22 fill=%22%233d66aa%22/%3E%3Cpath d=%22M40 320 245 120l95 105 80-70 180 165Z%22 fill=%22%23f8b31a%22 opacity=%22.85%22/%3E%3C/svg%3E`,g=[`neutral`,`success`,`warning`,`error`,`info`],_=[`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`],v={neutral:`Modifications enregistrées`,success:`Étape publiée sur le carnet`,warning:`La carte n’a pas été régénérée`,error:`Publication refusée : titre manquant`,info:`Une nouvelle version est disponible`};function y({children:e}){return(0,d.jsx)(`div`,{className:`tc-doc-opale-preview__row`,children:e})}function b({children:e}){return(0,d.jsx)(`div`,{className:`tc-doc-opale-demo`,children:e})}var x=4,S=240,C=72;function w(e){let[t,n]=(0,c.useState)(C);return(0,c.useEffect)(()=>{if(!e||window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches)return;let t=window.setInterval(()=>{n(e=>e>=100?0:Math.min(100,e+x))},S);return()=>window.clearInterval(t)},[e]),t}function T({name:e,liquidGlass:t,playground:n}){let[a,o]=(0,c.useState)(`Prêt`),[s,l]=(0,c.useState)(`Opale`),[u,x]=(0,c.useState)(`design`),[S,C]=(0,c.useState)([`design`,`docs`]),[T,E]=(0,c.useState)(64),[D,O]=(0,c.useState)(!0),[k,A]=(0,c.useState)(`success`),[j,M]=(0,c.useState)(`bottom-right`),[N,P]=(0,c.useState)(!1),[F,I]=(0,c.useState)(!1),[L,R]=(0,c.useState)(!1),[z,B]=(0,c.useState)(0),[V,H]=(0,c.useState)(!1),[U,W]=(0,c.useState)(`overview`),[G,K]=(0,c.useState)(!1),[q,J]=(0,c.useState)(2),[Y,X]=(0,c.useState)(3),Z=w(e===`ProgressBar`),Q;switch(e){case`Button`:Q=(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)(y,{children:[(0,d.jsx)(i.Button,{liquidGlass:t,children:`Primaire`}),(0,d.jsx)(i.Button,{liquidGlass:t,variant:`secondary`,children:`Secondaire`}),(0,d.jsx)(i.Button,{liquidGlass:t,variant:`accent`,children:`Accent`}),(0,d.jsx)(i.Button,{liquidGlass:t,variant:`danger`,children:`Danger`})]}),n&&(0,d.jsx)(`div`,{className:`tc-doc-opale-playground__result`,children:(0,d.jsx)(i.Button,{liquidGlass:t,variant:n.buttonVariant,size:n.buttonSize,loading:n.buttonLoading,children:`Essai configuré`})})]});break;case`Pressable`:Q=(0,d.jsxs)(i.Pressable,{liquidGlass:t,onClick:()=>o(`Surface activée`),children:[`Surface pressable · `,a]});break;case`InlineInput`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.InlineInput,{liquidGlass:t,label:`Nom du projet`,helperText:`Entrée valide, Échap rétablit.`,value:s,onChange:e=>l(e.currentTarget.value),onCommit:e=>o(`Validé : ${e}`),onCancel:e=>{l(e),o(`Modification abandonnée`)}}),(0,d.jsx)(`span`,{role:`status`,children:a})]});break;case`Input`:Q=(0,d.jsx)(i.Input,{liquidGlass:t,label:`Email`,placeholder:`thomas@crn-studio.com`,helperText:`Une adresse valide est requise.`,error:n?.inputError?`Adresse invalide`:void 0,disabled:n?.inputDisabled});break;case`Checkbox`:Q=(0,d.jsx)(i.Checkbox,{liquidGlass:t,label:`Recevoir les notifications`,description:`Les nouveautés du design system.`,defaultChecked:!0});break;case`Toggle`:Q=(0,d.jsx)(i.Toggle,{liquidGlass:t,label:`Notifications activées`,defaultChecked:!0});break;case`Slider`:Q=(0,d.jsx)(i.Slider,{liquidGlass:t,label:`Volume`,value:T,valueLabel:`${T} %`,min:0,max:100,onChange:e=>E(Number(e.currentTarget.value))});break;case`MultiSelect`:Q=(0,d.jsx)(i.MultiSelect,{liquidGlass:t,label:`Domaines`,values:S,options:f,onChange:e=>C(Array.from(e.currentTarget.selectedOptions,e=>e.value))});break;case`Select`:Q=(0,d.jsx)(i.Select,{liquidGlass:t,label:`Domaine`,value:u,options:f,onChange:e=>x(e.currentTarget.value)});break;case`Autocomplete`:Q=(0,d.jsx)(i.Autocomplete,{liquidGlass:t,label:`Composant`,placeholder:`Commencez à saisir…`,options:[`Button`,`Card`,`Modal`,`Select`]});break;case`Form`:Q=(0,d.jsxs)(i.Form,{onSubmit:e=>{e.preventDefault(),o(`Formulaire envoyé`)},children:[(0,d.jsx)(i.Input,{label:`Projet`,defaultValue:`Opale UI`}),(0,d.jsx)(i.Button,{type:`submit`,children:`Envoyer`}),(0,d.jsx)(`span`,{role:`status`,children:a})]});break;case`SegmentedControl`:Q=(0,d.jsx)(i.SegmentedControl,{liquidGlass:t,options:f,value:u,onChange:x});break;case`IconActionButton`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.IconActionButton,{liquidGlass:t,icon:`share`,label:`Partager`,onClick:()=>o(`Lien partagé`)}),(0,d.jsx)(`span`,{role:`status`,children:a})]});break;case`Card`:Q=(0,d.jsx)(i.Card,{liquidGlass:t,title:`Une surface Opale`,subtitle:`Carte, actions et élévation.`,actions:(0,d.jsx)(i.Badge,{children:`Stable`}),children:(0,d.jsx)(`p`,{children:`Une surface claire, lisible et responsive.`})});break;case`CardGrid`:Q=(0,d.jsxs)(i.CardGrid,{children:[(0,d.jsx)(i.StatCard,{liquidGlass:t,label:`Composants`,value:String(r.length),delta:`Catalogue complet`}),(0,d.jsx)(i.StatCard,{liquidGlass:t,label:`Thèmes`,value:`3`,delta:`Clair, sombre, verre`})]});break;case`DataTable`:Q=(0,d.jsx)(i.DataTable,{liquidGlass:t,caption:`Composants`,columns:[{key:`name`,label:`Nom`,sortable:!0},{key:`uses`,label:`Usages`,sortable:!0},{key:`status`,label:`Statut`}],rowKey:e=>String(e.name),loading:n?.tableMode===`loading`,rows:n?.tableMode===`empty`?[]:[{name:`DataTable`,uses:4,status:`Nouveau`},{name:`Button`,uses:128,status:`Stable`},{name:`Autocomplete`,uses:17,status:`Stable`}]});break;case`DescriptionList`:Q=(0,d.jsx)(i.DescriptionList,{items:[{term:`Version`,description:`3.2.0`},{term:`Licence`,description:`MIT`},{term:`React`,description:`≥ 19`}]});break;case`BulletList`:Q=(0,d.jsx)(i.BulletList,{items:[`Accessible au clavier`,`TypeScript strict`,`Thèmes clair et sombre`]});break;case`Badge`:Q=(0,d.jsxs)(y,{children:[(0,d.jsx)(i.Badge,{liquidGlass:t,children:`Stable`}),(0,d.jsx)(i.Badge,{liquidGlass:t,tone:`accent`,children:`Nouveau`}),(0,d.jsx)(i.Badge,{liquidGlass:t,tone:`danger`,children:`Critique`}),(0,d.jsx)(i.Badge,{liquidGlass:t,tone:`danger`,dot:!0,children:`3 messages non lus`})]});break;case`RatingInput`:Q=(0,d.jsx)(i.RatingInput,{label:`Qualité de l’expérience`,value:Y,onChange:X});break;case`Pagination`:Q=(0,d.jsx)(i.Pagination,{page:q,pageCount:8,onChange:J});break;case`Skeleton`:Q=(0,d.jsxs)(`div`,{role:`status`,"aria-label":`Chargement de la fiche`,className:`tc-doc-opale-demo`,children:[(0,d.jsx)(i.Skeleton,{width:`45%`,height:`1.5rem`}),(0,d.jsx)(i.Skeleton,{height:`5rem`}),(0,d.jsx)(i.Skeleton,{width:`70%`})]});break;case`Rating`:Q=(0,d.jsx)(i.Rating,{value:4.75,max:5});break;case`StatCard`:Q=(0,d.jsx)(i.StatCard,{liquidGlass:t,label:`Disponibilité`,value:`99,9 %`,delta:`+0,4 %`});break;case`Donut`:Q=(0,d.jsx)(i.Donut,{value:72,label:`72 %`});break;case`LegalLinks`:Q=(0,d.jsx)(i.LegalLinks,{links:[{id:`installation`,label:`Installation`,href:`#/installation`},{id:`accessibility`,label:`Accessibilité`,href:`#/accessibilite`}]});break;case`Heading`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.Heading,{level:2,children:`Titre de section`}),(0,d.jsx)(i.Heading,{level:3,children:`Sous-section`})]});break;case`Text`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.Text,{children:`Corps de texte lisible.`}),(0,d.jsx)(i.Text,{variant:`caption`,children:`Légende secondaire`}),(0,d.jsx)(i.Text,{variant:`metric`,children:`2 328`})]});break;case`Icon`:Q=(0,d.jsxs)(y,{children:[(0,d.jsx)(i.Icon,{name:`compass`,label:`Boussole`}),(0,d.jsx)(i.Icon,{name:`map-pin`,label:`Point sur la carte`}),(0,d.jsx)(i.Icon,{name:`luggage`,label:`Bagage`}),(0,d.jsx)(i.Icon,{name:`bell`,label:`Notifications`}),(0,d.jsx)(i.Icon,{name:`✦`,label:`Étincelle`})]});break;case`Feedback`:Q=(0,d.jsx)(i.Feedback,{liquidGlass:t,severity:`success`,title:`En production`,children:`La dernière version est disponible.`});break;case`Toast`:Q=(0,d.jsxs)(b,{children:[(0,d.jsxs)(`div`,{className:`tc-doc-opale-preview__row`,children:[(0,d.jsx)(i.Select,{label:`Ton`,value:k,onChange:e=>A(e.currentTarget.value),options:g.map(e=>({value:e,label:e}))}),(0,d.jsx)(i.Select,{label:`Place à l’écran`,value:j,onChange:e=>M(e.currentTarget.value),options:_.map(e=>({value:e,label:e}))})]}),(0,d.jsx)(`code`,{className:`tc-doc-inline-code`,children:`<Opale.Toast tone="${k}" position="${j}" message="…" />`}),(0,d.jsx)(i.Button,{size:`small`,onClick:()=>O(!0),children:`Afficher le toast`}),(0,d.jsxs)(`p`,{className:`tc-doc-prose`,children:[`Six places : `,(0,d.jsx)(`code`,{children:`top-left`}),`, `,(0,d.jsx)(`code`,{children:`top-center`}),`, `,(0,d.jsx)(`code`,{children:`top-right`}),`,`,` `,(0,d.jsx)(`code`,{children:`bottom-left`}),`, `,(0,d.jsx)(`code`,{children:`bottom-center`}),`, `,(0,d.jsx)(`code`,{children:`bottom-right`}),`. Elles sont relatives à la `,(0,d.jsx)(`strong`,{children:`fenêtre`}),` et non au bloc qui appelle le composant : le message est rendu dans un portail, donc il sort de ce cadre et va se poser dans le coin demandé. Cinq tons : `,(0,d.jsx)(`code`,{children:`neutral`}),` (sans couleur), `,(0,d.jsx)(`code`,{children:`success`}),`,`,` `,(0,d.jsx)(`code`,{children:`warning`}),`, `,(0,d.jsx)(`code`,{children:`error`}),` et `,(0,d.jsx)(`code`,{children:`info`}),` ; `,(0,d.jsx)(`code`,{children:`error`}),` et`,` `,(0,d.jsx)(`code`,{children:`warning`}),` sont annoncés de façon assertive, les autres poliment, et chacun porte une icône pour que la couleur ne soit pas le seul signal.`]}),(0,d.jsxs)(`p`,{className:`tc-doc-prose`,children:[(0,d.jsx)(`strong`,{children:`Plusieurs messages à la même place s’empilent`}),` dans une ancre partagée, et l’ordre de tabulation suit l’écran : un message posé en haut vient avant la page, un message posé en bas après elle. Minuter et congédier une file reste le travail de`,` `,(0,d.jsx)(`code`,{children:`ToastProvider`}),`.`]}),(0,d.jsx)(i.Toast,{open:D,liquidGlass:t,tone:k,position:j,message:v[k],onClose:()=>O(!1)})]});break;case`Spinner`:Q=(0,d.jsx)(i.Spinner,{label:`Chargement des composants`});break;case`ProgressBar`:Q=(0,d.jsx)(i.ProgressBar,{liquidGlass:t,label:`Progression`,value:Z});break;case`ConfirmDialog`:Q=(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.Button,{onClick:()=>P(!0),children:`Supprimer le fichier`}),(0,d.jsx)(i.ConfirmDialog,{open:N,liquidGlass:t,title:`Supprimer le fichier ?`,onCancel:()=>P(!1),onConfirm:()=>{P(!1),o(`Fichier supprimé`)},children:`Cette action est irréversible.`})]});break;case`EmptyState`:Q=(0,d.jsx)(i.EmptyState,{liquidGlass:t,title:`Aucun projet`,description:`Créez votre premier projet Opale.`,action:(0,d.jsx)(i.Button,{children:`Créer un projet`})});break;case`Navbar`:Q=(0,d.jsx)(i.Navbar,{liquidGlass:t,items:p,activeId:U,onSelect:W});break;case`Menu`:Q=(0,d.jsx)(i.Menu,{liquidGlass:t,label:`Actions`,items:[{id:`duplicate`,label:`Dupliquer`},{id:`archive`,label:`Archiver`}]});break;case`Link`:Q=(0,d.jsx)(i.Link,{href:`#/installation`,children:`Lire le guide d’installation →`});break;case`SidePanel`:Q=(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.Button,{onClick:()=>I(!0),children:`Ouvrir le panneau`}),(0,d.jsx)(i.SidePanel,{open:F,liquidGlass:t,title:`Réglages`,onClose:()=>I(!1),children:(0,d.jsx)(i.Toggle,{label:`Notifications`,defaultChecked:!0})})]});break;case`CommandPalette`:Q=(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.Button,{onClick:()=>R(!0),children:`Ouvrir la palette`}),(0,d.jsx)(i.CommandPalette,{open:L,liquidGlass:t,value:s,onChange:l,onClose:()=>R(!1),children:(0,d.jsx)(i.Button,{variant:`text`,onClick:()=>R(!1),children:`Fermer`})})]});break;case`Breadcrumb`:Q=(0,d.jsx)(i.Breadcrumb,{items:[{id:`home`,label:`Accueil`,href:`#/`},{id:`components`,label:`Composants`,href:`#/composants/opale-button`},{id:`button`,label:`Button`}]});break;case`CookieBanner`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.Button,{size:`small`,onClick:()=>{try{window.localStorage.removeItem(m)}catch{}B(e=>e+1)},children:`Réafficher`}),(0,d.jsx)(i.CookieBanner,{storageKey:m,liquidGlass:t,onAccept:()=>o(`Cookies acceptés — choix mémorisé`),onDecline:()=>o(`Cookies refusés — choix mémorisé`)},z),(0,d.jsx)(`span`,{role:`status`,children:a})]});break;case`SelectionBar`:Q=(0,d.jsx)(i.SelectionBar,{liquidGlass:t,selectedCount:3,children:(0,d.jsx)(i.Button,{size:`small`,variant:`danger`,children:`Supprimer`})});break;case`Stack`:Q=(0,d.jsxs)(i.Stack,{direction:`row`,wrap:!0,children:[(0,d.jsx)(i.Badge,{children:`Design`}),(0,d.jsx)(i.Badge,{children:`Code`}),(0,d.jsx)(i.Badge,{children:`Documentation`})]});break;case`Layout`:Q=(0,d.jsxs)(i.Layout,{className:`tc-doc-opale-demo__layout`,navigation:(0,d.jsx)(i.Navbar,{items:p.slice(0,2),activeId:`overview`}),children:[(0,d.jsx)(i.Heading,{level:3,children:`Contenu principal`}),(0,d.jsx)(i.Text,{children:`Une grille navigation-contenu responsive.`})]});break;case`Divider`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(`span`,{children:`Avant le séparateur`}),(0,d.jsx)(i.Divider,{}),(0,d.jsx)(`span`,{children:`Après le séparateur`})]});break;case`BackgroundSurface`:Q=(0,d.jsx)(i.BackgroundSurface,{className:`tc-doc-opale-demo__background`,children:(0,d.jsx)(i.Card,{title:`Fond animé`,children:`Contenu au premier plan`})});break;case`FileCard`:Q=(0,d.jsx)(i.FileCard,{liquidGlass:t,name:`design-system.fig`,size:`2,4 Mo`,selected:G,onClick:()=>K(e=>!e)});break;case`Dropzone`:Q=(0,d.jsxs)(b,{children:[(0,d.jsx)(i.Dropzone,{liquidGlass:t,accept:`image/*`,maxFiles:3,maxSizeBytes:5e6,onFiles:e=>o(`${e.length} fichier${e.length>1?`s`:``} reçu${e.length>1?`s`:``}`),children:`Déposez les maquettes ici`}),(0,d.jsx)(`span`,{role:`status`,children:a})]});break;case`Lightbox`:Q=(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.Button,{onClick:()=>H(!0),children:`Voir l’image`}),(0,d.jsx)(i.Lightbox,{liquidGlass:t,src:h,alt:`Aperçu abstrait Opale`,open:V,onClose:()=>H(!1)})]});break;case`Clipboard`:Q=(0,d.jsx)(i.Clipboard,{liquidGlass:t,value:`npm install @thomascaron/opale-ui`,children:`Copier la commande`});break;case`SvgMap`:Q=(0,d.jsx)(i.SvgMap,{liquidGlass:t,children:(0,d.jsx)(`circle`,{cx:`205`,cy:`75`,r:`12`,fill:`currentColor`,children:(0,d.jsx)(`title`,{children:`Étape active`})})});break;default:Q=(0,d.jsxs)(i.Feedback,{severity:`error`,title:`Démonstration manquante`,children:[`Le composant `,e,` n’a pas encore de spécimen.`]})}return(0,d.jsx)(`div`,{className:`tc-doc-opale-preview__material`,"data-liquid-glass":t?`true`:void 0,"data-preview-component":e,children:Q})}var E=`Autocomplete.Badge.Button.Card.CardGrid.Checkbox.Clipboard.CommandPalette.ConfirmDialog.CookieBanner.DataTable.Dropzone.EmptyState.Feedback.FileCard.IconActionButton.InlineInput.Input.Lightbox.Menu.MultiSelect.Navbar.Pressable.ProgressBar.SegmentedControl.Select.SelectionBar.SidePanel.Slider.StatCard.SvgMap.Toast.Toggle`.split(`.`);function D(e,t){let r=t===`CardGrid`?`StatCard`:n(t),i=[...e.matchAll(RegExp(`<Opale\\.${r}(?=[\\s/>])`,`g`))],a=[];for(let t of i){let n=t.index,r=0,i=null;for(let o=n+t[0].length;o<e.length;o+=1){let t=e[o];if(i){if(t===`\\`){o+=1;continue}t===i&&(i=null)}else if(t===`"`||t===`'`||t==="`")i=t;else if(t===`{`)r+=1;else if(t===`}`)--r;else if(t===`>`&&r===0){let t=e.slice(n,o);/\bliquidGlass\b/.test(t)||a.push(e[o-1]===`/`?o-1:o);break}}}return a.reverse().reduce((e,t)=>`${e.slice(0,t)} liquidGlass${e.slice(t)}`,e)}var O={Pressable:`<Opale.Pressable onClick={() => alert("Action")}>Ouvrir</Opale.Pressable>`,MultiSelect:`<Opale.MultiSelect
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
      onClose={() => setOpen(false)}>
      <Opale.Button variant="text" onClick={() => setOpen(false)}>
        Fermer
      </Opale.Button>
    </Opale.CommandPalette>
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
</div>`,SvgMap:`<Opale.SvgMap>
  <circle cx="205" cy="75" r="12" fill="currentColor">
    <title>Étape active</title>
  </circle>
</Opale.SvgMap>`};function k(e,t=!1){let i=n(e),a=n=>t&&E.includes(e)?D(n,e):n;switch(e){case`Button`:return a(`<Opale.Button variant="primary">Primaire</Opale.Button>
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
  <Opale.StatCard label="Composants" value="${r.length}" delta="Catalogue Opale" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`);case`Badge`:return a(`<Opale.Badge tone="accent">Nouveau</Opale.Badge>
// dot : un point de notification ; le texte reste lu par les lecteurs d'écran.
<Opale.Badge tone="danger" dot>3 messages non lus</Opale.Badge>`);case`StatCard`:return a(`<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />`);case`Heading`:return a(`<Opale.Heading level={2}>Titre de section</Opale.Heading>`);case`Text`:return a(`<Opale.Text variant="caption">Légende secondaire</Opale.Text>`);case`DataTable`:return a(`// sortable : l'en-tête devient un bouton de tri.
// sortValue : la valeur de tri quand la cellule n'est pas du texte.
<Opale.DataTable
  caption="Composants"
  columns={[
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'uses', label: 'Usages', sortable: true },
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
/>`);default:if(!O[e])throw Error(`Exemple manquant pour ${i}`);return a(O[e])}}function A({entry:e}){let r=n(e.name),s=E.includes(e.name),[l,f]=(0,c.useState)(!1),[p,m]=(0,c.useState)(`primary`),[h,g]=(0,c.useState)(`medium`),[_,v]=(0,c.useState)(!1),[y,b]=(0,c.useState)(!1),[x,S]=(0,c.useState)(!1),[C,w]=(0,c.useState)(`filled`),D={buttonVariant:p,buttonSize:h,buttonLoading:_,inputError:y,inputDisabled:x,tableMode:C},O=k(e.name,l),A=e.name===`Button`?`${O}\n\n// Essai configuré\n<Opale.Button variant="${p}" size="${h}"${_?` loading`:``}${l?` liquidGlass`:``}>Essai configuré</Opale.Button>`:e.name===`Input`?`<Opale.Input label="Email" placeholder="thomas@crn-studio.com" helperText="Une adresse valide est requise."${y?` error="Adresse invalide"`:``}${x?` disabled`:``}${l?` liquidGlass`:``} />`:e.name===`DataTable`?`const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'uses', label: 'Usages', sortable: true },
  { key: 'status', label: 'Statut' },
];
const rows = [
  { name: 'DataTable', uses: 4, status: 'Nouveau' },
  { name: 'Button', uses: 128, status: 'Stable' },
  { name: 'Autocomplete', uses: 17, status: 'Stable' },
];
<Opale.DataTable
  caption="Composants"
  columns={columns}
  rowKey={(row) => String(row.name)}
  rows={${C===`empty`?`[]`:`rows`}}${C===`loading`?`
  loading`:``}${l?`
  liquidGlass`:``}
/>`:O,j=u[e.name];if(!j)throw Error(`API manquante pour ${e.name}`);return(0,d.jsxs)(`div`,{className:`tc-doc-opale-page`,children:[(0,d.jsx)(`p`,{className:`tc-doc-lede`,children:e.description}),(0,d.jsxs)(`div`,{className:`tc-doc-opale-meta`,children:[(0,d.jsx)(i.Badge,{children:e.category===`Inputs`?`Saisie`:e.category===`Feedback`?`Retours`:e.category}),(0,d.jsx)(`span`,{children:`Composant Opale · TypeScript strict`})]}),(0,d.jsxs)(`section`,{className:`tc-doc-specimen tc-doc-specimen--opale`,"aria-label":`Démonstration ${r}`,children:[(0,d.jsx)(`div`,{className:`tc-doc-specimen__header`,children:(0,d.jsx)(`h2`,{children:`Aperçu interactif`})}),s&&(0,d.jsxs)(`div`,{className:`tc-doc-opale-material-toggle`,children:[(0,d.jsxs)(`div`,{className:`tc-doc-opale-material-toggle__text`,children:[(0,d.jsx)(`strong`,{children:`Rendu Liquid Glass`}),(0,d.jsx)(`span`,{children:`Appliquer le matériau uniquement à ce composant.`})]}),(0,d.jsx)(i.Toggle,{label:`Liquid Glass pour ${r}`,checked:l,onChange:e=>f(e.currentTarget.checked)})]}),(e.name===`Button`||e.name===`Input`||e.name===`DataTable`)&&(0,d.jsxs)(`fieldset`,{className:`tc-doc-opale-playground`,"aria-label":`Réglages de ${r}`,children:[(0,d.jsx)(`legend`,{children:`Essayer les états`}),e.name===`Button`&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)(`label`,{children:[`Variante`,` `,(0,d.jsxs)(`select`,{value:p,onChange:e=>m(e.currentTarget.value),children:[(0,d.jsx)(`option`,{value:`primary`,children:`Primaire`}),(0,d.jsx)(`option`,{value:`secondary`,children:`Secondaire`}),(0,d.jsx)(`option`,{value:`accent`,children:`Accent`}),(0,d.jsx)(`option`,{value:`danger`,children:`Danger`})]})]}),(0,d.jsxs)(`label`,{children:[`Taille`,` `,(0,d.jsxs)(`select`,{value:h,onChange:e=>g(e.currentTarget.value),children:[(0,d.jsx)(`option`,{value:`small`,children:`Petite`}),(0,d.jsx)(`option`,{value:`medium`,children:`Moyenne`}),(0,d.jsx)(`option`,{value:`large`,children:`Grande`})]})]}),(0,d.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Chargement`,checked:_,onChange:e=>v(e.currentTarget.checked)})]}),e.name===`Input`&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Erreur`,checked:y,onChange:e=>b(e.currentTarget.checked)}),(0,d.jsx)(i.Checkbox,{className:`tc-doc-opale-playground__check`,label:`Désactivé`,checked:x,onChange:e=>S(e.currentTarget.checked)})]}),e.name===`DataTable`&&(0,d.jsxs)(`label`,{children:[`État`,` `,(0,d.jsxs)(`select`,{value:C,onChange:e=>w(e.currentTarget.value),children:[(0,d.jsx)(`option`,{value:`filled`,children:`Avec données`}),(0,d.jsx)(`option`,{value:`empty`,children:`Vide`}),(0,d.jsx)(`option`,{value:`loading`,children:`Chargement`})]})]})]}),(0,d.jsx)(`div`,{className:`tc-doc-opale-preview`,"data-liquid-glass":l?`true`:void 0,children:(0,d.jsx)(T,{name:e.name,liquidGlass:l,playground:D})}),(0,d.jsx)(o,{label:`Exemple ${r}`,code:`import { Opale } from '@thomascaron/opale-ui';\n\n${A}`})]}),(0,d.jsx)(t,{id:a(e.name).replace(`/`,`-`),title:`API et états`,note:j.states,rows:[...j.rows,...s?[{name:`liquidGlass`,type:`boolean`,defaultValue:`false`,description:`Active le matériau en verre.`}]:[]]})]})}export{A as ComponentPage};